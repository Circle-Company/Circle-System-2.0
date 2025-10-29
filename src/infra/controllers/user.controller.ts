import { BlockUserResponse, BlockUserUseCase } from "@/application/user/use.cases/block.user.use.case"
import { FollowUserResponse, FollowUserUseCase } from "@/application/user/use.cases/follow.user.use.case"
import {
    GetUserAccountUseCase,
    UserAccount,
} from "@/application/user/use.cases/get.user.account.use.case"
import {
    GetUserBlocksResponse,
    GetUserBlocksUseCase,
} from "@/application/user/use.cases/get.user.blocks.use.case"
import {
    GetUserProfileUseCase,
    UserProfile,
} from "@/application/user/use.cases/get.user.profile.use.case"
import { UnblockUserResponse, UnblockUserUseCase } from "@/application/user/use.cases/unblock.user.use.case"
import { UnfollowUserResponse, UnfollowUserUseCase } from "@/application/user/use.cases/unfollow.user.use.case"

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
    constructor(
        private readonly getUserProfileUseCase: GetUserProfileUseCase,
        private readonly getUserAccountUseCase: GetUserAccountUseCase,
        private readonly followUserUseCase: FollowUserUseCase,
        private readonly unfollowUserUseCase: UnfollowUserUseCase,
        private readonly blockUserUseCase: BlockUserUseCase,
        private readonly unblockUserUseCase: UnblockUserUseCase,
        private readonly getUserBlocksUseCase: GetUserBlocksUseCase,
    ) {}

    /**
     * Obtém perfil público do usuário
     */
    async getPublicProfile(userId: string, requestingUserId: string): Promise<UserProfile> {
        const profileResult = await this.getUserProfileUseCase.execute({
            userId,
            requestingUserId,
        })

        if (!profileResult.success || !profileResult.profile) {
            throw new Error(profileResult.error || "User not found")
        }

        return profileResult.profile
    }

    /**
     * Obtém dados da conta do usuário autenticado
     */
    async getAccount(userId: string): Promise<UserAccount | null> {
        const result = await this.getUserAccountUseCase.execute(userId)

        if (!result.success || !result.account) {
            console.error("Failed to get account:", result.error)
            return null
        }

        return result.account
    }

    async followUser(userId: string, targetUserId: string): Promise<FollowUserResponse> {
        return await this.followUserUseCase.execute({ userId, targetUserId })
    }

    async unfollowUser(userId: string, targetUserId: string): Promise<UnfollowUserResponse> {
        return await this.unfollowUserUseCase.execute({ userId, targetUserId })
    }

    async blockUser(userId: string, targetUserId: string): Promise<BlockUserResponse> {
        return await this.blockUserUseCase.execute({ userId, targetUserId })
    }

    async unlockUser(userId: string, targetUserId: string): Promise<UnblockUserResponse> {
        return await this.unblockUserUseCase.execute({ userId, targetUserId })
    }

    async getBlocks(userId: string, limit?: number, offset?: number): Promise<GetUserBlocksResponse> {
        return await this.getUserBlocksUseCase.execute({ userId, limit, offset })
    }
}
