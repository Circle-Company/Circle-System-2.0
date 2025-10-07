import { beforeEach, describe, expect, it, vi } from "vitest"

import { UserRole } from "../../../../../domain/user"
import { IUserRepository } from "../../../../../domain/user/repositories/user.repository"
import { UserService } from "../../../services/user.service"
import { AdminBlockUserUseCase } from "../block.user.use.case"

describe("AdminBlockUserUseCase", () => {
    let adminBlockUserUseCase: AdminBlockUserUseCase
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
            isBlocked: vi.fn(),
            isFollowing: vi.fn(),
            followUser: vi.fn(),
            unfollowUser: vi.fn(),
            blockUser: vi.fn(),
            unblockUser: vi.fn(),
        } as any

        mockUserService = {
            getUserById: vi.fn(),
            updateStatus: vi.fn(),
        } as any

        adminBlockUserUseCase = new AdminBlockUserUseCase(mockUserRepository, mockUserService)
    })

    describe("execute", () => {
        it("deve bloquear usuário com sucesso", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                adminId: "admin-id",
                reason: "Violação dos termos de uso",
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            const mockUser = {
                id: "user-id",
                username: "testuser",
                status: "active",
            }

            const mockBlockedUser = {
                id: "user-id",
                username: "testuser",
                status: "blocked",
            }

            vi.mocked(mockUserService.getUserById)
                .mockResolvedValueOnce(mockAdmin as any)
                .mockResolvedValueOnce(mockUser as any)
            vi.mocked(mockUserService.updateStatus).mockResolvedValue(mockBlockedUser as any)

            // Act
            const result = await adminBlockUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.user?.id).toBe("user-id")
            expect(result.user?.status).toBe("blocked")
            expect(result.user?.reason).toBe("Violação dos termos de uso")
            expect(mockUserService.updateStatus).toHaveBeenCalledWith("user-id", "blocked")
        })

        it("deve retornar erro quando usuário não é admin", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                adminId: "regular-user-id",
                reason: "Violação dos termos de uso",
            }

            const mockRegularUser = {
                id: "regular-user-id",
                role: UserRole.USER,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockRegularUser as any)

            // Act
            const result = await adminBlockUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe(
                "Acesso negado. Apenas administradores podem bloquear usuários",
            )
        })

        it("deve retornar erro quando usuário não existe", async () => {
            // Arrange
            const request = {
                userId: "non-existent-user",
                adminId: "admin-id",
                reason: "Violação dos termos de uso",
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            vi.mocked(mockUserService.getUserById)
                .mockResolvedValueOnce(mockAdmin as any)
                .mockResolvedValueOnce(null)

            // Act
            const result = await adminBlockUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Usuário não encontrado")
        })

        it("deve retornar erro quando usuário já está bloqueado", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                adminId: "admin-id",
                reason: "Violação dos termos de uso",
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            const mockUser = {
                id: "user-id",
                username: "testuser",
                status: "blocked",
            }

            vi.mocked(mockUserService.getUserById)
                .mockResolvedValueOnce(mockAdmin as any)
                .mockResolvedValueOnce(mockUser as any)

            // Act
            const result = await adminBlockUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Usuário já está bloqueado")
        })

        it("deve retornar erro quando razão é muito curta", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                adminId: "admin-id",
                reason: "abc",
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)

            // Act
            const result = await adminBlockUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Razão do bloqueio deve ter pelo menos 5 caracteres")
        })

        it("deve retornar erro quando razão é muito longa", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                adminId: "admin-id",
                reason: "A".repeat(501),
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)

            // Act
            const result = await adminBlockUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Razão do bloqueio deve ter no máximo 500 caracteres")
        })

        it("deve retornar erro quando admin tenta bloquear a si mesmo", async () => {
            // Arrange
            const request = {
                userId: "admin-id",
                adminId: "admin-id",
                reason: "Teste de bloqueio",
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)

            // Act
            const result = await adminBlockUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Não é possível bloquear a si mesmo")
        })

        it("deve aceitar bloqueio com duração especificada", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                adminId: "admin-id",
                reason: "Violação dos termos de uso",
                duration: 30, // 30 dias
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.SUPER_ADMIN,
            }

            const mockUser = {
                id: "user-id",
                username: "testuser",
                status: "active",
            }

            const mockBlockedUser = {
                id: "user-id",
                username: "testuser",
                status: "blocked",
            }

            vi.mocked(mockUserService.getUserById)
                .mockResolvedValueOnce(mockAdmin as any)
                .mockResolvedValueOnce(mockUser as any)
            vi.mocked(mockUserService.updateStatus).mockResolvedValue(mockBlockedUser as any)

            // Act
            const result = await adminBlockUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.user?.unblockAt).toBeDefined()
        })

        it("deve retornar erro quando duração é inválida", async () => {
            // Arrange
            const request = {
                userId: "user-id",
                adminId: "admin-id",
                reason: "Violação dos termos de uso",
                duration: 500, // Mais que 365 dias
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)

            // Act
            const result = await adminBlockUserUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Duração do bloqueio deve estar entre 1 e 365 dias")
        })
    })
})
