/**
 * Tipos e interfaces para comentários de momentos
 * Implementa sistema de categorização e moderação baseado no domínio de moderação
 */

export enum CommentStatusEnum {
    ACTIVE = "active",
    HIDDEN = "hidden",
    DELETED = "deleted",
    FLAGGED = "flagged",
    UNDER_REVIEW = "under_review",
    APPROVED = "approved",
    REJECTED = "rejected",
}

export enum CommentVisibilityEnum {
    PUBLIC = "public",
    FOLLOWERS_ONLY = "followers_only",
    PRIVATE = "private",
    HIDDEN = "hidden",
}

export enum CommentCategoryEnum {
    // Categorias positivas
    POSITIVE = "positive",
    SUPPORTIVE = "supportive",
    CONSTRUCTIVE = "constructive",
    INFORMATIVE = "informative",
    FUNNY = "funny",
    CREATIVE = "creative",

    // Categorias neutras
    NEUTRAL = "neutral",
    QUESTION = "question",
    CLARIFICATION = "clarification",
    OFF_TOPIC = "off_topic",

    // Categorias negativas
    NEGATIVE = "negative",
    SPAM = "spam",
    HARASSMENT = "harassment",
    HATE_SPEECH = "hate_speech",
    INAPPROPRIATE = "inappropriate",
    MISLEADING = "misleading",
    TROLLING = "trolling",
    ADVERTISING = "advertising",

    // Categorias técnicas
    TECHNICAL_ISSUE = "technical_issue",
    FEATURE_REQUEST = "feature_request",
    BUG_REPORT = "bug_report",
}

export enum CommentModerationFlagEnum {
    // Flags de conteúdo
    SPAM_CONTENT = "spam_content",
    HARASSMENT = "harassment",
    HATE_SPEECH = "hate_speech",
    INAPPROPRIATE_LANGUAGE = "inappropriate_language",
    MISLEADING_INFO = "misleading_info",
    ADVERTISING = "advertising",

    // Flags de qualidade
    LOW_QUALITY = "low_quality",
    IRRELEVANT = "irrelevant",
    REPETITIVE = "repetitive",
    TOO_SHORT = "too_short",
    TOO_LONG = "too_long",

    // Flags de comportamento
    TROLLING = "trolling",
    FLAME_BAIT = "flame_bait",
    PERSONAL_ATTACK = "personal_attack",
    OFF_TOPIC = "off_topic",

    // Flags técnicas
    TECHNICAL_ISSUE = "technical_issue",
    DUPLICATE = "duplicate",
    AUTO_GENERATED = "auto_generated",
}

export enum CommentSeverityEnum {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
}

export enum CommentSentimentEnum {
    VERY_POSITIVE = "very_positive",
    POSITIVE = "positive",
    NEUTRAL = "neutral",
    NEGATIVE = "negative",
    VERY_NEGATIVE = "very_negative",
}

// ===== INTERFACES PRINCIPAIS =====

export interface CommentEntity {
    id: string
    momentId: string
    authorId: string
    parentCommentId?: string
    content: string
    status: CommentStatusEnum
    visibility: CommentVisibilityEnum
    category: CommentCategoryEnum
    sentiment: CommentSentimentEnum

    // Métricas
    likesCount: number
    repliesCount: number
    reportsCount: number
    viewsCount: number

    // Moderação
    moderationFlags: CommentModerationFlag[]
    severity: CommentSeverityEnum
    moderationScore: number
    isModerated: boolean
    moderatedAt: Date | null
    moderatedBy: string | null

    // Metadados
    mentions: string[]
    hashtags: string[]
    metadata: Record<string, any>

    // Timestamps
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export interface CommentProps {
    id?: string
    momentId: string
    authorId: string
    parentCommentId?: string
    content: string
    status?: CommentStatusEnum
    visibility?: CommentVisibilityEnum
    category?: CommentCategoryEnum
    sentiment?: CommentSentimentEnum

    // Métricas
    likesCount?: number
    repliesCount?: number
    reportsCount?: number
    viewsCount?: number

    // Moderação
    moderationFlags?: CommentModerationFlag[]
    severity?: CommentSeverityEnum
    moderationScore?: number
    isModerated?: boolean
    moderatedAt?: Date | null
    moderatedBy?: string | null

    // Metadados
    mentions?: string[]
    hashtags?: string[]
    metadata?: Record<string, any>

    // Timestamps
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date | null
}

// ===== INTERFACES DE SUPORTE =====

export interface CommentModerationFlag {
    type: CommentModerationFlagEnum
    severity: CommentSeverityEnum
    confidence: number // 0-100
    description: string
    detectedAt: Date
    metadata: Record<string, any>
}

export interface CommentMetrics {
    totalLikes: number
    totalReplies: number
    totalReports: number
    totalViews: number
    engagementRate: number
    sentimentScore: number
    qualityScore: number
    lastActivity: Date
}

export interface CommentAnalytics {
    sentimentDistribution: Record<CommentSentimentEnum, number>
    categoryDistribution: Record<CommentCategoryEnum, number>
    moderationStats: {
        totalFlagged: number
        totalApproved: number
        totalRejected: number
        averageModerationTime: number
    }
    engagementStats: {
        averageLikes: number
        averageReplies: number
        topCommenters: Array<{ userId: string; count: number }>
    }
    timeDistribution: {
        commentsPerHour: Record<number, number>
        commentsPerDay: Record<number, number>
        peakActivityTime: Date
    }
}

// ===== FILTROS E OPÇÕES =====

export interface CommentFilters {
    momentId?: string
    authorId?: string
    parentCommentId?: string
    status?: CommentStatusEnum[]
    visibility?: CommentVisibilityEnum[]
    category?: CommentCategoryEnum[]
    sentiment?: CommentSentimentEnum[]
    severity?: CommentSeverityEnum[]
    isModerated?: boolean
    hasFlags?: boolean

    // Filtros de conteúdo
    contentContains?: string
    minLength?: number
    maxLength?: number

    // Filtros de métricas
    minLikes?: number
    maxLikes?: number
    minReplies?: number
    maxReplies?: number

    // Filtros temporais
    createdAfter?: Date
    createdBefore?: Date
    moderatedAfter?: Date
    moderatedBefore?: Date
}

export interface CommentSortOptions {
    field:
        | "createdAt"
        | "updatedAt"
        | "likesCount"
        | "repliesCount"
        | "moderationScore"
        | "sentiment"
    direction: "ASC" | "DESC"
}

export interface CommentPaginationOptions {
    page: number
    limit: number
    sort?: CommentSortOptions
}

export interface CommentSearchOptions {
    query: string
    fields?: ("content" | "authorId" | "mentions" | "hashtags")[]
    limit?: number
    offset?: number
    filters?: CommentFilters
}

// ===== RESPOSTAS DE API =====

export interface CommentListResponse {
    comments: CommentEntity[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
        nextCursor?: string
        prevCursor?: string
    }
    analytics?: CommentAnalytics
}

export interface CommentCreateRequest {
    momentId: string
    authorId: string
    parentCommentId?: string
    content: string
    visibility?: CommentVisibilityEnum
    metadata?: Record<string, any>
}

export interface CommentUpdateRequest {
    content?: string
    visibility?: CommentVisibilityEnum
    metadata?: Record<string, any>
}

export interface CommentModerationRequest {
    action: "approve" | "reject" | "flag" | "hide"
    reason?: string
    flags?: CommentModerationFlagEnum[]
    severity?: CommentSeverityEnum
    moderatedBy: string
}

// ===== REGRAS DE NEGÓCIO =====

export interface CommentBusinessRules {
    // Limites de conteúdo
    content: {
        minLength: number
        maxLength: number
        allowedCharacters: string
        forbiddenWords: string[]
        maxMentions: number
        maxHashtags: number
    }

    // Limites de comportamento
    behavior: {
        maxCommentsPerUserPerHour: number
        maxCommentsPerMoment: number
        maxRepliesPerComment: number
        cooldownBetweenComments: number // segundos
    }

    // Regras de moderação
    moderation: {
        autoModerationEnabled: boolean
        requireModeration: boolean
        autoApproveThreshold: number
        autoRejectThreshold: number
        moderationTimeout: number // horas
    }

    // Regras de visibilidade
    visibility: {
        defaultVisibility: CommentVisibilityEnum
        allowPrivateComments: boolean
        allowFollowersOnlyComments: boolean
        autoHideSpamComments: boolean
    }
}

// ===== CONFIGURAÇÕES DE MODERAÇÃO =====

export interface CommentModerationConfig {
    // Limiares de detecção
    thresholds: {
        spamThreshold: number
        harassmentThreshold: number
        hateSpeechThreshold: number
        inappropriateThreshold: number
        qualityThreshold: number
    }

    // Pesos para análise
    weights: {
        sentimentWeight: number
        contentQualityWeight: number
        userBehaviorWeight: number
        contextWeight: number
    }

    // Configurações de ação
    actions: {
        autoHideSpam: boolean
        autoFlagHarassment: boolean
        requireApprovalForNegative: boolean
        notifyOnFlag: boolean
    }
}
