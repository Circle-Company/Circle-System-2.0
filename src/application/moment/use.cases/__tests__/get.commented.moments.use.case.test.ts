import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    GetCommentedMomentsRequest,
    GetCommentedMomentsUseCase,
} from "../get.commented.moments.use.case"

describe("GetCommentedMomentsUseCase", () => {
    let getCommentedMomentsUseCase: GetCommentedMomentsUseCase
    let mockCommentRepository: any
    let mockMomentRepository: any

    const mockComments = [
        { id: "comment_1", momentId: "moment_1", authorId: "user_123" },
        { id: "comment_2", momentId: "moment_2", authorId: "user_123" },
    ]

    const mockMoments = [
        { id: "moment_1", ownerId: "user_456", createdAt: new Date() },
        { id: "moment_2", ownerId: "user_789", createdAt: new Date() },
    ]

    beforeEach(() => {
        mockCommentRepository = {
            findByAuthorId: vi.fn(),
            countByAuthorId: vi.fn(),
        } as any

        mockMomentRepository = {
            findById: vi.fn(),
        } as any

        getCommentedMomentsUseCase = new GetCommentedMomentsUseCase(
            mockCommentRepository,
            mockMomentRepository,
        )
    })

    describe("execute", () => {
        it("should fetch commented moments successfully", async () => {
            // Arrange
            const request: GetCommentedMomentsRequest = {
                userId: "user_123",
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByAuthorId.mockResolvedValue(mockComments)
            mockCommentRepository.countByAuthorId.mockResolvedValue(2)
            mockMomentRepository.findById
                .mockResolvedValueOnce(mockMoments[0])
                .mockResolvedValueOnce(mockMoments[1])

            // Act
            const result = await getCommentedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toHaveLength(2)
            expect(result.pagination).toBeDefined()
        })

        it("should fetch commented moments with default values", async () => {
            // Arrange
            const request: GetCommentedMomentsRequest = {
                userId: "user_123",
            }

            mockCommentRepository.findByAuthorId.mockResolvedValue(mockComments)
            mockCommentRepository.countByAuthorId.mockResolvedValue(2)
            mockMomentRepository.findById
                .mockResolvedValueOnce(mockMoments[0])
                .mockResolvedValueOnce(mockMoments[1])

            // Act
            const result = await getCommentedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockCommentRepository.findByAuthorId).toHaveBeenCalledWith("user_123", 20, 0)
        })

        it("should return empty list when user has not commented on any moments", async () => {
            // Arrange
            const request: GetCommentedMomentsRequest = {
                userId: "user_123",
            }

            mockCommentRepository.findByAuthorId.mockResolvedValue([])
            mockCommentRepository.countByAuthorId.mockResolvedValue(0)

            // Act
            const result = await getCommentedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toHaveLength(0)
        })

        it("should handle internal errors gracefully", async () => {
            // Arrange
            const request: GetCommentedMomentsRequest = {
                userId: "user_123",
            }

            mockCommentRepository.findByAuthorId.mockRejectedValue(new Error("Database error"))

            // Act
            const result = await getCommentedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Database error")
        })
    })
})
