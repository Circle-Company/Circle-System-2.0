import { RankingFactors, RankingWeights, SearchCriteria } from "@/domain/user.search.engine/types"

import { UserSearchResult } from "@/domain/user.search.engine/entities/user.search.result.entity"

/**
 * Ranking Service
 *
 * Serviço responsável por calcular scores de relevância e ranking
 * para resultados de busca de usuários.
 */
export interface RankingConfig {
    weights: RankingWeights
    factors: RankingFactors
    thresholds: {
        minScore: number
        highQualityThreshold: number
        influencerThreshold: number
    }
}

export interface RankingResult {
    user: UserSearchResult
    score: number
    factors: {
        relevance: number
        social: number
        engagement: number
        proximity: number
        verification: number
        content: number
    }
    ranking: number
}

export class RankingService {
    private readonly config: RankingConfig

    constructor(config: RankingConfig) {
        this.config = config
    }

    /**
     * Aplica algoritmo de ranking aos resultados de busca
     */
    async rankResults(
        results: UserSearchResult[],
        criteria: SearchCriteria,
    ): Promise<RankingResult[]> {
        const rankingResults: RankingResult[] = []

        for (const user of results) {
            const score = await this.calculateRelevanceScore(user, criteria)
            const factors = await this.calculateRankingFactors(user, criteria)

            rankingResults.push({
                user,
                score,
                factors,
                ranking: 0, // Será definido após ordenação
            })
        }

        // Ordena por score decrescente
        rankingResults.sort((a, b) => b.score - a.score)

        // Atualiza rankings
        rankingResults.forEach((result, index) => {
            result.ranking = index + 1
        })

        return rankingResults
    }

    /**
     * Calcula score de relevância para um usuário específico
     */
    async calculateRelevanceScore(
        user: UserSearchResult,
        criteria: SearchCriteria,
    ): Promise<number> {
        const factors = await this.calculateRankingFactors(user, criteria)

        // Aplica pesos aos fatores
        const weightedScore =
            factors.relevance * this.config.weights.relevance +
            factors.social * this.config.weights.social +
            factors.engagement * this.config.weights.engagement +
            factors.proximity * this.config.weights.proximity +
            factors.verification * this.config.weights.verification +
            factors.content * this.config.weights.content

        // Normaliza para 0-100
        return Math.min(100, Math.max(0, weightedScore * 100))
    }

    /**
     * Calcula fatores individuais de ranking
     */
    async calculateRankingFactors(
        user: UserSearchResult,
        criteria: SearchCriteria,
    ): Promise<{
        relevance: number
        social: number
        engagement: number
        proximity: number
        verification: number
        content: number
    }> {
        return {
            relevance: this.calculateRelevanceFactor(user, criteria),
            social: this.calculateSocialFactor(user, criteria),
            engagement: this.calculateEngagementFactor(user, criteria),
            proximity: this.calculateProximityFactor(user, criteria),
            verification: this.calculateVerificationFactor(user, criteria),
            content: this.calculateContentFactor(user, criteria),
        }
    }

    /**
     * Calcula fator de relevância baseado na correspondência do termo de busca
     */
    private calculateRelevanceFactor(user: UserSearchResult, criteria: SearchCriteria): number {
        const searchTerm = criteria.searchTerm.toLowerCase()
        let score = 0

        // Correspondência exata no username
        if (user.username.toLowerCase() === searchTerm) {
            score += this.config.factors.usernameMatch
        }
        // Correspondência no início do username
        else if (user.username.toLowerCase().startsWith(searchTerm)) {
            score += this.config.factors.usernameMatch * 0.8
        }
        // Correspondência parcial no username
        else if (user.username.toLowerCase().includes(searchTerm)) {
            score += this.config.factors.usernameMatch * 0.6
        }

        // Correspondência no nome
        if (user.name) {
            const name = user.name.toLowerCase()
            if (name === searchTerm) {
                score += this.config.factors.nameMatch
            } else if (name.startsWith(searchTerm)) {
                score += this.config.factors.nameMatch * 0.8
            } else if (name.includes(searchTerm)) {
                score += this.config.factors.nameMatch * 0.6
            }
        }

        // Correspondência na descrição
        if (user.description) {
            const description = user.description.toLowerCase()
            if (description.includes(searchTerm)) {
                score += this.config.factors.descriptionMatch * 0.4
            }
        }

        return Math.min(1, score)
    }

    /**
     * Calcula fator social baseado em relacionamentos e conexões
     */
    private calculateSocialFactor(user: UserSearchResult, criteria: SearchCriteria): number {
        let score = 0

        // Status de relacionamento
        const relationship = user.relationshipStatus

        if (relationship.youFollow && relationship.followsYou) {
            score += this.config.factors.relationshipStrength * 1.0 // Seguindo mutuamente
        } else if (relationship.followsYou) {
            score += this.config.factors.relationshipStrength * 0.7 // Te segue
        } else if (relationship.youFollow) {
            score += this.config.factors.relationshipStrength * 0.5 // Você segue
        }

        // Penalidades por bloqueios e silenciamentos
        if (relationship.isBlocked) {
            score = 0 // Bloqueios eliminam completamente
        } else if (relationship.isMuted) {
            score *= 0.3 // Silenciamentos reduzem significativamente
        }

        // Número de seguidores (normalizado)
        const followersScore = Math.min(1, Math.log10(user.followersCount + 1) / 5)
        score += followersScore * this.config.factors.followersCount * 0.3

        return Math.min(1, score)
    }

    /**
     * Calcula fator de engajamento baseado em métricas de atividade
     */
    private calculateEngagementFactor(user: UserSearchResult, criteria: SearchCriteria): number {
        let score = 0

        // Taxa de engajamento
        score += user.engagementRate * this.config.factors.engagementRate

        // Nível de atividade baseado no número de conteúdo
        const activityLevel = Math.min(1, Math.log10(user.contentCount + 1) / 3)
        score += activityLevel * this.config.factors.activityLevel

        // Penalidade para usuários inativos
        if (!user.isActive) {
            score *= 0.1
        }

        return Math.min(1, score)
    }

    /**
     * Calcula fator de proximidade geográfica
     */
    private calculateProximityFactor(user: UserSearchResult, criteria: SearchCriteria): number {
        if (user.distance === null || user.distance === undefined) {
            return 0.5 // Score neutro quando não há informação de localização
        }

        // Score decresce com a distância
        const maxDistance = 100 // km
        const normalizedDistance = Math.min(1, user.distance / maxDistance)

        // Score inversamente proporcional à distância
        return (1 - normalizedDistance) * this.config.factors.distance
    }

    /**
     * Calcula fator de verificação
     */
    private calculateVerificationFactor(user: UserSearchResult, criteria: SearchCriteria): number {
        let score = 0

        // Usuários verificados recebem boost
        if (user.isVerified) {
            score += this.config.factors.verificationStatus
        }

        // Score de reputação influencia o fator de verificação
        const reputationScore = user.reputationScore / 100
        score += reputationScore * this.config.factors.verificationStatus * 0.5

        return Math.min(1, score)
    }

    /**
     * Calcula fator de conteúdo baseado na produção de conteúdo
     */
    private calculateContentFactor(user: UserSearchResult, criteria: SearchCriteria): number {
        // Normaliza o número de conteúdo
        const contentScore = Math.min(1, Math.log10(user.contentCount + 1) / 4)

        return contentScore * this.config.factors.contentCount
    }

    /**
     * Aplica ajustes contextuais baseados no tipo de busca
     */
    applyContextualAdjustments(
        rankingResults: RankingResult[],
        criteria: SearchCriteria,
    ): RankingResult[] {
        switch (criteria.searchType) {
            case "related":
                return this.adjustForRelatedSearch(rankingResults, criteria)

            case "unknown":
                return this.adjustForUnknownSearch(rankingResults, criteria)

            case "verified":
                return this.adjustForVerifiedSearch(rankingResults, criteria)

            case "nearby":
                return this.adjustForNearbySearch(rankingResults, criteria)

            default:
                return rankingResults
        }
    }

    private adjustForRelatedSearch(
        rankingResults: RankingResult[],
        criteria: SearchCriteria,
    ): RankingResult[] {
        // Para buscas relacionadas, prioriza força do relacionamento social
        return rankingResults
            .map((result) => ({
                ...result,
                score: result.score * (1 + result.factors.social * 0.3),
            }))
            .sort((a, b) => b.score - a.score)
    }

    private adjustForUnknownSearch(
        rankingResults: RankingResult[],
        criteria: SearchCriteria,
    ): RankingResult[] {
        // Para buscas de desconhecidos, prioriza proximidade e engajamento
        return rankingResults
            .map((result) => ({
                ...result,
                score:
                    result.score *
                    (1 + (result.factors.proximity + result.factors.engagement) * 0.2),
            }))
            .sort((a, b) => b.score - a.score)
    }

    private adjustForVerifiedSearch(
        rankingResults: RankingResult[],
        criteria: SearchCriteria,
    ): RankingResult[] {
        // Para buscas de verificados, prioriza status de verificação
        return rankingResults
            .filter((result) => result.user.isVerified)
            .map((result) => ({
                ...result,
                score: result.score * (1 + result.factors.verification * 0.5),
            }))
            .sort((a, b) => b.score - a.score)
    }

    private adjustForNearbySearch(
        rankingResults: RankingResult[],
        criteria: SearchCriteria,
    ): RankingResult[] {
        // Para buscas próximas, prioriza proximidade geográfica
        return rankingResults
            .filter((result) => result.user.distance !== null && result.user.distance !== undefined)
            .map((result) => ({
                ...result,
                score: result.score * (1 + result.factors.proximity * 0.6),
            }))
            .sort((a, b) => b.score - a.score)
    }

    /**
     * Filtra resultados baseado em thresholds mínimos
     */
    filterByThresholds(rankingResults: RankingResult[]): RankingResult[] {
        return rankingResults.filter((result) => result.score >= this.config.thresholds.minScore)
    }

    /**
     * Identifica resultados de alta qualidade
     */
    getHighQualityResults(rankingResults: RankingResult[]): RankingResult[] {
        return rankingResults.filter(
            (result) =>
                result.score >= this.config.thresholds.highQualityThreshold &&
                result.user.isVerified &&
                result.user.engagementRate > 0.05 &&
                result.user.followersCount > 100,
        )
    }

    /**
     * Identifica influenciadores
     */
    getInfluencerResults(rankingResults: RankingResult[]): RankingResult[] {
        return rankingResults.filter(
            (result) =>
                result.score >= this.config.thresholds.influencerThreshold &&
                result.user.followersCount > 1000 &&
                result.user.engagementRate > 0.03,
        )
    }

    /**
     * Gera relatório de ranking
     */
    generateRankingReport(rankingResults: RankingResult[]): {
        totalResults: number
        highQualityCount: number
        influencerCount: number
        averageScore: number
        scoreDistribution: {
            excellent: number // > 80
            good: number // 60-80
            average: number // 40-60
            poor: number // < 40
        }
        topFactors: Array<{
            factor: string
            averageWeight: number
        }>
    } {
        const totalResults = rankingResults.length
        const highQualityResults = this.getHighQualityResults(rankingResults)
        const influencerResults = this.getInfluencerResults(rankingResults)

        const averageScore =
            totalResults > 0
                ? rankingResults.reduce((sum, result) => sum + result.score, 0) / totalResults
                : 0

        const scoreDistribution = {
            excellent: rankingResults.filter((r) => r.score > 80).length,
            good: rankingResults.filter((r) => r.score >= 60 && r.score <= 80).length,
            average: rankingResults.filter((r) => r.score >= 40 && r.score < 60).length,
            poor: rankingResults.filter((r) => r.score < 40).length,
        }

        const factorAverages = {
            relevance:
                rankingResults.reduce((sum, r) => sum + r.factors.relevance, 0) / totalResults,
            social: rankingResults.reduce((sum, r) => sum + r.factors.social, 0) / totalResults,
            engagement:
                rankingResults.reduce((sum, r) => sum + r.factors.engagement, 0) / totalResults,
            proximity:
                rankingResults.reduce((sum, r) => sum + r.factors.proximity, 0) / totalResults,
            verification:
                rankingResults.reduce((sum, r) => sum + r.factors.verification, 0) / totalResults,
            content: rankingResults.reduce((sum, r) => sum + r.factors.content, 0) / totalResults,
        }

        const topFactors = Object.entries(factorAverages)
            .map(([factor, averageWeight]) => ({ factor, averageWeight }))
            .sort((a, b) => b.averageWeight - a.averageWeight)

        return {
            totalResults,
            highQualityCount: highQualityResults.length,
            influencerCount: influencerResults.length,
            averageScore,
            scoreDistribution,
            topFactors,
        }
    }
}
