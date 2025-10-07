import { Level } from "@/domain/authorization"
import { UserMetrics } from "@/domain/user/entities/user.metrics.entity"

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
    terms: UserTerm
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
    terms?: UserTerm
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

export enum TimezoneCode {
    UTC = "UTC",
    BRT = "BRT",
    BRST = "BRST",
    EST = "EST",
    EDT = "EDT",
    CST = "CST",
    CDT = "CDT",
    MST = "MST",
    MDT = "MDT",
    PST = "PST",
    PDT = "PDT",
    AKST = "AKST",
    AKDT = "AKDT",
    HST = "HST",
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

export interface UserPreferences {
    appLanguage: string
    appTimezone: number
    timezoneCode: TimezoneCode
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
    defaultMomentVisibility?: "public" | "followers_only" | "private"
    createdAt: Date
    updatedAt: Date
}

export interface UserTerm {
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
