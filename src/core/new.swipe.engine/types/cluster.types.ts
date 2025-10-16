/**
 * Tipos relacionados a clusters
 * Usa a entidade de domínio diretamente
 */

import { Cluster as DomainCluster } from "@/domain/cluster"

// Re-exporta a entidade de domínio
export type Cluster = DomainCluster

export interface ClusteringResult {
    clusters: DomainCluster[]
    assignments: Record<string, string> // momentId -> clusterId
    quality: number
    iterations: number
    converged: boolean
    metadata?: Record<string, any>
}

export interface ClusterMatch {
    cluster: DomainCluster
    score: number
    reason: "embedding" | "profile" | "context" | "default"
}
