import { ClusterRankingParams, DBSCANConfig, EmbeddingParams, RankingParams } from "./params.type"
import {
    IClusterRepository,
    IInteractionRepository,
    IMomentEmbeddingRepository,
    IUserEmbeddingRepository,
} from "./repositories"
import { Cluster, Recommendation, RecommendationRequest, UserProfile } from "./types"

import { DBSCANClustering } from "./algorithms/dbscan.clustering"
import { CandidateSelector } from "./services/candidate.selector"
import { ClusterMatcher } from "./services/cluster.matcher"
import { MomentEmbeddingService } from "./services/moment.embedding.service"
import { RankingService } from "./services/ranking.service"
import { UserEmbeddingService } from "./services/user.embedding.service"

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
 */
export class RecommendationEngine {
    private readonly userEmbeddingService: UserEmbeddingService
    private readonly momentEmbeddingService: MomentEmbeddingService
    private readonly clusterMatcher: ClusterMatcher
    private readonly candidateSelector: CandidateSelector
    private readonly rankingService: RankingService
    private readonly clusteringAlgorithm: DBSCANClustering

    constructor(private readonly config: RecommendationEngineConfig) {
        // Inicializar serviços com injeção de dependências
        this.userEmbeddingService = new UserEmbeddingService(
            config.repositories.userEmbedding,
            config.repositories.interaction,
            config.params.embedding,
        )

        this.momentEmbeddingService = new MomentEmbeddingService(
            config.repositories.momentEmbedding,
            config.params.embedding,
        )

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
            // 1. Buscar ou gerar embedding do usuário
            const userEmbedding = await this.userEmbeddingService.getEmbedding(userId)

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
     * Processa uma interação de usuário para atualizar embeddings
     */
    async processInteraction(
        userId: string,
        momentId: string,
        interactionType: string,
    ): Promise<void> {
        try {
            // Salvar interação
            await this.config.repositories.interaction.save({
                id: `${userId}_${momentId}_${Date.now()}`,
                userId,
                momentId,
                type: interactionType as any,
                timestamp: new Date(),
            })

            // Atualizar embedding do usuário incrementalmente
            const momentEmbedding = await this.momentEmbeddingService.getEmbedding(momentId)

            if (momentEmbedding) {
                await this.userEmbeddingService.updateEmbedding(userId, momentEmbedding.vector)
            }
        } catch (error) {
            console.error("Error processing interaction:", error)
        }
    }

    /**
     * Adiciona um novo momento e gera seu embedding
     */
    async addMoment(
        momentId: string,
        data: {
            textContent: string
            tags: string[]
            topics: string[]
            authorId: string
        },
    ): Promise<void> {
        try {
            // Gerar embedding
            await this.momentEmbeddingService.generateEmbedding(momentId, {
                textContent: data.textContent,
                tags: data.tags,
                topics: data.topics,
                metadata: {
                    authorId: data.authorId,
                },
            })

            // Re-clusterizar (poderia ser feito em batch periodicamente)
            await this.reclusterMoments()
        } catch (error) {
            console.error("Error adding moment:", error)
        }
    }

    /**
     * Re-clusteriza todos os momentos
     */
    async reclusterMoments(): Promise<void> {
        try {
            // Buscar todos os embeddings de momentos
            const allEmbeddings = await this.config.repositories.momentEmbedding.findAll(10000, 0)

            if (allEmbeddings.length === 0) {
                return
            }

            // Executar clustering
            const result = await this.clusteringAlgorithm.cluster(
                allEmbeddings.map((e) => ({
                    id: e.momentId,
                    vector: e.vector,
                })),
            )

            // Salvar clusters
            await this.config.repositories.cluster.saveMany(result.clusters)

            // Salvar assignments
            for (const [momentId, clusterId] of Object.entries(result.assignments)) {
                await this.config.repositories.cluster.saveAssignment({
                    momentId,
                    clusterId,
                    similarity: 1.0, // Poderia calcular similaridade real
                    assignedAt: new Date(),
                })
            }
        } catch (error) {
            console.error("Error reclustering moments:", error)
        }
    }

    /**
     * Busca clusters (do cache ou re-clusteriza)
     */
    private async getClusters(): Promise<Cluster[]> {
        const clusters = await this.config.repositories.cluster.findAll()

        // Se não há clusters ou estão desatualizados, re-clusterizar
        if (clusters.length === 0) {
            await this.reclusterMoments()
            return this.config.repositories.cluster.findAll()
        }

        return clusters
    }

    /**
     * Constrói perfil do usuário
     */
    private async buildUserProfile(userId: string): Promise<UserProfile> {
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
    private generateReason(candidate: any): string {
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
