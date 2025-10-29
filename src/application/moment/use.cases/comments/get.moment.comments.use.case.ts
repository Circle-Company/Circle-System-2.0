import { Comment } from "@/domain/moment/entities/comment.entity"
import { ICommentRepository } from "@/domain/moment/repositories/comment.repository"

export interface GetMomentCommentsRequest {
    momentId: string
    userId?: string
    page?: number
    limit?: number
    sortBy?: "createdAt" | "likesCount" | "repliesCount"
    sortOrder?: "asc" | "desc"
    includeReplies?: boolean
}

export interface GetMomentCommentsResponse {
    success: boolean
    comments?: Comment[]
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    error?: string
}

export class GetMomentCommentsUseCase {
    constructor(private readonly commentRepository: ICommentRepository) {}

    async execute(request: GetMomentCommentsRequest): Promise<GetMomentCommentsResponse> {
        try {
            const page = request.page || 1
            const limit = Math.min(request.limit || 20, 100) // Máximo 100 por página

            if (request.includeReplies) {
                // Buscar todos os comentários (incluindo respostas)
                const result = await this.commentRepository.findPaginated(
                    page,
                    limit,
                    {
                        momentId: request.momentId,
                    },
                    {
                        field: request.sortBy || "createdAt",
                        direction: (request.sortOrder || "desc").toUpperCase() as "ASC" | "DESC",
                    },
                )

                return {
                    success: true,
                    comments: result.comments,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        totalPages: result.totalPages,
                    },
                }
            } else {
                // Buscar apenas comentários de nível superior
                const comments = await this.commentRepository.findTopLevelComments(
                    request.momentId,
                    limit,
                    (page - 1) * limit,
                )

                // Contar total de comentários de nível superior
                const total = await this.commentRepository.countByMomentId(request.momentId)
                const totalPages = Math.ceil(total / limit)

                return {
                    success: true,
                    comments,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                    },
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }
}
