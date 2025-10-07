/**
 * Tipos relacionados a interações de usuário
 * Re-exporta os tipos do domínio para uso no swipe engine
 */

import type { DomainUserInteraction, UserInteractionType } from "@/domain/user"

export type InteractionType = UserInteractionType
export type UserInteraction = DomainUserInteraction

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
