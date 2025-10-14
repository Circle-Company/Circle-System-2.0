import { AuthLogRepository, AuthLogStatus, AuthLogType, Device } from "@/domain/auth"
import { SignRequest, SignUpInputDto, SignUpOutputDto } from "@/domain/auth/auth.dtos"
import { SignStatus, SignType } from "@/domain/auth/auth.type"
import {
    IUserRepository,
    User,
    UserPreferences,
    UserPublicProfile,
    UserStatus,
    UserTerm,
} from "@/domain/user"
import {
    InvalidCoordinatesError,
    InvalidCredentialsError,
    InvalidIpAddressError,
    InvalidMetadataError,
    InvalidTimezoneError,
    SecurityRiskError,
    TermsNotAcceptedError,
    UserAlreadyExistsError,
    jwtEncoder,
    textLib,
} from "@/shared"
import { ProcessSignRequest, ProcessSignRequestResponse } from "./process.sign.request"

import { TimezoneCode } from "@/domain/user"
import { UserMetrics } from "@/domain/user/entities/user.metrics.entity"
import { logger } from "@/shared"
import { Timezone } from "circle-text-library"

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
                ipAddress: request.metadata.ipAddress || "unknown",
                machineId: request.metadata.machineId || "unknown",
                userAgent: request.metadata.userAgent || "unknown",
                timezone: request.metadata.timezone || "UTC",
                latitude: request.metadata.latitude || 0,
                longitude: request.metadata.longitude || 0,
                termsAccepted: request.metadata.termsAccepted || false,
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
                /**
                 * @TODO: Implementar lógica para atividade suspeita (envio de email para o usuário)
                 */
            }
        }
        return securityResult
    }

    async execute(request: SignUpInputDto): Promise<SignUpOutputDto> {
        try {
            // ✅ Validar entrada PRIMEIRO (valida username, password e device)
            await this.validateInput(request)

            // ✅ Validar metadata (valida todos os campos de metadata)
            this.validateMetadata(request.metadata)

            // ✅ Inicializar timezone usando circle-text-library
            const timezone = new Timezone()
            timezone.setLocalTimezone(request.metadata?.timezone as TimezoneCode)

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
                        deviceType: request.metadata?.device as Device,
                        deviceId: request.metadata.machineId || "unknown",
                        deviceTimezone: request.metadata.timezone || "UTC",
                    })
                }
                throw new UserAlreadyExistsError(request.username)
            }

            // ✅ Obter timezone offset do objeto Timezone
            const timezoneOffset = timezone.getOffset()

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
                embedding: {
                    vector: "",
                    dimension: 0,
                    metadata: {},
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                // ✅ Preferências com timezone correto
                preferences: {
                    appLanguage: request.metadata?.language || "en",
                    appTimezone: timezoneOffset,
                    timezoneCode: timezone.getCode(),
                    disableAutoplay: false,
                    disableHaptics: false,
                    disableTranslation: false,
                    translationLanguage: request.metadata?.language || "en",
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
                    termsAndConditionsAgreed: request.metadata?.termsAccepted || false,
                    termsAndConditionsAgreedVersion: "1.0",
                    termsAndConditionsAgreedAt: request.metadata?.termsAccepted
                        ? new Date()
                        : new Date(),
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
                device: request.metadata?.device as Device,
                ipAddress: request.metadata?.ipAddress,
                userAgent: request.metadata?.userAgent,
            })

            // Salvar atualizações
            await this.userRepository.update(savedUser)

            // Gerar token
            const token = await jwtEncoder({
                userId: savedUser.id,
                device: request.metadata?.device as Device, // Converter Device do auth para Device do authorization
                level: savedUser.status?.accessLevel || "user",
            })
            const expiresIn = Number(process.env.JWT_EXPIRES) || 3600 // 1 hora

            // Log registro bem-sucedido
            if (this.authLogRepository && request.metadata) {
                await this.authLogRepository.create({
                    username: request.username,
                    ipAddress: request.metadata?.ipAddress || "unknown",
                    userAgent: request.metadata?.userAgent || "unknown",
                    type: AuthLogType.SIGNUP,
                    status: AuthLogStatus.SUCCESS,
                    failureReason: "Registration successful",
                    deviceType: request.metadata?.device as Device,
                    deviceId: request.metadata.machineId || "unknown",
                    deviceTimezone: request.metadata.timezone || "UTC",
                })
            }

            logger.info("User registered successfully", {
                userId: savedUser.id,
                username: savedUser.username,
                timezone: timezone.getCode(),
                timezoneOffset: timezoneOffset,
            })

            return {
                token,
                expiresIn,
                user: savedUser.getPublicProfile() as UserPublicProfile,
                metrics: savedUser.metrics as UserMetrics,
                status: savedUser.status as UserStatus,
                terms: savedUser.terms as UserTerm,
                preferences: savedUser.preferences as UserPreferences,
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
                    deviceType: request.metadata?.device as Device,
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
        if (!request.username || request.username.length === 0) {
            throw new InvalidCredentialsError("Username é obrigatório")
        }

        if (!this.isValidUsername(request.username)) {
            throw new InvalidCredentialsError("Username inválido")
        }

        // Validar senha
        if (!request.password || request.password.length === 0) {
            throw new InvalidCredentialsError("Senha é obrigatória")
        }

        if (!this.isValidPassword(request.password)) {
            throw new InvalidCredentialsError("Senha inválida")
        }

        // Validar device
        if (!request.metadata?.device) {
            throw new InvalidCredentialsError("Informações do dispositivo são obrigatórias")
        }
    }

    private isValidUsername(username: string): boolean {
        return textLib.validator.username(username).isValid
    }

    private isValidPassword(password: string): boolean {
        return textLib.validator.password(password).isValid
    }

    /**
     * Valida os dados de metadata
     */
    private validateMetadata(metadata?: SignUpInputDto["metadata"]): void {
        // 1. Verificar se metadata existe
        if (!metadata) {
            throw new InvalidMetadataError("Metadata is required")
        }

        // 2. Validar ipAddress (obrigatório)
        if (!metadata.ipAddress) {
            throw new InvalidIpAddressError()
        }

        if (!this.isValidIpAddress(metadata.ipAddress)) {
            throw new InvalidIpAddressError(metadata.ipAddress)
        }

        // 3. Validar termsAccepted (obrigatório para signup)
        if (metadata.termsAccepted !== true) {
            throw new TermsNotAcceptedError()
        }

        // 4. Validar timezone (opcional mas se fornecido deve ser válido)
        if (metadata.timezone && !this.isValidTimezone(metadata.timezone)) {
            throw new InvalidTimezoneError(metadata.timezone)
        }

        // 5. Validar coordenadas (opcional mas se fornecidas devem ser válidas)
        if (metadata.latitude !== undefined || metadata.longitude !== undefined) {
            if (!this.areValidCoordinates(metadata.latitude, metadata.longitude)) {
                throw new InvalidCoordinatesError(metadata.latitude, metadata.longitude)
            }
        }

        // 6. Validar userAgent (opcional mas se fornecido deve ser string não vazia)
        if (metadata.userAgent !== undefined) {
            if (typeof metadata.userAgent !== "string" || metadata.userAgent.trim().length === 0) {
                throw new InvalidMetadataError("User agent must be a non-empty string")
            }
        }

        // 7. Validar machineId (opcional mas se fornecido deve ser string válida)
        if (metadata.machineId !== undefined) {
            if (typeof metadata.machineId !== "string" || metadata.machineId.trim().length === 0) {
                throw new InvalidMetadataError("Machine ID must be a non-empty string")
            }
        }

        // 8. Validar language (opcional mas se fornecido deve ser código válido)
        if (metadata.language !== undefined) {
            if (!this.isValidLanguageCode(metadata.language)) {
                throw new InvalidMetadataError(
                    `Invalid language code: ${metadata.language}. Must be a 2-letter ISO 639-1 code`,
                )
            }
        }
    }

    /**
     * Valida se é um IP address válido (IPv4 ou IPv6)
     */
    private isValidIpAddress(ip: string): boolean {
        // Regex simples para IPv4
        const ipv4Regex =
            /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

        // Regex simples para IPv6 (simplificado)
        const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/

        return ipv4Regex.test(ip) || ipv6Regex.test(ip)
    }

    /**
     * Valida se é um timezone válido
     */
    private isValidTimezone(timezone: string): boolean {
        const codes = Object.values(TimezoneCode)
        return codes.includes(timezone as TimezoneCode)
    }

    /**
     * Valida se as coordenadas geográficas são válidas
     */
    private areValidCoordinates(latitude?: number, longitude?: number): boolean {
        if (latitude === undefined || longitude === undefined) {
            return false
        }

        if (typeof latitude !== "number" || typeof longitude !== "number") {
            return false
        }

        if (isNaN(latitude) || isNaN(longitude)) {
            return false
        }

        // Latitude deve estar entre -90 e 90
        if (latitude < -90 || latitude > 90) {
            return false
        }

        // Longitude deve estar entre -180 e 180
        if (longitude < -180 || longitude > 180) {
            return false
        }

        return true
    }

    /**
     * Valida se é um código de linguagem válido (ISO 639-1)
     */
    private isValidLanguageCode(language: string): boolean {
        if (typeof language !== "string") {
            return false
        }

        // Deve ter 2 caracteres
        if (language.length !== 2) {
            return false
        }

        // Deve conter apenas letras
        return /^[a-z]{2}$/i.test(language)
    }
}
