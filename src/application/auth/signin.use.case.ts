import {
    AuthLogContext,
    AuthLogRepository,
    AuthLogStatus,
    AuthLogType,
    Device,
} from "@/domain/auth"
import {
    InvalidCredentialsError,
    SecurityRiskError,
    UserInactiveError,
} from "@/shared/errors/auth.errors"
import { ProcessSignRequest, ProcessSignRequestResponse } from "./process.sign.request"

import { SignStatus } from "@/domain/auth/auth.type"
import { IUserRepository } from "@/domain/user"
import { SignType } from "@/infra/models/auth/sign.logs.model"
import { SignRequest } from "@/modules/auth/types"
import { jwtEncoder } from "@/shared"

export interface InputDto {
    username: string
    password: string
    device: Device
    logContext?: AuthLogContext // Para logging
    securityData?: {
        ipAddress: string
        userAgent?: string
        machineId?: string
        timezone?: string
        latitude?: number
        longitude?: number
    }
}

export interface OutputDto {
    token: string
    expiresIn: number
    user: {
        id: string
        username: string
        name: string | null
        role: string
        status: string
        lastLogin?: Date
        needsPasswordUpdate?: boolean
    }
    securityInfo?: {
        riskLevel: string
        status: string
        message: string
        additionalData?: any
    }
}

export class SignInUseCase {
    constructor(
        private userRepository: IUserRepository,
        private authLogRepository?: AuthLogRepository,
        private processSignRequest?: ProcessSignRequest,
    ) {}

    async execute(request: InputDto): Promise<OutputDto> {
        // Processar solicitação com gerenciamento de risco de segurança
        let securityResult: ProcessSignRequestResponse | null = null
        if (this.processSignRequest && request.securityData) {
            const signRequest: SignRequest = {
                username: request.username,
                password: request.password,
                signType: SignType.SIGNIN,
                ipAddress: request.securityData.ipAddress,
                machineId: request.securityData.machineId || "unknown",
                userAgent: request.securityData.userAgent,
                timezone: request.securityData.timezone || "UTC",
                latitude: request.securityData.latitude || 0,
                longitude: request.securityData.longitude || 0,
                termsAccepted: true, // Para signin, assumimos que já foram aceitos
            }

            await this.processSignRequest.setSignRequest(signRequest)
            securityResult = await this.processSignRequest.process()

            // Verificar se a solicitação foi rejeitada por questões de segurança
            if (securityResult.status === SignStatus.REJECTED) {
                throw new SecurityRiskError(
                    securityResult.reason || "Request rejected by security system",
                    securityResult.securityRisk,
                )
            }

            // Verificar se há atividade suspeita que requer atenção
            if (securityResult.status === SignStatus.SUSPICIOUS) {
                // Para signin, podemos permitir mas com alerta
                // Em um sistema mais rigoroso, poderíamos rejeitar também
                console.warn(
                    `Suspicious signin attempt: ${securityResult.reason}`,
                    securityResult.additionalData,
                )
            }
        }

        // Buscar usuário por username
        const user = await this.userRepository.findByUsername(request.username)
        if (!user) {
            // Log tentativa falhada - usuário não encontrado
            if (this.authLogRepository && request.logContext) {
                await this.authLogRepository.create({
                    username: request.username,
                    ipAddress: request.logContext.ip || "unknown",
                    userAgent: request.logContext.userAgent || "unknown",
                    type: AuthLogType.SIGNIN,
                    status: AuthLogStatus.FAILED,
                    failureReason: "User not found",
                    deviceType: request.device,
                    deviceId: "unknown",
                    deviceTimezone: "UTC",
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
                    username: request.username,
                    ipAddress: request.logContext.ip || "unknown",
                    userAgent: request.logContext.userAgent || "unknown",
                    type: AuthLogType.SIGNIN,
                    status: AuthLogStatus.FAILED,
                    failureReason: "Invalid password",
                    deviceType: request.device,
                    deviceId: "unknown",
                    deviceTimezone: "UTC",
                })
            }
            throw new InvalidCredentialsError()
        }

        if (user.status?.blocked || user.status?.deleted) {
            // Log tentativa falhada - usuário inativo
            if (this.authLogRepository && request.logContext) {
                await this.authLogRepository.create({
                    username: request.username, // Usar email como username temporariamente
                    ipAddress: request.logContext.ip || "unknown",
                    userAgent: request.logContext.userAgent || "unknown",
                    type: AuthLogType.SIGNIN,
                    status: AuthLogStatus.FAILED,
                    failureReason: "User inactive",
                    deviceType: request.device,
                    deviceId: "unknown",
                    deviceTimezone: "UTC",
                })
            }
            throw new UserInactiveError(user.id)
        }

        // Registrar login do usuário - atualizar propriedades
        user.recordLogin({
            device: request.device,
            ipAddress: request.logContext?.ip,
            userAgent: request.logContext?.userAgent,
        })

        // Salvar atualizações do usuário
        const updatedUser = await this.userRepository.update(user)

        // Gerar token
        const token = await jwtEncoder({
            userId: user.id,
            device: request.device as any, // Converter Device do auth para Device do authorization
            role: user.role || "user",
        })
        const expiresIn = 3600 // 1 hora

        // Log login bem-sucedido
        if (this.authLogRepository && request.logContext) {
            await this.authLogRepository.create({
                username: request.username, // Usar email como username temporariamente
                ipAddress: request.logContext.ip || "unknown",
                userAgent: request.logContext.userAgent || "unknown",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.SUCCESS,
                failureReason: "Login successful",
                deviceType: request.device,
                deviceId: "unknown",
                deviceTimezone: "UTC",
            })
        }

        // Retornar resposta sem a senha
        return {
            token,
            expiresIn,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role || "user",
                status: user.status?.blocked
                    ? "blocked"
                    : user.status?.deleted
                    ? "deleted"
                    : "active",
                lastLogin: new Date(),
                needsPasswordUpdate: user.shouldUpdatePassword(),
            },
            securityInfo: securityResult
                ? {
                      riskLevel: securityResult.securityRisk,
                      status: securityResult.status,
                      message: securityResult.message,
                      additionalData: securityResult.additionalData,
                  }
                : undefined,
        }
    }
}
