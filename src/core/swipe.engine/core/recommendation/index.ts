/**
 * Exportações do módulo de recomendação
 */

import { Recommendation, RecommendationOptions } from "../../types"

import { ClusterMatcher } from "./cluster.match"
import { RecommendationEngine } from "./rec.engine"

export { ClusterMatcher, Recommendation, RecommendationEngine, RecommendationOptions }

// Função para criação fácil de instâncias de ClusterMatcher
export function createClusterMatcher(
    clusters: any[],
    options?: {
        minMatchThreshold?: number
        contextWeight?: number
        interestWeight?: number
        embeddingWeight?: number
        maxClusters?: number
    },
) {
    return new ClusterMatcher(clusters, options)
}
