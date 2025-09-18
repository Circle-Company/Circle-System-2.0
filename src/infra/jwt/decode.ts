import { ErrorCode, ValidationError } from "@/errors"
import { JwtConfig, JwtDecodeResult, JwtPayload } from "./types"

import { Level } from "@/core/access.control/types"
import { jwtVerify } from "jose"

let jwtConfig: JwtConfig | null = null

function getJwtConfig(): JwtConfig {
    // Sempre recriar a configuração para evitar cache durante testes
    const config = {
        secret: process.env.JWT_SECRET!,
        issuer: process.env.JWT_ISSUER!,
        audience: process.env.JWT_AUDIENCE!,
        expiresIn: Number(process.env.JWT_EXPIRES) || 3600, // Default 1 hora
    }

    // Validação das variáveis obrigatórias
    if (!config.secret || !config.issuer || !config.audience) {
        throw new ValidationError({
            message: "JWT configuration is incomplete",
            code: ErrorCode.CONFIGURATION_ERROR,
            action: "Check JWT environment variables (JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE)",
            context: {
                additionalData: {
                    missingVars: [
                        !config.secret && "JWT_SECRET",
                        !config.issuer && "JWT_ISSUER",
                        !config.audience && "JWT_AUDIENCE",
                    ].filter(Boolean),
                },
            },
        })
    }

    // Cache apenas em produção
    if (process.env.NODE_ENV === "production" && !jwtConfig) {
        jwtConfig = config
    }

    return config
}

/**
 * Decoder JWT profissional e performático
 *
 * @param token - Token JWT para decodificar
 * @returns Promise<JwtDecodeResult> - Resultado da decodificação
 *
 * @throws {ValidationError} - Quando configuração JWT está incompleta
 * @throws {ValidationError} - Quando token é inválido ou expirado
 */
export async function jwtDecoder(token: string): Promise<JwtDecodeResult> {
    try {
        // Obter configurações primeiro (com validação)
        const config = getJwtConfig()

        // Verificar se o token foi fornecido
        if (!token || typeof token !== "string") {
            return {
                payload: {} as JwtPayload,
                isValid: false,
                error: "Token is required and must be a string",
            }
        }

        // Gerar secret para verificação
        const secret = new TextEncoder().encode(config.secret)

        // Verificar e decodificar o token
        const { payload } = await jwtVerify(token, secret, {
            issuer: config.issuer,
            audience: config.audience,
        })

        // Validar se o payload contém os campos obrigatórios
        const requiredFields = ["sub", "username", "timezone", "permissionLevel"]
        const missingFields = requiredFields.filter((field) => !payload[field])

        if (missingFields.length > 0) {
            return {
                payload: {} as JwtPayload,
                isValid: false,
                error: `Missing required fields: ${missingFields.join(", ")}`,
            }
        }

        // Validar se permissionLevel é válido
        const validPermissionLevels = Object.values(Level)
        if (!validPermissionLevels.includes(payload.permissionLevel as Level)) {
            return {
                payload: {} as JwtPayload,
                isValid: false,
                error: `Invalid permission level: ${payload.permissionLevel}`,
            }
        }

        return {
            payload: payload as JwtPayload,
            isValid: true,
        }
    } catch (error) {
        // Re-throw erros de configuração sem modificação
        if (error instanceof ValidationError) {
            throw error
        }

        // Tratar erros específicos do JWT
        if (error instanceof Error) {
            if (error.message.includes("expired")) {
                return {
                    payload: {} as JwtPayload,
                    isValid: false,
                    error: "Token has expired",
                }
            }

            if (
                error.message.includes("invalid") ||
                error.message.includes("Invalid Compact JWS")
            ) {
                return {
                    payload: {} as JwtPayload,
                    isValid: false,
                    error: "Invalid token format or signature",
                }
            }

            if (error.message.includes("malformed")) {
                return {
                    payload: {} as JwtPayload,
                    isValid: false,
                    error: "Malformed token",
                }
            }
        }

        // Log e wrap outros erros como SystemError
        console.error("JWT decoding error:", error)
        throw new ValidationError({
            message: "Failed to decode JWT token",
            code: ErrorCode.INTERNAL_ERROR,
            action: "Check JWT configuration and token validity",
            context: {
                additionalData: {
                    originalError: (error as Error)?.message,
                    errorType: (error as Error)?.constructor?.name,
                },
            },
            metadata: {
                severity: "high",
                retryable: true,
                logLevel: "error",
            },
        })
    }
}

/**
 * Função utilitária para verificar se um token é válido sem decodificar completamente
 *
 * @param token - Token JWT para verificar
 * @returns Promise<boolean> - true se o token for válido
 */
export async function isTokenValid(token: string): Promise<boolean> {
    try {
        const result = await jwtDecoder(token)
        return result.isValid
    } catch {
        return false
    }
}

/**
 * Função utilitária para extrair apenas o payload sem validação completa
 * Útil para casos onde você quer apenas ler os dados sem verificar a assinatura
 *
 * @param token - Token JWT para decodificar
 * @returns JwtPayload | null - Payload decodificado ou null se inválido
 */
export function decodeTokenPayload(token: string): JwtPayload | null {
    try {
        if (!token || typeof token !== "string") {
            return null
        }

        const parts = token.split(".")
        if (parts.length !== 3) {
            return null
        }

        // Decodificar apenas o payload (sem verificar assinatura)
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))

        return payload as JwtPayload
    } catch {
        return null
    }
}
