/**
 * Tipos relacionados a interações de usuário
 */

export type InteractionType =
    | "view"
    | "like"
    | "comment"
    | "share"
    | "save"
    | "dislike"
    | "report"
    | "skip"
    | "complete_view"
    | "partial_view"

export interface UserInteraction {
    id: string
    userId: string
    momentId: string
    type: InteractionType
    timestamp: Date
    metadata?: {
        duration?: number
        percentWatched?: number
        engagementTime?: number
        [key: string]: any
    }
}

export interface UserProfile {
    userId: string
    interests: string[]
    preferences?: {
        contentTypes?: string[]
        topics?: string[]
    }
    demographics?: {
        ageRange?: string
        location?: string
        language?: string
    }
    interactionHistory?: UserInteraction[]
}

export interface InteractionSummary {
    userId: string
    totalInteractions: number
    interactionsByType: Record<InteractionType, number>
    lastInteractionAt: Date
    favoriteTopics: string[]
    engagementScore: number
}
