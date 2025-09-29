import { beforeEach, describe, expect, it, vi } from "vitest"

import { Moment } from "../../../domain/moment"
import { MomentRepositoryImpl } from "../moment.repository.impl"

// Mock dos modelos Sequelize
const mockModels = {
    sequelize: {
        transaction: vi.fn().mockResolvedValue({
            commit: vi.fn(),
            rollback: vi.fn(),
        }),
        fn: vi.fn().mockReturnValue({
            unnest: vi.fn(),
            count: vi.fn(),
            date: vi.fn(),
            array_length: vi.fn(),
            sum: vi.fn(),
        }),
        col: vi.fn(),
    },
    Moment: {
        create: vi.fn(),
        findByPk: vi.fn(),
        update: vi.fn(),
        destroy: vi.fn(),
        findAll: vi.fn(),
        count: vi.fn(),
        findAndCountAll: vi.fn(),
        sum: vi.fn(),
    },
    MomentContent: {
        create: vi.fn(),
    },
    MomentResolution: {
        create: vi.fn(),
    },
    MomentStatus: {
        create: vi.fn(),
    },
    MomentVisibility: {
        create: vi.fn(),
    },
    MomentMetrics: {
        create: vi.fn(),
        update: vi.fn(),
    },
    MomentContext: {
        create: vi.fn().mockResolvedValue({ id: "context_test-id" }),
    },
    MomentDevice: {
        create: vi.fn(),
    },
    MomentProcessing: {
        create: vi.fn().mockResolvedValue({ id: "processing_test-id" }),
    },
    MomentProcessingStep: {
        create: vi.fn(),
    },
    MomentEmbedding: {
        create: vi.fn(),
    },
    MomentMedia: {
        create: vi.fn(),
    },
    MomentThumbnail: {
        create: vi.fn(),
    },
    MomentLocation: {
        create: vi.fn(),
    },
}

// Mock da entidade Moment
const mockMoment = {
    id: "test-id",
    ownerId: "owner-123",
    description: "Test moment",
    hashtags: ["test"],
    mentions: [],
    toEntity: vi.fn().mockReturnValue({
        id: "test-id",
        ownerId: "owner-123",
        description: "Test moment",
        hashtags: ["test"],
        mentions: [],
        publishedAt: new Date(),
        archivedAt: null,
        deletedAt: null,
        content: {
            duration: 30,
            size: 1024 * 1024,
            format: "mp4",
            hasAudio: true,
            codec: "h264",
            resolution: {
                width: 720,
                height: 1280,
                quality: "medium",
            },
        },
        status: {
            current: "published",
            previous: null,
            reason: null,
            changedBy: null,
            changedAt: new Date(),
        },
        visibility: {
            level: "public",
            allowedUsers: [],
            blockedUsers: [],
            ageRestriction: false,
            contentWarning: false,
        },
        metrics: {
            views: {
                totalViews: 100,
                uniqueViews: 80,
                repeatViews: 20,
                completionViews: 60,
                averageWatchTime: 15,
                averageCompletionRate: 0.75,
                bounceRate: 0.25,
            },
            engagement: {
                totalLikes: 10,
                totalComments: 5,
                totalReports: 0,
                likeRate: 0.1,
                commentRate: 0.05,
                reportRate: 0,
            },
            performance: {
                loadTime: 2.5,
                bufferTime: 0.5,
                errorRate: 0.01,
                qualitySwitches: 2,
            },
            viral: {
                viralScore: 50,
                trendingScore: 30,
                reachScore: 40,
                influenceScore: 35,
                growthRate: 0.1,
                totalReach: 1000,
            },
            content: {
                contentQualityScore: 80,
                audioQualityScore: 85,
                videoQualityScore: 75,
                faceDetectionRate: 0.9,
            },
            lastMetricsUpdate: new Date(),
            metricsVersion: "1.0",
            dataQuality: 95,
            confidenceLevel: 90,
        },
        context: {
            device: {
                type: "mobile",
                os: "iOS",
                osVersion: "15.0",
                model: "iPhone 12",
                screenResolution: "1170x2532",
                orientation: "portrait",
            },
            location: {
                latitude: -23.5505,
                longitude: -46.6333,
            },
        },
        processing: {
            status: "completed",
            progress: 100,
            error: null,
            startedAt: new Date(),
            completedAt: new Date(),
            estimatedCompletion: null,
            steps: [],
        },
        embedding: {
            vector: new Array(128).fill(0),
            dimension: 128,
            metadata: {},
        },
        media: {
            urls: {
                low: "https://example.com/low.mp4",
                medium: "https://example.com/medium.mp4",
                high: "https://example.com/high.mp4",
            },
            storage: {
                provider: "aws",
                bucket: "test-bucket",
                key: "test-key",
                region: "us-east-1",
            },
        },
        thumbnail: {
            url: "https://example.com/thumb.jpg",
            width: 360,
            height: 640,
            storage: {
                provider: "aws",
                bucket: "test-bucket",
                key: "test-thumb",
                region: "us-east-1",
            },
        },
    }),
} as any

describe("MomentRepositoryImpl", () => {
    let repository: MomentRepositoryImpl

    beforeEach(() => {
        vi.clearAllMocks()
        repository = new MomentRepositoryImpl(mockModels)
    })

    describe("create", () => {
        it("deve criar um momento com sucesso", async () => {
            // Arrange
            const mockTransaction = {
                commit: vi.fn(),
                rollback: vi.fn(),
            }
            mockModels.sequelize.transaction.mockResolvedValue(mockTransaction)

            // Act
            const result = await repository.create(mockMoment)

            // Assert
            expect(mockModels.sequelize.transaction).toHaveBeenCalled()
            expect(mockModels.Moment.create).toHaveBeenCalled()
            expect(mockModels.MomentContent.create).toHaveBeenCalled()
            expect(mockModels.MomentStatus.create).toHaveBeenCalled()
            expect(mockModels.MomentVisibility.create).toHaveBeenCalled()
            expect(mockModels.MomentMetrics.create).toHaveBeenCalled()
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(result).toEqual(mockMoment)
        })

        it("deve fazer rollback em caso de erro", async () => {
            // Arrange
            const mockTransaction = {
                commit: vi.fn(),
                rollback: vi.fn(),
            }
            mockModels.sequelize.transaction.mockResolvedValue(mockTransaction)
            mockModels.Moment.create.mockRejectedValue(new Error("Database error"))

            // Act & Assert
            await expect(repository.create(mockMoment)).rejects.toThrow("Database error")
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })
    })

    describe("findById", () => {
        it("deve encontrar um momento por ID", async () => {
            // Arrange
            const mockMomentData = {
                id: "test-id",
                ownerId: "owner-123",
                description: "Test moment",
                hashtags: ["test"],
                mentions: [],
                publishedAt: new Date(),
                archivedAt: null,
                deletedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                content: {
                    duration: 30,
                    size: 1024 * 1024,
                    format: "mp4",
                    hasAudio: true,
                    codec: "h264",
                    resolution: {
                        width: 720,
                        height: 1280,
                        quality: "medium",
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                status: {
                    current: "published",
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                visibility: {
                    level: "public",
                    allowedUsers: [],
                    blockedUsers: [],
                    ageRestriction: false,
                    contentWarning: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                metrics: {
                    totalViews: 100,
                    uniqueViews: 80,
                    repeatViews: 20,
                    completionViews: 60,
                    averageWatchTime: 15,
                    averageCompletionRate: 0.75,
                    bounceRate: 0.25,
                    totalLikes: 10,
                    totalComments: 5,
                    totalReports: 0,
                    likeRate: 0.1,
                    commentRate: 0.05,
                    reportRate: 0,
                    loadTime: 2.5,
                    bufferTime: 0.5,
                    errorRate: 0.01,
                    qualitySwitches: 2,
                    viralScore: 50,
                    trendingScore: 30,
                    reachScore: 40,
                    influenceScore: 35,
                    growthRate: 0.1,
                    totalReach: 1000,
                    contentQualityScore: 80,
                    audioQualityScore: 85,
                    videoQualityScore: 75,
                    faceDetectionRate: 0.9,
                    lastMetricsUpdate: new Date(),
                    metricsVersion: "1.0",
                    dataQuality: 95,
                    confidenceLevel: 90,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            }

            mockModels.Moment.findByPk.mockResolvedValue(mockMomentData)

            // Mock do método fromEntity da entidade Moment
            vi.spyOn(Moment, "fromEntity").mockReturnValue(mockMoment as any)

            // Act
            const result = await repository.findById("test-id")

            // Assert
            expect(mockModels.Moment.findByPk).toHaveBeenCalledWith("test-id", {
                include: expect.any(Array),
            })
            expect(result).toEqual(mockMoment)
        })

        it("deve retornar null para ID inexistente", async () => {
            // Arrange
            mockModels.Moment.findByPk.mockResolvedValue(null)

            // Act
            const result = await repository.findById("inexistent-id")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("update", () => {
        it("deve atualizar um momento existente", async () => {
            // Act
            const result = await repository.update(mockMoment)

            // Assert
            expect(mockModels.Moment.update).toHaveBeenCalled()
            expect(mockModels.MomentMetrics.update).toHaveBeenCalled()
            expect(result).toEqual(mockMoment)
        })
    })

    describe("delete", () => {
        it("deve deletar um momento", async () => {
            // Act
            await repository.delete("test-id")

            // Assert
            expect(mockModels.Moment.destroy).toHaveBeenCalledWith({ where: { id: "test-id" } })
        })
    })

    describe("findByOwnerId", () => {
        it("deve encontrar momentos por ownerId", async () => {
            // Arrange
            const mockMoments = [mockMomentData]
            mockModels.Moment.findAll.mockResolvedValue(mockMoments)

            // Mock do método fromEntity da entidade Moment
            vi.spyOn(Moment, "fromEntity").mockReturnValue(mockMoment as any)

            // Act
            const result = await repository.findByOwnerId("owner-123")

            // Assert
            expect(mockModels.Moment.findAll).toHaveBeenCalledWith({
                where: { ownerId: "owner-123" },
                limit: 20,
                offset: 0,
                order: [["createdAt", "DESC"]],
                include: expect.any(Array),
            })
            expect(result).toEqual([mockMoment])
        })
    })

    describe("getAnalytics", () => {
        it("deve retornar analytics corretos", async () => {
            // Arrange
            mockModels.Moment.count.mockResolvedValue(100)
            mockModels.Moment.findAll.mockResolvedValue([])

            // Act
            const result = await repository.getAnalytics()

            // Assert
            expect(result).toEqual({
                totalMoments: 100,
                publishedMoments: expect.any(Number),
                pendingMoments: expect.any(Number),
                failedMoments: expect.any(Number),
                topHashtags: [],
                topMentions: [],
                momentsByDay: [],
                momentsByStatus: [],
            })
        })
    })

    describe("getStats", () => {
        it("deve retornar estatísticas corretas", async () => {
            // Arrange
            mockModels.Moment.count.mockResolvedValue(100)
            mockModels.Moment.sum.mockResolvedValue(500)

            // Act
            const result = await repository.getStats()

            // Assert
            expect(result).toEqual({
                totalMoments: 100,
                publishedMoments: expect.any(Number),
                pendingMoments: expect.any(Number),
                failedMoments: expect.any(Number),
                totalHashtags: 500,
                totalMentions: 500,
                averageHashtagsPerMoment: 5,
                averageMentionsPerMoment: 5,
            })
        })
    })
})

// Helper para criar dados mock
const mockMomentData = {
    id: "test-id",
    ownerId: "owner-123",
    description: "Test moment",
    hashtags: ["test"],
    mentions: [],
    publishedAt: new Date(),
    archivedAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
}
