import { MomentEntity, MomentStatusEnum, MomentVisibilityEnum } from "@/domain/moment"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface ListMomentsRequest {
    userId?: string // Para filtrar por usuário
    status?: MomentStatusEnum
    visibility?: MomentVisibilityEnum
    hashtag?: string
    mention?: string
    search?: string
    limit?: number
    offset?: number
    sortBy?: "createdAt" | "updatedAt" | "views" | "likes"
    sortOrder?: "asc" | "desc"
}

export interface ListMomentsResponse {
    success: boolean
    moments?: MomentEntity[]
    total?: number
    page?: number
    limit?: number
    totalPages?: number
    error?: string
}

export class ListMomentsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: ListMomentsRequest): Promise<ListMomentsResponse> {
        try {
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

            // Construir filtros
            const filters = this.buildFilters(request)

            // Buscar momentos
            const result = await this.momentService.searchMoments({
                filters,
                limit,
                offset,
                sortBy,
                sortOrder,
            })

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

    private buildFilters(request: ListMomentsRequest): any {
        const filters: any = {}

        // Filtrar apenas momentos publicados por padrão
        filters.status = request.status || MomentStatusEnum.PUBLISHED

        if (request.userId) {
            filters.ownerId = request.userId
        }

        if (request.visibility) {
            filters.visibility = request.visibility
        }

        if (request.hashtag) {
            filters.hashtag = request.hashtag
        }

        if (request.mention) {
            filters.mention = request.mention
        }

        if (request.search) {
            filters.search = request.search
        }

        return filters
    }
}
