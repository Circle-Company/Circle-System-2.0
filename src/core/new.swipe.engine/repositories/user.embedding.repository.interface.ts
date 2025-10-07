import { UserEmbedding } from "../types/embedding.types"

/**
 * Interface para o repositório de embeddings de usuário
 */
export interface IUserEmbeddingRepository {
    /**
     * Encontra o embedding de um usuário pelo ID
     */
    findByUserId(userId: string): Promise<UserEmbedding | null>

    /**
     * Salva ou atualiza o embedding de um usuário
     */
    save(embedding: UserEmbedding): Promise<UserEmbedding>

    /**
     * Busca embeddings de múltiplos usuários
     */
    findByUserIds(userIds: string[]): Promise<UserEmbedding[]>

    /**
     * Busca todos os embeddings com paginação
     */
    findAll(limit: number, offset: number): Promise<UserEmbedding[]>

    /**
     * Deleta o embedding de um usuário
     */
    delete(userId: string): Promise<boolean>

    /**
     * Conta o total de embeddings
     */
    count(): Promise<number>
}
