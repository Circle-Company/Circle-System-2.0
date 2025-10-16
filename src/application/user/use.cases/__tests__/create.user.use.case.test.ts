import { beforeEach, describe, expect, it, vi } from "vitest"

import { IUserRepository } from "../../../../domain/user/repositories/user.repository"
import { CreateUserUseCase } from "../create.user.use.case"

describe("CreateUserUseCase", () => {
    let createUserUseCase: CreateUserUseCase
    let mockUserRepository: IUserRepository

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

        createUserUseCase = new CreateUserUseCase(mockUserRepository)
    })

    describe("execute", () => {
        it("deve retornar erro quando nome é muito curto", async () => {
            // Arrange
            const request = {
                name: "A",
                username: "testuser",
                password: "password123",
            }

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Nome deve ter pelo menos 2 caracteres")
            expect(mockUserRepository.save).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando nome está vazio", async () => {
            // Arrange
            const request = {
                name: "",
                username: "testuser",
                password: "password123",
            }

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Nome deve ter pelo menos 2 caracteres")
        })

        it("deve retornar erro quando nome é muito longo", async () => {
            // Arrange
            const request = {
                name: "A".repeat(101),
                username: "testuser",
                password: "password123",
            }

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Nome deve ter no máximo 100 caracteres")
            expect(mockUserRepository.save).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando username está vazio", async () => {
            // Arrange
            const request = {
                name: "Test User",
                username: "",
                password: "password123",
            }

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Username inválido")
        })

        it("deve retornar erro quando username já está em uso", async () => {
            // Arrange
            const request = {
                name: "Test User",
                username: "existinguser",
                password: "password123",
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(true)

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Username já está em uso")
            expect(mockUserRepository.existsByUsername).toHaveBeenCalledWith("existinguser")
            expect(mockUserRepository.save).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando senha é muito curta", async () => {
            // Arrange
            const request = {
                name: "Test User",
                username: "testuser",
                password: "123",
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Senha deve ter pelo menos 6 caracteres")
            expect(mockUserRepository.save).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando senha está vazia", async () => {
            // Arrange
            const request = {
                name: "Test User",
                username: "testuser",
                password: "",
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Senha deve ter pelo menos 6 caracteres")
        })

        it("deve retornar erro quando senha é muito longa", async () => {
            // Arrange
            const request = {
                name: "Test User",
                username: "testuser",
                password: "A".repeat(129),
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Senha deve ter no máximo 128 caracteres")
            expect(mockUserRepository.save).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando bio é muito longa", async () => {
            // Arrange
            const request = {
                name: "Test User",
                username: "testuser",
                password: "password123",
                bio: "A".repeat(501),
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Bio deve ter no máximo 500 caracteres")
            expect(mockUserRepository.save).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando URL da foto de perfil é inválida", async () => {
            // Arrange
            const request = {
                name: "Test User",
                username: "testuser",
                password: "password123",
                profilePicture: "invalid-url",
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)

            // Act
            const result = await createUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("URL da foto de perfil inválida")
            expect(mockUserRepository.save).not.toHaveBeenCalled()
        })
    })
})
