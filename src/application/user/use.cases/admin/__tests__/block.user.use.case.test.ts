import { beforeEach, describe, expect, it, vi } from "vitest"

import { User } from "@/domain/user/entities/user.entity"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { ConflictError } from "@/shared/errors/conflict.error"
import { NotFoundError } from "@/shared/errors/not.found.error"
import { ValidationError } from "@/shared/errors/validation.error"
import { AdminBlockUserUseCase } from "../block.user.use.case"

describe("AdminBlockUserUseCase", () => {
    let adminBlockUserUseCase: AdminBlockUserUseCase
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

        adminBlockUserUseCase = new AdminBlockUserUseCase(mockUserRepository)
    })

    describe("execute", () => {
        it("deve bloquear usuário com sucesso", async () => {
            // Arrange
            const userId = "user-id"
            const reason = "Violação dos termos de uso"
            const adminId = "admin-id"

            const user = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const blockedUser = User.create({
                ...user.toJSON(),
                status: "blocked",
            })

            mockUserRepository.findById.mockResolvedValue(user)
            mockUserRepository.update.mockResolvedValue(blockedUser)

            // Act
            const result = await adminBlockUserUseCase.execute({ userId, reason, adminId })

            // Assert
            expect(result).toEqual(blockedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).toHaveBeenCalledWith(blockedUser)
        })

        it("deve bloquear usuário com motivo padrão quando não fornecido", async () => {
            // Arrange
            const userId = "user-id"
            const adminId = "admin-id"

            const user = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const blockedUser = User.create({
                ...user.toJSON(),
                status: "blocked",
            })

            mockUserRepository.findById.mockResolvedValue(user)
            mockUserRepository.update.mockResolvedValue(blockedUser)

            // Act
            const result = await adminBlockUserUseCase.execute({ userId, adminId })

            // Assert
            expect(result).toEqual(blockedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).toHaveBeenCalledWith(blockedUser)
        })

        it("deve lançar NotFoundError quando usuário não existe", async () => {
            // Arrange
            const userId = "non-existent-user"
            const reason = "Violação dos termos de uso"
            const adminId = "admin-id"

            mockUserRepository.findById.mockResolvedValue(null)

            // Act & Assert
            await expect(
                adminBlockUserUseCase.execute({ userId, reason, adminId }),
            ).rejects.toThrow(NotFoundError)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando userId é inválido", async () => {
            // Arrange
            const invalidUserId = ""
            const reason = "Violação dos termos de uso"
            const adminId = "admin-id"

            // Act & Assert
            await expect(
                adminBlockUserUseCase.execute({ userId: invalidUserId, reason, adminId }),
            ).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando adminId é inválido", async () => {
            // Arrange
            const userId = "user-id"
            const reason = "Violação dos termos de uso"
            const invalidAdminId = ""

            // Act & Assert
            await expect(
                adminBlockUserUseCase.execute({ userId, reason, adminId: invalidAdminId }),
            ).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ConflictError quando usuário já está bloqueado", async () => {
            // Arrange
            const userId = "user-id"
            const reason = "Violação dos termos de uso"
            const adminId = "admin-id"

            const user = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
                status: "blocked", // Usuário já bloqueado
            })

            mockUserRepository.findById.mockResolvedValue(user)

            // Act & Assert
            await expect(
                adminBlockUserUseCase.execute({ userId, reason, adminId }),
            ).rejects.toThrow(ConflictError)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando motivo é muito longo", async () => {
            // Arrange
            const userId = "user-id"
            const reason = "a".repeat(501) // Motivo muito longo
            const adminId = "admin-id"

            // Act & Assert
            await expect(
                adminBlockUserUseCase.execute({ userId, reason, adminId }),
            ).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando motivo contém caracteres inválidos", async () => {
            // Arrange
            const userId = "user-id"
            const reason = "Motivo com <script>alert('xss')</script>"
            const adminId = "admin-id"

            // Act & Assert
            await expect(
                adminBlockUserUseCase.execute({ userId, reason, adminId }),
            ).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findById).not.toHaveBeenCalled()
            expect(mockUserRepository.update).not.toHaveBeenCalled()
        })

        it("deve bloquear usuário com motivo em português", async () => {
            // Arrange
            const userId = "user-id"
            const reason = "Usuário violou as regras da comunidade"
            const adminId = "admin-id"

            const user = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const blockedUser = User.create({
                ...user.toJSON(),
                status: "blocked",
            })

            mockUserRepository.findById.mockResolvedValue(user)
            mockUserRepository.update.mockResolvedValue(blockedUser)

            // Act
            const result = await adminBlockUserUseCase.execute({ userId, reason, adminId })

            // Assert
            expect(result).toEqual(blockedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).toHaveBeenCalledWith(blockedUser)
        })

        it("deve bloquear usuário com motivo em inglês", async () => {
            // Arrange
            const userId = "user-id"
            const reason = "User violated community guidelines"
            const adminId = "admin-id"

            const user = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const blockedUser = User.create({
                ...user.toJSON(),
                status: "blocked",
            })

            mockUserRepository.findById.mockResolvedValue(user)
            mockUserRepository.update.mockResolvedValue(blockedUser)

            // Act
            const result = await adminBlockUserUseCase.execute({ userId, reason, adminId })

            // Assert
            expect(result).toEqual(blockedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).toHaveBeenCalledWith(blockedUser)
        })

        it("deve bloquear usuário com motivo contendo números", async () => {
            // Arrange
            const userId = "user-id"
            const reason = "Usuário violou regra #3 da comunidade"
            const adminId = "admin-id"

            const user = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const blockedUser = User.create({
                ...user.toJSON(),
                status: "blocked",
            })

            mockUserRepository.findById.mockResolvedValue(user)
            mockUserRepository.update.mockResolvedValue(blockedUser)

            // Act
            const result = await adminBlockUserUseCase.execute({ userId, reason, adminId })

            // Assert
            expect(result).toEqual(blockedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).toHaveBeenCalledWith(blockedUser)
        })

        it("deve bloquear usuário com motivo contendo pontuação", async () => {
            // Arrange
            const userId = "user-id"
            const reason = "Usuário violou os termos de uso. Motivo: spam."
            const adminId = "admin-id"

            const user = User.create({
                email: "test@example.com",
                username: "testuser",
                password: "password123",
            })

            const blockedUser = User.create({
                ...user.toJSON(),
                status: "blocked",
            })

            mockUserRepository.findById.mockResolvedValue(user)
            mockUserRepository.update.mockResolvedValue(blockedUser)

            // Act
            const result = await adminBlockUserUseCase.execute({ userId, reason, adminId })

            // Assert
            expect(result).toEqual(blockedUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockUserRepository.update).toHaveBeenCalledWith(blockedUser)
        })
    })
})
