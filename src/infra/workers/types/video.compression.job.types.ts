/**
 * Video Compression Job Types
 * Tipos para jobs de compressão de vídeo em background
 */

/**
 * Dados do job de compressão de vídeo
 */
export interface VideoCompressionJobData {
    momentId: string
    originalVideoUrl: string
    videoMetadata: {
        width: number
        height: number
        duration: number
        codec: string
        hasAudio: boolean
        size: number
    }
    priority: number
    scheduledFor?: Date
}

/**
 * Resultado do processamento de compressão
 */
export interface VideoCompressionJobResult {
    success: boolean
    momentId: string
    compressedVideoUrl?: string
    originalSize?: number
    compressedSize?: number
    compressionRatio?: number
    processingTime: number
    error?: string
    metadata?: {
        originalCodec: string
        compressedCodec: string
        preset: string
        crf: number
    }
}

/**
 * Status do job de compressão
 */
export enum VideoCompressionJobStatus {
    WAITING = "waiting",
    ACTIVE = "active",
    COMPLETED = "completed",
    FAILED = "failed",
    DELAYED = "delayed",
}

/**
 * Opções de compressão para H.264
 */
export interface VideoCompressionOptions {
    preset:
        | "ultrafast"
        | "superfast"
        | "veryfast"
        | "faster"
        | "fast"
        | "medium"
        | "slow"
        | "slower"
        | "veryslow"
    crf: number
    targetBitrate?: number
    maxBitrate?: number
    bufferSize?: number
    audioBitrate?: number
}
