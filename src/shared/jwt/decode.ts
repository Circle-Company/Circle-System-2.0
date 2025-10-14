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
    level: string
    iat?: number
    exp?: number
    iss?: string
    aud?: string
}

function getJwtConfig(): JwtConfig {
    const config = {
        secret: process.env.JWT_SECRET || "giIOw90192Gkdzc463FF4rhgwrdghdftt",
        issuer: process.env.JWT_ISSUER || "circle.company",
        audience: process.env.JWT_AUDIENCE || "circle.company",
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
            level: payload.level as string,
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
