import {
    GetUserProfileUseCase,
    UserProfile,
} from "@/application/user/use.cases/get.user.profile.use.case"

import { Level } from "@/domain/authorization"

export interface CreateUserRequest {
    username: string
    name?: string
    searchMatchTerm: string
    password: string
    description?: string
    status?: {
        accessLevel: Level
        verified?: boolean
        deleted?: boolean
        blocked?: boolean
        muted?: boolean
    }
    preferences?: {
        appLanguage?: string
        appTimezone?: number
        disableAutoplay?: boolean
        disableHaptics?: boolean
        disableTranslation?: boolean
        translationLanguage?: string
        disableLikeMomentPushNotification?: boolean
        disableNewMemoryPushNotification?: boolean
        disableAddToMemoryPushNotification?: boolean
        disableFollowUserPushNotification?: boolean
        disableViewUserPushNotification?: boolean
        disableNewsPushNotification?: boolean
        disableSugestionsPushNotification?: boolean
        disableAroundYouPushNotification?: boolean
    }
    terms?: {
        termsAndConditionsAgreed: boolean
        termsAndConditionsAgreedVersion: string
        termsAndConditionsAgreedAt: Date
    }
}

export interface UpdateUserRequest {
    id: string
    username?: string
    name?: string
    searchMatchTerm?: string
    password?: string
    description?: string
    status?: {
        accessLevel?: Level
        verified?: boolean
        deleted?: boolean
        blocked?: boolean
        muted?: boolean
    }
    preferences?: {
        appLanguage?: string
        appTimezone?: number
        disableAutoplay?: boolean
        disableHaptics?: boolean
        disableTranslation?: boolean
        translationLanguage?: string
        disableLikeMomentPushNotification?: boolean
        disableNewMemoryPushNotification?: boolean
        disableAddToMemoryPushNotification?: boolean
        disableFollowUserPushNotification?: boolean
        disableViewUserPushNotification?: boolean
        disableNewsPushNotification?: boolean
        disableSugestionsPushNotification?: boolean
        disableAroundYouPushNotification?: boolean
    }
    terms?: {
        termsAndConditionsAgreed?: boolean
        termsAndConditionsAgreedVersion?: string
        termsAndConditionsAgreedAt?: Date
    }
}

export interface UserResponse {
    id: string
    username: string
    name: string | null
    searchMatchTerm: string
    description: string | null
    status?: {
        accessLevel: Level
        verified: boolean
        deleted: boolean
        blocked: boolean
        muted: boolean
    }
    preferences?: {
        appLanguage: string
        appTimezone: number
        disableAutoplay: boolean
        disableHaptics: boolean
        disableTranslation: boolean
        translationLanguage: string
        disableLikeMomentPushNotification: boolean
        disableNewMemoryPushNotification: boolean
        disableAddToMemoryPushNotification: boolean
        disableFollowUserPushNotification: boolean
        disableViewUserPushNotification: boolean
        disableNewsPushNotification: boolean
        disableSugestionsPushNotification: boolean
        disableAroundYouPushNotification: boolean
    }
    terms?: {
        termsAndConditionsAgreed: boolean
        termsAndConditionsAgreedVersion: string
        termsAndConditionsAgreedAt: Date
    }
    createdAt: Date
    updatedAt: Date
}

export class UserController {
    constructor(private readonly getUserProfileUseCase: GetUserProfileUseCase) {}

    /**
     * Obtém perfil público do usuário
     */
    async getPublicProfile(userId: string, requestingUserId: string): Promise<UserProfile | null> {
        const profileResult = await this.getUserProfileUseCase.execute({
            userId,
            requestingUserId,
        })

        if (!profileResult.success || !profileResult.user) {
            console.error("Failed to get public profile:", profileResult.error)
            return null
        }

        return profileResult.user
    }

    /**
     * Obtém dados da conta do usuário autenticado
     */
    async getAccount(userId: string, requestingUserId?: string): Promise<UserProfile | null> {
        const result = await this.getUserProfileUseCase.execute({
            userId,
            requestingUserId: requestingUserId || userId,
        })

        if (!result.success || !result.user) {
            console.error("Failed to get account:", result.error)
            return null
        }

        return result.user
    }
}
