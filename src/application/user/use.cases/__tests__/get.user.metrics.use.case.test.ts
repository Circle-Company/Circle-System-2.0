import { beforeEach, describe, expect, it, vi } from "vitest"

import { IUserRepository } from "../../../../domain/user/repositories/user.repository"
import { UserService } from "../../services/user.service"
import { GetUserMetricsUseCase } from "../get.user.metrics.use.case"

describe("GetUserMetricsUseCase", () => {
    let getUserMetricsUseCase: GetUserMetricsUseCase
    let mockUserRepository: IUserRepository
    let mockUserService: UserService

    beforeEach(() => {
        vi.clearAllMocks()

        mockUserRepository = {
            save: vi.fn(),
            findById: vi.fn(),
            findByUsername: vi.fn(),
            existsByUsername: vi.fn(),
            update: vi.fn(),
            isBlocked: vi.fn(),
            isFollowing: vi.fn(),
            followUser: vi.fn(),
            unfollowUser: vi.fn(),
            blockUser: vi.fn(),
            unblockUser: vi.fn(),
        } as any

        mockUserService = {
            getUserById: vi.fn(),
            getMetrics: vi.fn(),
            getMetricsWithAnalysis: vi.fn(),
        } as any

        getUserMetricsUseCase = new GetUserMetricsUseCase(mockUserRepository, mockUserService)
    })

    describe("execute", () => {
        it("deve retornar métricas do próprio usuário", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "user-id",
            }

            const mockMetrics = {
                userId: "user-id",
                activity: {
                    loginCount: 10,
                    profileViews: 100,
                    profileEdits: 5,
                    averageSessionDuration: 300,
                    totalSessions: 50,
                },
                social: {
                    followersCount: 100,
                    followingCount: 50,
                    blockedCount: 2,
                    totalInteractions: 500,
                    socialScore: 75,
                },
                content: {
                    momentsCreated: 20,
                    totalLikes: 200,
                    totalComments: 50,
                    totalShares: 10,
                    contentScore: 80,
                },
                engagement: {
                    engagementScore: 85,
                    retentionRate: 0.9,
                    growthRate: 0.15,
                    activityLevel: "high",
                },
                behavior: {
                    preferredDevices: ["mobile", "web"],
                    peakActivityHours: [9, 12, 18, 21],
                    averageSessionDuration: 300,
                    sessionFrequency: 5,
                },
                performance: {
                    viralScore: 70,
                    influenceScore: 75,
                    reachScore: 80,
                    trendingScore: 65,
                },
                timeline: [],
            }

            vi.mocked(mockUserService.getMetrics).mockResolvedValue(mockMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.metrics).toBeDefined()
            expect(result.metrics?.userId).toBe("user-id")
            expect(mockUserService.getMetrics).toHaveBeenCalledWith("user-id")
        })

        it("deve retornar erro quando usuário não tem permissão", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "other-user-id",
            }

            const mockUser = {
                id: "other-user-id",
                role: "user",
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockUser as any)

            // Act
            const result = await getUserMetricsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado às métricas do usuário")
        })

        it("deve permitir admin acessar métricas de outros usuários", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "admin-id",
            }

            const mockAdmin = {
                id: "admin-id",
                role: "admin",
            }

            const mockMetrics = {
                userId: "user-id",
                activity: {
                    loginCount: 5,
                    profileViews: 50,
                    profileEdits: 2,
                    averageSessionDuration: 200,
                    totalSessions: 20,
                },
                social: {
                    followersCount: 50,
                    followingCount: 30,
                    blockedCount: 1,
                    totalInteractions: 200,
                    socialScore: 60,
                },
                content: {
                    momentsCreated: 10,
                    totalLikes: 100,
                    totalComments: 25,
                    totalShares: 5,
                    contentScore: 70,
                },
                engagement: {
                    engagementScore: 70,
                    retentionRate: 0.8,
                    growthRate: 0.1,
                    activityLevel: "medium",
                },
                behavior: {
                    preferredDevices: ["mobile"],
                    peakActivityHours: [12, 18],
                    averageSessionDuration: 200,
                    sessionFrequency: 3,
                },
                performance: {
                    viralScore: 60,
                    influenceScore: 65,
                    reachScore: 70,
                    trendingScore: 55,
                },
                timeline: [],
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)
            vi.mocked(mockUserService.getMetrics).mockResolvedValue(mockMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.metrics).toBeDefined()
            expect(result.metrics?.userId).toBe("user-id")
        })

        it("deve retornar métricas básicas quando não há métricas salvas", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "user-id",
            }

            const mockUser = {
                id: "user-id",
                updatedAt: new Date(),
                statistics: {
                    followersCount: 0,
                    followingCount: 0,
                    momentsCount: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                },
            }

            vi.mocked(mockUserService.getMetrics).mockResolvedValue(null)
            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockUser as any)

            // Act
            const result = await getUserMetricsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.metrics).toBeDefined()
            expect(result.metrics?.userId).toBe("user-id")
            expect(result.metrics?.social.followersCount).toBe(0)
        })

        it("deve retornar erro quando usuário não existe", async () => {
            // Arrange
            const request = {
                userId: "non-existent-user",
                requestingUserId: "non-existent-user",
            }

            vi.mocked(mockUserService.getMetrics).mockResolvedValue(null)
            vi.mocked(mockUserService.getUserById).mockResolvedValue(null)

            // Act
            const result = await getUserMetricsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Usuário não encontrado")
        })
    })
})
