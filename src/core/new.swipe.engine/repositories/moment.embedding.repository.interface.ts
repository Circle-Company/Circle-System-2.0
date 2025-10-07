import { MomentEmbedding } from "../types/embedding.types"

/**
 * Interface para o repositório de embeddings de momento
 */
export interface IMomentEmbeddingRepository {
    /**
     * Encontra o embedding de um momento pelo ID
     */
    findByMomentId(momentId: string): Promise<MomentEmbedding | null>

    /**
     * Salva ou atualiza o embedding de um momento
     */
    save(embedding: MomentEmbedding): Promise<MomentEmbedding>

    /**
     * Busca embeddings de múltiplos momentos
     */
    findByMomentIds(momentIds: string[]): Promise<MomentEmbedding[]>

    /**
     * Busca todos os embeddings com paginação
     */
    findAll(limit: number, offset: number): Promise<MomentEmbedding[]>

    /**
     * Busca embeddings similares a um vetor de referência
     */
    findSimilar(
        vector: number[],
        limit: number,
        minSimilarity: number,
    ): Promise<Array<{ embedding: MomentEmbedding; similarity: number }>>

    /**
     * Deleta o embedding de um momento
     */
    delete(momentId: string): Promise<boolean>

    /**
     * Conta o total de embeddings
     */
    count(): Promise<number>
}
