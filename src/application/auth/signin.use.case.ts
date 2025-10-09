import { AuthLogRepository, AuthLogStatus, AuthLogType, Device } from "@/domain/auth"
import { SignInInputDto, SignInOutputDto, SignRequest } from "@/domain/auth/auth.dtos"
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
import {
    InvalidCredentialsError,
    SecurityRiskError,
    UserInactiveError,
    jwtEncoder,
    logger,
} from "@/shared"
import { Timezone, TimezoneCodes } from "circle-text-library"
import { ProcessSignRequest, ProcessSignRequestResponse } from "./process.sign.request"
import { AuthValidators } from "./validators/auth.validators"

export class SignInUseCase {
    constructor(
        private userRepository: IUserRepository,
        private authLogRepository?: AuthLogRepository,
        private processSignRequest?: ProcessSignRequest,
    ) {}

    async execute(request: SignInInputDto): Promise<SignInOutputDto> {
        // ✅ Validar metadata PRIMEIRO (antes de qualquer operação)
        AuthValidators.validateMetadata(request.metadata, {
            requireDevice: true,
            requireTermsAccepted: true,
        })

        const [user, securityResult] = await Promise.all([
            this.userRepository.findByUsername(request.username),
            this.processSignRequestFactory(request),
        ])

        // Buscar usuário por username
        if (!user) {
            await this.registerAuthLog({
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
}
