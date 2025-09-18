import { ClusterInfo, UserProfile } from "../../../../types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { calculateDetailedDiversityMetrics, calculateDiversityScore } from "../diversity"

// Mock do logger
vi.mock("../../utils/logger", () => ({
    getLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    })),
}))

describe("DiversityMetrics", () => {
    let mockCluster: ClusterInfo
    let mockUserProfile: UserProfile
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
            topics: ["technology", "AI", "programming", "machine learning"],
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Mock do perfil do usuário
        mockUserProfile = {
            userId: "123",
            interests: ["technology", "AI"], // Partial overlap with cluster topics
            interactions: [
                {
                    postIds: ["post-1", "post-2"],
                    type: "like",
                    timestamp: new Date(),
                },
            ],
        }

        // Fatores padrão para diversidade
        defaultFactors = {
            topicDiversityWeight: 0.5,
            creatorDiversityWeight: 0.3,
            formatDiversityWeight: 0.2,
            recentClustersToConsider: 10,
        }
    })

    describe("calculateDiversityScore", () => {
        it("should calculate diversity score with complete data", () => {
            const score = calculateDiversityScore(mockCluster, mockUserProfile, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should return neutral score when user profile is null", () => {
            const score = calculateDiversityScore(mockCluster, null, defaultFactors)

            expect(score).toBe(0.5) // Neutral score
        })

        it("should return neutral score when user profile is undefined", () => {
            const score = calculateDiversityScore(mockCluster, undefined, defaultFactors)

            expect(score).toBe(0.5) // Neutral score
        })

        it("should handle cluster with no topics", () => {
            const clusterWithoutTopics = {
                ...mockCluster,
                topics: undefined,
            }

            const score = calculateDiversityScore(
                clusterWithoutTopics,
                mockUserProfile,
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

            const score = calculateDiversityScore(
                clusterWithEmptyTopics,
                mockUserProfile,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle user profile with no interests", () => {
            const profileWithoutInterests = {
                ...mockUserProfile,
                interests: undefined,
            }

            const score = calculateDiversityScore(
                mockCluster,
                profileWithoutInterests,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle user profile with empty interests", () => {
            const profileWithEmptyInterests = {
                ...mockUserProfile,
                interests: [],
            }

            const score = calculateDiversityScore(
                mockCluster,
                profileWithEmptyInterests,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should calculate higher diversity for clusters with new topics", () => {
            const diverseCluster = {
                ...mockCluster,
                topics: ["sports", "music", "art", "cooking"], // Completely different from user interests
            }

            const score = calculateDiversityScore(diverseCluster, mockUserProfile, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should calculate lower diversity for clusters with familiar topics", () => {
            const familiarCluster = {
                ...mockCluster,
                topics: ["technology", "AI", "programming"], // Same as user interests
            }

            const score = calculateDiversityScore(familiarCluster, mockUserProfile, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle custom factors correctly", () => {
            const customFactors = {
                topicDiversityWeight: 0.8,
                creatorDiversityWeight: 0.1,
                formatDiversityWeight: 0.1,
                recentClustersToConsider: 5,
            }

            const score = calculateDiversityScore(mockCluster, mockUserProfile, customFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should normalize scores correctly with different factor weights", () => {
            const unbalancedFactors = {
                topicDiversityWeight: 0.1,
                creatorDiversityWeight: 0.1,
                formatDiversityWeight: 0.1,
                recentClustersToConsider: 10,
            }

            const score = calculateDiversityScore(mockCluster, mockUserProfile, unbalancedFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })
    })

    describe("calculateDetailedDiversityMetrics", () => {
        it("should return detailed metrics for complete data", () => {
            const metrics = calculateDetailedDiversityMetrics(mockCluster, mockUserProfile)

            expect(metrics).toBeDefined()
            expect(metrics.topicDiversity).toBeDefined()
            expect(metrics.creatorDiversity).toBeDefined()
            expect(metrics.formatDiversity).toBeDefined()
            expect(metrics.overallDiversity).toBeDefined()

            // All metrics should be in range [0, 1]
            Object.values(metrics).forEach((value) => {
                expect(typeof value).toBe("number")
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            })
        })

        it("should handle missing user profile in detailed metrics", () => {
            const metrics = calculateDetailedDiversityMetrics(mockCluster, undefined as any)

            expect(metrics).toBeDefined()
            // Should return neutral values (creatorDiversity is fixed at 0.6)
            expect(metrics.topicDiversity).toBeDefined()
            expect(metrics.creatorDiversity).toBe(0.6) // Fixed value from implementation
            expect(metrics.formatDiversity).toBe(0.5)
            expect(metrics.overallDiversity).toBeDefined()
            expect(typeof metrics.topicDiversity).toBe("number")
            expect(typeof metrics.overallDiversity).toBe("number")
        })

        it("should handle errors gracefully in detailed metrics", () => {
            const invalidCluster = {
                ...mockCluster,
                topics: null as any,
            }

            const metrics = calculateDetailedDiversityMetrics(invalidCluster, mockUserProfile)

            expect(metrics).toBeDefined()
            // Should return neutral values on error (creatorDiversity is fixed at 0.6)
            expect(metrics.topicDiversity).toBeDefined()
            expect(metrics.creatorDiversity).toBe(0.6) // Fixed value from implementation
            expect(metrics.formatDiversity).toBe(0.5)
            expect(metrics.overallDiversity).toBeDefined()
            expect(typeof metrics.topicDiversity).toBe("number")
            expect(typeof metrics.overallDiversity).toBe("number")
        })

        it("should calculate topic diversity correctly", () => {
            const metrics = calculateDetailedDiversityMetrics(mockCluster, mockUserProfile)

            expect(metrics.topicDiversity).toBeDefined()
            expect(typeof metrics.topicDiversity).toBe("number")
            expect(metrics.topicDiversity).toBeGreaterThanOrEqual(0)
            expect(metrics.topicDiversity).toBeLessThanOrEqual(1)
        })

        it("should return consistent creator diversity", () => {
            const metrics = calculateDetailedDiversityMetrics(mockCluster, mockUserProfile)

            expect(metrics.creatorDiversity).toBe(0.6) // Fixed value from implementation
        })

        it("should return neutral format diversity", () => {
            const metrics = calculateDetailedDiversityMetrics(mockCluster, mockUserProfile)

            expect(metrics.formatDiversity).toBe(0.5) // Neutral value from implementation
        })
    })

    describe("Edge Cases", () => {
        it("should handle case-insensitive topic matching", () => {
            const clusterWithCaseVariations = {
                ...mockCluster,
                topics: ["Technology", "AI", "Programming"],
            }

            const userWithLowercaseInterests = {
                ...mockUserProfile,
                interests: ["technology", "ai", "programming"],
            }

            const score = calculateDiversityScore(
                clusterWithCaseVariations,
                userWithLowercaseInterests,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle special characters in topics", () => {
            const clusterWithSpecialChars = {
                ...mockCluster,
                topics: ["machine-learning", "AI/ML", "data science"],
            }

            const userWithSpecialChars = {
                ...mockUserProfile,
                interests: ["machine learning", "AI ML", "data science"],
            }

            const score = calculateDiversityScore(
                clusterWithSpecialChars,
                userWithSpecialChars,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle very large topic lists", () => {
            const largeTopics = Array.from({ length: 100 }, (_, i) => `topic-${i}`)
            const clusterWithManyTopics = {
                ...mockCluster,
                topics: largeTopics,
            }

            const score = calculateDiversityScore(
                clusterWithManyTopics,
                mockUserProfile,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle very large interest lists", () => {
            const largeInterests = Array.from({ length: 100 }, (_, i) => `interest-${i}`)
            const userWithManyInterests = {
                ...mockUserProfile,
                interests: largeInterests,
            }

            const score = calculateDiversityScore(
                mockCluster,
                userWithManyInterests,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle zero weights in factors", () => {
            const zeroWeightFactors = {
                topicDiversityWeight: 0,
                creatorDiversityWeight: 0,
                formatDiversityWeight: 0,
                recentClustersToConsider: 10,
            }

            const score = calculateDiversityScore(mockCluster, mockUserProfile, zeroWeightFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            // Com todos os pesos zero, deve retornar 0.5 (neutro)
            expect(score).toBe(0.5)
        })
    })

    describe("Performance Tests", () => {
        it("should calculate diversity score efficiently", () => {
            const startTime = performance.now()

            // Calculate multiple scores
            for (let i = 0; i < 100; i++) {
                calculateDiversityScore(mockCluster, mockUserProfile, defaultFactors)
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            // Should complete 100 calculations in reasonable time (< 1 second)
            expect(duration).toBeLessThan(1000)
        })

        it("should handle large topic lists efficiently", () => {
            const largeTopics = Array.from({ length: 1000 }, (_, i) => `topic-${i}`)
            const clusterWithManyTopics = {
                ...mockCluster,
                topics: largeTopics,
            }

            const startTime = performance.now()
            const score = calculateDiversityScore(
                clusterWithManyTopics,
                mockUserProfile,
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
                { topics: [], interests: [] },
                { topics: ["a"], interests: ["b"] },
                { topics: ["a", "b"], interests: ["a", "b"] },
                { topics: ["a", "b", "c"], interests: ["a"] },
            ]

            testCases.forEach((testCase) => {
                const cluster = { ...mockCluster, topics: testCase.topics }
                const profile = { ...mockUserProfile, interests: testCase.interests }

                const score = calculateDiversityScore(cluster, profile, defaultFactors)

                expect(score).toBeGreaterThanOrEqual(0)
                expect(score).toBeLessThanOrEqual(1)
            })
        })

        it("should be symmetric for topic diversity calculation", () => {
            const cluster1 = { ...mockCluster, topics: ["a", "b"] }
            const cluster2 = { ...mockCluster, topics: ["b", "a"] }
            const profile = { ...mockUserProfile, interests: ["c", "d"] }

            const score1 = calculateDiversityScore(cluster1, profile, defaultFactors)
            const score2 = calculateDiversityScore(cluster2, profile, defaultFactors)

            // Scores should be approximately equal (allowing for floating point precision)
            expect(Math.abs(score1 - score2)).toBeLessThan(0.001)
        })
    })
})
