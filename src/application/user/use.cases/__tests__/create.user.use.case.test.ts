import { beforeEach, describe, expect, it, vi } from "vitest"

import { User } from "@/domain/user/entities/user.entity"
import { UserMetrics } from "@/domain/user/entities/user.metrics.entity"
import { IUserMetricsRepository } from "@/domain/user/repositories/user.metrics.repository"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { ValidationError } from "@/shared/errors/validation.error"
import { CreateUserUseCase } from "../create.user.use.case"

describe("CreateUserUseCase", () => {
    let createUserUseCase: CreateUserUseCase
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

        createUserUseCase = new CreateUserUseCase(mockUserRepository, mockUserMetricsRepository)
    })

    describe("execute", () => {
        it("deve criar um usuário com sucesso", async () => {
            // Arrange
            const input = {
                email: "test@example.com",
                username: "testuser",
                password: "password123",
                phone: "+1234567890",
                firstName: "Test",
                lastName: "User",
                dateOfBirth: new Date("1990-01-01"),
                bio: "Test bio",
                location: "Test City",
                preferences: {
                    notifications: true,
                    privacy: "public",
                },
            }

            const expectedUser = User.create({
                email: input.email,
                username: input.username,
                password: input.password,
                phone: input.phone,
                firstName: input.firstName,
                lastName: input.lastName,
                dateOfBirth: input.dateOfBirth,
                bio: input.bio,
                location: input.location,
                preferences: input.preferences,
            })

            const expectedMetrics = UserMetrics.create(expectedUser.id)

            mockUserRepository.findByEmail.mockResolvedValue(null)
            mockUserRepository.findByUsername.mockResolvedValue(null)
            mockUserRepository.create.mockResolvedValue(expectedUser)
            mockUserMetricsRepository.create.mockResolvedValue(expectedMetrics)

            // Act
            const result = await createUserUseCase.execute(input)

            // Assert
            expect(result).toEqual({
                user: expectedUser,
                metrics: expectedMetrics,
            })

            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email)
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(input.username)
            expect(mockUserRepository.create).toHaveBeenCalledWith(expect.any(User))
            expect(mockUserMetricsRepository.create).toHaveBeenCalledWith(expect.any(UserMetrics))
        })

        it("deve lançar ValidationError quando email já existe", async () => {
            // Arrange
            const input = {
                email: "existing@example.com",
                username: "testuser",
                password: "password123",
            }

            const existingUser = User.create({
                email: input.email,
                username: "otheruser",
                password: "password123",
            })

            mockUserRepository.findByEmail.mockResolvedValue(existingUser)

            // Act & Assert
            await expect(createUserUseCase.execute(input)).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email)
            expect(mockUserRepository.create).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando username já existe", async () => {
            // Arrange
            const input = {
                email: "test@example.com",
                username: "existinguser",
                password: "password123",
            }

            const existingUser = User.create({
                email: "other@example.com",
                username: input.username,
                password: "password123",
            })

            mockUserRepository.findByEmail.mockResolvedValue(null)
            mockUserRepository.findByUsername.mockResolvedValue(existingUser)

            // Act & Assert
            await expect(createUserUseCase.execute(input)).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email)
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(input.username)
            expect(mockUserRepository.create).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando dados obrigatórios estão faltando", async () => {
            // Arrange
            const input = {
                email: "",
                username: "",
                password: "",
            }

            // Act & Assert
            await expect(createUserUseCase.execute(input)).rejects.toThrow(ValidationError)
        })

        it("deve lançar ConflictError quando email é inválido", async () => {
            // Arrange
            const input = {
                email: "invalid-email",
                username: "testuser",
                password: "password123",
            }

            // Act & Assert
            await expect(createUserUseCase.execute(input)).rejects.toThrow(ValidationError)
        })

        it("deve lançar ValidationError quando senha é muito fraca", async () => {
            // Arrange
            const input = {
                email: "test@example.com",
                username: "testuser",
                password: "123", // Senha muito fraca
            }

            // Act & Assert
            await expect(createUserUseCase.execute(input)).rejects.toThrow(ValidationError)
        })

        it("deve lançar ValidationError quando usuário é menor de idade", async () => {
            // Arrange
            const input = {
                email: "test@example.com",
                username: "testuser",
                password: "password123",
                dateOfBirth: new Date(Date.now() - 16 * 365 * 24 * 60 * 60 * 1000), // 16 anos
            }

            // Act & Assert
            await expect(createUserUseCase.execute(input)).rejects.toThrow(ValidationError)
        })
    })
})
