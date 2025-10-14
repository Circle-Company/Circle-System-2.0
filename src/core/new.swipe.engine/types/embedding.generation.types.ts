/**
 * Tipos para Geração de Embeddings
 * Define interfaces para serviços de embedding desacoplados
 */

/**
 * Interface genérica para geradores de embedding
 */
export interface IEmbeddingGenerator<TInput, TOutput> {
    generate(input: TInput): Promise<TOutput>
    isAvailable(): boolean
    getConfig(): any
}

/**
 * Resultado de transcrição de áudio
 */
export interface TranscriptionResult {
    success: boolean
    text: string
    language?: string
    confidence?: number
    segments?: Array<{
        text: string
        start: number
        end: number
    }>
    processingTime: number
    error?: string
}

/**
 * Resultado de embedding visual
 */
export interface VisualEmbeddingResult {
    success: boolean
    embedding: number[]
    framesProcessed: number
    processingTime: number
    error?: string
}

/**
 * Resultado de embedding de texto
 */
export interface TextEmbeddingResult {
    success: boolean
    embedding: number[]
    tokenCount: number
    processingTime: number
    error?: string
}

/**
 * Interface para serviço de transcrição (Whisper)
 */
export interface ITranscriptionService extends IEmbeddingGenerator<Buffer, TranscriptionResult> {
    transcribe(audioData: Buffer): Promise<TranscriptionResult>
}

/**
 * Interface para serviço de embedding visual (CLIP)
 */
export interface IVisualEmbeddingService
    extends IEmbeddingGenerator<Buffer[], VisualEmbeddingResult> {
    generateEmbedding(frames: Buffer[]): Promise<VisualEmbeddingResult>
}

/**
 * Interface para serviço de embedding de texto
 */
export interface ITextEmbeddingService extends IEmbeddingGenerator<string, TextEmbeddingResult> {
    generateEmbedding(text: string): Promise<TextEmbeddingResult>
}

/**
 * Content Embedding (fixo)
 */
export interface ContentEmbedding {
    vector: number[]
    dimension: number
    metadata: {
        model: string
        generatedAt: Date
        components: {
            transcription?: any
            visual?: any
            text?: any
        }
        combinedFrom?: {
            components: number
            weights: Record<string, number>
        }
        fallback?: boolean
    }
}

/**
 * Engagement Vector (mutável)
 */
export interface EngagementVector {
    vector: number[]
    dimension: number
    metrics: EngagementMetrics
    features: EngagementFeatures
    metadata: {
        lastUpdated: Date
        version: string
        calculationMethod: string
    }
}

/**
 * Métricas de engajamento brutas
 */
export interface EngagementMetrics {
    views: number
    uniqueViews: number
    likes: number
    comments: number
    shares: number
    saves: number
    avgWatchTime: number
    completionRate: number
    reports: number
}

/**
 * Features de engajamento normalizadas [0, 1]
 */
export interface EngagementFeatures {
    likeRate: number
    commentRate: number
    shareRate: number
    saveRate: number
    retentionRate: number
    avgCompletionRate: number
    reportRate: number
    viralityScore: number
    qualityScore: number
}

