import { ContentProcessor, StorageAdapter } from "@/core/content.processor"
import { Moment, MomentStatusEnum, MomentVisibilityEnum } from "@/domain/moment"
import { circleTextLibrary, generateId } from "@/shared"

import { ModerationEngine } from "@/core/content.moderation"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { TimezoneCode } from "@/domain/user"
import { MomentMetricsService } from "./moment.metrics.service"

export interface CreateMomentData {
    ownerId: string
    ownerUsername: string
    videoData: Buffer
    videoMetadata: {
        filename: string
        mimeType: string
        size: number
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
    timezone?: TimezoneCode
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
    private contentProcessor: ContentProcessor | null = null

    constructor(
        private repository: IMomentRepository,
        private metricsService: MomentMetricsService,
        config?: Partial<MomentServiceConfig>,
        storageAdapter?: StorageAdapter,
        moderationEngine?: ModerationEngine,
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

        // Inicializar processador de conteúdo se adapter fornecido
        if (storageAdapter) {
            this.contentProcessor = new ContentProcessor(
                storageAdapter,
                undefined,
                moderationEngine,
            )
        }
    }

    // ===== MÉTODOS DE CRIAÇÃO =====

    /**
     * Cria um novo momento
     */
    async createMoment(data: CreateMomentData): Promise<Moment> {
        // Validar dados de entrada
        if (this.config.enableValidation) {
            await this.validateCreateData(data)
        }

        // 1. Processar vídeo (extração de metadados, thumbnail, moderação e upload)
        if (!this.contentProcessor) {
            throw new Error("Content processor not configured. Please configure storage adapter.")
        }

        const processingResult = await this.contentProcessor.processContent({
            description: data.description || "",
            ownerId: data.ownerId,
            videoData: data.videoData,
            metadata: data.videoMetadata,
        })

        if (!processingResult.success) {
            throw new Error(
                `Error processing content: ${processingResult.error || "Unknown error"}`,
            )
        }

        // Verificar se foi aprovado pela moderação
        if (!processingResult.moderation.approved && !processingResult.moderation.requiresReview) {
            throw new Error(
                `Content blocked by moderation: ${processingResult.moderation.flags.join(", ")}`,
            )
        }

        // 2. Criar dados do momento com informações do processamento
        const momentData = {
            id: processingResult.contentId,
            ownerId: data.ownerId,
            content: {
                duration: processingResult.videoMetadata.duration,
                size: processingResult.videoMetadata.size,
                format: processingResult.videoMetadata.format as any,
                resolution: {
                    width: processingResult.videoMetadata.width,
                    height: processingResult.videoMetadata.height,
                    quality: "medium" as any,
                },
                hasAudio: processingResult.videoMetadata.hasAudio,
                codec: processingResult.videoMetadata.codec as any,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            description: data.description || "",
            enrichedDescription: processingResult.enrichedDescription || "",
            hashtags: data.hashtags || [],
            mentions: data.mentions || [],
            media: {
                urls: {
                    low: processingResult.videoUrls.low,
                    medium: processingResult.videoUrls.medium,
                    high: processingResult.videoUrls.high,
                },
                storage: {
                    provider: processingResult.storage.provider as any,
                    bucket: processingResult.storage.bucket || "",
                    key: processingResult.storage.videoKey,
                    region: processingResult.storage.region || "",
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            thumbnail: {
                url: processingResult.thumbnailUrl,
                width: processingResult.videoMetadata.width,
                height: processingResult.videoMetadata.height,
                storage: {
                    provider: processingResult.storage.provider as any,
                    bucket: processingResult.storage.bucket || "",
                    key: processingResult.storage.thumbnailKey,
                    region: processingResult.storage.region || "",
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            status: {
                current: processingResult.moderation.requiresReview
                    ? MomentStatusEnum.UNDER_REVIEW
                    : this.config.defaultStatus,
                previous: null,
                reason: processingResult.moderation.requiresReview
                    ? "Awaiting moderation review"
                    : null,
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
                status: "completed" as any,
                progress: 100,
                steps: [
                    {
                        name: "video_processing",
                        status: "completed" as any,
                        progress: 100,
                        startedAt: new Date(),
                        completedAt: new Date(),
                        error: null,
                    },
                    {
                        name: "moderation",
                        status: "completed" as any,
                        progress: 100,
                        startedAt: new Date(),
                        completedAt: new Date(),
                        error: null,
                    },
                    {
                        name: "upload",
                        status: "completed" as any,
                        progress: 100,
                        startedAt: new Date(),
                        completedAt: new Date(),
                        error: null,
                    },
                ],
                error: null,
                startedAt: new Date(),
                completedAt: new Date(),
                estimatedCompletion: null,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedAt: null,
            archivedAt: null,
            deletedAt: null,
        }

        // 3. Criar entidade Moment
        const moment = new Moment(momentData)

        // 4. Salvar no repositório
        const createdMoment = await this.repository.create(moment)

        // 5. Inicializar métricas se habilitado
        if (this.config.enableMetrics && createdMoment) {
            await this.metricsService.recordView(createdMoment.id, {
                userId: data.ownerId,
                device: data.device?.type,
                location: data.location
                    ? `${data.location.latitude},${data.location.longitude}`
                    : undefined,
            })
        }

        return createdMoment || ({} as Moment)
    }

    // ===== MÉTODOS DE BUSCA =====

    /**
     * Busca um momento por ID
     */
    async getMomentById(id: string): Promise<Moment | null> {
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
    ): Promise<Moment[]> {
        return await this.repository.findByOwnerId(ownerId, options?.limit, options?.offset)
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
    ): Promise<Moment[]> {
        return await this.repository.findByStatus(status, options?.limit, options?.offset)
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
    ): Promise<Moment[]> {
        return await this.repository.findByVisibility(visibility, options?.limit, options?.offset)
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
    ): Promise<Moment[]> {
        return await this.repository.findByHashtag(hashtag, options?.limit, options?.offset)
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
    ): Promise<Moment[]> {
        return await this.repository.findByMention(mention, options?.limit, options?.offset)
    }

    /**
     * Busca momentos publicados
     */
    async getPublishedMoments(options?: { limit?: number; offset?: number }): Promise<Moment[]> {
        return await this.repository.findPublished(options?.limit, options?.offset)
    }

    /**
     * Busca momentos recentes
     */
    async getRecentMoments(options?: { limit?: number; offset?: number }): Promise<Moment[]> {
        return await this.repository.findRecent(options?.limit, options?.offset)
    }

    // ===== MÉTODOS DE ATUALIZAÇÃO =====

    /**
     * Atualiza um momento
     */
    async updateMoment(id: string, data: UpdateMomentData): Promise<Moment | null> {
        const existingMoment = await this.repository.findById(id)
        if (!existingMoment) {
            throw new Error(`Moment with ID ${id} not found`)
        }

        // Validar dados de atualização
        if (this.config.enableValidation) {
            await this.validateUpdateData(data)
        }

        // Atualizar propriedades
        const updatedProps: any = {}

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

        // Aplicar atualizações ao momento existente
        Object.assign(existingMoment, updatedProps)

        // Salvar atualizações
        const updatedMoment = await this.repository.update(existingMoment)

        // Registrar métricas se habilitado
        if (this.config.enableMetrics && updatedMoment) {
            await this.metricsService.recordView(updatedMoment.id, {
                userId: updatedMoment.ownerId,
            })
        }

        return updatedMoment
    }

    // ===== MÉTODOS DE EXCLUSÃO =====

    /**
     * Exclui um momento (soft delete)
     */
    async deleteMoment(id: string, reason?: string): Promise<boolean> {
        const existingMoment = await this.repository.findById(id)
        if (!existingMoment) {
            throw new Error(`Moment with ID ${id} not found`)
        }

        // Atualizar status para deletado
        const updatedProps: any = {
            status: {
                ...existingMoment.status,
                current: MomentStatusEnum.DELETED,
                previous: existingMoment.status.current,
                reason: reason || "Deleted by user",
                changedBy: existingMoment.ownerId,
                changedAt: new Date(),
                updatedAt: new Date(),
            },
            deletedAt: new Date(),
            updatedAt: new Date(),
        }

        // Aplicar atualizações ao momento existente
        Object.assign(existingMoment, updatedProps)

        // Salvar exclusão (soft delete)
        const updatedMoment = await this.repository.update(existingMoment)
        return updatedMoment !== null
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
     * Obtém métricas agregadas de múltiplos momentos
     */
    async getAggregatedMetrics(momentIds: string[]) {
        if (!this.config.enableMetrics) {
            throw new Error("Metrics are not enabled")
        }

        return await this.metricsService.getAggregatedMetrics(momentIds)
    }

    /**
     * Obtém conteúdo em tendência
     */
    async getTrendingContent(limit: number = 10) {
        if (!this.config.enableMetrics) {
            throw new Error("Metrics are not enabled")
        }

        // Validar limite
        if (limit <= 0 || limit > 100) {
            throw new Error("Limit must be between 1 and 100")
        }

        // TODO: Implementar busca real de conteúdo em tendência no banco de dados
        // Por enquanto, retorna lista vazia como mock
        return []
    }

    /**
     * Obtém conteúdo viral
     */
    async getViralContent(limit: number = 10) {
        if (!this.config.enableMetrics) {
            throw new Error("Metrics are not enabled")
        }

        // Validar limite
        if (limit <= 0 || limit > 100) {
            throw new Error("Limit must be between 1 and 100")
        }

        // TODO: Implementar busca real de conteúdo viral no banco de dados
        // Por enquanto, retorna lista vazia como mock
        return []
    }

    // ===== MÉTODOS PARA AÇÕES DO USUÁRIO =====

    /**
     * Verifica se o usuário curtiu o momento
     */
    async hasUserLikedMoment(momentId: string, userId: string): Promise<boolean> {
        // Validar parâmetros
        if (!momentId || !userId) {
            return false
        }

        // Verificar se o momento existe
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return false
        }

        // Verificar se o usuário curtiu o momento
        return await this.repository.hasUserLikedMoment(momentId, userId)
    }

    /**
     * Curte um momento
     */
    async likeMoment(momentId: string, userId: string): Promise<Moment | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // Verificar se já curtiu
        const hasLiked = await this.hasUserLikedMoment(momentId, userId)
        if (hasLiked) {
            return moment
        }

        // Adicionar like no banco de dados
        await this.repository.addLike(momentId, userId)

        // Incrementar contador de likes
        const updatedMoment = await this.incrementMomentLikes(momentId, userId)

        return updatedMoment
    }

    /**
     * Remove like de um momento
     */
    async unlikeMoment(momentId: string, userId: string): Promise<Moment | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // Verificar se curtiu
        const hasLiked = await this.hasUserLikedMoment(momentId, userId)
        if (!hasLiked) {
            return moment
        }

        // Remover like do banco de dados
        await this.repository.removeLike(momentId, userId)

        // Decrementar contador de likes
        const updatedMoment = await this.decrementMomentLikes(momentId, userId)

        return updatedMoment
    }

    /**
     * Incrementa contador de likes
     */
    async incrementMomentLikes(momentId: string, userId: string): Promise<Moment | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // Incrementar contador de likes
        moment.incrementLikes()

        // Salvar no repositório
        const updatedMoment = await this.repository.update(moment)

        return updatedMoment
    }

    /**
     * Decrementa contador de likes
     */
    async decrementMomentLikes(momentId: string, userId: string): Promise<Moment | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // Decrementar contador de likes (método não existe na entidade, usar incrementLikes com valor negativo)
        // Como não existe decrementLikes, vamos decrementar manualmente
        if (moment.metrics.engagement.totalLikes > 0) {
            moment.metrics.engagement.totalLikes--
            moment.metrics.engagement.likeRate = moment.likeRate
            moment.metrics.lastMetricsUpdate = new Date()
        }

        // Salvar no repositório
        const updatedMoment = await this.repository.update(moment)

        return updatedMoment
    }

    /**
     * Verifica se o usuário denunciou o momento
     */
    async hasUserReportedMoment(momentId: string, userId: string): Promise<boolean> {
        if (!momentId || !userId) {
            return false
        }

        // TODO: Implementar verificação real de denúncia no banco de dados
        // Por enquanto, retorna false como mock
        return false
    }

    /**
     * Cria denúncia de momento
     */
    async createReport(data: { momentId: string; userId: string; reason: string }): Promise<any> {
        const moment = await this.repository.findById(data.momentId)
        if (!moment) {
            throw new Error(`Moment with ID ${data.momentId} not found`)
        }

        // Verificar se já denunciou
        const hasReported = await this.hasUserReportedMoment(data.momentId, data.userId)
        if (hasReported) {
            throw new Error("User has already reported this moment")
        }

        // Validar dados
        if (!data.reason || data.reason.trim().length === 0) {
            throw new Error("Report reason is required")
        }

        // Criar denúncia
        const report = {
            id: generateId(),
            momentId: data.momentId,
            userId: data.userId,
            reason: data.reason.trim(),
            status: "pending",
            createdAt: new Date(),
        }

        // TODO: Salvar denúncia no banco de dados
        return report
    }

    /**
     * Busca momentos curtidos pelo usuário
     */
    async getLikedMomentsByUser(
        userId: string,
        limit: number = 20,
        offset: number = 0,
    ): Promise<{ moments: Moment[]; total: number }> {
        if (!userId) {
            return { moments: [], total: 0 }
        }

        // TODO: Implementar busca real de momentos curtidos no banco de dados
        // Por enquanto, retorna lista vazia como mock
        return {
            moments: [],
            total: 0,
        }
    }

    /**
     * Busca momentos comentados pelo usuário
     */
    async getCommentedMomentsByUser(
        userId: string,
        limit: number = 20,
        offset: number = 0,
    ): Promise<{ moments: Moment[]; total: number }> {
        if (!userId) {
            return { moments: [], total: 0 }
        }

        // TODO: Implementar busca real de momentos comentados no banco de dados
        // Por enquanto, retorna lista vazia como mock
        return {
            moments: [],
            total: 0,
        }
    }

    /**
     * Busca momentos por proprietário com filtros
     */
    async findByOwnerId(
        ownerId: string,
        limit: number = 20,
        offset: number = 0,
        filters?: any,
    ): Promise<{ moments: Moment[]; total: number }> {
        const moments = await this.repository.findByOwnerId(ownerId, limit, offset)
        const total = await this.repository.countByOwnerId(ownerId)

        return {
            moments,
            total,
        }
    }

    /**
     * Obtém analytics de momentos
     */
    async getMomentsAnalytics(options: {
        userId?: string
        period?: string
        startDate?: Date
        endDate?: Date
        includeDeleted?: boolean
    }): Promise<any> {
        if (!this.config.enableMetrics) {
            throw new Error("Metrics are not enabled")
        }

        // TODO: Implementar analytics reais com dados do banco
        // Por enquanto, retorna estrutura mock
        return {
            overview: {
                totalMoments: 0,
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                totalShares: 0,
                averageEngagementRate: 0,
                averageWatchTime: 0,
                averageCompletionRate: 0,
            },
            trends: {
                momentsCreated: [],
                views: [],
                likes: [],
                comments: [],
            },
            topPerformers: {
                mostViewed: [],
                mostLiked: [],
                mostCommented: [],
            },
            demographics: {
                ageGroups: {},
                genders: {},
                locations: {},
            },
            contentAnalysis: {
                topHashtags: [],
                topMentions: [],
                contentTypes: {},
            },
            performance: {
                bestPerformingDay: "Monday",
                bestPerformingHour: 12,
                averagePostingFrequency: 0,
                peakEngagementTimes: [],
            },
        }
    }

    /**
     * Busca momentos reportados por um usuário
     */
    async getUserReportedMoments(
        userId: string,
        limit: number = 20,
        offset: number = 0,
        status?: string,
    ): Promise<{
        reportedMoments: Array<{
            momentId: string
            moment: {
                id: string
                description: string
                ownerId: string
                createdAt: Date
                status: { current: string }
            }
            report: {
                id: string
                reason: string
                description?: string
                status: string
                createdAt: Date
            }
        }>
        total: number
    }> {
        if (!userId) {
            return { reportedMoments: [], total: 0 }
        }

        // TODO: Implementar busca real de momentos reportados no banco de dados
        // Por enquanto, retorna lista vazia como mock
        return {
            reportedMoments: [],
            total: 0,
        }
    }

    /**
     * Busca reports dos momentos de um usuário
     */
    async getUserMomentReports(
        userId: string,
        limit: number = 20,
        offset: number = 0,
        status?: string,
        momentId?: string,
    ): Promise<{
        momentReports: Array<{
            momentId: string
            moment: {
                id: string
                description: string
                createdAt: Date
                status: { current: string }
            }
            reports: Array<{
                id: string
                reason: string
                description?: string
                status: string
                createdAt: Date
            }>
            totalReports: number
            pendingReports: number
            resolvedReports: number
        }>
        total: number
    }> {
        if (!userId) {
            return { momentReports: [], total: 0 }
        }

        // TODO: Implementar busca real de reports dos momentos no banco de dados
        // Por enquanto, retorna lista vazia como mock
        return {
            momentReports: [],
            total: 0,
        }
    }

    /**
     * Busca reports de um momento específico
     */
    async getMomentReports(
        momentId: string,
        limit: number = 20,
        offset: number = 0,
    ): Promise<{
        reports: Array<{
            id: string
            reason: string
            description?: string
            status: string
            userId: string
            createdAt: Date
        }>
        total: number
    }> {
        if (!momentId) {
            return { reports: [], total: 0 }
        }

        // Verificar se o momento existe
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            throw new Error(`Moment with ID ${momentId} not found`)
        }

        // TODO: Implementar busca real de reports do momento no banco de dados
        // Por enquanto, retorna lista vazia como mock
        return {
            reports: [],
            total: 0,
        }
    }

    /**
     * Obtém métricas de um momento com opções
     */
    async getMomentMetrics(
        momentId: string,
        options?: {
            period?: string
            startDate?: Date
            endDate?: Date
        },
    ): Promise<any> {
        if (!this.config.enableMetrics) {
            throw new Error("Metrics are not enabled")
        }

        // Verificar se o momento existe
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            throw new Error(`Moment with ID ${momentId} not found`)
        }

        // TODO: Implementar métricas reais com opções do banco de dados
        // Por enquanto, retorna estrutura mock
        return {
            momentId,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            engagementRate: 0,
            averageWatchTime: 0,
            completionRate: 0,
            demographics: {
                ageGroups: {},
                genders: {},
                locations: {},
            },
            timeline: [],
            topHashtags: [],
            topMentions: [],
        }
    }

    /**
     * Busca momentos com filtros avançados
     */
    async searchMoments(options: {
        filters?: any
        limit?: number
        offset?: number
        sortBy?: string
        sortOrder?: string
    }): Promise<{
        moments: Moment[]
        total: number
        page: number
        limit: number
        hasNext: boolean
        hasPrev: boolean
    }> {
        const {
            filters = {},
            limit = 20,
            offset = 0,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = options

        // Validar parâmetros
        if (limit <= 0 || limit > 100) {
            throw new Error("Limit must be between 1 and 100")
        }

        if (offset < 0) {
            throw new Error("Offset cannot be negative")
        }

        // TODO: Implementar busca com filtros reais no banco de dados
        // Por enquanto, usa busca paginada básica
        const result = await this.repository.findPaginated(Math.floor(offset / limit) + 1, limit)

        return {
            moments: result.moments,
            total: result.total,
            page: result.page,
            limit: result.limit,
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
        }
    }

    /**
     * Bloqueia um momento (admin use case)
     */
    async blockMoment(data: { momentId: string; adminId: string; reason: string }): Promise<{
        success: boolean
        moment?: {
            id: string
            status: string
            reason: string
            blockedBy: string
            blockedAt: Date
        }
        error?: string
    }> {
        try {
            const moment = await this.repository.findById(data.momentId)
            if (!moment) {
                return {
                    success: false,
                    error: "Moment not found",
                }
            }

            // Update moment status to blocked
            const updatedMoment = await this.updateMoment(data.momentId, {
                status: MomentStatusEnum.BLOCKED,
            })

            if (!updatedMoment) {
                return {
                    success: false,
                    error: "Failed to block moment",
                }
            }

            return {
                success: true,
                moment: {
                    id: updatedMoment.id,
                    status: updatedMoment.status.current as string,
                    reason: data.reason,
                    blockedBy: data.adminId,
                    blockedAt: new Date(),
                },
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to block moment: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            }
        }
    }

    /**
     * Desbloqueia um momento (admin use case)
     */
    async unblockMoment(data: { momentId: string; adminId: string; reason?: string }): Promise<{
        success: boolean
        moment?: {
            id: string
            status: string
            reason?: string
            unblockedBy: string
            unblockedAt: Date
        }
        error?: string
    }> {
        try {
            const moment = await this.repository.findById(data.momentId)
            if (!moment) {
                return {
                    success: false,
                    error: "Moment not found",
                }
            }

            // Update moment status to published
            const updatedMoment = await this.updateMoment(data.momentId, {
                status: MomentStatusEnum.PUBLISHED,
            })

            if (!updatedMoment) {
                return {
                    success: false,
                    error: "Failed to unblock moment",
                }
            }

            return {
                success: true,
                moment: {
                    id: updatedMoment.id,
                    status: updatedMoment.status.current as string,
                    reason: data.reason,
                    unblockedBy: data.adminId,
                    unblockedAt: new Date(),
                },
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to unblock moment: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            }
        }
    }

    /**
     * Altera status de um momento (admin use case)
     */
    async changeMomentStatus(data: {
        momentId: string
        adminId: string
        status: MomentStatusEnum
        reason?: string
    }): Promise<{
        success: boolean
        moment?: {
            id: string
            status: string
            reason?: string
            changedBy: string
            changedAt: Date
        }
        error?: string
    }> {
        try {
            const moment = await this.repository.findById(data.momentId)
            if (!moment) {
                return {
                    success: false,
                    error: "Moment not found",
                }
            }

            // Update moment status
            const updatedMoment = await this.updateMoment(data.momentId, {
                status: data.status,
            })

            if (!updatedMoment) {
                return {
                    success: false,
                    error: "Failed to change moment status",
                }
            }

            return {
                success: true,
                moment: {
                    id: updatedMoment.id,
                    status: updatedMoment.status.current as string,
                    reason: data.reason,
                    changedBy: data.adminId,
                    changedAt: new Date(),
                },
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to change moment status: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            }
        }
    }

    /**
     * Lista todos os momentos (admin use case)
     */
    async listAllMoments(options: {
        page: number
        limit: number
        status?: string
        sortBy?: string
        sortOrder?: "asc" | "desc"
        search?: string
        ownerId?: string
    }): Promise<{
        success: boolean
        moments?: Array<{
            id: string
            ownerId: string
            description: string
            hashtags: string[]
            mentions: string[]
            publishedAt?: Date
            archivedAt?: Date
            deletedAt?: Date
            createdAt: Date
            updatedAt: Date
            status: string
            metrics: {
                totalViews: number
                totalLikes: number
                totalComments: number
                totalReports: number
            }
        }>
        pagination?: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
        error?: string
    }> {
        try {
            const {
                page,
                limit,
                status,
                sortBy = "created_at",
                sortOrder = "desc",
                search,
                ownerId,
            } = options

            // Build filters
            const filters: any = {}
            if (status) filters.status = status
            if (ownerId) filters.ownerId = ownerId
            if (search) filters.search = search

            const result = await this.repository.findPaginated(page, limit, filters)

            // Transform moments to match the expected format
            const transformedMoments = result.moments.map((moment) => ({
                id: moment.id,
                ownerId: moment.ownerId,
                description: moment.description || "",
                hashtags: moment.hashtags || [],
                mentions: moment.mentions || [],
                publishedAt: moment.publishedAt || undefined,
                archivedAt: moment.archivedAt || undefined,
                deletedAt: moment.deletedAt || undefined,
                createdAt: moment.createdAt,
                updatedAt: moment.updatedAt,
                status: moment.status.current as string,
                metrics: {
                    totalViews: moment.metrics?.views?.totalViews || 0,
                    totalLikes: moment.metrics?.engagement?.totalLikes || 0,
                    totalComments: moment.metrics?.engagement?.totalComments || 0,
                    totalReports: moment.metrics?.engagement?.totalReports || 0,
                },
            }))

            return {
                success: true,
                moments: transformedMoments,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            }
        } catch (error) {
            return {
                success: false,
                error: `Error listing moments: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            }
        }
    }

    // ===== MÉTODOS PRIVADOS =====

    /**
     * Valida dados de criação
     */
    private async validateCreateData(data: CreateMomentData): Promise<void> {
        // Validações básicas
        if (!data.ownerId) {
            throw new Error("Owner ID is required")
        }

        // Validar videoData
        if (!data.videoData || data.videoData.length === 0) {
            throw new Error("Video data is required")
        }

        // Validar metadata do vídeo
        if (!data.videoMetadata) {
            throw new Error("Video metadata is required")
        }

        if (!data.videoMetadata.filename) {
            throw new Error("Filename is required")
        }

        if (!data.videoMetadata.mimeType) {
            throw new Error("MIME type is required")
        }

        if (!data.videoMetadata.mimeType.startsWith("video/")) {
            throw new Error("File must be a video")
        }

        // Validar que usuário não pode mencionar a si mesmo
        if (data.mentions && data.mentions.includes(data.ownerUsername)) {
            throw new Error("You cannot mention yourself")
        }

        // Validar menções duplicadas
        if (data.mentions && new Set(data.mentions).size !== data.mentions.length) {
            throw new Error("Cannot mention the same user more than once")
        }

        // Validar hashtags duplicadas
        if (data.hashtags && new Set(data.hashtags).size !== data.hashtags.length) {
            throw new Error("Cannot use the same hashtag more than once")
        }

        circleTextLibrary.validate.description(data.description || "")

        data.mentions?.forEach((mention) => {
            circleTextLibrary.validate.username(mention)
        })

        data.hashtags?.forEach((hashtag) => {
            circleTextLibrary.validate.hashtag(hashtag)
        })
    }

    /**
     * Valida dados de atualização
     */
    private async validateUpdateData(data: UpdateMomentData): Promise<void> {
        // Validações de texto se fornecido
        if (data.description !== undefined && data.description.length > 1000) {
            throw new Error("Description cannot be longer than 1000 characters")
        }

        if (data.hashtags !== undefined && data.hashtags.length > 30) {
            throw new Error("Maximum of 30 hashtags allowed")
        }

        if (data.mentions !== undefined && data.mentions.length > 50) {
            throw new Error("Maximum of 50 mentions allowed")
        }
    }
}
