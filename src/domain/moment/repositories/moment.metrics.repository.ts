import { MomentMetricsEntity } from "../entities/moment.metrics.entity"

// ===== INTERFACE DO REPOSITÓRIO DE MÉTRICAS =====
export interface IMomentMetricsRepository {
    // Operações básicas
    create(metrics: MomentMetricsEntity): Promise<MomentMetricsEntity>
    findById(id: string): Promise<MomentMetricsEntity | null>
    findByMomentId(momentId: string): Promise<MomentMetricsEntity | null>
    update(metrics: MomentMetricsEntity): Promise<MomentMetricsEntity>
    delete(id: string): Promise<void>

    // Operações de busca avançada
    findTopByViews(limit?: number, offset?: number): Promise<MomentMetricsEntity[]>
    findTopByEngagement(limit?: number, offset?: number): Promise<MomentMetricsEntity[]>
    findTopByViralScore(limit?: number, offset?: number): Promise<MomentMetricsEntity[]>
    findTopByTrendingScore(limit?: number, offset?: number): Promise<MomentMetricsEntity[]>

    // Operações de análise
    findTrendingContent(limit?: number, offset?: number): Promise<MomentMetricsEntity[]>
    findViralContent(limit?: number, offset?: number): Promise<MomentMetricsEntity[]>
    findHighEngagementContent(limit?: number, offset?: number): Promise<MomentMetricsEntity[]>
    findHighQualityContent(limit?: number, offset?: number): Promise<MomentMetricsEntity[]>

    // Operações de agregação
    getAverageMetrics(): Promise<{
        averageViews: number
        averageEngagement: number
        averageViralScore: number
        averageTrendingScore: number
    }>

    getMetricsDistribution(): Promise<{
        viewsDistribution: Record<string, number>
        engagementDistribution: Record<string, number>
        viralScoreDistribution: Record<string, number>
        trendingScoreDistribution: Record<string, number>
    }>

    getMetricsByTimeRange(
        startDate: Date,
        endDate: Date,
        limit?: number,
        offset?: number,
    ): Promise<MomentMetricsEntity[]>

    // Operações de contagem
    countByViewsRange(minViews: number, maxViews: number): Promise<number>
    countByEngagementRange(minEngagement: number, maxEngagement: number): Promise<number>
    countByViralScoreRange(minScore: number, maxScore: number): Promise<number>
    countByTrendingScoreRange(minScore: number, maxScore: number): Promise<number>

    // Operações de existência
    exists(id: string): Promise<boolean>
    existsByMomentId(momentId: string): Promise<boolean>

    // Operações em lote
    createMany(metrics: MomentMetricsEntity[]): Promise<MomentMetricsEntity[]>
    updateMany(metrics: MomentMetricsEntity[]): Promise<MomentMetricsEntity[]>
    deleteMany(ids: string[]): Promise<void>

    // Operações de paginação
    findPaginated(
        page: number,
        limit: number,
        filters?: MomentMetricsFilters,
    ): Promise<{
        metrics: MomentMetricsEntity[]
        total: number
        page: number
        limit: number
        totalPages: number
    }>
}

// ===== FILTROS DE MÉTRICAS =====
export interface MomentMetricsFilters {
    // Filtros de visualização
    minViews?: number
    maxViews?: number
    minUniqueViews?: number
    maxUniqueViews?: number
    minCompletionRate?: number
    maxCompletionRate?: number
    minWatchTime?: number
    maxWatchTime?: number

    // Filtros de engajamento
    minLikes?: number
    maxLikes?: number
    minComments?: number
    maxComments?: number
    minEngagementRate?: number
    maxEngagementRate?: number

    // Filtros de performance
    maxLoadTime?: number
    maxBufferTime?: number
    maxErrorRate?: number

    // Filtros virais
    minViralScore?: number
    maxViralScore?: number
    minTrendingScore?: number
    maxTrendingScore?: number
    minGrowthRate?: number
    maxGrowthRate?: number

    // Filtros de qualidade
    minContentQuality?: number
    maxContentQuality?: number
    minAudioQuality?: number
    maxAudioQuality?: number
    minVideoQuality?: number
    maxVideoQuality?: number

    // Filtros temporais
    startDate?: Date
    endDate?: Date
    lastUpdateAfter?: Date
    lastUpdateBefore?: Date

    // Filtros de qualidade de dados
    minDataQuality?: number
    maxDataQuality?: number
    minConfidenceLevel?: number
    maxConfidenceLevel?: number
}

// ===== OPÇÕES DE ORDENAÇÃO =====
export interface MomentMetricsSortOptions {
    field:
        | "views.totalViews"
        | "views.uniqueViews"
        | "views.averageWatchTime"
        | "views.averageCompletionRate"
        | "engagement.totalLikes"
        | "engagement.totalComments"
        | "engagement.likeRate"
        | "engagement.commentRate"
        | "performance.loadTime"
        | "performance.bufferTime"
        | "viral.viralScore"
        | "viral.trendingScore"
        | "viral.growthRate"
        | "content.contentQualityScore"
        | "content.audioQualityScore"
        | "content.videoQualityScore"
        | "lastMetricsUpdate"
        | "dataQuality"
        | "confidenceLevel"
    direction: "ASC" | "DESC"
}

// ===== OPÇÕES DE BUSCA =====
export interface MomentMetricsSearchOptions {
    query: string
    fields?: ("momentId" | "metricsVersion")[]
    limit?: number
    offset?: number
    sort?: MomentMetricsSortOptions
    filters?: MomentMetricsFilters
}

// ===== ESTATÍSTICAS DE MÉTRICAS =====
export interface MomentMetricsStats {
    totalMetrics: number
    averageViews: number
    averageEngagement: number
    averageViralScore: number
    averageTrendingScore: number
    topPerformingContent: number
    trendingContent: number
    viralContent: number
    highQualityContent: number
    lastUpdate: Date
}

// ===== ANÁLISE DE MÉTRICAS =====
export interface MomentMetricsAnalysis {
    // Análise de performance
    performanceAnalysis: {
        topPerformers: MomentMetricsEntity[]
        underPerformers: MomentMetricsEntity[]
        averagePerformance: number
        performanceTrend: "up" | "down" | "stable"
    }

    // Análise de engajamento
    engagementAnalysis: {
        highEngagement: MomentMetricsEntity[]
        lowEngagement: MomentMetricsEntity[]
        averageEngagement: number
        engagementTrend: "up" | "down" | "stable"
    }

    // Análise de viralidade
    viralAnalysis: {
        viralContent: MomentMetricsEntity[]
        trendingContent: MomentMetricsEntity[]
        averageViralScore: number
        viralTrend: "up" | "down" | "stable"
    }

    // Análise de qualidade
    qualityAnalysis: {
        highQuality: MomentMetricsEntity[]
        lowQuality: MomentMetricsEntity[]
        averageQuality: number
        qualityTrend: "up" | "down" | "stable"
    }

    // Recomendações
    recommendations: {
        contentOptimization: string[]
        engagementImprovement: string[]
        viralPotential: string[]
        qualityEnhancement: string[]
    }
}

// ===== SERVIÇO DE ANÁLISE DE MÉTRICAS =====
export class MomentMetricsAnalysisService {
    constructor(private repository: IMomentMetricsRepository) {}

    /**
     * Analisa métricas de um momento específico
     */
    async analyzeMoment(momentId: string): Promise<MomentMetricsAnalysis> {
        const metrics = await this.repository.findByMomentId(momentId)
        if (!metrics) {
            throw new Error(`Métricas não encontradas para o momento ${momentId}`)
        }

        return this.analyzeMetrics([metrics])
    }

    /**
     * Analisa múltiplas métricas
     */
    async analyzeMetrics(metrics: MomentMetricsEntity[]): Promise<MomentMetricsAnalysis> {
        if (metrics.length === 0) {
            throw new Error("Nenhuma métrica fornecida para análise")
        }

        // Calcular médias
        const averageViews =
            metrics.reduce((sum, m) => sum + m.views.totalViews, 0) / metrics.length
        const averageEngagement =
            metrics.reduce((sum, m) => sum + m.calculateEngagementRate(), 0) / metrics.length
        const averageViralScore =
            metrics.reduce((sum, m) => sum + m.viral.viralScore, 0) / metrics.length
        const averageTrendingScore =
            metrics.reduce((sum, m) => sum + m.viral.trendingScore, 0) / metrics.length

        // Classificar conteúdo
        const topPerformers = metrics
            .filter((m) => m.views.totalViews > averageViews * 1.5)
            .sort((a, b) => b.views.totalViews - a.views.totalViews)
            .slice(0, 10)

        const underPerformers = metrics
            .filter((m) => m.views.totalViews < averageViews * 0.5)
            .sort((a, b) => a.views.totalViews - b.views.totalViews)
            .slice(0, 10)

        const highEngagement = metrics
            .filter((m) => m.calculateEngagementRate() > averageEngagement * 1.5)
            .sort((a, b) => b.calculateEngagementRate() - a.calculateEngagementRate())
            .slice(0, 10)

        const lowEngagement = metrics
            .filter((m) => m.calculateEngagementRate() < averageEngagement * 0.5)
            .sort((a, b) => a.calculateEngagementRate() - b.calculateEngagementRate())
            .slice(0, 10)

        const viralContent = metrics
            .filter((m) => m.viral.viralScore > 70)
            .sort((a, b) => b.viral.viralScore - a.viral.viralScore)
            .slice(0, 10)

        const trendingContent = metrics
            .filter((m) => m.viral.trendingScore > 70)
            .sort((a, b) => b.viral.trendingScore - a.viral.trendingScore)
            .slice(0, 10)

        const highQuality = metrics
            .filter((m) => m.content.contentQualityScore > 80)
            .sort((a, b) => b.content.contentQualityScore - a.content.contentQualityScore)
            .slice(0, 10)

        const lowQuality = metrics
            .filter((m) => m.content.contentQualityScore < 40)
            .sort((a, b) => a.content.contentQualityScore - b.content.contentQualityScore)
            .slice(0, 10)

        // Gerar recomendações
        const recommendations = this.generateRecommendations(metrics, {
            averageViews,
            averageEngagement,
            averageViralScore,
            averageTrendingScore,
        })

        return {
            performanceAnalysis: {
                topPerformers,
                underPerformers,
                averagePerformance: averageViews,
                performanceTrend: "stable", // TODO: Implementar análise de tendência
            },
            engagementAnalysis: {
                highEngagement,
                lowEngagement,
                averageEngagement,
                engagementTrend: "stable", // TODO: Implementar análise de tendência
            },
            viralAnalysis: {
                viralContent,
                trendingContent,
                averageViralScore,
                viralTrend: "stable", // TODO: Implementar análise de tendência
            },
            qualityAnalysis: {
                highQuality,
                lowQuality,
                averageQuality:
                    metrics.reduce((sum, m) => sum + m.content.contentQualityScore, 0) /
                    metrics.length,
                qualityTrend: "stable", // TODO: Implementar análise de tendência
            },
            recommendations,
        }
    }

    /**
     * Gera recomendações baseadas nas métricas
     */
    private generateRecommendations(
        metrics: MomentMetricsEntity[],
        averages: {
            averageViews: number
            averageEngagement: number
            averageViralScore: number
            averageTrendingScore: number
        },
    ): {
        contentOptimization: string[]
        engagementImprovement: string[]
        viralPotential: string[]
        qualityEnhancement: string[]
    } {
        const recommendations = {
            contentOptimization: [] as string[],
            engagementImprovement: [] as string[],
            viralPotential: [] as string[],
            qualityEnhancement: [] as string[],
        }

        // Análise de otimização de conteúdo
        const lowViews = metrics.filter((m) => m.views.totalViews < averages.averageViews * 0.5)
        if (lowViews.length > 0) {
            recommendations.contentOptimization.push(
                `${lowViews.length} conteúdos com baixa visualização. Considere melhorar títulos e thumbnails.`,
            )
        }

        // Análise de engajamento
        const lowEngagement = metrics.filter(
            (m) => m.calculateEngagementRate() < averages.averageEngagement * 0.5,
        )
        if (lowEngagement.length > 0) {
            recommendations.engagementImprovement.push(
                `${lowEngagement.length} conteúdos com baixo engajamento. Considere criar conteúdo mais interativo.`,
            )
        }

        // Análise de potencial viral
        const highViralPotential = metrics.filter((m) => m.viral.viralScore > 70)
        if (highViralPotential.length > 0) {
            recommendations.viralPotential.push(
                `${highViralPotential.length} conteúdos com alto potencial viral. Considere promover estes conteúdos.`,
            )
        }

        // Análise de qualidade
        const lowQuality = metrics.filter((m) => m.content.contentQualityScore < 40)
        if (lowQuality.length > 0) {
            recommendations.qualityEnhancement.push(
                `${lowQuality.length} conteúdos com baixa qualidade. Considere melhorar a produção.`,
            )
        }

        return recommendations
    }
}
