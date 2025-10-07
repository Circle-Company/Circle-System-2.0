import { UserInteraction } from "../types/interaction.types"

/**
 * Interface para o repositório de interações de usuário
 */
export interface IInteractionRepository {
    /**
     * Salva uma interação
     */
    save(interaction: UserInteraction): Promise<UserInteraction>

    /**
     * Busca interações de um usuário
     */
    findByUserId(userId: string, limit?: number, offset?: number): Promise<UserInteraction[]>

    /**
     * Busca interações de um usuário com um momento específico
     */
    findByUserIdAndMomentId(userId: string, momentId: string): Promise<UserInteraction[]>

    /**
     * Busca interações recentes de um usuário
     */
    findRecentByUserId(userId: string, daysBack: number, limit?: number): Promise<UserInteraction[]>

    /**
     * Busca interações de um tipo específico
     */
    findByUserIdAndType(userId: string, type: string, limit?: number): Promise<UserInteraction[]>

    /**
     * Verifica se um usuário interagiu com um momento
     */
    hasInteracted(userId: string, momentId: string): Promise<boolean>

    /**
     * Busca IDs de momentos com os quais o usuário interagiu
     */
    findInteractedMomentIds(userId: string, types?: string[]): Promise<string[]>

    /**
     * Conta interações de um usuário
     */
    countByUserId(userId: string): Promise<number>

    /**
     * Busca interações de um momento
     */
    findByMomentId(momentId: string, limit?: number): Promise<UserInteraction[]>

    /**
     * Deleta interações antigas
     */
    deleteOlderThan(date: Date): Promise<number>
}
