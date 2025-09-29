import { MomentEntity, MomentStatusEnum } from "@/domain/moment"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface LikeMomentRequest {
    momentId: string
    userId: string
}

export interface LikeMomentResponse {
    success: boolean
    liked?: boolean
    error?: string
}

export class LikeMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: LikeMomentRequest): Promise<LikeMomentResponse> {
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

            // Buscar o momento
            const moment = await this.momentService.getMomentById(request.momentId)

            if (!moment) {
                return {
                    success: false,
                    error: "Momento não encontrado",
                }
            }

            // Verificar se o momento pode ser curtido
            if (!this.canLikeMoment(moment)) {
                return {
                    success: false,
                    error: "Momento não pode ser curtido no estado atual",
                }
            }

            // Verificar se o usuário já curtiu o momento
            const alreadyLiked = await this.momentService.hasUserLikedMoment(
                request.momentId,
                request.userId,
            )

            if (alreadyLiked) {
                return {
                    success: false,
                    error: "Usuário já curtiu este momento",
                }
            }

            // Curtir o momento
            await this.momentService.likeMoment(request.momentId, request.userId)

            return {
                success: true,
                liked: true,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    private canLikeMoment(moment: MomentEntity): boolean {
        // Verificar se o momento não está deletado
        if (moment.deletedAt) {
            return false
        }

        // Verificar se o momento está publicado
        if (moment.status.current !== MomentStatusEnum.PUBLISHED) {
            return false
        }

        return true
    }
}
