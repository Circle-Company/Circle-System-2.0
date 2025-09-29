import { MomentEntity, MomentStatusEnum, MomentVisibilityEnum } from "@/domain/moment"

import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { generateId } from "@/shared"
import { MomentMetricsService } from "./moment.metrics.service"

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

        // Criar dados do momento
        const momentData = {
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
        // TODO: Criar entidade Moment corretamente
        const createdMoment = await this.repository.findById(generateId())

        // Inicializar métricas se habilitado
        if (this.config.enableMetrics && createdMoment) {
            await this.metricsService.recordView(createdMoment.id, {
                userId: data.ownerId,
                device: data.device?.type,
                location: data.location
                    ? `${data.location.latitude},${data.location.longitude}`
                    : undefined,
            })
        }

        return createdMoment || ({} as MomentEntity)
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
    ): Promise<MomentEntity[]> {
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
    ): Promise<MomentEntity[]> {
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
    ): Promise<MomentEntity[]> {
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
    ): Promise<MomentEntity[]> {
        return await this.repository.findByMention(mention, options?.limit, options?.offset)
    }

    /**
     * Busca momentos publicados
     */
    async getPublishedMoments(options?: {
        limit?: number
        offset?: number
    }): Promise<MomentEntity[]> {
        return await this.repository.findPublished(options?.limit, options?.offset)
    }

    /**
     * Busca momentos recentes
     */
    async getRecentMoments(options?: { limit?: number; offset?: number }): Promise<MomentEntity[]> {
        return await this.repository.findRecent(options?.limit, options?.offset)
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

        // Salvar atualizações
        // TODO: Implementar atualização correta
        const updatedMoment = await this.repository.findById(id)

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
        const updatedProps: any = {
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

        // TODO: Implementar exclusão correta
        const result = await this.repository.findById(id)
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

        // Validar limite
        if (limit <= 0 || limit > 100) {
            throw new Error("Limite deve estar entre 1 e 100")
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
            throw new Error("Métricas não estão habilitadas")
        }

        // Validar limite
        if (limit <= 0 || limit > 100) {
            throw new Error("Limite deve estar entre 1 e 100")
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
        // Implementar verificação de like do usuário
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return false
        }

        // TODO: Implementar verificação real no banco de dados
        // Por enquanto, retorna false como mock
        return false
    }

    /**
     * Curte um momento
     */
    async likeMoment(momentId: string, userId: string): Promise<MomentEntity | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // Verificar se já curtiu
        const hasLiked = await this.hasUserLikedMoment(momentId, userId)
        if (hasLiked) {
            return moment
        }

        // Incrementar contador de likes
        const updatedMoment = await this.incrementMomentLikes(momentId, userId)

        // TODO: Salvar like do usuário no banco de dados
        return updatedMoment
    }

    /**
     * Remove like de um momento
     */
    async unlikeMoment(momentId: string, userId: string): Promise<MomentEntity | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // Verificar se curtiu
        const hasLiked = await this.hasUserLikedMoment(momentId, userId)
        if (!hasLiked) {
            return moment
        }

        // Decrementar contador de likes
        const updatedMoment = await this.decrementMomentLikes(momentId, userId)

        // TODO: Remover like do usuário no banco de dados
        return updatedMoment
    }

    /**
     * Incrementa contador de likes
     */
    async incrementMomentLikes(momentId: string, userId: string): Promise<MomentEntity | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // TODO: Implementar incremento real do contador de likes
        const updatedMoment = await this.repository.findById(momentId)

        return updatedMoment
    }

    /**
     * Decrementa contador de likes
     */
    async decrementMomentLikes(momentId: string, userId: string): Promise<MomentEntity | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // TODO: Implementar decremento real do contador de likes
        const updatedMoment = await this.repository.findById(momentId)

        return updatedMoment
    }

    /**
     * Adiciona comentário ao momento
     */
    async addCommentToMoment(
        momentId: string,
        userId: string,
        commentText: string,
        parentCommentId?: string,
    ): Promise<any> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            throw new Error(`Momento com ID ${momentId} não encontrado`)
        }

        // Validar comentário
        if (!commentText || commentText.trim().length === 0) {
            throw new Error("Comentário não pode estar vazio")
        }

        if (commentText.length > 1000) {
            throw new Error("Comentário não pode ter mais de 1000 caracteres")
        }

        // Criar comentário
        const comment = {
            id: generateId(),
            momentId,
            userId,
            text: commentText.trim(),
            parentCommentId,
            createdAt: new Date(),
        }

        // TODO: Salvar comentário no banco de dados
        return comment
    }

    /**
     * Busca comentário por ID
     */
    async getCommentById(commentId: string): Promise<any | null> {
        if (!commentId) {
            return null
        }

        // TODO: Implementar busca real de comentário no banco de dados
        // Por enquanto, retorna null como mock
        return null
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
            throw new Error(`Momento com ID ${data.momentId} não encontrado`)
        }

        // Verificar se já denunciou
        const hasReported = await this.hasUserReportedMoment(data.momentId, data.userId)
        if (hasReported) {
            throw new Error("Usuário já denunciou este momento")
        }

        // Validar dados
        if (!data.reason || data.reason.trim().length === 0) {
            throw new Error("Motivo da denúncia é obrigatório")
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
    ): Promise<{ moments: MomentEntity[]; total: number }> {
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
    ): Promise<{ moments: MomentEntity[]; total: number }> {
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
    ): Promise<{ moments: MomentEntity[]; total: number }> {
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
            throw new Error("Métricas não estão habilitadas")
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
            throw new Error(`Momento com ID ${momentId} não encontrado`)
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
            throw new Error("Métricas não estão habilitadas")
        }

        // Verificar se o momento existe
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            throw new Error(`Momento com ID ${momentId} não encontrado`)
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
        moments: MomentEntity[]
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
            throw new Error("Limite deve estar entre 1 e 100")
        }

        if (offset < 0) {
            throw new Error("Offset não pode ser negativo")
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
     * Obtém comentários de um momento
     */
    async getMomentComments(data: {
        momentId: string
        page?: number
        limit?: number
        sortBy?: "created_at" | "likes" | "replies"
        sortOrder?: "asc" | "desc"
    }): Promise<{
        success: boolean
        comments?: Array<{
            id: string
            authorId: string
            content: string
            parentId?: string
            likes: number
            replies: number
            isEdited: boolean
            editedAt?: Date
            isDeleted: boolean
            deletedAt?: Date
            createdAt: Date
            updatedAt: Date
        }>
        pagination?: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
        error?: string
    }> {
        const { momentId, page = 1, limit = 20, sortBy = "created_at", sortOrder = "desc" } = data

        try {
            // Verificar se o momento existe
            const moment = await this.repository.findById(momentId)
            if (!moment) {
                return {
                    success: false,
                    error: `Momento com ID ${momentId} não encontrado`,
                }
            }

            // TODO: Implementar busca real de comentários no banco de dados
            // Por enquanto, retorna estrutura mock
            return {
                success: true,
                comments: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                },
            }
        } catch (error) {
            return {
                success: false,
                error: `Erro ao buscar comentários: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            }
        }
    }

    /**
     * Edita um comentário de um momento
     */
    async editMomentComment(data: {
        momentId: string
        commentId: string
        userId: string
        content: string
    }): Promise<{
        success: boolean
        comment?: {
            id: string
            authorId: string
            content: string
            parentId?: string
            likes: number
            replies: number
            isEdited: boolean
            editedAt: Date
            isDeleted: boolean
            deletedAt?: Date
            createdAt: Date
            updatedAt: Date
        }
        error?: string
    }> {
        const { momentId, commentId, userId, content } = data

        // Verificar se o momento existe
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return {
                success: false,
                error: "Moment not found",
            }
        }

        // Validar conteúdo
        if (!content || content.trim().length === 0) {
            return {
                success: false,
                error: "Comment content cannot be empty",
            }
        }

        if (content.length > 1000) {
            return {
                success: false,
                error: "Comment cannot be longer than 1000 characters",
            }
        }

        // TODO: Implementar edição real de comentário no banco de dados
        // Por enquanto, retorna estrutura mock
        return {
            success: true,
            comment: {
                id: commentId,
                authorId: userId,
                content: content.trim(),
                likes: 0,
                replies: 0,
                isEdited: true,
                editedAt: new Date(),
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        }
    }

    /**
     * Deleta um comentário de um momento
     */
    async deleteMomentComment(data: {
        momentId: string
        commentId: string
        userId: string
    }): Promise<{
        success: boolean
        error?: string
    }> {
        const { momentId, commentId, userId } = data

        // Verificar se o momento existe
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return {
                success: false,
                error: "Moment not found",
            }
        }

        // TODO: Implementar verificação de propriedade do comentário
        // TODO: Implementar exclusão real de comentário no banco de dados
        // Por enquanto, retorna sucesso mock
        return {
            success: true,
        }
    }

    /**
     * Cria um comentário em um momento
     */
    async createComment(data: {
        momentId: string
        userId: string
        content: string
        parentCommentId?: string
    }): Promise<{
        id: string
        momentId: string
        userId: string
        content: string
        parentCommentId?: string
        createdAt: Date
    }> {
        // Validar dados
        if (!data.momentId || !data.userId || !data.content) {
            throw new Error("momentId, userId e content são obrigatórios")
        }

        // Verificar se o momento existe
        const moment = await this.repository.findById(data.momentId)
        if (!moment) {
            throw new Error(`Momento com ID ${data.momentId} não encontrado`)
        }

        // Validar conteúdo
        if (data.content.trim().length === 0) {
            throw new Error("Conteúdo do comentário não pode estar vazio")
        }

        if (data.content.length > 1000) {
            throw new Error("Comentário não pode ter mais de 1000 caracteres")
        }

        // Criar comentário
        const comment = {
            id: generateId(),
            momentId: data.momentId,
            userId: data.userId,
            content: data.content.trim(),
            parentCommentId: data.parentCommentId,
            createdAt: new Date(),
        }

        // TODO: Salvar comentário real no banco de dados
        return comment
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
                error: `Erro ao listar momentos: ${
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
            throw new Error("ID do proprietário é obrigatório")
        }

        if (!data.content || data.content.duration <= 0) {
            throw new Error("Duração do conteúdo deve ser maior que zero")
        }

        if (!data.content.format) {
            throw new Error("Formato do conteúdo é obrigatório")
        }

        if (data.content.width <= 0 || data.content.height <= 0) {
            throw new Error("Dimensões do conteúdo devem ser maiores que zero")
        }

        // Validações de texto
        if (data.description && data.description.length > 1000) {
            throw new Error("Descrição não pode ter mais de 1000 caracteres")
        }

        if (data.hashtags && data.hashtags.length > 30) {
            throw new Error("Máximo de 30 hashtags permitidas")
        }

        if (data.mentions && data.mentions.length > 50) {
            throw new Error("Máximo de 50 menções permitidas")
        }
    }

    /**
     * Valida dados de atualização
     */
    private async validateUpdateData(data: UpdateMomentData): Promise<void> {
        // Validações de texto se fornecido
        if (data.description !== undefined && data.description.length > 1000) {
            throw new Error("Descrição não pode ter mais de 1000 caracteres")
        }

        if (data.hashtags !== undefined && data.hashtags.length > 30) {
            throw new Error("Máximo de 30 hashtags permitidas")
        }

        if (data.mentions !== undefined && data.mentions.length > 50) {
            throw new Error("Máximo de 50 menções permitidas")
        }
    }
}
