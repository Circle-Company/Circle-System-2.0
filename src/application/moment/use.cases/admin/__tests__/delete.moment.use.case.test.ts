// ===== DELETE MOMENT USE CASE TEST =====

import { beforeEach, describe, expect, it, vi } from "vitest"

import { MomentNotFoundError } from "../../../../../domain/moment/moment.errors"
import { MomentService } from "../../../services/moment.service"
import { DeleteMomentUseCase } from "../delete.moment.use.case"

// Mock do MomentService
const mockMomentService = {
    deleteMoment: vi.fn(),
} as unknown as MomentService

describe("DeleteMomentUseCase", () => {
    let useCase: DeleteMomentUseCase

    beforeEach(() => {
        vi.clearAllMocks()
        useCase = new DeleteMomentUseCase(mockMomentService)
    })

    describe("execute", () => {
        it("should delete moment successfully", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Test reason",
                adminId: "admin_123",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("123456789", "Test reason")
        })

        it("should delete moment for severe violation", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Severe violation",
                adminId: "super_admin_999",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith(
                "123456789",
                "Severe violation",
            )
        })

        it("should delete moment for copyright violation", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Copyright violation",
                adminId: "copyright_admin_456",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith(
                "123456789",
                "Copyright violation",
            )
        })

        it("should delete moment for illegal content", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Illegal content",
                adminId: "legal_admin_789",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith(
                "123456789",
                "Illegal content",
            )
        })

        it("should delete moment for harassment", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Harassment",
                adminId: "safety_admin_111",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("123456789", "Harassment")
        })

        it("should delete moment for spam", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Spam",
                adminId: "spam_admin_222",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("123456789", "Spam")
        })

        it("should delete moment for fake news", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Fake news",
                adminId: "fact_check_admin_333",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("123456789", "Fake news")
        })

        it("should delete moment for hate speech", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Hate speech",
                adminId: "hate_speech_admin_444",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("123456789", "Hate speech")
        })

        it("should throw MomentNotFoundError when moment is not found", async () => {
            // Arrange
            const request = {
                momentId: "nonexistent",
                reason: "Test reason",
                adminId: "admin_123",
            }

            vi.mocked(mockMomentService.deleteMoment).mockRejectedValue(
                new Error("Momento com ID nonexistent não encontrado"),
            )

            // Act & Assert
            await expect(useCase.execute(request)).rejects.toThrow(MomentNotFoundError)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith(
                "nonexistent",
                "Test reason",
            )
        })

        it("should handle service error", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Test reason",
                adminId: "admin_123",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(false)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Failed to delete moment")
        })

        it("should handle service exception", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Test reason",
                adminId: "admin_123",
            }

            vi.mocked(mockMomentService.deleteMoment).mockRejectedValue(
                new Error("Unexpected error"),
            )

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("An unexpected error occurred")
        })

        it("should handle different admin roles", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Test reason",
                adminId: "community_manager_555",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("123456789", "Test reason")
        })

        it("should handle content moderator deletion", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Test reason",
                adminId: "content_moderator_666",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("123456789", "Test reason")
        })

        it("should handle system admin deletion", async () => {
            // Arrange
            const request = {
                momentId: "123456789",
                reason: "Test reason",
                adminId: "system_admin_777",
            }

            vi.mocked(mockMomentService.deleteMoment).mockResolvedValue(true)

            // Act
            const result = await useCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("123456789", "Test reason")
        })
    })
})
