import { ErrorCode, ValidationError, jwtDecoder, jwtEncoder } from "@/shared"

import { Device } from "@/domain/auth"
import { IUserRepository } from "@/domain/user"

export interface RefreshTokenInputDto {
    token: string
}

export interface RefreshTokenOutputDto {
    token: string
    expiresIn: number
    user: {
        id: string
        username: string
        level: string
    }
}

export class RefreshTokenUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(request: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
        try {
            // Validar que o token foi fornecido
            if (!request.token || request.token.trim().length === 0) {
                throw new ValidationError({
                    message: "Token is required",
                    code: ErrorCode.INVALID_INPUT,
                    action: "Provide a valid token",
                })
            }

            // Decodificar o token (mesmo que expirado, pegamos os dados)
            let payload: any
            try {
                payload = await jwtDecoder(request.token)
            } catch (error) {
                // Se o token expirou, ainda tentamos decodificar manualmente
                // para pegar o userId e gerar um novo token
                try {
                    // Decodificar sem validar expiração usando jose
                    const parts = request.token.split(".")
                    if (parts.length !== 3) {
                        throw new Error("Invalid token format")
                    }

                    // Decodificar o payload (segunda parte)
                    const payloadBase64 = parts[1]
                    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8")
                    payload = JSON.parse(payloadJson)
                } catch (decodeError) {
                    throw new ValidationError({
                        message: "Invalid token format",
                        code: ErrorCode.INVALID_INPUT,
                        action: "Provide a valid JWT token",
                    })
                }
            }

            // Verificar se o payload tem os dados necessários
            if (!payload.sub) {
                throw new ValidationError({
                    message: "Invalid token: missing user ID",
                    code: ErrorCode.INVALID_INPUT,
                    action: "Provide a valid token",
                })
            }

            // Buscar usuário no banco
            const user = await this.userRepository.findById(payload.sub)

            if (!user) {
                throw new ValidationError({
                    message: "User not found",
                    code: ErrorCode.USER_NOT_FOUND,
                    action: "User associated with this token no longer exists",
                })
            }

            // Verificar se o usuário está ativo
            if (user.status?.blocked || user.status?.deleted) {
                throw new ValidationError({
                    message: "User account is blocked or deleted",
                    code: ErrorCode.OPERATION_NOT_ALLOWED,
                    action: "Contact support for more information",
                })
            }

            // Gerar novo token
            const newToken = await jwtEncoder({
                userId: user.id,
                device: (payload.device as Device) || Device.WEB,
                level: user.status?.accessLevel || "user",
            })

            const expiresIn = Number(process.env.JWT_EXPIRES) || 3600 // 1 hora

            return {
                token: newToken,
                expiresIn,
                user: {
                    id: user.id,
                    username: user.username,
                    level: user.status?.accessLevel || "user",
                },
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error
            }

            throw new ValidationError({
                message: "Failed to refresh token",
                code: ErrorCode.INTERNAL_ERROR,
                action: "Try again or login again",
                context: {
                    additionalData: {
                        originalError: error instanceof Error ? error.message : String(error),
                    },
                },
            })
        }
    }
}
