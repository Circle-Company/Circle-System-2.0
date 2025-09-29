import { beforeEach, describe, expect, it } from "vitest"
import { SearchContext, SearchQuery } from "../types"

import { TextSearcher } from "../engines/text.searcher"

describe("TextSearcher", () => {
    let textSearcher: TextSearcher
    let mockQuery: SearchQuery
    let mockContext: SearchContext

    beforeEach(() => {
        textSearcher = new TextSearcher()
        mockContext = {
            userId: "user123",
            userLocation: { latitude: -23.5505, longitude: -46.6333 },
        }
    })

    describe("search", () => {
        it("deve buscar por termo textual válido", async () => {
            mockQuery = {
                term: "vídeo sobre vlog",
                filters: {},
            }

            const result = await textSearcher.search(mockQuery, mockContext)
            expect(result).toHaveLength(2)
            expect(result[0].relevance.breakdown.textual).toBeGreaterThan(0)
        })

        it("deve extrair hashtags do termo", async () => {
            mockQuery = {
                term: "vídeo sobre #vlog #lifestyle",
                filters: {},
            }

            const result = await textSearcher.search(mockQuery, mockContext)
            expect(result).toHaveLength(2)
        })

        it("deve calcular relevância textual", async () => {
            mockQuery = {
                term: "vídeo sobre vlog",
                filters: {},
            }

            const result = await textSearcher.search(mockQuery, mockContext)
            expect(result[0].relevance.breakdown.textual).toBeGreaterThan(0)
        })

        it("deve recalcular score geral", async () => {
            mockQuery = {
                term: "vídeo sobre vlog",
                filters: {},
            }

            const result = await textSearcher.search(mockQuery, mockContext)
            expect(result[0].relevance.score).toBeGreaterThan(0)
        })

        it("deve lançar erro para termo inválido", async () => {
            mockQuery = {
                term: "",
                filters: {},
            }

            await expect(textSearcher.search(mockQuery, mockContext)).rejects.toThrow(
                "Termo de busca inválido",
            )
        })

        it("deve lançar erro para termo muito curto", async () => {
            mockQuery = {
                term: "a",
                filters: {},
            }

            await expect(textSearcher.search(mockQuery, mockContext)).rejects.toThrow(
                "Termo de busca inválido",
            )
        })

        it("deve lançar erro para termo muito longo", async () => {
            mockQuery = {
                term: "a".repeat(101),
                filters: {},
            }

            await expect(textSearcher.search(mockQuery, mockContext)).rejects.toThrow(
                "Termo de busca inválido",
            )
        })
    })

    describe("isValidSearchTerm", () => {
        it("deve validar termo correto", () => {
            const isValid = textSearcher["isValidSearchTerm"]("vídeo sobre vlog")
            expect(isValid).toBe(true)
        })

        it("deve rejeitar termo vazio", () => {
            const isValid = textSearcher["isValidSearchTerm"]("")
            expect(isValid).toBe(false)
        })

        it("deve rejeitar termo null", () => {
            const isValid = textSearcher["isValidSearchTerm"](null as any)
            expect(isValid).toBe(false)
        })

        it("deve rejeitar termo undefined", () => {
            const isValid = textSearcher["isValidSearchTerm"](undefined as any)
            expect(isValid).toBe(false)
        })

        it("deve rejeitar termo muito curto", () => {
            const isValid = textSearcher["isValidSearchTerm"]("a")
            expect(isValid).toBe(false)
        })

        it("deve rejeitar termo muito longo", () => {
            const isValid = textSearcher["isValidSearchTerm"]("a".repeat(101))
            expect(isValid).toBe(false)
        })

        it("deve aceitar termo com espaços", () => {
            const isValid = textSearcher["isValidSearchTerm"]("  vídeo sobre vlog  ")
            expect(isValid).toBe(true)
        })
    })

    describe("normalizeSearchTerm", () => {
        it("deve normalizar termo corretamente", () => {
            const normalized = textSearcher["normalizeSearchTerm"]("  Vídeo   sobre   VLOG!!!  ")
            expect(normalized).toBe("vídeo sobre vlog")
        })

        it("deve remover caracteres especiais", () => {
            const normalized = textSearcher["normalizeSearchTerm"]("vídeo@sobre#vlog$%^&*()")
            expect(normalized).toBe("vídeosobre#vlog")
        })

        it("deve preservar hashtags e @", () => {
            const normalized = textSearcher["normalizeSearchTerm"]("vídeo #vlog @user")
            expect(normalized).toBe("vídeo #vlog @user")
        })

        it("deve converter para minúsculas", () => {
            const normalized = textSearcher["normalizeSearchTerm"]("VÍDEO SOBRE VLOG")
            expect(normalized).toBe("vídeo sobre vlog")
        })
    })

    describe("extractHashtags", () => {
        it("deve extrair hashtags do termo", () => {
            const hashtags = textSearcher["extractHashtags"]("vídeo sobre #vlog #lifestyle #travel")
            expect(hashtags).toEqual(["vlog", "lifestyle", "travel"])
        })

        it("deve retornar array vazio quando não há hashtags", () => {
            const hashtags = textSearcher["extractHashtags"]("vídeo sobre vlog")
            expect(hashtags).toEqual([])
        })

        it("deve limitar número de hashtags", () => {
            const term = Array(15).fill("#hashtag").join(" ")
            const hashtags = textSearcher["extractHashtags"](term)
            expect(hashtags).toHaveLength(10) // Limite máximo
        })

        it("deve remover # das hashtags", () => {
            const hashtags = textSearcher["extractHashtags"]("#vlog #lifestyle")
            expect(hashtags).toEqual(["vlog", "lifestyle"])
        })

        it("deve filtrar hashtags vazias", () => {
            const hashtags = textSearcher["extractHashtags"]("#vlog ## #lifestyle")
            expect(hashtags).toEqual(["vlog", "lifestyle"])
        })
    })

    describe("removeHashtags", () => {
        it("deve remover hashtags do termo", () => {
            const term = textSearcher["removeHashtags"]("vídeo sobre #vlog #lifestyle")
            expect(term).toBe("vídeo sobre")
        })

        it("deve retornar termo original quando não há hashtags", () => {
            const term = textSearcher["removeHashtags"]("vídeo sobre vlog")
            expect(term).toBe("vídeo sobre vlog")
        })

        it("deve remover espaços extras", () => {
            const term = textSearcher["removeHashtags"]("vídeo #vlog sobre")
            expect(term).toBe("vídeo sobre")
        })
    })

    describe("calculateTextualRelevance", () => {
        const mockResult = {
            id: "moment1",
            title: "Vídeo sobre vlog e lifestyle",
            description: "Descrição detalhada sobre vlog e lifestyle",
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

        it("deve calcular relevância baseada em título", () => {
            const relevance = textSearcher["calculateTextualRelevance"](mockResult, "vlog", [])
            expect(relevance).toBeGreaterThan(0)
        })

        it("deve calcular relevância baseada em descrição", () => {
            const relevance = textSearcher["calculateTextualRelevance"](mockResult, "lifestyle", [])
            expect(relevance).toBeGreaterThan(0)
        })

        it("deve calcular relevância baseada em hashtags", () => {
            const relevance = textSearcher["calculateTextualRelevance"](mockResult, "", ["vlog"])
            expect(relevance).toBeGreaterThan(0)
        })

        it("deve combinar múltiplos fatores", () => {
            const relevance = textSearcher["calculateTextualRelevance"](mockResult, "vlog", [
                "lifestyle",
            ])
            expect(relevance).toBeGreaterThan(0)
        })

        it("deve retornar score máximo para match perfeito", () => {
            const relevance = textSearcher["calculateTextualRelevance"](mockResult, "vlog", [
                "vlog",
            ])
            expect(relevance).toBeLessThanOrEqual(1.0)
        })
    })

    describe("calculateTextMatch", () => {
        it("deve retornar 1.0 para match exato", () => {
            const match = textSearcher["calculateTextMatch"]("vídeo sobre vlog", "vlog")
            expect(match).toBe(1.0)
        })

        it("deve retornar 0 para texto vazio", () => {
            const match = textSearcher["calculateTextMatch"]("", "vlog")
            expect(match).toBe(0)
        })

        it("deve retornar 0 para termo vazio", () => {
            const match = textSearcher["calculateTextMatch"]("vídeo sobre vlog", "")
            expect(match).toBe(0)
        })

        it("deve calcular match parcial por palavras", () => {
            const match = textSearcher["calculateTextMatch"](
                "vídeo sobre vlog e lifestyle",
                "vlog lifestyle",
            )
            expect(match).toBe(1.0)
        })

        it("deve calcular match parcial", () => {
            const match = textSearcher["calculateTextMatch"](
                "vídeo sobre vlog e lifestyle",
                "vlog travel",
            )
            expect(match).toBe(0.5) // 1 de 2 palavras
        })

        it("deve ser case insensitive", () => {
            const match = textSearcher["calculateTextMatch"]("Vídeo sobre VLOG", "vlog")
            expect(match).toBe(1.0)
        })
    })

    describe("calculateHashtagMatch", () => {
        it("deve calcular match de hashtags", () => {
            const match = textSearcher["calculateHashtagMatch"](["vlog", "lifestyle"], ["vlog"])
            expect(match).toBe(1.0)
        })

        it("deve retornar 0 para hashtags de busca vazias", () => {
            const match = textSearcher["calculateHashtagMatch"](["vlog", "lifestyle"], [])
            expect(match).toBe(0)
        })

        it("deve calcular match parcial", () => {
            const match = textSearcher["calculateHashtagMatch"](
                ["vlog", "lifestyle"],
                ["vlog", "travel"],
            )
            expect(match).toBe(0.5) // 1 de 2 hashtags
        })

        it("deve ser case insensitive", () => {
            const match = textSearcher["calculateHashtagMatch"](["VLOG", "LIFESTYLE"], ["vlog"])
            expect(match).toBe(1.0)
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

            const score = textSearcher["calculateOverallScore"](breakdown)
            expect(score).toBeCloseTo(0.755, 3)
        })

        it("deve lidar com breakdown incompleto", () => {
            const breakdown = {
                textual: 0.8,
                engagement: 0.7,
            }

            const score = textSearcher["calculateOverallScore"](breakdown)
            expect(score).toBeCloseTo(0.495, 3)
        })
    })

    describe("getMockResults", () => {
        it("deve retornar resultados mockados", () => {
            const results = textSearcher["getMockResults"]("vlog", ["lifestyle"])
            expect(results).toHaveLength(2)
            expect(results[0].title).toContain("vlog")
        })

        it("deve usar hashtags fornecidas", () => {
            const results = textSearcher["getMockResults"]("vlog", ["lifestyle", "travel"])
            expect(results[0].hashtags).toContain("lifestyle")
            expect(results[0].hashtags).toContain("travel")
        })

        it("deve usar hashtags padrão quando não fornecidas", () => {
            const results = textSearcher["getMockResults"]("vlog", [])
            expect(results[0].hashtags).toContain("vlog")
            expect(results[0].hashtags).toContain("lifestyle")
        })
    })
})
