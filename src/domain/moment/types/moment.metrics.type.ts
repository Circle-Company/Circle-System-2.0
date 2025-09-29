// ===== METRICS ENUMS =====
export enum MomentMetricsCategoryEnum {
    VIEWS = "views",
    ENGAGEMENT = "engagement",
    PERFORMANCE = "performance",
    VIRAL = "viral",
    AUDIENCE = "audience",
    CONTENT = "content",
    MONETIZATION = "monetization",
}

// Períodos de métricas gerados automaticamente pelo sistema
export enum MomentMetricsPeriodEnum {
    HOURLY = "hourly",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
}

export enum MomentMetricsSourceEnum {
    USER_INTERACTION = "user_interaction",
    SYSTEM_GENERATED = "system_generated",
    EXTERNAL_API = "external_api",
    ANALYTICS = "analytics",
}

// ===== METRICS INTERFACES =====
export interface ViewMetrics {
    totalViews: number
    uniqueViews: number
    viewsByRegion: Record<string, number>
    viewsByDevice: Record<string, number>
    viewsByCountry: Record<string, number>
    viewsByCity: Record<string, number>
    averageWatchTime: number
    completionViews: number
    averageCompletionRate: number
    peakViewTime: Date | null
    lastViewTime: Date | null
}

export interface EngagementMetrics {
    totalLikes: number
    totalComments: number
    totalReports: number
    likeRate: number
    commentRate: number
    reportRate: number
    averageCommentLength: number
    topCommenters: Array<{ userId: string; count: number }>
    engagementScore: number
    lastEngagementTime: Date | null
}

export interface PerformanceMetrics {
    loadTime: number
    bufferTime: number
    errorRate: number
    successRate: number
    averageQuality: number
    qualityDistribution: Record<string, number>
    bandwidthUsage: number
    serverResponseTime: number
    cdnHitRate: number
    lastPerformanceUpdate: Date | null
}

export interface ViralMetrics {
    viralScore: number
    viralReach: number
    reachByPlatform: Record<string, number>
    reachByUserType: Record<string, number>
    viralCoefficient: number
    viralVelocity: number
    peakViralTime: Date | null
    viralDecayRate: number
    lastViralUpdate: Date | null
}

export interface AudienceMetrics {
    demographics: {
        ageGroups: Record<string, number>
        genders: Record<string, number>
        locations: Record<string, number>
        interests: Record<string, number>
    }
    behavior: {
        averageSessionTime: number
        bounceRate: number
        returnRate: number
        engagementDepth: number
        contentPreference: Record<string, number>
    }
    growth: {
        followerGrowth: number
        subscriberGrowth: number
        engagementGrowth: number
        reachGrowth: number
    }
    lastAudienceUpdate: Date | null
}

export interface ContentMetrics {
    qualityScore: number
    contentRating: number
    moderationScore: number
    accessibilityScore: number
    seoScore: number
    contentTags: string[]
    contentCategories: string[]
    contentSentiment: number
    contentComplexity: number
    lastContentUpdate: Date | null
}

export interface MonetizationMetrics {
    totalRevenue: number
    revenueBySource: Record<string, number>
    revenueByPeriod: Record<string, number>
    averageRevenuePerView: number
    averageRevenuePerUser: number
    conversionRate: number
    costPerAcquisition: number
    returnOnInvestment: number
    profitMargin: number
    lastMonetizationUpdate: Date | null
}

// ===== MAIN METRICS INTERFACE =====
export interface MomentMetrics {
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
}

// ===== METRICS CALCULATION TYPES =====
export interface MetricsCalculationResult {
    category: MomentMetricsCategoryEnum
    value: number
    confidence: number
    timestamp: Date
    source: MomentMetricsSourceEnum
    metadata?: Record<string, any>
}

export interface MetricsAggregationResult {
    period: MomentMetricsPeriodEnum
    startDate: Date
    endDate: Date
    metrics: Partial<MomentMetrics>
    totalRecords: number
    averageValues: Partial<MomentMetrics>
    trends: Record<string, number>
}

// ===== METRICS FILTER TYPES =====
export interface MetricsFilter {
    category?: MomentMetricsCategoryEnum
    period?: MomentMetricsPeriodEnum
    source?: MomentMetricsSourceEnum
    startDate?: Date
    endDate?: Date
    minValue?: number
    maxValue?: number
    userId?: string
    region?: string
    device?: string
}

export interface MetricsSortOptions {
    field: string
    direction: "asc" | "desc"
}

export interface MetricsPaginationOptions {
    page: number
    limit: number
    offset?: number
}

// ===== METRICS ANALYTICS TYPES =====
export interface MetricsAnalyticsResponse {
    summary: {
        totalMetrics: number
        averageValues: Partial<MomentMetrics>
        trends: Record<string, number>
        insights: string[]
    }
    breakdown: {
        byCategory: Record<string, number>
        byPeriod: Record<string, number>
        bySource: Record<string, number>
        byRegion: Record<string, number>
        byDevice: Record<string, number>
    }
    recommendations: {
        improvements: string[]
        opportunities: string[]
        warnings: string[]
        actions: string[]
    }
    metadata: {
        generatedAt: Date
        dataQuality: number
        confidenceLevel: number
        lastUpdate: Date
    }
}

// ===== METRICS EVENT TYPES =====
export interface MetricsEvent {
    type:
        | "view"
        | "like"
        | "comment"
        | "report"
        | "completion"
        | "quality_update"
        | "revenue"
        | "cost"
    momentId: string
    userId?: string
    timestamp: Date
    data: Record<string, any>
    source: MomentMetricsSourceEnum
    metadata?: Record<string, any>
}

export interface MetricsEventBatch {
    events: MetricsEvent[]
    batchId: string
    timestamp: Date
    source: MomentMetricsSourceEnum
    metadata?: Record<string, any>
}

// ===== METRICS CONFIGURATION TYPES =====
export interface MetricsConfiguration {
    enabledCategories: MomentMetricsCategoryEnum[]
    collectionInterval: number
    retentionPeriod: number
    aggregationPeriods: MomentMetricsPeriodEnum[]
    qualityThresholds: {
        low: number
        medium: number
        high: number
    }
    alertThresholds: {
        errorRate: number
        performanceDegradation: number
        qualityDrop: number
    }
    exportFormats: string[]
    realTimeEnabled: boolean
    privacySettings: {
        anonymizeData: boolean
        dataRetention: number
        sharingEnabled: boolean
    }
}
