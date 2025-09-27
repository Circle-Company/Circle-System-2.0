import { Level } from "../authorization/authorization.type"

export interface UserEntity {
    id: bigint
    username: string
    name: string | null
    searchMatchTerm: string
    password: string
    oldPassword: string | null
    description: string | null
    lastPasswordUpdatedAt: Date | null
    profilePicture: UserProfilePicture
    status: UserStatus
    metrics: UserMetrics
    preferences: UserPreferences
    terms: UserTerms
    embedding: UserEmbedding
    interctionsSummary: UserInterctionsSummary
    createdAt: Date
    updatedAt: Date
}

export interface UserProps {
    id?: string
    username: string
    name?: string | null
    searchMatchTerm: string
    password: string
    oldPassword?: string | null
    description?: string | null
    lastPasswordUpdatedAt?: Date | null
    profilePicture?: UserProfilePicture
    status?: UserStatus
    metrics?: UserMetrics
    preferences?: UserPreferences
    terms?: UserTerms
    embedding?: UserEmbedding
    interctionsSummary?: UserInterctionsSummary
    createdAt?: Date
    updatedAt?: Date
}

export enum UserRole {
    ADMIN = "admin",
    USER = "user",
    MODERATOR = "moderator",
}

export enum UserStatusEnum {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    DELETED = "deleted",
}

export interface UserProfilePicture {
    tinyResolution: string | null
    fullhdResolution: string | null
    createdAt: Date
    updatedAt: Date
}

export interface UserStatus {
    accessLevel: Level
    verified: boolean
    deleted: boolean
    blocked: boolean
    muted: boolean
    createdAt: Date
    updatedAt: Date
}

export interface UserMetrics {
    totalLikesReceived: number
    totalViewsReceived: number
    totalSharesReceived: number
    totalCommentsReceived: number
    totalMemoriesCreated: number
    totalMomentsCreated: number
    totalLikesGiven: number
    totalCommentsGiven: number
    totalSharesGiven: number
    totalFollowsGiven: number
    totalReportsGiven: number
    totalFollowers: number
    totalFollowing: number
    totalRelations: number
    engagementRate: number
    reachRate: number
    momentsPublishedGrowthRate30d: number
    memoriesPublishedGrowthRate30d: number
    followerGrowthRate30d: number
    engagementGrowthRate30d: number
    interactionsGrowthRate30d: number
    memoriesPerDayAverage: number
    momentsPerDayAverage: number
    reportsReceived: number
    violationsCount: number
    lastMetricsUpdate: Date
    createdAt: Date
    updatedAt: Date
}

export interface UserPreferences {
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
    createdAt: Date
    updatedAt: Date
}

export interface UserTerms {
    termsAndConditionsAgreed: boolean
    termsAndConditionsAgreedVersion: string
    termsAndConditionsAgreedAt: Date
    createdAt: Date
    updatedAt: Date
}

export interface UserEmbedding {
    vector: string
    dimension: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

export interface UserInterctionsSummary {
    totalInteractions: number
    lastInteractionDate: Date | null
    interactionCounts: Record<string, number>
    createdAt: Date
    updatedAt: Date
}
