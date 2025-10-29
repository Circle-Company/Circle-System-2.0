import { beforeEach, describe, expect, it, vi } from "vitest"
import { CommentMomentRequest, CommentMomentUseCase } from "../create.moment.comment.use.case"

import { MomentStatusEnum } from "../../../../../domain/moment"

describe("CommentMomentUseCase", () => {
    let commentMomentUseCase: CommentMomentUseCase
    let mockModerationEngine: any
    let mockCommentRepository: any
    let mockMomentRepository: any
    let mockUserRepository: any

    const mockUser = {
        id: "user_456",
        canInteractWithMoments: vi.fn().mockReturnValue(true),
    }

    const mockMoment = {
        id: "moment_123",
        ownerId: "user_123",
        status: {
            current: MomentStatusEnum.PUBLISHED,
        },
        canComment: vi.fn().mockResolvedValue({ allowed: true }),
        isInteractable: vi.fn().mockResolvedValue(true),
    }

    const mockComment = {
        id: "comment_123",
        momentId: "moment_123",
        userId: "user_456",
        content: "Great vlog!",
        richContent: "Great vlog!",
        sentiment: "neutral",
        applyModerationResult: vi.fn(),
    }

    beforeEach(() => {
        mockModerationEngine = {
            moderateComment: vi.fn().mockResolvedValue({
                success: true,
                moderationFields: {
                    moderationFlags: [],
                    moderationScore: 0,
                    severity: "low",
                    isModerated: true,
                    moderatedAt: new Date(),
                    moderatedBy: "system",
                },
                processingTime: 100,
            }),
        } as any

        mockCommentRepository = {
            create: vi.fn(),
            findById: vi.fn(),
            incrementReplies: vi.fn(),
        } as any

        mockMomentRepository = {
            findById: vi.fn(),
        } as any

        mockUserRepository = {
            findById: vi.fn(),
            findByUsername: vi.fn(),
        } as any

        commentMomentUseCase = new CommentMomentUseCase(
            mockModerationEngine,
            mockCommentRepository,
            mockMomentRepository,
            mockUserRepository,
        )
    })

    describe("execute", () => {
        it("should comment on moment successfully", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Great vlog!",
            }

            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockCommentRepository.create.mockResolvedValue(mockComment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.comment).toBeDefined()
            expect(mockCommentRepository.create).toHaveBeenCalled()
        })

        it("should fail when moment is not found", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_inexistent",
                userId: "user_456",
                content: "Great vlog!",
            }

            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment not found")
            expect(mockCommentRepository.create).not.toHaveBeenCalled()
        })

        it("should fail when user is not found", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_inexistent",
                content: "Great vlog!",
            }

            mockUserRepository.findById.mockResolvedValue(null)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("User not found")
        })

        it("should fail when moment is not interactable", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Great vlog!",
            }

            const nonInteractableMoment = {
                ...mockMoment,
                isInteractable: vi.fn().mockResolvedValue(false),
            }

            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentRepository.findById.mockResolvedValue(nonInteractableMoment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment is not available for comments")
        })

        it("should create reply comment successfully", async () => {
            // Arrange
            const parentComment = {
                id: "parent_123",
                momentId: "moment_123",
            }

            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Reply comment",
                replyId: "parent_123",
            }

            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockCommentRepository.findById.mockResolvedValue(parentComment)
            mockCommentRepository.create.mockResolvedValue(mockComment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockCommentRepository.incrementReplies).toHaveBeenCalledWith("parent_123")
        })

        it("should extract and map mentions from content", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Great vlog @john and @jane!",
            }

            const mentionedUser1 = { id: "user_john", username: "john" }
            const mentionedUser2 = { id: "user_jane", username: "jane" }

            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockUserRepository.findByUsername
                .mockResolvedValueOnce(mentionedUser1)
                .mockResolvedValueOnce(mentionedUser2)
            mockCommentRepository.create.mockResolvedValue(mockComment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("john")
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("jane")
        })

        it("should apply moderation result if moderation succeeds", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Great vlog!",
            }

            const mockCreatedComment = {
                ...mockComment,
                applyModerationResult: vi.fn(),
            }

            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockCommentRepository.create.mockResolvedValue(mockCreatedComment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(mockModerationEngine.moderateComment).toHaveBeenCalled()
        })

        it("should fail when parent comment is not found", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Reply comment",
                replyId: "parent_inexistent",
            }

            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentRepository.findById.mockResolvedValue(mockMoment)
            mockCommentRepository.findById.mockResolvedValue(null)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Reply to comment not found")
        })

        it("should fail when user cannot comment on moment", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Great vlog!",
            }

            const momentWithoutPermission = {
                ...mockMoment,
                canComment: vi.fn().mockResolvedValue({ 
                    allowed: false, 
                    reason: "User is blocked by the moment owner" 
                }),
            }

            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentRepository.findById.mockResolvedValue(momentWithoutPermission)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("User is blocked by the moment owner")
        })

        it("should handle internal errors gracefully", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Great vlog!",
            }

            mockUserRepository.findById.mockRejectedValue(new Error("Database error"))

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Database error")
        })
    })
})
