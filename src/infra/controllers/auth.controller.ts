import SignLogModel, {
    SecurityRisk,
    SignStatus,
    SignType,
} from "@/infra/models/auth/sign.logs.model"
import { ErrorFactory, jwtEncoder } from "@/shared"
import { compare, hashSync } from "bcryptjs"

import { Device, Level } from "@/domain/authorization/authorization.type"
import SwipeEngineUserEmbeddingModel from "@/infra/models/swipe.engine/user.embedding.model"
import SwipeEngineUserInteractionHistoryModel from "@/infra/models/swipe.engine/user.interaction.history.model"
import SwipeEngineUserInteractionSummaryModel from "@/infra/models/swipe.engine/user.interaction.summary.model"
import UserModel from "@/infra/models/user/user.model"
import PreferencesModel from "@/infra/models/user/user.preferences.model"
import ProfilePictureModel from "@/infra/models/user/user.profile.picture.model"
import StatisticModel from "@/infra/models/user/user.statistics.model"
import UserStatusModel from "@/infra/models/user/user.status.model"
import UserTermsModel from "@/infra/models/user/user.terms.model"
import { SignRequest } from "@/modules/auth/types"

export class AuthController {
    private signLogsModel = SignLogModel
    private userModel = UserModel
    private userStatusModel = UserStatusModel
    private userTermsModel = UserTermsModel
    private statisticModel = StatisticModel
    private profilePictureModel = ProfilePictureModel
    private preferencesModel = PreferencesModel
    private userEmbeddingModel = SwipeEngineUserEmbeddingModel
    private userInteractionHistoryModel = SwipeEngineUserInteractionHistoryModel
    private userInteractionSummaryModel = SwipeEngineUserInteractionSummaryModel

    private encryptPassword(password: string) {
        return hashSync(password, 10)
    }

    private decryptPassword(password: string, encryptedPassword: string) {
        return compare(password, encryptedPassword)
    }

    async signIn(signData: SignRequest) {
        const user = await this.userModel.findOne({ where: { username: signData.username } })
        if (!user) {
            throw ErrorFactory.validation("User not found", "Verify if the user exists")
        }
        const userStatus = await this.userStatusModel.findOne({
            where: { user_id: user.id, blocked: false, deleted: false },
        })
        if (userStatus?.blocked || userStatus?.deleted) {
            throw ErrorFactory.validation(
                "This user account is blocked or deleted",
                "Probably this user violated the terms of use and service.",
            )
        }

        // Verifica se a senha está correta
        const passwordMatches = await this.decryptPassword(
            signData.password,
            user.encrypted_password,
        )
        if (!passwordMatches) {
            throw ErrorFactory.validation("Incorrect Password.", "Incorrect Password.")
        }

        Promise.all([
            this.userTermsModel.upsert({
                user_id: user.id,
                terms_and_conditions_agreed: signData.termsAccepted,
                terms_and_conditions_agreed_version: process.env.TERMS_VERSION,
                terms_and_conditions_agreed_at: new Date(),
            }),
            this.signLogsModel.create({
                typed_username: user.username,
                sign_type: SignType.SIGNIN,
                status: SignStatus.APPROVED,
                security_risk: SecurityRisk.LOW,
                ip_address: signData.ipAddress,
                machine_id: signData.machineId,
                latitude: signData.latitude,
                longitude: signData.longitude,
                timezone: signData.timezone,
                user_agent: signData.userAgent || "",
            }),
        ])
        const userTerms = await this.userTermsModel.findOne({ where: { user_id: user.id } })
        if (!userTerms) {
            throw ErrorFactory.validation("User terms not found", "User terms not found")
        }

        // Busca as informações do usuário relacionadas
        const [statistic, profile_picture, preferences, userStatusData] = await Promise.all([
            this.statisticModel.findOne({
                attributes: ["total_followers_num", "total_likes_num", "total_views_num"],
                where: { user_id: user.id },
            }),
            this.profilePictureModel.findOne({
                attributes: ["fullhd_resolution", "tiny_resolution"],
                where: { user_id: user.id },
            }),
            this.preferencesModel.findOne({ where: { user_id: user.id } }),
            this.userStatusModel.findOne({ where: { user_id: user.id } }),
        ])

        // Gera um novo token de acesso JWT
        const newAccessToken = await jwtEncoder({
            userId: user.id.toString(),
            device: Device.MOBILE, // TODO: Obter device do request
            role: userStatusData?.access_level || Level.USER,
        })
        if (!newAccessToken)
            throw ErrorFactory.validation(
                "Authorization token is Missing.",
                "Authorization token is Missing.",
            )

        const sessionData = {
            session: {
                user: {
                    id: user.id.toString(),
                    name: user.name || "",
                    description: user.description,
                    username: user.username,
                    verified: userStatusData?.verified,
                    profile_picture: {
                        small_resolution: profile_picture?.fullhd_resolution || "",
                        tiny_resolution: profile_picture?.tiny_resolution || "",
                    },
                },
                statistics: {
                    total_followers_num: statistic?.total_followers || 0,
                    total_likes_num: statistic?.total_likes_given || 0,
                    total_views_num: statistic?.total_views_received || 0,
                },
                account: {
                    jwtToken: `Bearer ${newAccessToken}`,
                    jwtExpiration: process.env.JWT_EXPIRES,
                    muted: userStatusData?.muted,
                    unreadNotificationsCount: 0,
                    last_login_at: new Date(),
                },
                preferences: {
                    timezone: preferences?.app_timezone || -3,
                    language: {
                        appLanguage: preferences?.app_language || "en",
                        translationLanguage: preferences?.translation_language || "en",
                    },
                    content: {
                        disableAutoplay: preferences?.disable_autoplay || false,
                        disableHaptics: preferences?.disable_haptics || false,
                        disableTranslation: preferences?.disable_translation || false,
                    },
                    pushNotifications: {
                        disableLikeMoment:
                            preferences?.disable_like_moment_push_notification || false,
                        disableNewMemory:
                            preferences?.disable_new_memory_push_notification || false,
                        disableAddToMemory:
                            preferences?.disable_add_to_memory_push_notification || false,
                        disableFollowUser:
                            preferences?.disable_follow_user_push_notification || false,
                        disableViewUser: preferences?.disable_view_user_push_notification || false,
                    },
                },
            },
        }

        return sessionData
    }

    async signUp(signData: SignRequest) {
        // TODO: Implementar signUp
        throw new Error("SignUp not implemented yet")
    }
}
