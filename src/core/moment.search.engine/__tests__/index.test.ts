import { describe, expect, it } from "vitest"

describe("Index exports", () => {
    it("deve exportar todos os tipos e interfaces", async () => {
        const types = await import("../types")

        expect(types).toBeDefined()
        expect(typeof types.SearchQuery).toBe("function")
        expect(typeof types.SearchFilters).toBe("function")
        expect(typeof types.SearchResult).toBe("function")
        expect(typeof types.MomentSearchResult).toBe("function")
    })

    it("deve exportar todas as configurações", async () => {
        const config = await import("../config")

        expect(config).toBeDefined()
        expect(config.defaultSearchConfig).toBeDefined()
        expect(config.searchRules).toBeDefined()
        expect(config.searchIndexes).toBeDefined()
        expect(config.searchCache).toBeDefined()
    })

    it("deve exportar o motor principal", async () => {
        const engine = await import("../moment.search.engine")

        expect(engine).toBeDefined()
        expect(engine.MomentSearchEngine).toBeDefined()
    })

    it("deve exportar todos os engines especializados", async () => {
        const engines = await import("../engines/filter.engine")
        const hashtagSearcher = await import("../engines/hashtag.searcher")
        const locationSearcher = await import("../engines/location.searcher")
        const rankingEngine = await import("../engines/ranking.engine")
        const textSearcher = await import("../engines/text.searcher")

        expect(engines.FilterEngine).toBeDefined()
        expect(hashtagSearcher.HashtagSearcher).toBeDefined()
        expect(locationSearcher.LocationSearcher).toBeDefined()
        expect(rankingEngine.RankingEngine).toBeDefined()
        expect(textSearcher.TextSearcher).toBeDefined()
    })

    it("deve exportar cache", async () => {
        const cache = await import("../cache/search.cache")

        expect(cache).toBeDefined()
        expect(cache.SearchCache).toBeDefined()
    })

    it("deve permitir importação de todos os módulos", async () => {
        // Teste de importação completa do módulo
        const momentSearchEngine = await import("../index")

        expect(momentSearchEngine).toBeDefined()
        expect(momentSearchEngine.MomentSearchEngine).toBeDefined()
        expect(momentSearchEngine.FilterEngine).toBeDefined()
        expect(momentSearchEngine.HashtagSearcher).toBeDefined()
        expect(momentSearchEngine.LocationSearcher).toBeDefined()
        expect(momentSearchEngine.RankingEngine).toBeDefined()
        expect(momentSearchEngine.TextSearcher).toBeDefined()
    })
})
