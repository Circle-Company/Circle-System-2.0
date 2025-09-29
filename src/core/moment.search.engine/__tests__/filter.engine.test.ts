import { beforeEach, describe, expect, it } from "vitest"
import { MomentSearchResult, SearchContext, SearchFilters } from "../types"

import { FilterEngine } from "../engines/filter.engine"

describe("FilterEngine", () => {
    let filterEngine: FilterEngine
    let mockResults: MomentSearchResult[]
    let mockContext: SearchContext

    beforeEach(() => {
        filterEngine = new FilterEngine()
        mockContext = {
            userId: "user123",
            userLocation: { latitude: -23.5505, longitude: -46.6333 },
        }

        mockResults = [
            {
                id: "moment1",
                title: "Momento 1",
                description: "Descrição do momento 1",
                hashtags: ["vlog", "lifestyle"],
                ownerId: "user1",
                ownerUsername: "user1",
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-01"),
                status: "PUBLISHED",
                visibility: "PUBLIC",
                metrics: { views: 1000, likes: 50, comments: 25, shares: 10 },
                media: { type: "video", duration: 120, thumbnail: "thumb1.jpg" },
                relevance: {
                    score: 0.8,
                    breakdown: {
                        textual: 0.8,
                        engagement: 0.7,
                        recency: 0.9,
                        quality: 0.8,
                        proximity: 0.5,
                    },
                },
            },
            {
                id: "moment2",
                title: "Momento 2",
                description: "Descrição do momento 2",
                hashtags: ["travel", "adventure"],
                ownerId: "user2",
                ownerUsername: "user2",
                createdAt: new Date("2024-01-02"),
                updatedAt: new Date("2024-01-02"),
                status: "DRAFT",
                visibility: "PRIVATE",
                metrics: { views: 500, likes: 30, comments: 15, shares: 5 },
                media: { type: "video", duration: 180, thumbnail: "thumb2.jpg" },
                relevance: {
                    score: 0.6,
                    breakdown: {
                        textual: 0.6,
                        engagement: 0.5,
                        recency: 0.7,
                        quality: 0.6,
                        proximity: 0.4,
                    },
                },
            },
            {
                id: "moment3",
                title: "Momento 3",
                description: "Descrição do momento 3",
                hashtags: ["food", "cooking"],
                ownerId: "user123", // Mesmo usuário do contexto
                ownerUsername: "user123",
                createdAt: new Date("2024-01-03"),
                updatedAt: new Date("2024-01-03"),
                status: "PUBLISHED",
                visibility: "FOLLOWERS",
                location: { latitude: -23.5505, longitude: -46.6333, address: "São Paulo" },
                metrics: { views: 2000, likes: 100, comments: 50, shares: 20 },
                media: { type: "video", duration: 90, thumbnail: "thumb3.jpg" },
                relevance: {
                    score: 0.9,
                    breakdown: {
                        textual: 0.9,
                        engagement: 0.8,
                        recency: 0.9,
                        quality: 0.9,
                        proximity: 0.8,
                    },
                },
            },
        ]
    })

    describe("filter", () => {
        it("deve retornar todos os resultados quando não há filtros", async () => {
            const filters: SearchFilters = {}
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(3)
        })

        it("deve filtrar por status", async () => {
            const filters: SearchFilters = { status: ["PUBLISHED"] }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(2)
            expect(result.every((r) => r.status === "PUBLISHED")).toBe(true)
        })

        it("deve filtrar por visibilidade", async () => {
            const filters: SearchFilters = { visibility: ["PUBLIC"] }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(1)
            expect(result[0].visibility).toBe("PUBLIC")
        })

        it("deve permitir visualização de momentos próprios independente da visibilidade", async () => {
            const filters: SearchFilters = { visibility: ["PUBLIC"] }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(2) // Inclui o momento do próprio usuário
        })

        it("deve filtrar por range de datas", async () => {
            const filters: SearchFilters = {
                dateFrom: new Date("2024-01-02"),
                dateTo: new Date("2024-01-03"),
            }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(2)
        })

        it("deve filtrar por ID do usuário", async () => {
            const filters: SearchFilters = { userId: "user1" }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(1)
            expect(result[0].ownerId).toBe("user1")
        })

        it("deve excluir usuário específico", async () => {
            const filters: SearchFilters = { excludeUserId: "user1" }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(2)
            expect(result.every((r) => r.ownerId !== "user1")).toBe(true)
        })

        it("deve filtrar por qualidade mínima", async () => {
            const filters: SearchFilters = { minLikes: 60, minViews: 800 }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("moment3")
        })

        it("deve filtrar por hashtags", async () => {
            const filters: SearchFilters = { hashtags: ["vlog", "travel"] }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(2)
        })

        it("deve excluir hashtags específicas", async () => {
            const filters: SearchFilters = { excludeHashtags: ["vlog"] }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(2)
            expect(result.every((r) => !r.hashtags.includes("vlog"))).toBe(true)
        })

        it("deve filtrar por duração", async () => {
            const filters: SearchFilters = { minDuration: 100, maxDuration: 150 }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("moment1")
        })

        it("deve filtrar por localização", async () => {
            const filters: SearchFilters = {
                location: {
                    latitude: -23.5505,
                    longitude: -46.6333,
                    radius: 1, // 1km
                },
            }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("moment3")
        })

        it("deve aplicar múltiplos filtros", async () => {
            const filters: SearchFilters = {
                status: ["PUBLISHED"],
                minLikes: 40,
                hashtags: ["vlog", "food"],
            }
            const result = await filterEngine.filter(mockResults, filters, mockContext)
            expect(result).toHaveLength(2)
        })
    })

    describe("applyDefaultFilters", () => {
        it("deve aplicar filtros padrão", async () => {
            const result = await filterEngine.applyDefaultFilters(mockResults, mockContext)
            expect(result).toHaveLength(2) // Apenas momentos publicados e públicos/seguidores
        })

        it("deve permitir momentos próprios mesmo com filtros padrão", async () => {
            const result = await filterEngine.applyDefaultFilters(mockResults, mockContext)
            const ownMoment = result.find((r) => r.ownerId === "user123")
            expect(ownMoment).toBeDefined()
        })
    })

    describe("calculateDistance", () => {
        it("deve calcular distância corretamente", () => {
            // Teste com coordenadas conhecidas (São Paulo para Rio de Janeiro)
            const distance = filterEngine["calculateDistance"](
                -23.5505,
                -46.6333,
                -22.9068,
                -43.1729,
            )
            expect(distance).toBeCloseTo(358, 0) // ~358km
        })

        it("deve retornar 0 para coordenadas iguais", () => {
            const distance = filterEngine["calculateDistance"](
                -23.5505,
                -46.6333,
                -23.5505,
                -46.6333,
            )
            expect(distance).toBe(0)
        })
    })

    describe("toRadians", () => {
        it("deve converter graus para radianos corretamente", () => {
            const radians = filterEngine["toRadians"](180)
            expect(radians).toBeCloseTo(Math.PI, 5)
        })

        it("deve converter 0 graus para 0 radianos", () => {
            const radians = filterEngine["toRadians"](0)
            expect(radians).toBe(0)
        })
    })
})
