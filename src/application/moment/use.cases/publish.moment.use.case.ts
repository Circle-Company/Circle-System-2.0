import { MomentEntity, MomentStatusEnum } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentService } from "../services/moment.service"

export interface PublishMomentRequest {
    momentId: string
    userId: string // Quem está publicando (deve ser o owner)
}

export interface PublishMomentResponse {
    success: boolean
    moment?: MomentEntity
    error?: string
}

export class PublishMomentUseCase {
    constructor(
        private readonly momentRepository: IMomentRepository,
        private readonly momentService: MomentService
    ) {}

    async execute(request: PublishMomentRequest): Promise<PublishMomentResponse> {
        try {
            // Validar parâmetros
            if (!request.momentId) {
                return {
                    success: false,
                    error: "ID do momento é obrigatório"
                }
            }

            if (!request.userId) {
                return {
                    success: false,
                    error: "ID do usuário é obrigatório"
                }
            }

            // Buscar o momento
            const moment = await this.momentService.getMomentById(request.momentId)

            if (!moment) {
                return {
                    success: false,
                    error: "Momento não encontrado"
                }
            }

            // Verificar se o usuário é o dono do momento
            if (moment.ownerId !== request.userId) {
                return {
                    success: false,
                    error: "Apenas o dono do momento pode publicá-lo"
                }
            }

            // Verificar se o momento pode ser publicado
            if (!this.canPublishMoment(moment)) {
                return {
                    success: false,
                    error: "Momento não pode ser publicado no estado atual"
                }
            }

            // Publicar o momento
            const updatedMoment = await this.momentService.updateMoment(request.momentId, {
                status: {
                    current: MomentStatusEnum.PUBLISHED,
                    previous: moment.status.current,
                    reason: "Publicado pelo usuário",
                    changedBy: request.userId,
                    changedAt: new Date()
                },
                publishedAt: new Date()
            })

            return {
                success: true,
                moment: updatedMoment
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor"
            }
        }
    }

    private canPublishMoment(moment: MomentEntity): boolean {
        // Verificar se o momento não está deletado
        if (moment.deletedAt) {
            return false
        }

        // Verificar se o momento não está bloqueado
        if (moment.status.current === MomentStatusEnum.BLOCKED) {
            return false
        }

        // Verificar se o processamento foi concluído
        if (moment.processing?.status !== "completed") {
            return false
        }

        // Verificar se o conteúdo é válido
        if (!moment.isContentValid()) {
            return false
        }

        // Verificar se o momento não está já publicado
        if (moment.status.current === MomentStatusEnum.PUBLISHED) {
            return false
        }

        return true
    }
}
