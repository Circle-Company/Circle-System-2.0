/**
 * Tipos relacionados a embeddings
 */

export interface EmbeddingVector {
    values: number[]
    dimension: number
    createdAt: Date
    updatedAt: Date
}

export interface UserEmbedding {
    userId: string
    vector: number[]
    dimension: number
    metadata?: {
        interests?: string[]
        lastInteractionAt?: Date
        totalInteractions?: number
        [key: string]: any
    }
    createdAt: Date
    updatedAt: Date
}

export interface MomentEmbedding {
    momentId: string
    vector: number[]
    dimension: number
    metadata?: {
        topics?: string[]
        authorId?: string
        contentLength?: number
        engagementScore?: number
        [key: string]: any
    }
    createdAt: Date
    updatedAt: Date
}

export interface EmbeddingGenerationData {
    textContent?: string
    tags?: string[]
    topics?: string[]
    metadata?: Record<string, any>
}
