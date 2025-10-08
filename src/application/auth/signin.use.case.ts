import {
    AuthLogContext,
    AuthLogRepository,
    AuthLogStatus,
    AuthLogType,
    Device,
} from "@/domain/auth"
import {
    InvalidCredentialsError,
    InvalidDeviceError,
    InvalidIpAddressError,
    SecurityRiskError,
    TermsNotAcceptedError,
    UserInactiveError,
} from "@/shared/errors/auth.errors"
import { ProcessSignRequest, ProcessSignRequestResponse } from "./process.sign.request"

import { SignStatus } from "@/domain/auth/auth.type"
import {
    IUserRepository,
    TimezoneCode,
    UserMetrics,
    UserPreferences,
    UserPublicProfile,
    UserStatus,
    UserTerm,
} from "@/domain/user"
import { SignType } from "@/infra/models/auth/sign.logs.model"
import { SignRequest } from "@/modules/auth/types"
import { jwtEncoder } from "@/shared"
import { logger } from "@/shared/logger"
import { Timezone, TimezoneCodes } from "circle-text-library"

export interface InputDto {
    username: string
    password: string
    logContext?: AuthLogContext // Para logging
    metadata?: {
        device?: Device
        language?: string
        termsAccepted?: boolean
        ipAddress?: string
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
    user: UserPublicProfile
    preferences: UserPreferences
    metrics: UserMetrics
    status: UserStatus
    terms: UserTerm
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
        const timezone = new Timezone(request.metadata?.timezone as TimezoneCodes)

        if (!request.metadata?.device) {
            throw new InvalidDeviceError(request.metadata?.device as Device)
        }

        if (!request.metadata?.ipAddress) {
            throw new InvalidIpAddressError(request.metadata?.ipAddress as string)
        }

        // ✅ Validar se os termos de uso foram aceitos
        if (!request.metadata?.termsAccepted) {
            // Log tentativa falhada - termos não aceitos
            if (this.authLogRepository && request.logContext) {
                await this.authLogRepository.create({
                    username: request.username,
                    ipAddress: request.logContext.ip || "unknown",
                    userAgent: request.logContext.userAgent || "unknown",
                    type: AuthLogType.SIGNIN,
                    status: AuthLogStatus.FAILED,
                    failureReason: "Terms of use not accepted",
                    deviceType: request.metadata?.device,
                    deviceId: request.metadata?.machineId || "unknown",
                    deviceTimezone: request.metadata?.timezone || "UTC",
                })
            }
            throw new TermsNotAcceptedError()
        }

        // Processar solicitação com gerenciamento de risco de segurança
        let securityResult: ProcessSignRequestResponse | null = null
        if (this.processSignRequest && request.logContext) {
            const signRequest: SignRequest = {
                username: request.username,
                password: request.password,
                signType: SignType.SIGNIN,
                ipAddress: request.metadata?.ipAddress || "unknown",
                machineId: request.metadata?.machineId || "unknown",
                userAgent: request.metadata?.userAgent || "unknown",
                timezone: request.metadata?.timezone || "UTC",
                latitude: request.metadata?.latitude || 0,
                longitude: request.metadata?.longitude || 0,
                termsAccepted: request.metadata?.termsAccepted || false, // ✅ Usar o valor real
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
                logger.warn(
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
                    deviceType: request.metadata?.device,
                    deviceId: request.metadata?.machineId || "unknown",
                    deviceTimezone: request.metadata?.timezone || "UTC",
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
                    deviceType: request.metadata?.device,
                    deviceId: request.metadata?.machineId || "unknown",
                    deviceTimezone: request.metadata?.timezone || "UTC",
                })
            }
            throw new InvalidCredentialsError()
        }

        if (!user.canSign()) {
            if (this.authLogRepository && request.logContext) {
                await this.authLogRepository.create({
                    username: request.username,
                    ipAddress: request.logContext.ip || "unknown",
                    userAgent: request.logContext.userAgent || "unknown",
                    type: AuthLogType.SIGNIN,
                    status: AuthLogStatus.FAILED,
                    failureReason: "User authorized to sign",
                    deviceType: request.metadata?.device,
                    deviceId: request.metadata?.machineId || "unknown",
                    deviceTimezone: request.metadata?.timezone || "UTC",
                })
            }
            throw new UserInactiveError(user.id)
        }

        // ✅ Atualizar timezone do usuário se for diferente atual
        if (request.metadata?.timezone && user.preferences) {
            const timezoneOffset = timezone.getTimezoneOffset()
            const currentTimezone = user.preferences.appTimezone

            // Apenas atualizar se mudou
            if (currentTimezone !== timezoneOffset) {
                user.updatePreferences({
                    ...user.preferences,
                    appTimezone: timezoneOffset,
                    timezoneCode: timezone.getCurrentTimezoneCode() as unknown as TimezoneCode,
                    updatedAt: new Date(),
                })
            }
        }

        if (request.metadata?.language && user.preferences) {
            if (user.preferences.appLanguage !== request.metadata?.language) {
                user.updatePreferences({
                    ...user.preferences,
                    appLanguage: request.metadata?.language,
                    translationLanguage: request.metadata?.language,
                    updatedAt: new Date(),
                })
            }
        }

        // Registrar login do usuário - atualizar propriedades
        user.recordLogin({
            device: request.metadata?.device,
            ipAddress: request.logContext?.ip,
            userAgent: request.logContext?.userAgent,
        })

        // Gerar token
        const token = await jwtEncoder({
            userId: user.id,
            device: request.metadata?.device as Device,
            role: user.role,
        })

        const expiresIn = Number(process.env.JWT_EXPIRES) || 3600 // 1 hora

        Promise.all([
            await this.userRepository.update(user),
            await this.registerSuccessfulSignIn(request),
        ])

        // Retornar resposta sem a senha
        return {
            token,
            expiresIn,
            user: user.getPublicProfile() as UserPublicProfile,
            metrics: user.metrics as UserMetrics,
            status: user.status as UserStatus,
            terms: user.terms as UserTerm,
            preferences: user.preferences as UserPreferences,
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

    private async registerSuccessfulSignIn(request: InputDto) {
        if (this.authLogRepository && request.logContext) {
            await this.authLogRepository.create({
                username: request.username,
                ipAddress: request.logContext.ip || "unknown",
                userAgent: request.logContext.userAgent || "unknown",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.SUCCESS,
                failureReason: "",
                deviceType: request.metadata?.device as Device,
                deviceId: request.metadata?.machineId || "unknown",
                deviceTimezone: request.metadata?.timezone || "UTC",
            })
        }
    }
}
