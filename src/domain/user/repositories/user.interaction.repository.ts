/**
 * Tipos de interação do usuário com momentos
 */
export type InteractionType =
    | "view"
    | "like"
    | "comment"
    | "report"
    | "completion"
    | "share"
    | "save"
    | "skip"

/**
 * Interação de usuário com momento
 */
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
        topics?: string[]
        [key: string]: any
    }
}

/**
 * Interface para o repositório de interações de usuário
 */
export interface IInteractionRepository {
    save(interaction: UserInteraction): Promise<UserInteraction>
    findByUserId(userId: string, limit?: number): Promise<UserInteraction[]>
    findInteractedMomentIds(userId: string): Promise<string[]>
}

