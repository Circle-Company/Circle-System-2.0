import { beforeEach, describe, expect, it } from "vitest"
import { MomentSearchResult, SearchContext, SearchEngineConfig } from "../types"

import { defaultSearchConfig } from "../config"
import { RankingEngine } from "../engines/ranking.engine"

describe("RankingEngine", () => {
    let rankingEngine: RankingEngine
    let mockResults: MomentSearchResult[]
    let mockContext: SearchContext

    beforeEach(() => {
        rankingEngine = new RankingEngine()
        mockContext = {
            userId: "user123",
            userPreferences: {
                interests: ["vlog", "lifestyle"],
                blockedUsers: ["blocked_user"],
                mutedUsers: ["muted_user"],
            },
        }

        mockResults = [
            {
                id: "moment1",
                title: "Momento 1",
                description: "Descrição do momento 1",
                hashtags: ["vlog", "lifestyle"],
                ownerId: "user1",
                ownerUsername: "user1",
                createdAt: new Date(Date.now() - 3600000), // 1 hora atrás
                updatedAt: new Date(Date.now() - 3600000),
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
                createdAt: new Date(Date.now() - 86400000), // 1 dia atrás
                updatedAt: new Date(Date.now() - 86400000),
                status: "PUBLISHED",
                visibility: "PUBLIC",
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
                ownerId: "blocked_user", // Usuário bloqueado
                ownerUsername: "blocked_user",
                createdAt: new Date(Date.now() - 7200000), // 2 horas atrás
                updatedAt: new Date(Date.now() - 7200000),
                status: "PUBLISHED",
                visibility: "PUBLIC",
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

    describe("rank", () => {
        it("deve ranquear resultados corretamente", async () => {
            const result = await rankingEngine.rank(mockResults, mockContext)
            expect(result).toHaveLength(3)
            expect(result[0].relevance.score).toBeGreaterThanOrEqual(result[1].relevance.score)
            expect(result[1].relevance.score).toBeGreaterThanOrEqual(result[2].relevance.score)
        })

        it("deve calcular scores de engajamento", async () => {
            const result = await rankingEngine.rank(mockResults, mockContext)
            expect(result[0].relevance.breakdown.engagement).toBeGreaterThan(0)
            expect(result[0].relevance.breakdown.engagement).toBeLessThanOrEqual(1)
        })

        it("deve calcular scores de recência", async () => {
            const result = await rankingEngine.rank(mockResults, mockContext)
            expect(result[0].relevance.breakdown.recency).toBeGreaterThan(0)
            expect(result[0].relevance.breakdown.recency).toBeLessThanOrEqual(1)
        })

        it("deve calcular scores de qualidade", async () => {
            const result = await rankingEngine.rank(mockResults, mockContext)
            expect(result[0].relevance.breakdown.quality).toBeGreaterThan(0)
            expect(result[0].relevance.breakdown.quality).toBeLessThanOrEqual(1)
        })

        it("deve recalcular scores gerais", async () => {
            const result = await rankingEngine.rank(mockResults, mockContext)
            expect(result[0].relevance.score).toBeGreaterThan(0)
            expect(result[0].relevance.score).toBeLessThanOrEqual(1)
        })

        it("deve ordenar por score decrescente", async () => {
            const result = await rankingEngine.rank(mockResults, mockContext)
            for (let i = 0; i < result.length - 1; i++) {
                expect(result[i].relevance.score).toBeGreaterThanOrEqual(
                    result[i + 1].relevance.score,
                )
            }
        })
    })

    describe("calculateEngagementScore", () => {
        it("deve calcular score de engajamento baseado em métricas", () => {
            const result = mockResults[0]
            const score = rankingEngine["calculateEngagementScore"](result)
            expect(score).toBeGreaterThan(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("deve dar score maior para conteúdo com mais engajamento", () => {
            const highEngagement = {
                ...mockResults[0],
                metrics: { views: 10000, likes: 1000, comments: 500, shares: 200 },
            }
            const lowEngagement = {
                ...mockResults[0],
                metrics: { views: 100, likes: 5, comments: 2, shares: 1 },
            }

            const highScore = rankingEngine["calculateEngagementScore"](highEngagement)
            const lowScore = rankingEngine["calculateEngagementScore"](lowEngagement)

            expect(highScore).toBeGreaterThan(lowScore)
        })

        it("deve considerar taxa de engajamento", () => {
            const highRate = {
                ...mockResults[0],
                metrics: { views: 1000, likes: 500, comments: 200, shares: 100 },
            }
            const lowRate = {
                ...mockResults[0],
                metrics: { views: 10000, likes: 100, comments: 50, shares: 20 },
            }

            const highScore = rankingEngine["calculateEngagementScore"](highRate)
            const lowScore = rankingEngine["calculateEngagementScore"](lowRate)

            expect(highScore).toBeGreaterThan(lowScore)
        })
    })

    describe("calculateRecencyScore", () => {
        it("deve dar score máximo para conteúdo muito recente", () => {
            const recent = { ...mockResults[0], createdAt: new Date(Date.now() - 30000) } // 30 segundos atrás
            const score = rankingEngine["calculateRecencyScore"](recent)
            expect(score).toBe(1.0)
        })

        it("deve dar score alto para conteúdo do último dia", () => {
            const recent = { ...mockResults[0], createdAt: new Date(Date.now() - 3600000) } // 1 hora atrás
            const score = rankingEngine["calculateRecencyScore"](recent)
            expect(score).toBe(0.9)
        })

        it("deve dar score médio para conteúdo da semana", () => {
            const recent = { ...mockResults[0], createdAt: new Date(Date.now() - 86400000) } // 1 dia atrás
            const score = rankingEngine["calculateRecencyScore"](recent)
            expect(score).toBe(0.9)
        })

        it("deve dar score baixo para conteúdo antigo", () => {
            const old = { ...mockResults[0], createdAt: new Date(Date.now() - 2592000000) } // 30 dias atrás
            const score = rankingEngine["calculateRecencyScore"](old)
            expect(score).toBe(0.5)
        })

        it("deve usar data de atualização se mais recente", () => {
            const updated = {
                ...mockResults[0],
                createdAt: new Date(Date.now() - 86400000), // 1 dia atrás
                updatedAt: new Date(Date.now() - 3600000), // 1 hora atrás
            }
            const score = rankingEngine["calculateRecencyScore"](updated)
            expect(score).toBe(0.9) // Baseado na data de atualização
        })
    })

    describe("calculateQualityScore", () => {
        it("deve dar score base de 0.5", () => {
            const basic = { ...mockResults[0], title: "", description: "", hashtags: [] }
            const score = rankingEngine["calculateQualityScore"](basic)
            expect(score).toBe(0.5)
        })

        it("deve dar bonus por título descritivo", () => {
            const withTitle = { ...mockResults[0], title: "Título muito descritivo e detalhado" }
            const score = rankingEngine["calculateQualityScore"](withTitle)
            expect(score).toBeGreaterThan(0.5)
        })

        it("deve dar bonus por descrição detalhada", () => {
            const withDescription = {
                ...mockResults[0],
                description: "Descrição muito detalhada e informativa sobre o conteúdo do momento",
            }
            const score = rankingEngine["calculateQualityScore"](withDescription)
            expect(score).toBeGreaterThan(0.5)
        })

        it("deve dar bonus por hashtags", () => {
            const withHashtags = {
                ...mockResults[0],
                hashtags: ["vlog", "lifestyle", "travel", "adventure"],
            }
            const score = rankingEngine["calculateQualityScore"](withHashtags)
            expect(score).toBeGreaterThan(0.5)
        })

        it("deve dar bonus por localização", () => {
            const withLocation = {
                ...mockResults[0],
                location: { latitude: -23.5505, longitude: -46.6333, address: "São Paulo" },
            }
            const score = rankingEngine["calculateQualityScore"](withLocation)
            expect(score).toBeGreaterThan(0.5)
        })

        it("deve dar bonus por mídia com duração", () => {
            const withDuration = {
                ...mockResults[0],
                media: { ...mockResults[0].media, duration: 300 },
            }
            const score = rankingEngine["calculateQualityScore"](withDuration)
            expect(score).toBeGreaterThan(0.5)
        })

        it("deve penalizar conteúdo não publicado", () => {
            const draft = { ...mockResults[0], status: "DRAFT" }
            const score = rankingEngine["calculateQualityScore"](draft)
            expect(score).toBeLessThan(0.5)
        })

        it("deve limitar score máximo em 1.0", () => {
            const perfect = {
                ...mockResults[0],
                title: "Título muito descritivo e detalhado",
                description: "Descrição muito detalhada e informativa sobre o conteúdo do momento",
                hashtags: ["vlog", "lifestyle", "travel", "adventure", "food"],
                location: { latitude: -23.5505, longitude: -46.6333, address: "São Paulo" },
                media: { ...mockResults[0].media, duration: 300 },
            }
            const score = rankingEngine["calculateQualityScore"](perfect)
            expect(score).toBeLessThanOrEqual(1.0)
        })
    })

    describe("calculateOverallScore", () => {
        it("deve calcular score geral com pesos corretos", () => {
            const breakdown = {
                textual: 0.8,
                engagement: 0.7,
                recency: 0.9,
                quality: 0.8,
                proximity: 0.5,
            }

            const score = rankingEngine["calculateOverallScore"](breakdown)
            const expected = 0.8 * 0.4 + 0.7 * 0.25 + 0.9 * 0.2 + 0.8 * 0.1 + 0.5 * 0.05
            expect(score).toBeCloseTo(expected, 3)
        })

        it("deve usar configuração personalizada", () => {
            const customConfig: SearchEngineConfig = {
                ...defaultSearchConfig,
                rankingWeights: {
                    textual: 0.5,
                    engagement: 0.3,
                    recency: 0.1,
                    quality: 0.05,
                    proximity: 0.05,
                },
            }

            const customEngine = new RankingEngine(customConfig)
            const breakdown = {
                textual: 0.8,
                engagement: 0.7,
                recency: 0.9,
                quality: 0.8,
                proximity: 0.5,
            }

            const score = customEngine["calculateOverallScore"](breakdown)
            const expected = 0.8 * 0.5 + 0.7 * 0.3 + 0.9 * 0.1 + 0.8 * 0.05 + 0.5 * 0.05
            expect(score).toBeCloseTo(expected, 3)
        })
    })

    describe("normalizeMetric", () => {
        it("deve normalizar métrica corretamente", () => {
            const normalized = rankingEngine["normalizeMetric"](50, 0, 100)
            expect(normalized).toBe(0.5)
        })

        it("deve retornar 0 para valor mínimo", () => {
            const normalized = rankingEngine["normalizeMetric"](0, 0, 100)
            expect(normalized).toBe(0)
        })

        it("deve retornar 1 para valor máximo", () => {
            const normalized = rankingEngine["normalizeMetric"](100, 0, 100)
            expect(normalized).toBe(1)
        })

        it("deve retornar 0 para min e max iguais", () => {
            const normalized = rankingEngine["normalizeMetric"](50, 100, 100)
            expect(normalized).toBe(0)
        })

        it("deve limitar valores fora do range", () => {
            const belowMin = rankingEngine["normalizeMetric"](-10, 0, 100)
            const aboveMax = rankingEngine["normalizeMetric"](150, 0, 100)

            expect(belowMin).toBe(0)
            expect(aboveMax).toBe(1)
        })
    })

    describe("applyUserContextBoost", () => {
        it("deve retornar 1.0 sem contexto de usuário", () => {
            const boost = rankingEngine["applyUserContextBoost"](mockResults[0])
            expect(boost).toBe(1.0)
        })

        it("deve dar boost por interesses do usuário", () => {
            const boost = rankingEngine["applyUserContextBoost"](mockResults[0], mockContext)
            expect(boost).toBeGreaterThan(1.0)
        })

        it("deve penalizar usuários bloqueados", () => {
            const boost = rankingEngine["applyUserContextBoost"](mockResults[2], mockContext)
            expect(boost).toBe(0.1)
        })

        it("deve penalizar usuários silenciados", () => {
            const mutedUser = { ...mockResults[0], ownerId: "muted_user" }
            const boost = rankingEngine["applyUserContextBoost"](mutedUser, mockContext)
            expect(boost).toBe(0.3)
        })

        it("deve limitar boost máximo em 2.0", () => {
            const manyInterests = {
                ...mockContext,
                userPreferences: {
                    ...mockContext.userPreferences,
                    interests: [
                        "vlog",
                        "lifestyle",
                        "travel",
                        "adventure",
                        "food",
                        "cooking",
                        "music",
                        "dance",
                        "art",
                        "photography",
                    ],
                },
            }
            const boost = rankingEngine["applyUserContextBoost"](mockResults[0], manyInterests)
            expect(boost).toBeLessThanOrEqual(2.0)
        })
    })
})
