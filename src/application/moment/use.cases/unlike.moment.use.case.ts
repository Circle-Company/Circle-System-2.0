import { MomentEntity, MomentStatusEnum } from "@/domain/moment"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface UnlikeMomentRequest {
    momentId: string
    userId: string
}

export interface UnlikeMomentResponse {
    success: boolean
    unliked?: boolean
    error?: string
}

export class UnlikeMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService,
    ) {}

    async execute(request: UnlikeMomentRequest): Promise<UnlikeMomentResponse> {
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

            // Verificar se o momento pode ser descurtido
            if (!this.canUnlikeMoment(moment)) {
                return {
                    success: false,
                    error: "Momento não pode ser descurtido no estado atual",
                }
            }

            // Verificar se o usuário curtiu o momento
            const hasLiked = await this.momentService.hasUserLikedMoment(
                request.momentId,
                request.userId,
            )

            if (!hasLiked) {
                return {
                    success: false,
                    error: "Usuário não curtiu este momento",
                }
            }

            // Descurtir o momento
            await this.momentService.unlikeMoment(request.momentId, request.userId)

            return {
                success: true,
                unliked: true,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    private canUnlikeMoment(moment: MomentEntity): boolean {
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
