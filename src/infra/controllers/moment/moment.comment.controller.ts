import {
    CommentMomentUseCase,
    DeleteMomentCommentUseCase,
    GetMomentCommentsUseCase
} from "@/application/moment/use.cases"

import { Comment } from "@/domain/moment/entities/comment.entity"
import { AuthenticatedUser } from "@/infra/middlewares/types"

export interface CreateCommentRequest {
    content: string
    mentions?: string[]
    replyId?: string
}

export interface EditCommentRequest {
    content: string
}

export interface CommentResponse {
    id: string
    user: {
        id: string
        username: string
        profilePicture: string
    },
    content: string
    richContent: string
    likesCount: number
    createdAt: string
}

export interface CommentListResponse {
    comments: CommentResponse[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface GetCommentsQuery {
    page?: number
    limit?: number
    sortBy?: "createdAt" | "likesCount" | "repliesCount"
    sortOrder?: "asc" | "desc"
    includeReplies?: boolean
}

export class MomentCommentController {
    constructor(
        private readonly commentMomentUseCase: CommentMomentUseCase,
        private readonly getMomentCommentsUseCase: GetMomentCommentsUseCase,
        private readonly deleteMomentCommentUseCase: DeleteMomentCommentUseCase,
    ) {}

    /**
     * Criar um comentário em um momento
     */
    async createComment(
        momentId: string,
        user: AuthenticatedUser,
        request: CreateCommentRequest,
    ): Promise<Omit<CommentResponse, "user"> | null> {
        try {
            const result = await this.commentMomentUseCase.execute({
                momentId,
                userId: user.id,
                content: request.content,
                replyId: request.replyId,
            })

            if (!result.success || !result.comment) {
                throw new Error(result.error || "Erro ao criar comentário")
            }

            // O create retorna Comment, mas precisamos buscar o user e montar o response
            // Por enquanto retorna um formato básico - será necessário buscar o user
            return {
                id: result.comment.id,
                content: result.comment.content,
                richContent: result.comment.richContent || result.comment.content,
                likesCount: result.comment.likesCount,
                createdAt: result.comment.createdAt.toISOString(),
            }
        } catch (error) {
            throw new Error(
                `Erro ao criar comentário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Obter comentários de um momento
     */
    async getMomentComments(
        momentId: string,
        user: any, // AuthenticatedUser
        query: GetCommentsQuery,
    ): Promise<CommentListResponse> {
        try {
            const result = await this.getMomentCommentsUseCase.execute({
                momentId,
                user,
                page: query.page,
                limit: query.limit,
                sortBy: query.sortBy,
                sortOrder: query.sortOrder,
                includeReplies: query.includeReplies,
            })

            if (!result.success || !result.comments) {
                throw new Error(result.error || "Erro ao buscar comentários")
            }

            return {
                comments: result.comments.map(item => this._mapCommentShortResponse(item)),
                pagination: result.pagination || {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                },
            }
        } catch (error) {
            throw new Error(
                `Erro ao buscar comentários: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Deletar um comentário
     */
    async deleteComment(momentId: string, commentId: string, userId: string): Promise<void> {
        try {
            const result = await this.deleteMomentCommentUseCase.execute({
                momentId,
                commentId,
                userId,
            })

            if (!result.success) {
                throw new Error(result.error || "Erro ao deletar comentário")
            }
        } catch (error) {
            throw new Error(
                `Erro ao deletar comentário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Mapear resposta do use case (CommentResponse do use case) para CommentResponse do controller
     */
    private _mapCommentShortResponse(useCaseResponse: { comment: Comment; user: any; createdAt: string }): CommentResponse {
        const { comment, user, createdAt } = useCaseResponse
        const profilePicture = user?.profilePicture?.fullhdResolution || 
                              user?.profilePicture?.tinyResolution || 
                              ""

        return {
            id: comment.id,
            user: {
                id: user?.id || comment.userId,
                username: user?.username || "unknown",
                profilePicture,
            },
            content: comment.content,
            richContent: comment.richContent || comment.content,
            likesCount: comment.likesCount,
            createdAt,
        }
    }
}
