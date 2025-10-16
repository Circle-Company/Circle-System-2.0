import { beforeEach, describe, expect, it, vi } from "vitest"

import { IUserRepository } from "../../../../domain/user/repositories/user.repository"
import { FollowUserUseCase } from "../follow.user.use.case"

describe("FollowUserUseCase", () => {
    let followUserUseCase: FollowUserUseCase
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

        followUserUseCase = new FollowUserUseCase(mockUserRepository)
    })

    describe("execute", () => {
        it("deve seguir um usuário com sucesso", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                targetUserId: "target-user-id",
            }

            const mockUser = {
                id: "user-id",
                username: "user",
                status: { blocked: false, deleted: false },
            }

            const mockTargetUser = {
                id: "target-user-id",
                username: "targetuser",
                status: { blocked: false, deleted: false },
            }

            vi.mocked(mockUserRepository.findById)
                .mockResolvedValueOnce(mockUser as any)
                .mockResolvedValueOnce(mockTargetUser as any)
            vi.mocked(mockUserRepository.isFollowing).mockResolvedValue(false)
            vi.mocked(mockUserRepository.isBlocked).mockResolvedValue(false)
            vi.mocked(mockUserRepository.followUser).mockResolvedValue(true)

            // Act
            const result = await followUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.followed).toBe(true)
            expect(mockUserRepository.findById).toHaveBeenCalledWith("user-id")
            expect(mockUserRepository.findById).toHaveBeenCalledWith("target-user-id")
            expect(mockUserRepository.isFollowing).toHaveBeenCalledWith("user-id", "target-user-id")
            expect(mockUserRepository.followUser).toHaveBeenCalledWith("user-id", "target-user-id")
        })

        it("deve retornar erro ao tentar seguir a si mesmo", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                targetUserId: "user-id",
            }

            // Act
            const result = await followUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Você não pode seguir a si mesmo")
            expect(mockUserRepository.followUser).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando usuário não existe", async () => {
            // Arrange
            const request = {
                userId: "non-existent-user",
                targetUserId: "target-user-id",
            }

            vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

            // Act
            const result = await followUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Usuário não encontrado")
            expect(mockUserRepository.followUser).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando usuário alvo não existe", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                targetUserId: "non-existent-target",
            }

            const mockUser = {
                id: "user-id",
                username: "user",
                status: { blocked: false, deleted: false },
            }

            vi.mocked(mockUserRepository.findById)
                .mockResolvedValueOnce(mockUser as any)
                .mockResolvedValueOnce(null)

            // Act
            const result = await followUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Usuário alvo não encontrado")
            expect(mockUserRepository.followUser).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando já está seguindo o usuário", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                targetUserId: "target-user-id",
            }

            const mockUser = {
                id: "user-id",
                username: "user",
                status: { blocked: false, deleted: false },
            }

            const mockTargetUser = {
                id: "target-user-id",
                username: "targetuser",
                status: { blocked: false, deleted: false },
            }

            vi.mocked(mockUserRepository.findById)
                .mockResolvedValueOnce(mockUser as any)
                .mockResolvedValueOnce(mockTargetUser as any)
            vi.mocked(mockUserRepository.isFollowing).mockResolvedValue(true)

            // Act
            const result = await followUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Você já está seguindo este usuário")
            expect(mockUserRepository.followUser).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando usuário está bloqueado", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                targetUserId: "target-user-id",
            }

            const mockUser = {
                id: "user-id",
                username: "user",
                status: { blocked: false, deleted: false },
            }

            const mockTargetUser = {
                id: "target-user-id",
                username: "targetuser",
                status: { blocked: false, deleted: false },
            }

            vi.mocked(mockUserRepository.findById)
                .mockResolvedValueOnce(mockUser as any)
                .mockResolvedValueOnce(mockTargetUser as any)
            vi.mocked(mockUserRepository.isFollowing).mockResolvedValue(false)
            vi.mocked(mockUserRepository.isBlocked).mockResolvedValue(true)

            // Act
            const result = await followUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Não é possível seguir este usuário")
            expect(mockUserRepository.followUser).not.toHaveBeenCalled()
        })

        it("deve retornar erro quando usuário está inativo", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                targetUserId: "target-user-id",
            }

            const mockUser = {
                id: "user-id",
                username: "user",
                status: { blocked: true, deleted: false },
            }

            vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser as any)

            // Act
            const result = await followUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Usuário inativo não pode seguir outros usuários")
            expect(mockUserRepository.followUser).not.toHaveBeenCalled()
        })
    })
})
