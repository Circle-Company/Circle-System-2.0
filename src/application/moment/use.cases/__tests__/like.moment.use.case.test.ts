import { beforeEach, describe, expect, it, vi } from "vitest"
import { LikeMomentRequest, LikeMomentUseCase } from "../like.moment.use.case"

import { MomentStatusEnum } from "../../../../domain/moment"

describe("LikeMomentUseCase", () => {
    let likeMomentUseCase: LikeMomentUseCase
    let mockMomentRepository: any
    let mockMomentService: any
    let mockUserRepository: any

    const mockMoment = {
        id: "moment_123",
        ownerId: "user_123",
        status: {
            current: MomentStatusEnum.PUBLISHED,
        },
    }

    beforeEach(() => {
        mockMomentRepository = {
            isOwner: vi.fn(),
            isInteractable: vi.fn(),
        } as any

        mockMomentService = {
            getMomentById: vi.fn(),
            likeMoment: vi.fn(),
            hasUserLikedMoment: vi.fn(),
        } as any

        mockUserRepository = {} as any

        likeMomentUseCase = new LikeMomentUseCase(
            mockMomentRepository,
            mockMomentService,
            mockUserRepository,
        )
    })

    describe("execute", () => {
        it("should like moment successfully", async () => {
            // Arrange
            const request: LikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentRepository.isOwner.mockResolvedValue(false)
            mockMomentRepository.isInteractable.mockResolvedValue(true)
            mockMomentService.hasUserLikedMoment.mockResolvedValue(false)
            mockMomentService.likeMoment.mockResolvedValue(mockMoment)

            // Act
            const result = await likeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.liked).toBe(true)
            expect(mockMomentService.likeMoment).toHaveBeenCalledWith("moment_123", "user_456")
        })

        it("should fail when moment is not found", async () => {
            // Arrange
            const request: LikeMomentRequest = {
                momentId: "moment_inexistent",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(null)
            mockMomentRepository.isOwner.mockResolvedValue(false)
            mockMomentRepository.isInteractable.mockResolvedValue(true)

            // Act
            const result = await likeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment not found")
        })

        it("should fail when user already liked the moment", async () => {
            // Arrange
            const request: LikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentRepository.isOwner.mockResolvedValue(false)
            mockMomentRepository.isInteractable.mockResolvedValue(true)
            mockMomentService.hasUserLikedMoment.mockResolvedValue(true)

            // Act
            const result = await likeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("User has already liked this moment")
        })

        it("should fail when moment ID is not provided", async () => {
            // Arrange
            const request: LikeMomentRequest = {
                momentId: "",
                userId: "user_456",
            }

            // Act
            const result = await likeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment ID is required")
        })

        it("should fail when user ID is not provided", async () => {
            // Arrange
            const request: LikeMomentRequest = {
                momentId: "moment_123",
                userId: "",
            }

            // Act
            const result = await likeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("User ID is required")
        })

        it("should fail when user tries to like their own moment", async () => {
            // Arrange
            const request: LikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_123", // Same as owner
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentRepository.isOwner.mockResolvedValue(true)
            mockMomentRepository.isInteractable.mockResolvedValue(true)

            // Act
            const result = await likeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("User cannot like their own moment")
        })

        it("should fail when moment is not interactable", async () => {
            // Arrange
            const request: LikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentRepository.isOwner.mockResolvedValue(false)
            mockMomentRepository.isInteractable.mockResolvedValue(false)

            // Act
            const result = await likeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment cannot be liked in current state")
        })

        it("should handle internal errors gracefully", async () => {
            // Arrange
            const request: LikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockRejectedValue(new Error("Database error"))

            // Act
            const result = await likeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Database error")
        })
    })
})
