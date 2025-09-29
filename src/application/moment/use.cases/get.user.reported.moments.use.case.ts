import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface GetUserReportedMomentsRequest {
    userId: string
    limit?: number
    offset?: number
    status?: "pending" | "reviewed" | "resolved" | "dismissed"
}

export interface ReportedMomentSummary {
    momentId: string
    moment: {
        id: string
        description: string
        ownerId: string
        createdAt: Date
        status: string
    }
    report: {
        id: string
        reason: string
        description?: string
        status: "pending" | "reviewed" | "resolved" | "dismissed"
        createdAt: Date
    }
}

export interface GetUserReportedMomentsResponse {
    success: boolean
    reportedMoments?: ReportedMomentSummary[]
    total?: number
    page?: number
    limit?: number
    totalPages?: number
    error?: string
}

export class GetUserReportedMomentsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: GetUserReportedMomentsRequest): Promise<GetUserReportedMomentsResponse> {
        try {
            // Validar parâmetros obrigatórios
            if (!request.userId) {
                return { success: false, error: "ID do usuário é obrigatório" }
            }

            // Validar limites
            if (request.limit !== undefined && (request.limit < 1 || request.limit > 100)) {
                return { success: false, error: "Limite deve estar entre 1 e 100" }
            }

            if (request.offset !== undefined && request.offset < 0) {
                return { success: false, error: "Offset deve ser maior ou igual a 0" }
            }

            const limit = request.limit || 20
            const offset = request.offset || 0

            // Buscar momentos reportados pelo usuário
            const result = await this.momentService.getUserReportedMoments(
                request.userId,
                limit,
                offset,
                request.status,
            )

            // Formatar resposta
            const reportedMoments: ReportedMomentSummary[] = result.reportedMoments.map((item) => ({
                momentId: item.momentId,
                moment: {
                    id: item.moment.id,
                    description: item.moment.description,
                    ownerId: item.moment.ownerId,
                    createdAt: item.moment.createdAt,
                    status: item.moment.status.current,
                },
                report: {
                    id: item.report.id,
                    reason: item.report.reason,
                    description: item.report.description,
                    status: item.report.status as any,
                    createdAt: item.report.createdAt,
                },
            }))

            return {
                success: true,
                reportedMoments,
                total: result.total,
                page: Math.floor(offset / limit) + 1,
                limit,
                totalPages: Math.ceil(result.total / limit),
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
