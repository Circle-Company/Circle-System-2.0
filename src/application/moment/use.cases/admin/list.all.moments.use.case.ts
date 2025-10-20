// ===== LIST ALL MOMENTS USE CASE (ADMIN) =====

import { MomentService } from "@/application/moment/services/moment.service"
import { MomentStatusEnum } from "@/domain/moment"

export interface ListAllMomentsRequest {
    page?: number
    limit?: number
    status?: MomentStatusEnum
    sortBy?: "created_at" | "published_at" | "updated_at"
    sortOrder?: "asc" | "desc"
    search?: string
    ownerId?: string
}

export interface ListAllMomentsResponse {
    success: boolean
    moments: Array<{
        id: string
        ownerId: string
        description: string
        hashtags: string[]
        mentions: string[]
        publishedAt?: Date
        archivedAt?: Date
        deletedAt?: Date
        createdAt: Date
        updatedAt: Date
        status: string
        metrics: {
            totalViews: number
            totalLikes: number
            totalComments: number
            totalReports: number
        }
    }>
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    error?: string
}

export class ListAllMomentsUseCase {
    constructor(private readonly momentService: MomentService) {}

    async execute(request: ListAllMomentsRequest): Promise<ListAllMomentsResponse> {
        const {
            page = 1,
            limit = 20,
            status,
            sortBy = "created_at",
            sortOrder = "desc",
            search,
            ownerId,
        } = request

        try {
            const result = await this.momentService.listAllMoments({
                page,
                limit,
                status,
                sortBy,
                sortOrder,
                search,
                ownerId,
            })

            if (!result.success) {
                return {
                    success: false,
                    moments: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        totalPages: 0,
                    },
                    error: result.error || "Failed to list moments",
                }
            }

            return {
                success: true,
                moments: result.moments || [],
                pagination: result.pagination || {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                },
            }
        } catch (error) {
            return {
                success: false,
                moments: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                },
                error: "An unexpected error occurred",
            }
        }
    }
}
