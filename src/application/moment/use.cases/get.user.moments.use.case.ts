import {
    MomentEntity,
    MomentMedia,
    MomentStatusEnum,
    MomentThumbnail,
    MomentVisibilityEnum,
} from "@/domain/moment"
import { Timezone } from "@/shared/circle.text.library"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { IUserRepository, User } from "@/domain/user"
import { AuthenticatedUser } from "@/infra/middlewares"

export interface GetUserMomentsRequest {
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
            const requestingUser = await this.userRepository.findById(request.requestingUser.id)

            // Buscar momentos do usuário
            const moments = await this.momentRepository.findByOwnerId(
                request.requestingUser.id,
                limit,
                offset,
            )

            const filteredMoments = this.filterResult(moments, request, requestingUser!)
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

    private filterResult(
        result: MomentEntity[],
        request: GetUserMomentsRequest,
        requestingUser: User,
    ): MomentEntity[] {
        return result
            .filter((moment) => moment.status.current === request.query.status)
            .filter((moment) => moment.visibility.level === request.query.visibility)
            .filter((moment) => moment.isViewable(requestingUser, this.userRepository))
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
                urls: moment.media.urls,
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
