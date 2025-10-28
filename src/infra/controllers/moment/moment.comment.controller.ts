import {
    CommentMomentUseCase,
    DeleteMomentCommentUseCase,
    GetCommentedMomentsUseCase,
    GetMomentCommentsUseCase,
} from "@/application/moment/use.cases"

import { Comment } from "@/domain/moment/entities/comment.entity"

export interface CreateCommentRequest {
    content: string
    parentCommentId?: string
}

export interface EditCommentRequest {
    content: string
}

export interface CommentResponse {
    id: string
    momentId: string
    authorId: string
    parentCommentId?: string
    content: string
    status: string
    visibility: string
    category: string
    sentiment: string
    likesCount: number
    repliesCount: number
    reportsCount: number
    viewsCount: number
    isModerated: boolean
    moderationScore: number
    severity: string
    mentions: string[]
    hashtags: string[]
    createdAt: Date
    updatedAt: Date
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
        private readonly getCommentedMomentsUseCase: GetCommentedMomentsUseCase,
    ) {}

    /**
     * Criar um comentário em um momento
     */
    async createComment(
        momentId: string,
        userId: string,
        request: CreateCommentRequest,
    ): Promise<CommentResponse | null> {
        try {
            console.log(`[MomentCommentController] 🔔 Criando comentário em momento ${momentId} para usuário ${userId}`)
            console.log(`[MomentCommentController] 📋 Dados do request:`, request)
            const result = await this.commentMomentUseCase.execute({
                momentId,
                userId,
                content: request.content,
                parentCommentId: request.parentCommentId,
            })

            if (!result.success || !result.comment) {
                throw new Error(result.error || "Erro ao criar comentário")
            }

            return this.mapCommentToResponse(result.comment)
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
        userId: string,
        query: GetCommentsQuery,
    ): Promise<CommentListResponse> {
        try {
            const result = await this.getMomentCommentsUseCase.execute({
                momentId,
                userId,
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
                comments: result.comments.map((comment) => this.mapCommentToResponse(comment)),
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
     * Obter momentos comentados por um usuário
     */
    async getCommentedMoments(
        userId: string,
        query: GetCommentsQuery,
    ): Promise<CommentListResponse> {
        try {
            const result = await this.getCommentedMomentsUseCase.execute({
                userId,
                page: query.page,
                limit: query.limit,
                sortOrder: query.sortOrder,
            })

            if (!result.success || !result.moments) {
                throw new Error(result.error || "Erro ao buscar momentos comentados")
            }

            // Converter momentos para formato de resposta (simplificado)
            return {
                comments: result.moments.map((moment) => ({
                    id: moment.id,
                    momentId: moment.id,
                    authorId: moment.ownerId,
                    content: `Comment on: ${moment.description}`,
                    status: moment.status.current,
                    visibility: moment.visibility.level,
                    category: "general",
                    sentiment: "neutral",
                    likesCount: 0,
                    repliesCount: 0,
                    reportsCount: 0,
                    viewsCount: 0,
                    isModerated: false,
                    moderationScore: 0,
                    severity: "low",
                    mentions: moment.mentions,
                    hashtags: moment.hashtags,
                    createdAt: moment.createdAt,
                    updatedAt: moment.updatedAt,
                })),
                pagination: result.pagination || {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                },
            }
        } catch (error) {
            throw new Error(
                `Erro ao buscar momentos comentados: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Mapear entidade Comment para CommentResponse
     */
    private mapCommentToResponse(comment: Comment): CommentResponse {
        return {
            id: comment.id,
            momentId: comment.momentId,
            authorId: comment.authorId,
            parentCommentId: comment.parentCommentId,
            content: comment.content,
            status: comment.status,
            visibility: comment.visibility,
            category: comment.category,
            sentiment: comment.sentiment,
            likesCount: comment.likesCount,
            repliesCount: comment.repliesCount,
            reportsCount: comment.reportsCount,
            viewsCount: comment.viewsCount,
            isModerated: comment.isModerated,
            moderationScore: comment.moderationScore,
            severity: comment.severity,
            mentions: comment.mentions,
            hashtags: comment.hashtags,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        }
    }
}
