import { UserProfilePicture, UserStatus, UserTerm } from "@/domain/user/types/user.type"
export interface SignUpInputDto {
    username: string
    password: string
    metadata: {
        termsAccepted: boolean
        forwardedFor: string
        userAgent?: string
        machineId?: string
        timezone?: string
        latitude?: number
        longitude?: number
    }
}

export interface SignUpOutputDto {
    session: {
        user: {
            id: string
            username: string
            name: string
            description: string
            profilePicture: Omit<UserProfilePicture, "createdAt" | "updatedAt">
            status: Omit<UserStatus, "createdAt" | "updatedAt">
            metrics: {
                totalLikesReceived: number
                totalViewsReceived: number
                totalSharesReceived: number
                totalCommentsReceived: number
                totalMemoriesCreated: number
                totalMomentsCreated: number
                totalFollowers: number
                totalFollowing: number
                lastMetricsUpdate: Date
            }
            terms: Omit<UserTerm, "createdAt" | "updatedAt">
            lastLogin: Date
            lastPasswordUpdate: Date
        }
        preferences: {
            appTimezone: number
            language: {
                appLanguage: string
                translationLanguage: string
            }
            content: {
                disableAutoplay: boolean
                disableHaptics: boolean
                disableTranslation: boolean
            }
            pushNotifications: {
                disableLikeMomentPushNotification: boolean
                disableNewMemoryPushNotification: boolean
                disableAddToMemoryPushNotification: boolean
                disableFollowUserPushNotification: boolean
                disableViewUserPushNotification: boolean
                disableNewsPushNotification: boolean
                disableSugestionsPushNotification: boolean
                disableAroundYouPushNotification: boolean
            }
            creation: {
                defaultMomentVisibility: "public" | "followers_only" | "private"
            }
        }
        jwtToken: string
        jwtExpiration: string
    }
}
