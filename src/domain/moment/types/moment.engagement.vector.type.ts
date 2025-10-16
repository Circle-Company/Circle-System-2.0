/**
 * Engagement Vector Types
 * Define tipos para o vetor de engajamento (atualizável)
 */

/**
 * Vetor de Engajamento (mutável)
 * Atualizado periodicamente com métricas de engajamento normalizadas
 */
export interface MomentEngagementVector {
    /** Vetor de features normalizadas */
    vector: number[]

    /** Dimensão do vetor */
    dimension: number

    /** Métricas brutas usadas para calcular o vetor */
    metrics: EngagementMetrics

    /** Features normalizadas */
    features: EngagementFeatures

    /** Metadados da última atualização */
    metadata: {
        lastUpdated: Date
        version: string
        calculationMethod: string
    }
}

/**
 * Métricas de Engajamento Brutas
 */
export interface EngagementMetrics {
    /** Total de visualizações */
    views: number

    /** Visualizações únicas */
    uniqueViews: number

    /** Total de curtidas */
    likes: number

    /** Total de comentários */
    comments: number

    /** Total de compartilhamentos */
    shares: number

    /** Total de salvamentos */
    saves: number

    /** Tempo médio de visualização (segundos) */
    avgWatchTime: number

    /** Taxa de conclusão (0-1) */
    completionRate: number

    /** Total de reports */
    reports: number
}

/**
 * Features Normalizadas de Engajamento
 * Valores normalizados para [0, 1]
 */
export interface EngagementFeatures {
    /** Taxa de curtidas: likes / max(views, 1) */
    likeRate: number

    /** Taxa de comentários: comments / max(views, 1) */
    commentRate: number

    /** Taxa de compartilhamento: shares / max(views, 1) */
    shareRate: number

    /** Taxa de salvamento: saves / max(views, 1) */
    saveRate: number

    /** Taxa de retenção: avgWatchTime / (views * duration) */
    retentionRate: number

    /** Taxa de conclusão: média de completionRate */
    avgCompletionRate: number

    /** Taxa de report: reports / max(views, 1) */
    reportRate: number

    /** Score de viralidade: combinação de shares + saves */
    viralityScore: number

    /** Score de qualidade: combinação de retention + completion - reports */
    qualityScore: number
}

/**
 * Parâmetros para calcular engagement vector
 */
export interface CalculateEngagementVectorParams {
    momentId: string
    metrics: EngagementMetrics
    duration: number // duração do vídeo em segundos
    createdAt: Date
}

/**
 * Resultado do cálculo do engagement vector
 */
export interface CalculateEngagementVectorResult {
    success: boolean
    vector?: MomentEngagementVector
    error?: string
}

/**
 * Content Embedding (fixo)
 * Gerado uma vez na criação do moment, representa o conteúdo
 */
export interface ContentEmbedding {
    /** Vetor de embedding do conteúdo */
    vector: number[]

    /** Dimensão do vetor */
    dimension: number

    /** Metadados da geração */
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
