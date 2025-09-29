import { MomentSearchResult, SearchContext, SearchEngineConfig } from "../types"

import { defaultSearchConfig } from "../config"

export class RankingEngine {
    private readonly logger = console
    private readonly config: SearchEngineConfig

    constructor(config: SearchEngineConfig = defaultSearchConfig) {
        this.config = config
    }

    /**
     * Ranqueia os resultados de busca
     */
    async rank(
        results: MomentSearchResult[],
        context?: SearchContext,
    ): Promise<MomentSearchResult[]> {
        const startTime = Date.now()

        try {
            // Calcular scores de engajamento
            const engagementScored = results.map((result) => ({
                ...result,
                relevance: {
                    ...result.relevance,
                    breakdown: {
                        ...result.relevance.breakdown,
                        engagement: this.calculateEngagementScore(result),
                    },
                },
            }))

            // Calcular scores de recência
            const recencyScored = engagementScored.map((result) => ({
                ...result,
                relevance: {
                    ...result.relevance,
                    breakdown: {
                        ...result.relevance.breakdown,
                        recency: this.calculateRecencyScore(result),
                    },
                },
            }))

            // Calcular scores de qualidade
            const qualityScored = recencyScored.map((result) => ({
                ...result,
                relevance: {
                    ...result.relevance,
                    breakdown: {
                        ...result.relevance.breakdown,
                        quality: this.calculateQualityScore(result),
                    },
                },
            }))

            // Recalcular scores gerais
            const finalResults = qualityScored.map((result) => ({
                ...result,
                relevance: {
                    ...result.relevance,
                    score: this.calculateOverallScore(result.relevance.breakdown),
                },
            }))

            // Ordenar por score
            const rankedResults = finalResults.sort((a, b) => b.relevance.score - a.relevance.score)

            const duration = Date.now() - startTime
            this.logger.log(`Ranking completed in ${duration}ms for ${results.length} results`)

            return rankedResults
        } catch (error) {
            this.logger.error("Ranking failed:", error)
            throw error
        }
    }

    /**
     * Calcula o score de engajamento
     */
    private calculateEngagementScore(result: MomentSearchResult): number {
        const metrics = result.metrics

        // Normalizar métricas
        const normalizedViews = this.normalizeMetric(metrics.views, 0, 10000)
        const normalizedLikes = this.normalizeMetric(metrics.likes, 0, 1000)
        const normalizedComments = this.normalizeMetric(metrics.comments, 0, 500)
        const normalizedShares = this.normalizeMetric(metrics.shares, 0, 200)

        // Calcular taxa de engajamento
        const engagementRate =
            metrics.views > 0
                ? (metrics.likes + metrics.comments + metrics.shares) / metrics.views
                : 0

        // Score ponderado
        const score =
            (normalizedViews * 0.3 +
                normalizedLikes * 0.4 +
                normalizedComments * 0.2 +
                normalizedShares * 0.1) *
            (1 + engagementRate * 0.5)

        return Math.min(score, 1.0)
    }

    /**
     * Calcula o score de recência
     */
    private calculateRecencyScore(result: MomentSearchResult): number {
        const now = new Date()
        const createdAt = new Date(result.createdAt)
        const updatedAt = new Date(result.updatedAt)

        // Usar a data mais recente entre criação e atualização
        const mostRecentDate = updatedAt > createdAt ? updatedAt : createdAt
        const ageInHours = (now.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60)

        // Score baseado na idade (quanto mais recente, maior o score)
        if (ageInHours <= 1) {
            return 1.0 // Muito recente (última hora)
        } else if (ageInHours <= 24) {
            return 0.9 // Recente (último dia)
        } else if (ageInHours <= 168) {
            return 0.7 // Esta semana
        } else if (ageInHours <= 720) {
            return 0.5 // Este mês
        } else if (ageInHours <= 2160) {
            return 0.3 // Últimos 3 meses
        } else {
            return 0.1 // Mais antigo
        }
    }

    /**
     * Calcula o score de qualidade
     */
    private calculateQualityScore(result: MomentSearchResult): number {
        let score = 0.5 // Score base

        // Bonus por título descritivo
        if (result.title && result.title.length > 10) {
            score += 0.1
        }

        // Bonus por descrição detalhada
        if (result.description && result.description.length > 50) {
            score += 0.1
        }

        // Bonus por hashtags relevantes
        if (result.hashtags && result.hashtags.length > 0) {
            score += Math.min(result.hashtags.length * 0.05, 0.2)
        }

        // Bonus por localização
        if (result.location) {
            score += 0.1
        }

        // Bonus por mídia com duração
        if (result.media.duration && result.media.duration > 30) {
            score += 0.1
        }

        // Penalidade por status não publicado
        if (result.status !== "PUBLISHED") {
            score *= 0.5
        }

        return Math.min(score, 1.0)
    }

    /**
     * Calcula o score geral baseado nos componentes
     */
    private calculateOverallScore(breakdown: any): number {
        const weights = this.config.rankingWeights

        return (
            (breakdown.textual || 0) * weights.textual +
            (breakdown.engagement || 0) * weights.engagement +
            (breakdown.recency || 0) * weights.recency +
            (breakdown.quality || 0) * weights.quality +
            (breakdown.proximity || 0) * weights.proximity
        )
    }

    /**
     * Normaliza uma métrica para o range 0-1
     */
    private normalizeMetric(value: number, min: number, max: number): number {
        if (max === min) {
            return 0
        }

        const normalized = (value - min) / (max - min)
        return Math.max(0, Math.min(1, normalized))
    }

    /**
     * Aplica boost personalizado baseado no contexto do usuário
     */
    private applyUserContextBoost(result: MomentSearchResult, context?: SearchContext): number {
        if (!context?.userPreferences) {
            return 1.0
        }

        let boost = 1.0

        // Boost por interesses do usuário
        if (context.userPreferences.interests) {
            const matchingInterests = result.hashtags.filter((hashtag) =>
                context.userPreferences!.interests!.some((interest) =>
                    hashtag.toLowerCase().includes(interest.toLowerCase()),
                ),
            )
            boost += matchingInterests.length * 0.1
        }

        // Penalidade por usuários bloqueados
        if (context.userPreferences.blockedUsers?.includes(result.ownerId)) {
            boost *= 0.1
        }

        // Penalidade por usuários silenciados
        if (context.userPreferences.mutedUsers?.includes(result.ownerId)) {
            boost *= 0.3
        }

        return Math.min(boost, 2.0) // Máximo de 2x boost
    }
}
