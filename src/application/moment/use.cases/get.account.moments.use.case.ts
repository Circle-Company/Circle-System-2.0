/**
 * Get Account Moments Use Case
 *
 * Caso de uso responsável por buscar e retornar os momentos da conta do usuário autenticado
 *
 * Features:
 * - Busca momentos do próprio usuário autenticado
 * - Filtros por status, visibilidade, ordenação
 * - Paginação via page e pageSize
 * - Timezone do usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import {
    MomentEntity,
    MomentMedia,
    MomentStatusEnum,
    MomentThumbnail,
    MomentVisibilityEnum,
} from "@/domain/moment"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { AuthenticatedUser } from "@/infra/middlewares"
import { Timezone } from "@/shared/circle.text.library"

export interface GetAccountMomentsRequest {
    requestingUser: AuthenticatedUser
    query: {
        status: MomentStatusEnum
        visibility: MomentVisibilityEnum
        includeDeleted?: boolean
        sortBy?: "createdAt" | "updatedAt" | "views" | "likes"
        sortOrder?: "asc" | "desc"
    }
    limit?: number
    offset?: number
}

export interface MomentPreview {
    id: string
    description: string
    video: Omit<MomentMedia, "storage" | "createdAt" | "updatedAt">
    thumbnail: Omit<MomentThumbnail, "storage" | "createdAt" | "updatedAt">
    publishedAt: Date | null
}

export interface GetAccountMomentsResponse {
    success: boolean
    moments?: MomentPreview[]
    pagination?: {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
    }
    error?: string
}

export class GetAccountMomentsUseCase {
    constructor(private readonly momentRepository: IMomentRepository) {}

    async execute(request: GetAccountMomentsRequest): Promise<GetAccountMomentsResponse> {
        try {
            // Validar parâmetros obrigatórios
            if (!request.requestingUser.id) {
                return { success: false, error: "User ID is required" }
            }

            // Validar limites
            if (request.limit !== undefined && (request.limit < 1 || request.limit > 100)) {
                return { success: false, error: "Limit must be between 1 and 100" }
            }

            if (request.offset !== undefined && request.offset < 0) {
                return { success: false, error: "Offset must be greater than or equal to 0" }
            }

            const limit = request.limit || 20
            const offset = request.offset || 0

            const tz = this.setLocalTimezone(request.requestingUser)

            // Normalizar valores de enum (uppercase → lowercase)
            const normalizedStatus = String(request.query.status).toLowerCase()
            const normalizedVisibility = String(request.query.visibility).toLowerCase()

            // Buscar momentos do próprio usuário com filtros aplicados no banco de dados
            const moments = await this.momentRepository.findByOwnerId(
                request.requestingUser.id,
                limit,
                offset,
                {
                    status: normalizedStatus,
                    visibility: normalizedVisibility,
                },
            )

            const momentsPreview = this.mapToPreview(tz, moments)

            // Calcular informações de paginação
            const page = Math.floor(offset / limit) + 1
            const totalPages = Math.ceil(moments.length / limit)

            return {
                success: true,
                moments: momentsPreview,
                pagination: {
                    total: momentsPreview.length,
                    page,
                    limit,
                    totalPages,
                },
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }

    private setLocalTimezone(user: AuthenticatedUser): Timezone {
        const tz = new Timezone()
        const code = tz.getCodeFromOffset(user.timezone)
        tz.setLocalTimezone(code)
        return tz
    }

    private mapToPreview(tz: Timezone, moments: MomentEntity[]): MomentPreview[] {
        return moments.map((moment) => ({
            id: moment.id,
            description: moment.description,
            video: {
                url: moment.media.url,
            },
            thumbnail: {
                url: moment.thumbnail.url,
                width: moment.thumbnail.width,
                height: moment.thumbnail.height,
            },
            publishedAt: moment.publishedAt && tz.UTCToLocal(moment.publishedAt),
        }))
    }
}
