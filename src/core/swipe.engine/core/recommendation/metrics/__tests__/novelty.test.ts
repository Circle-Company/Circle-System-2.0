import { ClusterInfo, UserInteraction } from "../../../../types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { calculateDetailedNoveltyMetrics, calculateNoveltyScore } from "../novelty"

// Mock do logger
vi.mock("../../utils/logger", () => ({
    getLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    })),
}))

describe("NoveltyMetrics", () => {
    let mockCluster: ClusterInfo
    let mockUserInteractions: UserInteraction[]
    let defaultFactors: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock do cluster
        mockCluster = {
            id: "cluster-456",
            name: "Technology Cluster",
            centroid: new Array(384).fill(0.2),
            members: ["post-1", "post-2", "post-3"],
            radius: 0.5,
            density: 0.8,
            size: 15,
            topics: ["technology", "AI", "programming", "machine learning", "data science"],
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Mock das interações do usuário
        mockUserInteractions = [
            {
                id: "interaction-1",
                userId: BigInt(123),
                entityId: BigInt(1),
                entityType: "post",
                type: "like",
                timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            },
            {
                id: "interaction-2",
                userId: BigInt(123),
                entityId: BigInt(2),
                entityType: "post",
                type: "comment",
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            },
        ]

        // Fatores padrão para novidade
        defaultFactors = {
            viewedContentWeight: 0.7,
            topicNoveltyWeight: 0.3,
            noveltyDecayPeriodDays: 30,
            similarContentDiscount: 0.5,
        }
    })

    describe("calculateNoveltyScore", () => {
        it("should calculate novelty score with valid data", () => {
            const score = calculateNoveltyScore(mockCluster, mockUserInteractions, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should return maximum novelty when no interactions", () => {
            const score = calculateNoveltyScore(mockCluster, [], defaultFactors)

            expect(score).toBe(1.0) // Maximum novelty
        })

        it("should return maximum novelty when interactions is null", () => {
            const score = calculateNoveltyScore(mockCluster, null, defaultFactors)

            expect(score).toBe(1.0) // Maximum novelty
        })

        it("should return maximum novelty when interactions is undefined", () => {
            const score = calculateNoveltyScore(mockCluster, undefined, defaultFactors)

            expect(score).toBe(1.0) // Maximum novelty
        })

        it("should calculate lower novelty for users with many interactions", () => {
            const manyInteractions = Array.from({ length: 150 }, (_, i) => ({
                id: `interaction-${i}`,
                userId: BigInt(123),
                entityId: BigInt(i),
                entityType: "post",
                type: "like",
                timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
            }))

            const score = calculateNoveltyScore(mockCluster, manyInteractions, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeLessThan(0.5) // Should be low novelty
            expect(score).toBeGreaterThanOrEqual(0.3) // But not too low
        })

        it("should calculate higher novelty for users with few interactions", () => {
            const fewInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(1),
                    entityType: "post",
                    type: "like",
                    timestamp: new Date(),
                },
            ]

            const score = calculateNoveltyScore(mockCluster, fewInteractions, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThan(0.5) // Should be high novelty
        })

        it("should handle cluster with no topics", () => {
            const clusterWithoutTopics = {
                ...mockCluster,
                topics: undefined,
            }

            const score = calculateNoveltyScore(
                clusterWithoutTopics,
                mockUserInteractions,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle cluster with empty topics", () => {
            const clusterWithEmptyTopics = {
                ...mockCluster,
                topics: [],
            }

            const score = calculateNoveltyScore(
                clusterWithEmptyTopics,
                mockUserInteractions,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle custom factors correctly", () => {
            const customFactors = {
                viewedContentWeight: 0.5,
                topicNoveltyWeight: 0.5,
                noveltyDecayPeriodDays: 14,
                similarContentDiscount: 0.3,
            }

            const score = calculateNoveltyScore(mockCluster, mockUserInteractions, customFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should normalize scores correctly with different factor weights", () => {
            const unbalancedFactors = {
                viewedContentWeight: 0.1,
                topicNoveltyWeight: 0.1,
                noveltyDecayPeriodDays: 30,
                similarContentDiscount: 0.5,
            }

            const score = calculateNoveltyScore(
                mockCluster,
                mockUserInteractions,
                unbalancedFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })
    })

    describe("calculateDetailedNoveltyMetrics", () => {
        it("should return detailed metrics for valid data", () => {
            const metrics = calculateDetailedNoveltyMetrics(mockCluster, mockUserInteractions)

            expect(metrics).toBeDefined()
            expect(metrics.contentNovelty).toBeDefined()
            expect(metrics.topicNovelty).toBeDefined()
            expect(metrics.overallNovelty).toBeDefined()

            // All metrics should be in range [0, 1]
            Object.values(metrics).forEach((value) => {
                expect(typeof value).toBe("number")
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            })
        })

        it("should handle cluster with no topics in detailed metrics", () => {
            const clusterWithoutTopics = {
                ...mockCluster,
                topics: undefined,
            }

            const metrics = calculateDetailedNoveltyMetrics(
                clusterWithoutTopics,
                mockUserInteractions,
            )

            expect(metrics).toBeDefined()
            expect(metrics.topicNovelty).toBe(0.5) // Neutral value
        })

        it("should handle cluster with empty topics in detailed metrics", () => {
            const clusterWithEmptyTopics = {
                ...mockCluster,
                topics: [],
            }

            const metrics = calculateDetailedNoveltyMetrics(
                clusterWithEmptyTopics,
                mockUserInteractions,
            )

            expect(metrics).toBeDefined()
            expect(metrics.topicNovelty).toBe(0.5) // Neutral value
        })

        it("should handle errors gracefully in detailed metrics", () => {
            const invalidCluster = {
                ...mockCluster,
                topics: null as any,
            }

            const metrics = calculateDetailedNoveltyMetrics(invalidCluster, mockUserInteractions)

            expect(metrics).toBeDefined()
            // Should return neutral values on error (mas não necessariamente 0.5 para todos)
            expect(metrics.contentNovelty).toBeDefined()
            expect(metrics.topicNovelty).toBeDefined()
            expect(metrics.overallNovelty).toBeDefined()
            expect(typeof metrics.contentNovelty).toBe("number")
            expect(typeof metrics.topicNovelty).toBe("number")
            expect(typeof metrics.overallNovelty).toBe("number")
        })

        it("should calculate content novelty correctly", () => {
            const metrics = calculateDetailedNoveltyMetrics(mockCluster, mockUserInteractions)

            expect(metrics.contentNovelty).toBeDefined()
            expect(typeof metrics.contentNovelty).toBe("number")
            expect(metrics.contentNovelty).toBeGreaterThanOrEqual(0)
            expect(metrics.contentNovelty).toBeLessThanOrEqual(1)
        })

        it("should calculate topic novelty correctly", () => {
            const metrics = calculateDetailedNoveltyMetrics(mockCluster, mockUserInteractions)

            expect(metrics.topicNovelty).toBeDefined()
            expect(typeof metrics.topicNovelty).toBe("number")
            expect(metrics.topicNovelty).toBeGreaterThanOrEqual(0)
            expect(metrics.topicNovelty).toBeLessThanOrEqual(1)
        })

        it("should calculate overall novelty correctly", () => {
            const metrics = calculateDetailedNoveltyMetrics(mockCluster, mockUserInteractions)

            expect(metrics.overallNovelty).toBeDefined()
            expect(typeof metrics.overallNovelty).toBe("number")
            expect(metrics.overallNovelty).toBeGreaterThanOrEqual(0)
            expect(metrics.overallNovelty).toBeLessThanOrEqual(1)
        })
    })

    describe("Topic Novelty Calculation", () => {
        it("should return high novelty for clusters with many topics", () => {
            const clusterWithManyTopics = {
                ...mockCluster,
                topics: Array.from({ length: 15 }, (_, i) => `topic-${i}`),
            }

            const metrics = calculateDetailedNoveltyMetrics(
                clusterWithManyTopics,
                mockUserInteractions,
            )

            expect(metrics.topicNovelty).toBeGreaterThan(0.8) // Should be high novelty
        })

        it("should return low novelty for clusters with few topics", () => {
            const clusterWithFewTopics = {
                ...mockCluster,
                topics: ["topic-1"],
            }

            const metrics = calculateDetailedNoveltyMetrics(
                clusterWithFewTopics,
                mockUserInteractions,
            )

            expect(metrics.topicNovelty).toBeLessThan(0.5) // Should be low novelty
        })

        it("should return medium novelty for clusters with moderate topics", () => {
            const clusterWithModerateTopics = {
                ...mockCluster,
                topics: ["topic-1", "topic-2", "topic-3", "topic-4", "topic-5"],
            }

            const metrics = calculateDetailedNoveltyMetrics(
                clusterWithModerateTopics,
                mockUserInteractions,
            )

            expect(metrics.topicNovelty).toBeGreaterThan(0.4)
            expect(metrics.topicNovelty).toBeLessThan(0.8)
        })

        it("should handle exactly 2 topics", () => {
            const clusterWithTwoTopics = {
                ...mockCluster,
                topics: ["topic-1", "topic-2"],
            }

            const metrics = calculateDetailedNoveltyMetrics(
                clusterWithTwoTopics,
                mockUserInteractions,
            )

            expect(metrics.topicNovelty).toBe(0.4) // Should be exactly 0.4
        })

        it("should handle exactly 10 topics", () => {
            const clusterWithTenTopics = {
                ...mockCluster,
                topics: Array.from({ length: 10 }, (_, i) => `topic-${i}`),
            }

            const metrics = calculateDetailedNoveltyMetrics(
                clusterWithTenTopics,
                mockUserInteractions,
            )

            expect(metrics.topicNovelty).toBe(0.9) // Should be exactly 0.9
        })
    })

    describe("Content Novelty Calculation", () => {
        it("should return maximum novelty for no interactions", () => {
            const metrics = calculateDetailedNoveltyMetrics(mockCluster, [])

            expect(metrics.contentNovelty).toBe(1.0) // Maximum novelty
        })

        it("should return low novelty for many interactions", () => {
            const manyInteractions = Array.from({ length: 150 }, (_, i) => ({
                id: `interaction-${i}`,
                userId: BigInt(123),
                entityId: BigInt(i),
                entityType: "post",
                type: "like",
                timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
            }))

            const metrics = calculateDetailedNoveltyMetrics(mockCluster, manyInteractions)

            expect(metrics.contentNovelty).toBeLessThan(0.5) // Should be low novelty
            expect(metrics.contentNovelty).toBeGreaterThanOrEqual(0.3) // But not too low
        })

        it("should return high novelty for few interactions", () => {
            const fewInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(1),
                    entityType: "post",
                    type: "like",
                    timestamp: new Date(),
                },
            ]

            const metrics = calculateDetailedNoveltyMetrics(mockCluster, fewInteractions)

            expect(metrics.contentNovelty).toBeGreaterThan(0.5) // Should be high novelty
        })

        it("should handle exactly 100 interactions", () => {
            const hundredInteractions = Array.from({ length: 100 }, (_, i) => ({
                id: `interaction-${i}`,
                userId: BigInt(123),
                entityId: BigInt(i),
                entityType: "post",
                type: "like",
                timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
            }))

            const metrics = calculateDetailedNoveltyMetrics(mockCluster, hundredInteractions)

            expect(metrics.contentNovelty).toBeGreaterThanOrEqual(0.3) // Should be at least minimum
            expect(metrics.contentNovelty).toBeLessThanOrEqual(0.5) // Should be at most 0.5
        })
    })

    describe("Edge Cases", () => {
        it("should handle very large interaction lists", () => {
            const veryLargeInteractions = Array.from({ length: 10000 }, (_, i) => ({
                id: `interaction-${i}`,
                userId: BigInt(123),
                entityId: BigInt(i),
                entityType: "post",
                type: "like",
                timestamp: new Date(Date.now() - i * 60 * 1000),
            }))

            const score = calculateNoveltyScore(mockCluster, veryLargeInteractions, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle very large topic lists", () => {
            const clusterWithManyTopics = {
                ...mockCluster,
                topics: Array.from({ length: 1000 }, (_, i) => `topic-${i}`),
            }

            const score = calculateNoveltyScore(
                clusterWithManyTopics,
                mockUserInteractions,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle zero weights in factors", () => {
            const zeroWeightFactors = {
                viewedContentWeight: 0,
                topicNoveltyWeight: 0,
                noveltyDecayPeriodDays: 30,
                similarContentDiscount: 0.5,
            }

            const score = calculateNoveltyScore(
                mockCluster,
                mockUserInteractions,
                zeroWeightFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            // Com todos os pesos zero, deve retornar 0.5 (neutro)
            expect(score).toBe(0.5)
        })

        it("should handle negative decay period", () => {
            const negativeDecayFactors = {
                viewedContentWeight: 0.7,
                topicNoveltyWeight: 0.3,
                noveltyDecayPeriodDays: -10,
                similarContentDiscount: 0.5,
            }

            const score = calculateNoveltyScore(
                mockCluster,
                mockUserInteractions,
                negativeDecayFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })
    })

    describe("Performance Tests", () => {
        it("should calculate novelty score efficiently", () => {
            const startTime = performance.now()

            // Calculate multiple scores
            for (let i = 0; i < 100; i++) {
                calculateNoveltyScore(mockCluster, mockUserInteractions, defaultFactors)
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            // Should complete 100 calculations in reasonable time (< 1 second)
            expect(duration).toBeLessThan(1000)
        })

        it("should handle large interaction lists efficiently", () => {
            const largeInteractions = Array.from({ length: 1000 }, (_, i) => ({
                id: `interaction-${i}`,
                userId: BigInt(123),
                entityId: BigInt(i),
                entityType: "post",
                type: "like",
                timestamp: new Date(Date.now() - i * 60 * 1000),
            }))

            const startTime = performance.now()
            const score = calculateNoveltyScore(mockCluster, largeInteractions, defaultFactors)
            const endTime = performance.now()

            expect(score).toBeDefined()
            expect(endTime - startTime).toBeLessThan(100) // Should complete quickly
        })

        it("should handle large topic lists efficiently", () => {
            const clusterWithManyTopics = {
                ...mockCluster,
                topics: Array.from({ length: 1000 }, (_, i) => `topic-${i}`),
            }

            const startTime = performance.now()
            const score = calculateNoveltyScore(
                clusterWithManyTopics,
                mockUserInteractions,
                defaultFactors,
            )
            const endTime = performance.now()

            expect(score).toBeDefined()
            expect(endTime - startTime).toBeLessThan(100) // Should complete quickly
        })
    })

    describe("Mathematical Properties", () => {
        it("should maintain score bounds", () => {
            const testCases = [
                { interactions: [], topics: [] },
                { interactions: [mockUserInteractions[0]], topics: ["topic-1"] },
                { interactions: mockUserInteractions, topics: mockCluster.topics },
            ]

            testCases.forEach((testCase) => {
                const cluster = { ...mockCluster, topics: testCase.topics }
                const score = calculateNoveltyScore(cluster, testCase.interactions, defaultFactors)

                expect(score).toBeGreaterThanOrEqual(0)
                expect(score).toBeLessThanOrEqual(1)
            })
        })

        it("should be monotonic with respect to interaction count", () => {
            const fewInteractions = mockUserInteractions.slice(0, 1)
            const manyInteractions = [
                ...mockUserInteractions,
                ...mockUserInteractions,
                ...mockUserInteractions,
            ]

            const fewScore = calculateNoveltyScore(mockCluster, fewInteractions, defaultFactors)
            const manyScore = calculateNoveltyScore(mockCluster, manyInteractions, defaultFactors)

            expect(fewScore).toBeGreaterThan(manyScore)
        })

        it("should be monotonic with respect to topic count", () => {
            const clusterWithFewTopics = { ...mockCluster, topics: ["topic-1"] }
            const clusterWithManyTopics = {
                ...mockCluster,
                topics: Array.from({ length: 20 }, (_, i) => `topic-${i}`),
            }

            const fewScore = calculateNoveltyScore(
                clusterWithFewTopics,
                mockUserInteractions,
                defaultFactors,
            )
            const manyScore = calculateNoveltyScore(
                clusterWithManyTopics,
                mockUserInteractions,
                defaultFactors,
            )

            expect(manyScore).toBeGreaterThan(fewScore)
        })
    })
})
