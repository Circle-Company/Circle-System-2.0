/**
 * SwipeEngine - Sistema de Recomendação de Momentos
 *
 * Sistema completo de recomendações baseado em:
 * - Embeddings de usuários e momentos
 * - Clusterização DBSCAN
 * - Matching de clusters
 * - Ranking multi-fatorial
 *
 * Arquitetura desacoplada com injeção de dependências
 */

export * from "./core/dbscan.clustering"
export * from "./core/recommendation.engine"
export * from "./core/services/candidate.selector"
export * from "./core/services/cluster.matcher"
export * from "./core/services/ranking.service"

// Exportar repositórios (que agora são do domínio)
export type {
    IClusterRepository,
    IInteractionRepository,
    IMomentEmbeddingRepository,
    IUserEmbeddingRepository,
} from "./core/repositories"

// Exportar tipos (exceto os conflitantes)
export type {
    Candidate,
    Cluster,
    ClusteringResult,
    ClusterMatch,
    InteractionSummary,
    InteractionType,
    RankedCandidate,
    RankingOptions,
    Recommendation,
    RecommendationContext,
    RecommendationRequest,
    UserEmbedding,
    UserProfile,
} from "./types"

// Exportar apenas os tipos de parâmetros (sem InteractionType para evitar conflito)
export type {
    ClusterRankingConfig,
    ClusterRankingParams,
    ContentType,
    DayType,
    DBSCANConfig,
    EmbeddingParams,
    FeedRecommendationParams,
    InteractionBoosts,
    InteractionScore,
    RankingParams,
    TemporalDecayConfig,
    TimeOfDay,
    UserType,
    UserTypeConfig,
    UserTypeConfigs,
} from "./types/params.types"

import { RecommendationEngine, RecommendationEngineConfig } from "./core/recommendation.engine"

/**
 * Factory function para criar uma instância do RecommendationEngine
 */
export function createRecommendationEngine(
    config: RecommendationEngineConfig,
): RecommendationEngine {
    return new RecommendationEngine(config)
}
