import { beforeEach, describe, expect, it } from "vitest"
import { SearchContext, SearchEngineConfig, SearchQuery } from "../types"

import { defaultSearchConfig } from "../config"
import { MomentSearchEngine } from "../moment.search.engine"

describe("MomentSearchEngine", () => {
    let searchEngine: MomentSearchEngine
    let mockQuery: SearchQuery
    let mockContext: SearchContext

    beforeEach(() => {
        searchEngine = new MomentSearchEngine()
        mockContext = {
            userId: "user123",
            userLocation: { latitude: -23.5505, longitude: -46.6333 },
        }
    })

    describe("search", () => {
        it("deve executar busca com sucesso", async () => {
            mockQuery = {
                term: "vídeo sobre vlog",
                filters: {},
                pagination: { limit: 20, offset: 0 },
            }

            const result = await searchEngine.search(mockQuery, mockContext)

            expect(result.moments).toBeDefined()
            expect(result.total).toBeGreaterThanOrEqual(0)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(20)
            expect(result.searchTime).toBeGreaterThan(0)
            expect(result.suggestions).toBeDefined()
        })

        it("deve aplicar filtros padrão", async () => {
            mockQuery = {
                term: "vídeo sobre vlog",
                filters: {},
                pagination: { limit: 20, offset: 0 },
            }

            const result = await searchEngine.search(mockQuery, mockContext)
            expect(result.filters).toBeDefined()
        })

        it("deve executar buscas em paralelo", async () => {
            mockQuery = {
                term: "vídeo sobre #vlog",
                filters: {
                    location: {
                        latitude: -23.5505,
                        longitude: -46.6333,
                        radius: 10,
                    },
                },
                pagination: { limit: 20, offset: 0 },
            }

            const result = await searchEngine.search(mockQuery, mockContext)
            expect(result.moments).toBeDefined()
        })

        it("deve aplicar paginação", async () => {
            mockQuery = {
                term: "vídeo sobre vlog",
                filters: {},
                pagination: { limit: 5, offset: 0 },
            }

            const result = await searchEngine.search(mockQuery, mockContext)
            expect(result.limit).toBe(5)
            expect(result.moments.length).toBeLessThanOrEqual(5)
        })

        it("deve gerar sugestões", async () => {
            mockQuery = {
                term: "vídeo sobre vlog",
                filters: {},
                pagination: { limit: 20, offset: 0 },
            }

            const result = await searchEngine.search(mockQuery, mockContext)
            expect(result.suggestions).toBeDefined()
            expect(Array.isArray(result.suggestions)).toBe(true)
        })

        it("deve lançar erro para termo vazio", async () => {
            mockQuery = {
                term: "",
                filters: {},
                pagination: { limit: 20, offset: 0 },
            }

            await expect(searchEngine.search(mockQuery, mockContext)).rejects.toThrow(
                "Termo de busca é obrigatório",
            )
        })

        it("deve lançar erro para termo muito curto", async () => {
            mockQuery = {
                term: "a",
                filters: {},
                pagination: { limit: 20, offset: 0 },
            }

            await expect(searchEngine.search(mockQuery, mockContext)).rejects.toThrow(
                "Termo de busca deve ter pelo menos",
            )
        })

        it("deve lançar erro para limite muito alto", async () => {
            mockQuery = {
                term: "vídeo sobre vlog",
                filters: {},
                pagination: { limit: 150, offset: 0 },
            }

            await expect(searchEngine.search(mockQuery, mockContext)).rejects.toThrow(
                "Limite não pode exceder",
            )
        })
    })

    describe("validateQuery", () => {
        it("deve validar query correta", () => {
            const query = { term: "vídeo sobre vlog" }
            expect(() => searchEngine["validateQuery"](query)).not.toThrow()
        })

        it("deve lançar erro para termo vazio", () => {
            const query = { term: "" }
            expect(() => searchEngine["validateQuery"](query)).toThrow(
                "Termo de busca é obrigatório",
            )
        })

        it("deve lançar erro para termo muito curto", () => {
            const query = { term: "a" }
            expect(() => searchEngine["validateQuery"](query)).toThrow(
                "Termo de busca deve ter pelo menos",
            )
        })

        it("deve lançar erro para termo muito longo", () => {
            const query = { term: "a".repeat(101) }
            expect(() => searchEngine["validateQuery"](query)).toThrow(
                "Termo de busca não pode exceder",
            )
        })

        it("deve lançar erro para limite muito alto", () => {
            const query = {
                term: "vídeo sobre vlog",
                pagination: { limit: 150 },
            }
            expect(() => searchEngine["validateQuery"](query)).toThrow("Limite não pode exceder")
        })
    })

    describe("mergeFilters", () => {
        it("deve mesclar filtros com padrões", () => {
            const filters = { status: ["DRAFT"] }
            const merged = searchEngine["mergeFilters"](filters)

            expect(merged.status).toEqual(["DRAFT"])
            expect(merged.visibility).toEqual(["PUBLIC", "FOLLOWERS"])
        })

        it("deve usar filtros padrão quando não fornecidos", () => {
            const merged = searchEngine["mergeFilters"]()

            expect(merged.status).toEqual(["PUBLISHED"])
            expect(merged.visibility).toEqual(["PUBLIC", "FOLLOWERS"])
        })

        it("deve sobrescrever filtros padrão", () => {
            const filters = {
                status: ["DRAFT"],
                visibility: ["PRIVATE"],
            }
            const merged = searchEngine["mergeFilters"](filters)

            expect(merged.status).toEqual(["DRAFT"])
            expect(merged.visibility).toEqual(["PRIVATE"])
        })
    })

    describe("executeParallelSearches", () => {
        it("deve executar busca textual", async () => {
            const query = { term: "vídeo sobre vlog", filters: {} }
            const results = await searchEngine["executeParallelSearches"](query, mockContext)

            expect(results).toBeDefined()
            expect(Array.isArray(results)).toBe(true)
        })

        it("deve executar busca por localização quando especificada", async () => {
            const query = {
                term: "vídeo sobre vlog",
                filters: {
                    location: {
                        latitude: -23.5505,
                        longitude: -46.6333,
                        radius: 10,
                    },
                },
            }
            const results = await searchEngine["executeParallelSearches"](query, mockContext)

            expect(results).toBeDefined()
            expect(Array.isArray(results)).toBe(true)
        })

        it("deve executar busca por hashtags quando detectada", async () => {
            const query = { term: "vídeo sobre #vlog", filters: {} }
            const results = await searchEngine["executeParallelSearches"](query, mockContext)

            expect(results).toBeDefined()
            expect(Array.isArray(results)).toBe(true)
        })
    })

    describe("hasHashtags", () => {
        it("deve detectar hashtags no termo", () => {
            const hasHashtags = searchEngine["hasHashtags"]("vídeo sobre #vlog")
            expect(hasHashtags).toBe(true)
        })

        it("deve detectar ausência de hashtags", () => {
            const hasHashtags = searchEngine["hasHashtags"]("vídeo sobre vlog")
            expect(hasHashtags).toBe(false)
        })

        it("deve detectar múltiplas hashtags", () => {
            const hasHashtags = searchEngine["hasHashtags"]("vídeo sobre #vlog #lifestyle")
            expect(hasHashtags).toBe(true)
        })
    })

    describe("combineResults", () => {
        it("deve combinar resultados de múltiplas buscas", () => {
            const searchResults = [
                [
                    { id: "moment1", title: "Momento 1" } as any,
                    { id: "moment2", title: "Momento 2" } as any,
                ],
                [
                    { id: "moment2", title: "Momento 2" } as any,
                    { id: "moment3", title: "Momento 3" } as any,
                ],
            ]

            const combined = searchEngine["combineResults"](searchResults)
            expect(combined).toHaveLength(3) // Deduplicado
        })

        it("deve deduplicar resultados", () => {
            const searchResults = [
                [{ id: "moment1", title: "Momento 1" } as any],
                [{ id: "moment1", title: "Momento 1" } as any],
            ]

            const combined = searchEngine["combineResults"](searchResults)
            expect(combined).toHaveLength(1)
        })
    })

    describe("applyPagination", () => {
        it("deve aplicar paginação corretamente", () => {
            const results = [
                { id: "moment1" } as any,
                { id: "moment2" } as any,
                { id: "moment3" } as any,
                { id: "moment4" } as any,
                { id: "moment5" } as any,
            ]

            const paginated = searchEngine["applyPagination"](results, { limit: 2, offset: 1 })
            expect(paginated).toHaveLength(2)
            expect(paginated[0].id).toBe("moment2")
        })

        it("deve usar limite padrão", () => {
            const results = Array(30)
                .fill(null)
                .map((_, i) => ({ id: `moment${i}` } as any))

            const paginated = searchEngine["applyPagination"](results)
            expect(paginated).toHaveLength(20) // Limite padrão
        })

        it("deve retornar array vazio para offset maior que resultados", () => {
            const results = [{ id: "moment1" } as any]

            const paginated = searchEngine["applyPagination"](results, { limit: 10, offset: 5 })
            expect(paginated).toHaveLength(0)
        })
    })

    describe("calculatePage", () => {
        it("deve calcular página corretamente", () => {
            const page = searchEngine["calculatePage"]({ limit: 20, offset: 0 })
            expect(page).toBe(1)
        })

        it("deve calcular página para offset", () => {
            const page = searchEngine["calculatePage"]({ limit: 20, offset: 40 })
            expect(page).toBe(3)
        })

        it("deve usar limite padrão", () => {
            const page = searchEngine["calculatePage"]({ offset: 20 })
            expect(page).toBe(2)
        })
    })

    describe("calculateTotalPages", () => {
        it("deve calcular total de páginas corretamente", () => {
            const totalPages = searchEngine["calculateTotalPages"](100, 20)
            expect(totalPages).toBe(5)
        })

        it("deve arredondar para cima", () => {
            const totalPages = searchEngine["calculateTotalPages"](101, 20)
            expect(totalPages).toBe(6)
        })

        it("deve retornar 1 para total 0", () => {
            const totalPages = searchEngine["calculateTotalPages"](0, 20)
            expect(totalPages).toBe(0)
        })
    })

    describe("generateSuggestions", () => {
        it("deve gerar sugestões", async () => {
            const suggestions = await searchEngine["generateSuggestions"]("vlog")
            expect(suggestions).toBeDefined()
            expect(Array.isArray(suggestions)).toBe(true)
            expect(suggestions.length).toBeGreaterThan(0)
        })

        it("deve incluir termo original nas sugestões", async () => {
            const suggestions = await searchEngine["generateSuggestions"]("vlog")
            expect(suggestions.some((s) => s.includes("vlog"))).toBe(true)
        })
    })

    describe("buildAppliedFilters", () => {
        it("deve construir filtros aplicados", () => {
            const filters = {
                status: ["PUBLISHED"],
                visibility: ["PUBLIC"],
                dateFrom: new Date("2024-01-01"),
                dateTo: new Date("2024-12-31"),
                location: { latitude: -23.5505, longitude: -46.6333, radius: 10 },
                hashtags: ["vlog"],
                minLikes: 10,
                minViews: 100,
                minComments: 5,
            }

            const applied = searchEngine["buildAppliedFilters"](filters)

            expect(applied.status).toEqual(["PUBLISHED"])
            expect(applied.visibility).toEqual(["PUBLIC"])
            expect(applied.dateRange).toBeDefined()
            expect(applied.location).toBeDefined()
            expect(applied.hashtags).toEqual(["vlog"])
            expect(applied.quality.minLikes).toBe(10)
        })
    })

    describe("updateStats", () => {
        it("deve atualizar estatísticas", () => {
            const initialStats = searchEngine.getStats()
            searchEngine["updateStats"](100)
            const updatedStats = searchEngine.getStats()

            expect(updatedStats.averageResponseTime).toBeGreaterThan(
                initialStats.averageResponseTime,
            )
        })
    })

    describe("getStats", () => {
        it("deve retornar estatísticas", () => {
            const stats = searchEngine.getStats()

            expect(stats.totalSearches).toBeDefined()
            expect(stats.averageResponseTime).toBeDefined()
            expect(stats.cacheHitRate).toBeDefined()
            expect(stats.errorRate).toBeDefined()
            expect(stats.topQueries).toBeDefined()
            expect(stats.performanceMetrics).toBeDefined()
        })
    })

    describe("resetStats", () => {
        it("deve resetar estatísticas", () => {
            searchEngine["updateStats"](100)
            searchEngine.resetStats()

            const stats = searchEngine.getStats()
            expect(stats.totalSearches).toBe(0)
            expect(stats.averageResponseTime).toBe(0)
        })
    })

    describe("updateConfig", () => {
        it("deve atualizar configuração", () => {
            const newConfig = { maxResults: 200, defaultLimit: 50 }
            searchEngine.updateConfig(newConfig)

            const config = searchEngine.getConfig()
            expect(config.maxResults).toBe(200)
            expect(config.defaultLimit).toBe(50)
        })
    })

    describe("getConfig", () => {
        it("deve retornar configuração", () => {
            const config = searchEngine.getConfig()

            expect(config.maxResults).toBeDefined()
            expect(config.defaultLimit).toBeDefined()
            expect(config.timeout).toBeDefined()
            expect(config.cacheEnabled).toBeDefined()
            expect(config.rankingWeights).toBeDefined()
        })
    })

    describe("constructor", () => {
        it("deve criar instância com configuração padrão", () => {
            const engine = new MomentSearchEngine()
            const config = engine.getConfig()

            expect(config.maxResults).toBe(defaultSearchConfig.maxResults)
            expect(config.defaultLimit).toBe(defaultSearchConfig.defaultLimit)
        })

        it("deve criar instância com configuração personalizada", () => {
            const customConfig: SearchEngineConfig = {
                ...defaultSearchConfig,
                maxResults: 200,
                defaultLimit: 50,
            }

            const engine = new MomentSearchEngine(customConfig)
            const config = engine.getConfig()

            expect(config.maxResults).toBe(200)
            expect(config.defaultLimit).toBe(50)
        })
    })
})
