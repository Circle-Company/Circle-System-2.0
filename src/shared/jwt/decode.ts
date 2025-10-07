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
        secret: process.env.JWT_SECRET || "giIOw90192Gkdzc463FF4rhgwrdghdftt",
        issuer: process.env.JWT_ISSUER || "circle.company",
        audience: process.env.JWT_AUDIENCE || "circle.company",
    }

    console.log("🔧 JWT Decoder Config:", {
        secret: config.secret.substring(0, 10) + "...",
        issuer: config.issuer,
        audience: config.audience,
    })

    return config
}

export async function jwtDecoder(token: string): Promise<JwtPayload> {
    try {
        console.log("🔍 JWT Decoder - Starting decode process")
        console.log("Token preview:", token.substring(0, 50) + "...")

        const config = getJwtConfig()
        const secret = new TextEncoder().encode(config.secret)

        console.log("🔍 Verifying JWT with config...")
        const { payload } = await jwtVerify(token, secret, {
            issuer: config.issuer,
            audience: config.audience,
            algorithms: ["HS256"],
        })

        console.log("✅ JWT verified successfully")
        console.log("Payload:", {
            sub: payload.sub,
            device: payload.device,
            iat: payload.iat,
            exp: payload.exp,
            iss: payload.iss,
            aud: payload.aud,
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
        console.log("❌ JWT Decode error:", error.message)
        console.log("Error type:", error.constructor.name)

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
