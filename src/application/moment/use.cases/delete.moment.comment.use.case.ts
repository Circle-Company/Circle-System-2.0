// ===== DELETE MOMENT COMMENT USE CASE =====

import { CommentNotFoundError, CommentNotOwnedError } from "@/domain/moment/errors/moment.errors"

import { MomentService } from "@/application/moment/services/moment.service"

export interface DeleteMomentCommentRequest {
    momentId: string
    commentId: string
    userId: string
}

export interface DeleteMomentCommentResponse {
    success: boolean
    error?: string
}

export class DeleteMomentCommentUseCase {
    constructor(private readonly momentService: MomentService) {}

    async execute(request: DeleteMomentCommentRequest): Promise<DeleteMomentCommentResponse> {
        const { momentId, commentId, userId } = request

        try {
            const result = await this.momentService.deleteMomentComment({
                momentId,
                commentId,
                userId,
            })

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || "Failed to delete comment",
                }
            }

            return {
                success: true,
            }
        } catch (error) {
            if (error instanceof CommentNotFoundError) {
                return {
                    success: false,
                    error: "Comment not found",
                }
            }

            if (error instanceof CommentNotOwnedError) {
                return {
                    success: false,
                    error: "You can only delete your own comments",
                }
            }

            return {
                success: false,
                error: "An unexpected error occurred",
            }
        }
    }
}
