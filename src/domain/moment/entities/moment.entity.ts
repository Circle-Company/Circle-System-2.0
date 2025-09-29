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
    MomentMetrics,
    MomentProcessing,
    MomentProcessingStatusEnum,
    MomentProps,
    MomentStatus,
    MomentStatusEnum,
    MomentThumbnail,
    MomentVisibility,
    MomentVisibilityEnum,
} from "../types"

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
    private _metrics: MomentMetrics
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
        this._id = props.id || this.generateId()
        this._ownerId = props.ownerId
        this._content = props.content
        this._description = props.description || ""
        this._hashtags = props.hashtags || []
        this._mentions = props.mentions || []
        this._media = props.media || this.createDefaultMedia()
        this._thumbnail = props.thumbnail || this.createDefaultThumbnail()
        this._status = props.status || this.createDefaultStatus()
        this._visibility = props.visibility || this.createDefaultVisibility()
        this._metrics = props.metrics || this.createDefaultMetrics()
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
    get metrics(): MomentMetrics {
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
        if (!this.isContentValid()) {
            throw new Error("Conteúdo inválido para publicação")
        }

        if (this._processing.status !== MomentProcessingStatusEnum.COMPLETED) {
            throw new Error("Processamento de mídia não concluído")
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
            throw new Error("Apenas momentos publicados podem ser arquivados")
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
            throw new Error("Momento já foi deletado")
        }

        this.changeStatus(MomentStatusEnum.DELETED, "Deletado pelo usuário")
        this._deletedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Atualizar descrição
     */
    updateDescription(description: string): void {
        const validation = this.validator.validateText({
            description,
            hashtags: this._hashtags,
            mentions: this._mentions,
        })

        if (!validation.isValid) {
            throw new Error(validation.errors.join(", "))
        }

        this._description = description
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
        this._metrics.lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Incrementar comentários
     */
    incrementComments(): void {
        this._metrics.engagement.totalComments++
        this._metrics.lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Incrementar reports
     */
    incrementReports(): void {
        this._metrics.engagement.totalReports++
        this._metrics.lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Atualizar tempo médio de visualização
     */
    updateWatchTime(watchTime: number): void {
        if (watchTime > this._content.duration) {
            throw new Error("Tempo de visualização não pode ser maior que a duração do vídeo")
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
            throw new Error("Owner ID é obrigatório")
        }

        if (!this._content) {
            throw new Error("Conteúdo é obrigatório")
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
     * Verifica se o conteúdo é válido para publicação
     */
    private isContentValid(): boolean {
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
     * Calcula taxa de engajamento
     */
    private calculateEngagementRate(): number {
        if (this._metrics.views.totalViews === 0) return 0
        return (
            ((this._metrics.engagement.totalLikes + this._metrics.engagement.totalComments) /
                this._metrics.views.totalViews) *
            100
        )
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

    /**
     * Gera ID único
     */
    private generateId(): string {
        return `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

    private createDefaultMetrics(): MomentMetrics {
        return MomentMetricsFactory.createDefault()
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
            metrics: this._metrics,
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

    /**
     * Cria novo momento com regras customizadas
     */
    static createWithRules(
        props: Omit<MomentProps, "id" | "createdAt" | "updatedAt">,
        rules: any,
    ): Moment {
        const moment = new Moment({
            ...props,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        // Aplicar regras customizadas se necessário
        if (rules) {
            // Implementar lógica para aplicar regras customizadas
        }

        return moment
    }
}
