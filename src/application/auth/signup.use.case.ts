import { AuthLogRepository, AuthLogStatus, AuthLogType, Device } from "@/domain/auth"
import { IUserRepository, User, validatePassword } from "@/domain/user"
import { jwtEncoder, parseTimezone } from "@/shared"
import {
    AccessDeniedError,
    InvalidCredentialsError,
    SecurityRiskError,
    UserAlreadyExistsError,
} from "@/shared/errors/auth.errors"
import { ProcessSignRequest, ProcessSignRequestResponse } from "./process.sign.request"

import { SignStatus } from "@/domain/auth/auth.type"
import { UserMetrics } from "@/domain/user/entities/user.metrics.entity"
import { SignType } from "@/infra/models/auth/sign.logs.model"
import { SignRequest } from "@/modules/auth/types"
import { circleTextLibrary } from "@/shared/circle.text.library"

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
        try {
            // Validar entrada
            await this.validateInput(request)

            const [securityResult, userExists] = await Promise.all([
                this.processSecurityRisk(request),
                this.userRepository.existsByUsername(request.username),
            ])

            if (userExists) {
                // Log tentativa de registro com username existente
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
                        deviceTimezone: request.metadata.timezone || "UTC",
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
                // Foto de perfil vazia
                profilePicture: {
                    tinyResolution: null,
                    fullhdResolution: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                // Status ativo
                status: {
                    accessLevel: "user" as any, // Level.USER
                    verified: false,
                    deleted: false,
                    blocked: false,
                    muted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                // Métricas inicializadas - será criada usando UserMetrics.create()
                metrics: undefined, // Será criada após salvar o usuário
                // Embedding vazio
                embedding: {
                    vector: "",
                    dimension: 0,
                    metadata: {},
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                // Preferências
                preferences: {
                    appLanguage: request.appLanguage || "pt",
                    appTimezone: this.parseTimezone(request.appTimezone),
                    disableAutoplay: false,
                    disableHaptics: false,
                    disableTranslation: false,
                    translationLanguage: request.appLanguage || "pt",
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
                // Termos
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

            // Criar métricas inicializadas após salvar o usuário
            const initialMetrics = UserMetrics.create(savedUser.id)
            savedUser.updateMetrics(initialMetrics)

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
                    deviceTimezone: request.metadata.timezone || "UTC",
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
        } catch (error) {
            // Log erro de registro
            if (this.authLogRepository && request.metadata) {
                await this.authLogRepository.create({
                    username: request.username,
                    ipAddress: request.metadata.ipAddress || "unknown",
                    userAgent: request.metadata.userAgent || "unknown",
                    type: AuthLogType.SIGNUP,
                    status: AuthLogStatus.FAILED,
                    failureReason: error instanceof Error ? error.message : "Unknown error",
                    deviceType: request.device,
                    deviceId: "unknown",
                    deviceTimezone: request.metadata.timezone || "UTC",
                })
            }

            // Re-lançar o erro para que seja tratado pelo controller
            throw error
        }
    }

    private async validateInput(request: SignUpInputDto): Promise<void> {
        // Validar username
        if (!request.username || request.username.trim().length === 0) {
            throw new InvalidCredentialsError("Username é obrigatório")
        }

        if (!this.isValidUsername(request.username)) {
            throw new InvalidCredentialsError("Username inválido")
        }

        // Validar senha
        if (!request.password) {
            throw new InvalidCredentialsError("Senha é obrigatória")
        }

        if (!this.isValidPassword(request.password)) {
            throw new InvalidCredentialsError("Senha inválida")
        }

        // Validar termos
        if (!request.termsAccepted) {
            throw new AccessDeniedError("Você deve aceitar os termos de uso")
        }

        // Validar device
        if (!request.device) {
            throw new InvalidCredentialsError("Informações do dispositivo são obrigatórias")
        }
    }

    private isValidUsername(username: string): boolean {
        try {
            return circleTextLibrary.validate.username(username).isValid
        } catch (error) {
            // Fallback para validação básica se CircleText falhar
            // Validar se é um email válido ou username válido
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            const usernameRegex = /^[a-zA-Z0-9._-]{3,50}$/

            return emailRegex.test(username) || usernameRegex.test(username)
        }
    }

    private isValidPassword(password: string): boolean {
        // Usar as regras permissivas do user.rules.ts
        return validatePassword(password)
    }

    private parseTimezone(timezone?: string): number {
        // Usar o helper para converter timezone
        return parseTimezone(timezone)
    }
}
