import {
    AuthLogContext,
    AuthLogRepository,
    AuthLogStatus,
    AuthLogType,
    Device,
} from "@/domain/auth"
import { UserProps, UserRepository, UserStatusEnum } from "@/domain/user"
import { InvalidCredentialsError, UserInactiveError } from "@/shared/errors/auth.errors"

import { jwtEncoder } from "@/shared"

export interface InputDto {
    email: string
    password: string
    device: Device
    logContext?: AuthLogContext // Para logging
}

export interface OutputDto {
    token: string
    expiresIn: number
    user: Omit<UserProps, "password">
}

export class SignInUseCase {
    constructor(
        private userRepository: UserRepository,
        private authLogRepository?: AuthLogRepository,
    ) {}

    async execute(request: InputDto): Promise<OutputDto> {
        // Buscar usuário por email
        const user = await this.userRepository.findByEmail(request.email)
        if (!user) {
            // Log tentativa falhada - usuário não encontrado
            if (this.authLogRepository && request.logContext) {
                await this.authLogRepository.create({
                    email: request.email,
                    ipAddress: request.logContext.ip || "unknown",
                    userAgent: request.logContext.userAgent,
                    type: AuthLogType.SIGNIN,
                    status: AuthLogStatus.FAILED,
                    failureReason: "User not found",
                    deviceType: request.device,
                })
            }
            throw new InvalidCredentialsError()
        }

        // Validar senha
        const isPasswordValid = await user.validatePassword(request.password)
        if (!isPasswordValid) {
            // Log tentativa falhada - senha incorreta
            if (this.authLogRepository && request.logContext) {
                await this.authLogRepository.create({
                    email: request.email,
                    ipAddress: request.logContext.ip || "unknown",
                    userAgent: request.logContext.userAgent,
                    type: AuthLogType.SIGNIN,
                    status: AuthLogStatus.FAILED,
                    failureReason: "Invalid password",
                    deviceType: request.device,
                })
            }
            throw new InvalidCredentialsError()
        }

        if (user.status === UserStatusEnum.INACTIVE) {
            // Log tentativa falhada - usuário inativo
            if (this.authLogRepository && request.logContext) {
                await this.authLogRepository.create({
                    email: request.email,
                    ipAddress: request.logContext.ip || "unknown",
                    userAgent: request.logContext.userAgent,
                    type: AuthLogType.SIGNIN,
                    status: AuthLogStatus.FAILED,
                    failureReason: "User inactive",
                    deviceType: request.device,
                })
            }
            throw new UserInactiveError(user.id)
        }

        // Gerar token
        const token = await jwtEncoder({
            userId: user.id,
            device: request.device,
            role: user.role,
        })
        const expiresIn = 3600 // 1 hora

        // Log login bem-sucedido
        if (this.authLogRepository && request.logContext) {
            await this.authLogRepository.create({
                email: request.email,
                ipAddress: request.logContext.ip || "unknown",
                userAgent: request.logContext.userAgent,
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.SUCCESS,
                deviceType: request.device,
            })
        }

        // Retornar resposta sem a senha
        return {
            token,
            expiresIn,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        }
    }
}
