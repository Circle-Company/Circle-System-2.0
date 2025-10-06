import { Comment } from "@/domain/moment/entities/comment.entity"
import { ICommentRepository } from "@/domain/moment/repositories/comment.repository"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { IUserRepository } from "@/domain/user/repositories/user.repository"

export interface CommentMomentRequest {
    momentId: string
    userId: string
    content: string
    parentCommentId?: string
}

export interface CommentMomentResponse {
    success: boolean
    comment?: Comment
    error?: string
}

export class CommentMomentUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly momentRepository: IMomentRepository,
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(request: CommentMomentRequest): Promise<CommentMomentResponse> {
        try {
            // Validar se o usuário existe e pode comentar
            const user = await this.userRepository.findById(request.userId)
            if (!user) {
                return {
                    success: false,
                    error: "Usuário não encontrado",
                }
            }

            // Verificar se o usuário pode comentar
            if (!user.canInteractWithMoments()) {
                return {
                    success: false,
                    error: "Usuário não pode interagir com momentos",
                }
            }

            // Validar se o momento existe
            const moment = await this.momentRepository.findById(request.momentId)
            if (!moment) {
                return {
                    success: false,
                    error: "Momento não encontrado",
                }
            }

            // Verificar se o momento é interagível
            const isInteractable = await moment.isInteractable(request.userId, this.userRepository)
            if (!isInteractable) {
                return {
                    success: false,
                    error: "Momento não está disponível para comentários",
                }
            }

            // Se for uma resposta a outro comentário, verificar se o comentário pai existe
            if (request.parentCommentId) {
                const parentComment = await this.commentRepository.findById(request.parentCommentId)
                if (!parentComment) {
                    return {
                        success: false,
                        error: "Comentário pai não encontrado",
                    }
                }

                // Verificar se o comentário pai pertence ao mesmo momento
                if (parentComment.momentId !== request.momentId) {
                    return {
                        success: false,
                        error: "Comentário pai não pertence a este momento",
                    }
                }
            }

            // Criar o comentário
            const comment = Comment.create({
                momentId: request.momentId,
                authorId: request.userId,
                content: request.content,
                parentCommentId: request.parentCommentId,
            })

            // Salvar o comentário
            const savedComment = await this.commentRepository.create(comment)

            // Se for uma resposta, incrementar contador de respostas do comentário pai
            if (request.parentCommentId) {
                await this.commentRepository.incrementReplies(request.parentCommentId)
            }

            return {
                success: true,
                comment: savedComment,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
