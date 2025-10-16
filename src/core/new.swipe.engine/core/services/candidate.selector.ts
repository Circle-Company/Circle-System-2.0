import { Candidate, ClusterMatch } from "../../types"
import { IClusterRepository, IInteractionRepository } from "../repositories"

export interface CandidateSelectorOptions {
    userId: string
    limit: number
    timeWindowHours?: number
    minClusterScore?: number
}

/**
 * Serviço para selecionar candidatos de momentos a partir de clusters
 */
export class CandidateSelector {
    constructor(
        private readonly clusterRepository: IClusterRepository,
        private readonly interactionRepository: IInteractionRepository,
    ) {}

    /**
     * Seleciona candidatos a partir dos clusters relevantes
     */
    async selectCandidates(
        clusterMatches: ClusterMatch[],
        options: CandidateSelectorOptions,
    ): Promise<Candidate[]> {
        const { userId, limit, timeWindowHours = 24 * 7, minClusterScore = 0.2 } = options

        // Filtrar clusters por score mínimo
        const validClusters = clusterMatches.filter((match) => match.score >= minClusterScore)

        if (validClusters.length === 0) {
            return []
        }

        // Buscar momentos já interagidos para excluir
        const interactedMomentIds = await this.interactionRepository.findInteractedMomentIds(userId)
        const excludeSet = new Set<string>(interactedMomentIds)

        // Coletar candidatos de cada cluster
        const allCandidates: Candidate[] = []

        for (const match of validClusters) {
            const clusterCandidates = await this.getCandidatesFromCluster(
                match,
                excludeSet,
                Math.ceil(limit / validClusters.length),
                timeWindowHours,
            )
            allCandidates.push(...clusterCandidates)
        }

        // Remover duplicatas e limitar
        const uniqueCandidates = this.removeDuplicates(allCandidates)

        // Ordenar por cluster score e limitar
        return uniqueCandidates.sort((a, b) => b.clusterScore - a.clusterScore).slice(0, limit)
    }

    /**
     * Busca candidatos de um cluster específico
     */
    private async getCandidatesFromCluster(
        clusterMatch: ClusterMatch,
        excludeSet: Set<string>,
        limit: number,
        timeWindowHours: number,
    ): Promise<Candidate[]> {
        // Buscar momentos do cluster
        const momentIds = await this.clusterRepository.findMomentsByClusterId(
            clusterMatch.cluster.id,
            limit * 2, // Buscar mais para compensar exclusões
        )

        // Filtrar momentos excluídos e criar candidatos
        const candidates: Candidate[] = []

        for (const momentId of momentIds) {
            if (excludeSet.has(momentId)) {
                continue
            }

            // Buscar assignments para pegar similarity
            const assignments = await this.clusterRepository.findAssignmentsByMomentId(momentId)
            const assignment = assignments.find((a) => a.clusterId === clusterMatch.cluster.id)

            if (!assignment) {
                continue
            }

            candidates.push({
                momentId,
                clusterId: clusterMatch.cluster.id,
                clusterScore: clusterMatch.score,
                metadata: {
                    similarity: assignment.similarity,
                    clusterSize: clusterMatch.cluster.size,
                    clusterDensity: clusterMatch.cluster.density,
                },
            })

            if (candidates.length >= limit) {
                break
            }
        }

        return candidates
    }

    /**
     * Remove candidatos duplicados (prioriza maior cluster score)
     */
    private removeDuplicates(candidates: Candidate[]): Candidate[] {
        const seen = new Map<string, Candidate>()

        for (const candidate of candidates) {
            const existing = seen.get(candidate.momentId)

            if (!existing || candidate.clusterScore > existing.clusterScore) {
                seen.set(candidate.momentId, candidate)
            }
        }

        return Array.from(seen.values())
    }

    /**
     * Calcula score de recência baseado no timestamp
     */
    private calculateRecencyScore(timestamp: Date, timeWindowHours: number): number {
        const ageHours = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60)
        return Math.max(0, 1 - ageHours / timeWindowHours)
    }
}
