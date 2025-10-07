import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface GetMomentReportsRequest {
    momentId: string
    userId?: string // Para verificar se é owner ou admin
    userRole?: "user" | "admin"
    limit?: number
    offset?: number
}

export interface ReportSummary {
    id: string
    reason: string
    description?: string
    status: "pending" | "reviewed" | "resolved" | "dismissed"
    createdAt: Date
    // Para admins, incluir informações do reporter
    reporterId?: string
    reporterInfo?: {
        id: string
        username?: string
    }
}

export interface GetMomentReportsResponse {
    success: boolean
    reports?: ReportSummary[]
    total?: number
    page?: number
    limit?: number
    totalPages?: number
    error?: string
}

export class GetMomentReportsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: GetMomentReportsRequest): Promise<GetMomentReportsResponse> {
        try {
            // Validar parâmetros obrigatórios
            if (!request.momentId) {
                return { success: false, error: "Moment ID is required" }
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

            // Buscar o momento
            const moment = await this.momentService.getMomentById(request.momentId)
            if (!moment) {
                return { success: false, error: "Moment not found" }
            }

            // Verificar permissões
            const isOwner = request.userId && moment.ownerId === request.userId
            const isAdmin = request.userRole === "admin"

            if (!isOwner && !isAdmin) {
                return { success: false, error: "Acesso negado" }
            }

            // Buscar reports do momento
            const reportsResult = await this.momentService.getMomentReports(
                request.momentId,
                limit,
                offset,
            )

            // Formatar reports baseado no nível de acesso
            const reports: ReportSummary[] = reportsResult.reports.map((report) => {
                const baseReport: ReportSummary = {
                    id: report.id,
                    reason: report.reason,
                    description: report.description,
                    status: report.status as any,
                    createdAt: report.createdAt,
                }

                // Apenas admins veem informações do reporter
                if (isAdmin) {
                    baseReport.reporterId = report.userId
                    baseReport.reporterInfo = {
                        id: report.userId,
                        // TODO: Buscar username do usuário se necessário
                    }
                }

                return baseReport
            })

            return {
                success: true,
                reports,
                total: reportsResult.total,
                page: Math.floor(offset / limit) + 1,
                limit,
                totalPages: Math.ceil(reportsResult.total / limit),
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }
}
