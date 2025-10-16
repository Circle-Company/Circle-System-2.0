// ===== ENUMS =====
export enum MomentStatusEnum {
    PUBLISHED = "published",
    ARCHIVED = "archived",
    DELETED = "deleted",
    BLOCKED = "blocked",
    UNDER_REVIEW = "under_review",
}

export enum MomentVisibilityEnum {
    PUBLIC = "public",
    FOLLOWERS_ONLY = "followers_only",
    PRIVATE = "private",
    UNLISTED = "unlisted",
}

export enum MomentContentTypeEnum {
    VIDEO = "video",
}

export enum MomentProcessingStatusEnum {
    PENDING = "pending",
    PROCESSING = "processing",
    UPLOADED = "uploaded",
    MEDIA_PROCESSED = "media_processed",
    EMBEDDINGS_QUEUED = "embeddings_queued",
    EMBEDDINGS_PROCESSED = "embeddings_processed",
    COMPLETED = "completed",
    FAILED = "failed",
}

export enum MomentQualityEnum {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
}

export enum MomentStorageProviderEnum {
    AWS = "aws",
}

export enum MomentCodecEnum {
    H264 = "h264",
    H265 = "h265",
    VP9 = "vp9",
}

export enum MomentFormatEnum {
    MP4 = "mp4",
}

// ===== MAIN ENTITIES =====
export interface MomentEntity {
    id: string
    ownerId: string
    content: MomentContent
    description: string
    hashtags: string[]
    mentions: string[]
    media: MomentMedia
    thumbnail: MomentThumbnail
    status: MomentStatus
    visibility: MomentVisibility
    metrics: MomentMetrics
    context: MomentContext
    processing: MomentProcessing
    embedding: MomentEmbedding
    createdAt: Date
    updatedAt: Date
    publishedAt: Date | null
    archivedAt: Date | null
    deletedAt: Date | null
}

export interface MomentProps {
    id?: string
    ownerId: string
    content: MomentContent
    description?: string
    hashtags?: string[]
    mentions?: string[]
    media?: MomentMedia
    thumbnail?: MomentThumbnail
    status?: MomentStatus
    visibility?: MomentVisibility
    metrics?: MomentMetrics
    location?: MomentLocation | null
    context?: MomentContext
    processing?: MomentProcessing
    embedding?: MomentEmbedding
    createdAt?: Date
    updatedAt?: Date
    publishedAt?: Date | null
    archivedAt?: Date | null
    deletedAt?: Date | null
}

// ===== CONTENT TYPES =====
export interface MomentContent {
    duration: number // em segundos (máximo 30)
    size: number // em bytes
    format: MomentFormatEnum
    resolution: MomentResolution
    hasAudio: boolean
    codec: MomentCodecEnum
    createdAt: Date
    updatedAt: Date
}

export interface MomentResolution {
    width: number
    height: number
    quality: MomentQualityEnum
}

// ===== MEDIA TYPES =====
export interface MomentMedia {
    url: string
    storage: MomentStorage
    createdAt: Date
    updatedAt: Date
}

export interface MomentStorage {
    provider: MomentStorageProviderEnum
    bucket: string
    key: string
    region: string
}

export interface MomentThumbnail {
    url: string
    width: number
    height: number
    storage: MomentStorage
    createdAt: Date
    updatedAt: Date
}

// ===== STATUS & VISIBILITY =====
export interface MomentStatus {
    current: MomentStatusEnum
    previous: MomentStatusEnum | null
    reason: string | null
    changedBy: string | null // user ID ou system
    changedAt: Date
    createdAt: Date
    updatedAt: Date
}

export interface MomentVisibility {
    level: MomentVisibilityEnum
    allowedUsers: string[] // IDs de usuários específicos (para privado)
    blockedUsers: string[] // IDs de usuários bloqueados
    ageRestriction: boolean
    contentWarning: boolean
    createdAt: Date
    updatedAt: Date
}

// ===== LOCATION & CONTEXT =====
export interface MomentLocation {
    latitude: number
    longitude: number
}

export interface MomentContext {
    device: MomentDevice
    location: MomentLocation
}

export interface MomentDevice {
    type: string // mobile, tablet, desktop
    os: string
    osVersion: string
    model: string
    screenResolution: string
    orientation: string
}

// ===== PROCESSING =====
export interface MomentProcessing {
    status: MomentProcessingStatusEnum
    progress: number // 0-100
    steps: MomentProcessingStep[]
    error: string | null
    startedAt: Date | null
    completedAt: Date | null
    estimatedCompletion: Date | null
}

export interface MomentProcessingStep {
    name: string
    status: MomentProcessingStatusEnum
    progress: number
    startedAt: Date | null
    completedAt: Date | null
    error: string | null
}

// ===== EMBEDDING =====
export interface MomentEmbedding {
    vector: string
    dimension: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

// ===== TIPOS PARA VISUALIZAÇÃO =====
export interface ViewabilityResult {
    allowed: boolean
    reason: string
    message: string
    metadata?: any
    timestamp: Date
    momentId: string
}

// ===== IMPORT METRICS =====
// Importar métricas robustas do arquivo separado
import { MomentMetrics } from "./moment.metrics.type"
export { MomentMetrics }
