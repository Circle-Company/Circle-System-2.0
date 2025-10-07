import { Candidate, RankedCandidate, RankingOptions, UserEmbedding } from "../../types"
import { IInteractionRepository, IMomentEmbeddingRepository } from "../repositories"

import { RankingParams } from "../../types/params.types"

/**
 * Serviço para ranquear candidatos de momentos
 */
export class RankingService {
    constructor(
        private readonly momentEmbeddingRepository: IMomentEmbeddingRepository,
        private readonly interactionRepository: IInteractionRepository,
        private readonly params: RankingParams,
    ) {}

    /**
     * Ranqueia candidatos
     */
    async rankCandidates(
        candidates: Candidate[],
        userEmbedding: UserEmbedding | null,
        options: RankingOptions = {},
    ): Promise<RankedCandidate[]> {
        if (candidates.length === 0) {
            return []
        }

        // Buscar embeddings dos momentos
        const momentIds = candidates.map((c) => c.momentId)
        const embeddings = await this.momentEmbeddingRepository.findByMomentIds(momentIds)
        const embeddingMap = new Map(embeddings.map((e) => [e.momentId, e]))

        // Calcular scores para cada candidato
        const rankedCandidates: RankedCandidate[] = []

        for (const candidate of candidates) {
            const momentEmbedding = embeddingMap.get(candidate.momentId)

            const scores = {
                relevance: this.calculateRelevanceScore(candidate, userEmbedding, momentEmbedding),
                engagement: this.calculateEngagementScore(candidate),
                novelty: await this.calculateNoveltyScore(candidate, userEmbedding),
                diversity: this.calculateDiversityScore(candidate, rankedCandidates),
                context: this.calculateContextScore(candidate, options.context),
            }

            const weights = options.weights || this.params.weights
            const finalScore = this.calculateFinalScore(scores, weights)

            rankedCandidates.push({
                ...candidate,
                finalScore,
                scores,
            })
        }

        // Aplicar diversificação
        const diversified = this.applyDiversification(
            rankedCandidates,
            options.diversityLevel || this.params.diversityLevel,
        )

        return diversified.sort((a, b) => b.finalScore - a.finalScore)
    }

    /**
     * Calcula score de relevância
     */
    private calculateRelevanceScore(
        candidate: Candidate,
        userEmbedding: UserEmbedding | null,
        momentEmbedding?: any,
    ): number {
        let score = candidate.clusterScore * 0.5 // Score base do cluster

        // Se temos embeddings, calcular similaridade
        if (userEmbedding && momentEmbedding) {
            const similarity = this.calculateCosineSimilarity(
                userEmbedding.vector,
                momentEmbedding.vector,
            )
            score += similarity * 0.5
        }

        return Math.min(score, 1)
    }

    /**
     * Calcula score de engajamento
     */
    private calculateEngagementScore(candidate: Candidate): number {
        const engagement = candidate.metadata?.engagement

        if (!engagement) {
            return 0.5 // Score default
        }

        // Normalizar métricas de engajamento
        const totalEngagement = engagement.likes + engagement.comments * 2 + engagement.shares * 3
        const engagementRate = totalEngagement / Math.max(engagement.views, 1)

        return Math.min(engagementRate / 0.5, 1) // Normalizar para 0-1
    }

    /**
     * Calcula score de novidade
     */
    private async calculateNoveltyScore(
        candidate: Candidate,
        userEmbedding: UserEmbedding | null,
    ): Promise<number> {
        // Score baseado na idade do conteúdo
        const createdAt = candidate.metadata?.createdAt

        if (!createdAt) {
            return 0.5
        }

        const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
        const recencyScore = Math.exp(-ageHours / 48) // Decay de 48 horas

        // Se temos embedding do usuário, verificar se o tópico é novo
        let topicNovelty = 0.5

        if (userEmbedding && candidate.metadata?.topics) {
            const userInterests = userEmbedding.metadata?.interests || []
            const candidateTopics = candidate.metadata.topics

            const overlap = candidateTopics.filter((topic: string) =>
                userInterests.includes(topic),
            ).length

            topicNovelty = 1 - overlap / Math.max(candidateTopics.length, 1)
        }

        return recencyScore * 0.6 + topicNovelty * 0.4
    }

    /**
     * Calcula score de diversidade
     */
    private calculateDiversityScore(
        candidate: Candidate,
        previousCandidates: RankedCandidate[],
    ): number {
        if (previousCandidates.length === 0) {
            return 1
        }

        // Verificar diversidade de tópicos
        const candidateTopics = candidate.metadata?.topics || []
        let topicOverlap = 0

        for (const prev of previousCandidates.slice(-5)) {
            // Últimos 5
            const prevTopics = prev.metadata?.topics || []
            const overlap = candidateTopics.filter((t: string) => prevTopics.includes(t)).length

            topicOverlap += overlap / Math.max(candidateTopics.length, 1)
        }

        const avgOverlap = topicOverlap / Math.min(previousCandidates.length, 5)
        return 1 - avgOverlap
    }

    /**
     * Calcula score contextual
     */
    private calculateContextScore(candidate: Candidate, context?: any): number {
        if (!context) {
            return 0.5
        }

        let score = 0

        // Score por hora do dia
        if (context.timeOfDay !== undefined) {
            score += this.getTimeOfDayScore(context.timeOfDay) * 0.5
        }

        // Score por dia da semana
        if (context.dayOfWeek !== undefined) {
            score += this.getDayOfWeekScore(context.dayOfWeek) * 0.5
        }

        return score || 0.5
    }

    /**
     * Calcula score final ponderado
     */
    private calculateFinalScore(
        scores: Record<string, number>,
        weights: Record<string, number>,
    ): number {
        let finalScore = 0

        Object.entries(scores).forEach(([key, value]) => {
            finalScore += value * (weights[key] || 0)
        })

        return Math.min(finalScore, 1)
    }

    /**
     * Aplica diversificação (MMR - Maximal Marginal Relevance)
     */
    private applyDiversification(
        candidates: RankedCandidate[],
        diversityLevel: number,
    ): RankedCandidate[] {
        if (diversityLevel === 0 || candidates.length === 0) {
            return candidates
        }

        const selected: RankedCandidate[] = []
        const remaining = [...candidates].sort((a, b) => b.finalScore - a.finalScore)

        // Sempre selecionar o primeiro (mais relevante)
        selected.push(remaining.shift()!)

        while (remaining.length > 0) {
            let bestIdx = 0
            let bestScore = -Infinity

            for (let i = 0; i < remaining.length; i++) {
                const candidate = remaining[i]

                // MMR: balancear relevância e diversidade
                const relevance = candidate.finalScore
                const diversity = this.calculateDiversityWithSelected(candidate, selected)

                const mmrScore = (1 - diversityLevel) * relevance + diversityLevel * diversity

                if (mmrScore > bestScore) {
                    bestScore = mmrScore
                    bestIdx = i
                }
            }

            selected.push(remaining.splice(bestIdx, 1)[0])
        }

        return selected
    }

    /**
     * Calcula diversidade com candidatos já selecionados
     */
    private calculateDiversityWithSelected(
        candidate: RankedCandidate,
        selected: RankedCandidate[],
    ): number {
        if (selected.length === 0) {
            return 1
        }

        const candidateTopics = candidate.metadata?.topics || []
        let minDiversity = 1

        for (const s of selected) {
            const selectedTopics = s.metadata?.topics || []
            const overlap = candidateTopics.filter((t: string) => selectedTopics.includes(t)).length
            const diversity =
                1 - overlap / Math.max(candidateTopics.length, selectedTopics.length, 1)

            minDiversity = Math.min(minDiversity, diversity)
        }

        return minDiversity
    }

    /**
     * Calcula similaridade de cosseno
     */
    private calculateCosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            return 0
        }

        let dotProduct = 0
        let magA = 0
        let magB = 0

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i]
            magA += a[i] * a[i]
            magB += b[i] * b[i]
        }

        const magnitude = Math.sqrt(magA) * Math.sqrt(magB)
        return magnitude > 0 ? dotProduct / magnitude : 0
    }

    /**
     * Score por hora do dia
     */
    private getTimeOfDayScore(hour: number): number {
        if (hour >= 18 && hour <= 22) return 1.0 // Horário de pico
        if (hour >= 12 && hour < 18) return 0.8 // Tarde
        if (hour >= 9 && hour < 12) return 0.7 // Manhã
        return 0.5 // Madrugada
    }

    /**
     * Score por dia da semana
     */
    private getDayOfWeekScore(day: number): number {
        return day === 0 || day === 6 ? 1.0 : 0.8 // Fim de semana vs. semana
    }
}
