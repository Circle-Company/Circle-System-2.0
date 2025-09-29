// ===== EDIT MOMENT COMMENT USE CASE =====

import { CommentNotFoundError, CommentNotOwnedError } from "@/domain/moment/errors/moment.errors"

import { MomentService } from "@/application/moment/services/moment.service"

export interface EditMomentCommentRequest {
    momentId: string
    commentId: string
    userId: string
    content: string
}

export interface EditMomentCommentResponse {
    success: boolean
    comment?: {
        id: string
        authorId: string
        content: string
        parentId?: string
        likes: number
        replies: number
        isEdited: boolean
        editedAt: Date
        isDeleted: boolean
        deletedAt?: Date
        createdAt: Date
        updatedAt: Date
    }
    error?: string
}

export class EditMomentCommentUseCase {
    constructor(private readonly momentService: MomentService) {}

    async execute(request: EditMomentCommentRequest): Promise<EditMomentCommentResponse> {
        const { momentId, commentId, userId, content } = request

        // Validate content
        if (!content || content.trim().length === 0) {
            return {
                success: false,
                error: "Comment content cannot be empty",
            }
        }

        if (content.length > 1000) {
            return {
                success: false,
                error: "Comment content cannot exceed 1000 characters",
            }
        }

        try {
            const result = await this.momentService.editMomentComment({
                momentId,
                commentId,
                userId,
                content: content.trim(),
            })

            if (!result.success) {
                return {
                    success: false,
                    error: result.error || "Failed to edit comment",
                }
            }

            return {
                success: true,
                comment: result.comment,
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
                    error: "You can only edit your own comments",
                }
            }

            return {
                success: false,
                error: "An unexpected error occurred",
            }
        }
    }
}
