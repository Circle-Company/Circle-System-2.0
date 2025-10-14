import { ErrorCode, NotFoundError, ValidationError } from "@/shared/errors"
import { JWTPayload, SignJWT } from "jose"

import { Device } from "@/domain/authorization/authorization.type"
import UserModel from "@/infra/models/user/user.model"

interface JwtConfig {
    secret: string
    issuer: string
    audience: string
    expiresIn: number
}

interface JwtPayload extends JWTPayload {
    sub: string
    device: Device
    level: string
}

interface JwtEncoderParams {
    userId: string
    device: Device
    level: string
}

let jwtConfig: JwtConfig | null = null

function getJwtConfig(): JwtConfig {
    // Sempre recriar a configuração para evitar cache durante testes
    const config = {
        secret: process.env.JWT_SECRET || "giIOw90192Gkdzc463FF4rhgwrdghdftt",
        issuer: process.env.JWT_ISSUER || "circle.company",
        audience: process.env.JWT_AUDIENCE || "circle.company",
        expiresIn: Number(process.env.JWT_EXPIRES) || 3600, // Default 1 hora
    }

    // Cache apenas em produção
    if (process.env.NODE_ENV === "production" && !jwtConfig) {
        jwtConfig = config
    }

    return config
}

function validateDevice(device: Device): void {
    const validDevices = [Device.WEB, Device.MOBILE]
    if (!validDevices.includes(device)) {
        throw new ValidationError({
            message: `Invalid device type: ${device}`,
            code: ErrorCode.INVALID_INPUT,
            action: "Use valid device types: WEB or MOBILE",
            context: {
                additionalData: {
                    receivedDevice: device,
                    validDevices: validDevices,
                },
            },
        })
    }
}

function createJwtPayload(
    userId: string,
    device: Device,
    level: string,
    config: JwtConfig,
): JwtPayload {
    const now = Math.floor(Date.now() / 1000)

    return {
        sub: userId,
        device,
        level,
        iat: now,
        exp: now + config.expiresIn,
        iss: config.issuer,
        aud: config.audience,
    }
}

/**
 * Encoder JWT profissional e performático
 *
 * @param params - Parâmetros para geração do token
 * @returns Promise<string> - Token JWT assinado
 *
 * @throws {ValidationError} - Quando usuário não encontrado ou dispositivo inválido
 * @throws {Error} - Quando há erro na geração do token
 */
export async function jwtEncoder({ userId, device, level }: JwtEncoderParams): Promise<string> {
    try {
        // Validação prévia do dispositivo (sem I/O)
        validateDevice(device)

        // Obter configurações primeiro (com validação)
        const config = getJwtConfig()

        // Verificação assíncrona do usuário (única consulta ao banco)
        const user = await UserModel.findByPk(userId, {
            attributes: ["id"], // Busca apenas o ID
        })

        if (!user) {
            throw new NotFoundError({
                message: "User not found",
                code: ErrorCode.USER_NOT_FOUND,
                action: "Verify if the user ID is correct and user exists",
                context: {
                    userId,
                    additionalData: {
                        searchedUserId: userId,
                    },
                },
            })
        }

        // Criar payload com level do usuário
        const payload = createJwtPayload(userId, device, level, config)
        const now = Math.floor(Date.now() / 1000)

        // Gerar token com JOSE (mais seguro que jsonwebtoken)
        const secret = new TextEncoder().encode(config.secret)

        const token = await new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(payload.exp || now + config.expiresIn)
            .setIssuer(config.issuer)
            .setAudience(config.audience)
            .sign(secret)

        return token
    } catch (error) {
        // Re-throw erros customizados sem modificação
        if (error instanceof ValidationError || error instanceof NotFoundError) {
            throw error
        }
        throw new ValidationError({
            message: "Failed to generate JWT token",
            code: ErrorCode.INTERNAL_ERROR,
            action: "Check JWT configuration and try again",
            context: {
                userId,
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
