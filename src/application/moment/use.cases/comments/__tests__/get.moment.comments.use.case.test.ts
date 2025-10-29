import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    GetMomentCommentsRequest,
    GetMomentCommentsUseCase
} from "../get.moment.comments.use.case"

describe("GetMomentCommentsUseCase", () => {
    let getMomentCommentsUseCase: GetMomentCommentsUseCase
    let mockCommentRepository: any
    let mockUserRepository: any

    const mockAuthUser = {
        id: "auth_user_123",
        timezone: -3,
        device: "web",
        level: "user",
    }

    const mockComment1 = {
        id: "comment_123",
        momentId: "moment_123",
        userId: "user_456",
        content: "Great moment!",
        richContent: "Great moment!",
        sentiment: "positive",
        likesCount: 5,
        repliesCount: 2,
        reportsCount: 0,
        viewsCount: 10,
        createdAt: new Date("2025-01-01T12:00:00Z"),
        updatedAt: new Date("2025-01-01T12:00:00Z"),
        deletedAt: null,
    }

    const mockComment2 = {
        id: "comment_456",
        momentId: "moment_123",
        userId: "user_789",
        content: "Amazing content!",
        richContent: "Amazing content!",
        sentiment: "positive",
        likesCount: 3,
        repliesCount: 0,
        reportsCount: 0,
        viewsCount: 5,
        createdAt: new Date("2025-01-01T13:00:00Z"),
        updatedAt: new Date("2025-01-01T13:00:00Z"),
        deletedAt: null,
    }

    const mockUser1 = {
        id: "user_456",
        username: "john_doe",
        profilePicture: {
            fullhdResolution: "https://example.com/john_fullhd.jpg",
            tinyResolution: "https://example.com/john_tiny.jpg",
        },
    }

    const mockUser2 = {
        id: "user_789",
        username: "jane_smith",
        profilePicture: {
            fullhdResolution: null,
            tinyResolution: "https://example.com/jane_tiny.jpg",
        },
    }

    beforeEach(() => {
        mockCommentRepository = {
            findByMomentId: vi.fn(),
            findTopLevelComments: vi.fn(),
            countByMomentId: vi.fn(),
        } as any

        mockUserRepository = {
            findById: vi.fn(),
        } as any

        getMomentCommentsUseCase = new GetMomentCommentsUseCase(
            mockCommentRepository,
            mockUserRepository,
        )
    })

    describe("execute", () => {
        it("should get comments successfully with user data", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([mockComment1, mockComment2])
            mockUserRepository.findById
                .mockResolvedValueOnce(mockUser1)
                .mockResolvedValueOnce(mockUser2)

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.comments).toHaveLength(2)
            expect(result.comments![0].comment.id).toBe("comment_123")
            expect(result.comments![0].user.username).toBe("john_doe")
            expect(result.comments![0].user.profilePicture).toEqual({
                fullhdResolution: "https://example.com/john_fullhd.jpg",
                tinyResolution: "https://example.com/john_tiny.jpg",
            })
            expect(result.comments![1].user.username).toBe("jane_smith")
            expect(result.comments![1].user.profilePicture).toEqual({
                fullhdResolution: null,
                tinyResolution: "https://example.com/jane_tiny.jpg",
            })
        })

        it("should return formatted createdAt as relative time", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([mockComment1])
            mockUserRepository.findById.mockResolvedValue(mockUser1)

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.comments).toHaveLength(1)
            expect(result.comments![0].createdAt).toBeDefined()
            expect(typeof result.comments![0].createdAt).toBe("string")
        })

        it("should handle pagination correctly", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
                page: 1,
                limit: 1,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([mockComment1])
            mockUserRepository.findById.mockResolvedValue(mockUser1)

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.pagination).toBeDefined()
            expect(result.pagination!.page).toBe(1)
            expect(result.pagination!.limit).toBe(1)
            expect(result.pagination!.total).toBe(1)
            expect(mockCommentRepository.findByMomentId).toHaveBeenCalledWith("moment_123", 1, 0)
        })

        it("should limit maximum page size to 100", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
                page: 1,
                limit: 200, // Requesting more than allowed
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([])
            mockUserRepository.findById.mockResolvedValue(mockUser1)

            // Act
            await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(mockCommentRepository.findByMomentId).toHaveBeenCalledWith("moment_123", 100, 0)
        })

        it("should filter out comments whose users are not found", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([mockComment1, mockComment2])
            mockUserRepository.findById
                .mockResolvedValueOnce(mockUser1)
                .mockResolvedValueOnce(null) // User not found

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.comments).toHaveLength(1) // Only comment1 should be returned
            expect(result.comments![0].comment.id).toBe("comment_123")
        })

        it("should use default values when page and limit are not provided", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([mockComment1])
            mockUserRepository.findById.mockResolvedValue(mockUser1)

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.pagination!.page).toBe(1)
            expect(result.pagination!.limit).toBe(20)
            expect(mockCommentRepository.findByMomentId).toHaveBeenCalledWith("moment_123", 20, 0)
        })

        it("should handle empty comment list", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_without_comments",
                user: mockAuthUser,
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([])

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.comments).toHaveLength(0)
            expect(result.pagination!.total).toBe(0)
            expect(result.pagination!.totalPages).toBe(0)
        })

        it("should apply user timezone to createdAt formatting", async () => {
            // Arrange
            const userWithDifferentTimezone = {
                ...mockAuthUser,
                timezone: 5, // Different timezone
            }

            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: userWithDifferentTimezone,
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([mockComment1])
            mockUserRepository.findById.mockResolvedValue(mockUser1)

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.comments![0].createdAt).toBeDefined()
        })

        it("should handle repository errors gracefully", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByMomentId.mockRejectedValue(new Error("Database error"))

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Database error")
        })

        it("should handle user repository errors gracefully", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([mockComment1])
            mockUserRepository.findById.mockRejectedValue(new Error("User service error"))

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("User service error")
        })

        it("should deduplicate user queries when multiple comments from same user", async () => {
            // Arrange
            const commentFromSameUser = {
                ...mockComment2,
                userId: "user_456", // Same user as mockComment1
            }

            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([
                mockComment1,
                commentFromSameUser,
            ])
            mockUserRepository.findById.mockResolvedValue(mockUser1)

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockUserRepository.findById).toHaveBeenCalledTimes(1) // Only called once for both comments
            expect(result.comments).toHaveLength(2)
            expect(result.comments![0].user.username).toBe("john_doe")
            expect(result.comments![1].user.username).toBe("john_doe")
        })

        it("should fallback to tinyResolution when fullhdResolution is not available", async () => {
            // Arrange
            const request: GetMomentCommentsRequest = {
                momentId: "moment_123",
                user: mockAuthUser,
                page: 1,
                limit: 20,
            }

            mockCommentRepository.findByMomentId.mockResolvedValue([mockComment2])
            mockUserRepository.findById.mockResolvedValue(mockUser2)

            // Act
            const result = await getMomentCommentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.comments![0].user.profilePicture).toEqual({
                fullhdResolution: null,
                tinyResolution: "https://example.com/jane_tiny.jpg",
            })
        })
    })
})

