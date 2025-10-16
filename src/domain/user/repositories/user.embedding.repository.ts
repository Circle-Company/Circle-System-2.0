import { UserEmbedding } from "../types"

/**
 * Interface para o repositório de embeddings de usuário
 */
export interface IUserEmbeddingRepository {
    findByUserId(userId: string): Promise<UserEmbedding | null>
    save(embedding: UserEmbedding): Promise<UserEmbedding>
}
