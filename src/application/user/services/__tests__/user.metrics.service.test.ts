import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserMetricsService, UserMetricsServiceConfig } from "../user.metrics.service"

import { UserMetrics } from "../../../../domain/user/entities/user.metrics.entity"
import { IUserMetricsRepository } from "../../../../domain/user/repositories/user.metrics.repository"

// Mock do UserMetrics.create
vi.mock("../../../../domain/user/entities/user.metrics.entity", () => ({
    UserMetrics: {
        create: vi.fn(),
    },
}))

describe("UserMetricsService", () => {
    let metricsService: UserMetricsService
    let mockRepository: IUserMetricsRepository
    let mockUserMetrics: UserMetrics

    beforeEach(() => {
        vi.clearAllMocks()

        mockRepository = {
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findByUserId: vi.fn(),
            findAll: vi.fn(),
            findTopUsers: vi.fn(),
            findUsersByEngagement: vi.fn(),
            findUsersByGrowth: vi.fn(),
        } as any

        mockUserMetrics = {
            id: "metrics_123",
            userId: "user_123",
            totalLikesGiven: 10,
            totalCommentsGiven: 5,
            totalSharesGiven: 2,
            totalFollowing: 50,
            totalFollowers: 100,
            totalMomentsCreated: 20,
            totalLikesReceived: 150,
            totalCommentsReceived: 30,
            totalSharesReceived: 10,
            totalViewsReceived: 500,
            totalReportsSpecifically: 0,
            reportsReceived: 0,
            engagementRate: 0.75,
            momentsPerDayAverage: 0.5,
            followerGrowthRate30d: 0.15,
            lastMetricsUpdate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            incrementActionMetrics: vi.fn(),
            incrementReceivedMetrics: vi.fn(),
            incrementCreationMetrics: vi.fn(),
        } as any

        // Configurar UserMetrics.create para retornar o mock
        vi.mocked(UserMetrics.create).mockReturnValue(mockUserMetrics as any)

        // Criar serviço com updates em tempo real desabilitados para testes síncronos
        metricsService = new UserMetricsService(mockRepository, {
            enableRealTimeUpdates: false,
        })
    })

    describe("recordLogin", () => {
        it("deve registrar login com dados completos", async () => {
            // Arrange
            const loginData = {
                device: "mobile",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                location: "São Paulo",
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordLogin("user_123", loginData)

            // Assert
            expect(mockRepository.findByUserId).toHaveBeenCalledWith("user_123")
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({ likesGiven: 0 })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve criar métricas se não existirem", async () => {
            // Arrange
            const loginData = {
                device: "mobile",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)
            vi.mocked(mockRepository.create).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordLogin("user_123", loginData)

            // Assert
            expect(UserMetrics.create).toHaveBeenCalledWith("user_123")
            expect(mockRepository.create).toHaveBeenCalledWith(mockUserMetrics)
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })
    })

    describe("recordProfileView", () => {
        it("deve registrar visualização de perfil", async () => {
            // Arrange
            const viewData = {
                viewerId: "viewer_123",
                profileOwnerId: "user_123",
                duration: 30,
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordProfileView("user_123", viewData)

            // Assert
            expect(mockUserMetrics.incrementReceivedMetrics).toHaveBeenCalledWith({
                viewsReceived: 1,
            })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })
    })

    describe("recordMomentActivity", () => {
        it("deve registrar criação de momento", async () => {
            // Arrange
            const activityData = {
                momentId: "moment_123",
                timestamp: new Date(),
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordMomentActivity("user_123", "moment_create", activityData)

            // Assert
            expect(mockUserMetrics.incrementCreationMetrics).toHaveBeenCalledWith({
                momentsCreated: 1,
            })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve registrar like em momento", async () => {
            // Arrange
            const activityData = {
                momentId: "moment_123",
                targetUserId: "target_123",
                timestamp: new Date(),
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordMomentActivity("user_123", "moment_like", activityData)

            // Assert
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({ likesGiven: 1 })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve registrar comentário em momento", async () => {
            // Arrange
            const activityData = {
                momentId: "moment_123",
                timestamp: new Date(),
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordMomentActivity("user_123", "moment_comment", activityData)

            // Assert
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({
                commentsGiven: 1,
            })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve registrar compartilhamento de momento", async () => {
            // Arrange
            const activityData = {
                momentId: "moment_123",
                timestamp: new Date(),
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordMomentActivity("user_123", "moment_share", activityData)

            // Assert
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({ sharesGiven: 1 })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })
    })

    describe("recordSocialActivity", () => {
        it("deve registrar follow", async () => {
            // Arrange
            const socialData = {
                targetUserId: "target_123",
                timestamp: new Date(),
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordSocialActivity("user_123", "follow", socialData)

            // Assert
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({ followsGiven: 1 })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve registrar unfollow", async () => {
            // Arrange
            const socialData = {
                targetUserId: "target_123",
                timestamp: new Date(),
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordSocialActivity("user_123", "unfollow", socialData)

            // Assert
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve registrar block", async () => {
            // Arrange
            const socialData = {
                targetUserId: "target_123",
                timestamp: new Date(),
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordSocialActivity("user_123", "block", socialData)

            // Assert
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({ reportsGiven: 1 })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve registrar unblock", async () => {
            // Arrange
            const socialData = {
                targetUserId: "target_123",
                timestamp: new Date(),
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordSocialActivity("user_123", "unblock", socialData)

            // Assert
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })
    })

    describe("recordSearch", () => {
        it("deve registrar busca", async () => {
            // Arrange
            const searchData = {
                query: "test search",
                resultsCount: 15,
                filters: { type: "user" },
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordSearch("user_123", searchData)

            // Assert
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({ likesGiven: 0 })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })
    })

    describe("recordReport", () => {
        it("deve registrar report", async () => {
            // Arrange
            const reportData = {
                targetUserId: "target_123",
                reason: "spam",
                timestamp: new Date(),
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordReport("user_123", reportData)

            // Assert
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({ reportsGiven: 1 })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })
    })

    describe("recordPremiumChange", () => {
        it("deve registrar upgrade premium", async () => {
            // Arrange
            const premiumData = {
                previousPlan: "free",
                newPlan: "premium",
                amount: 9.99,
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordPremiumChange("user_123", "premium_upgrade", premiumData)

            // Assert
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({ likesGiven: 0 })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve registrar downgrade premium", async () => {
            // Arrange
            const premiumData = {
                previousPlan: "premium",
                newPlan: "free",
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)
            vi.mocked(mockRepository.update).mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordPremiumChange("user_123", "premium_downgrade", premiumData)

            // Assert
            expect(mockUserMetrics.incrementActionMetrics).toHaveBeenCalledWith({ likesGiven: 0 })
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })
    })

    describe("getMetrics", () => {
        it("deve retornar métricas do usuário", async () => {
            // Arrange
            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)

            // Act
            const result = await metricsService.getMetrics("user_123")

            // Assert
            expect(result).toEqual(mockUserMetrics)
            expect(mockRepository.findByUserId).toHaveBeenCalledWith("user_123")
        })

        it("deve retornar null para usuário sem métricas", async () => {
            // Arrange
            vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

            // Act
            const result = await metricsService.getMetrics("user_123")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("getMetricsWithAnalysis", () => {
        it("deve retornar métricas com análise", async () => {
            // Arrange
            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockUserMetrics)

            // Act
            const result = await metricsService.getMetricsWithAnalysis("user_123")

            // Assert
            expect(result).toBeDefined()
            expect(result?.metrics).toEqual(mockUserMetrics)
            expect(result?.analysis).toBeDefined()
            expect(result?.analysis.engagementAnalysis).toBeDefined()
            expect(result?.analysis.behaviorAnalysis).toBeDefined()
            expect(result?.analysis.performanceAnalysis).toBeDefined()
            expect(result?.analysis.recommendations).toBeDefined()
        })

        it("deve retornar null quando métricas não existem", async () => {
            // Arrange
            vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

            // Act
            const result = await metricsService.getMetricsWithAnalysis("user_123")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("getBatchMetrics", () => {
        it("deve retornar métricas em lote", async () => {
            // Arrange
            const metrics1 = { ...mockUserMetrics, userId: "user_1" }
            const metrics2 = { ...mockUserMetrics, userId: "user_2" }

            vi.mocked(mockRepository.findByUserId)
                .mockResolvedValueOnce(metrics1 as any)
                .mockResolvedValueOnce(metrics2 as any)

            // Act
            const result = await metricsService.getBatchMetrics(["user_1", "user_2"])

            // Assert
            expect(result).toHaveLength(2)
            expect(result[0].userId).toBe("user_1")
            expect(result[1].userId).toBe("user_2")
        })

        it("deve ignorar usuários sem métricas", async () => {
            // Arrange
            vi.mocked(mockRepository.findByUserId)
                .mockResolvedValueOnce(mockUserMetrics)
                .mockResolvedValueOnce(null)

            // Act
            const result = await metricsService.getBatchMetrics(["user_1", "user_2"])

            // Assert
            expect(result).toHaveLength(1)
        })
    })

    describe("getAggregatedMetrics", () => {
        it("deve retornar métricas agregadas corretamente", async () => {
            // Arrange
            const metrics1 = {
                ...mockUserMetrics,
                totalLikesGiven: 10,
                totalCommentsGiven: 5,
                totalSharesGiven: 2,
                totalMomentsCreated: 5,
                totalViewsReceived: 100,
                engagementRate: 0.8,
                momentsPerDayAverage: 1.0,
            }
            const metrics2 = {
                ...mockUserMetrics,
                totalLikesGiven: 20,
                totalCommentsGiven: 10,
                totalSharesGiven: 5,
                totalMomentsCreated: 10,
                totalViewsReceived: 200,
                engagementRate: 0.6,
                momentsPerDayAverage: 2.0,
            }

            vi.mocked(mockRepository.findByUserId)
                .mockResolvedValueOnce(metrics1 as any)
                .mockResolvedValueOnce(metrics2 as any)

            // Act
            const result = await metricsService.getAggregatedMetrics(["user_1", "user_2"])

            // Assert
            expect(result.totalUsers).toBe(2)
            expect(result.totalLogins).toBe(2) // 1 por métrica
            expect(result.totalProfileViews).toBe(300) // 100 + 200
            expect(result.totalMomentsCreated).toBe(15) // 5 + 10
            expect(result.totalLikes).toBe(30) // 10 + 20
            expect(result.totalComments).toBe(15) // 5 + 10
            expect(result.averageEngagement).toBe(0.7) // (0.8 + 0.6) / 2
            expect(result.averageSessionDuration).toBe(1.5) // (1.0 + 2.0) / 2
            expect(result.activeUsers).toBe(2) // Ambos criaram moments
        })

        it("deve retornar zeros para lista vazia", async () => {
            // Act
            const result = await metricsService.getAggregatedMetrics([])

            // Assert
            expect(result).toEqual({
                totalUsers: 0,
                totalLogins: 0,
                totalProfileViews: 0,
                totalMomentsCreated: 0,
                totalLikes: 0,
                totalComments: 0,
                averageEngagement: 0,
                averageSessionDuration: 0,
                premiumUsers: 0,
                activeUsers: 0,
            })
        })
    })

    describe("configuração", () => {
        it("deve usar configuração padrão", () => {
            // Arrange & Act
            const service = new UserMetricsService(mockRepository)

            // Assert
            expect(service).toBeDefined()
        })

        it("deve usar configuração customizada", () => {
            // Arrange
            const customConfig: Partial<UserMetricsServiceConfig> = {
                batchSize: 50,
                processingInterval: 10000,
                enableRealTimeUpdates: false,
            }

            // Act
            const service = new UserMetricsService(mockRepository, customConfig)

            // Assert
            expect(service).toBeDefined()
        })

        it("deve parar processamento quando solicitado", () => {
            // Arrange
            const service = new UserMetricsService(mockRepository, {
                enableRealTimeUpdates: true,
            })

            // Act
            service.stop()

            // Assert - Não deve haver erros
            expect(service).toBeDefined()
        })
    })

    describe("processamento de eventos", () => {
        it("deve processar fila de eventos vazia sem erros", async () => {
            // Act & Assert
            await expect(metricsService.processEventQueue()).resolves.not.toThrow()
        })
    })
})
