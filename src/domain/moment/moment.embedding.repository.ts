import { MomentEmbedding } from "./types"

/**
 * Interface para o repositório de embeddings de momento
 */
export interface IMomentEmbeddingRepository {
    findByMomentId(momentId: string): Promise<MomentEmbedding | null>
    save(embedding: MomentEmbedding): Promise<MomentEmbedding>
    findByMomentIds(momentIds: string[]): Promise<Array<MomentEmbedding & { momentId: string }>>
    findAll(limit: number, offset: number): Promise<Array<MomentEmbedding & { momentId: string }>>
}
