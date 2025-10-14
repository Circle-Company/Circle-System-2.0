/**
 * Embedding Job Types
 * Tipos para jobs de processamento de embeddings
 */

/**
 * Dados do job de embedding
 */
export interface EmbeddingJobData {
    momentId: string
    videoUrl: string
    thumbnailUrl: string
    description: string
    hashtags: string[]
    videoMetadata: {
        width: number
        height: number
        duration: number
        codec: string
        hasAudio: boolean
    }
    priority: number
    scheduledFor?: Date
}

/**
 * Resultado do processamento
 */
export interface EmbeddingJobResult {
    success: boolean
    momentId: string
    embeddingDimension?: number
    processingTime: number
    error?: string
    metadata?: {
        components: string[]
        model: string
    }
}

/**
 * Status do job
 */
export enum EmbeddingJobStatus {
    WAITING = "waiting",
    ACTIVE = "active",
    COMPLETED = "completed",
    FAILED = "failed",
    DELAYED = "delayed",
}

/**
 * Prioridade do job
 */
export enum EmbeddingJobPriority {
    LOW = 1,
    NORMAL = 5,
    HIGH = 10,
    URGENT = 20,
}
