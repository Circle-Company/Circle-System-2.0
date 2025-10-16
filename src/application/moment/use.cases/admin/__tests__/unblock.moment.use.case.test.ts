// ===== UNBLOCK MOMENT USE CASE TEST =====

import { beforeEach, describe, expect, it, vi } from "vitest"

import { MomentNotFoundError } from "../../../../../domain/moment/moment.errors"
import { MomentService } from "../../../services/moment.service"
import { UnblockMomentUseCase } from "../unblock.moment.use.case"

// Mock do MomentService
const mockMomentService = {
    unblockMoment: vi.fn(),
} as unknown as MomentService

describe("UnblockMomentUseCase", () => {
    let useCase: UnblockMomentUseCase

    beforeEach(() => {
        vi.clearAllMocks()
        useCase = new UnblockMomentUseCase(mockMomentService)
    })

    describe("execute", () => {
        it("should unblock moment successfully", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                adminId: "moderator_123",
            }

            const mockMoment = {
                id: "123456789",
                ownerId: "user_123",
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
            }

            vi.mocked(mockMomentService.unblockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.unblockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                adminId: "moderator_123",
                reason: undefined,
            })
        })

        it("should unblock moment after review", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                adminId: "senior_moderator_456",
            }

            const mockMoment = {
                id: "123456789",
                ownerId: "user_123",
                description: "Test moment",
                hashtags: ["test"],
                mentions: [],
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "published",
                metrics: {
                    totalViews: 200,
                    totalLikes: 20,
                    totalComments: 10,
                    totalReports: 0,
                },
            }

            vi.mocked(mockMomentService.unblockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.unblockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                adminId: "senior_moderator_456",
                reason: undefined,
            })
        })

        it("should unblock moment after appeal", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                adminId: "appeal_moderator_789",
            }

            const mockMoment = {
                id: "123456789",
                ownerId: "user_123",
                description: "Test moment",
                hashtags: ["test"],
                mentions: [],
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "published",
                metrics: {
                    totalViews: 150,
                    totalLikes: 15,
                    totalComments: 8,
                    totalReports: 0,
                },
            }

            vi.mocked(mockMomentService.unblockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.unblockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                adminId: "appeal_moderator_789",
                reason: undefined,
            })
        })

        it("should unblock moment after false positive", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                adminId: "quality_moderator_999",
            }

            const mockMoment = {
                id: "123456789",
                ownerId: "user_123",
                description: "Test moment",
                hashtags: ["test"],
                mentions: [],
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "published",
                metrics: {
                    totalViews: 300,
                    totalLikes: 30,
                    totalComments: 15,
                    totalReports: 0,
                },
            }

            vi.mocked(mockMomentService.unblockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.unblockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                adminId: "quality_moderator_999",
                reason: undefined,
            })
        })

        it("should unblock moment after content update", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                adminId: "content_moderator_111",
            }

            const mockMoment = {
                id: "123456789",
                ownerId: "user_123",
                description: "Updated test moment",
                hashtags: ["test", "updated"],
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
            }

            vi.mocked(mockMomentService.unblockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.unblockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                adminId: "content_moderator_111",
                reason: undefined,
            })
        })

        it("should throw MomentNotFoundError when moment is not found", async () => {
            // Arrange
            const request = {
                momentId: "nonexistent",
                adminId: "moderator_123",
            }

            vi.mocked(mockMomentService.unblockMoment).mockResolvedValue({
                success: false,
                error: "Moment not found",
            })

            // Act & Assert
            await expect(useCase.execute(request)).rejects.toThrow(MomentNotFoundError)
            expect(mockMomentService.unblockMoment).toHaveBeenCalledWith({
                momentId: "nonexistent",
                adminId: "moderator_123",
                reason: undefined,
            })
        })

        it("should handle service error", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                adminId: "moderator_123",
            }

            vi.mocked(mockMomentService.unblockMoment).mockResolvedValue({
                success: false,
                error: "Database connection failed",
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.moment).toBeUndefined()
            expect(result.error).toBe("Database connection failed")
        })

        it("should handle service exception", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                adminId: "moderator_123",
            }

            vi.mocked(mockMomentService.unblockMoment).mockRejectedValue(
                new Error("Unexpected error"),
            )

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.moment).toBeUndefined()
            expect(result.error).toBe("An unexpected error occurred")
        })

        it("should handle different admin roles", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                adminId: "super_admin_999",
            }

            const mockMoment = {
                id: "123456789",
                ownerId: "user_123",
                description: "Test moment",
                hashtags: ["test"],
                mentions: [],
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "published",
                metrics: {
                    totalViews: 500,
                    totalLikes: 50,
                    totalComments: 25,
                    totalReports: 0,
                },
            }

            vi.mocked(mockMomentService.unblockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.unblockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                adminId: "super_admin_999",
                reason: undefined,
            })
        })

        it("should handle community manager unblocking", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                adminId: "community_manager_555",
            }

            const mockMoment = {
                id: "123456789",
                ownerId: "user_123",
                description: "Test moment",
                hashtags: ["test"],
                mentions: [],
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "published",
                metrics: {
                    totalViews: 1000,
                    totalLikes: 100,
                    totalComments: 50,
                    totalReports: 0,
                },
            }

            vi.mocked(mockMomentService.unblockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.unblockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                adminId: "community_manager_555",
                reason: undefined,
            })
        })
    })
})
