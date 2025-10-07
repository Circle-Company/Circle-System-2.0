import {
    ContentTypeEnum,
    ModerationEntity,
    ModerationFlagEnum,
    ModerationSeverityEnum,
} from "../../domain/moderation/moderation.type"

// ===== INTERFACES DE DETECÇÃO =====
export interface ContentDetectionRequest {
    contentId: string
    contentOwnerId: string
    contentUrl?: string
    contentData?: Buffer
    metadata?: Record<string, any>
}

export interface ContentDetectionResult {
    contentType: ContentTypeEnum
    confidence: number
    isHumanContent: boolean
    flags: ModerationFlag[]
    processingTime: number
    reasoning: string
    detectedAt: Date
}

export interface ModerationFlag {
    type: ModerationFlagEnum
    severity: ModerationSeverityEnum
    confidence: number
    description: string
    detectedAt: Date
    metadata: Record<string, any>
}

// ===== INTERFACES DE BLOQUEIO =====
export interface ContentBlockingRequest {
    moderationId: string
    reason: string
    severity: ModerationSeverityEnum
    blockType: BlockType
    metadata?: Record<string, any>
}

export interface ContentBlockingResult {
    success: boolean
    moderationId: string
    blockType: BlockType
    appliedAt: Date
    reason: string
    metadata?: Record<string, any>
}

export enum BlockType {
    HARD_BLOCK = "hard_block", // Bloqueio permanente
    SOFT_BLOCK = "soft_block", // Bloqueio temporário
    HIDE = "hide", // Ocultar conteúdo
    FLAG = "flag", // Marcar para revisão
    WARN = "warn", // Apenas aviso
}

// ===== INTERFACES DE ADAPTERS =====
export interface HttpAdapter {
    get(url: string): Promise<Buffer>
    post(url: string, data: any): Promise<any>
    put(url: string, data: any): Promise<any>
    delete(url: string): Promise<any>
}

export interface ModerationRepository {
    save(moderation: ModerationEntity): Promise<ModerationEntity>
    findById(id: string): Promise<ModerationEntity | null>
    findByContentId(contentId: string): Promise<ModerationEntity | null>
    update(id: string, updates: Partial<ModerationEntity>): Promise<ModerationEntity>
    delete(id: string): Promise<void>
}

export interface ContentStorage {
    store(contentId: string, data: Buffer): Promise<string>
    retrieve(contentId: string): Promise<Buffer | null>
    delete(contentId: string): Promise<void>
}
// ===== CONFIGURAÇÕES =====
export interface ModerationEngineConfig {
    detection: {
        qualityDetection: {
            enabled: boolean
            minVideoQuality: number
            minAudioQuality: number
        }
        textAnalysis: {
            enabled: boolean
            maxTextLength: number
            repetitiveTextThreshold: number
            specialCharRatioThreshold: number
            textOnlyDurationThreshold: number
        }
        hashtagAnalysis: {
            enabled: boolean
            maxHashtagCount: number
            maxHashtagLength: number
            spamKeywords: string[]
            relevanceThreshold: number
        }
    }
    blocking: {
        autoBlock: boolean
        autoHide: boolean
        autoFlag: boolean
        severityThresholds: {
            low: number
            medium: number
            high: number
        }
    }
    performance: {
        maxProcessingTime: number
        timeout: number
        retryAttempts: number
    }
}

// ===== EVENTOS =====
export interface ModerationEvent {
    type: ModerationEventType
    moderationId: string
    contentId: string
    timestamp: Date
    data: Record<string, any>
}

export enum ModerationEventType {
    CONTENT_DETECTED = "content_detected",
    CONTENT_BLOCKED = "content_blocked",
    CONTENT_APPROVED = "content_approved",
    CONTENT_FLAGGED = "content_flagged",
    MODERATION_FAILED = "moderation_failed",
}

// ===== RESULTADOS FINAIS =====
export interface ModerationResult {
    success: boolean
    moderation: ModerationEntity
    detectionResult?: ContentDetectionResult
    blockingResult?: ContentBlockingResult
    processingTime: number
    errors?: string[]
}
