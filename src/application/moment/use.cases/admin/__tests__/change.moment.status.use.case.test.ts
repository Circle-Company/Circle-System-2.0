// ===== CHANGE MOMENT STATUS USE CASE TEST =====

import { beforeEach, describe, expect, it, vi } from "vitest"

import { MomentService } from "@/application/moment/moment.service"
import { MomentNotFoundError } from "@/domain/moment/errors/moment.errors"
import { ChangeMomentStatusUseCase } from "../change.moment.status.use.case"

// Mock do MomentService
const mockMomentService = {
    changeMomentStatus: vi.fn(),
} as unknown as MomentService

describe("ChangeMomentStatusUseCase", () => {
    let useCase: ChangeMomentStatusUseCase

    beforeEach(() => {
        vi.clearAllMocks()
        useCase = new ChangeMomentStatusUseCase(mockMomentService)
    })

    describe("execute", () => {
        it("should change moment status successfully", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                status: "published" as const,
                reason: "Approved by moderator",
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

            vi.mocked(mockMomentService.changeMomentStatus).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.changeMomentStatus).toHaveBeenCalledWith({
                momentId: "123456789",
                status: "published",
                reason: "Approved by moderator",
                adminId: "moderator_123",
            })
        })

        it("should change moment status to blocked", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                status: "blocked" as const,
                reason: "Inappropriate content",
                adminId: "moderator_456",
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
                status: "blocked",
                metrics: {
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalReports: 5,
                },
            }

            vi.mocked(mockMomentService.changeMomentStatus).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.changeMomentStatus).toHaveBeenCalledWith({
                momentId: "123456789",
                status: "blocked",
                reason: "Inappropriate content",
                adminId: "moderator_456",
            })
        })

        it("should change moment status to under_review", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                status: "under_review" as const,
                reason: "Flagged for review",
                adminId: "system_auto",
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
                status: "under_review",
                metrics: {
                    totalViews: 50,
                    totalLikes: 5,
                    totalComments: 2,
                    totalReports: 3,
                },
            }

            vi.mocked(mockMomentService.changeMomentStatus).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.changeMomentStatus).toHaveBeenCalledWith({
                momentId: "123456789",
                status: "under_review",
                reason: "Flagged for review",
                adminId: "system_auto",
            })
        })

        it("should change moment status to archived", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                status: "archived" as const,
                reason: "User requested archiving",
                adminId: "user_123",
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
                status: "archived",
                metrics: {
                    totalViews: 1000,
                    totalLikes: 100,
                    totalComments: 50,
                    totalReports: 0,
                },
            }

            vi.mocked(mockMomentService.changeMomentStatus).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.changeMomentStatus).toHaveBeenCalledWith({
                momentId: "123456789",
                status: "archived",
                reason: "User requested archiving",
                adminId: "user_123",
            })
        })

        it("should change moment status to deleted", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                status: "deleted" as const,
                reason: "Violation of terms",
                adminId: "admin_789",
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
                status: "deleted",
                metrics: {
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalReports: 10,
                },
            }

            vi.mocked(mockMomentService.changeMomentStatus).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.changeMomentStatus).toHaveBeenCalledWith({
                momentId: "123456789",
                status: "deleted",
                reason: "Violation of terms",
                adminId: "admin_789",
            })
        })

        it("should throw MomentNotFoundError when moment is not found", async () => {
            // Arrange
            const request = {
                momentId: "nonexistent",
                status: "published" as const,
                reason: "Test",
                adminId: "moderator_123",
            }

            vi.mocked(mockMomentService.changeMomentStatus).mockResolvedValue({
                success: false,
                error: "Moment not found",
            })

            // Act & Assert
            await expect(useCase.execute(request)).rejects.toThrow(MomentNotFoundError)
            expect(mockMomentService.changeMomentStatus).toHaveBeenCalledWith({
                momentId: "nonexistent",
                status: "published",
                reason: "Test",
                adminId: "moderator_123",
            })
        })

        it("should handle service error", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                status: "published" as const,
                reason: "Test",
                adminId: "moderator_123",
            }

            vi.mocked(mockMomentService.changeMomentStatus).mockResolvedValue({
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
                status: "published" as const,
                reason: "Test",
                adminId: "moderator_123",
            }

            vi.mocked(mockMomentService.changeMomentStatus).mockRejectedValue(
                new Error("Unexpected error"),
            )

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.moment).toBeUndefined()
            expect(result.error).toBe("An unexpected error occurred")
        })

        it("should change status without reason", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                status: "published" as const,
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

            vi.mocked(mockMomentService.changeMomentStatus).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.changeMomentStatus).toHaveBeenCalledWith({
                momentId: "123456789",
                status: "published",
                reason: undefined,
                adminId: "moderator_123",
            })
        })

        it("should handle different admin roles", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                status: "blocked" as const,
                reason: "Content violation",
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
                status: "blocked",
                metrics: {
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalReports: 5,
                },
            }

            vi.mocked(mockMomentService.changeMomentStatus).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.changeMomentStatus).toHaveBeenCalledWith({
                momentId: "123456789",
                status: "blocked",
                reason: "Content violation",
                adminId: "super_admin_999",
            })
        })
    })
})
