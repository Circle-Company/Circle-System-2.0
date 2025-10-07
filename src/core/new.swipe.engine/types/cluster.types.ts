/**
 * Tipos relacionados a clusters
 */

export interface Cluster {
    id: string
    name?: string
    centroid: number[]
    size: number
    density: number
    coherence?: number
    topics?: string[]
    metadata?: {
        dominantTopics?: string[]
        avgEngagement?: number
        [key: string]: any
    }
    createdAt: Date
    updatedAt: Date
}

export interface ClusterAssignment {
    momentId: string
    clusterId: string
    similarity: number
    assignedAt: Date
}

export interface ClusteringResult {
    clusters: Cluster[]
    assignments: Record<string, string> // momentId -> clusterId
    quality: number
    iterations: number
    converged: boolean
    metadata?: Record<string, any>
}

export interface ClusterMatch {
    cluster: Cluster
    score: number
    reason: "embedding" | "profile" | "context" | "default"
}
