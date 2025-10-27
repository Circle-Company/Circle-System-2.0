import {
    Moment,
    MomentEntity,
    MomentMedia,
    MomentStatusEnum,
    MomentThumbnail,
    MomentVisibilityEnum,
} from "@/domain/moment"
import { IUserRepository, User } from "@/domain/user"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { AuthenticatedUser } from "@/infra/middlewares"
import { Timezone } from "@/shared/circle.text.library"

export interface GetUserMomentsRequest {
    user: AuthenticatedUser
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

export interface GetUserMomentsResponse {
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

export class GetUserMomentsUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(request: GetUserMomentsRequest): Promise<GetUserMomentsResponse> {
        try {
            // Validar parâmetros obrigatórios
            if (!request.user.id) {
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

            const tz = this.setLocalTimezone(request.user)
            const requestingUser = await this.userRepository.findById(request.user.id)

            // Buscar momentos do usuário
            const moments = await this.momentRepository.findByOwnerId(
                request.user.id,
                limit,
                offset,
            )

            const filteredMoments = await this.filterResult(moments, request, requestingUser!)
            const momentsPreview = this.mapToPreview(tz, filteredMoments)
            return {
                success: true,
                moments: momentsPreview,
                pagination: {
                    total: momentsPreview.length,
                    page: Math.floor(offset / limit) + 1,
                    limit,
                    totalPages: Math.ceil(momentsPreview.length / limit),
                },
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }

    private async filterResult(
        result: MomentEntity[],
        request: GetUserMomentsRequest,
        requestingUser: User,
    ): Promise<MomentEntity[]> {
        // Converter entidades para objetos de domínio para usar métodos de negócio
        const domainMoments = result.map((entity) => Moment.fromEntity(entity))

        // Aplicar filtros
        const filteredDomainMoments: Moment[] = []

        for (const moment of domainMoments) {
            // Filtro por status
            if (moment.status.current !== request.query.status) {
                continue
            }

            // Filtro por visibilidade
            if (moment.visibility.level !== request.query.visibility) {
                continue
            }

            // Filtro por visualização (método de negócio)
            const viewabilityResult = await moment.isViewable(requestingUser, this.userRepository)
            if (!viewabilityResult.allowed) {
                continue
            }

            filteredDomainMoments.push(moment)
        }

        // Converter de volta para entidades
        return filteredDomainMoments.map((moment) => moment.toEntity())
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
