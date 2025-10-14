/**
 * Testes do EngagementCalculator
 */

import { describe, expect, it } from "vitest"
import { EngagementCalculator } from "../core/services/engagement.calculator"

describe("EngagementCalculator (New Swipe Engine)", () => {
    const calculator = new EngagementCalculator()

    describe("Cálculo de Features", () => {
        it("deve calcular engagement vector com features normalizadas", async () => {
            const result = await calculator.calculate({
                momentId: "123",
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
                duration: 30,
                createdAt: new Date(),
            })

            expect(result.success).toBe(true)
            expect(result.vector).toBeDefined()
            expect(result.vector?.dimension).toBe(9)
            expect(result.vector?.features.likeRate).toBeCloseTo(0.15, 2)
            expect(result.vector?.features.commentRate).toBeCloseTo(0.05, 2)
        })

        it("deve normalizar taxas entre 0 e 1", async () => {
            const result = await calculator.calculate({
                momentId: "456",
                metrics: {
                    views: 500,
                    uniqueViews: 400,
                    likes: 75,
                    comments: 25,
                    shares: 10,
                    saves: 5,
                    avgWatchTime: 15,
                    completionRate: 0.6,
                    reports: 1,
                },
                duration: 20,
                createdAt: new Date(),
            })

            if (result.success && result.vector) {
                const { features } = result.vector

                // Todas as features devem estar entre 0 e 1
                Object.values(features).forEach((value) => {
                    expect(value).toBeGreaterThanOrEqual(0)
                    expect(value).toBeLessThanOrEqual(1)
                })
            }
        })

        it("deve calcular viralityScore corretamente", async () => {
            const result = await calculator.calculate({
                momentId: "789",
                metrics: {
                    views: 1000,
                    uniqueViews: 900,
                    likes: 100,
                    comments: 20,
                    shares: 50, // 5%
                    saves: 30, // 3%
                    avgWatchTime: 20,
                    completionRate: 0.8,
                    reports: 0,
                },
                duration: 25,
                createdAt: new Date(),
            })

            if (result.success && result.vector) {
                // viralityScore = (shareRate + saveRate) / 2
                // = (0.05 + 0.03) / 2 = 0.04
                expect(result.vector.features.viralityScore).toBeCloseTo(0.04, 2)
            }
        })
    })

    describe("Casos de Edge", () => {
        it("deve lidar com zero views", async () => {
            const result = await calculator.calculate({
                momentId: "zero",
                metrics: {
                    views: 0,
                    uniqueViews: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    saves: 0,
                    avgWatchTime: 0,
                    completionRate: 0,
                    reports: 0,
                },
                duration: 10,
                createdAt: new Date(),
            })

            expect(result.success).toBe(true)
            expect(result.vector?.features.likeRate).toBe(0)
            expect(result.vector?.features.commentRate).toBe(0)
        })

        it("deve lidar com métricas muito altas", async () => {
            const result = await calculator.calculate({
                momentId: "viral",
                metrics: {
                    views: 1000000,
                    uniqueViews: 800000,
                    likes: 500000,
                    comments: 100000,
                    shares: 50000,
                    saves: 30000,
                    avgWatchTime: 28,
                    completionRate: 0.95,
                    reports: 100,
                },
                duration: 30,
                createdAt: new Date(),
            })

            expect(result.success).toBe(true)
            if (result.vector) {
                Object.values(result.vector.features).forEach((value) => {
                    expect(value).toBeGreaterThanOrEqual(0)
                    expect(value).toBeLessThanOrEqual(1)
                })
            }
        })
    })

    describe("Stateless", () => {
        it("deve ser stateless (múltiplas chamadas independentes)", async () => {
            const result1 = await calculator.calculate({
                momentId: "1",
                metrics: {
                    views: 100,
                    uniqueViews: 80,
                    likes: 10,
                    comments: 5,
                    shares: 2,
                    saves: 1,
                    avgWatchTime: 8,
                    completionRate: 0.6,
                    reports: 0,
                },
                duration: 10,
                createdAt: new Date(),
            })

            const result2 = await calculator.calculate({
                momentId: "2",
                metrics: {
                    views: 200,
                    uniqueViews: 150,
                    likes: 30,
                    comments: 10,
                    shares: 5,
                    saves: 3,
                    avgWatchTime: 18,
                    completionRate: 0.8,
                    reports: 1,
                },
                duration: 20,
                createdAt: new Date(),
            })

            // Resultados devem ser independentes
            expect(result1.success).toBe(true)
            expect(result2.success).toBe(true)
            expect(result1.vector).not.toEqual(result2.vector)
        })
    })
})

