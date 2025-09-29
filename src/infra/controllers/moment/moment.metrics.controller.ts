// Use Cases
import { GetMomentMetricsUseCase, GetMomentsAnalyticsUseCase } from "@/application/moment/use.cases"

import { z } from "zod"

// Interfaces de Request
export interface GetMomentMetricsRequest {
    period?: "hourly" | "daily" | "weekly" | "monthly"
    startDate?: Date
    endDate?: Date
    includeDetails?: boolean
}

export interface GetAnalyticsRequest {
    period?: "daily" | "weekly" | "monthly" | "yearly"
    startDate?: Date
    endDate?: Date
    userId?: string
    category?:
        | "views"
        | "engagement"
        | "performance"
        | "viral"
        | "audience"
        | "content"
        | "monetization"
    includeTrends?: boolean
    includeComparisons?: boolean
}

// Interface de Response
export interface MomentMetricsResponse {
    momentId: string
    totalViews: number
    totalLikes: number
    totalComments: number
    totalShares: number
    engagementRate: number
    averageWatchTime: number
    completionRate: number
    demographics: {
        ageGroups: Record<string, number>
        genders: Record<string, number>
        locations: Record<string, number>
    }
    timeline: Array<{
        date: string
        views: number
        likes: number
        comments: number
        shares: number
    }>
    topHashtags: Array<{
        hashtag: string
        count: number
    }>
    topMentions: Array<{
        mention: string
        count: number
    }>
}

export interface MomentsAnalyticsResponse {
    overview: {
        totalMoments: number
        totalViews: number
        totalLikes: number
        totalComments: number
        totalShares: number
        averageEngagementRate: number
        averageWatchTime: number
        averageCompletionRate: number
    }
    trends: {
        momentsCreated: Array<{
            date: string
            count: number
        }>
        views: Array<{
            date: string
            count: number
        }>
        likes: Array<{
            date: string
            count: number
        }>
        comments: Array<{
            date: string
            count: number
        }>
    }
    topPerformers: {
        mostViewed: Array<{
            momentId: string
            title: string
            views: number
        }>
        mostLiked: Array<{
            momentId: string
            title: string
            likes: number
        }>
        mostCommented: Array<{
            momentId: string
            title: string
            comments: number
        }>
    }
    insights: {
        bestPerformingDay: string
        bestPerformingHour: number
        averagePostingFrequency: number
        audienceGrowth: number
        engagementTrend: "increasing" | "decreasing" | "stable"
    }
}

// Schemas de validação
const GetMomentMetricsQuerySchema = z.object({
    period: z.enum(["hourly", "daily", "weekly", "monthly"]).default("daily"),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    includeDetails: z.coerce.boolean().default(false),
})

const GetAnalyticsQuerySchema = z.object({
    period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("daily"),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    userId: z.string().optional(),
    category: z
        .enum([
            "views",
            "engagement",
            "performance",
            "viral",
            "audience",
            "content",
            "monetization",
        ])
        .optional(),
    includeTrends: z.coerce.boolean().default(true),
    includeComparisons: z.coerce.boolean().default(false),
})

export class MomentMetricsController {
    constructor(
        private readonly getMomentMetricsUseCase: GetMomentMetricsUseCase,
        private readonly getMomentsAnalyticsUseCase: GetMomentsAnalyticsUseCase,
    ) {}

    // ===== MOMENT METRICS =====

    /**
     * Obtém métricas de um momento
     */
    async getMomentMetrics(
        momentId: string,
        userId: string,
        request: GetMomentMetricsRequest,
    ): Promise<MomentMetricsResponse> {
        try {
            // Validação com Zod
            const validatedData = GetMomentMetricsQuerySchema.parse(request)

            const result = await this.getMomentMetricsUseCase.execute({
                momentId: momentId,
                userId: userId,
                period: validatedData.period,
                startDate: validatedData.startDate,
                endDate: validatedData.endDate,
            })

            if (!result.success || !result.metrics) {
                throw new Error(result.error || "Erro ao obter métricas do momento")
            }

            return this.mapToMetricsResponse(result.metrics)
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao obter métricas do momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    // ===== ANALYTICS =====

    /**
     * Obtém analytics gerais de momentos
     */
    async getMomentsAnalytics(
        userId: string,
        request: GetAnalyticsRequest,
    ): Promise<MomentsAnalyticsResponse> {
        try {
            // Validação com Zod
            const validatedData = GetAnalyticsQuerySchema.parse(request)

            const result = await this.getMomentsAnalyticsUseCase.execute({
                userId: userId,
                period: validatedData.period,
                startDate: validatedData.startDate,
                endDate: validatedData.endDate,
            })

            if (!result.success || !result.analytics) {
                throw new Error(result.error || "Erro ao obter analytics dos momentos")
            }

            return this.mapToAnalyticsResponse(result.analytics)
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao obter analytics dos momentos: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    // ===== OWNER METRICS (Para donos de momentos) =====

    /**
     * Obtém métricas detalhadas de um momento (apenas para o dono)
     */
    async getOwnerMomentMetrics(
        momentId: string,
        userId: string,
        request: GetMomentMetricsRequest,
    ): Promise<MomentMetricsResponse> {
        try {
            // Validação com Zod
            const validatedData = GetMomentMetricsQuerySchema.parse(request)

            const result = await this.getMomentMetricsUseCase.execute({
                momentId: momentId,
                userId: userId,
                period: validatedData.period,
                startDate: validatedData.startDate,
                endDate: validatedData.endDate,
            })

            if (!result.success || !result.metrics) {
                throw new Error(result.error || "Erro ao obter métricas detalhadas do momento")
            }

            return this.mapToMetricsResponse(result.metrics)
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(
                    `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                )
            }
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            if (error instanceof Error && error.message === "Unauthorized") {
                throw new Error("Não autorizado")
            }
            throw new Error(
                `Erro ao obter métricas detalhadas do momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    // ===== PUBLIC METRICS (Métricas públicas de um momento) =====

    /**
     * Obtém métricas públicas de um momento (não autenticado)
     */
    async getPublicMomentMetrics(momentId: string): Promise<MomentMetricsResponse> {
        try {
            const result = await this.getMomentMetricsUseCase.execute({
                momentId: momentId,
                userId: undefined, // Não autenticado
                period: "daily",
            })

            if (!result.success || !result.metrics) {
                throw new Error(result.error || "Erro ao obter métricas públicas do momento")
            }

            return this.mapToMetricsResponse(result.metrics)
        } catch (error) {
            if (error instanceof Error && error.message === "Moment not found") {
                throw new Error("Momento não encontrado")
            }
            throw new Error(
                `Erro ao obter métricas públicas do momento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Mapeia dados de métricas para response
     */
    private mapToMetricsResponse(metrics: any): MomentMetricsResponse {
        return {
            momentId: metrics.momentId,
            totalViews: metrics.totalViews || 0,
            totalLikes: metrics.totalLikes || 0,
            totalComments: metrics.totalComments || 0,
            totalShares: metrics.totalShares || 0,
            engagementRate: metrics.engagementRate || 0,
            averageWatchTime: metrics.averageWatchTime || 0,
            completionRate: metrics.completionRate || 0,
            demographics: metrics.demographics || {
                ageGroups: {},
                genders: {},
                locations: {},
            },
            timeline: metrics.timeline || [],
            topHashtags: metrics.topHashtags || [],
            topMentions: metrics.topMentions || [],
        }
    }

    /**
     * Mapeia dados de analytics para response
     */
    private mapToAnalyticsResponse(analytics: any): MomentsAnalyticsResponse {
        return {
            overview: analytics.overview || {
                totalMoments: 0,
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                totalShares: 0,
                averageEngagementRate: 0,
                averageWatchTime: 0,
                averageCompletionRate: 0,
            },
            trends: analytics.trends || {
                momentsCreated: [],
                views: [],
                likes: [],
                comments: [],
            },
            topPerformers: analytics.topPerformers || {
                mostViewed: [],
                mostLiked: [],
                mostCommented: [],
            },
            insights: analytics.insights || {
                bestPerformingDay: "monday",
                bestPerformingHour: 12,
                averagePostingFrequency: 0,
                audienceGrowth: 0,
                engagementTrend: "stable",
            },
        }
    }
}
