import {
    ContentTypeEnum,
    ModerationEntity,
    ModerationFlagEnum,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "./moderation.type"

// ===== FILTROS DE BUSCA =====
export interface ModerationSearchFilters {
    status?: ModerationStatusEnum[]
    contentType?: ContentTypeEnum[]
    flagType?: ModerationFlagEnum[]
    isHumanContent?: boolean
    dateRange?: {
        start: Date
        end: Date
    }
    contentOwnerId?: string
    minConfidence?: number
    maxConfidence?: number
    severity?: ModerationSeverityEnum[]
    isBlocked?: boolean
    isHidden?: boolean
    needsModeration?: boolean
}

// ===== OPÇÕES DE ORDENAÇÃO =====
export interface ModerationSortOptions {
    field: "createdAt" | "updatedAt" | "severity" | "confidence" | "moderatedAt"
    direction: "asc" | "desc"
}

// ===== OPÇÕES DE PAGINAÇÃO =====
export interface ModerationPaginationOptions {
    page: number
    limit: number
    cursor?: string
}

// ===== FILTROS ESPECÍFICOS POR TIPO DE CONTEÚDO =====
export interface ContentTypeFilters {
    // Filtros para conteúdo humano
    humanContent?: {
        audioQuality?: "good" | "poor" | "any"
        videoQuality?: "good" | "poor" | "any"
        contentQuality?: "good" | "poor" | "any"
    }

    // Filtros para conteúdo sintético
    syntheticContent?: {
        aiGenerated?: boolean
        syntheticVoice?: boolean
        botGenerated?: boolean
        lowQualityContent?: boolean
    }

    // Filtros para qualidade
    qualityFilters?: {
        minVideoQuality?: number
        minAudioQuality?: number
        minContentQuality?: number
        maxProcessingTime?: number
        hasAudio?: boolean
        isStatic?: boolean
    }

    // Filtros para comportamento
    behaviorFilters?: {
        isSpam?: boolean
        isMeme?: boolean
        hasExcessiveHashtags?: boolean
        isTextOnly?: boolean
    }
}

// ===== FILTROS DE ANÁLISE =====
export interface ModerationAnalyticsFilters {
    timeRange?: {
        start: Date
        end: Date
    }
    groupBy?: "day" | "week" | "month"
    contentType?: ContentTypeEnum[]
    flagType?: ModerationFlagEnum[]
    severity?: ModerationSeverityEnum[]
    contentOwnerId?: string
}

// ===== FILTROS DE RELATÓRIO =====
export interface ModerationReportFilters {
    dateRange: {
        start: Date
        end: Date
    }
    includeDetails?: boolean
    groupBy?: "contentType" | "flagType" | "severity" | "status"
    contentType?: ContentTypeEnum[]
    flagType?: ModerationFlagEnum[]
    severity?: ModerationSeverityEnum[]
    status?: ModerationStatusEnum[]
    contentOwnerId?: string
}

// ===== FILTROS DE VALIDAÇÃO =====
export interface ModerationValidationFilters {
    maxFlags?: number
    minConfidence?: number
    maxConfidence?: number
    maxProcessingTime?: number
    requiredFields?: string[]
    allowedContentTypes?: ContentTypeEnum[]
    detectionModels?: string[]
}

// ===== UTILITÁRIOS DE FILTRO =====
export class ModerationFilterBuilder {
    private filters: ModerationSearchFilters = {}

    static create(): ModerationFilterBuilder {
        return new ModerationFilterBuilder()
    }

    withStatus(status: ModerationStatusEnum[]): ModerationFilterBuilder {
        this.filters.status = status
        return this
    }

    withContentType(contentType: ContentTypeEnum[]): ModerationFilterBuilder {
        this.filters.contentType = contentType
        return this
    }

    withFlagType(flagType: ModerationFlagEnum[]): ModerationFilterBuilder {
        this.filters.flagType = flagType
        return this
    }

    withHumanContent(isHuman: boolean): ModerationFilterBuilder {
        this.filters.isHumanContent = isHuman
        return this
    }

    withDateRange(start: Date, end: Date): ModerationFilterBuilder {
        this.filters.dateRange = { start, end }
        return this
    }

    withContentOwner(ownerId: string): ModerationFilterBuilder {
        this.filters.contentOwnerId = ownerId
        return this
    }

    withConfidenceRange(min: number, max?: number): ModerationFilterBuilder {
        this.filters.minConfidence = min
        if (max !== undefined) {
            this.filters.maxConfidence = max
        }
        return this
    }

    withSeverity(severity: ModerationSeverityEnum[]): ModerationFilterBuilder {
        this.filters.severity = severity
        return this
    }

    withBlockedStatus(isBlocked: boolean): ModerationFilterBuilder {
        this.filters.isBlocked = isBlocked
        return this
    }

    withHiddenStatus(isHidden: boolean): ModerationFilterBuilder {
        this.filters.isHidden = isHidden
        return this
    }

    needsModeration(needs: boolean): ModerationFilterBuilder {
        this.filters.needsModeration = needs
        return this
    }

    build(): ModerationSearchFilters {
        return { ...this.filters }
    }
}

// ===== CONSTANTES DE FILTRO =====
export const DEFAULT_MODERATION_FILTERS: ModerationSearchFilters = {
    status: [ModerationStatusEnum.PENDING, ModerationStatusEnum.FLAGGED],
    isHumanContent: true,
    minConfidence: 70,
}

export const HUMAN_CONTENT_FILTERS: ModerationSearchFilters = {
    contentType: [ContentTypeEnum.HUMAN],
    isHumanContent: true,
    minConfidence: 80,
}

export const SYNTHETIC_CONTENT_FILTERS: ModerationSearchFilters = {
    contentType: [ContentTypeEnum.AI_GENERATED, ContentTypeEnum.BOT],
    isHumanContent: false,
    flagType: [ModerationFlagEnum.LOW_QUALITY_CONTENT, ModerationFlagEnum.BOT_CONTENT],
}

export const LOW_QUALITY_FILTERS: ModerationSearchFilters = {
    flagType: [
        ModerationFlagEnum.LOW_QUALITY_CONTENT,
        ModerationFlagEnum.LOW_QUALITY_VIDEO,
        ModerationFlagEnum.LOW_QUALITY_AUDIO,
        ModerationFlagEnum.NO_AUDIO,
        ModerationFlagEnum.STATIC_CONTENT,
    ],
}

export const SPAM_CONTENT_FILTERS: ModerationSearchFilters = {
    contentType: [ContentTypeEnum.SPAM],
    flagType: [
        ModerationFlagEnum.SPAM_CONTENT,
        ModerationFlagEnum.EXCESSIVE_HASHTAGS,
        ModerationFlagEnum.SUSPICIOUS_PATTERNS,
    ],
}

export class ModerationFilters {
    /**
     * Aplica filtros de busca em uma lista de moderações
     */
    static applyFilters(
        moderations: ModerationEntity[],
        filters: ModerationSearchFilters,
    ): ModerationEntity[] {
        return moderations.filter((moderation) => {
            return this.matchesFilters(moderation, filters)
        })
    }

    /**
     * Verifica se uma moderação corresponde aos filtros
     */
    static matchesFilters(moderation: ModerationEntity, filters: ModerationSearchFilters): boolean {
        // Filtro por status
        if (filters.status && !filters.status.includes(moderation.status)) {
            return false
        }

        // Filtro por tipo de conteúdo
        if (filters.contentType && !filters.contentType.includes(moderation.detectedContentType)) {
            return false
        }

        // Filtro por flags
        if (filters.flagType) {
            const hasMatchingFlag = moderation.flags.some((flag) =>
                filters.flagType!.includes(flag.type),
            )
            if (!hasMatchingFlag) {
                return false
            }
        }

        // Filtro por conteúdo humano
        if (
            filters.isHumanContent !== undefined &&
            moderation.isHumanContent !== filters.isHumanContent
        ) {
            return false
        }

        // Filtro por data
        if (filters.dateRange) {
            const moderationDate = moderation.createdAt
            if (
                moderationDate < filters.dateRange.start ||
                moderationDate > filters.dateRange.end
            ) {
                return false
            }
        }

        // Filtro por owner
        if (filters.contentOwnerId && moderation.contentOwnerId !== filters.contentOwnerId) {
            return false
        }

        // Filtro por confiança mínima
        if (filters.minConfidence && moderation.confidence < filters.minConfidence) {
            return false
        }

        // Filtro por confiança máxima
        if (filters.maxConfidence && moderation.confidence > filters.maxConfidence) {
            return false
        }

        // Filtro por severidade
        if (filters.severity && !filters.severity.includes(moderation.severity)) {
            return false
        }

        // Filtro por status de bloqueio
        if (filters.isBlocked !== undefined && moderation.isBlocked !== filters.isBlocked) {
            return false
        }

        // Filtro por status de ocultação
        if (filters.isHidden !== undefined && moderation.isHidden !== filters.isHidden) {
            return false
        }

        // Filtro por necessidade de moderação
        if (filters.needsModeration !== undefined) {
            const needsModeration = this.needsModeration(moderation)
            if (needsModeration !== filters.needsModeration) {
                return false
            }
        }

        return true
    }

    /**
     * Filtra por tipo de conteúdo específico
     */
    static filterByContentType(
        moderations: ModerationEntity[],
        contentType: ContentTypeEnum,
    ): ModerationEntity[] {
        return moderations.filter((moderation) => moderation.detectedContentType === contentType)
    }

    /**
     * Filtra por flags específicas
     */
    static filterByFlags(
        moderations: ModerationEntity[],
        flagTypes: ModerationFlagEnum[],
    ): ModerationEntity[] {
        return moderations.filter((moderation) =>
            moderation.flags.some((flag) => flagTypes.includes(flag.type)),
        )
    }

    /**
     * Filtra conteúdo humano
     */
    static filterHumanContent(moderations: ModerationEntity[]): ModerationEntity[] {
        return moderations.filter((moderation) => moderation.isHumanContent)
    }

    /**
     * Filtra conteúdo sintético
     */
    static filterSyntheticContent(moderations: ModerationEntity[]): ModerationEntity[] {
        return moderations.filter((moderation) => !moderation.isHumanContent)
    }

    /**
     * Filtra por qualidade
     */
    static filterByQuality(
        moderations: ModerationEntity[],
        minConfidence: number = 70,
    ): ModerationEntity[] {
        return moderations.filter((moderation) => moderation.confidence >= minConfidence)
    }

    /**
     * Filtra por severidade
     */
    static filterBySeverity(
        moderations: ModerationEntity[],
        severity: ModerationSeverityEnum,
    ): ModerationEntity[] {
        return moderations.filter((moderation) => moderation.severity === severity)
    }

    /**
     * Filtra por status
     */
    static filterByStatus(
        moderations: ModerationEntity[],
        status: ModerationStatusEnum,
    ): ModerationEntity[] {
        return moderations.filter((moderation) => moderation.status === status)
    }

    /**
     * Filtra por período
     */
    static filterByDateRange(
        moderations: ModerationEntity[],
        startDate: Date,
        endDate: Date,
    ): ModerationEntity[] {
        return moderations.filter((moderation) => {
            const moderationDate = moderation.createdAt
            return moderationDate >= startDate && moderationDate <= endDate
        })
    }

    /**
     * Filtra por owner
     */
    static filterByOwner(moderations: ModerationEntity[], ownerId: string): ModerationEntity[] {
        return moderations.filter((moderation) => moderation.contentOwnerId === ownerId)
    }

    /**
     * Filtra conteúdo que precisa de moderação
     */
    static filterNeedingModeration(moderations: ModerationEntity[]): ModerationEntity[] {
        return moderations.filter((moderation) => this.needsModeration(moderation))
    }

    /**
     * Filtra conteúdo que pode ser visualizado
     */
    static filterViewableContent(moderations: ModerationEntity[]): ModerationEntity[] {
        return moderations.filter((moderation) => this.canBeViewed(moderation))
    }

    /**
     * Filtra conteúdo bloqueado
     */
    static filterBlockedContent(moderations: ModerationEntity[]): ModerationEntity[] {
        return moderations.filter((moderation) => moderation.isBlocked)
    }

    /**
     * Filtra conteúdo oculto
     */
    static filterHiddenContent(moderations: ModerationEntity[]): ModerationEntity[] {
        return moderations.filter((moderation) => moderation.isHidden)
    }

    /**
     * Filtra por flags de qualidade
     */
    static filterByQualityFlags(moderations: ModerationEntity[]): ModerationEntity[] {
        const qualityFlags = [
            ModerationFlagEnum.LOW_QUALITY_CONTENT,
            ModerationFlagEnum.LOW_QUALITY_VIDEO,
            ModerationFlagEnum.LOW_QUALITY_AUDIO,
            ModerationFlagEnum.NO_AUDIO,
            ModerationFlagEnum.STATIC_CONTENT,
        ]
        return this.filterByFlags(moderations, qualityFlags)
    }

    /**
     * Filtra por flags de autenticidade
     */
    static filterByAuthenticityFlags(moderations: ModerationEntity[]): ModerationEntity[] {
        const authenticityFlags = [
            ModerationFlagEnum.LOW_QUALITY_CONTENT,
            ModerationFlagEnum.BOT_CONTENT,
            ModerationFlagEnum.SUSPICIOUS_PATTERNS,
        ]
        return this.filterByFlags(moderations, authenticityFlags)
    }

    /**
     * Filtra por flags de spam
     */
    static filterBySpamFlags(moderations: ModerationEntity[]): ModerationEntity[] {
        const spamFlags = [
            ModerationFlagEnum.SPAM_CONTENT,
            ModerationFlagEnum.EXCESSIVE_HASHTAGS,
            ModerationFlagEnum.EXCESSIVE_MENTIONS,
            ModerationFlagEnum.EXCESSIVE_URLS,
            ModerationFlagEnum.SUSPICIOUS_PATTERNS,
            ModerationFlagEnum.REPETITIVE_CONTENT,
            ModerationFlagEnum.TEXT_ONLY,
        ]
        return this.filterByFlags(moderations, spamFlags)
    }

    // ===== MÉTODOS DE ANÁLISE =====

    /**
     * Agrupa moderações por tipo de conteúdo
     */
    static groupByContentType(
        moderations: ModerationEntity[],
    ): Record<ContentTypeEnum, ModerationEntity[]> {
        const groups: Record<string, ModerationEntity[]> = {}

        moderations.forEach((moderation) => {
            const contentType = moderation.detectedContentType
            if (!groups[contentType]) {
                groups[contentType] = []
            }
            groups[contentType].push(moderation)
        })

        return groups as Record<ContentTypeEnum, ModerationEntity[]>
    }

    /**
     * Agrupa moderações por severidade
     */
    static groupBySeverity(
        moderations: ModerationEntity[],
    ): Record<ModerationSeverityEnum, ModerationEntity[]> {
        const groups: Record<string, ModerationEntity[]> = {}

        moderations.forEach((moderation) => {
            const severity = moderation.severity
            if (!groups[severity]) {
                groups[severity] = []
            }
            groups[severity].push(moderation)
        })

        return groups as Record<ModerationSeverityEnum, ModerationEntity[]>
    }

    /**
     * Agrupa moderações por status
     */
    static groupByStatus(
        moderations: ModerationEntity[],
    ): Record<ModerationStatusEnum, ModerationEntity[]> {
        const groups: Record<string, ModerationEntity[]> = {}

        moderations.forEach((moderation) => {
            const status = moderation.status
            if (!groups[status]) {
                groups[status] = []
            }
            groups[status].push(moderation)
        })

        return groups as Record<ModerationStatusEnum, ModerationEntity[]>
    }

    /**
     * Calcula estatísticas de moderação
     */
    static calculateStats(moderations: ModerationEntity[]) {
        const total = moderations.length
        const humanContent = moderations.filter((m) => m.isHumanContent).length
        const syntheticContent = total - humanContent
        const blocked = moderations.filter((m) => m.isBlocked).length
        const hidden = moderations.filter((m) => m.isHidden).length
        const pending = moderations.filter((m) => m.status === ModerationStatusEnum.PENDING).length
        const flagged = moderations.filter((m) => m.status === ModerationStatusEnum.FLAGGED).length
        const approved = moderations.filter(
            (m) => m.status === ModerationStatusEnum.APPROVED,
        ).length
        const rejected = moderations.filter(
            (m) => m.status === ModerationStatusEnum.REJECTED,
        ).length

        const averageConfidence = moderations.reduce((sum, m) => sum + m.confidence, 0) / total || 0
        const averageProcessingTime =
            moderations.reduce((sum, m) => sum + m.processingTime, 0) / total || 0

        return {
            total,
            humanContent,
            syntheticContent,
            blocked,
            hidden,
            pending,
            flagged,
            approved,
            rejected,
            averageConfidence,
            averageProcessingTime,
            humanContentRatio: total > 0 ? humanContent / total : 0,
            blockedRatio: total > 0 ? blocked / total : 0,
        }
    }

    // ===== MÉTODOS AUXILIARES =====

    /**
     * Verifica se precisa de moderação
     */
    private static needsModeration(moderation: ModerationEntity): boolean {
        return (
            moderation.status === ModerationStatusEnum.PENDING ||
            moderation.status === ModerationStatusEnum.FLAGGED ||
            !moderation.isHumanContent ||
            moderation.confidence < 70
        )
    }

    /**
     * Verifica se pode ser visualizado
     */
    private static canBeViewed(moderation: ModerationEntity): boolean {
        return (
            !moderation.isBlocked &&
            !moderation.isHidden &&
            moderation.status === ModerationStatusEnum.APPROVED
        )
    }

    /**
     * Verifica se tem conteúdo de baixa qualidade
     */
    static hasLowQualityContent(moderation: ModerationEntity): boolean {
        return moderation.flags.some((flag) => flag.type === ModerationFlagEnum.LOW_QUALITY_CONTENT)
    }

    /**
     * Verifica se tem áudio
     */
    static hasAudio(moderation: ModerationEntity): boolean {
        return !moderation.flags.some((flag) => flag.type === ModerationFlagEnum.NO_AUDIO)
    }

    /**
     * Verifica se é conteúdo estático
     */
    static isStaticContent(moderation: ModerationEntity): boolean {
        return moderation.flags.some((flag) => flag.type === ModerationFlagEnum.STATIC_CONTENT)
    }

    /**
     * Verifica se tem qualidade de vídeo ruim
     */
    static hasLowVideoQuality(moderation: ModerationEntity): boolean {
        return moderation.flags.some((flag) => flag.type === ModerationFlagEnum.LOW_QUALITY_VIDEO)
    }

    /**
     * Verifica se tem qualidade de áudio ruim
     */
    static hasLowAudioQuality(moderation: ModerationEntity): boolean {
        return moderation.flags.some((flag) => flag.type === ModerationFlagEnum.LOW_QUALITY_AUDIO)
    }

    /**
     * Verifica se tem hashtags excessivas
     */
    static hasExcessiveHashtags(moderation: ModerationEntity): boolean {
        return moderation.flags.some((flag) => flag.type === ModerationFlagEnum.EXCESSIVE_HASHTAGS)
    }

    /**
     * Verifica se é apenas texto
     */
    static isTextOnly(moderation: ModerationEntity): boolean {
        return moderation.flags.some((flag) => flag.type === ModerationFlagEnum.TEXT_ONLY)
    }

    /**
     * Verifica se é conteúdo gerado por IA
     */
    static isAIGenerated(moderation: ModerationEntity): boolean {
        return moderation.detectedContentType === ContentTypeEnum.AI_GENERATED
    }

    /**
     * Verifica se é meme
     */
    static isMeme(moderation: ModerationEntity): boolean {
        return moderation.detectedContentType === ContentTypeEnum.MEME
    }

    /**
     * Verifica se é spam
     */
    static isSpam(moderation: ModerationEntity): boolean {
        return moderation.detectedContentType === ContentTypeEnum.SPAM
    }

    /**
     * Verifica se é bot
     */
    static isBot(moderation: ModerationEntity): boolean {
        return moderation.detectedContentType === ContentTypeEnum.BOT
    }

    /**
     * Obtém flags por tipo
     */
    static getFlagsByType(moderation: ModerationEntity, type: ModerationFlagEnum) {
        return moderation.flags.filter((flag) => flag.type === type)
    }

    /**
     * Obtém flags por severidade
     */
    static getFlagsBySeverity(moderation: ModerationEntity, severity: ModerationSeverityEnum) {
        return moderation.flags.filter((flag) => flag.severity === severity)
    }

    /**
     * Obtém confiança média das flags
     */
    static getAverageConfidence(moderation: ModerationEntity): number {
        if (moderation.flags.length === 0) return moderation.confidence

        const totalConfidence = moderation.flags.reduce((sum, flag) => sum + flag.confidence, 0)
        return totalConfidence / moderation.flags.length
    }
}
