import { describe, it, expect, beforeEach, vi } from "vitest"
import { SearchUsersUseCase } from "../search.users.use.case"
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { User } from "@/domain/user/entities/user.entity"
import { ValidationError } from "@/shared/errors/validation.error"

describe("SearchUsersUseCase", () => {
    let searchUsersUseCase: SearchUsersUseCase
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

        searchUsersUseCase = new SearchUsersUseCase(mockUserRepository)
    })

    describe("execute", () => {
        it("deve buscar usuários com sucesso", async () => {
            // Arrange
            const searchCriteria = {
                query: "test",
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "test1@example.com",
                    username: "testuser1",
                    password: "password123",
                    firstName: "Test",
                    lastName: "User1",
                }),
                User.create({
                    email: "test2@example.com",
                    username: "testuser2",
                    password: "password123",
                    firstName: "Test",
                    lastName: "User2",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await searchUsersUseCase.execute(searchCriteria)

            // Assert
            expect(result).toEqual({
                users,
                total: users.length,
                limit: searchCriteria.limit,
                offset: searchCriteria.offset,
            })
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(searchCriteria)
        })

        it("deve retornar lista vazia quando nenhum usuário é encontrado", async () => {
            // Arrange
            const searchCriteria = {
                query: "nonexistent",
                limit: 10,
                offset: 0,
            }

            mockUserRepository.findMany.mockResolvedValue([])

            // Act
            const result = await searchUsersUseCase.execute(searchCriteria)

            // Assert
            expect(result).toEqual({
                users: [],
                total: 0,
                limit: searchCriteria.limit,
                offset: searchCriteria.offset,
            })
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(searchCriteria)
        })

        it("deve usar valores padrão quando limit e offset não são fornecidos", async () => {
            // Arrange
            const searchCriteria = {
                query: "test",
            }

            const users = [
                User.create({
                    email: "test@example.com",
                    username: "testuser",
                    password: "password123",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await searchUsersUseCase.execute(searchCriteria)

            // Assert
            expect(result).toEqual({
                users,
                total: users.length,
                limit: 20, // Valor padrão
                offset: 0, // Valor padrão
            })
            expect(mockUserRepository.findMany).toHaveBeenCalledWith({
                ...searchCriteria,
                limit: 20,
                offset: 0,
            })
        })

        it("deve validar limite máximo", async () => {
            // Arrange
            const searchCriteria = {
                query: "test",
                limit: 1000, // Limite muito alto
                offset: 0,
            }

            const users = [
                User.create({
                    email: "test@example.com",
                    username: "testuser",
                    password: "password123",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await searchUsersUseCase.execute(searchCriteria)

            // Assert
            expect(result.limit).toBe(100) // Limite máximo aplicado
            expect(mockUserRepository.findMany).toHaveBeenCalledWith({
                ...searchCriteria,
                limit: 100,
            })
        })

        it("deve validar offset mínimo", async () => {
            // Arrange
            const searchCriteria = {
                query: "test",
                limit: 10,
                offset: -5, // Offset negativo
            }

            const users = [
                User.create({
                    email: "test@example.com",
                    username: "testuser",
                    password: "password123",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await searchUsersUseCase.execute(searchCriteria)

            // Assert
            expect(result.offset).toBe(0) // Offset mínimo aplicado
            expect(mockUserRepository.findMany).toHaveBeenCalledWith({
                ...searchCriteria,
                offset: 0,
            })
        })

        it("deve lançar ValidationError quando query é muito curta", async () => {
            // Arrange
            const searchCriteria = {
                query: "a", // Query muito curta
                limit: 10,
                offset: 0,
            }

            // Act & Assert
            await expect(searchUsersUseCase.execute(searchCriteria)).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findMany).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando query está vazia", async () => {
            // Arrange
            const searchCriteria = {
                query: "",
                limit: 10,
                offset: 0,
            }

            // Act & Assert
            await expect(searchUsersUseCase.execute(searchCriteria)).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findMany).not.toHaveBeenCalled()
        })

        it("deve lançar ValidationError quando query contém apenas espaços", async () => {
            // Arrange
            const searchCriteria = {
                query: "   ",
                limit: 10,
                offset: 0,
            }

            // Act & Assert
            await expect(searchUsersUseCase.execute(searchCriteria)).rejects.toThrow(ValidationError)
            expect(mockUserRepository.findMany).not.toHaveBeenCalled()
        })

        it("deve filtrar resultados por critérios específicos", async () => {
            // Arrange
            const searchCriteria = {
                query: "test",
                filters: {
                    isActive: true,
                    location: "São Paulo",
                },
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "test@example.com",
                    username: "testuser",
                    password: "password123",
                    location: "São Paulo",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await searchUsersUseCase.execute(searchCriteria)

            // Assert
            expect(result.users).toEqual(users)
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(searchCriteria)
        })

        it("deve ordenar resultados por critério especificado", async () => {
            // Arrange
            const searchCriteria = {
                query: "test",
                sortBy: "createdAt",
                sortOrder: "desc",
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "test@example.com",
                    username: "testuser",
                    password: "password123",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await searchUsersUseCase.execute(searchCriteria)

            // Assert
            expect(result.users).toEqual(users)
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(searchCriteria)
        })

        it("deve retornar metadados de paginação corretos", async () => {
            // Arrange
            const searchCriteria = {
                query: "test",
                limit: 5,
                offset: 10,
            }

            const users = [
                User.create({
                    email: "test@example.com",
                    username: "testuser",
                    password: "password123",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await searchUsersUseCase.execute(searchCriteria)

            // Assert
            expect(result).toEqual({
                users,
                total: users.length,
                limit: 5,
                offset: 10,
            })
        })

        it("deve lidar com caracteres especiais na query", async () => {
            // Arrange
            const searchCriteria = {
                query: "José da Silva",
                limit: 10,
                offset: 0,
            }

            const users = [
                User.create({
                    email: "jose@example.com",
                    username: "josesilva",
                    password: "password123",
                    firstName: "José",
                    lastName: "da Silva",
                }),
            ]

            mockUserRepository.findMany.mockResolvedValue(users)

            // Act
            const result = await searchUsersUseCase.execute(searchCriteria)

            // Assert
            expect(result.users).toEqual(users)
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(searchCriteria)
        })
    })
})
