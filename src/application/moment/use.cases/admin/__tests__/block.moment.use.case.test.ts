// ===== BLOCK MOMENT USE CASE TEST =====

import { beforeEach, describe, expect, it, vi } from "vitest"

import { MomentNotFoundError } from "../../../../../domain/moment/moment.errors"
import { MomentService } from "../../../services/moment.service"
import { BlockMomentUseCase } from "../block.moment.use.case"

// Mock do MomentService
const mockMomentService = {
    blockMoment: vi.fn(),
} as unknown as MomentService

describe("BlockMomentUseCase", () => {
    let useCase: BlockMomentUseCase

    beforeEach(() => {
        vi.clearAllMocks()
        useCase = new BlockMomentUseCase(mockMomentService)
    })

    describe("execute", () => {
        it("should block moment successfully with reason", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Inappropriate content",
                adminId: "moderator_123",
            }

            const mockMoment = {
                id: "123456789",
                status: "blocked",
                reason: "Inappropriate content",
                blockedBy: "moderator_123",
                blockedAt: new Date(),
            }

            vi.mocked(mockMomentService.blockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.blockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                reason: "Inappropriate content",
                adminId: "moderator_123",
            })
        })

        it("should block moment successfully without reason", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Test reason",
                adminId: "moderator_456",
            }

            const mockMoment = {
                id: "123456789",
                status: "blocked",
                reason: "Test reason",
                blockedBy: "moderator_456",
                blockedAt: new Date(),
            }

            vi.mocked(mockMomentService.blockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.blockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                reason: "Test reason",
                adminId: "moderator_456",
            })
        })

        it("should block moment for copyright violation", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Copyright violation - unauthorized use of music",
                adminId: "copyright_moderator",
            }

            const mockMoment = {
                id: "123456789",
                status: "blocked",
                reason: "Copyright violation - unauthorized use of music",
                blockedBy: "copyright_moderator",
                blockedAt: new Date(),
            }

            vi.mocked(mockMomentService.blockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.blockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                reason: "Copyright violation - unauthorized use of music",
                adminId: "copyright_moderator",
            })
        })

        it("should block moment for harassment", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Harassment and bullying",
                adminId: "safety_moderator",
            }

            const mockMoment = {
                id: "123456789",
                status: "blocked",
                reason: "Harassment and bullying",
                blockedBy: "safety_moderator",
                blockedAt: new Date(),
            }

            vi.mocked(mockMomentService.blockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.blockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                reason: "Harassment and bullying",
                adminId: "safety_moderator",
            })
        })

        it("should block moment for spam", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Spam and repetitive content",
                adminId: "spam_moderator",
            }

            const mockMoment = {
                id: "123456789",
                status: "blocked",
                reason: "Spam and repetitive content",
                blockedBy: "spam_moderator",
                blockedAt: new Date(),
            }

            vi.mocked(mockMomentService.blockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.blockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                reason: "Spam and repetitive content",
                adminId: "spam_moderator",
            })
        })

        it("should throw MomentNotFoundError when moment is not found", async () => {
            // Arrange
            const request = {
                momentId: "nonexistent",
                reason: "Test reason",
                adminId: "moderator_123",
            }

            vi.mocked(mockMomentService.blockMoment).mockResolvedValue({
                success: false,
                error: "Moment not found",
            })

            // Act & Assert
            await expect(useCase.execute(request)).rejects.toThrow(MomentNotFoundError)
            expect(mockMomentService.blockMoment).toHaveBeenCalledWith({
                momentId: "nonexistent",
                reason: "Test reason",
                adminId: "moderator_123",
            })
        })

        it("should handle service error", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Test reason",
                adminId: "moderator_123",
            }

            vi.mocked(mockMomentService.blockMoment).mockResolvedValue({
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
                reason: "Test reason",
                adminId: "moderator_123",
            }

            vi.mocked(mockMomentService.blockMoment).mockRejectedValue(
                new Error("Unexpected error"),
            )

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.moment).toBeUndefined()
            expect(result.error).toBe("An unexpected error occurred")
        })

        it("should handle different moderator types", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Violation of community guidelines",
                adminId: "community_moderator_789",
            }

            const mockMoment = {
                id: "123456789",
                status: "blocked",
                reason: "Violation of community guidelines",
                blockedBy: "community_moderator_789",
                blockedAt: new Date(),
            }

            vi.mocked(mockMomentService.blockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.blockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                reason: "Violation of community guidelines",
                adminId: "community_moderator_789",
            })
        })

        it("should handle super admin blocking", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Severe violation requiring immediate action",
                adminId: "super_admin_999",
            }

            const mockMoment = {
                id: "123456789",
                status: "blocked",
                reason: "Severe violation requiring immediate action",
                blockedBy: "super_admin_999",
                blockedAt: new Date(),
            }

            vi.mocked(mockMomentService.blockMoment).mockResolvedValue({
                success: true,
                moment: mockMoment,
            })

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.blockMoment).toHaveBeenCalledWith({
                momentId: "123456789",
                reason: "Severe violation requiring immediate action",
                adminId: "super_admin_999",
            })
        })
    })
})
