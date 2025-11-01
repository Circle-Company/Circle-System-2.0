import {
    ClusterInfo,
    MatchResult,
    Recommendation,
    RecommendationContext,
    RecommendationOptions,
    UserEmbedding,
    UserProfile,
} from "../../types"
import { LogLevel, Logger } from "@/shared/logger"

import { CandidateSelector } from "./candidate.selector"
import { ClusterMatcher } from "./cluster.match"
import { DBSCANClustering } from "../clustering"
import { Entity } from "../../types"
import MomentEmbedding from "@/infra/models/moment/moment.embedding.model"
import PostCluster from "@/infra/models/swipe.engine/post.cluster.model"
import PostClusterRank from "@/infra/models/swipe.engine/post.cluster.rank.model"
import { RankingService } from "./candidate.rank"
import { UserEmbeddingService } from "../embeddings/user"

export class RecommendationEngine {
    private userEmbeddingService: UserEmbeddingService | null = null
    private clusterMatcher: ClusterMatcher
    private candidateSelector: CandidateSelector
    private rankingService: RankingService
    private logger: Logger

    constructor(config?: any) {
        // Inicializar componentes
        this.clusterMatcher = new ClusterMatcher(config?.clusters || [], {
            minMatchThreshold: 0.2,
            contextWeight: 0.3,
            interestWeight: 0.3,
            embeddingWeight: 0.4,
        })
        this.candidateSelector = new CandidateSelector()
        this.rankingService = new RankingService()

        // Configurar componentes com base no config, se fornecido
        if (config?.userEmbeddingService) {
            this.userEmbeddingService = config.userEmbeddingService
        }
        this.logger = new Logger("RecommendationEngine", {
            minLevel: LogLevel.INFO,
            showTimestamp: true,
            showComponent: true,
            enabled: true,
        })
    }

    /**
     * Gera recomendações para um usuário
     *
     * @param userId ID do usuário
     * @param limit Número máximo de recomendações
     * @param options Opções adicionais
     */
    public async getRecommendations(
        userId: string | bigint,
        limit: number = 10,
        options: RecommendationOptions = {},
    ): Promise<Recommendation[]> {
        try {
            // 1. Obter embedding do usuário (se serviço disponível)
            let userEmbedding: UserEmbedding | null = null
            let userProfile: UserProfile | null = null

            if (this.userEmbeddingService) {
                userEmbedding = await this.userEmbeddingService.getUserEmbedding(BigInt(userId))
            }

            // 2. Obter clusters que correspondem ao perfil do usuário
            // TODO: Implementar obtenção de clusters do repositório
            const clusters = await this.getOrCreateClusters()

            this.clusterMatcher = new ClusterMatcher(clusters)
            // Usando tipo condicional para lidar com valores nulos
            const matchingClusters = await this.findRelevantClusters(
                userEmbedding,
                userProfile,
                options.context,
            )

            // 3. Selecionar candidatos a partir dos clusters
            const candidates = await this.candidateSelector.selectCandidates(matchingClusters, {
                limit: limit * 3, // Obter mais candidatos do que o necessário para ranking
                excludeIds: options.excludeIds ? new Set(options.excludeIds) : undefined,
                userId: String(userId),
            })

            // 4. Ranquear candidatos
            const rankedCandidates = this.rankingService.rankCandidates(candidates, {
                userEmbedding,
                userProfile,
                limit,
                diversityLevel: options.diversity || 0.3,
                noveltyLevel: options.novelty || 0.2,
                context: options.context,
            })

            return rankedCandidates.map((candidate) => ({
                entityId: typeof candidate.id === "number" ? BigInt(candidate.id) : candidate.id,
                entityType: "post",
                score: candidate.finalScore,
                timestamp: new Date(),
                source: "recommendation_engine",
            }))
        } catch (error: any) {
            this.logger.error(
                `Erro ao gerar recomendações para usuário ${userId}: ${error.message}`,
            )
            return []
        }
    }

    /**
     * Encontra clusters relevantes para um usuário
     */
    private async findRelevantClusters(
        userEmbedding: UserEmbedding | null,
        userProfile: UserProfile | null,
        context?: RecommendationContext,
    ): Promise<MatchResult[]> {
        // Implementação modificada para aceitar valores nulos
        return this.clusterMatcher.findRelevantClusters(userEmbedding, userProfile, context)
    }

    /**
     * Obtém clusters existentes ou cria novos se não existirem
     * @returns Lista de clusters
     */
    private async getOrCreateClusters(): Promise<ClusterInfo[] | []> {
        try {
            this.logger.info("Buscando clusters do banco de dados")

            // Buscar todos os clusters ativos no banco de dados
            const dbClusters = await PostCluster.findAll({
                where: {
                    // Pode adicionar condições se necessário, como clusters ativos
                },
                order: [
                    ["size", "DESC"], // Ordenar por tamanho (opcional)
                ],
                limit: 100, // Limitar número de clusters por questão de performance
                include: [
                    {
                        model: PostClusterRank,
                        as: "postRanks",
                        required: false,
                        where: {
                            isActive: true,
                        },
                        attributes: ["score", "relevanceScore", "engagementScore"],
                    },
                ],
            })

            // Converter para o formato ClusterInfo
            const clusters: ClusterInfo[] = dbClusters.map((cluster) => {
                return cluster.toClusterInfo()
            })

            this.logger.info(`Encontrados ${clusters.length} clusters no banco de dados`)

            // Se não houver clusters no banco de dados, criar alguns padrão
            if (clusters.length === 0) {
                this.logger.warn("Nenhum cluster encontrado, criando clusters padrão")
                return await this.createDefaultClusters()
            }

            return clusters
        } catch (error) {
            this.logger.error(`Erro ao buscar clusters: ${error}`)
            return []
        }
    }

    /**
     * Cria clusters dinamicamente baseado em embeddings de posts existentes
     * @returns Lista de clusters criados a partir dos embeddings
     */
    private async createDefaultClusters(): Promise<ClusterInfo[] | []> {
        try {
            this.logger.info("Criando clusters dinamicamente a partir de embeddings")

            // 1. Buscar todos os embeddings de posts do banco
            const embeddingsData = await MomentEmbedding.findAll({
                limit: 1000, // Limitar para não processar muitos de uma vez
                order: [["createdAt", "DESC"]],
            })

            if (embeddingsData.length === 0) {
                this.logger.warn("Nenhum embedding encontrado para criar clusters")
                return []
            }

            this.logger.info(`Processando ${embeddingsData.length} embeddings para criar clusters`)

            // 2. Preparar dados para clustering
            const embeddings: number[][] = []
            const entities: Entity[] = []

            for (const embedData of embeddingsData) {
                try {
                    const vector = JSON.parse(embedData.vector) as number[]
                    if (Array.isArray(vector) && vector.length > 0) {
                        embeddings.push(vector)
                        entities.push({
                            id: embedData.momentId,
                            type: "post",
                            metadata: embedData.metadata || {},
                        })
                    }
                } catch (error) {
                    this.logger.warn(
                        `Erro ao processar embedding do post ${embedData.momentId}: ${error}`,
                    )
                }
            }

            if (embeddings.length < 3) {
                this.logger.warn("Muito poucos embeddings válidos para criar clusters")
                return []
            }

            // 3. Executar clustering usando DBSCAN
            const clustering = new DBSCANClustering()
            const result = await clustering.process(embeddings, entities)

            if (result.clusters.length === 0) {
                this.logger.warn("Nenhum cluster formado pelo DBSCAN")
                return []
            }

            this.logger.info(`DBSCAN formou ${result.clusters.length} clusters`)

            // 4. Criar registros no banco de dados para cada cluster
            const createdClusters: ClusterInfo[] = []

            for (const cluster of result.clusters) {
                try {
                    // Calcular métricas do cluster
                    const memberIds = cluster.memberIds || cluster.members || []

                    const newCluster = await PostCluster.create({
                        name: `Cluster ${cluster.id}`,
                        centroid: JSON.stringify({
                            dimension: cluster.centroid.length,
                            values: cluster.centroid,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }),
                        topics: [],
                        memberIds: memberIds,
                        category: "auto_generated",
                        tags: [],
                        size: cluster.size,
                        density: cluster.density || 0,
                        avgEngagement: 0,
                        metadata: {
                            algorithm: "dbscan",
                            createdAt: new Date().toISOString(),
                        },
                    })

                    createdClusters.push(newCluster.toClusterInfo())
                } catch (error) {
                    this.logger.error(`Erro ao criar cluster ${cluster.id}: ${error}`)
                }
            }

            this.logger.info(`Criados ${createdClusters.length} clusters baseados em embeddings`)
            return createdClusters
        } catch (error) {
            this.logger.error(`Erro ao criar clusters dinâmicos: ${error}`)
            return []
        }
    }
}
