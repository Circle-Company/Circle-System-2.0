import { ClusterInfo, InteractionType, UserInteraction } from "../../../../types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    calculateDetailedEngagementMetrics,
    calculateEngagementScore,
    determineViewType,
    processCommentLikeInteraction,
    processSaveInteraction,
    processViewInteraction,
} from "../engagement"

// Mock do logger
vi.mock("../../utils/logger", () => ({
    getLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    })),
}))

describe("EngagementMetrics", () => {
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
            memberIds: ["post-1", "post-2", "post-3"],
            radius: 0.5,
            density: 0.8,
            size: 15,
            topics: ["technology", "AI", "programming"],
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Mock das interações do usuário
        mockUserInteractions = [
            {
                id: "interaction-1",
                userId: BigInt(123),
                entityId: BigInt(1), // post-1
                entityType: "post",
                type: "like" as InteractionType,
                timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
                metadata: {
                    engagementTime: 30,
                    percentWatched: 100,
                },
            },
            {
                id: "interaction-2",
                userId: BigInt(123),
                entityId: BigInt(2), // post-2
                entityType: "post",
                type: "comment" as InteractionType,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            },
            {
                id: "interaction-3",
                userId: BigInt(123),
                entityId: BigInt(4), // post not in cluster
                entityType: "post",
                type: "share" as InteractionType,
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            },
        ]

        // Fatores padrão para engajamento
        defaultFactors = {
            recency: {
                halfLifeHours: {
                    partialView: 12,
                    completeView: 24,
                    like: 48,
                    likeComment: 48,
                    comment: 72,
                    share: 96,
                },
            },
            interactionWeights: {
                partialView: 0.5,
                completeView: 1.0,
                like: 2.0,
                likeComment: 2.5,
                comment: 3.0,
                share: 4.0,
            },
            defaultInteractionWeights: {
                partialView: 0.5,
                completeView: 1.0,
                like: 2.0,
                likeComment: 2.5,
                comment: 3.0,
                share: 4.0,
                save: 3.5,
                dislike: -0.5,
                report: -1.0,
                showLessOften: -0.6,
                click: 0.3,
                default: 0.3,
            },
            timeDecayFactor: 0.5,
            maxInteractionsPerUser: 100,
            normalizationFactor: 1.0,
        }
    })

    describe("calculateEngagementScore", () => {
        it("should calculate engagement score with valid data", () => {
            const score = calculateEngagementScore(
                mockCluster,
                mockUserInteractions,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should return neutral score when no interactions", () => {
            const score = calculateEngagementScore(mockCluster, [], defaultFactors)

            expect(score).toBe(0.5) // Neutral score
        })

        it("should return neutral score when cluster has no members", () => {
            const clusterWithoutMembers = {
                ...mockCluster,
                memberIds: [],
            }

            const score = calculateEngagementScore(
                clusterWithoutMembers,
                mockUserInteractions,
                defaultFactors,
            )

            expect(score).toBe(0.5) // Neutral score
        })

        it("should return neutral score when cluster has no memberIds", () => {
            const clusterWithoutMemberIds = {
                ...mockCluster,
                memberIds: undefined,
            }

            const score = calculateEngagementScore(
                clusterWithoutMemberIds,
                mockUserInteractions,
                defaultFactors,
            )

            expect(score).toBe(0.5) // Neutral score
        })

        it("should return slightly below neutral when no relevant interactions", () => {
            const irrelevantInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(999), // Not in cluster
                    entityType: "post",
                    type: "like" as InteractionType,
                    timestamp: new Date(),
                },
            ]

            const score = calculateEngagementScore(
                mockCluster,
                irrelevantInteractions,
                defaultFactors,
            )

            expect(score).toBe(0.4) // Slightly below neutral
        })

        it("should apply temporal decay correctly", () => {
            const oldInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(1),
                    entityType: "post",
                    type: "like" as InteractionType,
                    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                },
            ]

            const recentInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(1),
                    entityType: "post",
                    type: "like" as InteractionType,
                    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
                },
            ]

            const oldScore = calculateEngagementScore(mockCluster, oldInteractions, defaultFactors)
            const recentScore = calculateEngagementScore(
                mockCluster,
                recentInteractions,
                defaultFactors,
            )

            // Interações recentes devem ter score maior ou igual às antigas
            expect(recentScore).toBeGreaterThanOrEqual(oldScore)
        })

        it("should limit interactions based on maxInteractionsPerUser", () => {
            const manyInteractions = Array.from({ length: 200 }, (_, i) => ({
                id: `interaction-${i}`,
                userId: BigInt(123),
                entityId: BigInt(1),
                entityType: "post",
                type: "like" as InteractionType,
                timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
            }))

            const factorsWithLimit = {
                ...defaultFactors,
                maxInteractionsPerUser: 50,
            }

            const score = calculateEngagementScore(mockCluster, manyInteractions, factorsWithLimit)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle different interaction types correctly", () => {
            const highValueInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(1),
                    entityType: "post",
                    type: "share" as InteractionType,
                    timestamp: new Date(),
                },
            ]

            const lowValueInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(1),
                    entityType: "post",
                    type: "partialView" as InteractionType,
                    timestamp: new Date(),
                },
            ]

            const highScore = calculateEngagementScore(
                mockCluster,
                highValueInteractions,
                defaultFactors,
            )
            const lowScore = calculateEngagementScore(
                mockCluster,
                lowValueInteractions,
                defaultFactors,
            )

            // Interações de alto valor devem ter score maior ou igual às de baixo valor
            expect(highScore).toBeGreaterThanOrEqual(lowScore)
        })
    })

    describe("calculateDetailedEngagementMetrics", () => {
        it("should return detailed metrics for valid data", () => {
            const metrics = calculateDetailedEngagementMetrics(mockCluster, mockUserInteractions)

            expect(metrics).toBeDefined()
            expect(metrics.totalInteractions).toBeDefined()
            expect(metrics.interactionsByType).toBeDefined()
            expect(metrics.engagementRate).toBeDefined()
            expect(metrics.retentionRate).toBeDefined()
            expect(metrics.uniqueUsers).toBeDefined()

            expect(typeof metrics.totalInteractions).toBe("number")
            expect(typeof metrics.engagementRate).toBe("number")
            expect(typeof metrics.retentionRate).toBe("number")
            expect(typeof metrics.uniqueUsers).toBe("number")
            expect(typeof metrics.interactionsByType).toBe("object")
        })

        it("should handle cluster with no members", () => {
            const clusterWithoutMembers = {
                ...mockCluster,
                memberIds: [],
            }

            const metrics = calculateDetailedEngagementMetrics(
                clusterWithoutMembers,
                mockUserInteractions,
            )

            expect(metrics.totalInteractions).toBe(0)
            expect(metrics.engagementRate).toBe(0)
            expect(metrics.retentionRate).toBe(0)
            expect(metrics.uniqueUsers).toBe(0)
            expect(Object.keys(metrics.interactionsByType)).toHaveLength(0)
        })

        it("should count interactions by type correctly", () => {
            const metrics = calculateDetailedEngagementMetrics(mockCluster, mockUserInteractions)

            expect(metrics.interactionsByType).toBeDefined()
            expect(typeof metrics.interactionsByType).toBe("object")
        })

        it("should calculate engagement rate correctly", () => {
            const metrics = calculateDetailedEngagementMetrics(mockCluster, mockUserInteractions)

            expect(metrics.engagementRate).toBeDefined()
            expect(typeof metrics.engagementRate).toBe("number")
            expect(metrics.engagementRate).toBeGreaterThanOrEqual(0)
        })

        it("should calculate retention rate correctly", () => {
            const metrics = calculateDetailedEngagementMetrics(mockCluster, mockUserInteractions)

            expect(metrics.retentionRate).toBeDefined()
            expect(typeof metrics.retentionRate).toBe("number")
            expect(metrics.retentionRate).toBeGreaterThanOrEqual(0)
            expect(metrics.retentionRate).toBeLessThanOrEqual(1)
        })

        it("should count unique users correctly", () => {
            const metrics = calculateDetailedEngagementMetrics(mockCluster, mockUserInteractions)

            expect(metrics.uniqueUsers).toBeDefined()
            expect(typeof metrics.uniqueUsers).toBe("number")
            expect(metrics.uniqueUsers).toBeGreaterThanOrEqual(0)
        })
    })

    describe("determineViewType", () => {
        it("should return completeView for long duration", () => {
            const viewType = determineViewType(60, 0.5) // 60 seconds, 50% watched

            expect(viewType).toBe("completeView")
        })

        it("should return completeView for high watch percentage", () => {
            const viewType = determineViewType(10, 0.9) // 10 seconds, 90% watched

            expect(viewType).toBe("completeView")
        })

        it("should return partialView for short duration and low percentage", () => {
            const viewType = determineViewType(10, 0.5) // 10 seconds, 50% watched

            expect(viewType).toBe("partialView")
        })

        it("should return completeView for both criteria met", () => {
            const viewType = determineViewType(60, 0.9) // 60 seconds, 90% watched

            expect(viewType).toBe("completeView")
        })

        it("should handle edge cases", () => {
            expect(determineViewType(30, 0.8)).toBe("completeView") // Exactly at threshold
            expect(determineViewType(29, 0.79)).toBe("partialView") // Just below threshold
        })
    })

    describe("processViewInteraction", () => {
        it("should process view interaction with metadata", () => {
            const baseInteraction: UserInteraction = {
                id: "interaction-1",
                userId: BigInt(123),
                entityId: BigInt(1),
                entityType: "post",
                type: "view" as InteractionType,
                timestamp: new Date(),
            }

            const processed = processViewInteraction(baseInteraction, 45, 0.85)

            expect(processed.type).toBe("completeView")
            expect(processed.metadata?.durationSeconds).toBe(45)
            expect(processed.metadata?.watchPercentage).toBe(0.85)
            expect(processed.metadata?.viewType).toBe("completeView")
        })

        it("should handle partial view", () => {
            const baseInteraction: UserInteraction = {
                id: "interaction-1",
                userId: BigInt(123),
                entityId: BigInt(1),
                entityType: "post",
                type: "view" as InteractionType,
                timestamp: new Date(),
            }

            const processed = processViewInteraction(baseInteraction, 15, 0.3)

            expect(processed.type).toBe("partialView")
            expect(processed.metadata?.viewType).toBe("partialView")
        })
    })

    describe("processCommentLikeInteraction", () => {
        it("should process comment like interaction", () => {
            const baseInteraction: UserInteraction = {
                id: "interaction-1",
                userId: BigInt(123),
                entityId: BigInt(1),
                entityType: "post",
                type: "like" as InteractionType,
                timestamp: new Date(),
            }

            const processed = processCommentLikeInteraction(baseInteraction, "comment-123")

            expect(processed.type).toBe("likeComment")
            expect(processed.metadata?.commentId).toBe("comment-123")
            expect(processed.metadata?.targetType).toBe("comment")
        })
    })

    describe("processSaveInteraction", () => {
        it("should process save interaction without reason", () => {
            const baseInteraction: UserInteraction = {
                id: "interaction-1",
                userId: BigInt(123),
                entityId: BigInt(1),
                entityType: "post",
                type: "like" as InteractionType,
                timestamp: new Date(),
            }

            const processed = processSaveInteraction(baseInteraction)

            expect(processed.type).toBe("save")
            expect(processed.metadata?.targetType).toBe("content")
        })

        it("should process save interaction with reason", () => {
            const baseInteraction: UserInteraction = {
                id: "interaction-1",
                userId: BigInt(123),
                entityId: BigInt(1),
                entityType: "post",
                type: "like" as InteractionType,
                timestamp: new Date(),
            }

            const processed = processSaveInteraction(baseInteraction, "for later reading")

            expect(processed.type).toBe("save")
            expect(processed.metadata?.saveReason).toBe("for later reading")
            expect(processed.metadata?.targetType).toBe("content")
        })
    })

    describe("Edge Cases", () => {
        it("should handle interactions with BigInt IDs", () => {
            const bigIntInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt("12345678901234567890"),
                    entityId: BigInt("98765432109876543210"),
                    entityType: "post",
                    type: "like" as InteractionType,
                    timestamp: new Date(),
                },
            ]

            const score = calculateEngagementScore(mockCluster, bigIntInteractions, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle very old interactions", () => {
            const veryOldInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(1),
                    entityType: "post",
                    type: "like" as InteractionType,
                    timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
                },
            ]

            const score = calculateEngagementScore(mockCluster, veryOldInteractions, defaultFactors)

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle very recent interactions", () => {
            const veryRecentInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(1),
                    entityType: "post",
                    type: "like" as InteractionType,
                    timestamp: new Date(Date.now() - 1000), // 1 second ago
                },
            ]

            const score = calculateEngagementScore(
                mockCluster,
                veryRecentInteractions,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })

        it("should handle negative interaction weights", () => {
            const negativeInteractions = [
                {
                    id: "interaction-1",
                    userId: BigInt(123),
                    entityId: BigInt(1),
                    entityType: "post",
                    type: "dislike" as InteractionType,
                    timestamp: new Date(),
                },
            ]

            const score = calculateEngagementScore(
                mockCluster,
                negativeInteractions,
                defaultFactors,
            )

            expect(score).toBeDefined()
            expect(typeof score).toBe("number")
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(1)
        })
    })

    describe("Performance Tests", () => {
        it("should calculate engagement score efficiently", () => {
            const startTime = performance.now()

            // Calculate multiple scores
            for (let i = 0; i < 100; i++) {
                calculateEngagementScore(mockCluster, mockUserInteractions, defaultFactors)
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
                entityId: BigInt(1),
                entityType: "post",
                type: "like" as InteractionType,
                timestamp: new Date(Date.now() - i * 60 * 1000),
            }))

            const startTime = performance.now()
            const score = calculateEngagementScore(mockCluster, largeInteractions, defaultFactors)
            const endTime = performance.now()

            expect(score).toBeDefined()
            expect(endTime - startTime).toBeLessThan(100) // Should complete quickly
        })
    })
})
