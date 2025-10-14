/**
 * Testes do HybridRanker
 */

import { describe, expect, it } from "vitest"
import { HybridRanker, RankableItem } from "../core/services/hybrid.ranker"
import { EngagementVector } from "../types/embedding.generation.types"

describe("HybridRanker (New Swipe Engine)", () => {
    const ranker = new HybridRanker({
        contentWeight: 0.5,
        engagementWeight: 0.3,
        recencyWeight: 0.2,
        minSimilarity: 0.1,
    })

    describe("Ranking Híbrido", () => {
        it("deve rankear itens combinando 3 scores", () => {
            const queryEmbedding = [1, 0, 0]

            const mockEngagement: EngagementVector = {
                vector: [0.5, 0.5, 0.5],
                dimension: 3,
                metrics: {
                    views: 1000,
                    uniqueViews: 800,
                    likes: 150,
                    comments: 50,
                    shares: 30,
                    saves: 20,
                    avgWatchTime: 25,
                    completionRate: 0.75,
                    reports: 2,
                },
                features: {
                    likeRate: 0.15,
                    commentRate: 0.05,
                    shareRate: 0.03,
                    saveRate: 0.02,
                    retentionRate: 0.83,
                    avgCompletionRate: 0.75,
                    reportRate: 0.002,
                    viralityScore: 0.025,
                    qualityScore: 0.8,
                },
                metadata: {
                    lastUpdated: new Date(),
                    version: "v1",
                    calculationMethod: "normalized",
                },
            }

            const items: RankableItem[] = [
                {
                    id: "1",
                    contentEmbedding: [0.9, 0.1, 0], // Alta similaridade
                    engagementVector: mockEngagement,
                    createdAt: new Date(),
                },
                {
                    id: "2",
                    contentEmbedding: [0.1, 0.9, 0], // Baixa similaridade
                    engagementVector: mockEngagement,
                    createdAt: new Date(Date.now() - 86400000), // 1 dia atrás
                },
            ]

            const ranked = ranker.rank(queryEmbedding, items)

            expect(ranked.length).toBeGreaterThan(0)
            expect(ranked[0].score).toBeGreaterThan(0)
            expect(ranked[0].similarityScore).toBeDefined()
            expect(ranked[0].engagementScore).toBeDefined()
            expect(ranked[0].recencyScore).toBeDefined()
        })

        it("deve filtrar itens com similaridade < mínima", () => {
            const queryEmbedding = [1, 0, 0]

            const items: RankableItem[] = [
                {
                    id: "1",
                    contentEmbedding: [1, 0, 0], // 100% similar
                    createdAt: new Date(),
                },
                {
                    id: "2",
                    contentEmbedding: [0, 1, 0], // 0% similar (ortogonal)
                    createdAt: new Date(),
                },
            ]

            const ranked = ranker.rank(queryEmbedding, items)

            // Apenas item 1 deve passar (similaridade > minSimilarity)
            expect(ranked.length).toBeLessThanOrEqual(items.length)
            expect(ranked.every((item) => item.similarityScore >= 0.1)).toBe(true)
        })

        it("deve ordenar por score (maior primeiro)", () => {
            const queryEmbedding = [1, 0, 0]

            const items: RankableItem[] = [
                {
                    id: "low",
                    contentEmbedding: [0.3, 0.7, 0],
                    createdAt: new Date(Date.now() - 86400000 * 30),
                },
                {
                    id: "high",
                    contentEmbedding: [0.95, 0.05, 0],
                    createdAt: new Date(),
                },
            ]

            const ranked = ranker.rank(queryEmbedding, items)

            if (ranked.length >= 2) {
                expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score)
            }
        })
    })

    describe("Configuração", () => {
        it("deve normalizar pesos automaticamente", () => {
            const customRanker = new HybridRanker({
                contentWeight: 2,
                engagementWeight: 3,
                recencyWeight: 5, // Total = 10
            })

            const config = customRanker.getConfig()

            const totalWeight = config.contentWeight + config.engagementWeight + config.recencyWeight

            expect(totalWeight).toBeCloseTo(1, 5)
        })

        it("deve permitir atualização de config", () => {
            const testRanker = new HybridRanker()

            testRanker.updateConfig({
                contentWeight: 0.7,
                engagementWeight: 0.2,
                recencyWeight: 0.1,
            })

            const config = testRanker.getConfig()

            expect(config.contentWeight).toBeCloseTo(0.7, 1)
        })
    })

    describe("Stateless", () => {
        it("deve ser stateless", () => {
            const query = [1, 0, 0]
            const items: RankableItem[] = [
                {
                    id: "1",
                    contentEmbedding: [0.8, 0.2, 0],
                    createdAt: new Date(),
                },
            ]

            const result1 = ranker.rank(query, items)
            const result2 = ranker.rank(query, items)

            // Resultados devem ser idênticos
            expect(result1[0]?.score).toEqual(result2[0]?.score)
        })
    })
})

