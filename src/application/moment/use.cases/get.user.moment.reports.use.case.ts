import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface GetUserMomentReportsRequest {
    userId: string
    limit?: number
    offset?: number
    status?: "pending" | "reviewed" | "resolved" | "dismissed"
    momentId?: string // Para filtrar por momento específico
}

export interface MomentReportSummary {
    momentId: string
    moment: {
        id: string
        description: string
        createdAt: Date
        status: string
    }
    reports: {
        id: string
        reason: string
        description?: string
        status: "pending" | "reviewed" | "resolved" | "dismissed"
        createdAt: Date
        // Não incluir informações do reporter para privacidade
    }[]
    totalReports: number
    pendingReports: number
    resolvedReports: number
}

export interface GetUserMomentReportsResponse {
    success: boolean
    momentReports?: MomentReportSummary[]
    total?: number
    page?: number
    limit?: number
    totalPages?: number
    error?: string
}

export class GetUserMomentReportsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: GetUserMomentReportsRequest): Promise<GetUserMomentReportsResponse> {
        try {
            // Validar parâmetros obrigatórios
            if (!request.userId) {
                return { success: false, error: "User ID is required" }
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

            // Buscar reports dos momentos do usuário
            const result = await this.momentService.getUserMomentReports(
                request.userId,
                limit,
                offset,
                request.status,
                request.momentId,
            )

            // Formatar resposta
            const momentReports: MomentReportSummary[] = result.momentReports.map((item) => ({
                momentId: item.momentId,
                moment: {
                    id: item.moment.id,
                    description: item.moment.description,
                    createdAt: item.moment.createdAt,
                    status: item.moment.status.current,
                },
                reports: item.reports.map((report) => ({
                    id: report.id,
                    reason: report.reason,
                    description: report.description,
                    status: report.status as any,
                    createdAt: report.createdAt,
                })),
                totalReports: item.totalReports,
                pendingReports: item.pendingReports,
                resolvedReports: item.resolvedReports,
            }))

            return {
                success: true,
                momentReports,
                total: result.total,
                page: Math.floor(offset / limit) + 1,
                limit,
                totalPages: Math.ceil(result.total / limit),
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }
}
