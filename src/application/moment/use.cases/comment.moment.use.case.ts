import { MomentEntity, MomentStatusEnum } from "@/domain/moment"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface CommentMomentRequest {
    momentId: string
    userId: string
    content: string
    parentCommentId?: string
}

export interface CommentMomentResponse {
    success: boolean
    comment?: {
        id: string
        momentId: string
        userId: string
        content: string
        parentCommentId?: string
        createdAt: Date
    }
    error?: string
}

export class CommentMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: CommentMomentRequest): Promise<CommentMomentResponse> {
        try {
            // Validar parâmetros
            if (!request.momentId) {
                return {
                    success: false,
                    error: "ID do momento é obrigatório",
                }
            }

            if (!request.userId) {
                return {
                    success: false,
                    error: "ID do usuário é obrigatório",
                }
            }

            if (!request.content || request.content.trim().length === 0) {
                return {
                    success: false,
                    error: "Conteúdo do comentário é obrigatório",
                }
            }

            if (request.content.length > 1000) {
                return {
                    success: false,
                    error: "Comentário não pode ter mais de 1000 caracteres",
                }
            }

            // Buscar o momento
            const moment = await this.momentService.getMomentById(request.momentId)

            if (!moment) {
                return {
                    success: false,
                    error: "Momento não encontrado",
                }
            }

            // Verificar se o momento pode ser comentado
            if (!this.canCommentMoment(moment)) {
                return {
                    success: false,
                    error: "Momento não pode ser comentado no estado atual",
                }
            }

            // Verificar se o comentário pai existe (se fornecido)
            if (request.parentCommentId) {
                const parentComment = await this.momentService.getCommentById(
                    request.parentCommentId,
                )
                if (!parentComment) {
                    return {
                        success: false,
                        error: "Comentário pai não encontrado",
                    }
                }
            }

            // Criar o comentário
            const comment = await this.momentService.createComment({
                momentId: request.momentId,
                userId: request.userId,
                content: request.content.trim(),
                parentCommentId: request.parentCommentId,
            })

            return {
                success: true,
                comment: {
                    id: comment.id,
                    momentId: comment.momentId,
                    userId: comment.userId,
                    content: comment.content,
                    parentCommentId: comment.parentCommentId,
                    createdAt: comment.createdAt,
                },
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    private canCommentMoment(moment: MomentEntity): boolean {
        // Verificar se o momento não está deletado
        if (moment.deletedAt) {
            return false
        }

        // Verificar se o momento está publicado
        if (moment.status.current !== MomentStatusEnum.PUBLISHED) {
            return false
        }

        // Verificar se o momento não está bloqueado
        if (moment.status.current === MomentStatusEnum.BLOCKED) {
            return false
        }

        return true
    }
}
