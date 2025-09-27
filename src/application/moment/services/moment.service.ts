import { MomentEntity, MomentProps, MomentStatusEnum, MomentVisibilityEnum } from "@/domain/moment"
import { MomentProcessingRulesFactory, MomentProcessingValidator } from "@/domain/moment/rules"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { generateId } from "@/shared"
import { MomentMetricsService } from "./services/moment.metrics.service"

// ===== INTERFACES =====
export interface CreateMomentData {
    ownerId: string
    content: {
        duration: number
        size: number
        format: string
        width: number
        height: number
        hasAudio: boolean
        codec: string
    }
    description?: string
    hashtags?: string[]
    mentions?: string[]
    location?: {
        latitude: number
        longitude: number
    }
    device?: {
        type: string
        os: string
        osVersion: string
        model: string
        screenResolution: string
        orientation: string
    }
}

export interface UpdateMomentData {
    description?: string
    hashtags?: string[]
    mentions?: string[]
    status?: MomentStatusEnum
    visibility?: MomentVisibilityEnum
}

export interface MomentSearchFilters {
    ownerId?: string
    status?: MomentStatusEnum
    visibility?: MomentVisibilityEnum
    hashtags?: string[]
    mentions?: string[]
    location?: {
        latitude: number
        longitude: number
        radius: number
    }
    dateRange?: {
        start: Date
        end: Date
    }
    quality?: {
        min: number
        max: number
    }
}

export interface MomentSortOptions {
    field: "createdAt" | "updatedAt" | "publishedAt" | "views" | "likes" | "engagement"
    direction: "asc" | "desc"
}

export interface MomentPaginationOptions {
    page: number
    limit: number
    offset?: number
}

export interface MomentServiceConfig {
    enableValidation: boolean
    enableMetrics: boolean
    enableProcessing: boolean
    defaultVisibility: MomentVisibilityEnum
    defaultStatus: MomentStatusEnum
    maxSearchResults: number
    enableCaching: boolean
    cacheTimeout: number
}

// ===== SERVIÇO PRINCIPAL DE MOMENT =====
export class MomentService {
    private config: MomentServiceConfig
    private validator: MomentProcessingValidator

    constructor(
        private repository: IMomentRepository,
        private metricsService: MomentMetricsService,
        config?: Partial<MomentServiceConfig>,
    ) {
        this.config = {
            enableValidation: true,
            enableMetrics: true,
            enableProcessing: true,
            defaultVisibility: MomentVisibilityEnum.PRIVATE,
            defaultStatus: MomentStatusEnum.UNDER_REVIEW,
            maxSearchResults: 1000,
            enableCaching: false,
            cacheTimeout: 300000, // 5 minutos
            ...config,
        }

        this.validator = MomentProcessingRulesFactory.createDefault()
    }

    // ===== MÉTODOS DE CRIAÇÃO =====

    /**
     * Cria um novo momento
     */
    async createMoment(data: CreateMomentData): Promise<MomentEntity> {
        // Validar dados de entrada
        if (this.config.enableValidation) {
            await this.validateCreateData(data)
        }

        // Criar entidade do momento
        const momentProps: MomentProps = {
            id: generateId(),
            ownerId: data.ownerId,
            content: {
                duration: data.content.duration,
                size: data.content.size,
                format: data.content.format as any,
                resolution: {
                    width: data.content.width,
                    height: data.content.height,
                    quality: "medium" as any,
                },
                hasAudio: data.content.hasAudio,
                codec: data.content.codec as any,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            description: data.description || "",
            hashtags: data.hashtags || [],
            mentions: data.mentions || [],
            status: {
                current: this.config.defaultStatus,
                previous: null,
                reason: null,
                changedBy: data.ownerId,
                changedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            visibility: {
                level: this.config.defaultVisibility,
                allowedUsers: [],
                blockedUsers: [],
                ageRestriction: false,
                contentWarning: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            context:
                data.location && data.device
                    ? {
                          device: {
                              type: data.device.type,
                              os: data.device.os,
                              osVersion: data.device.osVersion,
                              model: data.device.model,
                              screenResolution: data.device.screenResolution,
                              orientation: data.device.orientation,
                          },
                          location: {
                              latitude: data.location.latitude,
                              longitude: data.location.longitude,
                          },
                      }
                    : undefined,
            processing: {
                status: "pending" as any,
                progress: 0,
                steps: [],
                error: null,
                startedAt: null,
                completedAt: null,
                estimatedCompletion: null,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedAt: null,
            archivedAt: null,
            deletedAt: null,
        }

        // Salvar no repositório
        const createdMoment = await this.repository.create(momentProps)

        // Inicializar métricas se habilitado
        if (this.config.enableMetrics) {
            await this.metricsService.recordView(createdMoment.id, {
                userId: data.ownerId,
                device: data.device?.type,
                location: data.location
                    ? `${data.location.latitude},${data.location.longitude}`
                    : undefined,
            })
        }

        return createdMoment
    }

    /**
     * Cria múltiplos momentos em lote
     */
    async createMomentsBatch(data: CreateMomentData[]): Promise<MomentEntity[]> {
        const results: MomentEntity[] = []

        for (const momentData of data) {
            try {
                const moment = await this.createMoment(momentData)
                results.push(moment)
            } catch (error) {
                console.error(`Erro ao criar momento para ${momentData.ownerId}:`, error)
                // Continuar com os próximos momentos
            }
        }

        return results
    }

    // ===== MÉTODOS DE BUSCA =====

    /**
     * Busca um momento por ID
     */
    async getMomentById(id: string): Promise<MomentEntity | null> {
        return await this.repository.findById(id)
    }

    /**
     * Busca momentos por proprietário
     */
    async getMomentsByOwner(
        ownerId: string,
        options?: {
            status?: MomentStatusEnum
            visibility?: MomentVisibilityEnum
            limit?: number
            offset?: number
        },
    ): Promise<MomentEntity[]> {
        return await this.repository.findByOwnerId(ownerId, options)
    }

    /**
     * Busca momentos por status
     */
    async getMomentsByStatus(
        status: MomentStatusEnum,
        options?: {
            limit?: number
            offset?: number
        },
    ): Promise<MomentEntity[]> {
        return await this.repository.findByStatus(status, options)
    }

    /**
     * Busca momentos por visibilidade
     */
    async getMomentsByVisibility(
        visibility: MomentVisibilityEnum,
        options?: {
            limit?: number
            offset?: number
        },
    ): Promise<MomentEntity[]> {
        return await this.repository.findByVisibility(visibility, options)
    }

    /**
     * Busca momentos por hashtag
     */
    async getMomentsByHashtag(
        hashtag: string,
        options?: {
            limit?: number
            offset?: number
        },
    ): Promise<MomentEntity[]> {
        return await this.repository.findByHashtag(hashtag, options)
    }

    /**
     * Busca momentos por menção
     */
    async getMomentsByMention(
        mention: string,
        options?: {
            limit?: number
            offset?: number
        },
    ): Promise<MomentEntity[]> {
        return await this.repository.findByMention(mention, options)
    }

    /**
     * Busca momentos publicados
     */
    async getPublishedMoments(options?: {
        limit?: number
        offset?: number
    }): Promise<MomentEntity[]> {
        return await this.repository.findPublished(options)
    }

    /**
     * Busca momentos em tendência
     */
    async getTrendingMoments(options?: {
        limit?: number
        offset?: number
    }): Promise<MomentEntity[]> {
        return await this.repository.findTrending(options)
    }

    /**
     * Busca momentos recentes
     */
    async getRecentMoments(options?: { limit?: number; offset?: number }): Promise<MomentEntity[]> {
        return await this.repository.findRecent(options)
    }

    /**
     * Busca momentos por localização
     */
    async getMomentsByLocation(
        latitude: number,
        longitude: number,
        radius: number,
        options?: {
            limit?: number
            offset?: number
        },
    ): Promise<MomentEntity[]> {
        return await this.repository.findByLocation(latitude, longitude, radius, options)
    }

    /**
     * Busca genérica com filtros
     */
    async searchMoments(
        filters: MomentSearchFilters,
        sort?: MomentSortOptions,
        pagination?: MomentPaginationOptions,
    ): Promise<{
        moments: MomentEntity[]
        total: number
        page: number
        limit: number
        hasNext: boolean
        hasPrev: boolean
    }> {
        return await this.repository.findPaginated(filters, sort, pagination)
    }

    // ===== MÉTODOS DE ATUALIZAÇÃO =====

    /**
     * Atualiza um momento
     */
    async updateMoment(id: string, data: UpdateMomentData): Promise<MomentEntity | null> {
        const existingMoment = await this.repository.findById(id)
        if (!existingMoment) {
            throw new Error(`Momento com ID ${id} não encontrado`)
        }

        // Validar dados de atualização
        if (this.config.enableValidation) {
            await this.validateUpdateData(data)
        }

        // Atualizar propriedades
        const updatedProps: Partial<MomentProps> = {}

        if (data.description !== undefined) {
            updatedProps.description = data.description
        }

        if (data.hashtags !== undefined) {
            updatedProps.hashtags = data.hashtags
        }

        if (data.mentions !== undefined) {
            updatedProps.mentions = data.mentions
        }

        if (data.status !== undefined) {
            updatedProps.status = {
                ...existingMoment.status,
                current: data.status,
                previous: existingMoment.status.current,
                changedBy: existingMoment.ownerId,
                changedAt: new Date(),
                updatedAt: new Date(),
            }
        }

        if (data.visibility !== undefined) {
            updatedProps.visibility = {
                ...existingMoment.visibility,
                level: data.visibility,
                updatedAt: new Date(),
            }
        }

        updatedProps.updatedAt = new Date()

        // Salvar atualizações
        const updatedMoment = await this.repository.update(id, updatedProps)

        // Registrar métricas se habilitado
        if (this.config.enableMetrics && updatedMoment) {
            await this.metricsService.recordView(updatedMoment.id, {
                userId: updatedMoment.ownerId,
            })
        }

        return updatedMoment
    }

    /**
     * Atualiza múltiplos momentos em lote
     */
    async updateMomentsBatch(
        updates: Array<{ id: string; data: UpdateMomentData }>,
    ): Promise<MomentEntity[]> {
        const results: MomentEntity[] = []

        for (const update of updates) {
            try {
                const updatedMoment = await this.updateMoment(update.id, update.data)
                if (updatedMoment) {
                    results.push(updatedMoment)
                }
            } catch (error) {
                console.error(`Erro ao atualizar momento ${update.id}:`, error)
                // Continuar com os próximos momentos
            }
        }

        return results
    }

    // ===== MÉTODOS DE EXCLUSÃO =====

    /**
     * Exclui um momento (soft delete)
     */
    async deleteMoment(id: string, reason?: string): Promise<boolean> {
        const existingMoment = await this.repository.findById(id)
        if (!existingMoment) {
            throw new Error(`Momento com ID ${id} não encontrado`)
        }

        // Atualizar status para deletado
        const updatedProps: Partial<MomentProps> = {
            status: {
                ...existingMoment.status,
                current: MomentStatusEnum.DELETED,
                previous: existingMoment.status.current,
                reason: reason || "Excluído pelo usuário",
                changedBy: existingMoment.ownerId,
                changedAt: new Date(),
                updatedAt: new Date(),
            },
            deletedAt: new Date(),
            updatedAt: new Date(),
        }

        const result = await this.repository.update(id, updatedProps)
        return result !== null
    }

    /**
     * Exclui múltiplos momentos em lote
     */
    async deleteMomentsBatch(ids: string[], reason?: string): Promise<number> {
        let deletedCount = 0

        for (const id of ids) {
            try {
                const deleted = await this.deleteMoment(id, reason)
                if (deleted) {
                    deletedCount++
                }
            } catch (error) {
                console.error(`Erro ao excluir momento ${id}:`, error)
                // Continuar com os próximos momentos
            }
        }

        return deletedCount
    }

    // ===== MÉTODOS DE ESTATÍSTICAS =====

    /**
     * Conta momentos por proprietário
     */
    async countMomentsByOwner(ownerId: string): Promise<number> {
        return await this.repository.countByOwnerId(ownerId)
    }

    /**
     * Conta momentos por status
     */
    async countMomentsByStatus(status: MomentStatusEnum): Promise<number> {
        return await this.repository.countByStatus(status)
    }

    /**
     * Conta momentos por visibilidade
     */
    async countMomentsByVisibility(visibility: MomentVisibilityEnum): Promise<number> {
        return await this.repository.countByVisibility(visibility)
    }

    /**
     * Conta momentos publicados
     */
    async countPublishedMoments(): Promise<number> {
        return await this.repository.countPublished()
    }

    /**
     * Verifica se um momento existe
     */
    async momentExists(id: string): Promise<boolean> {
        return await this.repository.exists(id)
    }

    /**
     * Verifica se um proprietário tem momentos
     */
    async ownerHasMoments(ownerId: string): Promise<boolean> {
        return await this.repository.existsByOwnerId(ownerId)
    }

    // ===== MÉTODOS DE MÉTRICAS =====

    /**
     * Obtém métricas de um momento
     */
    async getMomentMetrics(momentId: string) {
        if (!this.config.enableMetrics) {
            throw new Error("Métricas não estão habilitadas")
        }

        return await this.metricsService.getMetrics(momentId)
    }

    /**
     * Obtém métricas agregadas de múltiplos momentos
     */
    async getAggregatedMetrics(momentIds: string[]) {
        if (!this.config.enableMetrics) {
            throw new Error("Métricas não estão habilitadas")
        }

        return await this.metricsService.getAggregatedMetrics(momentIds)
    }

    /**
     * Obtém conteúdo em tendência
     */
    async getTrendingContent(limit: number = 10) {
        if (!this.config.enableMetrics) {
            throw new Error("Métricas não estão habilitadas")
        }

        return await this.metricsService.getTrendingContent(limit)
    }

    /**
     * Obtém conteúdo viral
     */
    async getViralContent(limit: number = 10) {
        if (!this.config.enableMetrics) {
            throw new Error("Métricas não estão habilitadas")
        }

        return await this.metricsService.getViralContent(limit)
    }

    // ===== MÉTODOS PRIVADOS =====

    /**
     * Valida dados de criação
     */
    private async validateCreateData(data: CreateMomentData): Promise<void> {
        // Validar conteúdo
        const contentValidation = this.validator.validateContent({
            duration: data.content.duration,
            size: data.content.size,
            format: data.content.format,
            width: data.content.width,
            height: data.content.height,
        })

        if (!contentValidation.isValid) {
            throw new Error(`Dados de conteúdo inválidos: ${contentValidation.errors.join(", ")}`)
        }

        // Validar texto
        const textValidation = this.validator.validateText({
            description: data.description || "",
            hashtags: data.hashtags || [],
            mentions: data.mentions || [],
        })

        if (!textValidation.isValid) {
            throw new Error(`Dados de texto inválidos: ${textValidation.errors.join(", ")}`)
        }
    }

    /**
     * Valida dados de atualização
     */
    private async validateUpdateData(data: UpdateMomentData): Promise<void> {
        // Validar texto se fornecido
        if (
            data.description !== undefined ||
            data.hashtags !== undefined ||
            data.mentions !== undefined
        ) {
            const textValidation = this.validator.validateText({
                description: data.description || "",
                hashtags: data.hashtags || [],
                mentions: data.mentions || [],
            })

            if (!textValidation.isValid) {
                throw new Error(`Dados de texto inválidos: ${textValidation.errors.join(", ")}`)
            }
        }
    }
}
