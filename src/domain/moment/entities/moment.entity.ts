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

        if (this._processing.status !== MomentProcessingStatusEnum.COMPLETED) {
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
     * Incrementar likes
     */
    incrementLikes(): void {
        this._metrics.engagement.totalLikes++
        this._metrics.engagement.likeRate = this.likeRate
        this._metrics.lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
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
     * @param userWhoWantsToInteract - ID do usuário que quer interagir
     * @param userRepository - Repositório de usuários para validações (opcional)
     * @param ownerUser - Entidade do owner do moment (opcional, quando disponível)
     * @param interactingUser - Entidade do usuário que quer interagir (opcional, quando disponível)
     * @param isFollowing - Se o usuário que quer interagir segue o owner (opcional)
     * @param isBlocked - Se há bloqueio entre os usuários (opcional)
     * @returns Promise<boolean> - true se o moment é interagível
     */
    async isInteractable(
        userWhoWantsToInteract: string,
        userRepository?: import("@/domain/user").IUserRepository,
        ownerUser?: import("@/domain/user").User,
        interactingUser?: import("@/domain/user").User,
        isFollowing?: boolean,
        isBlocked?: boolean,
    ): Promise<boolean> {
        try {
            // 1. Verificar se o moment está publicado
            if (this._status.current !== "published") {
                return false
            }

            // Se temos as entidades de usuário em memória, usar validação síncrona
            if (ownerUser && interactingUser) {
                return this._validateWithUserEntities(
                    ownerUser,
                    interactingUser,
                    isFollowing ?? false,
                    isBlocked ?? false,
                )
            }

            // Se temos o repositório, usar validação assíncrona
            if (userRepository) {
                return await this._validateWithUserRepository(
                    userWhoWantsToInteract,
                    userRepository,
                )
            }

            // Fallback: validação básica apenas com visibilidade
            return this._validateBasicVisibility(userWhoWantsToInteract)
        } catch (error) {
            // Log do erro para debug (em produção, usar logger apropriado)
            console.error(`Erro ao verificar interatividade do moment ${this._id}:`, error)

            // Em caso de erro, retornar false por segurança
            return false
        }
    }

    /**
     * Validação básica apenas com visibilidade (fallback)
     */
    private _validateBasicVisibility(userWhoWantsToInteract: string): boolean {
        return (
            this._visibility.level === MomentVisibilityEnum.PUBLIC ||
            this._visibility.level === MomentVisibilityEnum.UNLISTED ||
            (this._visibility.level === MomentVisibilityEnum.PRIVATE &&
                this._visibility.allowedUsers.includes(userWhoWantsToInteract)) ||
            (this._visibility.level === MomentVisibilityEnum.FOLLOWERS_ONLY &&
                this._visibility.allowedUsers.includes(userWhoWantsToInteract))
        )
    }

    /**
     * Validação com entidades de usuário em memória (síncrona)
     */
    private _validateWithUserEntities(
        ownerUser: import("@/domain/user").User,
        interactingUser: import("@/domain/user").User,
        isFollowing: boolean,
        isBlocked: boolean,
    ): boolean {
        // 2. Verificar se o owner está ativo e pode interagir
        if (!ownerUser.isActive() || !ownerUser.canInteractWithMoments()) {
            return false
        }

        // 3. Verificar se o usuário que quer interagir está ativo e pode interagir
        if (!interactingUser.isActive() || !interactingUser.canInteractWithMoments()) {
            return false
        }

        // 4. Verificar se não há bloqueio entre os usuários
        if (isBlocked) {
            return false
        }

        // 5. Verificar visibilidade do moment
        switch (this._visibility.level) {
            case MomentVisibilityEnum.PUBLIC:
            case MomentVisibilityEnum.UNLISTED:
                return true

            case MomentVisibilityEnum.PRIVATE:
                return this._visibility.allowedUsers.includes(interactingUser.id)

            case MomentVisibilityEnum.FOLLOWERS_ONLY:
                return isFollowing || this._visibility.allowedUsers.includes(interactingUser.id)

            default:
                return false
        }
    }

    /**
     * Validação com repositório de usuários (assíncrona)
     */
    private async _validateWithUserRepository(
        userWhoWantsToInteract: string,
        userRepository: import("@/domain/user").IUserRepository,
    ): Promise<boolean> {
        // 2. Buscar informações do owner do moment
        const owner = await userRepository.findById(this._ownerId)
        if (!owner) {
            throw new Error(`Moment owner not found: ${this._ownerId}`)
        }

        // 3. Verificar se o owner está ativo (não bloqueado, não deletado)
        if (!owner.isActive()) {
            return false
        }

        // 4. Verificar se o owner pode interagir com moments
        if (!owner.canInteractWithMoments()) {
            return false
        }

        // 5. Buscar informações do usuário que quer interagir
        const interactingUser = await userRepository.findById(userWhoWantsToInteract)
        if (!interactingUser) {
            throw new Error(`Interacting user not found: ${userWhoWantsToInteract}`)
        }

        // 6. Verificar se o usuário que quer interagir está ativo
        if (!interactingUser.isActive()) {
            return false
        }

        // 7. Verificar se o usuário que quer interagir pode interagir com moments
        if (!interactingUser.canInteractWithMoments()) {
            return false
        }

        // 8. Verificar se não há bloqueio mútuo entre os usuários
        const isOwnerBlockedByUser = await userRepository.isBlocked(
            this._ownerId,
            userWhoWantsToInteract,
        )
        const isUserBlockedByOwner = await userRepository.isBlocked(
            userWhoWantsToInteract,
            this._ownerId,
        )

        if (isOwnerBlockedByUser || isUserBlockedByOwner) {
            return false
        }

        // 9. Verificar visibilidade do moment
        switch (this._visibility.level) {
            case MomentVisibilityEnum.PUBLIC:
            case MomentVisibilityEnum.UNLISTED:
                return true

            case MomentVisibilityEnum.PRIVATE:
                return this._visibility.allowedUsers.includes(userWhoWantsToInteract)

            case MomentVisibilityEnum.FOLLOWERS_ONLY:
                // Verificar se o usuário que quer interagir segue o owner
                const isFollowing = await userRepository.isFollowing(
                    userWhoWantsToInteract,
                    this._ownerId,
                )
                return isFollowing || this._visibility.allowedUsers.includes(userWhoWantsToInteract)

            default:
                return false
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
     * Recalcula todas as taxas de engajamento
     */
    recalculateEngagementRates(): void {
        if (this._metrics.views.totalViews > 0) {
            this._metrics.engagement.likeRate = this.likeRate
            this._metrics.engagement.reportRate = this.reportRate
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
            urls: {
                low: null,
                medium: null,
                high: null,
            },
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
                uniqueViews: defaultMetrics.views.uniqueViews,
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
                likeRate: defaultMetrics.engagement.likeRate,
                commentRate: defaultMetrics.engagement.commentRate,
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
                uniqueViews: entityMetrics.views.uniqueViews,
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
                likeRate: entityMetrics.engagement.likeRate,
                commentRate: entityMetrics.engagement.commentRate,
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
                uniqueViews: domainMetrics.views.uniqueViews,
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
                likeRate: domainMetrics.engagement.likeRate,
                commentRate: domainMetrics.engagement.commentRate,
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
