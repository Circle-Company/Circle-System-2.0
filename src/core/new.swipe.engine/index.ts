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

export * from "./algorithms/dbscan.clustering"
export * from "./params.type"
export * from "./recommendation.engine"
export * from "./repositories"
export * from "./services/candidate.selector"
export * from "./services/cluster.matcher"
export * from "./services/moment.embedding.service"
export * from "./services/ranking.service"
export * from "./services/user.embedding.service"
export * from "./types"

import { RecommendationEngine, RecommendationEngineConfig } from "./recommendation.engine"

/**
 * Factory function para criar uma instância do RecommendationEngine
 */
export function createRecommendationEngine(
    config: RecommendationEngineConfig,
): RecommendationEngine {
    return new RecommendationEngine(config)
}

/**
 * Tipo auxiliar para requisição de recomendação
 */
export type { Recommendation, RecommendationRequest } from "./types"

/**
 * Exemplo de uso:
 *
 * ```typescript
 * import { createRecommendationEngine } from './core/new.swipe.engine'
 *
 * const engine = createRecommendationEngine({
 *   repositories: {
 *     userEmbedding: new UserEmbeddingRepository(),
 *     momentEmbedding: new MomentEmbeddingRepository(),
 *     cluster: new ClusterRepository(),
 *     interaction: new InteractionRepository(),
 *   },
 *   params: {
 *     embedding: EmbeddingParams,
 *     ranking: RankingParams,
 *     clusterRanking: ClusterRankingParams,
 *     dbscan: DBSCANConfig,
 *   }
 * })
 *
 * const recommendations = await engine.getRecommendations({
 *   userId: '123',
 *   limit: 20,
 *   context: {
 *     timeOfDay: 18,
 *     dayOfWeek: 5
 *   }
 * })
 * ```
 */
