import { beforeEach, describe, expect, it, vi } from "vitest"

import { UserMetrics } from "@/domain/user/entities/user.metrics.entity"
import { IUserMetricsRepository } from "@/domain/user/repositories/user.metrics.repository"
import { NotFoundError } from "@/shared/errors/not.found.error"
import { ValidationError } from "@/shared/errors/validation.error"
import { GetUserMetricsUseCase } from "../get.user.metrics.use.case"

describe("GetUserMetricsUseCase", () => {
    let getUserMetricsUseCase: GetUserMetricsUseCase
    let mockUserMetricsRepository: jest.Mocked<IUserMetricsRepository>

    beforeEach(() => {
        mockUserMetricsRepository = {
            create: vi.fn(),
            findByUserId: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findAll: vi.fn(),
            findTopUsers: vi.fn(),
            findUsersByEngagement: vi.fn(),
            findUsersByGrowth: vi.fn(),
        }

        getUserMetricsUseCase = new GetUserMetricsUseCase(mockUserMetricsRepository)
    })

    describe("execute", () => {
        it("deve retornar métricas do usuário com sucesso", async () => {
            // Arrange
            const userId = "user-id"
            const userMetrics = UserMetrics.create(userId)

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(mockUserMetricsRepository.findByUserId).toHaveBeenCalledWith(userId)
        })

        it("deve lançar NotFoundError quando métricas não existem", async () => {
            // Arrange
            const userId = "non-existent-user"

            mockUserMetricsRepository.findByUserId.mockResolvedValue(null)

            // Act & Assert
            await expect(getUserMetricsUseCase.execute({ userId })).rejects.toThrow(NotFoundError)
            expect(mockUserMetricsRepository.findByUserId).toHaveBeenCalledWith(userId)
        })

        it("deve lançar ValidationError quando userId é inválido", async () => {
            // Arrange
            const invalidUserId = ""

            // Act & Assert
            await expect(getUserMetricsUseCase.execute({ userId: invalidUserId })).rejects.toThrow(
                ValidationError,
            )
            expect(mockUserMetricsRepository.findByUserId).not.toHaveBeenCalled()
        })

        it("deve retornar métricas com dados completos", async () => {
            // Arrange
            const userId = "user-id"
            const userMetrics = UserMetrics.create(userId)

            // Simular algumas métricas
            userMetrics.incrementActionMetrics({ likesGiven: 10 })
            userMetrics.incrementReceivedMetrics({ likesReceived: 5 })
            userMetrics.incrementCreationMetrics({ momentsCreated: 3 })

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(result.userId).toBe(userId)
            expect(mockUserMetricsRepository.findByUserId).toHaveBeenCalledWith(userId)
        })

        it("deve retornar métricas vazias para usuário novo", async () => {
            // Arrange
            const userId = "new-user-id"
            const userMetrics = UserMetrics.create(userId)

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(result.totalLikesGiven).toBe(0)
            expect(result.totalLikesReceived).toBe(0)
            expect(result.totalMomentsCreated).toBe(0)
            expect(result.totalFollowers).toBe(0)
            expect(result.totalFollowing).toBe(0)
        })

        it("deve retornar métricas com crescimento calculado", async () => {
            // Arrange
            const userId = "user-id"
            const userMetrics = UserMetrics.create(userId)

            // Simular métricas com crescimento
            userMetrics.incrementReceivedMetrics({ followersReceived: 10 })
            userMetrics.incrementActionMetrics({ momentsCreated: 5 })

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(result.totalFollowers).toBe(10)
            expect(result.totalMomentsCreated).toBe(5)
        })

        it("deve retornar métricas com engajamento calculado", async () => {
            // Arrange
            const userId = "user-id"
            const userMetrics = UserMetrics.create(userId)

            // Simular métricas de engajamento
            userMetrics.incrementActionMetrics({ likesGiven: 20, commentsGiven: 10 })
            userMetrics.incrementReceivedMetrics({ likesReceived: 15, commentsReceived: 8 })

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(result.totalLikesGiven).toBe(20)
            expect(result.totalCommentsGiven).toBe(10)
            expect(result.totalLikesReceived).toBe(15)
            expect(result.totalCommentsReceived).toBe(8)
        })

        it("deve retornar métricas com taxas de crescimento", async () => {
            // Arrange
            const userId = "user-id"
            const userMetrics = UserMetrics.create(userId)

            // Simular métricas com taxas
            userMetrics.incrementCreationMetrics({ momentsCreated: 10 })
            userMetrics.incrementReceivedMetrics({ followersReceived: 5 })

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(result.totalMomentsCreated).toBe(10)
            expect(result.totalFollowers).toBe(5)
            expect(result.momentsPerDayAverage).toBeDefined()
            expect(result.followerGrowthRate30d).toBeDefined()
        })

        it("deve retornar métricas com dados de visualização", async () => {
            // Arrange
            const userId = "user-id"
            const userMetrics = UserMetrics.create(userId)

            // Simular métricas de visualização
            userMetrics.incrementReceivedMetrics({ viewsReceived: 100 })

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(result.totalViewsReceived).toBe(100)
        })

        it("deve retornar métricas com dados de compartilhamento", async () => {
            // Arrange
            const userId = "user-id"
            const userMetrics = UserMetrics.create(userId)

            // Simular métricas de compartilhamento
            userMetrics.incrementActionMetrics({ sharesGiven: 5 })
            userMetrics.incrementReceivedMetrics({ sharesReceived: 3 })

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(result.totalSharesGiven).toBe(5)
            expect(result.totalSharesReceived).toBe(3)
        })

        it("deve retornar métricas com dados de relacionamento", async () => {
            // Arrange
            const userId = "user-id"
            const userMetrics = UserMetrics.create(userId)

            // Simular métricas de relacionamento
            userMetrics.incrementActionMetrics({ followsGiven: 10 })
            userMetrics.incrementReceivedMetrics({ followersReceived: 8 })

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(result.totalFollowing).toBe(10)
            expect(result.totalFollowers).toBe(8)
        })

        it("deve retornar métricas com dados de moderação", async () => {
            // Arrange
            const userId = "user-id"
            const userMetrics = UserMetrics.create(userId)

            // Simular métricas de moderação
            userMetrics.incrementActionMetrics({ reportsGiven: 2 })
            userMetrics.incrementReceivedMetrics({ reportsReceived: 1 })

            mockUserMetricsRepository.findByUserId.mockResolvedValue(userMetrics)

            // Act
            const result = await getUserMetricsUseCase.execute({ userId })

            // Assert
            expect(result).toEqual(userMetrics)
            expect(result.totalReportsSpecifically).toBe(2)
            expect(result.reportsReceived).toBe(1)
        })
    })
})
