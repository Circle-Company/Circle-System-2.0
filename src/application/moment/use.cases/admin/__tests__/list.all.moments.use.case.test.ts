// ===== LIST ALL MOMENTS USE CASE TEST =====

import { beforeEach, describe, expect, it, vi } from "vitest"

import { MomentService } from "../../../services/moment.service"
import { ListAllMomentsUseCase } from "../list.all.moments.use.case"

// Mock do MomentService
const mockMomentService = {
    listAllMoments: vi.fn(),
} as unknown as MomentService

describe("ListAllMomentsUseCase", () => {
    let useCase: ListAllMomentsUseCase

    beforeEach(() => {
        vi.clearAllMocks()
        useCase = new ListAllMomentsUseCase(mockMomentService)
    })

    describe("execute", () => {
        it("should list all moments successfully with default parameters", async () => {
            // Arrange
            const mockMoments = [
                {
                    id: "1",
                    ownerId: "user1",
                    description: "Test moment 1",
                    hashtags: ["test"],
                    mentions: [],
                    publishedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: "published",
                    metrics: {
                        totalViews: 100,
                        totalLikes: 10,
                        totalComments: 5,
                        totalReports: 0,
                    },
                },
                {
                    id: "2",
                    ownerId: "user2",
                    description: "Test moment 2",
                    hashtags: ["test", "admin"],
                    mentions: ["@user1"],
                    publishedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: "published",
                    metrics: {
                        totalViews: 200,
                        totalLikes: 20,
                        totalComments: 10,
                        totalReports: 1,
                    },
                },
            ]

            const mockPagination = {
                page: 1,
                limit: 20,
                total: 2,
                totalPages: 1,
            }

            vi.mocked(mockMomentService.listAllMoments).mockResolvedValue({
                success: true,
                moments: mockMoments,
                pagination: mockPagination,
            })

            // Act
            const result = await useCase.execute({})

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toHaveLength(2)
            expect(result.moments[0].id).toBe("1")
            expect(result.moments[1].id).toBe("2")
            expect(result.pagination).toEqual(mockPagination)
            expect(mockMomentService.listAllMoments).toHaveBeenCalledWith({
                page: 1,
                limit: 20,
                status: undefined,
                sortBy: "created_at",
                sortOrder: "desc",
                search: undefined,
                ownerId: undefined,
            })
        })

        it("should list all moments with custom parameters", async () => {
            // Arrange
            const request = {
                page: 2,
                limit: 10,
                status: "published" as const,
                sortBy: "published_at" as const,
                sortOrder: "asc" as const,
                search: "test",
                ownerId: "user1",
            }

            const mockMoments = [
                {
                    id: "1",
                    ownerId: "user1",
                    description: "Test moment",
                    hashtags: ["test"],
                    mentions: [],
                    publishedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: "published",
                    metrics: {
                        totalViews: 100,
                        totalLikes: 10,
                        totalComments: 5,
                        totalReports: 0,
                    },
                },
            ]

            const mockPagination = {
                page: 2,
                limit: 10,
                total: 1,
                totalPages: 1,
            }

            vi.mocked(mockMomentService.listAllMoments).mockResolvedValue({
                success: true,
                moments: mockMoments,
                pagination: mockPagination,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toHaveLength(1)
            expect(result.pagination).toEqual(mockPagination)
            expect(mockMomentService.listAllMoments).toHaveBeenCalledWith(request)
        })

        it("should handle service error", async () => {
            // Arrange
            vi.mocked(mockMomentService.listAllMoments).mockResolvedValue({
                success: false,
                error: "Database connection failed",
            })

            // Act
            const result = await useCase.execute({})

            // Assert
            expect(result.success).toBe(false)
            expect(result.moments).toEqual([])
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
            })
            expect(result.error).toBe("Database connection failed")
        })

        it("should handle service exception", async () => {
            // Arrange
            vi.mocked(mockMomentService.listAllMoments).mockRejectedValue(
                new Error("Unexpected error"),
            )

            // Act
            const result = await useCase.execute({})

            // Assert
            expect(result.success).toBe(false)
            expect(result.moments).toEqual([])
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
            })
            expect(result.error).toBe("An unexpected error occurred")
        })

        it("should filter by status", async () => {
            // Arrange
            const request = {
                status: "blocked" as const,
            }

            const mockMoments = [
                {
                    id: "1",
                    ownerId: "user1",
                    description: "Blocked moment",
                    hashtags: [],
                    mentions: [],
                    publishedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: "blocked",
                    metrics: {
                        totalViews: 0,
                        totalLikes: 0,
                        totalComments: 0,
                        totalReports: 5,
                    },
                },
            ]

            vi.mocked(mockMomentService.listAllMoments).mockResolvedValue({
                success: true,
                moments: mockMoments,
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1,
                },
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toHaveLength(1)
            expect(result.moments[0].status).toBe("blocked")
            expect(mockMomentService.listAllMoments).toHaveBeenCalledWith({
                page: 1,
                limit: 20,
                status: "blocked",
                sortBy: "created_at",
                sortOrder: "desc",
                search: undefined,
                ownerId: undefined,
            })
        })

        it("should search by owner ID", async () => {
            // Arrange
            const request = {
                ownerId: "user123",
            }

            const mockMoments = [
                {
                    id: "1",
                    ownerId: "user123",
                    description: "User moment",
                    hashtags: [],
                    mentions: [],
                    publishedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: "published",
                    metrics: {
                        totalViews: 50,
                        totalLikes: 5,
                        totalComments: 2,
                        totalReports: 0,
                    },
                },
            ]

            vi.mocked(mockMomentService.listAllMoments).mockResolvedValue({
                success: true,
                moments: mockMoments,
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1,
                },
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toHaveLength(1)
            expect(result.moments[0].ownerId).toBe("user123")
            expect(mockMomentService.listAllMoments).toHaveBeenCalledWith({
                page: 1,
                limit: 20,
                status: undefined,
                sortBy: "created_at",
                sortOrder: "desc",
                search: undefined,
                ownerId: "user123",
            })
        })

        it("should handle empty results", async () => {
            // Arrange
            vi.mocked(mockMomentService.listAllMoments).mockResolvedValue({
                success: true,
                moments: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                },
            })

            // Act
            const result = await useCase.execute({})

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toEqual([])
            expect(result.pagination.total).toBe(0)
        })

        it("should handle large pagination", async () => {
            // Arrange
            const request = {
                page: 5,
                limit: 100,
            }

            const mockMoments = Array.from({ length: 100 }, (_, i) => ({
                id: `moment_${i + 1}`,
                ownerId: `user_${i + 1}`,
                description: `Moment ${i + 1}`,
                hashtags: [],
                mentions: [],
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "published" as const,
                metrics: {
                    totalViews: i * 10,
                    totalLikes: i * 2,
                    totalComments: i,
                    totalReports: 0,
                },
            }))

            vi.mocked(mockMomentService.listAllMoments).mockResolvedValue({
                success: true,
                moments: mockMoments,
                pagination: {
                    page: 5,
                    limit: 100,
                    total: 1000,
                    totalPages: 10,
                },
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toHaveLength(100)
            expect(result.pagination.page).toBe(5)
            expect(result.pagination.limit).toBe(100)
            expect(result.pagination.total).toBe(1000)
            expect(result.pagination.totalPages).toBe(10)
        })
    })
})
