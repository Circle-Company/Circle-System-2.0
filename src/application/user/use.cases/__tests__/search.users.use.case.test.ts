import { beforeEach, describe, expect, it, vi } from "vitest"

import { IUserRepository } from "../../../../domain/user/repositories/user.repository"
import { UserService } from "../../services/user.service"
import { SearchUsersUseCase } from "../search.users.use.case"

describe("SearchUsersUseCase", () => {
    let searchUsersUseCase: SearchUsersUseCase
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
            searchUsers: vi.fn(),
        } as any

        searchUsersUseCase = new SearchUsersUseCase(mockUserRepository, mockUserService)
    })

    describe("execute", () => {
        it("deve retornar erro quando query está vazia", async () => {
            // Arrange
            const request = {
                query: "",
                requestingUserId: "user-id",
            }

            // Act
            const result = await searchUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Query de busca é obrigatória")
        })

        it("deve retornar erro quando query é muito longa", async () => {
            // Arrange
            const request = {
                query: "A".repeat(101),
                requestingUserId: "user-id",
            }

            // Act
            const result = await searchUsersUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Query de busca deve ter no máximo 100 caracteres")
        })
    })
})
