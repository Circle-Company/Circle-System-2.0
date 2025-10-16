/**
 * Tipos relacionados a recomendações
 */

export interface RecommendationRequest {
    userId: string
    limit?: number
    excludeMomentIds?: string[]
    context?: RecommendationContext
}

export interface RecommendationContext {
    timeOfDay?: number // 0-23
    dayOfWeek?: number // 0-6
    location?: string
    device?: string
    sessionId?: string
}

export interface Recommendation {
    momentId: string
    score: number
    reason: string
    cluster?: {
        id: string
        name?: string
    }
    metadata?: {
        relevanceScore?: number
        noveltyScore?: number
        diversityScore?: number
        [key: string]: any
    }
}

export interface RankingOptions {
    weights?: {
        relevance: number
        engagement: number
        novelty: number
        diversity: number
        context: number
    }
    diversityLevel?: number
    noveltyLevel?: number
    context?: RecommendationContext
}

export interface Candidate {
    momentId: string
    clusterId: string
    clusterScore: number
    embedding?: number[]
    metadata?: {
        topics?: string[]
        authorId?: string
        createdAt?: Date
        engagement?: {
            views: number
            likes: number
            comments: number
            shares: number
        }
        [key: string]: any
    }
}

export interface RankedCandidate extends Candidate {
    finalScore: number
    scores: {
        relevance: number
        engagement: number
        novelty: number
        diversity: number
        context: number
    }
}
