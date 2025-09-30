import { beforeEach, describe, expect, it, vi } from "vitest"

import { User } from "@/domain/user/entities/user.entity"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { ConflictError } from "@/shared/errors/conflict.error"
import { NotFoundError } from "@/shared/errors/not.found.error"
import { ValidationError } from "@/shared/errors/validation.error"
import { UpdateUserUseCase } from "../update.user.use.case"

describe("UpdateUserUseCase", () => {
    let updateUserUseCase: UpdateUserUseCase
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

        updateUserUseCase = new UpdateUserUseCase(mockUserRepository)
    })

    describe("execute", () => {
        it("deve atualizar usuário com sucesso", async () => {
            // Arrange
            const userId = "user-id"
            const existingUser = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
                firstName: "Test",
                lastName: "User",
            })

            const updateData = {
                firstName: "Updated",
                lastName: "Name",
                bio: "Updated bio",
                location: "Updated City",
            }

            const updatedUser = User.create({
                ...existingUser.toJSON(),
                ...updateData,
            })

            mockUserRepository.findById.mockResolvedValue(existingUser)
            mockUserRepository.update.mockResolvedValue(updatedUser)

            // Act
            const result = await updateUserUseCase.execute({ userId, ...updateData })

            // Assert
            expect(result).toEqual(updatedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).toHaveBeenCalledWith(updatedUser)
        })

        it("deve atualizar email com verificação de conflito", async () => {
            // Arrange
            const userId = "user-id"
            const existingUser = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const newEmail = "newemail@example.com"
            const updatedUser = User.create({
                ...existingUser.toJSON(),
                email: newEmail,
            })

            mockUserRepository.findById.mockResolvedValue(existingUser)
            mockUserRepository.findByEmail.mockResolvedValue(null) // Email não existe
            mockUserRepository.update.mockResolvedValue(updatedUser)

            // Act
            const result = await updateUserUseCase.execute({ userId, email: newEmail })

            // Assert
            expect(result).toEqual(updatedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(newEmail)
            expect(mockUserRepository.update).toHaveBeenCalledWith(updatedUser)
        })

        it("deve atualizar username com verificação de conflito", async () => {
            // Arrange
            const userId = "user-id"
            const existingUser = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const newUsername = "newusername"
            const updatedUser = User.create({
                ...existingUser.toJSON(),
                username: newUsername,
            })

            mockUserRepository.findById.mockResolvedValue(existingUser)
            mockUserRepository.findByUsername.mockResolvedValue(null) // Username não existe
            mockUserRepository.update.mockResolvedValue(updatedUser)

            // Act
            const result = await updateUserUseCase.execute({ userId, username: newUsername })

            // Assert
            expect(result).toEqual(updatedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(newUsername)
            expect(mockUserRepository.update).toHaveBeenCalledWith(updatedUser)
        })

        it("deve lançar NotFoundError quando usuário não existe", async () => {
            // Arrange
            const userId = "non-existent-id"
            const updateData = { firstName: "Updated" }

            mockUserRepository.findById.mockResolvedValue(null)

            // Act & Assert
            await expect(updateUserUseCase.execute({ userId, ...updateData })).rejects.toThrow(
                NotFoundError,
            )
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando ID é inválido", async () => {
            // Arrange
            const invalidUserId = ""
            const updateData = { firstName: "Updated" }

            // Act & Assert
            await expect(
                updateUserUseCase.execute({ userId: invalidUserId, ...updateData }),
            ).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando email é inválido", async () => {
            // Arrange
            const userId = "user-id"
            const invalidEmail = "invalid-email"

            // Act & Assert
            await expect(
                updateUserUseCase.execute({ userId, email: invalidEmail }),
            ).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando username é inválido", async () => {
            // Arrange
            const userId = "user-id"
            const invalidUsername = ""

            // Act & Assert
            await expect(
                updateUserUseCase.execute({ userId, username: invalidUsername }),
            ).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ConflictError quando email já está em uso", async () => {
            // Arrange
            const userId = "user-id"
            const existingUser = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const existingEmail = "existing@example.com"
            const otherUser = User.create({
                email: existingEmail,
                username: "otheruser",
                password: "password123",
            })

            mockUserRepository.findById.mockResolvedValue(existingUser)
            mockUserRepository.findByEmail.mockResolvedValue(otherUser)

            // Act & Assert
            await expect(
                updateUserUseCase.execute({ userId, email: existingEmail }),
            ).rejects.toThrow(ConflictError)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(existingEmail)
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ConflictError quando username já está em uso", async () => {
            // Arrange
            const userId = "user-id"
            const existingUser = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const existingUsername = "existinguser"
            const otherUser = User.create({
                email: "other@example.com",
                username: existingUsername,
                password: "password123",
            })

            mockUserRepository.findById.mockResolvedValue(existingUser)
            mockUserRepository.findByUsername.mockResolvedValue(otherUser)

            // Act & Assert
            await expect(
                updateUserUseCase.execute({ userId, username: existingUsername }),
            ).rejects.toThrow(ConflictError)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(existingUsername)
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve permitir atualizar para o mesmo email/username do usuário", async () => {
            // Arrange
            const userId = "user-id"
            const existingUser = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const updateData = {
                firstName: "Updated",
            }

            const updatedUser = User.create({
                ...existingUser.toJSON(),
                ...updateData,
            })

            mockUserRepository.findById.mockResolvedValue(existingUser)
            mockUserRepository.update.mockResolvedValue(updatedUser)

            // Act - tentar atualizar com o mesmo email e username
            const result = await updateUserUseCase.execute({
                userId,
                email: existingUser.email,
                username: existingUser.username,
                ...updateData,
            })

            // Assert
            expect(result).toEqual(updatedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).toHaveBeenCalledWith(updatedUser)
            // Não deve verificar conflitos para o mesmo email/username
        })

        it("deve atualizar apenas campos fornecidos", async () => {
            // Arrange
            const userId = "user-id"
            const existingUser = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
                firstName: "Original",
                lastName: "Name",
                bio: "Original bio",
            })

            const updateData = {
                firstName: "Updated",
            }

            const updatedUser = User.create({
                ...existingUser.toJSON(),
                ...updateData,
            })

            mockUserRepository.findById.mockResolvedValue(existingUser)
            mockUserRepository.update.mockResolvedValue(updatedUser)

            // Act
            const result = await updateUserUseCase.execute({ userId, ...updateData })

            // Assert
            expect(result).toEqual(updatedUser)
            expect(result.firstName).toBe("Updated")
            expect(result.lastName).toBe("Name") // Não deve ter mudado
            expect(result.bio).toBe("Original bio") // Não deve ter mudado
        })
    })
})
