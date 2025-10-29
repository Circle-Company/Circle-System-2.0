import { Comment } from "@/domain/moment/entities/comment.entity"
import { ICommentRepository } from "@/domain/moment/repositories/comment.repository"
import { User } from "@/domain/user/entities/user.entity"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { AuthenticatedUser } from "@/infra/middlewares/types"
import { Timezone } from "@/shared/circle.text.library"
import { DateFormatter } from "circle-text-library"


export interface CommentResponse {
    comment: Comment
    user: User
    createdAt: string
}
export interface GetMomentCommentsRequest {
    momentId: string
    user: AuthenticatedUser
    page?: number
    limit?: number
    sortBy?: "createdAt" | "likesCount" | "repliesCount"
    sortOrder?: "asc" | "desc"
    includeReplies?: boolean
}

export interface GetMomentCommentsResponse {
    success: boolean
    comments?: CommentResponse[]
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    error?: string
}

export class GetMomentCommentsUseCase {
    private readonly tz: Timezone
    private readonly dateFormatter: DateFormatter
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly userRepository: IUserRepository,
    ) {
        this.tz = new Timezone()
        this.dateFormatter = new DateFormatter()
        this.dateFormatter.setStyle("full")
        this.dateFormatter.setLocale("pt")
        this.dateFormatter.setUsePrefix(true)
        this.dateFormatter.setUseSuffix(false)
        this.dateFormatter.setCapitalize(true)
        this.dateFormatter.setUseApproximateTime(true)
        this.dateFormatter.setRecentTimeThreshold(60)
    }

    async execute(request: GetMomentCommentsRequest): Promise<GetMomentCommentsResponse> {
        try {
            const page = request.page || 1
            const limit = Math.min(request.limit || 20, 100) // Máximo 100 por página

            // Sempre buscar apenas comentários de nível superior (sem replies)
            // Replies serão tratados como comentários normais
            const comments = await this.commentRepository.findByMomentId(
                request.momentId,
                limit,
                (page - 1) * limit,
            )


            const total = comments.length
            const totalPages = Math.ceil(total / limit)

            // Buscar dados dos usuários para cada comentário
            const userIds = [...new Set(comments.map(comment => comment.userId))]
            const users = await Promise.all(
                userIds.map(userId => this.userRepository.findById(userId))
            )

            // Criar um mapa de usuários por ID
            const userMap = new Map()
            users.forEach(user => {
                if (user) {
                    userMap.set(user.id, user)
                }
            })

            // Mapear comentários para o formato de resposta
            const responseComments: CommentResponse[] = comments
                .map(comment => {
                    const user = userMap.get(comment.userId)
                    if (!user) {
                        return null
                    }

                    // Obter timezone do usuário autenticado
                    const timezone = request.user?.timezone || 0
                    const tzCode = this.tz.getCodeFromOffset(timezone)

                    // Configurar timezone e converter data
                    this.tz.setLocalTimezone(tzCode)
                    const localDate = this.tz.UTCToLocal(comment.createdAt)
                    const createdAt = this.dateFormatter.toRelativeTime(localDate)

                    return {
                        comment,
                        user,
                        createdAt,
                    }
                })
                .filter((response): response is CommentResponse => response !== null)

            return {
                success: true,
                comments: responseComments,
                pagination: {
                    page,
                    limit,
                    total,
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
    
}
