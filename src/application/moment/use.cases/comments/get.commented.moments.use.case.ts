import { Moment } from "@/domain/moment/entities/moment.entity"
import { ICommentRepository } from "@/domain/moment/repositories/comment.repository"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"

export interface GetCommentedMomentsRequest {
    userId: string
    page?: number
    limit?: number
    sortBy?: "createdAt" | "updatedAt"
    sortOrder?: "asc" | "desc"
}

export interface GetCommentedMomentsResponse {
    success: boolean
    moments?: Moment[]
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    error?: string
}

export class GetCommentedMomentsUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly momentRepository: IMomentRepository,
    ) {}

    async execute(request: GetCommentedMomentsRequest): Promise<GetCommentedMomentsResponse> {
        try {
            const page = request.page || 1
            const limit = Math.min(request.limit || 20, 100)

            // Buscar comentários do usuário
            const userComments = await this.commentRepository.findByUserId(
                request.userId,
                limit,
                (page - 1) * limit,
            )

            // Extrair IDs únicos dos momentos
            const momentIds = [...new Set(userComments.map((comment) => comment.momentId))]

            // Buscar os momentos correspondentes
            const moments: Moment[] = []
            for (const momentId of momentIds) {
                const moment = await this.momentRepository.findById(momentId)
                if (moment) {
                    moments.push(moment)
                }
            }

            // Ordenar momentos
            const sortBy = request.sortBy || "createdAt"
            const sortOrder = request.sortOrder || "desc"

            moments.sort((a, b) => {
                const aValue = a[sortBy as keyof Moment] as Date
                const bValue = b[sortBy as keyof Moment] as Date

                if (sortOrder === "asc") {
                    return aValue.getTime() - bValue.getTime()
                } else {
                    return bValue.getTime() - aValue.getTime()
                }
            })

            // Contar total de momentos comentados
            const totalComments = await this.commentRepository.countByUserId(request.userId)
            const uniqueMomentCount = momentIds.length
            const totalPages = Math.ceil(uniqueMomentCount / limit)

            return {
                success: true,
                moments,
                pagination: {
                    page,
                    limit,
                    total: uniqueMomentCount,
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
