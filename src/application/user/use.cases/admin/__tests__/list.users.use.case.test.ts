import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserRole, UserStatusEnum } from "../../../../../domain/user"

import { IUserRepository } from "../../../../../domain/user/repositories/user.repository"
import { UserService } from "../../../services/user.service"
import { AdminListUsersUseCase } from "../list.users.use.case"

describe("AdminListUsersUseCase", () => {
    let adminListUsersUseCase: AdminListUsersUseCase
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
            searchUsers: vi.fn(),
        } as any

        adminListUsersUseCase = new AdminListUsersUseCase(mockUserRepository, mockUserService)
    })

    describe("execute", () => {
        it("deve listar usuários com sucesso", async () => {
            // Arrange
            const request = {
                adminId: "admin-id",
                page: 1,
                limit: 20,
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            const mockUsers = [
                {
                    id: "user-1",
                    name: "User One",
                    email: "user1@example.com",
                    role: UserRole.USER,
                    status: UserStatusEnum.ACTIVE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: "user-2",
                    name: "User Two",
                    email: "user2@example.com",
                    role: UserRole.USER,
                    status: UserStatusEnum.ACTIVE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]

            const mockSearchResult = {
                users: mockUsers,
                total: 2,
                page: 1,
                limit: 20,
                hasNext: false,
                hasPrev: false,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)
            vi.mocked(mockUserService.searchUsers).mockResolvedValue(mockSearchResult as any)

            // Act
            const result = await adminListUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.users).toHaveLength(2)
            expect(result.pagination?.total).toBe(2)
            expect(result.pagination?.page).toBe(1)
        })

        it("deve retornar erro quando usuário não é admin", async () => {
            // Arrange
            const request = {
                adminId: "regular-user-id",
                page: 1,
                limit: 20,
            }

            const mockRegularUser = {
                id: "regular-user-id",
                role: UserRole.USER,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockRegularUser as any)

            // Act
            const result = await adminListUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado. Apenas administradores podem listar usuários")
        })

        it("deve aplicar filtros de status", async () => {
            // Arrange
            const request = {
                adminId: "admin-id",
                status: [UserStatusEnum.ACTIVE],
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            const mockSearchResult = {
                users: [],
                total: 0,
                page: 1,
                limit: 20,
                hasNext: false,
                hasPrev: false,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)
            vi.mocked(mockUserService.searchUsers).mockResolvedValue(mockSearchResult as any)

            // Act
            const result = await adminListUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockUserService.searchUsers).toHaveBeenCalledWith(
                "",
                expect.objectContaining({
                    status: [UserStatusEnum.ACTIVE],
                }),
                expect.anything(),
                expect.anything(),
            )
        })

        it("deve aplicar filtros de role", async () => {
            // Arrange
            const request = {
                adminId: "admin-id",
                role: [UserRole.USER],
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            const mockSearchResult = {
                users: [],
                total: 0,
                page: 1,
                limit: 20,
                hasNext: false,
                hasPrev: false,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)
            vi.mocked(mockUserService.searchUsers).mockResolvedValue(mockSearchResult as any)

            // Act
            const result = await adminListUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockUserService.searchUsers).toHaveBeenCalledWith(
                "",
                expect.objectContaining({
                    role: [UserRole.USER],
                }),
                expect.anything(),
                expect.anything(),
            )
        })

        it("deve retornar erro quando página é inválida", async () => {
            // Arrange
            const request = {
                adminId: "admin-id",
                page: 0,
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            const mockSearchResult = {
                users: [],
                total: 0,
                page: 1,
                limit: 20,
                hasNext: false,
                hasPrev: false,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)
            vi.mocked(mockUserService.searchUsers).mockResolvedValue(mockSearchResult as any)

            // Act
            const result = await adminListUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Página deve ser maior que 0")
        })

        it("deve retornar erro quando limite é inválido", async () => {
            // Arrange
            const request = {
                adminId: "admin-id",
                limit: 200,
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)

            // Act
            const result = await adminListUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
        })

        it("deve aplicar ordenação personalizada", async () => {
            // Arrange
            const request = {
                adminId: "admin-id",
                sortBy: "followersCount" as const,
                sortOrder: "desc" as const,
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.SUPER_ADMIN,
            }

            const mockSearchResult = {
                users: [],
                total: 0,
                page: 1,
                limit: 20,
                hasNext: false,
                hasPrev: false,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)
            vi.mocked(mockUserService.searchUsers).mockResolvedValue(mockSearchResult as any)

            // Act
            const result = await adminListUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockUserService.searchUsers).toHaveBeenCalledWith(
                "",
                expect.anything(),
                expect.objectContaining({
                    field: "followersCount",
                    direction: "desc",
                }),
                expect.anything(),
            )
        })

        it("deve aplicar busca por termo", async () => {
            // Arrange
            const request = {
                adminId: "admin-id",
                search: "john",
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            const mockSearchResult = {
                users: [],
                total: 0,
                page: 1,
                limit: 20,
                hasNext: false,
                hasPrev: false,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)
            vi.mocked(mockUserService.searchUsers).mockResolvedValue(mockSearchResult as any)

            // Act
            const result = await adminListUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockUserService.searchUsers).toHaveBeenCalledWith(
                "john",
                expect.anything(),
                expect.anything(),
                expect.anything(),
            )
        })

        it("deve respeitar limite máximo de 100", async () => {
            // Arrange
            const request = {
                adminId: "admin-id",
                limit: 50,
            }

            const mockAdmin = {
                id: "admin-id",
                role: UserRole.ADMIN,
            }

            const mockSearchResult = {
                users: [],
                total: 0,
                page: 1,
                limit: 50,
                hasNext: false,
                hasPrev: false,
            }

            vi.mocked(mockUserService.getUserById).mockResolvedValue(mockAdmin as any)
            vi.mocked(mockUserService.searchUsers).mockResolvedValue(mockSearchResult as any)

            // Act
            const result = await adminListUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockUserService.searchUsers).toHaveBeenCalledWith(
                "",
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    limit: 50,
                }),
            )
        })
    })
})
