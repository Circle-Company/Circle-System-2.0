// ===== MÉTRICAS DE VISUALIZAÇÃO =====
export interface ViewMetrics {
    // Contadores básicos
    totalViews: number
    uniqueViews: number
    repeatViews: number
    completionViews: number // visualizações que chegaram ao final

    // Distribuição geográfica
    viewsByCountry: Record<string, number>
    viewsByRegion: Record<string, number>
    viewsByCity: Record<string, number>

    // Distribuição por dispositivo
    viewsByDevice: Record<string, number>
    viewsByOS: Record<string, number>
    viewsByBrowser: Record<string, number>

    // Distribuição temporal
    viewsByHour: Record<number, number> // 0-23
    viewsByDayOfWeek: Record<number, number> // 0-6
    viewsByMonth: Record<number, number> // 1-12

    // Qualidade de visualização
    averageWatchTime: number // segundos
    averageCompletionRate: number // %
    bounceRate: number // % que saiu nos primeiros 3 segundos
    retentionCurve: number[] // % de retenção por segundo
}

// ===== MÉTRICAS DE ENGAGEMENT =====
export interface EngagementMetrics {
    // Interações básicas
    totalLikes: number
    totalComments: number
    totalReports: number

    // Engajamento qualitativo
    likeRate: number // likes / views
    commentRate: number // comments / views
    reportRate: number // reports / views

    // Análise de comentários
    positiveComments: number
    negativeComments: number
    neutralComments: number
    averageCommentLength: number
    topCommenters: Array<{ userId: string; count: number }>

    // Engajamento temporal
    engagementByHour: Record<number, number>
    engagementByDay: Record<number, number>
    peakEngagementTime: Date
}

// ===== MÉTRICAS DE PERFORMANCE =====
export interface PerformanceMetrics {
    // Qualidade técnica
    loadTime: number // ms
    bufferTime: number // ms
    errorRate: number // %
    qualitySwitches: number // mudanças de qualidade durante reprodução

    // Performance de rede
    bandwidthUsage: number // bytes
    averageBitrate: number // kbps
    peakBitrate: number // kbps

    // Performance de processamento
    processingTime: number // ms
    thumbnailGenerationTime: number // ms
    embeddingGenerationTime: number // ms

    // Performance de armazenamento
    storageSize: number // bytes
    compressionRatio: number // %
    cdnHitRate: number // %
}

// ===== MÉTRICAS DE VIRALIDADE =====
export interface ViralMetrics {
    // Scores de viralidade
    viralScore: number // 0-100
    trendingScore: number // 0-100
    reachScore: number // 0-100
    influenceScore: number // 0-100

    // Crescimento
    growthRate: number // % de crescimento diário
    accelerationRate: number // aceleração do crescimento
    peakGrowthTime: Date

    // Alcance
    organicReach: number
    paidReach: number
    viralReach: number // alcance através de engajamento
    totalReach: number

    // Distribuição
    reachByPlatform: Record<string, number>
    reachByUserType: Record<string, number> // premium, regular, etc.
    cascadeDepth: number // profundidade da cascata de alcance
}

// ===== MÉTRICAS DE AUDIÊNCIA =====
export interface AudienceMetrics {
    // Demografia
    ageDistribution: Record<string, number> // 18-24, 25-34, etc.
    genderDistribution: Record<string, number>
    locationDistribution: Record<string, number>

    // Comportamento
    averageSessionDuration: number // segundos
    pagesPerSession: number
    returnVisitorRate: number // %
    newVisitorRate: number // %

    // Segmentação
    premiumUsers: number
    regularUsers: number
    newUsers: number
    powerUsers: number // usuários muito ativos

    // Fidelidade
    repeatViewerRate: number // %
    subscriberConversionRate: number // %
    churnRate: number // %
}

// ===== MÉTRICAS DE CONTEÚDO =====
export interface ContentMetrics {
    // Qualidade do conteúdo
    contentQualityScore: number // 0-100
    audioQualityScore: number // 0-100
    videoQualityScore: number // 0-100

    // Análise de conteúdo
    faceDetectionRate: number // % de frames com face detectada
    motionIntensity: number // 0-100
    colorVariance: number // variância de cores
    brightnessLevel: number // 0-100

    // Análise de áudio
    speechToNoiseRatio: number // dB
    averageVolume: number // dB
    silencePercentage: number // %

    // Análise de texto
    hashtagEffectiveness: number // 0-100
    mentionEffectiveness: number // 0-100
    descriptionEngagement: number // 0-100
}

// ===== MÉTRICAS DE MONETIZAÇÃO =====
export interface MonetizationMetrics {
    // Receita
    totalRevenue: number
    adRevenue: number
    subscriptionRevenue: number
    tipRevenue: number
    merchandiseRevenue: number

    // Performance financeira
    revenuePerView: number
    revenuePerUser: number
    averageOrderValue: number

    // Conversões
    adClickRate: number // %
    subscriptionConversionRate: number // %
    tipConversionRate: number // %
    merchandiseConversionRate: number // %

    // Custos
    productionCost: number
    distributionCost: number
    marketingCost: number
    totalCost: number

    // ROI
    returnOnInvestment: number // %
    profitMargin: number // %
    breakEvenPoint: Date
}

// ===== MÉTRICAS COMPLETAS =====
export interface MomentMetrics {
    // Métricas principais
    views: ViewMetrics
    engagement: EngagementMetrics
    performance: PerformanceMetrics
    viral: ViralMetrics
    audience: AudienceMetrics
    content: ContentMetrics
    monetization: MonetizationMetrics

    // Metadados
    lastMetricsUpdate: Date
    metricsVersion: string
    dataQuality: number // 0-100
    confidenceLevel: number // 0-100

    // Timestamps
    createdAt: Date
    updatedAt: Date
}

// ===== ENTIDADE DE MÉTRICAS =====
export class MomentMetricsEntity {
    private _id: string
    private _momentId: string
    private _views: ViewMetrics
    private _engagement: EngagementMetrics
    private _performance: PerformanceMetrics
    private _viral: ViralMetrics
    private _audience: AudienceMetrics
    private _content: ContentMetrics
    private _monetization: MonetizationMetrics
    private _lastMetricsUpdate: Date
    private _metricsVersion: string
    private _dataQuality: number
    private _confidenceLevel: number
    private _createdAt: Date
    private _updatedAt: Date

    constructor(props: {
        id: string
        momentId: string
        views: ViewMetrics
        engagement: EngagementMetrics
        performance: PerformanceMetrics
        viral: ViralMetrics
        audience: AudienceMetrics
        content: ContentMetrics
        monetization: MonetizationMetrics
        lastMetricsUpdate: Date
        metricsVersion: string
        dataQuality: number
        confidenceLevel: number
        createdAt: Date
        updatedAt: Date
    }) {
        this._id = props.id
        this._momentId = props.momentId
        this._views = props.views
        this._engagement = props.engagement
        this._performance = props.performance
        this._viral = props.viral
        this._audience = props.audience
        this._content = props.content
        this._monetization = props.monetization
        this._lastMetricsUpdate = props.lastMetricsUpdate
        this._metricsVersion = props.metricsVersion
        this._dataQuality = props.dataQuality
        this._confidenceLevel = props.confidenceLevel
        this._createdAt = props.createdAt
        this._updatedAt = props.updatedAt
    }

    // Getters
    get id(): string {
        return this._id
    }
    get momentId(): string {
        return this._momentId
    }
    get views(): ViewMetrics {
        return this._views
    }
    get engagement(): EngagementMetrics {
        return this._engagement
    }
    get performance(): PerformanceMetrics {
        return this._performance
    }
    get viral(): ViralMetrics {
        return this._viral
    }
    get audience(): AudienceMetrics {
        return this._audience
    }
    get content(): ContentMetrics {
        return this._content
    }
    get monetization(): MonetizationMetrics {
        return this._monetization
    }
    get lastMetricsUpdate(): Date {
        return this._lastMetricsUpdate
    }
    get metricsVersion(): string {
        return this._metricsVersion
    }
    get dataQuality(): number {
        return this._dataQuality
    }
    get confidenceLevel(): number {
        return this._confidenceLevel
    }
    get createdAt(): Date {
        return this._createdAt
    }
    get updatedAt(): Date {
        return this._updatedAt
    }

    // Métodos de negócio para métricas de visualização
    incrementViews(count: number = 1): void {
        this._views.totalViews += count
        this._views.uniqueViews += count
        this._updateMetricsTimestamp()
    }

    incrementRepeatViews(count: number = 1): void {
        this._views.repeatViews += count
        this._updateMetricsTimestamp()
    }

    incrementCompletionViews(count: number = 1): void {
        this._views.completionViews += count
        this._updateMetricsTimestamp()
    }

    updateWatchTime(watchTime: number): void {
        const totalViews = this._views.totalViews
        if (totalViews > 0) {
            this._views.averageWatchTime =
                (this._views.averageWatchTime * (totalViews - 1) + watchTime) / totalViews
        }
        this._updateMetricsTimestamp()
    }

    updateCompletionRate(completionRate: number): void {
        const totalViews = this._views.totalViews
        if (totalViews > 0) {
            this._views.averageCompletionRate =
                (this._views.averageCompletionRate * (totalViews - 1) + completionRate) / totalViews
        }
        this._updateMetricsTimestamp()
    }

    // Métodos de negócio para métricas de engajamento
    incrementLikes(count: number = 1): void {
        this._engagement.totalLikes += count
        this._recalculateEngagementRates()
        this._updateMetricsTimestamp()
    }

    incrementComments(count: number = 1): void {
        this._engagement.totalComments += count
        this._recalculateEngagementRates()
        this._updateMetricsTimestamp()
    }

    incrementReports(count: number = 1): void {
        this._engagement.totalReports += count
        this._recalculateEngagementRates()
        this._updateMetricsTimestamp()
    }

    // Métodos de negócio para métricas de performance
    updateLoadTime(loadTime: number): void {
        this._performance.loadTime = loadTime
        this._updateMetricsTimestamp()
    }

    updateBufferTime(bufferTime: number): void {
        this._performance.bufferTime = bufferTime
        this._updateMetricsTimestamp()
    }

    incrementQualitySwitches(count: number = 1): void {
        this._performance.qualitySwitches += count
        this._updateMetricsTimestamp()
    }

    // Métodos de negócio para métricas virais
    updateViralScore(score: number): void {
        this._viral.viralScore = Math.max(0, Math.min(100, score))
        this._updateMetricsTimestamp()
    }

    updateTrendingScore(score: number): void {
        this._viral.trendingScore = Math.max(0, Math.min(100, score))
        this._updateMetricsTimestamp()
    }

    updateGrowthRate(rate: number): void {
        this._viral.growthRate = rate
        this._updateMetricsTimestamp()
    }

    // Métodos de negócio para métricas de conteúdo
    updateContentQualityScore(score: number): void {
        this._content.contentQualityScore = Math.max(0, Math.min(100, score))
        this._updateMetricsTimestamp()
    }

    updateAudioQualityScore(score: number): void {
        this._content.audioQualityScore = Math.max(0, Math.min(100, score))
        this._updateMetricsTimestamp()
    }

    updateVideoQualityScore(score: number): void {
        this._content.videoQualityScore = Math.max(0, Math.min(100, score))
        this._updateMetricsTimestamp()
    }

    updateFaceDetectionRate(rate: number): void {
        this._content.faceDetectionRate = Math.max(0, Math.min(100, rate))
        this._updateMetricsTimestamp()
    }

    // Métodos de negócio para métricas de monetização
    addRevenue(amount: number, type: "ad" | "subscription" | "tip" | "merchandise"): void {
        this._monetization.totalRevenue += amount

        switch (type) {
            case "ad":
                this._monetization.adRevenue += amount
                break
            case "subscription":
                this._monetization.subscriptionRevenue += amount
                break
            case "tip":
                this._monetization.tipRevenue += amount
                break
            case "merchandise":
                this._monetization.merchandiseRevenue += amount
                break
        }

        this._recalculateMonetizationMetrics()
        this._updateMetricsTimestamp()
    }

    addCost(amount: number, type: "production" | "distribution" | "marketing"): void {
        this._monetization.totalCost += amount

        switch (type) {
            case "production":
                this._monetization.productionCost += amount
                break
            case "distribution":
                this._monetization.distributionCost += amount
                break
            case "marketing":
                this._monetization.marketingCost += amount
                break
        }

        this._recalculateMonetizationMetrics()
        this._updateMetricsTimestamp()
    }

    // Métodos de cálculo
    calculateEngagementRate(): number {
        if (this._views.totalViews === 0) return 0
        return (
            (this._engagement.totalLikes + this._engagement.totalComments) / this._views.totalViews
        )
    }

    calculateViralScore(): number {
        return MomentMetricsCalculator.calculateViralScore(this.toMetrics())
    }

    calculateContentQualityScore(): number {
        return MomentMetricsCalculator.calculateContentQualityScore(this.toMetrics())
    }

    calculateROI(): number {
        return MomentMetricsCalculator.calculateROI(this.toMetrics())
    }

    calculateEngagementScore(): number {
        return MomentMetricsCalculator.calculateEngagementScore(this.toMetrics())
    }

    calculateTrendingScore(): number {
        return MomentMetricsCalculator.calculateTrendingScore(this.toMetrics())
    }

    // Métodos de validação
    isValid(): boolean {
        return (
            this._dataQuality >= 0 &&
            this._dataQuality <= 100 &&
            this._confidenceLevel >= 0 &&
            this._confidenceLevel <= 100
        )
    }

    needsUpdate(): boolean {
        const now = new Date()
        const timeSinceUpdate = now.getTime() - this._lastMetricsUpdate.getTime()
        return timeSinceUpdate > 24 * 60 * 60 * 1000 // 24 horas
    }

    // Métodos de serialização
    toMetrics(): MomentMetrics {
        return {
            views: { ...this._views },
            engagement: { ...this._engagement },
            performance: { ...this._performance },
            viral: { ...this._viral },
            audience: { ...this._audience },
            content: { ...this._content },
            monetization: { ...this._monetization },
            lastMetricsUpdate: this._lastMetricsUpdate,
            metricsVersion: this._metricsVersion,
            dataQuality: this._dataQuality,
            confidenceLevel: this._confidenceLevel,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        }
    }

    toEntity(): {
        id: string
        momentId: string
        views: ViewMetrics
        engagement: EngagementMetrics
        performance: PerformanceMetrics
        viral: ViralMetrics
        audience: AudienceMetrics
        content: ContentMetrics
        monetization: MonetizationMetrics
        lastMetricsUpdate: Date
        metricsVersion: string
        dataQuality: number
        confidenceLevel: number
        createdAt: Date
        updatedAt: Date
    } {
        return {
            id: this._id,
            momentId: this._momentId,
            views: { ...this._views },
            engagement: { ...this._engagement },
            performance: { ...this._performance },
            viral: { ...this._viral },
            audience: { ...this._audience },
            content: { ...this._content },
            monetization: { ...this._monetization },
            lastMetricsUpdate: this._lastMetricsUpdate,
            metricsVersion: this._metricsVersion,
            dataQuality: this._dataQuality,
            confidenceLevel: this._confidenceLevel,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        }
    }

    // Métodos privados
    private _recalculateEngagementRates(): void {
        if (this._views.totalViews > 0) {
            this._engagement.likeRate = this._engagement.totalLikes / this._views.totalViews
            this._engagement.commentRate = this._engagement.totalComments / this._views.totalViews
            this._engagement.reportRate = this._engagement.totalReports / this._views.totalViews
        }
    }

    private _recalculateMonetizationMetrics(): void {
        if (this._views.totalViews > 0) {
            this._monetization.revenuePerView =
                this._monetization.totalRevenue / this._views.totalViews
        }

        if (this._monetization.totalCost > 0) {
            const profit = this._monetization.totalRevenue - this._monetization.totalCost
            this._monetization.returnOnInvestment = (profit / this._monetization.totalCost) * 100
            this._monetization.profitMargin = (profit / this._monetization.totalRevenue) * 100
        }
    }

    private _updateMetricsTimestamp(): void {
        this._lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    // Factory methods
    static create(momentId: string, overrides?: Partial<MomentMetrics>): MomentMetricsEntity {
        const defaultMetrics = MomentMetricsFactory.createDefault()
        const metrics = overrides ? MomentMetricsFactory.createCustom(overrides) : defaultMetrics

        return new MomentMetricsEntity({
            id: `metrics_${momentId}_${Date.now()}`,
            momentId,
            views: metrics.views,
            engagement: metrics.engagement,
            performance: metrics.performance,
            viral: metrics.viral,
            audience: metrics.audience,
            content: metrics.content,
            monetization: metrics.monetization,
            lastMetricsUpdate: metrics.lastMetricsUpdate,
            metricsVersion: metrics.metricsVersion,
            dataQuality: metrics.dataQuality,
            confidenceLevel: metrics.confidenceLevel,
            createdAt: metrics.createdAt,
            updatedAt: metrics.updatedAt,
        })
    }

    static fromMetrics(momentId: string, metrics: MomentMetrics): MomentMetricsEntity {
        return new MomentMetricsEntity({
            id: `metrics_${momentId}_${Date.now()}`,
            momentId,
            views: metrics.views,
            engagement: metrics.engagement,
            performance: metrics.performance,
            viral: metrics.viral,
            audience: metrics.audience,
            content: metrics.content,
            monetization: metrics.monetization,
            lastMetricsUpdate: metrics.lastMetricsUpdate,
            metricsVersion: metrics.metricsVersion,
            dataQuality: metrics.dataQuality,
            confidenceLevel: metrics.confidenceLevel,
            createdAt: metrics.createdAt,
            updatedAt: metrics.updatedAt,
        })
    }
}

// ===== MÉTRICAS PADRÃO =====
export const DEFAULT_VIEW_METRICS: ViewMetrics = {
    totalViews: 0,
    uniqueViews: 0,
    repeatViews: 0,
    completionViews: 0,
    viewsByCountry: {},
    viewsByRegion: {},
    viewsByCity: {},
    viewsByDevice: {},
    viewsByOS: {},
    viewsByBrowser: {},
    viewsByHour: {},
    viewsByDayOfWeek: {},
    viewsByMonth: {},
    averageWatchTime: 0,
    averageCompletionRate: 0,
    bounceRate: 0,
    retentionCurve: [],
}

export const DEFAULT_ENGAGEMENT_METRICS: EngagementMetrics = {
    totalLikes: 0,
    totalComments: 0,
    totalReports: 0,
    likeRate: 0,
    commentRate: 0,
    reportRate: 0,
    positiveComments: 0,
    negativeComments: 0,
    neutralComments: 0,
    averageCommentLength: 0,
    topCommenters: [],
    engagementByHour: {},
    engagementByDay: {},
    peakEngagementTime: new Date(),
}

export const DEFAULT_PERFORMANCE_METRICS: PerformanceMetrics = {
    loadTime: 0,
    bufferTime: 0,
    errorRate: 0,
    qualitySwitches: 0,
    bandwidthUsage: 0,
    averageBitrate: 0,
    peakBitrate: 0,
    processingTime: 0,
    thumbnailGenerationTime: 0,
    embeddingGenerationTime: 0,
    storageSize: 0,
    compressionRatio: 0,
    cdnHitRate: 0,
}

export const DEFAULT_VIRAL_METRICS: ViralMetrics = {
    viralScore: 0,
    trendingScore: 0,
    reachScore: 0,
    influenceScore: 0,
    growthRate: 0,
    accelerationRate: 0,
    peakGrowthTime: new Date(),
    organicReach: 0,
    paidReach: 0,
    viralReach: 0,
    totalReach: 0,
    reachByPlatform: {},
    reachByUserType: {},
    cascadeDepth: 0,
}

export const DEFAULT_AUDIENCE_METRICS: AudienceMetrics = {
    ageDistribution: {},
    genderDistribution: {},
    locationDistribution: {},
    averageSessionDuration: 0,
    pagesPerSession: 0,
    returnVisitorRate: 0,
    newVisitorRate: 0,
    premiumUsers: 0,
    regularUsers: 0,
    newUsers: 0,
    powerUsers: 0,
    repeatViewerRate: 0,
    subscriberConversionRate: 0,
    churnRate: 0,
}

export const DEFAULT_CONTENT_METRICS: ContentMetrics = {
    contentQualityScore: 0,
    audioQualityScore: 0,
    videoQualityScore: 0,
    faceDetectionRate: 0,
    motionIntensity: 0,
    colorVariance: 0,
    brightnessLevel: 0,
    speechToNoiseRatio: 0,
    averageVolume: 0,
    silencePercentage: 0,
    hashtagEffectiveness: 0,
    mentionEffectiveness: 0,
    descriptionEngagement: 0,
}

export const DEFAULT_MONETIZATION_METRICS: MonetizationMetrics = {
    totalRevenue: 0,
    adRevenue: 0,
    subscriptionRevenue: 0,
    tipRevenue: 0,
    merchandiseRevenue: 0,
    revenuePerView: 0,
    revenuePerUser: 0,
    averageOrderValue: 0,
    adClickRate: 0,
    subscriptionConversionRate: 0,
    tipConversionRate: 0,
    merchandiseConversionRate: 0,
    productionCost: 0,
    distributionCost: 0,
    marketingCost: 0,
    totalCost: 0,
    returnOnInvestment: 0,
    profitMargin: 0,
    breakEvenPoint: new Date(),
}

export const DEFAULT_MOMENT_METRICS: MomentMetrics = {
    views: DEFAULT_VIEW_METRICS,
    engagement: DEFAULT_ENGAGEMENT_METRICS,
    performance: DEFAULT_PERFORMANCE_METRICS,
    viral: DEFAULT_VIRAL_METRICS,
    audience: DEFAULT_AUDIENCE_METRICS,
    content: DEFAULT_CONTENT_METRICS,
    monetization: DEFAULT_MONETIZATION_METRICS,
    lastMetricsUpdate: new Date(),
    metricsVersion: "1.0.0",
    dataQuality: 100,
    confidenceLevel: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
}

// ===== UTILITÁRIOS DE MÉTRICAS =====
export class MomentMetricsCalculator {
    /**
     * Calcula score de viralidade baseado em múltiplos fatores
     */
    static calculateViralScore(metrics: MomentMetrics): number {
        const { views, engagement, viral } = metrics

        // Fatores de viralidade
        const growthFactor = Math.min(viral.growthRate * 10, 100)
        const engagementFactor = (engagement.likeRate + engagement.commentRate) * 100
        const reachFactor = Math.min(viral.totalReach / 1000, 100)
        const completionFactor = views.averageCompletionRate

        // Peso dos fatores
        const weights = {
            growth: 0.3,
            engagement: 0.25,
            reach: 0.25,
            completion: 0.2,
        }

        return Math.round(
            growthFactor * weights.growth +
                engagementFactor * weights.engagement +
                reachFactor * weights.reach +
                completionFactor * weights.completion,
        )
    }

    /**
     * Calcula score de qualidade do conteúdo
     */
    static calculateContentQualityScore(metrics: MomentMetrics): number {
        const { content, performance } = metrics

        // Fatores de qualidade
        const technicalQuality = (100 - performance.errorRate) * 0.3
        const audioQuality = content.audioQualityScore * 0.25
        const videoQuality = content.videoQualityScore * 0.25
        const engagementQuality =
            (content.hashtagEffectiveness + content.mentionEffectiveness) * 0.2

        return Math.round(technicalQuality + audioQuality + videoQuality + engagementQuality)
    }

    /**
     * Calcula ROI baseado nas métricas de monetização
     */
    static calculateROI(metrics: MomentMetrics): number {
        const { monetization } = metrics

        if (monetization.totalCost === 0) return 0

        const profit = monetization.totalRevenue - monetization.totalCost
        return Math.round((profit / monetization.totalCost) * 100)
    }

    /**
     * Calcula score de engajamento geral
     */
    static calculateEngagementScore(metrics: MomentMetrics): number {
        const { engagement, views } = metrics

        // Fatores de engajamento
        const interactionRate = (engagement.likeRate + engagement.commentRate) * 100
        const completionRate = views.averageCompletionRate
        const retentionRate = 100 - views.bounceRate

        // Peso dos fatores
        const weights = {
            interaction: 0.4,
            completion: 0.3,
            retention: 0.3,
        }

        return Math.round(
            interactionRate * weights.interaction +
                completionRate * weights.completion +
                retentionRate * weights.retention,
        )
    }

    /**
     * Calcula score de tendência
     */
    static calculateTrendingScore(metrics: MomentMetrics): number {
        const { viral, views, engagement } = metrics

        // Fatores de tendência
        const growthRate = Math.min(viral.growthRate * 20, 100)
        const viewVelocity = Math.min(views.totalViews / 100, 100)
        const engagementVelocity = Math.min(engagement.totalLikes / 50, 100)
        const recency = Math.max(
            0,
            100 - (Date.now() - metrics.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        )

        // Peso dos fatores
        const weights = {
            growth: 0.3,
            views: 0.25,
            engagement: 0.25,
            recency: 0.2,
        }

        return Math.round(
            growthRate * weights.growth +
                viewVelocity * weights.views +
                engagementVelocity * weights.engagement +
                recency * weights.recency,
        )
    }
}

// ===== FACTORY PARA MÉTRICAS =====
export class MomentMetricsFactory {
    /**
     * Cria métricas padrão
     */
    static createDefault(): MomentMetrics {
        return { ...DEFAULT_MOMENT_METRICS }
    }

    /**
     * Cria métricas para conteúdo viral
     */
    static createForViralContent(): MomentMetrics {
        const metrics = this.createDefault()
        metrics.viral.viralScore = 85
        metrics.viral.trendingScore = 90
        metrics.viral.growthRate = 15
        return metrics
    }

    /**
     * Cria métricas para conteúdo premium
     */
    static createForPremiumContent(): MomentMetrics {
        const metrics = this.createDefault()
        metrics.content.contentQualityScore = 95
        metrics.performance.errorRate = 0.1
        metrics.monetization.subscriptionConversionRate = 5
        return metrics
    }

    /**
     * Cria métricas customizadas
     */
    static createCustom(overrides: Partial<MomentMetrics>): MomentMetrics {
        return {
            ...DEFAULT_MOMENT_METRICS,
            ...overrides,
            views: {
                ...DEFAULT_VIEW_METRICS,
                ...overrides.views,
            },
            engagement: {
                ...DEFAULT_ENGAGEMENT_METRICS,
                ...overrides.engagement,
            },
            performance: {
                ...DEFAULT_PERFORMANCE_METRICS,
                ...overrides.performance,
            },
            viral: {
                ...DEFAULT_VIRAL_METRICS,
                ...overrides.viral,
            },
            audience: {
                ...DEFAULT_AUDIENCE_METRICS,
                ...overrides.audience,
            },
            content: {
                ...DEFAULT_CONTENT_METRICS,
                ...overrides.content,
            },
            monetization: {
                ...DEFAULT_MONETIZATION_METRICS,
                ...overrides.monetization,
            },
        }
    }
}
