import { beforeEach, describe, expect, it, vi } from "vitest"

import { IUserRepository } from "../../../../domain/user/repositories/user.repository"
import { UserService } from "../../services/user.service"
import { UpdateUserUseCase } from "../update.user.use.case"

describe("UpdateUserUseCase", () => {
    let updateUserUseCase: UpdateUserUseCase
    let mockUserRepository: IUserRepository
    let mockUserService: UserService

    beforeEach(() => {
        vi.clearAllMocks()

        mockUserRepository = {
            save: vi.fn(),
            findById: vi.fn(),
            findByUsername: vi.fn(),
            existsByUsername: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            isBlocked: vi.fn(),
            isFollowing: vi.fn(),
            followUser: vi.fn(),
            unfollowUser: vi.fn(),
            blockUser: vi.fn(),
            unblockUser: vi.fn(),
        }

        mockUserService = {
            updateUser: vi.fn(),
        } as any

        updateUserUseCase = new UpdateUserUseCase(mockUserRepository, mockUserService)
    })

    describe("execute", () => {
        it("deve atualizar usuário com sucesso", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "user-id",
                updates: {
                    name: "Updated Name",
                    bio: "Updated bio",
                },
            }

            const mockUpdatedUser = {
                id: "user-id",
                username: "testuser",
                name: "Updated Name",
                bio: "Updated bio",
            }

            vi.mocked(mockUserService.updateUser).mockResolvedValue(mockUpdatedUser as any)

            // Act
            const result = await updateUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.user).toEqual(mockUpdatedUser)
            expect(mockUserService.updateUser).toHaveBeenCalledWith("user-id", request.updates)
        })

        it("deve retornar erro quando usuário não tem permissão", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "other-user-id", // Usuário diferente
                updates: {
                    name: "Updated Name",
                },
            }

            // Act
            const result = await updateUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado para atualizar este usuário")
            expect(mockUserService.updateUser).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando usuário não existe", async () => {
            // Arrange
            const request = {
                userId: "non-existent-user",
                requestingUserId: "non-existent-user",
                updates: {
                    name: "Updated Name",
                },
            }

            vi.mocked(mockUserService.updateUser).mockResolvedValue(null)

            // Act
            const result = await updateUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Usuário não encontrado")
        })

        it("deve retornar erro quando nome é muito curto", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "user-id",
                updates: {
                    name: "A",
                },
            }

            // Act
            const result = await updateUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Nome deve ter pelo menos 2 caracteres")
            expect(mockUserService.updateUser).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando nome é muito longo", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "user-id",
                updates: {
                    name: "A".repeat(101),
                },
            }

            // Act
            const result = await updateUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Nome deve ter no máximo 100 caracteres")
            expect(mockUserService.updateUser).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando bio é muito longa", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "user-id",
                updates: {
                    bio: "A".repeat(501),
                },
            }

            // Act
            const result = await updateUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Bio deve ter no máximo 500 caracteres")
            expect(mockUserService.updateUser).not.toHaveBeenCalled()
        })

        it("deve atualizar apenas campos fornecidos", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "user-id",
                updates: {
                    bio: "Updated bio only",
                },
            }

            const mockUpdatedUser = {
                id: "user-id",
                username: "testuser",
                name: "Original Name",
                bio: "Updated bio only",
            }

            vi.mocked(mockUserService.updateUser).mockResolvedValue(mockUpdatedUser as any)

            // Act
            const result = await updateUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.user?.bio).toBe("Updated bio only")
            expect(mockUserService.updateUser).toHaveBeenCalledWith("user-id", {
                bio: "Updated bio only",
            })
        })

        it("deve atualizar preferências do usuário", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                requestingUserId: "user-id",
                updates: {
                    preferences: {
                        appLanguage: "pt-BR",
                        appTimezone: "America/Sao_Paulo",
                    },
                },
            }

            const mockUpdatedUser = {
                id: "user-id",
                username: "testuser",
                preferences: {
                    appLanguage: "pt-BR",
                    appTimezone: "America/Sao_Paulo",
                },
            }

            vi.mocked(mockUserService.updateUser).mockResolvedValue(mockUpdatedUser as any)

            // Act
            const result = await updateUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.user?.preferences).toBeDefined()
        })
    })
})
