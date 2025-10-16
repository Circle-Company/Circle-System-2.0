import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { IUserRepository } from "@/domain/user"
import { logger } from "@/shared"

// ===== DTOs PARA VISUALIZAÇÃO =====
export interface ViewMomentInputDto {
    momentId: string
    viewerId: string
    viewDuration?: number
    viewSource?: string
    deviceType?: string
    userAgent?: string
    ipAddress?: string
}

export interface ViewMomentOutputDto {
    success: boolean
    viewability: {
        allowed: boolean
        reason: string
        message: string
        metadata?: any
    }
    moment?: {
        id: string
        description: string
        ownerId: string
        visibility: {
            level: string
            ageRestriction: boolean
            contentWarning: boolean
        }
        media: {
            urls: {
                low: string | null
                medium: string | null
                high: string | null
            }
            duration: number
        }
        thumbnail: {
            url: string
            width: number
            height: number
        }
        metrics: {
            viewCount: number
            likeCount: number
            shareCount: number
            commentCount: number
        }
        createdAt: Date
        publishedAt: Date | null
    }
    viewStatistics?: {
        totalViews: number
        uniqueViews: number
        averageViewDuration: number
        completeViewRate: number
        lastViewedAt: Date | null
    }
    error?: string
}

// ===== USE CASE DE VISUALIZAÇÃO =====
export class ViewMomentUseCase {
    constructor(
        private momentRepository: IMomentRepository,
        private userRepository: IUserRepository,
    ) {}

    /**
     * Executa a visualização de um momento com validações robustas
     */
    async execute(input: ViewMomentInputDto): Promise<ViewMomentOutputDto> {
        try {
            logger.info(
                `Iniciando visualização do moment ${input.momentId} por usuário ${input.viewerId}`,
            )

            // 1. Buscar o momento
            const moment = await this.momentRepository.findById(input.momentId)
            if (!moment) {
                return {
                    success: false,
                    viewability: {
                        allowed: false,
                        reason: "MOMENT_NOT_FOUND",
                        message: "Momento não encontrado",
                    },
                    error: "Momento não existe",
                }
            }

            // 2. Buscar dados dos usuários
            const [ownerUser, viewerUser] = await Promise.all([
                this.userRepository.findById(moment.ownerId),
                this.userRepository.findById(input.viewerId),
            ])

            if (!viewerUser) {
                return {
                    success: false,
                    viewability: {
                        allowed: false,
                        reason: "VIEWER_NOT_FOUND",
                        message: "Usuário visualizador não encontrado",
                    },
                    error: "Usuário não existe",
                }
            }

            // 3. Verificar relacionamento entre usuários (seguindo/bloqueio)
            const [isFollowing, isBlocked] = await Promise.all([
                this.userRepository.isFollowing(input.viewerId, moment.ownerId),
                this.userRepository.isBlocked(input.viewerId, moment.ownerId),
            ])

            // 4. Verificar se o momento pode ser visualizado
            const viewabilityResult = await moment.isViewable(viewerUser, this.userRepository)

            // 5. Se não pode visualizar, retornar erro
            if (!viewabilityResult.allowed) {
                return {
                    success: false,
                    viewability: {
                        allowed: false,
                        reason: viewabilityResult.reason,
                        message: viewabilityResult.message,
                        metadata: viewabilityResult.metadata,
                    },
                    error: viewabilityResult.message,
                }
            }

            // 6. Registrar a visualização
            await moment.recordView(input.viewerId, input.viewDuration, input.viewSource)

            // 7. Buscar estatísticas atualizadas
            const viewStatistics = await moment.getViewStatistics()

            // 8. Construir resposta de sucesso
            return {
                success: true,
                viewability: {
                    allowed: true,
                    reason: viewabilityResult.reason,
                    message: viewabilityResult.message,
                    metadata: viewabilityResult.metadata,
                },
                moment: {
                    id: moment.id,
                    description: moment.description,
                    ownerId: moment.ownerId,
                    visibility: {
                        level: moment.visibility.level,
                        ageRestriction: moment.visibility.ageRestriction,
                        contentWarning: moment.visibility.contentWarning,
                    },
                    media: {
                        urls: {
                            low: moment.media.url,
                            medium: moment.media.url,
                            high: moment.media.url,
                        },
                        duration: moment.content.duration,
                    },
                    thumbnail: {
                        url: moment.thumbnail.url,
                        width: moment.thumbnail.width,
                        height: moment.thumbnail.height,
                    },
                    metrics: {
                        viewCount: moment.metrics.views.totalViews,
                        likeCount: moment.metrics.engagement.totalLikes,
                        shareCount: moment.metrics.engagement.totalReports,
                        commentCount: moment.metrics.engagement.totalComments,
                    },
                    createdAt: moment.createdAt,
                    publishedAt: moment.publishedAt,
                },
                viewStatistics,
            }
        } catch (error) {
            logger.error(`Erro ao visualizar moment ${input.momentId}:`, error)

            return {
                success: false,
                viewability: {
                    allowed: false,
                    reason: "SYSTEM_ERROR",
                    message: "Erro interno do sistema",
                },
                error: error instanceof Error ? error.message : "Erro desconhecido",
            }
        }
    }

    /**
     * Verifica apenas se um momento pode ser visualizado (sem registrar visualização)
     */
    async canView(input: { momentId: string; viewerId: string }): Promise<{
        success: boolean
        viewability: {
            allowed: boolean
            reason: string
            message: string
            metadata?: any
        }
        error?: string
    }> {
        try {
            // Buscar o momento
            const moment = await this.momentRepository.findById(input.momentId)
            if (!moment) {
                return {
                    success: false,
                    viewability: {
                        allowed: false,
                        reason: "MOMENT_NOT_FOUND",
                        message: "Momento não encontrado",
                    },
                    error: "Momento não existe",
                }
            }

            // Buscar dados dos usuários
            const [ownerUser, viewerUser] = await Promise.all([
                this.userRepository.findById(moment.ownerId),
                this.userRepository.findById(input.viewerId),
            ])

            if (!viewerUser) {
                return {
                    success: false,
                    viewability: {
                        allowed: false,
                        reason: "VIEWER_NOT_FOUND",
                        message: "Usuário visualizador não encontrado",
                    },
                    error: "Usuário não existe",
                }
            }

            // Verificar relacionamento entre usuários
            const [isFollowing, isBlocked] = await Promise.all([
                this.userRepository.isFollowing(input.viewerId, moment.ownerId),
                this.userRepository.isBlocked(input.viewerId, moment.ownerId),
            ])

            // Verificar se pode visualizar
            const viewabilityResult = await moment.isViewable(viewerUser, this.userRepository)

            return {
                success: true,
                viewability: {
                    allowed: viewabilityResult.allowed,
                    reason: viewabilityResult.reason,
                    message: viewabilityResult.message,
                    metadata: viewabilityResult.metadata,
                },
            }
        } catch (error) {
            logger.error(`Erro ao verificar visualização do moment ${input.momentId}:`, error)

            return {
                success: false,
                viewability: {
                    allowed: false,
                    reason: "SYSTEM_ERROR",
                    message: "Erro interno do sistema",
                },
                error: error instanceof Error ? error.message : "Erro desconhecido",
            }
        }
    }

    /**
     * Obtém estatísticas de visualização de um momento
     */
    async getViewStatistics(momentId: string): Promise<{
        success: boolean
        statistics?: {
            totalViews: number
            uniqueViews: number
            averageViewDuration: number
            completeViewRate: number
            lastViewedAt: Date | null
            isPopular: boolean
        }
        error?: string
    }> {
        try {
            const moment = await this.momentRepository.findById(momentId)
            if (!moment) {
                return {
                    success: false,
                    error: "Momento não encontrado",
                }
            }

            const statistics = await moment.getViewStatistics()
            const isPopular = await moment.isPopular()

            return {
                success: true,
                statistics: {
                    ...statistics,
                    isPopular,
                },
            }
        } catch (error) {
            logger.error(`Erro ao obter estatísticas do moment ${momentId}:`, error)

            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            }
        }
    }
}
