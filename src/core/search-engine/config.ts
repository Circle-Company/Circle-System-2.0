export const config = {
    rules: {
        term: {
            minLength: 1,
            maxLength: 50,
        },
        results: {
            mixCoefficient: 0.5,
            max: 20,
            timeout: 30000,
            cacheExpiration: 10000,
        },
        batch: {
            size: 10,
            maxConcurrent: 3,
        },
        candidates: {
            maxRelated: 8,
            maxUnknown: 12,
            maxPremium: 4,
            minRelationWeight: 0.1,
        },
    },

    weights: {
        unknown: {
            distance: 5,
            verifyed: 1,
            total_followers_num: 2,
            follow_you: 3,
            you_follow: 7,
            block_you: -30,
            muted: -50,
            is_premium: 15,
        },
        related: {
            block_you: -30,
            muted: -50,
            is_premium: 15,
        },
    },
}
