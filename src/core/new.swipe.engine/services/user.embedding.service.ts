import { UserEmbedding } from "../types"

import { EmbeddingParams } from "../params.type"
import { IInteractionRepository, IUserEmbeddingRepository } from "../repositories"

/**
 * Serviço para geração e gerenciamento de embeddings de usuário
 */
export class UserEmbeddingService {
    constructor(
        private readonly userEmbeddingRepository: IUserEmbeddingRepository,
        private readonly interactionRepository: IInteractionRepository,
        private readonly params: EmbeddingParams,
    ) {}

    /**
     * Gera ou atualiza o embedding de um usuário
     */
    async generateEmbedding(userId: string): Promise<UserEmbedding> {
        // Buscar interações recentes do usuário
        const interactions = await this.interactionRepository.findRecentByUserId(
            userId,
            this.params.timeWindows.interactionHistory / (24 * 60 * 60 * 1000), // converter ms para dias
            100,
        )

        // Extrair features das interações
        const interactionFeatures = this.extractInteractionFeatures(interactions)

        // Gerar embedding baseado nas features
        const vector = this.generateVectorFromFeatures(interactionFeatures)

        // Normalizar o vetor
        const normalizedVector = this.normalizeVector(vector)

        // Criar ou atualizar embedding
        const existingEmbedding = await this.userEmbeddingRepository.findByUserId(userId)

        const embedding: UserEmbedding = {
            userId,
            vector: normalizedVector,
            dimension: this.params.dimensions.embedding,
            metadata: {
                interests: this.extractInterests(interactions),
                lastInteractionAt: interactions[0]?.timestamp,
                totalInteractions: interactions.length,
            },
            createdAt: existingEmbedding?.createdAt || new Date(),
            updatedAt: new Date(),
        }

        return this.userEmbeddingRepository.save(embedding)
    }

    /**
     * Busca o embedding de um usuário
     */
    async getEmbedding(userId: string): Promise<UserEmbedding | null> {
        const embedding = await this.userEmbeddingRepository.findByUserId(userId)

        // Se não existe ou está desatualizado, gerar novo
        if (!embedding || this.isOutdated(embedding)) {
            return this.generateEmbedding(userId)
        }

        return embedding
    }

    /**
     * Atualiza o embedding incrementalmente baseado em uma nova interação
     */
    async updateEmbedding(userId: string, interactionVector: number[]): Promise<UserEmbedding> {
        const existingEmbedding = await this.userEmbeddingRepository.findByUserId(userId)

        if (!existingEmbedding) {
            return this.generateEmbedding(userId)
        }

        // Combinar embedding existente com a nova interação
        const learningRate = this.params.weights.update.default
        const updatedVector = existingEmbedding.vector.map((val, idx) => {
            return val * (1 - learningRate) + (interactionVector[idx] || 0) * learningRate
        })

        const normalizedVector = this.normalizeVector(updatedVector)

        const updatedEmbedding: UserEmbedding = {
            ...existingEmbedding,
            vector: normalizedVector,
            updatedAt: new Date(),
        }

        return this.userEmbeddingRepository.save(updatedEmbedding)
    }

    /**
     * Extrai features das interações
     */
    private extractInteractionFeatures(interactions: any[]): Record<string, number> {
        const features: Record<string, number> = {}

        // Contar interações por tipo
        const typeCounts: Record<string, number> = {}
        interactions.forEach((interaction) => {
            typeCounts[interaction.type] = (typeCounts[interaction.type] || 0) + 1
        })

        // Aplicar pesos às contagens
        Object.entries(typeCounts).forEach(([type, count]) => {
            const weight =
                this.params.weights.interactions[
                    type as keyof typeof this.params.weights.interactions
                ] || this.params.weights.interactions.default
            features[`interaction_${type}`] = count * weight
        })

        // Calcular recência média
        if (interactions.length > 0) {
            const now = Date.now()
            const avgRecency =
                interactions.reduce((sum, int) => {
                    const hoursSince = (now - new Date(int.timestamp).getTime()) / (1000 * 60 * 60)
                    return sum + Math.exp(-hoursSince / this.params.decay.interactionWeight.base)
                }, 0) / interactions.length

            features.recency = avgRecency
        }

        return features
    }

    /**
     * Gera vetor de embedding a partir das features
     */
    private generateVectorFromFeatures(features: Record<string, number>): number[] {
        const dimension = this.params.dimensions.embedding
        const vector = new Array(dimension).fill(0)

        // Distribuir features pelo vetor usando hash simples
        Object.entries(features).forEach(([key, value]) => {
            const hash = this.simpleHash(key)
            for (let i = 0; i < dimension; i++) {
                const index = (hash + i) % dimension
                vector[index] += value * Math.sin(hash * (i + 1))
            }
        })

        return vector
    }

    /**
     * Normaliza um vetor usando L2 norm
     */
    private normalizeVector(vector: number[]): number[] {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
        return magnitude > 0 ? vector.map((val) => val / magnitude) : vector
    }

    /**
     * Verifica se um embedding está desatualizado
     */
    private isOutdated(embedding: UserEmbedding): boolean {
        const ageMs = Date.now() - embedding.updatedAt.getTime()
        return ageMs > this.params.timeWindows.recentEmbeddingUpdate
    }

    /**
     * Extrai interesses das interações
     */
    private extractInterests(interactions: any[]): string[] {
        const topicCounts: Record<string, number> = {}

        interactions.forEach((interaction) => {
            const topics = interaction.metadata?.topics || []
            topics.forEach((topic: string) => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1
            })
        })

        // Retornar top 10 tópicos
        return Object.entries(topicCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([topic]) => topic)
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
        return Math.abs(hash)
    }
}
