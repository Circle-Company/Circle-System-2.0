import { describe, expect, it } from "vitest"
import { defaultSearchConfig, searchCache, searchIndexes, searchRules } from "../config"

describe("Config", () => {
    describe("defaultSearchConfig", () => {
        it("deve ter configurações padrão válidas", () => {
            expect(defaultSearchConfig.maxResults).toBe(100)
            expect(defaultSearchConfig.defaultLimit).toBe(20)
            expect(defaultSearchConfig.timeout).toBe(5000)
            expect(defaultSearchConfig.cacheEnabled).toBe(true)
            expect(defaultSearchConfig.cacheTTL).toBe(600)
        })

        it("deve ter pesos de ranking válidos", () => {
            const weights = defaultSearchConfig.rankingWeights
            expect(weights.textual).toBe(0.4)
            expect(weights.engagement).toBe(0.25)
            expect(weights.recency).toBe(0.2)
            expect(weights.quality).toBe(0.1)
            expect(weights.proximity).toBe(0.05)

            // Verificar que a soma dos pesos é 1.0
            const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
            expect(total).toBeCloseTo(1.0, 2)
        })

        it("deve ter filtros padrão válidos", () => {
            const filters = defaultSearchConfig.defaultFilters
            expect(filters.status).toEqual(["PUBLISHED"])
            expect(filters.visibility).toEqual(["PUBLIC", "FOLLOWERS"])
            expect(filters.minLikes).toBe(0)
            expect(filters.minViews).toBe(0)
            expect(filters.minComments).toBe(0)
        })

        it("deve ter configurações de performance válidas", () => {
            expect(defaultSearchConfig.enableParallelSearch).toBe(true)
            expect(defaultSearchConfig.maxConcurrentSearches).toBe(3)
        })
    })

    describe("searchRules", () => {
        it("deve ter regras de validação válidas", () => {
            const validation = searchRules.validation
            expect(validation.minTermLength).toBe(1)
            expect(validation.maxTermLength).toBe(100)
            expect(validation.maxHashtags).toBe(10)
            expect(validation.maxRadius).toBe(100)
            expect(validation.maxDuration).toBe(3600)
        })

        it("deve ter regras de performance válidas", () => {
            const performance = searchRules.performance
            expect(performance.maxProcessingTime).toBe(5000)
            expect(performance.maxCacheSize).toBe(1000)
            expect(performance.maxSuggestions).toBe(10)
            expect(performance.maxResultsPerPage).toBe(100)
        })

        it("deve ter regras de relevância válidas", () => {
            const relevance = searchRules.relevance
            expect(relevance.minTextualScore).toBe(0.1)
            expect(relevance.minEngagementScore).toBe(0.0)
            expect(relevance.minRecencyScore).toBe(0.0)
            expect(relevance.minQualityScore).toBe(0.0)
            expect(relevance.minProximityScore).toBe(0.0)
            expect(relevance.minOverallScore).toBe(0.05)
        })

        it("deve ter regras de filtros válidas", () => {
            const filters = searchRules.filters
            expect(filters.maxStatusFilters).toBe(5)
            expect(filters.maxVisibilityFilters).toBe(3)
            expect(filters.maxHashtagFilters).toBe(20)
            expect(filters.maxExcludeHashtags).toBe(10)
            expect(filters.maxDateRange).toBe(365 * 24 * 60 * 60 * 1000)
        })
    })

    describe("searchIndexes", () => {
        it("deve ter índices de texto válidos", () => {
            const text = searchIndexes.text
            expect(text.title).toBe("gin")
            expect(text.description).toBe("gin")
            expect(text.hashtags).toBe("gin")
        })

        it("deve ter índices geográficos válidos", () => {
            const location = searchIndexes.location
            expect(location.coordinates).toBe("gist")
            expect(location.address).toBe("gin")
        })

        it("deve ter índices temporais válidos", () => {
            const temporal = searchIndexes.temporal
            expect(temporal.createdAt).toBe("btree")
            expect(temporal.updatedAt).toBe("btree")
        })

        it("deve ter índices de métricas válidos", () => {
            const metrics = searchIndexes.metrics
            expect(metrics.likes).toBe("btree")
            expect(metrics.views).toBe("btree")
            expect(metrics.comments).toBe("btree")
        })

        it("deve ter índices compostos válidos", () => {
            const composite = searchIndexes.composite
            expect(composite.status_createdAt).toEqual(["status", "createdAt"])
            expect(composite.visibility_ownerId).toEqual(["visibility", "ownerId"])
            expect(composite.hashtags_createdAt).toEqual(["hashtags", "createdAt"])
        })
    })

    describe("searchCache", () => {
        it("deve ter configurações de TTL válidas", () => {
            const ttl = searchCache.ttl
            expect(ttl.searchResults).toBe(600)
            expect(ttl.suggestions).toBe(1800)
            expect(ttl.userPreferences).toBe(3600)
            expect(ttl.locationData).toBe(7200)
        })

        it("deve ter funções de chaves válidas", () => {
            const keys = searchCache.keys
            expect(typeof keys.searchResults).toBe("function")
            expect(typeof keys.suggestions).toBe("function")
            expect(typeof keys.userPreferences).toBe("function")
            expect(typeof keys.locationData).toBe("function")
        })

        it("deve gerar chaves de cache corretas", () => {
            const keys = searchCache.keys
            expect(keys.searchResults("teste", "filters")).toBe("search:teste:filters")
            expect(keys.suggestions("termo")).toBe("suggestions:termo")
            expect(keys.userPreferences("user123")).toBe("user:prefs:user123")
            expect(keys.locationData(-23.5505, -46.6333)).toBe("location:-23.5505:-46.6333")
        })

        it("deve ter configurações de invalidação válidas", () => {
            const invalidation = searchCache.invalidation
            expect(invalidation.onMomentCreate).toBe(true)
            expect(invalidation.onMomentUpdate).toBe(true)
            expect(invalidation.onMomentDelete).toBe(true)
            expect(invalidation.onUserUpdate).toBe(true)
        })
    })
})
