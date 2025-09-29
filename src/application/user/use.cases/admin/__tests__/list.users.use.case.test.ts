import { describe, it, expect, beforeEach, vi } from "vitest"
import { AdminListUsersUseCase } from "../list.users.use.case"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { User } from "@/domain/user/entities/user.entity"
import { ValidationError } from "@/shared/errors/validation.error"

describe("AdminListUsersUseCase", () => {
    let adminListUsersUseCase: AdminListUsersUseCase
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

        adminListUsersUseCase = new AdminListUsersUseCase(mockUserRepository)
    })

    describe("execute", () => {
        it("deve listar usuários com sucesso", async () => {
            // Arrange
            const filters = {
                status: "active",
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "user1@example.com",
                    username: "user1",
                    password: "password123",
                    status: "active",
                }),
                User.create({
                    email: "user2@example.com",
                    username: "user2",
                    password: "password123",
                    status: "active",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result).toEqual({
                users,
                total: users.length,
                limit: filters.limit,
                offset: filters.offset,
            })
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(filters)
        })

        it("deve retornar lista vazia quando nenhum usuário é encontrado", async () => {
            // Arrange
            const filters = {
                status: "blocked",
                limit: 10,
                offset: 0,
            }

            mockUserRepository.findMany.mockResolvedValue([])

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result).toEqual({
                users: [],
                total: 0,
                limit: filters.limit,
                offset: filters.offset,
            })
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(filters)
        })

        it("deve usar valores padrão quando limit e offset não são fornecidos", async () => {
            // Arrange
            const filters = {
                status: "active",
            }

            const users = [
                User.create({
                    email: "user@example.com",
                    username: "user",
                    password: "password123",
                    status: "active",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result).toEqual({
                users,
                total: users.length,
                limit: 20, // Valor padrão
                offset: 0, // Valor padrão
            })
            expect(mockUserRepository.findMany).toHaveBeenCalledWith({
                ...filters,
                limit: 20,
                offset: 0,
            })
        })

        it("deve validar limite máximo", async () => {
            // Arrange
            const filters = {
                status: "active",
                limit: 1000, // Limite muito alto
                offset: 0,
            }

            const users = [
                User.create({
                    email: "user@example.com",
                    username: "user",
                    password: "password123",
                    status: "active",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result.limit).toBe(100) // Limite máximo aplicado
            expect(mockUserRepository.findMany).toHaveBeenCalledWith({
                ...filters,
                limit: 100,
            })
        })

        it("deve validar offset mínimo", async () => {
            // Arrange
            const filters = {
                status: "active",
                limit: 10,
                offset: -5, // Offset negativo
            }

            const users = [
                User.create({
                    email: "user@example.com",
                    username: "user",
                    password: "password123",
                    status: "active",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result.offset).toBe(0) // Offset mínimo aplicado
            expect(mockUserRepository.findMany).toHaveBeenCalledWith({
                ...filters,
                offset: 0,
            })
        })

        it("deve filtrar por status", async () => {
            // Arrange
            const filters = {
                status: "blocked",
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "blocked@example.com",
                    username: "blocked",
                    password: "password123",
                    status: "blocked",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result.users).toEqual(users)
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(filters)
        })

        it("deve filtrar por data de criação", async () => {
            // Arrange
            const filters = {
                createdAtFrom: new Date("2023-01-01"),
                createdAtTo: new Date("2023-12-31"),
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "user@example.com",
                    username: "user",
                    password: "password123",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result.users).toEqual(users)
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(filters)
        })

        it("deve filtrar por localização", async () => {
            // Arrange
            const filters = {
                location: "São Paulo",
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "user@example.com",
                    username: "user",
                    password: "password123",
                    location: "São Paulo",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result.users).toEqual(users)
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(filters)
        })

        it("deve ordenar por critério especificado", async () => {
            // Arrange
            const filters = {
                sortBy: "createdAt",
                sortOrder: "desc",
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "user@example.com",
                    username: "user",
                    password: "password123",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result.users).toEqual(users)
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(filters)
        })

        it("deve retornar metadados de paginação corretos", async () => {
            // Arrange
            const filters = {
                status: "active",
                limit: 5,
                offset: 10,
            }

            const users = [
                User.create({
                    email: "user@example.com",
                    username: "user",
                    password: "password123",
                    status: "active",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result).toEqual({
                users,
                total: users.length,
                limit: 5,
                offset: 10,
            })
        })

        it("deve filtrar por múltiplos critérios", async () => {
            // Arrange
            const filters = {
                status: "active",
                location: "São Paulo",
                createdAtFrom: new Date("2023-01-01"),
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "user@example.com",
                    username: "user",
                    password: "password123",
                    status: "active",
                    location: "São Paulo",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await adminListUsersUseCase.execute(filters)

            // Assert
            expect(result.users).toEqual(users)
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(filters)
        })

        it("deve validar data de criação", async () => {
            // Arrange
            const filters = {
                createdAtFrom: new Date("2023-12-31"),
                createdAtTo: new Date("2023-01-01"), // Data final antes da inicial
                limit: 10,
                offset: 0,
            }

            // Act & Assert
            await expect(adminListUsersUseCase.execute(filters)).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findMany).not.toHaveBeenCalled()
        })

        it("deve validar status inválido", async () => {
            // Arrange
            const filters = {
                status: "invalid-status",
                limit: 10,
                offset: 0,
            }

            // Act & Assert
            await expect(adminListUsersUseCase.execute(filters)).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findMany).not.toHaveBeenCalled()
        })

        it("deve validar ordenação inválida", async () => {
            // Arrange
            const filters = {
                sortBy: "invalid-field",
                sortOrder: "desc",
                limit: 10,
                offset: 0,
            }

            // Act & Assert
            await expect(adminListUsersUseCase.execute(filters)).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findMany).not.toHaveBeenCalled()
        })

        it("deve validar ordem de ordenação inválida", async () => {
            // Arrange
            const filters = {
                sortBy: "createdAt",
                sortOrder: "invalid-order",
                limit: 10,
                offset: 0,
            }

            // Act & Assert
            await expect(adminListUsersUseCase.execute(filters)).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findMany).not.toHaveBeenCalled()
        })
    })
})
