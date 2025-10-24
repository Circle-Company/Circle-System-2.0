import { Cluster, Recommendation, RecommendationRequest, UserProfile } from "../types"
import {
    ClusterRankingParams,
    DBSCANConfig,
    EmbeddingParams,
    RankingParams,
} from "../types/params.types"
import {
    IClusterRepository,
    IInteractionRepository,
    IMomentEmbeddingRepository,
    IUserEmbeddingRepository,
} from "./repositories"

import { DBSCANClustering } from "./dbscan.clustering"
import { CandidateSelector } from "./services/candidate.selector"
import { ClusterMatcher } from "./services/cluster.matcher"
import { RankingService } from "./services/ranking.service"

export interface RecommendationEngineConfig {
    repositories: {
        userEmbedding: IUserEmbeddingRepository
        momentEmbedding: IMomentEmbeddingRepository
        cluster: IClusterRepository
        interaction: IInteractionRepository
    }
    params: {
        embedding: EmbeddingParams
        ranking: RankingParams
        clusterRanking: ClusterRankingParams
        dbscan: DBSCANConfig
    }
}

/**
 * Engine principal de recomendações baseado em clustering e embeddings
 * Os embeddings são gerenciados diretamente pelas entidades de domínio (User e Moment)
 */
export class RecommendationEngine {
    private readonly clusterMatcher: ClusterMatcher
    private readonly candidateSelector: CandidateSelector
    private readonly rankingService: RankingService
    private readonly clusteringAlgorithm: DBSCANClustering

    constructor(private readonly config: RecommendationEngineConfig) {
        // Inicializar serviços com injeção de dependências
        this.clusterMatcher = new ClusterMatcher()

        this.candidateSelector = new CandidateSelector(
            config.repositories.cluster,
            config.repositories.interaction,
        )

        this.rankingService = new RankingService(
            config.repositories.momentEmbedding,
            config.repositories.interaction,
            config.params.ranking,
        )

        this.clusteringAlgorithm = new DBSCANClustering(config.params.dbscan)
    }

    /**
     * Gera recomendações para um usuário
     */
    async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
        const { userId, limit = 20, excludeMomentIds = [], context } = request

        try {
            // 1. Buscar embedding do usuário diretamente do repositório (formato domínio)
            const domainUserEmbedding = await this.config.repositories.userEmbedding.findByUserId(
                userId,
            )

            // Converter para formato interno do swipe engine
            const userEmbedding = domainUserEmbedding
                ? {
                      userId,
                      vector:
                          typeof domainUserEmbedding.vector === "string"
                              ? JSON.parse(domainUserEmbedding.vector)
                              : domainUserEmbedding.vector,
                      dimension: domainUserEmbedding.dimension,
                      metadata: domainUserEmbedding.metadata,
                      createdAt: domainUserEmbedding.createdAt,
                      updatedAt: domainUserEmbedding.updatedAt,
                  }
                : null

            // 2. Buscar perfil do usuário (interesses e histórico)
            const userProfile = await this.buildUserProfile(userId)

            // 3. Buscar ou gerar clusters
            const clusters = await this.getClusters()

            if (clusters.length === 0) {
                return []
            }

            // 4. Encontrar clusters relevantes para o usuário
            const relevantClusters = this.clusterMatcher.findRelevantClusters(
                clusters,
                userEmbedding,
                userProfile,
                context,
            )

            if (relevantClusters.length === 0) {
                return []
            }

            // 5. Selecionar candidatos dos clusters
            const candidates = await this.candidateSelector.selectCandidates(relevantClusters, {
                userId,
                limit: limit * 3, // Buscar mais candidatos para ter opções
            })

            if (candidates.length === 0) {
                return []
            }

            // 6. Ranquear candidatos
            const rankedCandidates = await this.rankingService.rankCandidates(
                candidates,
                userEmbedding,
                {
                    context,
                    weights: this.config.params.ranking.weights,
                    diversityLevel: this.config.params.ranking.diversityLevel,
                },
            )

            // 7. Filtrar momentos excluídos e limitar
            const excludeSet = new Set(excludeMomentIds)
            const filtered = rankedCandidates.filter((c) => !excludeSet.has(c.momentId))

            // 8. Converter para formato de recomendação
            return filtered.slice(0, limit).map((candidate) => ({
                momentId: candidate.momentId,
                score: candidate.finalScore,
                reason: this.generateReason(candidate),
                cluster: {
                    id: candidate.clusterId,
                },
                metadata: {
                    relevanceScore: candidate.scores.relevance,
                    noveltyScore: candidate.scores.novelty,
                    diversityScore: candidate.scores.diversity,
                    ...candidate.metadata,
                },
            }))
        } catch (error) {
            console.error("Error generating recommendations:", error)
            return []
        }
    }

    /**
     * Re-clusteriza todos os momentos
     */
    async reclusterMoments(): Promise<void> {
        try {
            // Buscar todos os embeddings de momentos do domínio
            const allEmbeddings = await this.config.repositories.momentEmbedding.findAll(10000, 0)

            if (allEmbeddings.length === 0) {
                return
            }

            // Converter embeddings de domínio (string) para array de números
            const embeddingsForClustering = allEmbeddings.map((e) => ({
                id: e.momentId,
                vector: typeof e.vector === "string" ? JSON.parse(e.vector) : e.vector,
            }))

            // Executar clustering
            const result = await this.clusteringAlgorithm.cluster(embeddingsForClustering)

            // Salvar clusters (já são entidades de domínio)
            await this.config.repositories.cluster.saveMany(result.clusters)

            // Salvar assignments
            for (const [momentId, clusterId] of Object.entries(result.assignments)) {
                await this.config.repositories.cluster.saveAssignment({
                    momentId,
                    clusterId,
                    similarity: 1.0,
                    confidence: 1.0,
                    assignedAt: new Date(),
                    assignedBy: "algorithm",
                })
            }
        } catch (error) {
            console.error("Error reclustering moments:", error)
        }
    }

    /**
     * Busca clusters (do cache ou re-clusteriza)
     */
    public async getClusters(): Promise<Cluster[]> {
        const clusters = await this.config.repositories.cluster.findAll()

        // Se não há clusters ou estão desatualizados, re-clusterizar
        if (clusters.length === 0) {
            await this.reclusterMoments()
            return await this.config.repositories.cluster.findAll()
        }

        return clusters
    }

    /**
     * Constrói perfil do usuário
     */
    public async buildUserProfile(userId: string): Promise<UserProfile> {
        const interactions = await this.config.repositories.interaction.findByUserId(userId, 100)

        // Extrair interesses das interações
        const topicCounts: Record<string, number> = {}

        interactions.forEach((interaction) => {
            const topics = interaction.metadata?.topics || []
            topics.forEach((topic: string) => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1
            })
        })

        const interests = Object.entries(topicCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([topic]) => topic)

        return {
            userId,
            interests,
            interactionHistory: interactions,
        }
    }

    /**
     * Gera razão para a recomendação
     */
    public generateReason(candidate: any): string {
        const scores = candidate.scores

        if (scores.relevance > 0.7) {
            return "Highly relevant to your interests"
        } else if (scores.novelty > 0.7) {
            return "Fresh content you might enjoy"
        } else if (scores.engagement > 0.7) {
            return "Popular with others like you"
        }

        return "Recommended for you"
    }
}
