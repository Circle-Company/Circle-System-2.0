/**
 * Tipos e enums para o domínio de Cluster
 */

// ===== ENUMS =====
export enum ClusterStatusEnum {
    ACTIVE = "active",
    INACTIVE = "inactive",
    ARCHIVED = "archived",
}

export enum ClusterQualityEnum {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    EXCELLENT = "excellent",
}

export enum ClusterTypeEnum {
    CONTENT_BASED = "content_based",
    BEHAVIOR_BASED = "behavior_based",
    HYBRID = "hybrid",
    TEMPORAL = "temporal",
}

// ===== MAIN ENTITIES =====
export interface ClusterEntity {
    id: string
    name: string
    description?: string

    // Características do cluster
    centroid: string // Vetor serializado em JSON
    dimension: number
    size: number
    density: number
    coherence: number

    // Metadados
    topics: string[]
    dominantTopics?: string[]
    avgEngagement?: number
    quality: ClusterQualityEnum
    type: ClusterTypeEnum
    status: ClusterStatusEnum

    // Estatísticas
    statistics: ClusterStatistics

    // Configuração
    config?: ClusterConfiguration

    // Timestamps
    createdAt: Date
    updatedAt: Date
    lastRecomputedAt?: Date
}

export interface ClusterProps {
    id?: string
    name?: string
    description?: string
    centroid: number[] | string
    dimension: number
    size?: number
    density?: number
    coherence?: number
    topics?: string[]
    dominantTopics?: string[]
    avgEngagement?: number
    quality?: ClusterQualityEnum
    type?: ClusterTypeEnum
    status?: ClusterStatusEnum
    statistics?: ClusterStatistics
    config?: ClusterConfiguration
    createdAt?: Date
    updatedAt?: Date
    lastRecomputedAt?: Date
}

// ===== SUPPORTING TYPES =====
export interface ClusterStatistics {
    totalMoments: number
    activeMoments: number
    totalInteractions: number
    avgViewsPerMoment: number
    avgLikesPerMoment: number
    avgCommentsPerMoment: number
    avgSharesPerMoment: number
    engagementRate: number
    growthRate: number
    retentionRate: number
    lastCalculatedAt: Date
}

export interface ClusterConfiguration {
    minSize: number
    maxSize: number
    recomputeInterval: number // em horas
    qualityThreshold: number
    autoArchive: boolean
    autoMerge: boolean
    mergeThreshold: number
}

export interface ClusterAssignmentEntity {
    id?: string
    momentId: string
    clusterId: string
    similarity: number
    confidence: number
    assignedAt: Date
    assignedBy?: string // "algorithm" | "manual" | userId
    metadata?: Record<string, any>
}

export interface ClusterMergeResult {
    newCluster: ClusterEntity
    mergedClusterIds: string[]
    momentsReassigned: number
    timestamp: Date
}

export interface ClusterSplitResult {
    newClusters: ClusterEntity[]
    originalClusterId: string
    momentsReassigned: number
    timestamp: Date
}

export interface ClusterAnalysis {
    clusterId: string
    quality: ClusterQualityEnum
    coherenceScore: number
    densityScore: number
    diversityScore: number
    stabilityScore: number
    recommendations: ClusterRecommendation[]
    issues: ClusterIssue[]
    analyzedAt: Date
}

export interface ClusterRecommendation {
    type: "merge" | "split" | "recompute" | "archive"
    reason: string
    confidence: number
    targetClusterIds?: string[]
    metadata?: Record<string, any>
}

export interface ClusterIssue {
    type: "low_coherence" | "low_density" | "oversized" | "undersized" | "stale"
    severity: "low" | "medium" | "high"
    description: string
    suggestedAction?: string
    metadata?: Record<string, any>
}

// ===== RESPONSE TYPES =====
export interface ClusterListResponse {
    clusters: ClusterEntity[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

export interface ClusterAnalyticsResponse {
    totalClusters: number
    activeClusters: number
    averageSize: number
    averageCoherence: number
    averageDensity: number
    qualityDistribution: Record<ClusterQualityEnum, number>
    typeDistribution: Record<ClusterTypeEnum, number>
    trends: {
        daily: Array<{ date: Date; count: number; avgQuality: number }>
        weekly: Array<{ week: string; count: number; avgQuality: number }>
        monthly: Array<{ month: string; count: number; avgQuality: number }>
    }
}
