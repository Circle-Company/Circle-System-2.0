import { AuthLogRepository, AuthLogStatus, AuthLogType, Device } from "@/domain/auth"
import { SignRequest, SignUpInputDto, SignUpOutputDto } from "@/domain/auth/auth.dtos"
import { SignStatus, SignType } from "@/domain/auth/auth.type"
import {
    IUserRepository,
    TimezoneCode,
    User,
    UserMetrics,
    UserPreferences,
    UserPublicProfile,
    UserStatus,
    UserTerm,
} from "@/domain/user"
import {
    InvalidCredentialsError,
    SecurityRiskError,
    UserAlreadyExistsError,
    circleTextLibrary,
    jwtEncoder,
} from "@/shared"
import { Timezone, TimezoneCodes } from "circle-text-library"
import { ProcessSignRequest, ProcessSignRequestResponse } from "./process.sign.request"
import { AuthValidators } from "./validators/auth.validators"

export class SignUpUseCase {
    constructor(
        private userRepository: IUserRepository,
        private authLogRepository?: AuthLogRepository,
        private processSignRequest?: ProcessSignRequest,
    ) {}

    async execute(request: SignUpInputDto): Promise<SignUpOutputDto> {
        // Validar entrada PRIMEIRO
        this.validateInput(request)

        // Validar metadata
        AuthValidators.validateMetadata(request.metadata, {
            requireDevice: true,
            requireTermsAccepted: true,
        })

        const [userExists, securityResult] = await Promise.all([
            this.userRepository.existsByUsername(request.username),
            this.processSignRequestFactory(request),
        ])

        // Verificar se usuário já existe
        if (userExists) {
            await this.registerAuthLog({
                type: AuthLogType.SIGNUP,
                status: AuthLogStatus.FAILED,
                failureReason: "User already exists",
                request,
            })
            throw new UserAlreadyExistsError(request.username)
        }

        const timezone = new Timezone(request.metadata?.timezone as TimezoneCodes)
        const timezoneOffset = timezone.getTimezoneOffset()

        // Criar novo usuário
        const newUser = await User.create({
            username: request.username,
            name: null,
            searchMatchTerm: `${request.username}`,
            password: request.password,
            description: null,
            profilePicture: {
                tinyResolution: null,
                fullhdResolution: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            status: {
                accessLevel: "user" as any,
                verified: false,
                deleted: false,
                blocked: false,
                muted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            metrics: undefined,
            embedding: {
                vector: "",
                dimension: 0,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            preferences: {
                appLanguage: request.metadata?.language || "en",
                appTimezone: timezoneOffset,
                timezoneCode: timezone.getCurrentTimezoneCode() as unknown as TimezoneCode,
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
        const user = await this.userRepository.save(newUser)

        // Criar métricas e registrar login
        const initialMetrics = UserMetrics.create(user.id)
        user.updateMetrics(initialMetrics)

        user.recordLogin({
            device: request.metadata?.device as Device,
            ipAddress: request.metadata?.ipAddress,
            userAgent: request.metadata?.userAgent,
        })

        // Gerar token
        const token = await jwtEncoder({
            userId: user.id,
            device: request.metadata?.device as Device,
            role: user.role || "user",
        })

        await Promise.all([
            this.userRepository.update(user),
            this.registerAuthLog({
                type: AuthLogType.SIGNUP,
                status: AuthLogStatus.SUCCESS,
                failureReason: "",
                request,
            }),
        ])

        const expiresIn = Number(process.env.JWT_EXPIRES) || 3600

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
        request: SignUpInputDto,
    ): Promise<ProcessSignRequestResponse> {
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

            if (securityResult.status === SignStatus.REJECTED) {
                throw new SecurityRiskError(
                    securityResult.reason || "Request rejected by security system",
                    securityResult.securityRisk,
                )
            }
            /** 
            // Verificar se há atividade suspeita que requer atenção
            if (securityResult.status === SignStatus.SUSPICIOUS) {
                throw new SecurityRiskError(
                    securityResult.reason || "Request rejected by security system",
                    securityResult.securityRisk,
                )
            }*/
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
        request: SignUpInputDto
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

    private validateInput(request: SignUpInputDto): void {
        // Validar username
        if (!request.username || request.username.length === 0) {
            throw new InvalidCredentialsError("Username é obrigatório")
        }

        if (!circleTextLibrary.validate.username(request.username).isValid) {
            throw new InvalidCredentialsError("Username inválido")
        }

        // Validar senha
        if (!request.password || request.password.length === 0) {
            throw new InvalidCredentialsError("Senha é obrigatória")
        }

        if (!circleTextLibrary.validate.password(request.password).isValid) {
            throw new InvalidCredentialsError("Senha inválida")
        }

        // Validar device
        if (!request.metadata?.device) {
            throw new InvalidCredentialsError("Informações do dispositivo são obrigatórias")
        }
    }
}
