import { describe, it, expect, beforeEach, vi } from "vitest"
import { FollowUserUseCase } from "../follow.user.use.case"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { IUserMetricsRepository } from "@/domain/user/repositories/user.metrics.repository"
import { User } from "@/domain/user/entities/user.entity"
import { UserMetrics } from "@/domain/user/entities/user.metrics.entity"
import { NotFoundError } from "@/shared/errors/not.found.error"
import { ValidationError } from "@/shared/errors/validation.error"
import { ConflictError } from "@/shared/errors/conflict.error"

describe("FollowUserUseCase", () => {
    let followUserUseCase: FollowUserUseCase
    let mockUserRepository: jest.Mocked<IUserRepository>
    let mockUserMetricsRepository: jest.Mocked<IUserMetricsRepository>

    beforeEach(() => {
        mockUserRepository = {
            create: vi.fn(),
            findById: vi.fn(),
            findByEmail: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
            findByUsername: vi.fn(),
            findByPhone: vi.fn(),
            findBySocialId: vi.fn(),
        }

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

        followUserUseCase = new FollowUserUseCase(mockUserRepository, mockUserMetricsRepository)
    })

    describe("execute", () => {
        it("deve seguir um usuário com sucesso", async () => {
            // Arrange
            const followerId = "follower-id"
            const followingId = "following-id"

            const follower = User.create({
                email: "follower@example.com",
                username: "follower",
                password: "password123",
            })

            const following = User.create({
                email: "following@example.com",
                username: "following",
                password: "password123",
            })

            const followerMetrics = UserMetrics.create(followerId)
            const followingMetrics = UserMetrics.create(followingId)

            mockUserRepository.findById
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(following)

            mockUserMetricsRepository.findByUserId
                .mockResolvedValueOnce(followerMetrics)
                .mockResolvedValueOnce(followingMetrics)

            mockUserRepository.update.mockResolvedValue(follower)
            mockUserMetricsRepository.update.mockResolvedValue(followerMetrics)

            // Act
            const result = await followUserUseCase.execute({ followerId, followingId })

            // Assert
            expect(result).toEqual({
                follower,
                following,
                relationship: {
                    type: "follow",
                    followerId,
                    followingId,
                    createdAt: expect.any(Date),
                },
            })

            expect(mockUserRepository.findById).toHaveBeenCalledWith(followerId)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(followingId)
            expect(mockUserRepository.update).toHaveBeenCalledWith(follower)
            expect(mockUserMetricsRepository.update).toHaveBeenCalledWith(followerMetrics)
        })

        it("deve lançar NotFoundError quando follower não existe", async () => {
            // Arrange
            const followerId = "non-existent-follower"
            const followingId = "following-id"

            mockUserRepository.findById.mockResolvedValueOnce(null)

            // Act & Assert
            await expect(followUserUseCase.execute({ followerId, followingId })).rejects.toThrow(
                NotFoundError
            )
            expect(mockUserRepository.findById).toHaveBeenCalledWith(followerId)
            expect(mockUserRepository.findById).not.toHaveBeenCalledWith(followingId)
        })

        it("deve lançar NotFoundError quando usuário a ser seguido não existe", async () => {
            // Arrange
            const followerId = "follower-id"
            const followingId = "non-existent-following"

            const follower = User.create({
                email: "follower@example.com",
                username: "follower",
                password: "password123",
            })

            mockUserRepository.findById
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(null)

            // Act & Assert
            await expect(followUserUseCase.execute({ followerId, followingId })).rejects.toThrow(
                NotFoundError
            )
            expect(mockUserRepository.findById).toHaveBeenCalledWith(followerId)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(followingId)
        })

        it("deve lançar ValidationError quando tentar seguir a si mesmo", async () => {
            // Arrange
            const userId = "same-user-id"

            // Act & Assert
            await expect(followUserUseCase.execute({ followerId: userId, followingId: userId })).rejects.toThrow(
                ValidationError
            )
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
        })

        it("deve lançar ConflictError quando já está seguindo o usuário", async () => {
            // Arrange
            const followerId = "follower-id"
            const followingId = "following-id"

            const follower = User.create({
                email: "follower@example.com",
                username: "follower",
                password: "password123",
            })

            const following = User.create({
                email: "following@example.com",
                username: "following",
                password: "password123",
            })

            // Simular que o follower já está seguindo o following
            follower.follow(followingId)

            mockUserRepository.findById
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(following)

            // Act & Assert
            await expect(followUserUseCase.execute({ followerId, followingId })).rejects.toThrow(
                ConflictError
            )
            expect(mockUserRepository.findById).toHaveBeenCalledWith(followerId)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(followingId)
        })

        it("deve lançar ValidationError quando usuário está bloqueado", async () => {
            // Arrange
            const followerId = "follower-id"
            const followingId = "following-id"

            const follower = User.create({
                email: "follower@example.com",
                username: "follower",
                password: "password123",
            })

            const following = User.create({
                email: "following@example.com",
                username: "following",
                password: "password123",
            })

            // Simular que o follower está bloqueado pelo following
            follower.block(followingId)

            mockUserRepository.findById
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(following)

            // Act & Assert
            await expect(followUserUseCase.execute({ followerId, followingId })).rejects.toThrow(
                ValidationError
            )
            expect(mockUserRepository.findById).toHaveBeenCalledWith(followerId)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(followingId)
        })

        it("deve criar métricas se não existirem", async () => {
            // Arrange
            const followerId = "follower-id"
            const followingId = "following-id"

            const follower = User.create({
                email: "follower@example.com",
                username: "follower",
                password: "password123",
            })

            const following = User.create({
                email: "following@example.com",
                username: "following",
                password: "password123",
            })

            const followerMetrics = UserMetrics.create(followerId)

            mockUserRepository.findById
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(following)

            mockUserMetricsRepository.findByUserId
                .mockResolvedValueOnce(null) // Métricas do follower não existem
                .mockResolvedValueOnce(null) // Métricas do following não existem

            mockUserMetricsRepository.create
                .mockResolvedValueOnce(followerMetrics)
                .mockResolvedValueOnce(UserMetrics.create(followingId))

            mockUserRepository.update.mockResolvedValue(follower)
            mockUserMetricsRepository.update.mockResolvedValue(followerMetrics)

            // Act
            await followUserUseCase.execute({ followerId, followingId })

            // Assert
            expect(mockUserMetricsRepository.create).toHaveBeenCalledTimes(2)
            expect(mockUserMetricsRepository.update).toHaveBeenCalledWith(followerMetrics)
        })
    })
})