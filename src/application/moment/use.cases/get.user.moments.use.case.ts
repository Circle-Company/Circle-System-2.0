import { MomentEntity, MomentStatusEnum, MomentVisibilityEnum } from "@/domain/moment"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface GetUserMomentsRequest {
    userId: string
    requestingUserId?: string // Para verificar permissões
    status?: MomentStatusEnum
    visibility?: MomentVisibilityEnum
    includeDeleted?: boolean
    limit?: number
    offset?: number
    sortBy?: "createdAt" | "updatedAt" | "views" | "likes"
    sortOrder?: "asc" | "desc"
}

export interface GetUserMomentsResponse {
    success: boolean
    moments?: MomentEntity[]
    total?: number
    page?: number
    limit?: number
    totalPages?: number
    error?: string
}

export class GetUserMomentsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: GetUserMomentsRequest): Promise<GetUserMomentsResponse> {
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
            const sortBy = request.sortBy || "createdAt"
            const sortOrder = request.sortOrder || "desc"

            // Verificar permissões
            const isOwner = request.requestingUserId === request.userId
            const isAdmin = false // TODO: Implementar verificação de admin

            // Construir filtros baseado nas permissões
            const filters = this.buildFilters(request, isOwner, isAdmin)

            // Buscar momentos do usuário
            const result = await this.momentService.findByOwnerId(
                request.userId,
                limit,
                offset,
                filters,
            )

            return {
                success: true,
                moments: result.moments,
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

    private buildFilters(request: GetUserMomentsRequest, isOwner: boolean, isAdmin: boolean): any {
        const filters: any = {}

        // Se não é o dono nem admin, só mostra momentos públicos
        if (!isOwner && !isAdmin) {
            filters.visibility = MomentVisibilityEnum.PUBLIC
            filters.status = MomentStatusEnum.PUBLISHED
        } else {
            // Owner e admin podem ver todos os momentos
            if (request.status) {
                filters.status = request.status
            }

            if (request.visibility) {
                filters.visibility = request.visibility
            }

            if (request.includeDeleted) {
                filters.includeDeleted = true
            }
        }

        return filters
    }
}
