/**
 * Content Processor Types
 * Tipos e interfaces para processamento de conteúdo de vídeo
 */

export interface VideoProcessingRequest {
    contentId: string
    videoData: Buffer
    videoKey: string
    thumbnailKey: string
    metadata: {
        filename: string
        mimeType: string
        size: number
    }
}

export interface VideoProcessingResult {
    success: boolean
    contentId: string
    thumbnail: {
        data: Buffer
        width: number
        height: number
        format: string
    }
    videoMetadata: {
        duration: number
        width: number
        height: number
        format: string
        codec: string
        hasAudio: boolean
        size: number
        bitrate?: number
        fps?: number
    }
    processedVideo?: {
        data: Buffer
        wasCompressed: boolean
        wasConverted: boolean
        originalResolution?: { width: number; height: number }
        originalFormat?: string
    }
    processingTime: number
    error?: string
}

export interface ThumbnailGenerationOptions {
    width?: number
    height?: number
    quality?: number
    format?: "jpeg" | "png" | "webp"
    timePosition?: number // segundos do vídeo para extrair frame
}

export interface VideoMetadataExtractionResult {
    duration: number
    width: number
    height: number
    format: string
    codec: string
    hasAudio: boolean
    size: number
    bitrate?: number
    fps?: number
}

export interface StorageAdapter {
    uploadVideo(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult>
    uploadThumbnail(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult>
    deleteVideo(key: string): Promise<void>
    deleteThumbnail(key: string): Promise<void>
    getVideoUrl(key: string, quality?: "low" | "medium" | "high"): Promise<string>
    getThumbnailUrl(key: string): Promise<string>
}

export interface StorageUploadResult {
    success: boolean
    key: string
    url: string
    bucket?: string
    region?: string
    provider: "s3" | "gcs" | "azure" | "local" | "mock" | "local-mock"
    error?: string
    metadata?: Record<string, any>
}

export interface VideoCompressionOptions {
    targetResolution: { width: number; height: number }
    targetBitrate?: number
    targetFormat: string
    quality?: number
}

export interface VideoResolution {
    width: number
    height: number
    quality: number
    name: string
}

export interface VideoMetadata {
    duration: number
    width: number
    height: number
    format: string
    codec: string
    hasAudio: boolean
    size: number
    bitrate?: number
    fps?: number
}

export interface ProcessedVideoResult {
    wasProcessed: boolean
    data: Buffer
    wasCompressed: boolean
    wasConverted: boolean
    originalResolution: { width: number; height: number }
    originalFormat: string
}

export interface ContentProcessorConfig {
    thumbnail: ThumbnailGenerationOptions
    validation: {
        maxFileSize: number // bytes
        maxDuration: number // segundos
        minDuration: number // segundos
        allowedFormats: string[]
        minResolution: { width: number; height: number }
        maxResolution: { width: number; height: number }
    }
    processing: {
        timeout: number // ms
        retryAttempts: number
        autoCompress: boolean // Redimensionar vídeos para proporção customizada
        autoConvertToMp4: boolean // Converter todos para MP4
        targetResolutions?: VideoResolution[] // Múltiplas resoluções
        targetResolution?: { width: number; height: number } // Resolução única (compatibilidade)
        maintainQuality?: boolean // Manter máxima qualidade
    }
}
