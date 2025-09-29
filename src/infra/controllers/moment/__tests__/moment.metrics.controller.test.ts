import { GetMomentMetricsUseCase, GetMomentsAnalyticsUseCase } from "@/application/moment/use.cases"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MomentMetricsController } from "../moment.metrics.controller"

// Mock dos use cases
const mockGetMomentMetricsUseCase = {
    execute: vi.fn(),
} as unknown as GetMomentMetricsUseCase

const mockGetMomentsAnalyticsUseCase = {
    execute: vi.fn(),
} as unknown as GetMomentsAnalyticsUseCase

describe("MomentMetricsController", () => {
    let controller: MomentMetricsController

    const mockMetrics = {
        momentId: "moment_123",
        totalViews: 1000,
        totalLikes: 50,
        totalComments: 25,
        totalShares: 10,
        engagementRate: 0.085,
        averageWatchTime: 45.5,
        completionRate: 0.75,
        demographics: {
            ageGroups: {
                "18-24": 300,
                "25-34": 400,
                "35-44": 200,
                "45+": 100,
            },
            genders: {
                male: 600,
                female: 350,
                other: 50,
            },
            locations: {
                "São Paulo": 400,
                "Rio de Janeiro": 300,
                Brasília: 200,
                Outros: 100,
            },
        },
        timeline: [
            {
                date: "2024-01-01",
                views: 100,
                likes: 5,
                comments: 2,
                shares: 1,
            },
            {
                date: "2024-01-02",
                views: 150,
                likes: 8,
                comments: 3,
                shares: 2,
            },
        ],
        topHashtags: [
            { hashtag: "#vlog", count: 50 },
            { hashtag: "#lifestyle", count: 30 },
            { hashtag: "#travel", count: 20 },
        ],
        topMentions: [
            { mention: "@friend1", count: 15 },
            { mention: "@friend2", count: 10 },
            { mention: "@brand", count: 5 },
        ],
    }

    const mockAnalytics = {
        overview: {
            totalMoments: 25,
            totalViews: 50000,
            totalLikes: 2500,
            totalComments: 1250,
            totalShares: 500,
            averageEngagementRate: 0.085,
            averageWatchTime: 42.3,
            averageCompletionRate: 0.78,
        },
        trends: {
            momentsCreated: [
                { date: "2024-01-01", count: 2 },
                { date: "2024-01-02", count: 3 },
                { date: "2024-01-03", count: 1 },
            ],
            views: [
                { date: "2024-01-01", count: 1000 },
                { date: "2024-01-02", count: 1500 },
                { date: "2024-01-03", count: 1200 },
            ],
            likes: [
                { date: "2024-01-01", count: 50 },
                { date: "2024-01-02", count: 75 },
                { date: "2024-01-03", count: 60 },
            ],
            comments: [
                { date: "2024-01-01", count: 25 },
                { date: "2024-01-02", count: 35 },
                { date: "2024-01-03", count: 30 },
            ],
        },
        topPerformers: {
            mostViewed: [
                { momentId: "moment_1", title: "Best Moment Ever", views: 5000 },
                { momentId: "moment_2", title: "Amazing Content", views: 4500 },
                { momentId: "moment_3", title: "Great Video", views: 4000 },
            ],
            mostLiked: [
                { momentId: "moment_1", title: "Best Moment Ever", likes: 250 },
                { momentId: "moment_2", title: "Amazing Content", likes: 200 },
                { momentId: "moment_3", title: "Great Video", likes: 180 },
            ],
            mostCommented: [
                { momentId: "moment_1", title: "Best Moment Ever", comments: 125 },
                { momentId: "moment_2", title: "Amazing Content", comments: 100 },
                { momentId: "moment_3", title: "Great Video", comments: 90 },
            ],
        },
        insights: {
            bestPerformingDay: "sunday",
            bestPerformingHour: 20,
            averagePostingFrequency: 1.2,
            audienceGrowth: 0.15,
            engagementTrend: "increasing" as const,
        },
    }

    beforeEach(() => {
        vi.clearAllMocks()
        controller = new MomentMetricsController(
            mockGetMomentMetricsUseCase,
            mockGetMomentsAnalyticsUseCase,
        )
    })

    describe("getMomentMetrics", () => {
        it("deve obter métricas de um momento com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const request = {
                period: "daily" as const,
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
                includeDetails: true,
            }

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockResolvedValue({
                success: true,
                metrics: mockMetrics,
            })

            // Act
            const result = await controller.getMomentMetrics(momentId, userId, request)

            // Assert
            expect(result).toBeDefined()
            expect(result.momentId).toBe("moment_123")
            expect(result.totalViews).toBe(1000)
            expect(result.totalLikes).toBe(50)
            expect(result.totalComments).toBe(25)
            expect(result.totalShares).toBe(10)
            expect(result.engagementRate).toBe(0.085)
            expect(result.averageWatchTime).toBe(45.5)
            expect(result.completionRate).toBe(0.75)
            expect(result.demographics.ageGroups["18-24"]).toBe(300)
            expect(result.demographics.genders.male).toBe(600)
            expect(result.demographics.locations["São Paulo"]).toBe(400)
            expect(result.timeline).toHaveLength(2)
            expect(result.topHashtags).toHaveLength(3)
            expect(result.topMentions).toHaveLength(3)
            expect(mockGetMomentMetricsUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
                period: "daily",
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            })
        })

        it("deve usar valores padrão quando parâmetros não são fornecidos", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const request = {}

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockResolvedValue({
                success: true,
                metrics: mockMetrics,
            })

            // Act
            const result = await controller.getMomentMetrics(momentId, userId, request)

            // Assert
            expect(result).toBeDefined()
            expect(mockGetMomentMetricsUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
                period: "daily",
                startDate: undefined,
                endDate: undefined,
            })
        })

        it("deve falhar com dados inválidos", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const request = {
                period: "invalid_period" as any,
            }

            // Act & Assert
            await expect(controller.getMomentMetrics(momentId, userId, request)).rejects.toThrow(
                "Erro de validação",
            )
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const momentId = "inexistente"
            const userId = "user_123"
            const request = {}

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockRejectedValue(
                new Error("Moment not found"),
            )

            // Act & Assert
            await expect(controller.getMomentMetrics(momentId, userId, request)).rejects.toThrow(
                "Momento não encontrado",
            )
        })

        it("deve falhar quando usuário não é autorizado", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_456"
            const request = {}

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockRejectedValue(
                new Error("Unauthorized"),
            )

            // Act & Assert
            await expect(controller.getMomentMetrics(momentId, userId, request)).rejects.toThrow(
                "Não autorizado",
            )
        })

        it("deve falhar quando use case retorna erro", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const request = {}

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockResolvedValue({
                success: false,
                error: "Database error",
            })

            // Act & Assert
            await expect(controller.getMomentMetrics(momentId, userId, request)).rejects.toThrow(
                "Erro ao obter métricas do momento",
            )
        })
    })

    describe("getMomentsAnalytics", () => {
        it("deve obter analytics gerais com sucesso", async () => {
            // Arrange
            const userId = "user_123"
            const request = {
                period: "weekly" as const,
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
                category: "engagement" as const,
                includeTrends: true,
                includeComparisons: false,
            }

            vi.mocked(mockGetMomentsAnalyticsUseCase.execute).mockResolvedValue({
                success: true,
                analytics: mockAnalytics,
            })

            // Act
            const result = await controller.getMomentsAnalytics(userId, request)

            // Assert
            expect(result).toBeDefined()
            expect(result.overview.totalMoments).toBe(25)
            expect(result.overview.totalViews).toBe(50000)
            expect(result.overview.totalLikes).toBe(2500)
            expect(result.overview.totalComments).toBe(1250)
            expect(result.overview.totalShares).toBe(500)
            expect(result.overview.averageEngagementRate).toBe(0.085)
            expect(result.overview.averageWatchTime).toBe(42.3)
            expect(result.overview.averageCompletionRate).toBe(0.78)
            expect(result.trends.momentsCreated).toHaveLength(3)
            expect(result.trends.views).toHaveLength(3)
            expect(result.trends.likes).toHaveLength(3)
            expect(result.trends.comments).toHaveLength(3)
            expect(result.topPerformers.mostViewed).toHaveLength(3)
            expect(result.topPerformers.mostLiked).toHaveLength(3)
            expect(result.topPerformers.mostCommented).toHaveLength(3)
            expect(result.insights.bestPerformingDay).toBe("sunday")
            expect(result.insights.bestPerformingHour).toBe(20)
            expect(result.insights.averagePostingFrequency).toBe(1.2)
            expect(result.insights.audienceGrowth).toBe(0.15)
            expect(result.insights.engagementTrend).toBe("increasing")
            expect(mockGetMomentsAnalyticsUseCase.execute).toHaveBeenCalledWith({
                userId,
                period: "weekly",
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            })
        })

        it("deve usar valores padrão quando parâmetros não são fornecidos", async () => {
            // Arrange
            const userId = "user_123"
            const request = {}

            vi.mocked(mockGetMomentsAnalyticsUseCase.execute).mockResolvedValue({
                success: true,
                analytics: mockAnalytics,
            })

            // Act
            const result = await controller.getMomentsAnalytics(userId, request)

            // Assert
            expect(result).toBeDefined()
            expect(mockGetMomentsAnalyticsUseCase.execute).toHaveBeenCalledWith({
                userId,
                period: "daily",
                startDate: undefined,
                endDate: undefined,
            })
        })

        it("deve falhar com dados inválidos", async () => {
            // Arrange
            const userId = "user_123"
            const request = {
                period: "invalid_period" as any,
                category: "invalid_category" as any,
            }

            // Act & Assert
            await expect(controller.getMomentsAnalytics(userId, request)).rejects.toThrow(
                "Erro de validação",
            )
        })

        it("deve falhar quando usuário não é autorizado", async () => {
            // Arrange
            const userId = "user_456"
            const request = {}

            vi.mocked(mockGetMomentsAnalyticsUseCase.execute).mockRejectedValue(
                new Error("Unauthorized"),
            )

            // Act & Assert
            await expect(controller.getMomentsAnalytics(userId, request)).rejects.toThrow(
                "Não autorizado",
            )
        })

        it("deve falhar quando use case retorna erro", async () => {
            // Arrange
            const userId = "user_123"
            const request = {}

            vi.mocked(mockGetMomentsAnalyticsUseCase.execute).mockResolvedValue({
                success: false,
                error: "Database error",
            })

            // Act & Assert
            await expect(controller.getMomentsAnalytics(userId, request)).rejects.toThrow(
                "Erro ao obter analytics dos momentos",
            )
        })
    })

    describe("getOwnerMomentMetrics", () => {
        it("deve obter métricas detalhadas do dono com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_123"
            const request = {
                period: "monthly" as const,
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
                includeDetails: true,
            }

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockResolvedValue({
                success: true,
                metrics: mockMetrics,
            })

            // Act
            const result = await controller.getOwnerMomentMetrics(momentId, userId, request)

            // Assert
            expect(result).toBeDefined()
            expect(result.momentId).toBe("moment_123")
            expect(result.totalViews).toBe(1000)
            expect(mockGetMomentMetricsUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId,
                period: "monthly",
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            })
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const momentId = "inexistente"
            const userId = "user_123"
            const request = {}

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockRejectedValue(
                new Error("Moment not found"),
            )

            // Act & Assert
            await expect(
                controller.getOwnerMomentMetrics(momentId, userId, request),
            ).rejects.toThrow("Momento não encontrado")
        })

        it("deve falhar quando usuário não é autorizado", async () => {
            // Arrange
            const momentId = "moment_123"
            const userId = "user_456"
            const request = {}

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockRejectedValue(
                new Error("Unauthorized"),
            )

            // Act & Assert
            await expect(
                controller.getOwnerMomentMetrics(momentId, userId, request),
            ).rejects.toThrow("Não autorizado")
        })
    })

    describe("getPublicMomentMetrics", () => {
        it("deve obter métricas públicas com sucesso", async () => {
            // Arrange
            const momentId = "moment_123"

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockResolvedValue({
                success: true,
                metrics: mockMetrics,
            })

            // Act
            const result = await controller.getPublicMomentMetrics(momentId)

            // Assert
            expect(result).toBeDefined()
            expect(result.momentId).toBe("moment_123")
            expect(result.totalViews).toBe(1000)
            expect(mockGetMomentMetricsUseCase.execute).toHaveBeenCalledWith({
                momentId,
                userId: undefined,
                period: "daily",
            })
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const momentId = "inexistente"

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockRejectedValue(
                new Error("Moment not found"),
            )

            // Act & Assert
            await expect(controller.getPublicMomentMetrics(momentId)).rejects.toThrow(
                "Momento não encontrado",
            )
        })

        it("deve falhar quando use case retorna erro", async () => {
            // Arrange
            const momentId = "moment_123"

            vi.mocked(mockGetMomentMetricsUseCase.execute).mockResolvedValue({
                success: false,
                error: "Database error",
            })

            // Act & Assert
            await expect(controller.getPublicMomentMetrics(momentId)).rejects.toThrow(
                "Erro ao obter métricas públicas do momento",
            )
        })
    })

    describe("mapToMetricsResponse", () => {
        it("deve mapear métricas para response corretamente", () => {
            // Act
            const result = (controller as any).mapToMetricsResponse(mockMetrics)

            // Assert
            expect(result).toBeDefined()
            expect(result.momentId).toBe("moment_123")
            expect(result.totalViews).toBe(1000)
            expect(result.totalLikes).toBe(50)
            expect(result.totalComments).toBe(25)
            expect(result.totalShares).toBe(10)
            expect(result.engagementRate).toBe(0.085)
            expect(result.averageWatchTime).toBe(45.5)
            expect(result.completionRate).toBe(0.75)
            expect(result.demographics.ageGroups["18-24"]).toBe(300)
            expect(result.demographics.genders.male).toBe(600)
            expect(result.demographics.locations["São Paulo"]).toBe(400)
            expect(result.timeline).toHaveLength(2)
            expect(result.topHashtags).toHaveLength(3)
            expect(result.topMentions).toHaveLength(3)
        })

        it("deve usar valores padrão quando propriedades estão ausentes", () => {
            // Arrange
            const incompleteMetrics = {
                momentId: "moment_123",
            }

            // Act
            const result = (controller as any).mapToMetricsResponse(incompleteMetrics)

            // Assert
            expect(result).toBeDefined()
            expect(result.momentId).toBe("moment_123")
            expect(result.totalViews).toBe(0)
            expect(result.totalLikes).toBe(0)
            expect(result.totalComments).toBe(0)
            expect(result.totalShares).toBe(0)
            expect(result.engagementRate).toBe(0)
            expect(result.averageWatchTime).toBe(0)
            expect(result.completionRate).toBe(0)
            expect(result.demographics.ageGroups).toEqual({})
            expect(result.demographics.genders).toEqual({})
            expect(result.demographics.locations).toEqual({})
            expect(result.timeline).toEqual([])
            expect(result.topHashtags).toEqual([])
            expect(result.topMentions).toEqual([])
        })
    })

    describe("mapToAnalyticsResponse", () => {
        it("deve mapear analytics para response corretamente", () => {
            // Act
            const result = (controller as any).mapToAnalyticsResponse(mockAnalytics)

            // Assert
            expect(result).toBeDefined()
            expect(result.overview.totalMoments).toBe(25)
            expect(result.overview.totalViews).toBe(50000)
            expect(result.overview.totalLikes).toBe(2500)
            expect(result.overview.totalComments).toBe(1250)
            expect(result.overview.totalShares).toBe(500)
            expect(result.overview.averageEngagementRate).toBe(0.085)
            expect(result.overview.averageWatchTime).toBe(42.3)
            expect(result.overview.averageCompletionRate).toBe(0.78)
            expect(result.trends.momentsCreated).toHaveLength(3)
            expect(result.trends.views).toHaveLength(3)
            expect(result.trends.likes).toHaveLength(3)
            expect(result.trends.comments).toHaveLength(3)
            expect(result.topPerformers.mostViewed).toHaveLength(3)
            expect(result.topPerformers.mostLiked).toHaveLength(3)
            expect(result.topPerformers.mostCommented).toHaveLength(3)
            expect(result.insights.bestPerformingDay).toBe("sunday")
            expect(result.insights.bestPerformingHour).toBe(20)
            expect(result.insights.averagePostingFrequency).toBe(1.2)
            expect(result.insights.audienceGrowth).toBe(0.15)
            expect(result.insights.engagementTrend).toBe("increasing")
        })

        it("deve usar valores padrão quando propriedades estão ausentes", () => {
            // Arrange
            const incompleteAnalytics = {}

            // Act
            const result = (controller as any).mapToAnalyticsResponse(incompleteAnalytics)

            // Assert
            expect(result).toBeDefined()
            expect(result.overview.totalMoments).toBe(0)
            expect(result.overview.totalViews).toBe(0)
            expect(result.overview.totalLikes).toBe(0)
            expect(result.overview.totalComments).toBe(0)
            expect(result.overview.totalShares).toBe(0)
            expect(result.overview.averageEngagementRate).toBe(0)
            expect(result.overview.averageWatchTime).toBe(0)
            expect(result.overview.averageCompletionRate).toBe(0)
            expect(result.trends.momentsCreated).toEqual([])
            expect(result.trends.views).toEqual([])
            expect(result.trends.likes).toEqual([])
            expect(result.trends.comments).toEqual([])
            expect(result.topPerformers.mostViewed).toEqual([])
            expect(result.topPerformers.mostLiked).toEqual([])
            expect(result.topPerformers.mostCommented).toEqual([])
            expect(result.insights.bestPerformingDay).toBe("monday")
            expect(result.insights.bestPerformingHour).toBe(12)
            expect(result.insights.averagePostingFrequency).toBe(0)
            expect(result.insights.audienceGrowth).toBe(0)
            expect(result.insights.engagementTrend).toBe("stable")
        })
    })
})
