import { ErrorCode, ValidationError } from "@/shared/errors"

import { Device } from "@/domain/auth"
import { jwtVerify } from "jose"

interface JwtConfig {
    secret: string
    issuer: string
    audience: string
}

interface JwtPayload {
    sub: string
    device: Device
    iat?: number
    exp?: number
    iss?: string
    aud?: string
}

function getJwtConfig(): JwtConfig {
    const config = {
        secret: process.env.JWT_SECRET || "default-secret-key",
        issuer: process.env.JWT_ISSUER || "access-controller-api",
        audience: process.env.JWT_AUDIENCE || "access-controller-client",
    }

    if (!config.secret || config.secret === "default-secret-key") {
        throw new ValidationError({
            message: "JWT_SECRET environment variable is required",
            code: ErrorCode.CONFIGURATION_ERROR,
            action: "Set JWT_SECRET environment variable",
            context: {
                additionalData: {
                    missingEnvVar: "JWT_SECRET",
                },
            },
        })
    }

    return config
}

export async function jwtDecoder(token: string): Promise<JwtPayload> {
    try {
        const config = getJwtConfig()
        const secret = new TextEncoder().encode(config.secret)

        const { payload } = await jwtVerify(token, secret, {
            issuer: config.issuer,
            audience: config.audience,
            algorithms: ["HS256"],
        })

        // Validar payload obrigatório
        if (!payload.sub) {
            throw new ValidationError({
                message: "Invalid JWT payload: missing subject",
                code: ErrorCode.INVALID_INPUT,
                action: "Check JWT token format",
                context: {
                    additionalData: {
                        missingField: "sub",
                    },
                },
            })
        }

        return {
            sub: payload.sub as string,
            device: payload.device as Device,
            iat: payload.iat,
            exp: payload.exp,
            iss: payload.iss as string,
            aud: payload.aud as string,
        }
    } catch (error: any) {
        if (error instanceof ValidationError) {
            throw error
        }

        throw new ValidationError({
            message: "Invalid or expired JWT token",
            code: ErrorCode.INVALID_INPUT,
            action: "Provide a valid JWT token",
            context: {
                additionalData: {
                    originalError: error?.message,
                    errorType: error?.constructor?.name,
                },
            },
        })
    }
}
