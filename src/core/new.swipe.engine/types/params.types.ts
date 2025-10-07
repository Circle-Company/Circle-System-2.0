export type EmbeddingParams = {
    timeWindows: {
        recentEmbeddingUpdate: number
        interactionHistory: number
    }
    dimensions: {
        embedding: number
        interactionHistory: number
        contentPreferences: number
        socialFeatures: number
    }
    weights: {
        content: {
            text: number
            tags: number
            engagement: number
        }
        interactions: {
            view: number
            like: number
            comment: number
            share: number
            save: number
            default: number
        }
        update: {
            default: number
        }
    }
    similarity: {
        defaultLimit: number
        minimumThreshold: number
    }
    batchProcessing: {
        size: number
    }
    normalization: {
        engagementLogBase: number
        engagementScaleFactor: number
    }
    decay: {
        interactionWeight: {
            base: number
            minimum: number
        }
    }
    feedback: {
        interactionStrengths: {
            view: number
            completion: number
            like: number
            comment: number
            share: number
            save: number
            report: number
            skip: number
        }
        learningRates: {
            user: {
                highPriority: number
                normal: number
            }
            post: {
                highPriority: number
                normal: number
                networkEffect: number
            }
        }
        engagement: {
            timeThresholds: {
                short: number
                medium: number
                long: number
            }
            watchPercentages: {
                low: number
                high: number
            }
            timeMultipliers: {
                short: number
                long: number
            }
            watchMultipliers: {
                low: number
                high: number
            }
        }
        networkEffects: {
            similarPostsLimit: number
            similarityThreshold: number
        }
        highPriorityInteractions: string[]
    }
    candidateSelector: {
        weights: {
            clusterScore: number
            recency: number
            engagement: number
            random: number
        }
        thresholds: {
            minimumClusterScore: number
            timeWindow: number
            defaultLimit: number
            bufferSize: number
        }
    }
}

export type FeedRecommendationParams = {
    defaultOptions: {
        limit: number
        diversity: number
        novelty: number
        context: {
            timeOfDay: boolean
            dayOfWeek: boolean
        }
    }
}

export type RankingParams = {
    weights: {
        relevance: number
        engagement: number
        novelty: number
        diversity: number
        context: number
    }
    noveltyLevel: number
    diversityLevel: number
    decay: {
        interactionWeight: number
        minimum: number
    }
    defaultScores: {
        relevance: number
        engagement: number
        novelty: number
        diversity: number
        context: number
    }
    diversityWeights: {
        tags: number
        engagement: number
    }
    contextWeights: {
        peakHours: number
        lowEngagementHours: number
        normalHours: number
        weekend: number
        midWeek: number
        weekStartEnd: number
        sameLocation: number
        differentLocation: number
    }
    maxTags: number
}

export type ClusterRankingParams = {
    engagementFactors: {
        recency: {
            halfLifeHours: {
                partialView: number
                completeView: number
                like: number
                likeComment: number
                comment: number
                share: number
                save: number
            }
        }
        interactionWeights: {
            partialView: number
            completeView: number
            like: number
            likeComment: number
            comment: number
            share: number
        }
        timeDecayFactor: number
        maxInteractionsPerUser: number
        normalizationFactor: number
        defaultInteractionWeights: {
            view: number
            completion: number
            like: number
            comment: number
            share: number
            save: number
            report: number
            skip: number
            default: number
        }
    }
    noveltyFactors: {
        viewedContentWeight: number
        topicNoveltyWeight: number
        noveltyDecayPeriodDays: number
        similarContentDiscount: number
    }
    diversityFactors: {
        topicDiversityWeight: number
        creatorDiversityWeight: number
        formatDiversityWeight: number
        recentClustersToConsider: number
    }
    qualityFactors: {
        cohesionWeight: number
        sizeWeight: number
        densityWeight: number
        stabilityWeight: number
        minOptimalSize: number
        maxOptimalSize: number
    }
    userProfileAdjustments: {
        highInteractionThreshold: number
        diversityIncrease: number
        affinityDecrease: number
        noveltyIncrease: number
    }
    temporalAdjustments: {
        nightTime: {
            startHour: number
            endHour: number
            qualityIncrease: number
            engagementDecrease: number
        }
        lunchTime: {
            startHour: number
            endHour: number
            temporalIncrease: number
            engagementDecrease: number
        }
        weekend: {
            days: number[]
            noveltyIncrease: number
            qualityDecrease: number
        }
    }
    confidence: {
        varianceMultiplier: number
    }
    statistics: {
        topClustersCount: number
        scoreDistributionLimits: {
            low: number
            medium: number
            high: number
            veryHigh: number
        }
    }
    fallback: {
        neutralScore: number
        errorConfidence: number
        maxTopicsInMetadata: number
    }
}

export type ClusterRankingConfig = {
    baseWeights: {
        affinity: number
        engagement: number
        novelty: number
        diversity: number
        temporal: number
        quality: number
    }
    affinityFactors: {
        embeddingSimilarityWeight: number
        sharedInterestsWeight: number
        networkProximityWeight: number
    }
    engagementFactors: {
        recency: {
            halfLifeHours: {
                view: number
                like: number
                comment: number
                share: number
                save: number
            }
        }
        interactionWeights: {
            view: number
            like: number
            comment: number
            share: number
            save: number
        }
        timeDecayFactor: number
    }
    noveltyFactors: {
        viewedContentWeight: number
        topicNoveltyWeight: number
        noveltyDecayPeriodDays: number
        similarContentDiscount: number
    }
    diversityFactors: {
        topicDiversityWeight: number
        creatorDiversityWeight: number
        formatDiversityWeight: number
        recentClustersToConsider: number
    }
    temporalFactors: {
        hourOfDayWeights: {
            morning: number
            midday: number
            afternoon: number
            evening: number
            night: number
        }
        dayOfWeekWeights: {
            weekday: number
            weekend: number
        }
        contentFreshnessWeight: number
        temporalEventWeight: number
    }
    qualityFactors: {
        cohesionWeight: number
        sizeWeight: number
        densityWeight: number
        stabilityWeight: number
        minOptimalSize: number
        maxOptimalSize: number
    }
    diversification: {
        enabled: boolean
        temperature: number
        method: string
        mmrLambda: number
    }
    feedbackSettings: {
        enabled: boolean
        positiveAdjustment: number
        negativeAdjustment: number
    }
}

export type UserTypeConfig = {
    weightModifiers: {
        affinity: number
        engagement: number
        novelty: number
        diversity: number
        temporal: number
        quality: number
    }
}

export type UserTypeConfigs = {
    newUser: UserTypeConfig
    powerUser: UserTypeConfig
    casualUser: UserTypeConfig
}

export type TemporalDecayConfig = {
    news: {
        halfLifeHours: number
        maxAgeDays: number
    }
    educational: {
        halfLifeHours: number
        maxAgeDays: number
    }
    entertainment: {
        halfLifeHours: number
        maxAgeDays: number
    }
    default: {
        halfLifeHours: number
        maxAgeDays: number
    }
}

export type InteractionBoosts = {
    clickBoost: number
    likeBoost: number
    shareBoost: number
    completeViewBoost: number
    partialViewBoost: number
    commentBoost: number
    likeCommentBoost: number
    reportBoost: number
    showLessOftenBoost: number
    defaultBoost: number
}

export type InteractionScore = {
    default: number
    defaultWhenBoostZero: number
}

export type DBSCANConfig = {
    epsilon: number
    minPoints: number
    weights: Record<string, never>
    distanceFunction: "euclidean" | "cosine" | "manhattan"
    randomSeed: number
    initMethod: "k-means++" | "random"
    threshold: number
}

// Helper types for specific use cases
// InteractionType agora está definido em types/interaction.types.ts
// Mantemos aqui apenas tipos auxiliares específicos dos parâmetros

export type UserType = "newUser" | "powerUser" | "casualUser"

export type ContentType = "news" | "educational" | "entertainment" | "default"

export type TimeOfDay = "morning" | "midday" | "afternoon" | "evening" | "night"

export type DayType = "weekday" | "weekend"
