import { MomentStatusEnum } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface DeleteMomentRequest {
    momentId: string
    userId: string
    userRole?: "user" | "admin"
}

export interface DeleteMomentResponse {
    success: boolean
    deleted?: boolean
    error?: string
}

export class DeleteMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: DeleteMomentRequest): Promise<DeleteMomentResponse> {
        try {
            // Validar parâmetros obrigatórios
            if (!request.momentId) {
                return { success: false, error: "Moment ID is required" }
            }

            if (!request.userId) {
                return { success: false, error: "User ID is required" }
            }

            // Buscar o momento
            const moment = await this.momentService.getMomentById(request.momentId)
            if (!moment) {
                return { success: false, error: "Moment not found" }
            }

            // Verificar permissões
            const isOwner = moment.ownerId === request.userId
            const isAdmin = request.userRole === "admin"

            if (!isOwner && !isAdmin) {
                return { success: false, error: "Acesso negado" }
            }

            // Verificar se o momento já foi deletado
            if (moment.deletedAt) {
                return { success: false, error: "Moment already deleted" }
            }

            // Verificar se o momento pode ser deletado
            if (!this.canDeleteMoment(moment, isAdmin)) {
                return { success: false, error: "Moment cannot be deleted in current state" }
            }

            // Deletar o momento (soft delete)
            const deleted = await this.momentService.deleteMoment(request.momentId)

            if (!deleted) {
                return { success: false, error: "Falha ao deletar o momento" }
            }

            return {
                success: true,
                deleted: true,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }

    private canDeleteMoment(moment: any, isAdmin: boolean): boolean {
        // Admins podem deletar qualquer momento
        if (isAdmin) {
            return true
        }

        // Usuários comuns só podem deletar momentos próprios que não estão bloqueados
        if (moment.status.current === MomentStatusEnum.BLOCKED) {
            return false
        }

        return true
    }
}
