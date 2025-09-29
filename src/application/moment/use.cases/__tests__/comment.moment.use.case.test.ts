import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum } from "../../../../domain/moment"
import { CommentMomentRequest, CommentMomentUseCase } from "../comment.moment.use.case"

describe("CommentMomentUseCase", () => {
    let commentMomentUseCase: CommentMomentUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockPublishedMoment: MomentEntity = {
        id: "moment_123",
        ownerId: "user_123",
        description: "Meu vlog",
        hashtags: ["#vlog"],
        mentions: [],
        status: {
            current: MomentStatusEnum.PUBLISHED,
            previous: null,
            reason: null,
            changedBy: null,
            changedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        processing: {
            status: "completed",
            progress: 100,
            steps: [],
            error: null,
            startedAt: new Date(),
            completedAt: new Date(),
            estimatedCompletion: null,
        },
        content: {
            duration: 60,
            size: 1024,
            format: "mp4",
            width: 1080,
            height: 1920,
            hasAudio: true,
            codec: "h264",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        archivedAt: null,
        deletedAt: null,
    } as any

    const mockComment = {
        id: "comment_123",
        momentId: "moment_123",
        userId: "user_456",
        content: "Ótimo vlog!",
        parentCommentId: null,
        createdAt: new Date(),
    }

    const mockParentComment = {
        id: "parent_comment_123",
        momentId: "moment_123",
        userId: "user_789",
        content: "Comentário pai",
        parentCommentId: null,
        createdAt: new Date(),
    }

    beforeEach(() => {
        mockMomentRepository = {
            create: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findByOwnerId: vi.fn(),
            findByStatus: vi.fn(),
            findByVisibility: vi.fn(),
            findByHashtag: vi.fn(),
            findByMention: vi.fn(),
            search: vi.fn(),
            findPublished: vi.fn(),
            findRecent: vi.fn(),
            findPendingProcessing: vi.fn(),
            findFailedProcessing: vi.fn(),
            countByOwnerId: vi.fn(),
            countByStatus: vi.fn(),
            countByVisibility: vi.fn(),
            countPublished: vi.fn(),
            exists: vi.fn(),
            existsByOwnerId: vi.fn(),
            createMany: vi.fn(),
            updateMany: vi.fn(),
            deleteMany: vi.fn(),
            findPaginated: vi.fn(),
        }

        mockMomentService = {
            createMoment: vi.fn(),
            createMomentsBatch: vi.fn(),
            getMomentById: vi.fn(),
            getMomentsByOwner: vi.fn(),
            getMomentsByStatus: vi.fn(),
            getMomentsByVisibility: vi.fn(),
            getMomentsByHashtag: vi.fn(),
            getMomentsByMention: vi.fn(),
            getPublishedMoments: vi.fn(),
            getRecentMoments: vi.fn(),
            searchMoments: vi.fn(),
            updateMoment: vi.fn(),
            updateMomentsBatch: vi.fn(),
            deleteMoment: vi.fn(),
            deleteMomentsBatch: vi.fn(),
            countMomentsByOwner: vi.fn(),
            countMomentsByStatus: vi.fn(),
            countMomentsByVisibility: vi.fn(),
            countPublishedMoments: vi.fn(),
            momentExists: vi.fn(),
            ownerHasMoments: vi.fn(),
            getCommentById: vi.fn(),
            createComment: vi.fn(),
        } as any

        commentMomentUseCase = new CommentMomentUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve comentar momento com sucesso", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Ótimo vlog!",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockPublishedMoment)
            mockMomentService.createComment.mockResolvedValue(mockComment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.comment).toEqual({
                id: "comment_123",
                momentId: "moment_123",
                userId: "user_456",
                content: "Ótimo vlog!",
                parentCommentId: null,
                createdAt: expect.any(Date),
            })
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.createComment).toHaveBeenCalledWith({
                momentId: "moment_123",
                userId: "user_456",
                content: "Ótimo vlog!",
                parentCommentId: undefined,
            })
        })

        it("deve comentar momento com comentário pai com sucesso", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Resposta ao comentário",
                parentCommentId: "parent_comment_123",
            }

            const replyComment = {
                ...mockComment,
                parentCommentId: "parent_comment_123",
                content: "Resposta ao comentário",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockPublishedMoment)
            mockMomentService.getCommentById.mockResolvedValue(mockParentComment)
            mockMomentService.createComment.mockResolvedValue(replyComment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.comment?.parentCommentId).toBe("parent_comment_123")
            expect(mockMomentService.getCommentById).toHaveBeenCalledWith("parent_comment_123")
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_inexistente",
                userId: "user_456",
                content: "Ótimo vlog!",
            }

            mockMomentService.getMomentById.mockResolvedValue(null)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não encontrado")
            expect(result.comment).toBeUndefined()
            expect(mockMomentService.createComment).not.toHaveBeenCalled()
        })

        it("deve falhar quando comentário pai não é encontrado", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Resposta ao comentário",
                parentCommentId: "parent_inexistente",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockPublishedMoment)
            mockMomentService.getCommentById.mockResolvedValue(null)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Comentário pai não encontrado")
            expect(result.comment).toBeUndefined()
            expect(mockMomentService.createComment).not.toHaveBeenCalled()
        })

        it("deve falhar quando conteúdo está vazio", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "   ",
            }

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Conteúdo do comentário é obrigatório")
            expect(result.comment).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando conteúdo é muito longo", async () => {
            // Arrange
            const longContent = "a".repeat(1001)
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: longContent,
            }

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Comentário não pode ter mais de 1000 caracteres")
            expect(result.comment).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando momento não está publicado", async () => {
            // Arrange
            const unpublishedMoment = {
                ...mockPublishedMoment,
                status: {
                    ...mockPublishedMoment.status,
                    current: MomentStatusEnum.UNDER_REVIEW,
                },
            }

            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Ótimo vlog!",
            }

            mockMomentService.getMomentById.mockResolvedValue(unpublishedMoment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser comentado no estado atual")
            expect(result.comment).toBeUndefined()
            expect(mockMomentService.createComment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momento está bloqueado", async () => {
            // Arrange
            const blockedMoment = {
                ...mockPublishedMoment,
                status: {
                    ...mockPublishedMoment.status,
                    current: MomentStatusEnum.BLOCKED,
                },
            }

            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Ótimo vlog!",
            }

            mockMomentService.getMomentById.mockResolvedValue(blockedMoment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser comentado no estado atual")
            expect(result.comment).toBeUndefined()
            expect(mockMomentService.createComment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momento está deletado", async () => {
            // Arrange
            const deletedMoment = {
                ...mockPublishedMoment,
                deletedAt: new Date(),
            }

            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Ótimo vlog!",
            }

            mockMomentService.getMomentById.mockResolvedValue(deletedMoment)

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser comentado no estado atual")
            expect(result.comment).toBeUndefined()
            expect(mockMomentService.createComment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momentId não é fornecido", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "",
                userId: "user_456",
                content: "Ótimo vlog!",
            }

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do momento é obrigatório")
            expect(result.comment).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando userId não é fornecido", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "",
                content: "Ótimo vlog!",
            }

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do usuário é obrigatório")
            expect(result.comment).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando service lança erro", async () => {
            // Arrange
            const request: CommentMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
                content: "Ótimo vlog!",
            }

            mockMomentService.getMomentById.mockRejectedValue(new Error("Erro de conexão"))

            // Act
            const result = await commentMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.comment).toBeUndefined()
        })
    })
})
