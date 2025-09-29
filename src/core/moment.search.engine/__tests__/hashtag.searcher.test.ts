import { beforeEach, describe, expect, it } from "vitest"
import { SearchContext, SearchQuery } from "../types"

import { HashtagSearcher } from "../engines/hashtag.searcher"

describe("HashtagSearcher", () => {
    let hashtagSearcher: HashtagSearcher
    let mockQuery: SearchQuery
    let mockContext: SearchContext

    beforeEach(() => {
        hashtagSearcher = new HashtagSearcher()
        mockContext = {
            userId: "user123",
            userLocation: { latitude: -23.5505, longitude: -46.6333 },
        }
    })

    describe("search", () => {
        it("deve retornar array vazio quando não há hashtags", async () => {
            mockQuery = {
                term: "texto sem hashtags",
                filters: {},
            }

            const result = await hashtagSearcher.search(mockQuery, mockContext)
            expect(result).toEqual([])
        })

        it("deve buscar por hashtags no termo", async () => {
            mockQuery = {
                term: "vídeo sobre #vlog #lifestyle",
                filters: {},
            }

            const result = await hashtagSearcher.search(mockQuery, mockContext)
            expect(result).toHaveLength(2)
            expect(result[0].hashtags).toContain("vlog")
            expect(result[0].hashtags).toContain("lifestyle")
        })

        it("deve buscar por hashtags nos filtros", async () => {
            mockQuery = {
                term: "texto qualquer",
                filters: {
                    hashtags: ["travel", "adventure"],
                },
            }

            const result = await hashtagSearcher.search(mockQuery, mockContext)
            expect(result).toHaveLength(2)
        })

        it("deve combinar hashtags do termo e filtros", async () => {
            mockQuery = {
                term: "vídeo sobre #vlog",
                filters: {
                    hashtags: ["lifestyle"],
                },
            }

            const result = await hashtagSearcher.search(mockQuery, mockContext)
            expect(result).toHaveLength(2)
        })

        it("deve excluir hashtags especificadas", async () => {
            mockQuery = {
                term: "vídeo sobre #vlog #lifestyle",
                filters: {
                    excludeHashtags: ["lifestyle"],
                },
            }

            const result = await hashtagSearcher.search(mockQuery, mockContext)
            expect(result).toHaveLength(1)
            expect(result[0].hashtags).not.toContain("lifestyle")
        })

        it("deve calcular relevância de hashtags corretamente", async () => {
            mockQuery = {
                term: "vídeo sobre #vlog",
                filters: {},
            }

            const result = await hashtagSearcher.search(mockQuery, mockContext)
            expect(result[0].relevance.breakdown.textual).toBeGreaterThan(0)
        })

        it("deve recalcular score geral", async () => {
            mockQuery = {
                term: "vídeo sobre #vlog",
                filters: {},
            }

            const result = await hashtagSearcher.search(mockQuery, mockContext)
            expect(result[0].relevance.score).toBeGreaterThan(0)
        })

        it("deve lançar erro para hashtags inválidas", async () => {
            mockQuery = {
                term: "texto",
                filters: {
                    hashtags: Array(15).fill("hashtag"), // Mais que o limite
                },
            }

            await expect(hashtagSearcher.search(mockQuery, mockContext)).rejects.toThrow(
                "Hashtags inválidas",
            )
        })
    })

    describe("extractHashtags", () => {
        it("deve extrair hashtags do termo", () => {
            const hashtags = hashtagSearcher["extractHashtags"](
                "vídeo sobre #vlog #lifestyle #travel",
            )
            expect(hashtags).toEqual(["vlog", "lifestyle", "travel"])
        })

        it("deve retornar array vazio quando não há hashtags", () => {
            const hashtags = hashtagSearcher["extractHashtags"]("texto sem hashtags")
            expect(hashtags).toEqual([])
        })

        it("deve limitar número de hashtags", () => {
            const term = Array(15).fill("#hashtag").join(" ")
            const hashtags = hashtagSearcher["extractHashtags"](term)
            expect(hashtags).toHaveLength(10) // Limite máximo
        })

        it("deve remover # das hashtags", () => {
            const hashtags = hashtagSearcher["extractHashtags"]("#vlog #lifestyle")
            expect(hashtags).toEqual(["vlog", "lifestyle"])
        })
    })

    describe("isValidHashtags", () => {
        it("deve validar hashtags corretas", () => {
            const isValid = hashtagSearcher["isValidHashtags"](["vlog", "lifestyle", "travel"])
            expect(isValid).toBe(true)
        })

        it("deve rejeitar array vazio", () => {
            const isValid = hashtagSearcher["isValidHashtags"]([])
            expect(isValid).toBe(false)
        })

        it("deve rejeitar muitas hashtags", () => {
            const hashtags = Array(15).fill("hashtag")
            const isValid = hashtagSearcher["isValidHashtags"](hashtags)
            expect(isValid).toBe(false)
        })

        it("deve rejeitar hashtags com caracteres inválidos", () => {
            const isValid = hashtagSearcher["isValidHashtags"](["vlog!", "life-style"])
            expect(isValid).toBe(false)
        })

        it("deve rejeitar hashtags muito longas", () => {
            const longHashtag = "a".repeat(51)
            const isValid = hashtagSearcher["isValidHashtags"]([longHashtag])
            expect(isValid).toBe(false)
        })
    })

    describe("calculateHashtagRelevance", () => {
        const mockResult = {
            id: "moment1",
            title: "Momento",
            description: "Descrição",
            hashtags: ["vlog", "lifestyle"],
            ownerId: "user1",
            ownerUsername: "user1",
            createdAt: new Date(),
            updatedAt: new Date(),
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
        }

        it("deve calcular relevância baseada em matches", () => {
            const relevance = hashtagSearcher["calculateHashtagRelevance"](mockResult, [
                "vlog",
                "lifestyle",
            ])
            expect(relevance).toBe(1.0) // Match perfeito
        })

        it("deve calcular relevância parcial", () => {
            const relevance = hashtagSearcher["calculateHashtagRelevance"](mockResult, [
                "vlog",
                "travel",
            ])
            expect(relevance).toBe(0.5) // 1 de 2 matches
        })

        it("deve retornar 0 para hashtags vazias", () => {
            const relevance = hashtagSearcher["calculateHashtagRelevance"](mockResult, [])
            expect(relevance).toBe(0)
        })

        it("deve dar bonus para hashtags populares", () => {
            const relevance = hashtagSearcher["calculateHashtagRelevance"](mockResult, ["vlog"])
            expect(relevance).toBeGreaterThan(0.5) // Base score + popularity bonus
        })
    })

    describe("calculateOverallScore", () => {
        it("deve calcular score geral corretamente", () => {
            const breakdown = {
                textual: 0.8,
                engagement: 0.7,
                recency: 0.9,
                quality: 0.8,
                proximity: 0.5,
            }

            const score = hashtagSearcher["calculateOverallScore"](breakdown)
            expect(score).toBeCloseTo(0.755, 3) // (0.8*0.4) + (0.7*0.25) + (0.9*0.2) + (0.8*0.1) + (0.5*0.05)
        })

        it("deve lidar com breakdown incompleto", () => {
            const breakdown = {
                textual: 0.8,
                engagement: 0.7,
            }

            const score = hashtagSearcher["calculateOverallScore"](breakdown)
            expect(score).toBeCloseTo(0.495, 3) // (0.8*0.4) + (0.7*0.25)
        })
    })

    describe("getMockHashtagResults", () => {
        it("deve retornar resultados mockados", () => {
            const results = hashtagSearcher["getMockHashtagResults"](["vlog"], [])
            expect(results).toHaveLength(2)
            expect(results[0].hashtags).toContain("vlog")
        })

        it("deve filtrar hashtags excluídas", () => {
            const results = hashtagSearcher["getMockHashtagResults"](
                ["vlog", "lifestyle"],
                ["lifestyle"],
            )
            expect(results).toHaveLength(1)
            expect(results[0].hashtags).not.toContain("lifestyle")
        })
    })
})
