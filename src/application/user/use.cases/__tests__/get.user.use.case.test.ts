import { beforeEach, describe, expect, it, vi } from "vitest"

import { IUserRepository } from "../../../../domain/user/repositories/user.repository"
import { GetUserUseCase } from "../get.user.use.case"

describe("GetUserUseCase", () => {
    let getUserUseCase: GetUserUseCase
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

        getUserUseCase = new GetUserUseCase(mockUserRepository)
    })

    describe("execute", () => {
        it("deve retornar usuário por ID com sucesso", async () => {
            // Arrange
            const request = {
                userId: "user-id",
            }

            const mockUser = {
                id: "user-id",
                username: "testuser",
                name: "Test User",
            }

            vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser as any)
            vi.mocked(mockUserRepository.isBlocked).mockResolvedValue(false)

            // Act
            const result = await getUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.user).toEqual(mockUser)
            expect(mockUserRepository.findById).toHaveBeenCalledWith("user-id")
        })

        it("deve retornar erro quando usuário não existe", async () => {
            // Arrange
            const request = {
                userId: "non-existent-user",
            }

            vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

            // Act
            const result = await getUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Usuário não encontrado")
            expect(mockUserRepository.findById).toHaveBeenCalledWith("non-existent-user")
        })

        it("deve retornar erro quando acesso é negado", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "requesting-user-id",
            }

            const mockUser = {
                id: "user-id",
                username: "testuser",
                name: "Test User",
            }

            vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser as any)
            vi.mocked(mockUserRepository.isBlocked).mockResolvedValue(true)

            // Act
            const result = await getUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado ao perfil do usuário")
            expect(mockUserRepository.isBlocked).toHaveBeenCalledWith(
                "requesting-user-id",
                "user-id",
            )
        })

        it("deve permitir acesso ao próprio perfil", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "user-id",
            }

            const mockUser = {
                id: "user-id",
                username: "testuser",
                name: "Test User",
            }

            vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser as any)

            // Act
            const result = await getUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.user).toEqual(mockUser)
            expect(mockUserRepository.isBlocked).not.toHaveBeenCalled()
        })

        it("deve permitir acesso público quando não há usuário solicitante", async () => {
            // Arrange
            const request = {
                userId: "user-id",
            }

            const mockUser = {
                id: "user-id",
                username: "testuser",
                name: "Test User",
            }

            vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser as any)

            // Act
            const result = await getUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.user).toEqual(mockUser)
            expect(mockUserRepository.isBlocked).not.toHaveBeenCalled()
        })
    })
})
