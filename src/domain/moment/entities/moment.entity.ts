import { IUserRepository, User } from "@/domain/user"
import {
    ViewRecord,
    ViewTrackingService,
} from "../../../application/moment/services/view.tracking.service"
import {
    MomentProcessingRulesFactory,
    MomentProcessingValidator,
} from "../rules/moment.processing.rules"
import {
    MomentContent,
    MomentContext,
    MomentEmbedding,
    MomentEntity,
    MomentLocation,
    MomentMedia,
    MomentProcessing,
    MomentProcessingStatusEnum,
    MomentProps,
    MomentStatus,
    MomentStatusEnum,
    MomentThumbnail,
    MomentVisibility,
    MomentVisibilityEnum,
    ViewabilityResult,
} from "../types"
import type {
    MomentMetrics as MomentMetricsDomain,
    MomentMetrics as MomentMetricsType,
} from "../types/moment.metrics.type"

import { generateId } from "@/shared/id"
import { MomentMetricsFactory } from "./moment.metrics.entity"

export class Moment {
    private readonly _id: string
    private readonly _ownerId: string
    private _content: MomentContent
    private _description: string
    private _hashtags: string[]
    private _mentions: string[]
    private _media: MomentMedia
    private _thumbnail: MomentThumbnail
    private _status: MomentStatus
    private _visibility: MomentVisibility
    private _metrics: MomentMetricsType
    private _location: MomentLocation | null
    private _context: MomentContext
    private _processing: MomentProcessing
    private _embedding: MomentEmbedding
    private readonly _createdAt: Date
    private _updatedAt: Date
    private _publishedAt: Date | null
    private _archivedAt: Date | null
    private _deletedAt: Date | null

    // Validador de regras de processamento
    private readonly validator: MomentProcessingValidator

    constructor(props: MomentProps) {
        this._id = props.id || generateId()
        this._ownerId = props.ownerId
        this._content = props.content
        this._description = props.description || ""
        this._hashtags = props.hashtags || []
        this._mentions = props.mentions || []
        this._media = props.media || this.createDefaultMedia()
        this._thumbnail = props.thumbnail || this.createDefaultThumbnail()
        this._status = props.status || this.createDefaultStatus()
        this._visibility = props.visibility || this.createDefaultVisibility()
        this._metrics = props.metrics
            ? this.convertMetricsFromEntity(props.metrics)
            : this.createDefaultMetrics()
        this._location = props.location || null
        this._context = props.context || this.createDefaultContext()
        this._processing = props.processing || this.createDefaultProcessing()
        this._embedding = props.embedding || this.createDefaultEmbedding()
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()
        this._publishedAt = props.publishedAt || null
        this._archivedAt = props.archivedAt || null
        this._deletedAt = props.deletedAt || null

        // Inicializar validador com regras padrão
        this.validator = new MomentProcessingValidator(MomentProcessingRulesFactory.createDefault())

        this.validate()
    }

    // ===== GETTERS =====
    get id(): string {
        return this._id
    }
    get ownerId(): string {
        return this._ownerId
    }
    get content(): MomentContent {
        return this._content
    }
    get description(): string {
        return this._description
    }
    get hashtags(): string[] {
        return [...this._hashtags]
    }
    get mentions(): string[] {
        return [...this._mentions]
    }
    get media(): MomentMedia {
        return this._media
    }
    get thumbnail(): MomentThumbnail {
        return this._thumbnail
    }
    get status(): MomentStatus {
        return this._status
    }
    get visibility(): MomentVisibility {
        return this._visibility
    }
    get metrics(): MomentMetricsType {
        return this._metrics
    }
    get location(): MomentLocation | null {
        return this._location
    }
    get context(): MomentContext {
        return this._context
    }
    get processing(): MomentProcessing {
        return this._processing
    }
    get embedding(): MomentEmbedding {
        return this._embedding
    }
    get createdAt(): Date {
        return this._createdAt
    }
    get updatedAt(): Date {
        return this._updatedAt
    }
    get publishedAt(): Date | null {
        return this._publishedAt
    }
    get archivedAt(): Date | null {
        return this._archivedAt
    }
    get deletedAt(): Date | null {
        return this._deletedAt
    }

    // ===== BUSINESS LOGIC =====

    /**
     * Publica o momento
     */
    publish(): void {
        if (!this.isValidContentFormat()) {
            throw new Error("Invalid content for publication")
        }

        if (this._processing.status !== MomentProcessingStatusEnum.EMBEDDINGS_PROCESSED) {
            throw new Error("Media processing not completed")
        }

        this.changeStatus(MomentStatusEnum.PUBLISHED, "Publicado pelo usuário")
        this._publishedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Arquivar o momento
     */
    archive(): void {
        if (this._status.current !== MomentStatusEnum.PUBLISHED) {
            throw new Error("Only published moments can be archived")
        }

        this.changeStatus(MomentStatusEnum.ARCHIVED, "Arquivado pelo usuário")
        this._archivedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Deletar o momento (soft delete)
     */
    delete(): void {
        if (this._status.current === MomentStatusEnum.DELETED) {
            throw new Error("Moment has already been deleted")
        }

        this.changeStatus(MomentStatusEnum.DELETED, "Deletado pelo usuário")
        this._deletedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Adicionar hashtags
     */
    addHashtags(hashtags: string[]): void {
        const newHashtags = [...this._hashtags, ...hashtags]

        const validation = this.validator.validateText({
            description: this._description,
            hashtags: newHashtags,
            mentions: this._mentions,
        })

        if (!validation.isValid) {
            throw new Error(validation.errors.join(", "))
        }

        this._hashtags = [...new Set(newHashtags)] // Remove duplicatas
        this._updatedAt = new Date()
    }

    /**
     * Adicionar menções
     */
    addMentions(mentions: string[]): void {
        const newMentions = [...this._mentions, ...mentions]

        const validation = this.validator.validateText({
            description: this._description,
            hashtags: this._hashtags,
            mentions: newMentions,
        })

        if (!validation.isValid) {
            throw new Error(validation.errors.join(", "))
        }

        this._mentions = [...new Set(newMentions)] // Remove duplicatas
        this._updatedAt = new Date()
    }

    /**
     * Atualizar visibilidade
     */
    updateVisibility(visibility: MomentVisibilityEnum, allowedUsers?: string[]): void {
        this._visibility.level = visibility
        this._visibility.allowedUsers = allowedUsers || []
        this._visibility.updatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Incrementar visualizações
     */
    incrementViews(region?: string, device?: string, country?: string, city?: string): void {
        this._metrics.views.totalViews++
        this._metrics.views.uniqueViews++ // Em produção, isso seria calculado de forma mais sofisticada

        if (region) {
            this._metrics.views.viewsByRegion[region] =
                (this._metrics.views.viewsByRegion[region] || 0) + 1
        }

        if (device) {
            this._metrics.views.viewsByDevice[device] =
                (this._metrics.views.viewsByDevice[device] || 0) + 1
        }

        if (country) {
            this._metrics.views.viewsByCountry[country] =
                (this._metrics.views.viewsByCountry[country] || 0) + 1
        }

        if (city) {
            this._metrics.views.viewsByCity[city] = (this._metrics.views.viewsByCity[city] || 0) + 1
        }

        this._metrics.lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Incrementar visualizações repetidas
     */
    incrementRepeatViews(): void {
        this._metrics.views.repeatViews++
        this._metrics.lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Incrementar cliques
     */
    incrementClicks(): void {
        this._metrics.views.totalClicks++
        this._metrics.engagement.clickRate = this.clickRate
        this._metrics.lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Incrementar likes
     */
    incrementLikes(): void {
        this._metrics.engagement.totalLikes++
        this.recalculateLikeRate()
    }

    decrementLikes(): void {
        this._metrics.engagement.totalLikes--
        this.recalculateLikeRate()
    }

    recalculateLikeRate(): void {
        this._metrics.engagement.likeRate =
            this._metrics.engagement.totalLikes /
            (this._metrics.views.totalViews > 0 ? this._metrics.views.totalViews : 1)
        this._metrics.lastMetricsUpdate = new Date()
    }

    /**
     * Incrementar reports
     */
    incrementReports(): void {
        this._metrics.engagement.totalReports++
        this._metrics.engagement.reportRate = this.reportRate
        this._metrics.lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Atualizar tempo médio de visualização
     */
    updateWatchTime(watchTime: number): void {
        if (watchTime > this._content.duration) {
            throw new Error("Watch time cannot be greater than video duration")
        }

        const totalWatchTime = this._metrics.views.averageWatchTime * this._metrics.views.totalViews
        this._metrics.views.averageWatchTime =
            (totalWatchTime + watchTime) / (this._metrics.views.totalViews + 1)
        this._metrics.views.averageCompletionRate =
            (this._metrics.views.averageWatchTime / this._content.duration) * 100

        // Incrementar visualizações que chegaram ao final se watchTime >= 90% da duração
        if (watchTime >= this._content.duration * 0.9) {
            this._metrics.views.completionViews++
        }

        this._metrics.lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Atualizar status de processamento (processado externamente)
     */
    updateProcessingStatus(
        status: MomentProcessingStatusEnum,
        progress?: number,
        error?: string,
    ): void {
        this._processing.status = status
        this._processing.progress = progress || this._processing.progress
        this._processing.error = error || null

        if (status === MomentProcessingStatusEnum.PROCESSING && !this._processing.startedAt) {
            this._processing.startedAt = new Date()
        }

        if (status === MomentProcessingStatusEnum.COMPLETED) {
            this._processing.completedAt = new Date()
        }

        this._updatedAt = new Date()
    }

    /**
     * Adicionar passo de processamento (processado externamente)
     */
    addProcessingStep(step: {
        name: string
        status: MomentProcessingStatusEnum
        progress?: number
        error?: string
    }): void {
        const processingStep = {
            name: step.name,
            status: step.status,
            progress: step.progress || 0,
            startedAt: step.status === MomentProcessingStatusEnum.PROCESSING ? new Date() : null,
            completedAt: step.status === MomentProcessingStatusEnum.COMPLETED ? new Date() : null,
            error: step.error || null,
        }

        this._processing.steps.push(processingStep)
        this._updatedAt = new Date()
    }

    /**
     * Atualizar embedding (processado externamente)
     */
    updateEmbedding(vector: string, dimension: number, metadata?: Record<string, any>): void {
        this._embedding.vector = vector
        this._embedding.dimension = dimension
        this._embedding.metadata = metadata || {}
        this._embedding.updatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Atualizar localização
     */
    updateLocation(location: MomentLocation): void {
        this._location = location
        this._updatedAt = new Date()
    }

    /**
     * Atualizar contexto
     */
    updateContext(context: MomentContext): void {
        this._context = context
        this._updatedAt = new Date()
    }

    // ===== VALIDATION METHODS =====

    /**
     * Valida o momento
     */
    private validate(): void {
        if (!this._ownerId) {
            throw new Error("Owner ID is required")
        }

        if (!this._content) {
            throw new Error("Content is required")
        }

        // Validar conteúdo
        const contentValidation = this.validator.validateContent({
            duration: this._content.duration,
            size: this._content.size,
            format: this._content.format,
            width: this._content.resolution.width,
            height: this._content.resolution.height,
        })

        if (!contentValidation.isValid) {
            throw new Error(contentValidation.errors.join(", "))
        }

        // Validar texto
        const textValidation = this.validator.validateText({
            description: this._description,
            hashtags: this._hashtags,
            mentions: this._mentions,
        })

        if (!textValidation.isValid) {
            throw new Error(textValidation.errors.join(", "))
        }
    }

    /**
     * Verifica se o moment é interagível por um usuário específico
     * Inclui validação completa de status dos usuários, relacionamentos e permissões
     *
     * @param userRepository - Repositório de usuários para validações
     * @param interactingUser - Entidade do usuário que quer interagir
     * @returns Promise<boolean> - true se o moment é interagível
     */
    async isInteractable(userRepository: IUserRepository, interactingUser: User): Promise<boolean> {
        try {
            // 1. Verificar se o moment está publicado
            if (this._status.current !== MomentStatusEnum.PUBLISHED) {
                return false
            }

            // 2. Buscar informações do owner do moment
            const ownerUser = await userRepository.findById(this._ownerId)
            if (!ownerUser) {
                console.error(`Moment owner not found: ${this._ownerId}`)
                return false
            }

            // 3. Verificar se o owner está ativo e pode interagir
            if (!ownerUser.isActive() || !ownerUser.canInteractWithMoments()) {
                return false
            }

            // 4. Verificar se o usuário que quer interagir está ativo e pode interagir
            if (!interactingUser.isActive() || !interactingUser.canInteractWithMoments()) {
                return false
            }

            // 5. Verificar se não há bloqueio mútuo entre os usuários
            const isOwnerBlockedByUser = await userRepository.isBlocked(
                this._ownerId,
                interactingUser.id,
            )
            const isUserBlockedByOwner = await userRepository.isBlocked(
                interactingUser.id,
                this._ownerId,
            )

            if (isOwnerBlockedByUser || isUserBlockedByOwner) {
                return false
            }

            // 6. Verificar visibilidade do moment
            switch (this._visibility.level) {
                case MomentVisibilityEnum.PUBLIC:
                case MomentVisibilityEnum.UNLISTED:
                    return true

                case MomentVisibilityEnum.PRIVATE:
                    return this._visibility.allowedUsers.includes(interactingUser.id)

                case MomentVisibilityEnum.FOLLOWERS_ONLY:
                    // Verificar se o usuário que quer interagir segue o owner
                    const isFollowing = await userRepository.isFollowing(
                        interactingUser.id,
                        this._ownerId,
                    )
                    return isFollowing || this._visibility.allowedUsers.includes(interactingUser.id)

                default:
                    return false
            }
        } catch (error) {
            // Log do erro para debug (em produção, usar logger apropriado)
            console.error(`Erro ao verificar interatividade do moment ${this._id}:`, error)

            // Em caso de erro, retornar false por segurança
            return false
        }
    }

    /**
     * Verifica se um momento pode ser visualizado por um usuário específico
     * Esta função implementa uma lógica robusta de visualização com múltiplas camadas de validação
     */
    async isViewable(
        interactingUser: User,
        userRepository?: IUserRepository,
    ): Promise<ViewabilityResult> {
        try {
            // 1. Verificar se o momento está ativo e não deletado
            if (!this._isActive() || this._status.current === MomentStatusEnum.DELETED) {
                return this._createViewabilityResult(
                    false,
                    "MOMENT_NOT_ACTIVE",
                    "Momento não está ativo ou foi deletado",
                )
            }

            // 2. Verificar se o momento não está bloqueado
            if (this._status.current === MomentStatusEnum.BLOCKED) {
                return this._createViewabilityResult(
                    false,
                    "MOMENT_BLOCKED",
                    "Momento foi bloqueado",
                )
            }

            // 3. Verificar se o momento está publicado ou em revisão (para o próprio autor)
            if (this._status.current === MomentStatusEnum.UNDER_REVIEW) {
                if (interactingUser.id !== this._ownerId) {
                    return this._createViewabilityResult(
                        false,
                        "MOMENT_UNDER_REVIEW",
                        "Momento está em revisão",
                    )
                }
            }

            const isFollowing =
                (await userRepository?.isFollowing(interactingUser.id, this._ownerId)) ?? false
            const isBlocked =
                (await userRepository?.isBlocked(interactingUser.id, this._ownerId)) ?? false

            // 4. Verificação de visibilidade baseada no nível
            const visibilityCheck = await this._checkVisibilityLevel(interactingUser, isFollowing)
            if (!visibilityCheck.allowed) {
                return visibilityCheck
            }

            // 5. Verificação de restrições de conteúdo
            const contentRestrictionCheck = this._checkContentRestrictions(interactingUser)
            if (!contentRestrictionCheck.allowed) {
                return contentRestrictionCheck
            }

            // 6. Verificação de bloqueios entre usuários
            if (isBlocked) {
                return this._createViewabilityResult(
                    false,
                    "USER_BLOCKED",
                    "Usuário está bloqueado pelo autor",
                )
            }

            // 7. Verificação final de permissões
            const finalPermissionCheck = await this._checkFinalPermissions(interactingUser)
            if (!finalPermissionCheck.allowed) {
                return finalPermissionCheck
            }

            // 8. Se chegou até aqui, pode visualizar
            return this._createViewabilityResult(true, "VIEWABLE", "Momento pode ser visualizado", {
                requiresAgeVerification: this._visibility.ageRestriction,
                hasContentWarning: this._visibility.contentWarning,
                visibilityLevel: this._visibility.level,
            })
        } catch (error) {
            console.error(`Erro ao verificar visualização do moment ${this._id}:`, error)
            return this._createViewabilityResult(false, "SYSTEM_ERROR", "Erro interno do sistema")
        }
    }

    /**
     * Verifica o nível de visibilidade do momento
     */
    private async _checkVisibilityLevel(
        interactingUser: User,
        isFollowing: boolean,
    ): Promise<ViewabilityResult> {
        switch (this._visibility.level) {
            case MomentVisibilityEnum.PUBLIC:
                // Público: qualquer um pode ver
                return this._createViewabilityResult(true, "PUBLIC_VISIBLE", "Momento público")

            case MomentVisibilityEnum.UNLISTED:
                // Unlisted: pode ser visto por quem tem o link (qualquer usuário logado)
                return this._createViewabilityResult(true, "UNLISTED_VISIBLE", "Momento unlisted")

            case MomentVisibilityEnum.FOLLOWERS_ONLY:
                // Apenas seguidores
                if (interactingUser.id === this._ownerId) {
                    return this._createViewabilityResult(true, "OWNER_VISIBLE", "Autor do momento")
                }

                if (isFollowing === true) {
                    return this._createViewabilityResult(
                        true,
                        "FOLLOWER_VISIBLE",
                        "Usuário é seguidor",
                    )
                }

                // Verificar se está na lista de usuários permitidos
                if (this._visibility.allowedUsers.includes(interactingUser.id)) {
                    return this._createViewabilityResult(
                        true,
                        "ALLOWED_USER_VISIBLE",
                        "Usuário na lista de permitidos",
                    )
                }

                return this._createViewabilityResult(
                    false,
                    "FOLLOWERS_ONLY_RESTRICTED",
                    "Apenas seguidores podem visualizar",
                )

            case MomentVisibilityEnum.PRIVATE:
                // Privado: apenas usuários específicos
                if (interactingUser.id === this._ownerId) {
                    return this._createViewabilityResult(true, "OWNER_VISIBLE", "Autor do momento")
                }

                if (this._visibility.allowedUsers.includes(interactingUser.id)) {
                    return this._createViewabilityResult(
                        true,
                        "ALLOWED_USER_VISIBLE",
                        "Usuário autorizado",
                    )
                }

                return this._createViewabilityResult(
                    false,
                    "PRIVATE_RESTRICTED",
                    "Momento privado - usuário não autorizado",
                )

            default:
                return this._createViewabilityResult(
                    false,
                    "UNKNOWN_VISIBILITY",
                    "Nível de visibilidade desconhecido",
                )
        }
    }

    /**
     * Verifica restrições de conteúdo (idade, warnings, etc.)
     */
    private _checkContentRestrictions(interactingUser: User): ViewabilityResult {
        // Verificar se há restrição de idade
        if (this._visibility.ageRestriction) {
            if (!interactingUser.hasViewingRestrictions()) {
                return this._createViewabilityResult(
                    false,
                    "AGE_RESTRICTED",
                    "Conteúdo restrito por idade",
                )
            }
        }

        // Verificar se há warning de conteúdo
        if (this._visibility.contentWarning) {
            // Em uma implementação real, você pode querer verificar preferências do usuário
            // Por agora, apenas informamos que há warning
            return this._createViewabilityResult(true, "CONTENT_WARNING", "Conteúdo com aviso", {
                hasContentWarning: true,
            })
        }

        return this._createViewabilityResult(true, "NO_RESTRICTIONS", "Sem restrições de conteúdo")
    }

    /**
     * Verificação final de permissões
     */
    private async _checkFinalPermissions(interactingUser: User): Promise<ViewabilityResult> {
        // Verificar se o usuário que quer visualizar está ativo
        if (interactingUser && (!interactingUser.isActive() || !interactingUser.canViewMoments())) {
            return this._createViewabilityResult(
                false,
                "USER_INACTIVE",
                "Usuário não pode visualizar momentos",
            )
        }

        // Verificar se o usuário não está na lista de bloqueados
        if (this._visibility.blockedUsers.includes(interactingUser.id)) {
            return this._createViewabilityResult(
                false,
                "USER_BLOCKED_FROM_MOMENT",
                "Usuário bloqueado deste momento",
            )
        }

        return this._createViewabilityResult(true, "PERMISSIONS_OK", "Permissões verificadas")
    }

    /**
     * Cria um resultado de visualização padronizado
     */
    private _createViewabilityResult(
        allowed: boolean,
        reason: string,
        message: string,
        metadata?: any,
    ): ViewabilityResult {
        return {
            allowed,
            reason,
            message,
            metadata: metadata || {},
            timestamp: new Date(),
            momentId: this._id,
        }
    }

    /**
     * Verifica se o momento está ativo (não deletado, não bloqueado, etc.)
     */
    private _isActive(): boolean {
        return (
            this._status.current !== MomentStatusEnum.DELETED &&
            this._status.current !== MomentStatusEnum.BLOCKED
        )
    }

    /**
     * Registra uma visualização do momento (para métricas)
     */
    async recordView(viewerId: string, viewDuration?: number, viewSource?: string): Promise<void> {
        try {
            // Calcular se é visualização completa
            const videoDuration = this._content.duration || 0
            const isComplete =
                videoDuration > 0 && viewDuration && viewDuration >= videoDuration * 0.8

            // Registrar no sistema de tracking
            const viewTrackingService = ViewTrackingService.getInstance()
            await viewTrackingService.recordView({
                viewerId,
                momentId: this._id,
                viewDuration,
                viewSource,
                isComplete: isComplete || false,
            })

            // Atualizar métricas do momento (se existirem métodos apropriados)
            if (this._metrics) {
                // Incrementar contador de visualizações
                this._metrics.views.totalViews++

                // Se é visualização única (não é repeat view)
                const hasRecent = await this.hasRecentView(viewerId, 5)
                if (!hasRecent) {
                    this._metrics.views.uniqueViews++
                }

                // Se há duração, calcular métricas adicionais
                if (viewDuration && viewDuration > 0) {
                    // Atualizar tempo médio de visualização
                    const currentAvg = this._metrics.views.averageWatchTime
                    const totalViews = this._metrics.views.totalViews
                    this._metrics.views.averageWatchTime =
                        (currentAvg * (totalViews - 1) + viewDuration) / totalViews

                    // Se é visualização completa
                    if (isComplete) {
                        this._metrics.views.completionViews++
                    }

                    // Atualizar taxa de conclusão
                    this._metrics.views.averageCompletionRate =
                        (this._metrics.views.completionViews / this._metrics.views.totalViews) * 100
                }

                // Atualizar timestamp da última atualização
                this._metrics.lastMetricsUpdate = new Date()
            }
        } catch (error) {
            console.error(`Erro ao registrar visualização do moment ${this._id}:`, error)
            // Não falhar a visualização por causa de erro nas métricas
        }
    }

    /**
     * Verifica se um usuário já visualizou este momento recentemente
     */
    async hasRecentView(viewerId: string, maxAgeInMinutes: number = 5): Promise<boolean> {
        try {
            const viewTrackingService = ViewTrackingService.getInstance()
            return await viewTrackingService.hasRecentView(this._id, viewerId, maxAgeInMinutes)
        } catch (error) {
            console.error(`Erro ao verificar visualização recente do moment ${this._id}:`, error)
            return false
        }
    }

    /**
     * Obtém estatísticas de visualização do momento
     */
    async getViewStatistics(): Promise<{
        totalViews: number
        uniqueViews: number
        averageViewDuration: number
        completeViewRate: number
        lastViewedAt: Date | null
    }> {
        try {
            const viewTrackingService = ViewTrackingService.getInstance()
            const recentStats = await viewTrackingService.getRecentViewStats(this._id, 60) // Última hora

            if (!this._metrics) {
                return {
                    totalViews: recentStats.totalViews,
                    uniqueViews: recentStats.uniqueViews,
                    averageViewDuration: recentStats.averageDuration,
                    completeViewRate:
                        recentStats.totalViews > 0
                            ? (recentStats.completeViews / recentStats.totalViews) * 100
                            : 0,
                    lastViewedAt: null,
                }
            }

            return {
                totalViews: this._metrics.views.totalViews,
                uniqueViews: this._metrics.views.uniqueViews,
                averageViewDuration: this._metrics.views.averageWatchTime,
                completeViewRate: this._metrics.views.averageCompletionRate,
                lastViewedAt: this._metrics.lastMetricsUpdate,
            }
        } catch (error) {
            console.error(`Erro ao obter estatísticas do moment ${this._id}:`, error)
            return {
                totalViews: 0,
                uniqueViews: 0,
                averageViewDuration: 0,
                completeViewRate: 0,
                lastViewedAt: null,
            }
        }
    }

    /**
     * Sistema de pontuação sofisticado com visualizações, engajamento e decaimento exponencial
     */

    /**
     * Configurações do algoritmo de pontuação
     */
    private static readonly SCORING_CONFIG = {
        // Pesos para diferentes métricas
        weights: {
            views: 1.0, // Visualizações base
            completeViews: 2.5, // Visualizações completas (mais valiosas)
            likes: 3.0, // Likes
            comments: 4.0, // Comentários (mais engajamento)
            shares: 5.0, // Shares (máximo engajamento)
            reports: -2.0, // Reports (penalização)
        },
        // Decaimento exponencial por tempo
        timeDecay: {
            halfLifeHours: 24, // Meia-vida de 24 horas
            maxAgeHours: 168, // 7 dias máximo
        },
        // Limites para normalização
        limits: {
            maxViews: 100000,
            maxLikes: 10000,
            maxComments: 1000,
            maxShares: 500,
        },
    }

    /**
     * Calcula a pontuação sofisticada do momento
     */
    async calculateSophisticatedScore(): Promise<number> {
        const stats = await this.getViewStatistics()
        const engagement = this.getMockEngagementMetrics() // Usar dados mockados temporariamente

        // 1. Calcular pontuação base por engajamento
        const engagementScore = this.calculateEngagementScore(stats, engagement)

        // 2. Aplicar decaimento exponencial por tempo
        const timeDecayFactor = this.calculateTimeDecay()

        // 3. Calcular pontuação final
        const finalScore = engagementScore * timeDecayFactor

        return Math.max(0, finalScore) // Garantir que não seja negativo
    }

    /**
     * Método temporário para obter métricas de engajamento (mock)
     */
    private getMockEngagementMetrics(): any {
        // Dados mockados temporariamente - implementar métricas reais depois
        return {
            totalLikes: Math.floor(Math.random() * 1000),
            totalComments: Math.floor(Math.random() * 100),
            totalShares: Math.floor(Math.random() * 50),
            totalReports: Math.floor(Math.random() * 10),
        }
    }

    /**
     * Calcula a pontuação de engajamento
     */
    private calculateEngagementScore(viewStats: any, engagement: any): number {
        // Configuração inline para evitar problemas de referência estática
        const config = {
            weights: {
                views: 1.0,
                completeViews: 2.5,
                likes: 3.0,
                comments: 4.0,
                shares: 5.0,
                reports: -2.0,
            },
            limits: {
                maxViews: 100000,
                maxLikes: 10000,
                maxComments: 1000,
                maxShares: 500,
                maxReports: 100,
            },
        }

        // Normalizar métricas de visualização
        const normalizedViews =
            Math.min(viewStats.totalViews, config.limits.maxViews) / config.limits.maxViews
        const normalizedCompleteViews =
            Math.min(viewStats.completeViewRate, config.limits.maxViews) / config.limits.maxViews

        // Normalizar métricas de engajamento
        const normalizedLikes =
            Math.min(engagement.totalLikes, config.limits.maxLikes) / config.limits.maxLikes
        const normalizedComments =
            Math.min(engagement.totalComments, config.limits.maxComments) /
            config.limits.maxComments
        const normalizedShares =
            Math.min(engagement.totalShares || 0, config.limits.maxShares) / config.limits.maxShares
        const normalizedReports =
            Math.min(engagement.totalReports || 0, config.limits.maxReports || 100) /
            (config.limits.maxReports || 100)

        // Calcular pontuação ponderada
        const engagementScore =
            normalizedViews * config.weights.views +
            normalizedCompleteViews * config.weights.completeViews +
            normalizedLikes * config.weights.likes +
            normalizedComments * config.weights.comments +
            normalizedShares * config.weights.shares +
            normalizedReports * config.weights.reports

        return engagementScore
    }

    /**
     * Calcula o fator de decaimento exponencial baseado no tempo
     */
    private calculateTimeDecay(): number {
        // Configuração inline para evitar problemas de referência estática
        const config = {
            timeDecay: {
                halfLifeHours: 24,
                maxAgeHours: 168,
            },
        }
        const now = new Date()
        const publishedAt = this.publishedAt || this.createdAt

        // Calcular horas desde a publicação
        const hoursSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60)

        // Se muito antigo, pontuação mínima
        if (hoursSincePublished > config.timeDecay.maxAgeHours) {
            return 0.1
        }

        // Decaimento exponencial: score = 2^(-t/halfLife)
        const decayFactor = Math.pow(2, -hoursSincePublished / config.timeDecay.halfLifeHours)

        // Garantir pontuação mínima de 10%
        return Math.max(0.1, decayFactor)
    }

    /**
     * Verifica se o momento é popular usando pontuação sofisticada
     */
    async isPopular(minScore: number = 50.0): Promise<boolean> {
        const score = await this.calculateSophisticatedScore()
        return score >= minScore
    }

    /**
     * Retorna a pontuação e detalhes do cálculo
     */
    async getPopularityDetails(): Promise<{
        score: number
        engagementScore: number
        timeDecayFactor: number
        isPopular: boolean
        metrics: {
            views: number
            completeViews: number
            likes: number
            comments: number
            shares: number
            reports: number
        }
        timeInfo: {
            hoursSincePublished: number
            publishedAt: Date
        }
    }> {
        const stats = await this.getViewStatistics()
        const engagement = this.getMockEngagementMetrics()
        const publishedAt = this.publishedAt || this.createdAt
        const now = new Date()
        const hoursSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60)

        const engagementScore = this.calculateEngagementScore(stats, engagement)
        const timeDecayFactor = this.calculateTimeDecay()
        const finalScore = engagementScore * timeDecayFactor

        return {
            score: Math.max(0, finalScore),
            engagementScore,
            timeDecayFactor,
            isPopular: finalScore >= 50.0,
            metrics: {
                views: stats.totalViews,
                completeViews: stats.completeViewRate, // Usar completeViewRate em vez de completeViews
                likes: engagement.totalLikes,
                comments: engagement.totalComments,
                shares: engagement.totalShares || 0,
                reports: engagement.totalReports || 0,
            },
            timeInfo: {
                hoursSincePublished,
                publishedAt,
            },
        }
    }

    /**
     * Obtém informações detalhadas sobre visualizações recentes
     */
    async getRecentViewDetails(maxAgeInMinutes: number = 60): Promise<{
        totalViews: number
        uniqueViews: number
        completeViews: number
        averageDuration: number
        viewsBySource: Record<string, number>
        recentViews: ViewRecord[]
    }> {
        try {
            const viewTrackingService = ViewTrackingService.getInstance()
            const stats = await viewTrackingService.getRecentViewStats(this._id, maxAgeInMinutes)
            const recentViews = viewTrackingService.getRecentViewsForMoment(
                this._id,
                maxAgeInMinutes,
            )

            return {
                ...stats,
                recentViews,
            }
        } catch (error) {
            console.error(
                `Erro ao obter detalhes de visualizações recentes do moment ${this._id}:`,
                error,
            )
            return {
                totalViews: 0,
                uniqueViews: 0,
                completeViews: 0,
                averageDuration: 0,
                viewsBySource: {},
                recentViews: [],
            }
        }
    }

    /**
     * Obtém informações sobre uma visualização específica de um usuário
     */
    getUserViewDetails(viewerId: string): ViewRecord | null {
        try {
            const viewTrackingService = ViewTrackingService.getInstance()
            return viewTrackingService.getRecentView(this._id, viewerId)
        } catch (error) {
            console.error(
                `Erro ao obter detalhes de visualização do usuário ${viewerId} para moment ${this._id}:`,
                error,
            )
            return null
        }
    }

    /**
     * Verifica se o usuário é o owner do moment
     */
    isOwner(userId: string): boolean {
        return this._ownerId === userId
    }

    /**
     * Verifica se o conteúdo é válido para publicação
     */
    private isValidContentFormat(): boolean {
        const contentValidation = this.validator.validateContent({
            duration: this._content.duration,
            size: this._content.size,
            format: this._content.format,
            width: this._content.resolution.width,
            height: this._content.resolution.height,
        })

        return (
            contentValidation.isValid &&
            this._processing.status === MomentProcessingStatusEnum.COMPLETED
        )
    }

    /**
     * Calcula taxa de engajamento total (likes + reports)
     * Nota: Comentários agora são gerenciados pela entidade Comment separada
     */
    private calculateEngagementRate(): number {
        if (this._metrics.views.totalViews === 0) return 0
        return (
            ((this._metrics.engagement.totalLikes + this._metrics.engagement.totalReports) /
                this._metrics.views.totalViews) *
            100
        )
    }

    /**
     * Getter para taxa de engajamento
     */
    get engagementRate(): number {
        return this.calculateEngagementRate()
    }

    /**
     * Getter para taxa de likes
     */
    get likeRate(): number {
        if (this._metrics.views.totalViews === 0) return 0
        return (this._metrics.engagement.totalLikes / this._metrics.views.totalViews) * 100
    }

    /**
     * Getter para taxa de reports
     */
    get reportRate(): number {
        if (this._metrics.views.totalViews === 0) return 0
        return (this._metrics.engagement.totalReports / this._metrics.views.totalViews) * 100
    }

    /**
     * Getter para taxa de cliques
     */
    get clickRate(): number {
        if (this._metrics.views.totalViews === 0) return 0
        return (this._metrics.views.totalClicks / this._metrics.views.totalViews) * 100
    }

    /**
     * Recalcula todas as taxas de engajamento
     */
    recalculateEngagementRates(): void {
        if (this._metrics.views.totalViews > 0) {
            this._metrics.engagement.likeRate = this.likeRate
            this._metrics.engagement.reportRate = this.reportRate
            this._metrics.engagement.clickRate = this.clickRate
            this._metrics.lastMetricsUpdate = new Date()
            this._updatedAt = new Date()
        }
    }

    // ===== HELPER METHODS =====

    /**
     * Muda o status do momento
     */
    private changeStatus(newStatus: MomentStatusEnum, reason: string, changedBy?: string): void {
        this._status.previous = this._status.current
        this._status.current = newStatus
        this._status.reason = reason
        this._status.changedBy = changedBy || this._ownerId
        this._status.changedAt = new Date()
        this._status.updatedAt = new Date()
    }

    // ===== FACTORY METHODS =====

    private createDefaultMedia(): MomentMedia {
        return {
            url: "",
            storage: {
                provider: "aws" as any,
                bucket: "",
                key: "",
                region: "",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    }

    private createDefaultThumbnail(): MomentThumbnail {
        return {
            url: "",
            width: 0,
            height: 0,
            storage: {
                provider: "aws" as any,
                bucket: "",
                key: "",
                region: "",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    }

    private createDefaultStatus(): MomentStatus {
        return {
            current: MomentStatusEnum.UNDER_REVIEW,
            previous: null,
            reason: null,
            changedBy: null,
            changedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    }

    private createDefaultVisibility(): MomentVisibility {
        return {
            level: MomentVisibilityEnum.PUBLIC,
            allowedUsers: [],
            blockedUsers: [],
            ageRestriction: false,
            contentWarning: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    }

    private createDefaultMetrics(): MomentMetricsType {
        const defaultMetrics = MomentMetricsFactory.createDefault()
        return {
            views: {
                totalViews: defaultMetrics.views.totalViews,
                totalClicks: defaultMetrics.views.totalClicks || 0,
                uniqueViews: defaultMetrics.views.uniqueViews,
                repeatViews: defaultMetrics.views.repeatViews || 0,
                viewsByRegion: defaultMetrics.views.viewsByRegion,
                viewsByDevice: defaultMetrics.views.viewsByDevice,
                viewsByCountry: defaultMetrics.views.viewsByCountry,
                viewsByCity: defaultMetrics.views.viewsByCity,
                averageWatchTime: defaultMetrics.views.averageWatchTime,
                completionViews: defaultMetrics.views.completionViews,
                averageCompletionRate: defaultMetrics.views.averageCompletionRate,
                peakViewTime: null,
                lastViewTime: null,
            },
            engagement: {
                totalLikes: defaultMetrics.engagement.totalLikes,
                totalComments: defaultMetrics.engagement.totalComments,
                totalReports: defaultMetrics.engagement.totalReports,
                totalClicks: defaultMetrics.engagement.totalClicks,
                likeRate: defaultMetrics.engagement.likeRate,
                commentRate: defaultMetrics.engagement.commentRate,
                clickRate: defaultMetrics.engagement.clickRate,
                reportRate: defaultMetrics.engagement.reportRate,
                averageCommentLength: defaultMetrics.engagement.averageCommentLength,
                topCommenters: defaultMetrics.engagement.topCommenters,
                engagementScore: 0,
                lastEngagementTime: null,
            },
            performance: {
                loadTime: defaultMetrics.performance.loadTime,
                bufferTime: defaultMetrics.performance.bufferTime,
                errorRate: defaultMetrics.performance.errorRate,
                successRate: 100,
                averageQuality: 0,
                qualityDistribution: {},
                bandwidthUsage: 0,
                serverResponseTime: 0,
                cdnHitRate: 0,
                lastPerformanceUpdate: null,
            },
            viral: {
                viralScore: defaultMetrics.viral.viralScore,
                viralReach: defaultMetrics.viral.totalReach,
                reachByPlatform: {},
                reachByUserType: {},
                viralCoefficient: 0,
                viralVelocity: 0,
                peakViralTime: null,
                viralDecayRate: 0,
                lastViralUpdate: null,
            },
            audience: {
                demographics: {
                    ageGroups: {},
                    genders: {},
                    locations: {},
                    interests: {},
                },
                behavior: {
                    averageSessionTime: 0,
                    bounceRate: 0,
                    returnRate: 0,
                    engagementDepth: 0,
                    contentPreference: {},
                },
                growth: {
                    followerGrowth: 0,
                    subscriberGrowth: 0,
                    engagementGrowth: 0,
                    reachGrowth: 0,
                },
                lastAudienceUpdate: null,
            },
            content: {
                qualityScore: defaultMetrics.content.contentQualityScore,
                contentRating: 0,
                moderationScore: 0,
                accessibilityScore: 0,
                seoScore: 0,
                contentTags: [],
                contentCategories: [],
                contentSentiment: 0,
                contentComplexity: 0,
                lastContentUpdate: null,
            },
            lastMetricsUpdate: defaultMetrics.lastMetricsUpdate,
            metricsVersion: defaultMetrics.metricsVersion,
            dataQuality: defaultMetrics.dataQuality,
            confidenceLevel: defaultMetrics.confidenceLevel,
        }
    }

    private convertMetricsFromEntity(entityMetrics: any): MomentMetricsType {
        return {
            views: {
                totalViews: entityMetrics.views.totalViews,
                totalClicks: entityMetrics.views.totalClicks || 0,
                uniqueViews: entityMetrics.views.uniqueViews,
                repeatViews: entityMetrics.views.repeatViews || 0,
                viewsByRegion: entityMetrics.views.viewsByRegion,
                viewsByDevice: entityMetrics.views.viewsByDevice,
                viewsByCountry: entityMetrics.views.viewsByCountry,
                viewsByCity: entityMetrics.views.viewsByCity,
                averageWatchTime: entityMetrics.views.averageWatchTime,
                completionViews: entityMetrics.views.completionViews,
                averageCompletionRate: entityMetrics.views.averageCompletionRate,
                peakViewTime: entityMetrics.views.peakViewTime || null,
                lastViewTime: entityMetrics.views.lastViewTime || null,
            },
            engagement: {
                totalLikes: entityMetrics.engagement.totalLikes,
                totalComments: entityMetrics.engagement.totalComments,
                totalReports: entityMetrics.engagement.totalReports,
                totalClicks: entityMetrics.engagement.totalClicks,
                likeRate: entityMetrics.engagement.likeRate,
                commentRate: entityMetrics.engagement.commentRate,
                clickRate: entityMetrics.engagement.clickRate,
                reportRate: entityMetrics.engagement.reportRate,
                averageCommentLength: entityMetrics.engagement.averageCommentLength,
                topCommenters: entityMetrics.engagement.topCommenters,
                engagementScore: entityMetrics.engagement.engagementScore || 0,
                lastEngagementTime: entityMetrics.engagement.lastEngagementTime || null,
            },
            performance: {
                loadTime: entityMetrics.performance.loadTime,
                bufferTime: entityMetrics.performance.bufferTime,
                errorRate: entityMetrics.performance.errorRate,
                successRate: entityMetrics.performance.successRate || 100,
                averageQuality: entityMetrics.performance.averageQuality || 0,
                qualityDistribution: entityMetrics.performance.qualityDistribution || {},
                bandwidthUsage: entityMetrics.performance.bandwidthUsage || 0,
                serverResponseTime: entityMetrics.performance.serverResponseTime || 0,
                cdnHitRate: entityMetrics.performance.cdnHitRate || 0,
                lastPerformanceUpdate: entityMetrics.performance.lastPerformanceUpdate || null,
            },
            viral: {
                viralScore: entityMetrics.viral?.viralScore || 0,
                viralReach: entityMetrics.viral?.viralReach || entityMetrics.viral?.totalReach || 0,
                reachByPlatform: entityMetrics.viral?.reachByPlatform || {},
                reachByUserType: entityMetrics.viral?.reachByUserType || {},
                viralCoefficient: entityMetrics.viral?.viralCoefficient || 0,
                viralVelocity: entityMetrics.viral?.viralVelocity || 0,
                peakViralTime: entityMetrics.viral?.peakViralTime || null,
                viralDecayRate: entityMetrics.viral?.viralDecayRate || 0,
                lastViralUpdate: entityMetrics.viral?.lastViralUpdate || null,
            },
            audience: {
                demographics: {
                    ageGroups: entityMetrics.audience.ageDistribution || {},
                    genders: entityMetrics.audience.genderDistribution || {},
                    locations: entityMetrics.audience.locationDistribution || {},
                    interests: {},
                },
                behavior: {
                    averageSessionTime: entityMetrics.audience.averageSessionDuration || 0,
                    bounceRate: entityMetrics.audience.bounceRate || 0,
                    returnRate: entityMetrics.audience.returnVisitorRate || 0,
                    engagementDepth: 0,
                    contentPreference: {},
                },
                growth: {
                    followerGrowth: 0,
                    subscriberGrowth: 0,
                    engagementGrowth: 0,
                    reachGrowth: 0,
                },
                lastAudienceUpdate: null,
            },
            content: {
                qualityScore:
                    entityMetrics.content?.qualityScore ||
                    entityMetrics.content?.contentQualityScore ||
                    0,
                contentRating: entityMetrics.content?.contentRating || 0,
                moderationScore: entityMetrics.content?.moderationScore || 0,
                accessibilityScore: entityMetrics.content?.accessibilityScore || 0,
                seoScore: entityMetrics.content?.seoScore || 0,
                contentTags: entityMetrics.content?.contentTags || [],
                contentCategories: entityMetrics.content?.contentCategories || [],
                contentSentiment: entityMetrics.content?.contentSentiment || 0,
                contentComplexity: entityMetrics.content?.contentComplexity || 0,
                lastContentUpdate: entityMetrics.content?.lastContentUpdate || null,
            },
            lastMetricsUpdate: entityMetrics.lastMetricsUpdate,
            metricsVersion: entityMetrics.metricsVersion,
            dataQuality: entityMetrics.dataQuality,
            confidenceLevel: entityMetrics.confidenceLevel,
        }
    }

    private convertMetricsToEntity(domainMetrics: MomentMetricsType): MomentMetricsDomain {
        return {
            views: {
                totalViews: domainMetrics.views.totalViews,
                totalClicks: domainMetrics.views.totalClicks || 0,
                uniqueViews: domainMetrics.views.uniqueViews,
                repeatViews: domainMetrics.views.repeatViews || 0,
                viewsByRegion: domainMetrics.views.viewsByRegion,
                viewsByDevice: domainMetrics.views.viewsByDevice,
                viewsByCountry: domainMetrics.views.viewsByCountry,
                viewsByCity: domainMetrics.views.viewsByCity,
                averageWatchTime: domainMetrics.views.averageWatchTime,
                completionViews: domainMetrics.views.completionViews,
                averageCompletionRate: domainMetrics.views.averageCompletionRate,
                peakViewTime: domainMetrics.views.peakViewTime,
                lastViewTime: domainMetrics.views.lastViewTime,
            },
            engagement: {
                totalLikes: domainMetrics.engagement.totalLikes,
                totalComments: domainMetrics.engagement.totalComments,
                totalReports: domainMetrics.engagement.totalReports,
                totalClicks: domainMetrics.engagement.totalClicks,
                likeRate: domainMetrics.engagement.likeRate,
                commentRate: domainMetrics.engagement.commentRate,
                clickRate: domainMetrics.engagement.clickRate,
                reportRate: domainMetrics.engagement.reportRate,
                averageCommentLength: domainMetrics.engagement.averageCommentLength,
                topCommenters: domainMetrics.engagement.topCommenters,
                engagementScore: domainMetrics.engagement.engagementScore,
                lastEngagementTime: domainMetrics.engagement.lastEngagementTime,
            },
            performance: {
                loadTime: domainMetrics.performance.loadTime,
                bufferTime: domainMetrics.performance.bufferTime,
                errorRate: domainMetrics.performance.errorRate,
                successRate: domainMetrics.performance.successRate,
                averageQuality: domainMetrics.performance.averageQuality,
                qualityDistribution: domainMetrics.performance.qualityDistribution,
                bandwidthUsage: domainMetrics.performance.bandwidthUsage,
                serverResponseTime: domainMetrics.performance.serverResponseTime,
                cdnHitRate: domainMetrics.performance.cdnHitRate,
                lastPerformanceUpdate: domainMetrics.performance.lastPerformanceUpdate,
            },
            viral: {
                viralScore: domainMetrics.viral.viralScore,
                viralReach: domainMetrics.viral.viralReach,
                reachByPlatform: domainMetrics.viral.reachByPlatform,
                reachByUserType: domainMetrics.viral.reachByUserType,
                viralCoefficient: domainMetrics.viral.viralCoefficient,
                viralVelocity: domainMetrics.viral.viralVelocity,
                peakViralTime: domainMetrics.viral.peakViralTime,
                viralDecayRate: domainMetrics.viral.viralDecayRate,
                lastViralUpdate: domainMetrics.viral.lastViralUpdate,
            },
            audience: {
                demographics: domainMetrics.audience.demographics,
                behavior: domainMetrics.audience.behavior,
                growth: domainMetrics.audience.growth,
                lastAudienceUpdate: domainMetrics.audience.lastAudienceUpdate,
            },
            content: {
                qualityScore: domainMetrics.content.qualityScore,
                contentRating: domainMetrics.content.contentRating,
                moderationScore: domainMetrics.content.moderationScore,
                accessibilityScore: domainMetrics.content.accessibilityScore,
                seoScore: domainMetrics.content.seoScore,
                contentTags: domainMetrics.content.contentTags,
                contentCategories: domainMetrics.content.contentCategories,
                contentSentiment: domainMetrics.content.contentSentiment,
                contentComplexity: domainMetrics.content.contentComplexity,
                lastContentUpdate: domainMetrics.content.lastContentUpdate,
            },
            lastMetricsUpdate: domainMetrics.lastMetricsUpdate,
            metricsVersion: domainMetrics.metricsVersion,
            dataQuality: domainMetrics.dataQuality,
            confidenceLevel: domainMetrics.confidenceLevel,
        }
    }

    private createDefaultContext(): MomentContext {
        return {
            device: {
                type: "unknown",
                os: "unknown",
                osVersion: "unknown",
                model: "unknown",
                screenResolution: "unknown",
                orientation: "unknown",
            },
            location: {
                latitude: 0,
                longitude: 0,
            },
        }
    }

    private createDefaultProcessing(): MomentProcessing {
        return {
            status: MomentProcessingStatusEnum.PENDING,
            progress: 0,
            steps: [],
            error: null,
            startedAt: null,
            completedAt: null,
            estimatedCompletion: null,
        }
    }

    private createDefaultEmbedding(): MomentEmbedding {
        return {
            vector: "",
            dimension: 0,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    }

    // ===== SERIALIZATION =====

    /**
     * Converte para entidade
     */
    toEntity(): MomentEntity {
        return {
            id: this._id,
            ownerId: this._ownerId,
            content: this._content,
            description: this._description,
            hashtags: this._hashtags,
            mentions: this._mentions,
            media: this._media,
            thumbnail: this._thumbnail,
            status: this._status,
            visibility: this._visibility,
            metrics: this.convertMetricsToEntity(this._metrics),
            context: this._context,
            processing: this._processing,
            embedding: this._embedding,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            publishedAt: this._publishedAt,
            archivedAt: this._archivedAt,
            deletedAt: this._deletedAt,
        }
    }

    /**
     * Cria instância a partir de entidade
     */
    static fromEntity(entity: MomentEntity): Moment {
        return new Moment({
            id: entity.id,
            ownerId: entity.ownerId,
            content: entity.content,
            description: entity.description,
            hashtags: entity.hashtags,
            mentions: entity.mentions,
            media: entity.media,
            thumbnail: entity.thumbnail,
            status: entity.status,
            visibility: entity.visibility,
            metrics: entity.metrics,
            context: entity.context,
            processing: entity.processing,
            embedding: entity.embedding,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            publishedAt: entity.publishedAt,
            archivedAt: entity.archivedAt,
            deletedAt: entity.deletedAt,
        })
    }

    /**
     * Cria novo momento
     */
    static create(props: Omit<MomentProps, "id" | "createdAt" | "updatedAt">): Moment {
        return new Moment({
            ...props,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    }
}
