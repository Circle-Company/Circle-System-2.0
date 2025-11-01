import { Candidate, CandidateSelectorOptions, ClusterInfo, MatchResult } from "../../types"
import { LogLevel, Logger } from "@/shared/logger"

import { EmbeddingParams } from "../../params"
import Moment from "@/infra/models/moment/moment.model"

export class CandidateSelector {
    private readonly logger: Logger
    private readonly weights = EmbeddingParams.candidateSelector.weights
    private readonly thresholds = EmbeddingParams.candidateSelector.thresholds
    private readonly PostModel = Moment

    constructor(weights?: Partial<typeof EmbeddingParams.candidateSelector.weights>) {
        this.logger = new Logger("CandidateSelector", {
            minLevel: LogLevel.INFO,
            showTimestamp: true,
            showComponent: true,
            enabled: true,
        })
        // Permite customização dos pesos no construtor
        if (weights) {
            this.weights = { ...this.weights, ...weights }
        }
    }

    /**
     * Seleciona candidatos dos clusters correspondentes
     */
    async selectCandidates(
        matchedClusters: MatchResult[],
        options: CandidateSelectorOptions,
    ): Promise<Candidate[]> {
        try {
            const {
                limit = this.thresholds.defaultLimit,
                excludeIds = new Set<string>(),
                userId,
                timeWindow = this.thresholds.timeWindow,
            } = options

            // Filtra e ordena clusters por score
            const validClusters = matchedClusters
                .filter((match) => match.score > this.thresholds.minimumClusterScore)
                .sort((a, b) => b.score - a.score)

            // Coleta candidatos de cada cluster
            const allCandidates: Candidate[] = []

            for (const match of validClusters) {
                const clusterCandidates = await this.getCandidatesFromCluster(match.cluster, {
                    excludeIds,
                    userId,
                    timeWindow,
                    clusterScore: match.score,
                    limit: Math.ceil(limit / validClusters.length) + this.thresholds.bufferSize,
                })
                allCandidates.push(...clusterCandidates)
            }
            // Retorna todos os candidatos
            return allCandidates
        } catch (error: any) {
            this.logger.error(`Erro ao selecionar candidatos: ${error.message}`)
            return []
        }
    }

    /**
     * Obtém candidatos de um cluster específico
     */
    private async getCandidatesFromCluster(
        cluster: ClusterInfo,
        options: {
            excludeIds: Set<string>
            userId: string
            timeWindow: number
            clusterScore: number
            limit: number
        },
    ): Promise<Candidate[]> {
        try {
            const { excludeIds, userId, timeWindow, clusterScore, limit } = options

            // TODO: Implementar query real ao banco de dados
            // Placeholder para demonstração
            const candidates = cluster.contentIds || []
            if (!candidates.length) {
                this.logger.error(`Nenhum candidato encontrado para o cluster: ${cluster.id}`)
                return []
            }

            // Mapear IDs para objetos candidatos
            interface CandidateWithUser {
                id: string
                user_id: string
                created_at: Date
                statistics: {
                    likes: number
                    comments: number
                    shares: number
                }
            }

            const hidratedCandidates = await Promise.all(
                candidates.map(async (candidateId): Promise<CandidateWithUser | null> => {
                    try {
                        // Busca no banco de dados
                        const momentData = await this.PostModel.findByPk(candidateId)
                        if (!momentData) return null

                        return {
                            id: momentData.id.toString(),
                            user_id: momentData.ownerId?.toString() || "1",
                            created_at: momentData.createdAt,
                            statistics: {
                                likes: 0,
                                comments: 0,
                                shares: 0,
                            },
                        }
                    } catch (err) {
                        this.logger.error(`Erro ao buscar candidato ${candidateId}: ${err}`)
                        return null
                    }
                }),
            )

            // Filtra e formata candidatos válidos
            const validCandidates: Candidate[] = []

            for (const candidate of hidratedCandidates) {
                if (!candidate) continue

                if (
                    !excludeIds.has(candidate.id.toString()) &&
                    candidate.user_id !== userId &&
                    this.isWithinTimeWindow(candidate.created_at, timeWindow)
                ) {
                    validCandidates.push({
                        id: candidate.id,
                        created_at: candidate.created_at,
                        statistics: candidate.statistics,
                        clusterScore,
                    })
                }
            }

            return validCandidates
        } catch (error: any) {
            this.logger.error(`Erro ao obter candidatos do cluster: ${error.message}`)
            return []
        }
    }

    /**
     * Verifica se um candidato está dentro da janela de tempo
     */
    private isWithinTimeWindow(created_at: Date, timeWindow: number): boolean {
        const now = new Date()
        const age = now.getTime() - new Date(created_at).getTime()
        const ageInHours = age / (1000 * 60 * 60)
        return ageInHours <= timeWindow
    }
}
