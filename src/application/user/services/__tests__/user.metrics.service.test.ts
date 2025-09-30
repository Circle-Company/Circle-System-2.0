import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserMetricsService, UserMetricsServiceConfig } from "../user.metrics.service"

import { UserMetrics } from "../../../../domain/user/entities/user.metrics.entity"

describe("UserMetricsService", () => {
    let metricsService: UserMetricsService
    let mockRepository: any
    let mockUserMetrics: UserMetrics

    beforeEach(() => {
        mockRepository = {
            create: vi.fn(),
            update: vi.fn(),
            findByUserId: vi.fn(),
        }

        mockUserMetrics = {
            id: "metrics_123",
            userId: "user_123",
            activity: {
                loginCount: 10,
                profileViews: 50,
                profileEdits: 5,
                lastActiveAt: new Date(),
                averageSessionDuration: 1200,
                totalSessions: 25,
                deviceInfo: {},
                locationInfo: {},
                sessionHistory: [],
            },
            social: {
                followersCount: 100,
                followingCount: 50,
                blockedCount: 2,
                totalInteractions: 200,
                socialScore: 75,
                socialActivity: [],
            },
            content: {
                momentsCreated: 20,
                totalLikes: 150,
                totalComments: 30,
                totalShares: 10,
                contentScore: 80,
                topHashtags: ["#test", "#vlog"],
                preferredContentTypes: ["video"],
                interactionPatterns: [],
            },
            engagement: {
                engagementScore: 0.75,
                retentionRate: 0.8,
                growthRate: 0.15,
                activityLevel: "high",
                engagementHistory: [],
            },
            behavior: {
                preferredDevices: ["mobile", "desktop"],
                peakActivityHours: [18, 19, 20],
                averageSessionDuration: 1200,
                sessionFrequency: 0.7,
                behaviorPatterns: [],
            },
            performance: {
                viralScore: 60,
                influenceScore: 70,
                reachScore: 80,
                trendingScore: 65,
                performanceHistory: [],
                recentGrowthRate: 0.1,
            },
            subscription: {
                isActive: true,
                plan: "premium",
                startDate: new Date(),
                upgrades: 1,
                downgrades: 0,
            },
            timeline: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            incrementLoginCount: vi.fn(),
            incrementProfileViews: vi.fn(),
            incrementProfileEdits: vi.fn(),
            updateLastActiveAt: vi.fn(),
            updateDeviceInfo: vi.fn(),
            updateLocationInfo: vi.fn(),
            incrementMomentsCreated: vi.fn(),
            incrementTotalLikes: vi.fn(),
            incrementTotalComments: vi.fn(),
            incrementTotalShares: vi.fn(),
            incrementFollowingCount: vi.fn(),
            decrementFollowingCount: vi.fn(),
            incrementBlockedCount: vi.fn(),
            decrementBlockedCount: vi.fn(),
            updateSocialActivity: vi.fn(),
            incrementSearchCount: vi.fn(),
            updateSearchHistory: vi.fn(),
            incrementReportsCount: vi.fn(),
            updateReportHistory: vi.fn(),
            updateSubscription: vi.fn(),
            incrementPremiumUpgrades: vi.fn(),
            incrementPremiumDowngrades: vi.fn(),
        } as any

        // Mock do UserMetrics.create (se necessário)
        // vi.spyOn(UserMetrics, "create").mockReturnValue(mockUserMetrics)

        metricsService = new UserMetricsService(mockRepository)
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

            mockRepository.findByUserId.mockResolvedValue(mockUserMetrics)
            mockRepository.update.mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordLogin("user_123", loginData)

            // Assert
            expect(mockRepository.findByUserId).toHaveBeenCalledWith("user_123")
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve criar métricas se não existirem", async () => {
            // Arrange
            const loginData = {
                device: "mobile",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
            }

            mockRepository.findByUserId.mockResolvedValue(null)
            mockRepository.create.mockResolvedValue(mockUserMetrics)
            mockRepository.update.mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordLogin("user_123", loginData)

            // Assert
            expect(mockRepository.create).toHaveBeenCalledWith(mockUserMetrics)
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

            mockRepository.findByUserId.mockResolvedValue(mockUserMetrics)
            mockRepository.update.mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordProfileView("user_123", viewData)

            // Assert
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

            mockRepository.findByUserId.mockResolvedValue(mockUserMetrics)
            mockRepository.update.mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordMomentActivity("user_123", "moment_create", activityData)

            // Assert
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve registrar like em momento", async () => {
            // Arrange
            const activityData = {
                momentId: "moment_123",
                targetUserId: "target_123",
                timestamp: new Date(),
            }

            mockRepository.findByUserId.mockResolvedValue(mockUserMetrics)
            mockRepository.update.mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordMomentActivity("user_123", "moment_like", activityData)

            // Assert
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

            mockRepository.findByUserId.mockResolvedValue(mockUserMetrics)
            mockRepository.update.mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordSocialActivity("user_123", "follow", socialData)

            // Assert
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve registrar block", async () => {
            // Arrange
            const socialData = {
                targetUserId: "target_123",
                timestamp: new Date(),
            }

            mockRepository.findByUserId.mockResolvedValue(mockUserMetrics)
            mockRepository.update.mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordSocialActivity("user_123", "block", socialData)

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

            mockRepository.findByUserId.mockResolvedValue(mockUserMetrics)
            mockRepository.update.mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordSearch("user_123", searchData)

            // Assert
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

            mockRepository.findByUserId.mockResolvedValue(mockUserMetrics)
            mockRepository.update.mockResolvedValue(mockUserMetrics)

            // Act
            await metricsService.recordPremiumChange("user_123", "premium_upgrade", premiumData)

            // Assert
            expect(mockRepository.update).toHaveBeenCalledWith(mockUserMetrics)
        })
    })

    describe("getMetrics", () => {
        it("deve retornar métricas do usuário", async () => {
            // Arrange
            mockRepository.findByUserId.mockResolvedValue(mockUserMetrics)

            // Act
            const result = await metricsService.getMetrics("user_123")

            // Assert
            expect(result).toEqual(mockUserMetrics)
            expect(mockRepository.findByUserId).toHaveBeenCalledWith("user_123")
        })

        it("deve retornar null para usuário sem métricas", async () => {
            // Arrange
            mockRepository.findByUserId.mockResolvedValue(null)

            // Act
            const result = await metricsService.getMetrics("user_123")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("getAggregatedMetrics", () => {
        it("deve retornar métricas agregadas", async () => {
            // Arrange
            const metrics1 = {
                ...mockUserMetrics,
                activity: { ...mockUserMetrics.activity, loginCount: 10, profileViews: 50 },
                social: { ...mockUserMetrics.social, followersCount: 100 },
                content: { ...mockUserMetrics.content, momentsCreated: 5 },
                engagement: { ...mockUserMetrics.engagement, engagementScore: 0.8 },
                subscription: { isActive: true },
            }
            const metrics2 = {
                ...mockUserMetrics,
                activity: { ...mockUserMetrics.activity, loginCount: 20, profileViews: 100 },
                social: { ...mockUserMetrics.social, followersCount: 200 },
                content: { ...mockUserMetrics.content, momentsCreated: 10 },
                engagement: { ...mockUserMetrics.engagement, engagementScore: 0.6 },
                subscription: { isActive: false },
            }

            mockRepository.findByUserId
                .mockResolvedValueOnce(metrics1)
                .mockResolvedValueOnce(metrics2)

            // Act
            const result = await metricsService.getAggregatedMetrics(["user_1", "user_2"])

            // Assert
            expect(result).toEqual({
                totalUsers: 2,
                totalLogins: 30,
                totalProfileViews: 150,
                totalMomentsCreated: 15,
                totalLikes: 300,
                totalComments: 60,
                averageEngagement: 0.7,
                averageSessionDuration: 2400,
                premiumUsers: 1,
                activeUsers: 2,
            })
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
    })
})
