import { Cluster, ClusterMatch, RecommendationContext, UserEmbedding, UserProfile } from "../types"

/**
 * Serviço para encontrar clusters relevantes para um usuário
 */
export class ClusterMatcher {
    constructor(
        private readonly minMatchThreshold: number = 0.3,
        private readonly maxClusters: number = 10,
    ) {}

    /**
     * Encontra clusters relevantes para um usuário
     */
    findRelevantClusters(
        clusters: Cluster[],
        userEmbedding: UserEmbedding | null,
        userProfile?: UserProfile | null,
        context?: RecommendationContext,
    ): ClusterMatch[] {
        if (clusters.length === 0) {
            return []
        }

        let matches: ClusterMatch[] = []

        // Estratégia 1: Matching baseado em embedding
        if (userEmbedding) {
            matches = this.matchByEmbedding(clusters, userEmbedding)
        }
        // Estratégia 2: Matching baseado em perfil
        else if (userProfile) {
            matches = this.matchByProfile(clusters, userProfile)
        }
        // Estratégia 3: Clusters default/populares
        else {
            matches = this.getDefaultClusters(clusters)
        }

        // Aplicar boost contextual
        if (context) {
            matches = this.applyContextualBoost(matches, context)
        }

        // Filtrar por threshold e limitar
        return matches
            .filter((match) => match.score >= this.minMatchThreshold)
            .sort((a, b) => b.score - a.score)
            .slice(0, this.maxClusters)
    }

    /**
     * Matching baseado em embedding
     */
    private matchByEmbedding(clusters: Cluster[], userEmbedding: UserEmbedding): ClusterMatch[] {
        return clusters.map((cluster) => {
            const similarity = this.calculateCosineSimilarity(
                userEmbedding.vector,
                cluster.centroid,
            )

            return {
                cluster,
                score: similarity,
                reason: "embedding",
            }
        })
    }

    /**
     * Matching baseado em perfil de usuário
     */
    private matchByProfile(clusters: Cluster[], userProfile: UserProfile): ClusterMatch[] {
        return clusters.map((cluster) => {
            let score = 0

            // Matching de interesses com tópicos do cluster
            if (userProfile.interests.length > 0 && cluster.topics) {
                const interestMatch = this.calculateInterestMatch(
                    userProfile.interests,
                    cluster.topics,
                )
                score += interestMatch * 0.7
            }

            // Boost para clusters maiores (mais ativos)
            score += Math.min(cluster.size / 1000, 0.3)

            return {
                cluster,
                score: Math.min(score, 1),
                reason: "profile",
            }
        })
    }

    /**
     * Retorna clusters default (mais populares)
     */
    private getDefaultClusters(clusters: Cluster[]): ClusterMatch[] {
        return clusters
            .sort((a, b) => b.size - a.size)
            .map((cluster, idx) => ({
                cluster,
                score: Math.max(0.5 - idx * 0.05, 0.2),
                reason: "default" as const,
            }))
    }

    /**
     * Aplica boost contextual baseado em contexto da requisição
     */
    private applyContextualBoost(
        matches: ClusterMatch[],
        context: RecommendationContext,
    ): ClusterMatch[] {
        return matches.map((match) => {
            let boost = 0

            // Boost por hora do dia
            if (context.timeOfDay !== undefined) {
                boost += this.calculateTimeBoost(context.timeOfDay) * 0.1
            }

            // Boost por dia da semana
            if (context.dayOfWeek !== undefined) {
                boost += this.calculateDayBoost(context.dayOfWeek) * 0.1
            }

            return {
                ...match,
                score: Math.min(match.score + boost, 1),
            }
        })
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
     * Calcula match de interesses
     */
    private calculateInterestMatch(userInterests: string[], clusterTopics: string[]): number {
        if (userInterests.length === 0 || clusterTopics.length === 0) {
            return 0
        }

        const normalizedUserInterests = userInterests.map((i) => i.toLowerCase())
        const normalizedClusterTopics = clusterTopics.map((t) => t.toLowerCase())

        const matches = normalizedUserInterests.filter((interest) =>
            normalizedClusterTopics.includes(interest),
        )

        return matches.length / Math.max(userInterests.length, clusterTopics.length)
    }

    /**
     * Calcula boost baseado na hora do dia
     */
    private calculateTimeBoost(hour: number): number {
        // Maior boost em horários de pico (18-22h)
        if (hour >= 18 && hour <= 22) {
            return 1.0
        }
        // Boost médio em horários diurnos (9-18h)
        else if (hour >= 9 && hour < 18) {
            return 0.7
        }
        // Boost baixo em outros horários
        return 0.4
    }

    /**
     * Calcula boost baseado no dia da semana
     */
    private calculateDayBoost(day: number): number {
        // Maior boost em finais de semana (0=domingo, 6=sábado)
        if (day === 0 || day === 6) {
            return 1.0
        }
        return 0.8
    }
}
