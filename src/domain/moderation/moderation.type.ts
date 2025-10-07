// ===== ENUMS =====
export enum ModerationStatusEnum {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    FLAGGED = "flagged",
}

export enum ContentTypeEnum {
    AI_GENERATED = "ai_generated",
    HUMAN = "human",
    MEME = "meme",
    SPAM = "spam",
    BOT = "bot",
    UNKNOWN = "unknown",
}

export enum ModerationFlagEnum {
    LOW_QUALITY_CONTENT = "low_quality_content",
    BOT_CONTENT = "bot_content",
    LOW_QUALITY_VIDEO = "low_quality_video",
    LOW_QUALITY_AUDIO = "low_quality_audio",
    NO_AUDIO = "no_audio",
    STATIC_CONTENT = "static_content",
    SPAM_CONTENT = "spam_content",
    EXCESSIVE_HASHTAGS = "excessive_hashtags",
    EXCESSIVE_MENTIONS = "excessive_mentions",
    EXCESSIVE_URLS = "excessive_urls",
    TEXT_ONLY = "text_only",
    REPETITIVE_CONTENT = "repetitive_content",
    SUSPICIOUS_PATTERNS = "suspicious_patterns",

    // Novas flags para análise de texto
    EXCESSIVE_TEXT = "excessive_text",
    REPETITIVE_TEXT = "repetitive_text",
    EXCESSIVE_SPECIAL_CHARS = "excessive_special_chars",

    // Novas flags para análise de hashtags
    LONG_HASHTAGS = "long_hashtags",
    DUPLICATE_HASHTAGS = "duplicate_hashtags",
    SPAM_HASHTAGS = "spam_hashtags",
    IRRELEVANT_HASHTAGS = "irrelevant_hashtags",

    // Flags para detecção de IA e conteúdo
    AI_CONTENT = "ai_content",
    MEME_CONTENT = "meme_content",
    NO_FACE_DETECTED = "no_face_detected",
}

export enum ModerationSeverityEnum {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
}

// ===== MAIN ENTITIES =====
export interface ModerationEntity {
    id: string
    contentId: string
    contentOwnerId: string

    // Detecção de conteúdo
    detectedContentType: ContentTypeEnum
    confidence: number // 0-100
    isHumanContent: boolean

    // Status e controle
    status: ModerationStatusEnum
    isBlocked: boolean
    isHidden: boolean

    // Flags detectadas
    flags: ModerationFlag[]
    severity: ModerationSeverityEnum

    // Metadados de detecção
    processingTime: number

    // Timestamps
    createdAt: Date
    updatedAt: Date
    moderatedAt: Date | null
}

export interface ModerationProps {
    id?: string
    contentId: string
    contentOwnerId: string
    detectedContentType?: ContentTypeEnum
    confidence?: number
    isHumanContent?: boolean
    status?: ModerationStatusEnum
    isBlocked?: boolean
    isHidden?: boolean
    flags?: ModerationFlag[]
    severity?: ModerationSeverityEnum
    processingTime?: number
    createdAt?: Date
    updatedAt?: Date
    moderatedAt?: Date | null
}

// ===== SUPPORTING TYPES =====
export interface ModerationFlag {
    type: ModerationFlagEnum
    severity: ModerationSeverityEnum
    confidence: number // 0-100
    description: string
    detectedAt: Date
    metadata: Record<string, any>
}

export interface ContentDetectionResult {
    contentType: ContentTypeEnum
    confidence: number
    isHumanContent: boolean
    flags: ModerationFlag[]
    model: string
    version: string
    processingTime: number
    reasoning: string
    detectedAt: Date
}

// ===== UTILITY TYPES =====
// Filtros movidos para moderation.filters.ts

// ===== RESPONSE TYPES =====
export interface ModerationListResponse {
    moderations: ModerationEntity[]
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
}

export interface ModerationAnalyticsResponse {
    totalModerations: number
    contentTypeDistribution: Record<ContentTypeEnum, number>
    humanVsNonHumanRatio: number
    averageConfidence: number
    averageProcessingTime: number
    flagDistribution: Record<ModerationFlagEnum, number>
    trends: {
        daily: Array<{ date: Date; human: number; nonHuman: number }>
        weekly: Array<{ week: string; human: number; nonHuman: number }>
        monthly: Array<{ month: string; human: number; nonHuman: number }>
    }
}

// ===== VALIDATION TYPES =====
// Regras de validação movidas para moderation.filters.ts
