// ===== GET MOMENT COMMENTS USE CASE =====

import { MomentService } from "@/application/moment/services/moment.service"

export interface GetMomentCommentsRequest {
    momentId: string
    page?: number
    limit?: number
    sortBy?: "created_at" | "likes" | "replies"
    sortOrder?: "asc" | "desc"
}

export interface GetMomentCommentsResponse {
    success: boolean
    comments: Array<{
        id: string
        authorId: string
        content: string
        parentId?: string
        likes: number
        replies: number
        isEdited: boolean
        editedAt?: Date
        isDeleted: boolean
        deletedAt?: Date
        createdAt: Date
        updatedAt: Date
    }>
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export class GetMomentCommentsUseCase {
    constructor(private readonly momentService: MomentService) {}

    async execute(request: GetMomentCommentsRequest): Promise<GetMomentCommentsResponse> {
        const {
            momentId,
            page = 1,
            limit = 20,
            sortBy = "created_at",
            sortOrder = "desc",
        } = request

        const result = await this.momentService.getMomentComments({
            momentId,
            page,
            limit,
            sortBy,
            sortOrder,
        })

        if (!result.success) {
            throw new Error(result.error || "Failed to get moment comments")
        }

        return {
            success: true,
            comments: result.comments || [],
            pagination: result.pagination || {
                page,
                limit,
                total: 0,
                totalPages: 0,
            },
        }
    }
}
