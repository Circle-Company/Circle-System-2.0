import { EmbeddingGenerationData, MomentEmbedding } from "../types"

import { EmbeddingParams } from "../params.type"
import { IMomentEmbeddingRepository } from "../repositories"

/**
 * Serviço para geração e gerenciamento de embeddings de momento
 */
export class MomentEmbeddingService {
    constructor(
        private readonly momentEmbeddingRepository: IMomentEmbeddingRepository,
        private readonly params: EmbeddingParams,
    ) {}

    /**
     * Gera embedding para um momento
     */
    async generateEmbedding(
        momentId: string,
        data: EmbeddingGenerationData,
    ): Promise<MomentEmbedding> {
        // Extrair embedding do texto
        const textEmbedding = this.extractTextEmbedding(data.textContent || "")

        // Extrair embedding das tags
        const tagsEmbedding = this.extractTagsEmbedding(data.tags || [])

        // Combinar embeddings com pesos
        const combinedEmbedding = this.combineEmbeddings([
            { vector: textEmbedding, weight: this.params.weights.content.text },
            { vector: tagsEmbedding, weight: this.params.weights.content.tags },
        ])

        // Normalizar
        const normalizedVector = this.normalizeVector(combinedEmbedding)

        // Criar embedding
        const embedding: MomentEmbedding = {
            momentId,
            vector: normalizedVector,
            dimension: this.params.dimensions.embedding,
            metadata: {
                topics: data.topics || [],
                ...data.metadata,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        return this.momentEmbeddingRepository.save(embedding)
    }

    /**
     * Busca o embedding de um momento
     */
    async getEmbedding(momentId: string): Promise<MomentEmbedding | null> {
        return this.momentEmbeddingRepository.findByMomentId(momentId)
    }

    /**
     * Atualiza embedding de um momento
     */
    async updateEmbedding(
        momentId: string,
        data: Partial<EmbeddingGenerationData>,
    ): Promise<MomentEmbedding> {
        const existing = await this.momentEmbeddingRepository.findByMomentId(momentId)

        if (!existing) {
            throw new Error(`Embedding not found for moment ${momentId}`)
        }

        // Se houver novo conteúdo, regenerar
        if (data.textContent || data.tags) {
            return this.generateEmbedding(momentId, data as EmbeddingGenerationData)
        }

        // Caso contrário, apenas atualizar metadata
        const updated: MomentEmbedding = {
            ...existing,
            metadata: {
                ...existing.metadata,
                ...data.metadata,
            },
            updatedAt: new Date(),
        }

        return this.momentEmbeddingRepository.save(updated)
    }

    /**
     * Busca momentos similares
     */
    async findSimilar(
        momentId: string,
        limit: number = 10,
        minSimilarity: number = 0.7,
    ): Promise<Array<{ momentId: string; similarity: number }>> {
        const embedding = await this.momentEmbeddingRepository.findByMomentId(momentId)

        if (!embedding) {
            return []
        }

        const similar = await this.momentEmbeddingRepository.findSimilar(
            embedding.vector,
            limit,
            minSimilarity,
        )

        return similar.map((item) => ({
            momentId: item.embedding.momentId,
            similarity: item.similarity,
        }))
    }

    /**
     * Extrai embedding de texto
     */
    private extractTextEmbedding(text: string): number[] {
        if (!text || text.trim().length === 0) {
            return new Array(this.params.dimensions.embedding).fill(0)
        }

        // Usar hash para gerar embedding determinístico
        const hash = this.simpleHash(text)
        const embedding = new Array(this.params.dimensions.embedding).fill(0)

        for (let i = 0; i < this.params.dimensions.embedding; i++) {
            embedding[i] = (Math.sin(hash * (i + 1)) + 1) / 2
        }

        return this.normalizeVector(embedding)
    }

    /**
     * Extrai embedding de tags
     */
    private extractTagsEmbedding(tags: string[]): number[] {
        if (tags.length === 0) {
            return new Array(this.params.dimensions.embedding).fill(0)
        }

        // Combinar hashes de todas as tags
        const combinedText = tags.join(" ")
        return this.extractTextEmbedding(combinedText)
    }

    /**
     * Combina múltiplos embeddings com pesos
     */
    private combineEmbeddings(embeddings: Array<{ vector: number[]; weight: number }>): number[] {
        const dimension = this.params.dimensions.embedding
        const combined = new Array(dimension).fill(0)

        // Normalizar pesos
        const totalWeight = embeddings.reduce((sum, e) => sum + e.weight, 0)

        embeddings.forEach(({ vector, weight }) => {
            const normalizedWeight = weight / totalWeight
            for (let i = 0; i < dimension; i++) {
                combined[i] += (vector[i] || 0) * normalizedWeight
            }
        })

        return combined
    }

    /**
     * Normaliza um vetor usando L2 norm
     */
    private normalizeVector(vector: number[]): number[] {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
        return magnitude > 0 ? vector.map((val) => val / magnitude) : vector
    }

    /**
     * Calcula similaridade de cosseno entre dois vetores
     */
    calculateCosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error("Vectors must have the same dimension")
        }

        let dotProduct = 0
        let magnitudeA = 0
        let magnitudeB = 0

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i]
            magnitudeA += a[i] * a[i]
            magnitudeB += b[i] * b[i]
        }

        const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)
        return magnitude > 0 ? dotProduct / magnitude : 0
    }

    /**
     * Hash simples para strings
     */
    private simpleHash(str: string): number {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i)
            hash = hash & hash
        }
        return Math.abs(hash) / 2147483647 // Normalizar para 0-1
    }
}
