import { AuthLogRepository, AuthLogStatus, AuthLogType, Device } from "@/domain/auth"
import { IUserRepository, User } from "@/domain/user"
import { SignStatus, SignType } from "@/infra/models/auth/sign.logs.model"
import {
    AccessDeniedError,
    InvalidCredentialsError,
    SecurityRiskError,
    UserAlreadyExistsError,
} from "@/shared/errors/auth.errors"
import { ProcessSignRequest, ProcessSignRequestResponse } from "./process.sign.request"

import { SignRequest } from "@/modules/auth/types"
import { jwtEncoder } from "@/shared"
import { CircleText } from "circle-text-library"

export interface SignUpInputDto {
    username: string
    password: string
    device: Device
    termsAccepted?: boolean
    appLanguage?: string
    appTimezone?: string
    metadata?: {
        ipAddress: string
        userAgent?: string
        machineId?: string
        timezone?: string
        latitude?: number
        longitude?: number
    }
}

export interface SignUpOutputDto {
    token: string
    expiresIn: number
    user: {
        id: string
        username: string
        name: string | null
        role: string
        status: string
        lastLogin?: Date
    }
    securityInfo?: {
        riskLevel: string
        status: string
        message: string
        additionalData?: any
    }
}

export class SignUpUseCase {
    constructor(
        private userRepository: IUserRepository,
        private authLogRepository?: AuthLogRepository,
        private processSignRequest?: ProcessSignRequest,
    ) {}

    private async processSecurityRisk(
        request: SignUpInputDto,
    ): Promise<ProcessSignRequestResponse | null> {
        // Processar solicitação com gerenciamento de risco de segurança
        let securityResult: ProcessSignRequestResponse | null = null
        if (this.processSignRequest && request.metadata) {
            const signRequest: SignRequest = {
                username: request.username,
                password: request.password,
                signType: SignType.SIGNUP,
                ipAddress: request.metadata.ipAddress,
                machineId: request.metadata.machineId || "unknown",
                userAgent: request.metadata.userAgent,
                timezone: request.metadata.timezone || "UTC",
                latitude: request.metadata.latitude || 0,
                longitude: request.metadata.longitude || 0,
                termsAccepted: request.termsAccepted || false,
            }

            await this.processSignRequest.setSignRequest(signRequest)
            securityResult = await this.processSignRequest.process()

            // Verificar se a solicitação foi rejeitada por questões de segurança
            if (securityResult && securityResult.status === SignStatus.REJECTED) {
                throw new SecurityRiskError(
                    securityResult.reason || "Request rejected by security system",
                    securityResult.securityRisk,
                )
            }

            // Verificar se há atividade suspeita que requer atenção
            if (securityResult && securityResult.status === SignStatus.SUSPICIOUS) {
                throw new SecurityRiskError(
                    securityResult.reason || "Request rejected by security system",
                    securityResult.securityRisk,
                )
            }
        }
        return securityResult
    }

    async execute(request: SignUpInputDto): Promise<SignUpOutputDto> {
        // Validar entrada
        await this.validateInput(request)

        const [securityResult, userExists] = await Promise.all([
            this.processSecurityRisk(request),
            this.userRepository.existsByUsername(request.username),
        ])

        if (userExists) {
            // Log tentativa de registro com email existente
            if (this.authLogRepository && request.metadata) {
                await this.authLogRepository.create({
                    username: request.username,
                    ipAddress: request.metadata.ipAddress || "unknown",
                    userAgent: request.metadata.userAgent || "unknown",
                    type: AuthLogType.SIGNUP,
                    status: AuthLogStatus.FAILED,
                    failureReason: "User already exists",
                    deviceType: request.device,
                    deviceId: "unknown",
                    deviceTimezone: "UTC",
                    createdAt: new Date(),
                })
            }
            throw new UserAlreadyExistsError(request.username)
        }

        // Criar novo usuário usando o método estático que encripta a senha automaticamente
        const newUser = await User.create({
            username: request.username,
            name: null,
            searchMatchTerm: `${request.username}`,
            password: request.password,
            description: null,
            preferences: {
                appLanguage: request.appLanguage || "pt",
                appTimezone: -3,
                disableAutoplay: false,
                disableHaptics: false,
                disableTranslation: false,
                translationLanguage: "pt",
                disableLikeMomentPushNotification: false,
                disableNewMemoryPushNotification: false,
                disableAddToMemoryPushNotification: false,
                disableFollowUserPushNotification: false,
                disableViewUserPushNotification: false,
                disableNewsPushNotification: false,
                disableSugestionsPushNotification: false,
                disableAroundYouPushNotification: false,
                defaultMomentVisibility: "public",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            terms: {
                termsAndConditionsAgreed: request.termsAccepted || false,
                termsAndConditionsAgreedVersion: "1.0",
                termsAndConditionsAgreedAt: request.termsAccepted ? new Date() : new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        })

        // Salvar usuário
        const savedUser = await this.userRepository.save(newUser)

        // Registrar primeiro login
        savedUser.recordLogin({
            device: request.device,
            ipAddress: request.metadata?.ipAddress,
            userAgent: request.metadata?.userAgent,
        })

        // Salvar atualizações
        await this.userRepository.update(savedUser)

        // Gerar token
        const token = await jwtEncoder({
            userId: savedUser.id,
            device: request.device as any, // Converter Device do auth para Device do authorization
            role: savedUser.role || "user",
        })
        const expiresIn = 3600 // 1 hora

        // Log registro bem-sucedido
        if (this.authLogRepository && request.metadata) {
            await this.authLogRepository.create({
                username: request.username,
                ipAddress: request.metadata?.ipAddress || "unknown",
                userAgent: request.metadata?.userAgent || "unknown",
                type: AuthLogType.SIGNUP,
                status: AuthLogStatus.SUCCESS,
                failureReason: "Registration successful",
                deviceType: request.device,
                deviceId: "unknown",
                deviceTimezone: "UTC",
                createdAt: new Date(),
            })
        }

        return {
            token,
            expiresIn,
            user: {
                id: savedUser.id,
                username: savedUser.username,
                name: savedUser.name || null,
                role: savedUser.role || "user",
                status: "active",
                lastLogin: new Date(),
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

    private async validateInput(request: SignUpInputDto): Promise<void> {
        if (!request.username || !this.isValidUsername(request.username)) {
            throw new InvalidCredentialsError("Invalid username")
        }

        if (!request.password || request.password.length < 6) {
            throw new InvalidCredentialsError("Password must be at least 6 characters")
        }

        if (!request.termsAccepted) {
            throw new AccessDeniedError("terms", "accept")
        }
    }

    private isValidUsername(username: string): boolean {
        try {
            const circleTextLibrary = new CircleText()
            return circleTextLibrary.validate.username(username)
        } catch (error) {
            // Fallback para validação básica se CircleText falhar
            // Validar se é um email válido ou username válido
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            const usernameRegex = /^[a-zA-Z0-9._-]{3,50}$/

            return emailRegex.test(username) || usernameRegex.test(username)
        }
    }
}
