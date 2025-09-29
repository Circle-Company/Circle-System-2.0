import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface GetMomentsAnalyticsRequest {
    userId?: string // Para analytics de um usuário específico
    userRole?: "user" | "admin"
    period?: "daily" | "weekly" | "monthly" | "yearly"
    startDate?: Date
    endDate?: Date
    includeDeleted?: boolean
}

export interface MomentsAnalyticsData {
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
    demographics: {
        ageGroups: Record<string, number>
        genders: Record<string, number>
        locations: Record<string, number>
    }
    contentAnalysis: {
        topHashtags: Array<{
            hashtag: string
            count: number
            reach: number
        }>
        topMentions: Array<{
            mention: string
            count: number
        }>
        contentTypes: Record<string, number>
    }
    performance: {
        bestPerformingDay: string
        bestPerformingHour: number
        averagePostingFrequency: number
        peakEngagementTimes: Array<{
            hour: number
            engagement: number
        }>
    }
}

export interface GetMomentsAnalyticsResponse {
    success: boolean
    analytics?: MomentsAnalyticsData
    error?: string
}

export class GetMomentsAnalyticsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: GetMomentsAnalyticsRequest): Promise<GetMomentsAnalyticsResponse> {
        try {
            // Verificar permissões
            const isAdmin = request.userRole === "admin"

            if (!request.userId && !isAdmin) {
                return { success: false, error: "Acesso negado" }
            }

            // Buscar analytics
            const analytics = await this.momentService.getMomentsAnalytics({
                userId: request.userId,
                period: request.period || "monthly",
                startDate: request.startDate,
                endDate: request.endDate,
                includeDeleted: request.includeDeleted || false,
            })

            return {
                success: true,
                analytics,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
