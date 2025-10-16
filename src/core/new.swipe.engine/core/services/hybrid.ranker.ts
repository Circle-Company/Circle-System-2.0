/**
 * Hybrid Ranker
 * Ranking híbrido combinando similaridade + engagement + recency
 */

import { EngagementVector } from "../../types/embedding.generation.types"
import { cosineSimilarity } from "../../utils/normalization"

/**
 * Item para ranking
 */
export interface RankableItem {
    id: string
    contentEmbedding: number[]
    engagementVector?: EngagementVector
    createdAt: Date
    metadata?: Record<string, any>
}

/**
 * Configuração do ranker
 */
export interface HybridRankerConfig {
    contentWeight: number
    engagementWeight: number
    recencyWeight: number
    recencyDecayDays: number
    minSimilarity: number
}

/**
 * Resultado do ranking
 */
export interface RankedItem {
    id: string
    score: number
    similarityScore: number
    engagementScore: number
    recencyScore: number
    metadata?: Record<string, any>
}

/**
 * Hybrid Ranker com arquitetura desacoplada
 */
export class HybridRanker {
    private config: HybridRankerConfig

    constructor(config?: Partial<HybridRankerConfig>) {
        this.config = {
            contentWeight: 0.5,
            engagementWeight: 0.3,
            recencyWeight: 0.2,
            recencyDecayDays: 30,
            minSimilarity: 0.1,
            ...config,
        }

        // Normalizar pesos
        const totalWeight =
            this.config.contentWeight + this.config.engagementWeight + this.config.recencyWeight

        if (totalWeight > 0) {
            this.config.contentWeight /= totalWeight
            this.config.engagementWeight /= totalWeight
            this.config.recencyWeight /= totalWeight
        }
    }

    /**
     * Rankeia itens baseado em query embedding
     */
    rank(queryEmbedding: number[], items: RankableItem[]): RankedItem[] {
        console.log(`[HybridRanker] 🎯 Rankeando ${items.length} itens...`)

        const rankedItems: RankedItem[] = []

        for (const item of items) {
            // 1. Similaridade de conteúdo
            const similarityScore = cosineSimilarity(queryEmbedding, item.contentEmbedding)

            if (similarityScore < this.config.minSimilarity) {
                continue
            }

            // 2. Engagement score
            const engagementScore = this.calculateEngagementScore(item.engagementVector)

            // 3. Recency score
            const recencyScore = this.calculateRecencyScore(item.createdAt)

            // 4. Score final
            const finalScore =
                this.config.contentWeight * similarityScore +
                this.config.engagementWeight * engagementScore +
                this.config.recencyWeight * recencyScore

            rankedItems.push({
                id: item.id,
                score: finalScore,
                similarityScore,
                engagementScore,
                recencyScore,
                metadata: item.metadata,
            })
        }

        // Ordenar por score
        rankedItems.sort((a, b) => b.score - a.score)

        console.log(`[HybridRanker] ✅ ${rankedItems.length} itens rankeados`)

        return rankedItems
    }

    /**
     * Calcula engagement score normalizado
     */
    private calculateEngagementScore(engagementVector?: EngagementVector): number {
        if (!engagementVector) {
            return 0
        }

        const { features } = engagementVector

        const score =
            features.qualityScore * 0.4 +
            features.viralityScore * 0.3 +
            features.likeRate * 0.15 +
            features.commentRate * 0.15

        return Math.max(0, Math.min(1, score))
    }

    /**
     * Calcula recency score com decay exponencial
     */
    private calculateRecencyScore(createdAt: Date): number {
        const now = new Date()
        const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

        const score = Math.exp(-ageInDays / this.config.recencyDecayDays)

        return Math.max(0, Math.min(1, score))
    }

    /**
     * Obtém configuração
     */
    getConfig(): HybridRankerConfig {
        return { ...this.config }
    }

    /**
     * Atualiza configuração
     */
    updateConfig(config: Partial<HybridRankerConfig>): void {
        this.config = { ...this.config, ...config }

        // Re-normalizar pesos
        const totalWeight =
            this.config.contentWeight + this.config.engagementWeight + this.config.recencyWeight

        if (totalWeight > 0) {
            this.config.contentWeight /= totalWeight
            this.config.engagementWeight /= totalWeight
            this.config.recencyWeight /= totalWeight
        }
    }
}
