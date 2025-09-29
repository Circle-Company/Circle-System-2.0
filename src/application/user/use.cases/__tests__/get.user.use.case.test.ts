import { describe, it, expect, beforeEach, vi } from "vitest"
import { GetUserUseCase } from "../get.user.use.case"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { User } from "@/domain/user/entities/user.entity"
import { NotFoundError } from "@/shared/errors/not.found.error"
import { ValidationError } from "@/shared/errors/validation.error"

describe("GetUserUseCase", () => {
    let getUserUseCase: GetUserUseCase
    let mockUserRepository: jest.Mocked<IUserRepository>

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

        getUserUseCase = new GetUserUseCase(mockUserRepository)
    })

    describe("execute", () => {
        it("deve retornar usuário por ID com sucesso", async () => {
            // Arrange
            const userId = "user-id"
            const user = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
                firstName: "Test",
                lastName: "User",
            })

            mockUserRepository.findById.mockResolvedValue(user)

            // Act
            const result = await getUserUseCase.execute({ id: userId })

            // Assert
            expect(result).toEqual(user)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
        })

        it("deve retornar usuário por email com sucesso", async () => {
            // Arrange
            const email = "test@example.com"
            const user = User.create({
                email,
                username: "testuser",
                password: "password123",
            })

            mockUserRepository.findByEmail.mockResolvedValue(user)

            // Act
            const result = await getUserUseCase.execute({ email })

            // Assert
            expect(result).toEqual(user)
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email)
        })

        it("deve retornar usuário por username com sucesso", async () => {
            // Arrange
            const username = "testuser"
            const user = User.create({
                email: "test@example.com",
                username,
                password: "password123",
            })

            mockUserRepository.findByUsername.mockResolvedValue(user)

            // Act
            const result = await getUserUseCase.execute({ username })

            // Assert
            expect(result).toEqual(user)
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username)
        })

        it("deve lançar NotFoundError quando usuário não existe por ID", async () => {
            // Arrange
            const userId = "non-existent-id"

            mockUserRepository.findById.mockResolvedValue(null)

            // Act & Assert
            await expect(getUserUseCase.execute({ id: userId })).rejects.toThrow(NotFoundError)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
        })

        it("deve lançar NotFoundError quando usuário não existe por email", async () => {
            // Arrange
            const email = "nonexistent@example.com"

            mockUserRepository.findByEmail.mockResolvedValue(null)

            // Act & Assert
            await expect(getUserUseCase.execute({ email })).rejects.toThrow(NotFoundError)
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email)
        })

        it("deve lançar NotFoundError quando usuário não existe por username", async () => {
            // Arrange
            const username = "nonexistentuser"

            mockUserRepository.findByUsername.mockResolvedValue(null)

            // Act & Assert
            await expect(getUserUseCase.execute({ username })).rejects.toThrow(NotFoundError)
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username)
        })

        it("deve lançar ValidationError quando nenhum parâmetro é fornecido", async () => {
            // Act & Assert
            await expect(getUserUseCase.execute({})).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
            expect(mockUserRepository.findByEmail).not.toHaveBeenCalled()
            expect(mockUserRepository.findByUsername).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando múltiplos parâmetros são fornecidos", async () => {
            // Act & Assert
            await expect(
                getUserUseCase.execute({
                    id: "user-id",
                    email: "test@example.com",
                })
            ).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
            expect(mockUserRepository.findByEmail).not.toHaveBeenCalled()
            expect(mockUserRepository.findByUsername).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando email é inválido", async () => {
            // Arrange
            const invalidEmail = "invalid-email"

            // Act & Assert
            await expect(getUserUseCase.execute({ email: invalidEmail })).rejects.toThrow(
                ValidationError
            )
            expect(mockUserRepository.findByEmail).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando username é inválido", async () => {
            // Arrange
            const invalidUsername = "" // Username vazio

            // Act & Assert
            await expect(getUserUseCase.execute({ username: invalidUsername })).rejects.toThrow(
                ValidationError
            )
            expect(mockUserRepository.findByUsername).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando ID é inválido", async () => {
            // Arrange
            const invalidId = "" // ID vazio

            // Act & Assert
            await expect(getUserUseCase.execute({ id: invalidId })).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
        })

        it("deve retornar usuário com dados completos", async () => {
            // Arrange
            const userId = "user-id"
            const user = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
                firstName: "Test",
                lastName: "User",
                dateOfBirth: new Date("1990-01-01"),
                bio: "Test bio",
                location: "Test City",
                preferences: {
                    notifications: true,
                    privacy: "public",
                },
            })

            mockUserRepository.findById.mockResolvedValue(user)

            // Act
            const result = await getUserUseCase.execute({ id: userId })

            // Assert
            expect(result).toEqual(user)
            expect(result.firstName).toBe("Test")
            expect(result.lastName).toBe("User")
            expect(result.bio).toBe("Test bio")
            expect(result.location).toBe("Test City")
            expect(result.preferences.notifications).toBe(true)
            expect(result.preferences.privacy).toBe("public")
        })
    })
})
