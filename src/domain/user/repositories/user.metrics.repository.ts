/**
 * User Metrics Repository Interface
 *
 * Defines contract for user metrics data access operations
 */

import { UserMetrics } from "../entities/user.metrics.entity"

export interface IUserMetricsRepository {
    // Operações básicas
    create(metrics: UserMetrics): Promise<UserMetrics>
    findById(id: string): Promise<UserMetrics | null>
    findByUserId(userId: string): Promise<UserMetrics | null>
    update(metrics: UserMetrics): Promise<UserMetrics>
    delete(id: string): Promise<void>

    // Operações de busca avançada
    findTopByEngagement(limit?: number, offset?: number): Promise<UserMetrics[]>
    findTopByFollowers(limit?: number, offset?: number): Promise<UserMetrics[]>
    findTopByActivity(limit?: number, offset?: number): Promise<UserMetrics[]>
    findTopByGrowth(limit?: number, offset?: number): Promise<UserMetrics[]>

    // Operações de análise
    findActiveUsers(
        timeThresholdDays?: number,
        limit?: number,
        offset?: number,
    ): Promise<UserMetrics[]>
    findInfluencers(
        minFollowers?: number,
        minEngagementRate?: number,
        limit?: number,
        offset?: number,
    ): Promise<UserMetrics[]>
    findUsersWithModerationIssues(limit?: number, offset?: number): Promise<UserMetrics[]>

    // Operações de agregação
    getAverageMetrics(): Promise<{
        averageEngagementRate: number
        averageActivityRate: number
        averageGrowthRate: number
        averageFollowers: number
    }>

    getMetricsDistribution(): Promise<{
        engagementDistribution: Record<string, number>
        activityDistribution: Record<string, number>
        followersDistribution: Record<string, number>
        growthDistribution: Record<string, number>
    }>

    getMetricsByTimeRange(
        startDate: Date,
        endDate: Date,
        limit?: number,
        offset?: number,
    ): Promise<UserMetrics[]>

    // Operações de contagem
    countByEngagementRange(minEngagement: number, maxEngagement: number): Promise<number>
    countByFollowersRange(minFollowers: number, maxFollowers: number): Promise<number>
    countByActivityRange(minActivity: number, maxActivity: number): Promise<number>
    countByGrowthRange(minGrowth: number, maxGrowth: number): Promise<number>

    // Operações de existência
    exists(id: string): Promise<boolean>
    existsByUserId(userId: string): Promise<boolean>

    // Operações em lote
    createMany(metrics: UserMetrics[]): Promise<UserMetrics[]>
    updateMany(metrics: UserMetrics[]): Promise<UserMetrics[]>
    deleteMany(ids: string[]): Promise<void>

    // Operações de paginação
    findPaginated(
        page: number,
        limit: number,
        filters?: UserMetricsFilters,
    ): Promise<{
        metrics: UserMetrics[]
        total: number
        page: number
        limit: number
        totalPages: number
    }>
}

// ===== FILTROS DE MÉTRICAS =====
export interface UserMetricsFilters {
    // Filtros de engajamento
    minEngagementRate?: number
    maxEngagementRate?: number
    minReachRate?: number
    maxReachRate?: number

    // Filtros de atividade
    minMomentsPerDay?: number
    maxMomentsPerDay?: number
    minMemoriesPerDay?: number
    maxMemoriesPerDay?: number

    // Filtros sociais
    minFollowers?: number
    maxFollowers?: number
    minFollowing?: number
    maxFollowing?: number

    // Filtros de crescimento
    minGrowthRate?: number
    maxGrowthRate?: number
    minMomentsGrowth?: number
    maxMomentsGrowth?: number
    minFollowersGrowth?: number
    maxFollowersGrowth?: number

    // Filtros de moderação
    minReportsReceived?: number
    maxReportsReceived?: number
    minViolations?: number
    maxViolations?: number

    // Filtros temporais
    startDate?: Date
    endDate?: Date
    lastUpdateAfter?: Date
    lastUpdateBefore?: Date

    // Filtros de qualidade de dados
    minDataQuality?: number
    maxDataQuality?: number
}

// ===== OPÇÕES DE ORDENAÇÃO =====
export interface UserMetricsSortOptions {
    field:
        | "engagementRate"
        | "reachRate"
        | "momentsPerDayAverage"
        | "memoriesPerDayAverage"
        | "totalFollowers"
        | "totalFollowing"
        | "momentsPublishedGrowthRate30d"
        | "followerGrowthRate30d"
        | "engagementGrowthRate30d"
        | "reportsReceived"
        | "violationsCount"
        | "lastMetricsUpdate"
        | "createdAt"
        | "updatedAt"
    direction: "ASC" | "DESC"
}

// ===== OPÇÕES DE BUSCA =====
export interface UserMetricsSearchOptions {
    query: string
    fields?: ("userId" | "id")[]
    limit?: number
    offset?: number
    sort?: UserMetricsSortOptions
    filters?: UserMetricsFilters
}

// ===== ESTATÍSTICAS DE MÉTRICAS =====
export interface UserMetricsStats {
    totalMetrics: number
    averageEngagementRate: number
    averageActivityRate: number
    averageGrowthRate: number
    averageFollowers: number
    topPerformers: number
    influencers: number
    usersWithIssues: number
    lastUpdate: Date
}

// ===== ANÁLISE DE MÉTRICAS =====
export interface UserMetricsAnalysis {
    // Análise de performance
    performanceAnalysis: {
        topPerformers: UserMetrics[]
        underPerformers: UserMetrics[]
        averagePerformance: number
        performanceTrend: "up" | "down" | "stable"
    }

    // Análise de engajamento
    engagementAnalysis: {
        highEngagement: UserMetrics[]
        lowEngagement: UserMetrics[]
        averageEngagement: number
        engagementTrend: "up" | "down" | "stable"
    }

    // Análise de crescimento
    growthAnalysis: {
        highGrowth: UserMetrics[]
        lowGrowth: UserMetrics[]
        averageGrowth: number
        growthTrend: "up" | "down" | "stable"
    }

    // Análise de atividade
    activityAnalysis: {
        highActivity: UserMetrics[]
        lowActivity: UserMetrics[]
        averageActivity: number
        activityTrend: "up" | "down" | "stable"
    }

    // Recomendações
    recommendations: {
        contentOptimization: string[]
        engagementImprovements: string[]
        growthStrategies: string[]
        activityEnhancement: string[]
    }
}

// ===== SERVIÇO DE ANÁLISE DE MÉTRICAS =====
export class UserMetricsAnalysisService {
    constructor(private repository: IUserMetricsRepository) {}

    async analyzeUser(userId: string): Promise<UserMetricsAnalysis> {
        const userMetrics = await this.repository.findByUserId(userId)
        if (!userMetrics) {
            throw new Error("User metrics not found")
        }
        return this.analyzeMetrics([userMetrics])
    }

    async analyzeMetrics(metrics: UserMetrics[]): Promise<UserMetricsAnalysis> {
        if (metrics.length === 0) {
            return this.createEmptyAnalysis()
        }

        const averages = await this.repository.getAverageMetrics()
        const distribution = await this.repository.getMetricsDistribution()

        return {
            performanceAnalysis: this.analyzePerformance(metrics, averages),
            engagementAnalysis: this.analyzeEngagement(metrics, averages),
            growthAnalysis: this.analyzeGrowth(metrics, averages),
            activityAnalysis: this.analyzeActivity(metrics, averages),
            recommendations: this.generateRecommendations(metrics, averages),
        }
    }

    private analyzePerformance(metrics: UserMetrics[], averages: any) {
        const engagementScores = metrics.map((m) => m.engagementRate)

        return {
            topPerformers: metrics
                .filter((m) => m.engagementRate > averages.averageEngagementRate * 1.5)
                .slice(0, 10),
            underPerformers: metrics
                .filter((m) => m.engagementRate < averages.averageEngagementRate * 0.5)
                .slice(0, 10),
            averagePerformance: averages.averageEngagementRate,
            performanceTrend: "stable" as const,
        }
    }

    private analyzeEngagement(metrics: UserMetrics[], averages: any) {
        return {
            highEngagement: metrics
                .filter((m) => m.engagementRate > averages.averageEngagementRate * 1.2)
                .slice(0, 10),
            lowEngagement: metrics
                .filter((m) => m.engagementRate < averages.averageEngagementRate * 0.8)
                .slice(0, 10),
            averageEngagement: averages.averageEngagementRate,
            engagementTrend: "stable" as const,
        }
    }

    private analyzeGrowth(metrics: UserMetrics[], averages: any) {
        return {
            highGrowth: metrics
                .filter((m) => m.followerGrowthRate30d > averages.averageGrowthRate * 1.2)
                .slice(0, 10),
            lowGrowth: metrics
                .filter((m) => m.followerGrowthRate30d < averages.averageGrowthRate * 0.8)
                .slice(0, 10),
            averageGrowth: averages.averageGrowthRate,
            growthTrend: "stable" as const,
        }
    }

    private analyzeActivity(metrics: UserMetrics[], averages: any) {
        return {
            highActivity: metrics
                .filter((m) => m.momentsPerDayAverage > averages.averageActivityRate * 1.2)
                .slice(0, 10),
            lowActivity: metrics
                .filter((m) => m.momentsPerDayAverage < averages.averageActivityRate * 0.8)
                .slice(0, 10),
            averageActivity: averages.averageActivityRate,
            activityTrend: "stable" as const,
        }
    }

    private generateRecommendations(metrics: UserMetrics[], averages: any) {
        return {
            contentOptimization: [
                "Increase content creation frequency",
                "Focus on high-quality content",
                "Use relevant hashtags",
            ],
            engagementImprovements: [
                "Respond to comments promptly",
                "Engage with other users' content",
                "Create interactive content",
            ],
            growthStrategies: [
                "Collaborate with other users",
                "Share valuable insights",
                "Maintain consistent posting schedule",
            ],
            activityEnhancement: [
                "Establish daily posting routine",
                "Create content series",
                "Engage in trending topics",
            ],
        }
    }

    private createEmptyAnalysis(): UserMetricsAnalysis {
        return {
            performanceAnalysis: {
                topPerformers: [],
                underPerformers: [],
                averagePerformance: 0,
                performanceTrend: "stable",
            },
            engagementAnalysis: {
                highEngagement: [],
                lowEngagement: [],
                averageEngagement: 0,
                engagementTrend: "stable",
            },
            growthAnalysis: {
                highGrowth: [],
                lowGrowth: [],
                averageGrowth: 0,
                growthTrend: "stable",
            },
            activityAnalysis: {
                highActivity: [],
                lowActivity: [],
                averageActivity: 0,
                activityTrend: "stable",
            },
            recommendations: {
                contentOptimization: [],
                engagementImprovements: [],
                growthStrategies: [],
                activityEnhancement: [],
            },
        }
    }
}
