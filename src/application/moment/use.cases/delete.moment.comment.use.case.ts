import { ICommentRepository } from "@/domain/moment/repositories/comment.repository"
import { IUserRepository } from "@/domain/user/repositories/user.repository"

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
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(request: DeleteMomentCommentRequest): Promise<DeleteMomentCommentResponse> {
        try {
            // Validar se o usuário existe
            const user = await this.userRepository.findById(request.userId)
            if (!user) {
                return {
                    success: false,
                    error: "Usuário não encontrado",
                }
            }

            // Buscar o comentário
            const comment = await this.commentRepository.findById(request.commentId)
            if (!comment) {
                return {
                    success: false,
                    error: "Comentário não encontrado",
                }
            }

            // Verificar se o comentário pertence ao momento correto
            if (comment.momentId !== request.momentId) {
                return {
                    success: false,
                    error: "Comentário não pertence a este momento",
                }
            }

            // Verificar se o usuário pode deletar o comentário
            const canDelete = comment.canDeleteComment(request.userId, user)
            if (!canDelete.allowed) {
                return {
                    success: false,
                    error: canDelete.reason || "Não autorizado a deletar este comentário",
                }
            }

            // Se o usuário tem permissão de admin, fazer hard delete
            if (user.canAccessAdminFeatures()) {
                await this.commentRepository.delete(request.commentId)
            } else {
                // Caso contrário, fazer soft delete
                comment.delete(request.userId)
                await this.commentRepository.update(comment)
            }

            // Se o comentário tinha um pai, decrementar contador de respostas
            if (comment.parentCommentId) {
                await this.commentRepository.decrementReplies(comment.parentCommentId)
            }

            return {
                success: true,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
