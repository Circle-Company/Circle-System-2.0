/**
 * User Metrics Repository Tests
 *
 * Testes completos para o repositório de métricas de usuários
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { IUserMetricsRepository, UserMetricsAnalysisService } from "../user.metrics.repository"

import { UserMetrics } from "../../entities/user.metrics.entity"

describe("UserMetricsRepository", () => {
    let repository: IUserMetricsRepository
    let mockUserMetrics: UserMetrics

    beforeEach(() => {
        vi.clearAllMocks()

        // Create a mock repository implementation
        repository = {
            create: vi.fn(),
            findById: vi.fn(),
            findByUserId: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findTopByEngagement: vi.fn(),
            findTopByFollowers: vi.fn(),
            findTopByActivity: vi.fn(),
            findTopByGrowth: vi.fn(),
            findActiveUsers: vi.fn(),
            findInfluencers: vi.fn(),
            findUsersWithModerationIssues: vi.fn(),
            getAverageMetrics: vi.fn(),
            getMetricsDistribution: vi.fn(),
            getMetricsByTimeRange: vi.fn(),
            countByEngagementRange: vi.fn(),
            countByFollowersRange: vi.fn(),
            countByActivityRange: vi.fn(),
            countByGrowthRange: vi.fn(),
            exists: vi.fn(),
            existsByUserId: vi.fn(),
            createMany: vi.fn(),
            updateMany: vi.fn(),
            deleteMany: vi.fn(),
            findPaginated: vi.fn(),
        }

        // Mock user metrics data
        mockUserMetrics = new UserMetrics({
            userId: "123456789",
            totalLikesReceived: 100,
            totalViewsReceived: 1000,
            totalSharesReceived: 50,
            totalCommentsReceived: 200,
            totalMemoriesCreated: 5,
            totalMomentsCreated: 25,
            totalLikesGiven: 80,
            totalCommentsGiven: 150,
            totalSharesGiven: 30,
            totalFollowsGiven: 10,
            totalReportsGiven: 0,
            totalFollowers: 500,
            totalFollowing: 300,
            totalRelations: 800,
            engagementRate: 0.15,
            reachRate: 0.8,
            momentsPublishedGrowthRate30d: 0.2,
            memoriesPublishedGrowthRate30d: 0.1,
            followerGrowthRate30d: 0.05,
            engagementGrowthRate30d: 0.03,
            interactionsGrowthRate30d: 0.04,
            memoriesPerDayAverage: 0.2,
            momentsPerDayAverage: 0.8,
            reportsReceived: 0,
            violationsCount: 0,
            lastMetricsUpdate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    })

    describe("Operações Básicas", () => {
        it("deve criar métricas de usuário com sucesso", async () => {
            // Arrange
            vi.mocked(repository.create).mockResolvedValue(mockUserMetrics)

            // Act
            const result = await repository.create(mockUserMetrics)

            // Assert
            expect(result).toBe(mockUserMetrics)
            expect(repository.create).toHaveBeenCalledWith(mockUserMetrics)
        })

        it("deve encontrar métricas por ID", async () => {
            // Arrange
            const metricsId = "123456789"
            vi.mocked(repository.findById).mockResolvedValue(mockUserMetrics)

            // Act
            const result = await repository.findById(metricsId)

            // Assert
            expect(result).toBeDefined()
            expect(repository.findById).toHaveBeenCalledWith(metricsId)
        })

        it("deve encontrar métricas por userId", async () => {
            // Arrange
            const userId = "123456789"
            vi.mocked(repository.findByUserId).mockResolvedValue(mockUserMetrics)

            // Act
            const result = await repository.findByUserId(userId)

            // Assert
            expect(result).toBeDefined()
            expect(repository.findByUserId).toHaveBeenCalledWith(userId)
        })

        it("deve retornar null quando métricas não encontradas", async () => {
            // Arrange
            vi.mocked(repository.findById).mockResolvedValue(null)

            // Act
            const result = await repository.findById("999999999")

            // Assert
            expect(result).toBeNull()
        })

        it("deve verificar se métricas existem", async () => {
            // Arrange
            vi.mocked(repository.exists).mockResolvedValue(true)

            // Act
            const result = await repository.exists("123456789")

            // Assert
            expect(result).toBe(true)
            expect(repository.exists).toHaveBeenCalledWith("123456789")
        })
    })

    describe("Operações de Busca Avançada", () => {
        it("deve encontrar top usuários por engajamento", async () => {
            // Arrange
            const mockMetrics = [mockUserMetrics]
            vi.mocked(repository.findTopByEngagement).mockResolvedValue(mockMetrics)

            // Act
            const result = await repository.findTopByEngagement(10, 0)

            // Assert
            expect(result).toBeDefined()
            expect(repository.findTopByEngagement).toHaveBeenCalledWith(10, 0)
        })

        it("deve encontrar top usuários por seguidores", async () => {
            // Arrange
            const mockMetrics = [mockUserMetrics]
            vi.mocked(repository.findTopByFollowers).mockResolvedValue(mockMetrics)

            // Act
            const result = await repository.findTopByFollowers(5, 0)

            // Assert
            expect(result).toBeDefined()
            expect(repository.findTopByFollowers).toHaveBeenCalledWith(5, 0)
        })

        it("deve encontrar top usuários por atividade", async () => {
            // Arrange
            const mockMetrics = [mockUserMetrics]
            vi.mocked(repository.findTopByActivity).mockResolvedValue(mockMetrics)

            // Act
            const result = await repository.findTopByActivity(20, 0)

            // Assert
            expect(result).toBeDefined()
            expect(repository.findTopByActivity).toHaveBeenCalledWith(20, 0)
        })

        it("deve encontrar top usuários por crescimento", async () => {
            // Arrange
            const mockMetrics = [mockUserMetrics]
            vi.mocked(repository.findTopByGrowth).mockResolvedValue(mockMetrics)

            // Act
            const result = await repository.findTopByGrowth(15, 0)

            // Assert
            expect(result).toBeDefined()
            expect(repository.findTopByGrowth).toHaveBeenCalledWith(15, 0)
        })
    })

    describe("Operações de Análise", () => {
        it("deve encontrar usuários ativos", async () => {
            // Arrange
            const mockMetrics = [mockUserMetrics]
            vi.mocked(repository.findActiveUsers).mockResolvedValue(mockMetrics)

            // Act
            const result = await repository.findActiveUsers(30, 10, 0)

            // Assert
            expect(result).toBeDefined()
            expect(repository.findActiveUsers).toHaveBeenCalledWith(30, 10, 0)
        })

        it("deve encontrar influencers", async () => {
            // Arrange
            const mockMetrics = [mockUserMetrics]
            vi.mocked(repository.findInfluencers).mockResolvedValue(mockMetrics)

            // Act
            const result = await repository.findInfluencers(1000, 0.05, 10, 0)

            // Assert
            expect(result).toBeDefined()
            expect(repository.findInfluencers).toHaveBeenCalledWith(1000, 0.05, 10, 0)
        })

        it("deve encontrar usuários com problemas de moderação", async () => {
            // Arrange
            const mockMetrics = [mockUserMetrics]
            vi.mocked(repository.findUsersWithModerationIssues).mockResolvedValue(mockMetrics)

            // Act
            const result = await repository.findUsersWithModerationIssues(10, 0)

            // Assert
            expect(result).toBeDefined()
            expect(repository.findUsersWithModerationIssues).toHaveBeenCalledWith(10, 0)
        })
    })

    describe("Operações de Agregação", () => {
        it("deve obter métricas médias", async () => {
            // Arrange
            const mockAverages = {
                averageEngagementRate: 0.12,
                averageActivityRate: 0.5,
                averageGrowthRate: 0.03,
                averageFollowers: 250,
            }
            vi.mocked(repository.getAverageMetrics).mockResolvedValue(mockAverages)

            // Act
            const result = await repository.getAverageMetrics()

            // Assert
            expect(result).toBeDefined()
            expect(result.averageEngagementRate).toBe(0.12)
            expect(result.averageFollowers).toBe(250)
            expect(repository.getAverageMetrics).toHaveBeenCalled()
        })

        it("deve obter distribuição de métricas", async () => {
            // Arrange
            const mockDistribution = {
                engagementDistribution: { low: 30, medium: 50, high: 20 },
                activityDistribution: { low: 25, medium: 60, high: 15 },
                followersDistribution: { low: 40, medium: 45, high: 15 },
                growthDistribution: { low: 35, medium: 50, high: 15 },
            }
            vi.mocked(repository.getMetricsDistribution).mockResolvedValue(mockDistribution)

            // Act
            const result = await repository.getMetricsDistribution()

            // Assert
            expect(result).toBeDefined()
            expect(result.engagementDistribution).toBeDefined()
            expect(result.activityDistribution).toBeDefined()
            expect(result.followersDistribution).toBeDefined()
            expect(result.growthDistribution).toBeDefined()
            expect(repository.getMetricsDistribution).toHaveBeenCalled()
        })

        it("deve obter métricas por período", async () => {
            // Arrange
            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-12-31")
            const mockMetrics = [mockUserMetrics]
            vi.mocked(repository.getMetricsByTimeRange).mockResolvedValue(mockMetrics)

            // Act
            const result = await repository.getMetricsByTimeRange(startDate, endDate, 10, 0)

            // Assert
            expect(result).toBeDefined()
            expect(repository.getMetricsByTimeRange).toHaveBeenCalledWith(startDate, endDate, 10, 0)
        })
    })

    describe("Operações de Contagem", () => {
        it("deve contar por faixa de engajamento", async () => {
            // Arrange
            vi.mocked(repository.countByEngagementRange).mockResolvedValue(50)

            // Act
            const result = await repository.countByEngagementRange(0.05, 0.15)

            // Assert
            expect(result).toBe(50)
            expect(repository.countByEngagementRange).toHaveBeenCalledWith(0.05, 0.15)
        })

        it("deve contar por faixa de seguidores", async () => {
            // Arrange
            vi.mocked(repository.countByFollowersRange).mockResolvedValue(75)

            // Act
            const result = await repository.countByFollowersRange(100, 1000)

            // Assert
            expect(result).toBe(75)
            expect(repository.countByFollowersRange).toHaveBeenCalledWith(100, 1000)
        })

        it("deve contar por faixa de atividade", async () => {
            // Arrange
            vi.mocked(repository.countByActivityRange).mockResolvedValue(30)

            // Act
            const result = await repository.countByActivityRange(0.1, 1.0)

            // Assert
            expect(result).toBe(30)
            expect(repository.countByActivityRange).toHaveBeenCalledWith(0.1, 1.0)
        })

        it("deve contar por faixa de crescimento", async () => {
            // Arrange
            vi.mocked(repository.countByGrowthRange).mockResolvedValue(25)

            // Act
            const result = await repository.countByGrowthRange(0.01, 0.1)

            // Assert
            expect(result).toBe(25)
            expect(repository.countByGrowthRange).toHaveBeenCalledWith(0.01, 0.1)
        })
    })

    describe("Operações em Lote", () => {
        it("deve criar múltiplas métricas", async () => {
            // Arrange
            const metrics = [mockUserMetrics, mockUserMetrics]
            vi.mocked(repository.createMany).mockResolvedValue(metrics)

            // Act
            const result = await repository.createMany(metrics)

            // Assert
            expect(result).toBeDefined()
            expect(repository.createMany).toHaveBeenCalledWith(metrics)
        })

        it("deve atualizar múltiplas métricas", async () => {
            // Arrange
            const metrics = [mockUserMetrics, mockUserMetrics]
            vi.mocked(repository.updateMany).mockResolvedValue(metrics)

            // Act
            const result = await repository.updateMany(metrics)

            // Assert
            expect(result).toBeDefined()
            expect(repository.updateMany).toHaveBeenCalledWith(metrics)
        })

        it("deve deletar múltiplas métricas", async () => {
            // Arrange
            const ids = ["123456789", "987654321"]
            vi.mocked(repository.deleteMany).mockResolvedValue()

            // Act
            await repository.deleteMany(ids)

            // Assert
            expect(repository.deleteMany).toHaveBeenCalledWith(ids)
        })
    })

    describe("Operações de Paginação", () => {
        it("deve buscar métricas paginadas", async () => {
            // Arrange
            const mockResult = {
                metrics: [mockUserMetrics],
                total: 100,
                page: 1,
                limit: 10,
                totalPages: 10,
            }
            vi.mocked(repository.findPaginated).mockResolvedValue(mockResult)

            // Act
            const result = await repository.findPaginated(1, 10)

            // Assert
            expect(result).toBeDefined()
            expect(result.metrics).toBeDefined()
            expect(result.total).toBe(100)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(10)
            expect(repository.findPaginated).toHaveBeenCalledWith(1, 10)
        })

        it("deve buscar métricas paginadas com filtros", async () => {
            // Arrange
            const filters = {
                minEngagementRate: 0.05,
                maxEngagementRate: 0.15,
                minFollowers: 100,
                maxFollowers: 1000,
            }
            const mockResult = {
                metrics: [mockUserMetrics],
                total: 50,
                page: 1,
                limit: 10,
                totalPages: 5,
            }
            vi.mocked(repository.findPaginated).mockResolvedValue(mockResult)

            // Act
            const result = await repository.findPaginated(1, 10, filters)

            // Assert
            expect(result).toBeDefined()
            expect(result.total).toBe(50)
            expect(repository.findPaginated).toHaveBeenCalledWith(1, 10, filters)
        })
    })
})

describe("UserMetricsAnalysisService", () => {
    let service: UserMetricsAnalysisService
    let mockRepository: IUserMetricsRepository

    beforeEach(() => {
        vi.clearAllMocks()

        mockRepository = {
            create: vi.fn(),
            findById: vi.fn(),
            findByUserId: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findTopByEngagement: vi.fn(),
            findTopByFollowers: vi.fn(),
            findTopByActivity: vi.fn(),
            findTopByGrowth: vi.fn(),
            findActiveUsers: vi.fn(),
            findInfluencers: vi.fn(),
            findUsersWithModerationIssues: vi.fn(),
            getAverageMetrics: vi.fn(),
            getMetricsDistribution: vi.fn(),
            getMetricsByTimeRange: vi.fn(),
            countByEngagementRange: vi.fn(),
            countByFollowersRange: vi.fn(),
            countByActivityRange: vi.fn(),
            countByGrowthRange: vi.fn(),
            exists: vi.fn(),
            existsByUserId: vi.fn(),
            createMany: vi.fn(),
            updateMany: vi.fn(),
            deleteMany: vi.fn(),
            findPaginated: vi.fn(),
        }

        service = new UserMetricsAnalysisService(mockRepository)
    })

    describe("Análise de Usuário", () => {
        it("deve analisar métricas de um usuário específico", async () => {
            // Arrange
            const userId = "123456789"
            const mockMetrics = new UserMetrics({
                userId,
                totalLikesReceived: 100,
                totalViewsReceived: 1000,
                totalSharesReceived: 50,
                totalCommentsReceived: 200,
                totalMemoriesCreated: 5,
                totalMomentsCreated: 25,
                totalLikesGiven: 80,
                totalCommentsGiven: 150,
                totalSharesGiven: 30,
                totalFollowsGiven: 10,
                totalReportsGiven: 0,
                totalFollowers: 500,
                totalFollowing: 300,
                totalRelations: 800,
                engagementRate: 0.15,
                reachRate: 0.8,
                momentsPublishedGrowthRate30d: 0.2,
                memoriesPublishedGrowthRate30d: 0.1,
                followerGrowthRate30d: 0.05,
                engagementGrowthRate30d: 0.03,
                interactionsGrowthRate30d: 0.04,
                memoriesPerDayAverage: 0.2,
                momentsPerDayAverage: 0.8,
                reportsReceived: 0,
                violationsCount: 0,
                lastMetricsUpdate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const mockAverages = {
                averageEngagementRate: 0.12,
                averageActivityRate: 0.5,
                averageGrowthRate: 0.03,
                averageFollowers: 250,
            }

            const mockDistribution = {
                engagementDistribution: { low: 30, medium: 50, high: 20 },
                activityDistribution: { low: 25, medium: 60, high: 15 },
                followersDistribution: { low: 40, medium: 45, high: 15 },
                growthDistribution: { low: 35, medium: 50, high: 15 },
            }

            vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockMetrics)
            vi.mocked(mockRepository.getAverageMetrics).mockResolvedValue(mockAverages)
            vi.mocked(mockRepository.getMetricsDistribution).mockResolvedValue(mockDistribution)

            // Act
            const result = await service.analyzeUser(userId)

            // Assert
            expect(result).toBeDefined()
            expect(result.performanceAnalysis).toBeDefined()
            expect(result.engagementAnalysis).toBeDefined()
            expect(result.growthAnalysis).toBeDefined()
            expect(result.activityAnalysis).toBeDefined()
            expect(result.recommendations).toBeDefined()
            expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId)
        })

        it("deve lançar erro quando métricas não encontradas", async () => {
            // Arrange
            const userId = "999999999"
            vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

            // Act & Assert
            await expect(service.analyzeUser(userId)).rejects.toThrow("User metrics not found")
        })

        it("deve analisar múltiplas métricas", async () => {
            // Arrange
            const mockMetrics = [
                new UserMetrics({
                    userId: "123456789",
                    totalLikesReceived: 100,
                    totalViewsReceived: 1000,
                    totalSharesReceived: 50,
                    totalCommentsReceived: 200,
                    totalMemoriesCreated: 5,
                    totalMomentsCreated: 25,
                    totalLikesGiven: 80,
                    totalCommentsGiven: 150,
                    totalSharesGiven: 30,
                    totalFollowsGiven: 10,
                    totalReportsGiven: 0,
                    totalFollowers: 500,
                    totalFollowing: 300,
                    totalRelations: 800,
                    engagementRate: 0.15,
                    reachRate: 0.8,
                    momentsPublishedGrowthRate30d: 0.2,
                    memoriesPublishedGrowthRate30d: 0.1,
                    followerGrowthRate30d: 0.05,
                    engagementGrowthRate30d: 0.03,
                    interactionsGrowthRate30d: 0.04,
                    memoriesPerDayAverage: 0.2,
                    momentsPerDayAverage: 0.8,
                    reportsReceived: 0,
                    violationsCount: 0,
                    lastMetricsUpdate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
            ]

            const mockAverages = {
                averageEngagementRate: 0.12,
                averageActivityRate: 0.5,
                averageGrowthRate: 0.03,
                averageFollowers: 250,
            }

            const mockDistribution = {
                engagementDistribution: { low: 30, medium: 50, high: 20 },
                activityDistribution: { low: 25, medium: 60, high: 15 },
                followersDistribution: { low: 40, medium: 45, high: 15 },
                growthDistribution: { low: 35, medium: 50, high: 15 },
            }

            vi.mocked(mockRepository.getAverageMetrics).mockResolvedValue(mockAverages)
            vi.mocked(mockRepository.getMetricsDistribution).mockResolvedValue(mockDistribution)

            // Act
            const result = await service.analyzeMetrics(mockMetrics)

            // Assert
            expect(result).toBeDefined()
            expect(result.performanceAnalysis).toBeDefined()
            expect(result.engagementAnalysis).toBeDefined()
            expect(result.growthAnalysis).toBeDefined()
            expect(result.activityAnalysis).toBeDefined()
            expect(result.recommendations).toBeDefined()
        })

        it("deve retornar análise vazia quando não há métricas", async () => {
            // Arrange
            const mockMetrics: UserMetrics[] = []

            // Act
            const result = await service.analyzeMetrics(mockMetrics)

            // Assert
            expect(result).toBeDefined()
            expect(result.performanceAnalysis.topPerformers).toEqual([])
            expect(result.engagementAnalysis.highEngagement).toEqual([])
            expect(result.growthAnalysis.highGrowth).toEqual([])
            expect(result.activityAnalysis.highActivity).toEqual([])
            expect(result.recommendations.contentOptimization).toEqual([])
        })
    })

    describe("Geração de Recomendações", () => {
        it("deve gerar recomendações baseadas nas métricas", async () => {
            // Arrange
            const mockMetrics = [
                new UserMetrics({
                    userId: "123456789",
                    totalLikesReceived: 100,
                    totalViewsReceived: 1000,
                    totalSharesReceived: 50,
                    totalCommentsReceived: 200,
                    totalMemoriesCreated: 5,
                    totalMomentsCreated: 25,
                    totalLikesGiven: 80,
                    totalCommentsGiven: 150,
                    totalSharesGiven: 30,
                    totalFollowsGiven: 10,
                    totalReportsGiven: 0,
                    totalFollowers: 500,
                    totalFollowing: 300,
                    totalRelations: 800,
                    engagementRate: 0.15,
                    reachRate: 0.8,
                    momentsPublishedGrowthRate30d: 0.2,
                    memoriesPublishedGrowthRate30d: 0.1,
                    followerGrowthRate30d: 0.05,
                    engagementGrowthRate30d: 0.03,
                    interactionsGrowthRate30d: 0.04,
                    memoriesPerDayAverage: 0.2,
                    momentsPerDayAverage: 0.8,
                    reportsReceived: 0,
                    violationsCount: 0,
                    lastMetricsUpdate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
            ]

            const mockAverages = {
                averageEngagementRate: 0.12,
                averageActivityRate: 0.5,
                averageGrowthRate: 0.03,
                averageFollowers: 250,
            }

            const mockDistribution = {
                engagementDistribution: { low: 30, medium: 50, high: 20 },
                activityDistribution: { low: 25, medium: 60, high: 15 },
                followersDistribution: { low: 40, medium: 45, high: 15 },
                growthDistribution: { low: 35, medium: 50, high: 15 },
            }

            vi.mocked(mockRepository.getAverageMetrics).mockResolvedValue(mockAverages)
            vi.mocked(mockRepository.getMetricsDistribution).mockResolvedValue(mockDistribution)

            // Act
            const result = await service.analyzeMetrics(mockMetrics)

            // Assert
            expect(result.recommendations).toBeDefined()
            expect(result.recommendations.contentOptimization).toContain("Increase content creation frequency")
            expect(result.recommendations.engagementImprovements).toContain("Respond to comments promptly")
            expect(result.recommendations.growthStrategies).toContain("Collaborate with other users")
            expect(result.recommendations.activityEnhancement).toContain("Establish daily posting routine")
        })
    })
})