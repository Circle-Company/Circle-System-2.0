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
    model: string
    version: string
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

// ===== INTERFACES DE MODELOS =====
export interface FaceDetectionModel {
    detectFaces(imageData: Buffer): Promise<FaceDetectionResult>
    detectFaceQuality(imageData: Buffer): Promise<FaceQualityResult>
}

export interface AIDetectionModel {
    detectAI(contentData: Buffer): Promise<AIDetectionResult>
    detectDeepfake(videoData: Buffer): Promise<DeepfakeDetectionResult>
}

export interface QualityDetectionModel {
    detectVideoQuality(videoData: Buffer): Promise<VideoQualityResult>
    detectAudioQuality(audioData: Buffer): Promise<AudioQualityResult>
}

export interface SpamDetectionModel {
    detectSpam(contentData: Buffer, metadata?: Record<string, any>): Promise<SpamDetectionResult>
    detectMeme(contentData: Buffer): Promise<MemeDetectionResult>
}

// ===== RESULTADOS DE DETECÇÃO =====
export interface FaceDetectionResult {
    facesDetected: number
    faceQuality: "good" | "poor" | "none"
    confidence: number
    boundingBoxes?: Array<{
        x: number
        y: number
        width: number
        height: number
    }>
}

export interface FaceQualityResult {
    quality: "good" | "poor" | "none"
    confidence: number
    issues: string[]
}

export interface AIDetectionResult {
    isAIGenerated: boolean
    confidence: number
    model?: string
    reasoning: string
}

export interface DeepfakeDetectionResult {
    isDeepfake: boolean
    confidence: number
    model?: string
    reasoning: string
}

export interface VideoQualityResult {
    quality: "good" | "poor" | "very_poor"
    confidence: number
    issues: string[]
    resolution?: { width: number; height: number }
    bitrate?: number
}

export interface AudioQualityResult {
    quality: "good" | "poor" | "none"
    confidence: number
    issues: string[]
    hasAudio: boolean
    sampleRate?: number
}

export interface SpamDetectionResult {
    isSpam: boolean
    confidence: number
    spamType?: string
    reasoning: string
}

export interface MemeDetectionResult {
    isMeme: boolean
    confidence: number
    memeType?: string
    reasoning: string
}

// ===== CONFIGURAÇÕES =====
export interface ModerationEngineConfig {
    detection: {
        faceDetection: {
            enabled: boolean
            minConfidence: number
            model: string
        }
        aiDetection: {
            enabled: boolean
            minConfidence: number
            model: string
        }
        qualityDetection: {
            enabled: boolean
            minVideoQuality: number
            minAudioQuality: number
        }
        spamDetection: {
            enabled: boolean
            minConfidence: number
            model: string
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

export interface BatchModerationResult {
    success: boolean
    total: number
    processed: number
    failed: number
    results: ModerationResult[]
    processingTime: number
}
