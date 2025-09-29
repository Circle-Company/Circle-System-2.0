import { MomentStatusEnum } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface ReportMomentRequest {
    momentId: string
    userId: string
    reason: string
    description?: string
}

export interface ReportMomentResponse {
    success: boolean
    report?: {
        id: string
        momentId: string
        userId: string
        reason: string
        description?: string
        status: "pending" | "reviewed" | "resolved" | "dismissed"
        createdAt: Date
    }
    error?: string
}

export class ReportMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: ReportMomentRequest): Promise<ReportMomentResponse> {
        try {
            // Validar parâmetros obrigatórios
            if (!request.momentId) {
                return { success: false, error: "ID do momento é obrigatório" }
            }

            if (!request.userId) {
                return { success: false, error: "ID do usuário é obrigatório" }
            }

            if (!request.reason || request.reason.trim().length === 0) {
                return { success: false, error: "Motivo do report é obrigatório" }
            }

            // Validar tamanho do motivo
            if (request.reason.length > 500) {
                return { success: false, error: "Motivo não pode ter mais de 500 caracteres" }
            }

            // Validar descrição se fornecida
            if (request.description && request.description.length > 1000) {
                return { success: false, error: "Descrição não pode ter mais de 1000 caracteres" }
            }

            // Buscar o momento
            const moment = await this.momentService.getMomentById(request.momentId)
            if (!moment) {
                return { success: false, error: "Momento não encontrado" }
            }

            // Verificar se o momento está publicado
            if (moment.status.current !== MomentStatusEnum.PUBLISHED) {
                return { success: false, error: "Só é possível reportar momentos publicados" }
            }

            // Verificar se o usuário não está reportando o próprio momento
            if (moment.ownerId === request.userId) {
                return { success: false, error: "Não é possível reportar seus próprios momentos" }
            }

            // Verificar se o usuário já reportou este momento
            const alreadyReported = await this.momentService.hasUserReportedMoment(
                request.momentId,
                request.userId,
            )

            if (alreadyReported) {
                return { success: false, error: "Você já reportou este momento" }
            }

            // Criar o report
            const report = await this.momentService.createReport({
                momentId: request.momentId,
                userId: request.userId,
                reason: request.reason,
                description: request.description,
            })

            return {
                success: true,
                report: {
                    id: report.id,
                    momentId: report.momentId,
                    userId: report.userId,
                    reason: report.reason,
                    description: report.description,
                    status: "pending",
                    createdAt: report.createdAt,
                },
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
