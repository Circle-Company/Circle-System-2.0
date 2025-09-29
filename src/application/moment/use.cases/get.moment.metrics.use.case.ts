import { MomentStatusEnum } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface GetMomentMetricsRequest {
    momentId: string
    userId?: string // Para verificar permissões
    userRole?: "user" | "admin"
    period?: "hourly" | "daily" | "weekly" | "monthly"
    startDate?: Date
    endDate?: Date
}

export interface MomentMetricsData {
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

export interface GetMomentMetricsResponse {
    success: boolean
    metrics?: MomentMetricsData
    error?: string
}

export class GetMomentMetricsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: GetMomentMetricsRequest): Promise<GetMomentMetricsResponse> {
        try {
            // Validar parâmetros obrigatórios
            if (!request.momentId) {
                return { success: false, error: "ID do momento é obrigatório" }
            }

            // Buscar o momento
            const moment = await this.momentService.getMomentById(request.momentId)
            if (!moment) {
                return { success: false, error: "Momento não encontrado" }
            }

            // Verificar permissões
            const isOwner = request.userId && moment.ownerId === request.userId
            const isAdmin = request.userRole === "admin"

            if (!isOwner && !isAdmin) {
                return { success: false, error: "Acesso negado" }
            }

            // Verificar se o momento está publicado
            if (moment.status.current !== MomentStatusEnum.PUBLISHED) {
                return {
                    success: false,
                    error: "Métricas só estão disponíveis para momentos publicados",
                }
            }

            // Buscar métricas do momento
            const metrics = await this.momentService.getMomentMetrics(request.momentId, {
                period: request.period || "daily",
                startDate: request.startDate,
                endDate: request.endDate,
            })

            return {
                success: true,
                metrics,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
