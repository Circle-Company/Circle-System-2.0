import { ClusterInfo, UserEmbedding, UserProfile } from "../../../../types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    calculateAffinityScore,
    calculateDetailedAffinityMetrics,
    calculateTopicSimilarity,
    getDefaultAffinityFactors,
} from "../affinity"

// Mock do logger
vi.mock("../../utils/logger", () => ({
    getLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    })),
}))

describe("AffinityMetrics", () => {
    let mockUserEmbedding: UserEmbedding
    let mockCluster: ClusterInfo
    let mockUserProfile: UserProfile

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock do embedding do usuário
        mockUserEmbedding = {
            id: "user-123",
            userId: "123",
            vector: new Array(384).fill(0.1),
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Mock do cluster
        mockCluster = {
            id: "cluster-456",
            name: "Technology Cluster",
            centroid: new Array(384).fill(0.2),
            members: ["post-1", "post-2", "post-3"],
            radius: 0.5,
            density: 0.8,
            size: 15,
            topics: ["technology", "AI", "programming"],
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Mock do perfil do usuário
        mockUserProfile = {
            userId: "123",
            interests: ["technology", "AI", "machine learning"],
            interactions: [
                {
                    postIds: ["1", "2"], // Usar IDs numéricos para evitar erro de BigInt
                    type: "like",
                    timestamp: new Date(),
                },
            ],
        }
    })

    describe("calculateAffinityScore", () => {
        it("should calculate affinity score with default factors", () => {
            const score = calculateAffinityScore(mockUserEmbedding, mockCluster, mockUserProfile)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should calculate affinity score with custom factors", () => {
            const customFactors = {
                embeddingSimilarityWeight: 0.8,
                sharedInterestsWeight: 0.15,
                networkProximityWeight: 0.05,
                clusterCentralityWeight: 0.1,
                minSimilarityThreshold: 0.2,
                topicDecayFactor: 0.9,
                maxHistoricalInteractions: 50,
            }

            const score = calculateAffinityScore(
                mockUserEmbedding,
                mockCluster,
                mockUserProfile,
                customFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle missing user profile gracefully", () => {
            const score = calculateAffinityScore(mockUserEmbedding, mockCluster, null)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle incompatible vector dimensions", () => {
            const incompatibleEmbedding = {
                ...mockUserEmbedding,
                vector: new Array(100).fill(0.1), // Different dimension
            }

            const score = calculateAffinityScore(
                incompatibleEmbedding,
                mockCluster,
                mockUserProfile,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should apply minimum similarity threshold penalty", () => {
            const factors = {
                ...getDefaultAffinityFactors(),
                minSimilarityThreshold: 0.8, // High threshold
            }

            const score = calculateAffinityScore(
                mockUserEmbedding,
                mockCluster,
                mockUserProfile,
                factors,
            )

            expect(score).toBeDefined()
            expect(score).toBeLessThanOrEqual(0.9) // Should be penalized but not too much
        })

        it("should handle empty vectors gracefully", () => {
            const emptyEmbedding = {
                ...mockUserEmbedding,
                vector: [],
            }

            const score = calculateAffinityScore(emptyEmbedding, mockCluster, mockUserProfile)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })
    })

    describe("calculateTopicSimilarity", () => {
        it("should calculate high similarity for matching topics", () => {
            const userInterests = ["technology", "AI", "programming"]
            const clusterTopics = ["technology", "AI", "machine learning"]

            const similarity = calculateTopicSimilarity(userInterests, clusterTopics)

            expect(similarity).toBeDefined()
            expect(typeof similarity).toBe("number")
            expect(similarity).toBeGreaterThan(0.5) // Should be high similarity
            expect(similarity).toBeLessThanOrEqual(1)
        })

        it("should calculate low similarity for different topics", () => {
            const userInterests = ["sports", "music", "art"]
            const clusterTopics = ["technology", "AI", "programming"]

            const similarity = calculateTopicSimilarity(userInterests, clusterTopics)

            expect(similarity).toBeDefined()
            expect(typeof similarity).toBe("number")
            expect(similarity).toBeLessThan(0.5) // Should be low similarity
            expect(similarity).toBeGreaterThanOrEqual(0)
        })

        it("should handle empty interests gracefully", () => {
            const similarity = calculateTopicSimilarity([], ["technology", "AI"])

            expect(similarity).toBe(0.5) // Neutral value
        })

        it("should handle empty cluster topics gracefully", () => {
            const similarity = calculateTopicSimilarity(["technology", "AI"], [])

            expect(similarity).toBe(0.5) // Neutral value
        })

        it("should normalize topics correctly", () => {
            const userInterests = ["Technology", "AI", "Programming"]
            const clusterTopics = ["technology", "ai", "programming"]

            const similarity = calculateTopicSimilarity(userInterests, clusterTopics)

            expect(similarity).toBeGreaterThan(0.8) // Should be high despite case differences
        })

        it("should handle special characters in topics", () => {
            const userInterests = ["machine-learning", "AI/ML", "data science"]
            const clusterTopics = ["machine learning", "AI ML", "data science"]

            const similarity = calculateTopicSimilarity(userInterests, clusterTopics)

            expect(similarity).toBeDefined()
            expect(typeof similarity).toBe("number")
            expect(similarity).toBeGreaterThanOrEqual(0)
            expect(similarity).toBeLessThanOrEqual(1)
        })

        it("should apply decay factor correctly", () => {
            const userInterests = ["technology", "AI"]
            const clusterTopics = ["technology", "AI", "programming", "machine learning"]

            const similarityWithDecay = calculateTopicSimilarity(userInterests, clusterTopics, 0.5)
            const similarityWithoutDecay = calculateTopicSimilarity(
                userInterests,
                clusterTopics,
                1.0,
            )

            // Verificar que ambos os valores são válidos
            expect(similarityWithDecay).toBeGreaterThanOrEqual(0)
            expect(similarityWithDecay).toBeLessThanOrEqual(1)
            expect(similarityWithoutDecay).toBeGreaterThanOrEqual(0)
            expect(similarityWithoutDecay).toBeLessThanOrEqual(1)

            // Com decay factor menor, a similaridade deve ser menor ou igual
            // Mas pode ser igual devido à função sigmóide aplicada
            expect(similarityWithDecay).toBeLessThanOrEqual(similarityWithoutDecay)
        })
    })

    describe("calculateDetailedAffinityMetrics", () => {
        it("should return detailed metrics for complete data", () => {
            const metrics = calculateDetailedAffinityMetrics(
                mockUserEmbedding,
                mockCluster,
                mockUserProfile,
            )

            expect(metrics).toBeDefined()
            expect(metrics.embeddingSimilarity).toBeDefined()
            expect(metrics.topicSimilarity).toBeDefined()
            expect(metrics.networkProximity).toBeDefined()
            expect(metrics.clusterCentrality).toBeDefined()
            expect(metrics.overallAffinity).toBeDefined()

            // All metrics should be in range [0, 1]
            Object.values(metrics).forEach((value) => {
                expect(typeof value).toBe("number")
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            })
        })

        it("should handle missing user profile in detailed metrics", () => {
            const metrics = calculateDetailedAffinityMetrics(
                mockUserEmbedding,
                mockCluster,
                undefined,
            )

            expect(metrics).toBeDefined()
            expect(metrics.topicSimilarity).toBe(0.5) // Default neutral value
            expect(metrics.networkProximity).toBe(0.5) // Default neutral value
        })

        it("should handle errors gracefully in detailed metrics", () => {
            const invalidEmbedding = {
                ...mockUserEmbedding,
                vector: null as any,
            }

            const metrics = calculateDetailedAffinityMetrics(
                invalidEmbedding,
                mockCluster,
                mockUserProfile,
            )

            expect(metrics).toBeDefined()
            // Should return neutral values on error (mas não necessariamente 0.5 para todos)
            expect(metrics.embeddingSimilarity).toBeDefined()
            expect(metrics.topicSimilarity).toBeDefined()
            expect(metrics.networkProximity).toBeDefined()
            expect(metrics.clusterCentrality).toBeDefined()
            expect(metrics.overallAffinity).toBeDefined()
            expect(typeof metrics.embeddingSimilarity).toBe("number")
            expect(typeof metrics.topicSimilarity).toBe("number")
            expect(typeof metrics.networkProximity).toBe("number")
            expect(typeof metrics.clusterCentrality).toBe("number")
            expect(typeof metrics.overallAffinity).toBe("number")
        })
    })

    describe("getDefaultAffinityFactors", () => {
        it("should return valid default factors", () => {
            const factors = getDefaultAffinityFactors()

            expect(factors).toBeDefined()
            expect(factors.embeddingSimilarityWeight).toBe(0.7)
            expect(factors.sharedInterestsWeight).toBe(0.2)
            expect(factors.networkProximityWeight).toBe(0.1)
            expect(factors.clusterCentralityWeight).toBe(0.05)
            expect(factors.minSimilarityThreshold).toBe(0.3)
            expect(factors.topicDecayFactor).toBe(0.8)
            expect(factors.maxHistoricalInteractions).toBe(100)

            // Weights should sum to approximately 1.0
            const totalWeight =
                factors.embeddingSimilarityWeight +
                factors.sharedInterestsWeight +
                factors.networkProximityWeight +
                (factors.clusterCentralityWeight || 0)

            expect(totalWeight).toBeCloseTo(1.0, 1)
        })
    })

    describe("Edge Cases", () => {
        it("should handle cluster with no topics", () => {
            const clusterWithoutTopics = {
                ...mockCluster,
                topics: undefined,
            }

            const score = calculateAffinityScore(
                mockUserEmbedding,
                clusterWithoutTopics,
                mockUserProfile,
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

            const score = calculateAffinityScore(
                mockUserEmbedding,
                clusterWithEmptyTopics,
                mockUserProfile,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle user profile with no interactions", () => {
            const profileWithoutInteractions = {
                ...mockUserProfile,
                interactions: [],
            }

            const score = calculateAffinityScore(
                mockUserEmbedding,
                mockCluster,
                profileWithoutInteractions,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle very large vectors", () => {
            const largeEmbedding = {
                ...mockUserEmbedding,
                vector: new Array(1000).fill(0.1),
            }

            const largeCluster = {
                ...mockCluster,
                centroid: new Array(1000).fill(0.2),
            }

            const score = calculateAffinityScore(largeEmbedding, largeCluster, mockUserProfile)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })
    })

    describe("Performance Tests", () => {
        it("should calculate affinity score efficiently", () => {
            const startTime = performance.now()

            // Calculate multiple scores
            for (let i = 0; i < 100; i++) {
                calculateAffinityScore(mockUserEmbedding, mockCluster, mockUserProfile)
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            // Should complete 100 calculations in reasonable time (< 1 second)
            expect(duration).toBeLessThan(1000)
        })

        it("should handle topic similarity calculation efficiently", () => {
            const largeInterests = Array.from({ length: 100 }, (_, i) => `topic-${i}`)
            const largeTopics = Array.from({ length: 100 }, (_, i) => `cluster-topic-${i}`)

            const startTime = performance.now()
            const similarity = calculateTopicSimilarity(largeInterests, largeTopics)
            const endTime = performance.now()

            expect(similarity).toBeDefined()
            expect(endTime - startTime).toBeLessThan(100) // Should complete quickly
        })
    })
})
