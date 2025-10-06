import { Comment } from "@/domain/moment/entities/comment.entity"
import { ICommentRepository } from "@/domain/moment/repositories/comment.repository"
import { IUserRepository } from "@/domain/user/repositories/user.repository"

export interface EditMomentCommentRequest {
    momentId: string
    commentId: string
    userId: string
    content: string
}

export interface EditMomentCommentResponse {
    success: boolean
    comment?: Comment
    error?: string
}

export class EditMomentCommentUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(request: EditMomentCommentRequest): Promise<EditMomentCommentResponse> {
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

            // Verificar se o usuário pode editar o comentário
            const canEdit = comment.canEditComment(request.userId, user)
            if (!canEdit.allowed) {
                return {
                    success: false,
                    error: canEdit.reason || "Não autorizado a editar este comentário",
                }
            }

            // Editar o conteúdo
            const editResult = comment.editContent(request.content, request.userId, user)
            if (!editResult.success) {
                return {
                    success: false,
                    error: editResult.error,
                }
            }

            // Salvar as alterações
            const updatedComment = await this.commentRepository.update(comment)

            return {
                success: true,
                comment: updatedComment,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
