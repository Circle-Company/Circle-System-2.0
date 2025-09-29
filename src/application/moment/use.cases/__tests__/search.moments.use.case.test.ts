import { beforeEach, describe, expect, it } from "vitest"
import { SearchMomentsRequest, SearchMomentsUseCase } from "../search.moments.use.case"

describe("SearchMomentsUseCase", () => {
    let searchMomentsUseCase: SearchMomentsUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            // Mock methods as needed
        }

        searchMomentsUseCase = new SearchMomentsUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve buscar momentos com sucesso", async () => {
            const request: SearchMomentsRequest = {
                term: "vlog",
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.results).toBeDefined()
            expect(result.results?.moments).toBeDefined()
            expect(result.results?.total).toBeDefined()
            expect(result.results?.page).toBeDefined()
            expect(result.results?.limit).toBeDefined()
            expect(result.results?.totalPages).toBeDefined()
            expect(result.results?.searchTime).toBeDefined()
            expect(result.error).toBeUndefined()
        })

        it("deve buscar momentos com filtros", async () => {
            const request: SearchMomentsRequest = {
                term: "tutorial",
                filters: {
                    status: ["PUBLISHED"],
                    visibility: ["PUBLIC"],
                    minLikes: 10,
                    hashtags: ["tutorial", "guide"],
                },
                pagination: {
                    limit: 20,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.results).toBeDefined()
            expect(result.results?.moments).toBeDefined()
            expect(result.error).toBeUndefined()
        })

        it("deve buscar momentos com contexto do usuário", async () => {
            const request: SearchMomentsRequest = {
                term: "lifestyle",
                userId: "user_123",
                userLocation: {
                    latitude: -23.5505,
                    longitude: -46.6333,
                },
                userPreferences: {
                    languages: ["pt", "en"],
                    interests: ["vlog", "lifestyle"],
                    blockedUsers: ["user_456"],
                    mutedUsers: ["user_789"],
                },
            }

            const result = await searchMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.results).toBeDefined()
            expect(result.results?.moments).toBeDefined()
            expect(result.error).toBeUndefined()
        })

        it("deve falhar se o termo de busca for vazio", async () => {
            const request: SearchMomentsRequest = {
                term: "",
            }

            const result = await searchMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Termo de busca é obrigatório")
            expect(result.results).toBeUndefined()
        })

        it("deve falhar se o limite for inválido", async () => {
            const request: SearchMomentsRequest = {
                term: "test",
                pagination: {
                    limit: 150, // Maior que 100
                },
            }

            const result = await searchMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.results).toBeUndefined()
        })

        it("deve falhar se o offset for negativo", async () => {
            const request: SearchMomentsRequest = {
                term: "test",
                pagination: {
                    offset: -1,
                },
            }

            const result = await searchMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Offset deve ser maior ou igual a 0")
            expect(result.results).toBeUndefined()
        })

        it("deve usar paginação padrão quando não especificada", async () => {
            const request: SearchMomentsRequest = {
                term: "test",
            }

            const result = await searchMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.results).toBeDefined()
            expect(result.results?.limit).toBe(20) // Limite padrão
            expect(result.results?.page).toBe(1)
            expect(result.error).toBeUndefined()
        })
    })

    describe("getSuggestions", () => {
        it("deve retornar sugestões para termo válido", async () => {
            const suggestions = await searchMomentsUseCase.getSuggestions("vlog")

            expect(Array.isArray(suggestions)).toBe(true)
            expect(suggestions.length).toBeGreaterThan(0)
            expect(suggestions.every((suggestion) => typeof suggestion === "string")).toBe(true)
        })

        it("deve retornar array vazio para termo muito curto", async () => {
            const suggestions = await searchMomentsUseCase.getSuggestions("a")

            expect(Array.isArray(suggestions)).toBe(true)
            expect(suggestions.length).toBe(0)
        })

        it("deve retornar array vazio para termo vazio", async () => {
            const suggestions = await searchMomentsUseCase.getSuggestions("")

            expect(Array.isArray(suggestions)).toBe(true)
            expect(suggestions.length).toBe(0)
        })
    })

    describe("searchByHashtag", () => {
        it("deve buscar por hashtag com sucesso", async () => {
            const request = {
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.searchByHashtag("vlog", request)

            expect(result.success).toBe(true)
            expect(result.results).toBeDefined()
            expect(result.results?.moments).toBeDefined()
            expect(result.error).toBeUndefined()
        })

        it("deve buscar por hashtag com # no início", async () => {
            const request = {
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.searchByHashtag("#vlog", request)

            expect(result.success).toBe(true)
            expect(result.results).toBeDefined()
            expect(result.results?.moments).toBeDefined()
            expect(result.error).toBeUndefined()
        })

        it("deve falhar se hashtag for vazia", async () => {
            const request = {
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.searchByHashtag("", request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Hashtag é obrigatória")
            expect(result.results).toBeUndefined()
        })

        it("deve falhar se hashtag for apenas #", async () => {
            const request = {
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.searchByHashtag("#", request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Hashtag é obrigatória")
            expect(result.results).toBeUndefined()
        })
    })

    describe("searchByLocation", () => {
        it("deve buscar por localização com sucesso", async () => {
            const request = {
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.searchByLocation(
                -23.5505,
                -46.6333,
                10, // 10km
                request,
            )

            expect(result.success).toBe(true)
            expect(result.results).toBeDefined()
            expect(result.results?.moments).toBeDefined()
            expect(result.error).toBeUndefined()
        })

        it("deve falhar se latitude for inválida", async () => {
            const request = {
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.searchByLocation(
                null as any, // latitude inválida
                -46.6333,
                10,
                request,
            )

            expect(result.success).toBe(false)
            expect(result.error).toBe("Latitude, longitude e raio são obrigatórios")
            expect(result.results).toBeUndefined()
        })

        it("deve falhar se raio for inválido", async () => {
            const request = {
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.searchByLocation(
                -23.5505,
                -46.6333,
                0, // raio inválido
                request,
            )

            expect(result.success).toBe(false)
            expect(result.error).toBe("Raio deve estar entre 1 e 100 km")
            expect(result.results).toBeUndefined()
        })

        it("deve falhar se raio for muito grande", async () => {
            const request = {
                pagination: {
                    limit: 10,
                    offset: 0,
                },
            }

            const result = await searchMomentsUseCase.searchByLocation(
                -23.5505,
                -46.6333,
                150, // raio muito grande
                request,
            )

            expect(result.success).toBe(false)
            expect(result.error).toBe("Raio deve estar entre 1 e 100 km")
            expect(result.results).toBeUndefined()
        })
    })

    describe("getSearchStats", () => {
        it("deve retornar estatísticas de busca", async () => {
            const stats = await searchMomentsUseCase.getSearchStats()

            expect(stats).toBeDefined()
            expect(typeof stats).toBe("object")
        })
    })
})
