import { AuthLogRepository, AuthLogStatus, AuthLogType, Device } from "@/domain/auth"
import {
    IUserRepository,
    TimezoneCode,
    UserMetrics,
    UserPreferences,
    UserPublicProfile,
    UserStatus,
    UserTerm,
} from "@/domain/user"
import {
    InvalidCoordinatesError,
    InvalidCredentialsError,
    InvalidDeviceError,
    InvalidIpAddressError,
    InvalidMetadataError,
    InvalidTimezoneError,
    SecurityRiskError,
    TermsNotAcceptedError,
    UserInactiveError,
    jwtEncoder,
    logger,
} from "@/shared"
import { ProcessSignRequest, ProcessSignRequestResponse } from "./process.sign.request"
import { SignInInputDto, SignInOutputDto, SignRequest } from "@/domain/auth/auth.dtos"
import { Timezone, TimezoneCodes } from "circle-text-library"

import { SignStatus } from "@/domain/auth/auth.type"
import { SignType } from "@/infra/models/auth/sign.logs.model"

export class SignInUseCase {
    constructor(
        private userRepository: IUserRepository,
        private authLogRepository?: AuthLogRepository,
        private processSignRequest?: ProcessSignRequest,
    ) {}

    async execute(request: SignInInputDto): Promise<SignInOutputDto> {
        // ✅ Validar metadata PRIMEIRO (antes de qualquer operação)
        this.validateMetadata(request.metadata)

        const [user, securityResult] = await Promise.all([
            this.userRepository.findByUsername(request.username),
            this.processSignRequestFactory(request),
        ])

        // Buscar usuário por username
        if (!user) {
            this.registerAuthLog({
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.FAILED,
                failureReason: "User not found",
                request,
            })
            throw new InvalidCredentialsError()
        }
        // Validar senha
        const isPasswordValid = await user.validatePassword(request.password)
        if (!isPasswordValid) {
            await this.registerAuthLog({
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.FAILED,
                failureReason: "User not found",
                request,
            })

            throw new InvalidCredentialsError()
        }

        if (!user.canSign()) {
            await this.registerAuthLog({
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.FAILED,
                failureReason: "User authorized to sign",
                request,
            })
            throw new UserInactiveError(user.id)
        }

        const timezone = new Timezone(request.metadata?.timezone as TimezoneCodes)
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
            ipAddress: request.metadata?.ipAddress,
            userAgent: request.metadata?.userAgent,
        })

        // Gerar token
        const token = await jwtEncoder({
            userId: user.id,
            device: request.metadata?.device as Device,
            role: user.role,
        })

        await Promise.all([
            this.userRepository.update(user),
            this.registerAuthLog({
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.SUCCESS,
                failureReason: "",
                request,
            }),
        ])

        const expiresIn = Number(process.env.JWT_EXPIRES) || 3600 // 1 hora
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

    private async processSignRequestFactory(
        request: SignInInputDto,
    ): Promise<ProcessSignRequestResponse> {
        // Processar solicitação com gerenciamento de risco de segurança
        let securityResult: ProcessSignRequestResponse | null = null
        if (this.processSignRequest && request.metadata) {
            const signRequest: SignRequest = {
                username: request.username,
                password: request.password,
                signType: SignType.SIGNIN,
                ipAddress: request.metadata.ipAddress || "unknown",
                machineId: request.metadata.machineId || "unknown",
                userAgent: request.metadata.userAgent || "unknown",
                timezone: request.metadata.timezone || "UTC",
                latitude: request.metadata.latitude || 0,
                longitude: request.metadata.longitude || 0,
                termsAccepted: request.metadata.termsAccepted || false, // ✅ Usar o valor real
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
        return securityResult as ProcessSignRequestResponse
    }

    private async registerAuthLog({
        type,
        status,
        failureReason,
        request,
    }: {
        type: AuthLogType
        status: AuthLogStatus
        failureReason: string
        request: SignInInputDto
    }) {
        if (this.authLogRepository && request.metadata) {
            await this.authLogRepository.create({
                type: type,
                status: status,
                failureReason: failureReason,
                username: request.username,
                deviceType: request.metadata.device as Device,
                ipAddress: request.metadata.ipAddress || "unknown",
                userAgent: request.metadata.userAgent || "unknown",
                deviceId: request.metadata.machineId || "unknown",
                deviceTimezone: request.metadata.timezone || "UTC",
            })
        }
    }

    /**
     * Valida os dados de metadata
     */
    private validateMetadata(metadata: SignInInputDto["metadata"]): void {
        // 1. Verificar se metadata existe
        if (!metadata) {
            throw new InvalidMetadataError("Metadata is required")
        }

        // 2. Validar device (obrigatório)
        if (!metadata.device) {
            throw new InvalidDeviceError("Device is required")
        }

        const validDevices = Object.values(Device)
        if (!validDevices.includes(metadata.device)) {
            throw new InvalidDeviceError(
                `Invalid device type: ${metadata.device}. Valid types: ${validDevices.join(", ")}`,
            )
        }

        // 3. Validar ipAddress (obrigatório)
        if (!metadata.ipAddress) {
            throw new InvalidIpAddressError()
        }

        if (!this.isValidIpAddress(metadata.ipAddress)) {
            throw new InvalidIpAddressError(metadata.ipAddress)
        }

        // 4. Validar termsAccepted (obrigatório)
        if (metadata.termsAccepted !== true) {
            throw new TermsNotAcceptedError()
        }

        // 5. Validar timezone (opcional mas se fornecido deve ser válido)
        if (metadata.timezone && !this.isValidTimezone(metadata.timezone)) {
            throw new InvalidTimezoneError(metadata.timezone)
        }

        // 6. Validar coordenadas (opcional mas se fornecidas devem ser válidas)
        if (metadata.latitude !== undefined || metadata.longitude !== undefined) {
            if (!this.areValidCoordinates(metadata.latitude, metadata.longitude)) {
                throw new InvalidCoordinatesError(metadata.latitude, metadata.longitude)
            }
        }

        // 7. Validar userAgent (opcional mas se fornecido deve ser string não vazia)
        if (metadata.userAgent !== undefined) {
            if (typeof metadata.userAgent !== "string" || metadata.userAgent.trim().length === 0) {
                throw new InvalidMetadataError("User agent must be a non-empty string")
            }
        }

        // 8. Validar machineId (opcional mas se fornecido deve ser string válida)
        if (metadata.machineId !== undefined) {
            if (typeof metadata.machineId !== "string" || metadata.machineId.trim().length === 0) {
                throw new InvalidMetadataError("Machine ID must be a non-empty string")
            }
        }

        // 9. Validar language (opcional mas se fornecido deve ser código válido)
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
        try {
            // Tenta criar um formatter com o timezone para validar
            Intl.DateTimeFormat(undefined, { timeZone: timezone })
            return true
        } catch {
            return false
        }
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
