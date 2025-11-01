import { beforeEach, describe, expect, it, vi } from "vitest"

import { Comment } from "../../../domain/moment/entities/comment.entity"
import { CommentRepositoryImpl } from "../comment.repository.impl"

// Mock dos modelos Sequelize
const mockModels = {
    sequelize: {
        transaction: vi.fn().mockResolvedValue({
            commit: vi.fn(),
            rollback: vi.fn(),
        }),
        fn: vi.fn().mockReturnValue({
            count: vi.fn(),
            unnest: vi.fn(),
        }),
        col: vi.fn().mockImplementation((colName) => colName),
        literal: vi.fn().mockImplementation((literal) => literal),
    },
    Comment: {
        create: vi.fn(),
        findByPk: vi.fn(),
        update: vi.fn(),
        destroy: vi.fn(),
        findAll: vi.fn(),
        count: vi.fn(),
        findAndCountAll: vi.fn(),
        increment: vi.fn(),
        sum: vi.fn(),
    },
}

// Mock da entidade Comment
const mockComment = {
    id: "comment-test-id",
    momentId: "moment-123",
    authorId: "user-123",
    commentId: null,
    content: "Este é um comentário de teste",
    status: "published",
    visibility: "public",
    category: "general",
    sentiment: "positive",
    likesCount: 5,
    repliesCount: 2,
    reportsCount: 0,
    viewsCount: 10,
    moderationFlags: [],
    severity: "low",
    moderationScore: 20,
    isModerated: false,
    moderatedAt: null,
    moderatedBy: null,
    mentions: ["@user456"],
    hashtags: ["#test"],
    metadata: { source: "web" },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    toEntity: vi.fn().mockReturnValue({
        id: "comment-test-id",
        momentId: "moment-123",
        authorId: "user-123",
        commentId: null,
        content: "Este é um comentário de teste",
        status: "published",
        visibility: "public",
        category: "general",
        sentiment: "positive",
        likesCount: 5,
        repliesCount: 2,
        reportsCount: 0,
        viewsCount: 10,
        moderationFlags: [],
        severity: "low",
        moderationScore: 20,
        isModerated: false,
        moderatedAt: null,
        moderatedBy: null,
        mentions: ["@user456"],
        hashtags: ["#test"],
        metadata: { source: "web" },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    }),
} as any

// Mock do database
const mockDatabase = {
    getConnection: vi.fn().mockReturnValue({ models: mockModels }),
}

describe("CommentRepositoryImpl", () => {
    let repository: CommentRepositoryImpl

    beforeEach(() => {
        vi.clearAllMocks()
        repository = new CommentRepositoryImpl(mockDatabase)
    })

    describe("create", () => {
        it("deve criar um comentário com sucesso", async () => {
            // Arrange
            const mockTransaction = {
                commit: vi.fn(),
                rollback: vi.fn(),
            }
            mockModels.sequelize.transaction.mockResolvedValue(mockTransaction)
            mockModels.Comment.create.mockResolvedValue(mockComment)

            // Act
            const result = await repository.create(mockComment)

            // Assert
            expect(mockModels.sequelize.transaction).toHaveBeenCalled()
            expect(mockModels.Comment.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: mockComment.id,
                    momentId: mockComment.momentId,
                    authorId: mockComment.authorId,
                    content: mockComment.content,
                }),
                { transaction: mockTransaction },
            )
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(result).toEqual(mockComment)
        })

        it("deve fazer rollback em caso de erro", async () => {
            // Arrange
            const mockTransaction = {
                commit: vi.fn(),
                rollback: vi.fn(),
            }
            mockModels.sequelize.transaction.mockResolvedValue(mockTransaction)
            mockModels.Comment.create.mockRejectedValue(new Error("Database error"))

            // Act & Assert
            await expect(repository.create(mockComment)).rejects.toThrow("Database error")
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })
    })

    describe("findById", () => {
        it("deve encontrar um comentário por ID", async () => {
            // Arrange
            const mockCommentData = {
                id: "comment-test-id",
                momentId: "moment-123",
                authorId: "user-123",
                content: "Este é um comentário de teste",
                status: "published",
                visibility: "public",
                category: "general",
                sentiment: "positive",
                likesCount: 5,
                repliesCount: 2,
                reportsCount: 0,
                viewsCount: 10,
                moderationFlags: [],
                severity: "low",
                moderationScore: 20,
                isModerated: false,
                moderatedAt: null,
                moderatedBy: null,
                mentions: ["@user456"],
                hashtags: ["#test"],
                metadata: { source: "web" },
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            }

            mockModels.Comment.findByPk.mockResolvedValue(mockCommentData)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = await repository.findById("comment-test-id")

            // Assert
            expect(mockModels.Comment.findByPk).toHaveBeenCalledWith("comment-test-id")
            expect(result).toEqual(mockComment)
        })

        it("deve retornar null para ID inexistente", async () => {
            // Arrange
            mockModels.Comment.findByPk.mockResolvedValue(null)

            // Act
            const result = await repository.findById("inexistente")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("update", () => {
        it("deve atualizar um comentário existente", async () => {
            // Act
            const result = await repository.update(mockComment)

            // Assert
            expect(mockModels.Comment.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: mockComment.content,
                    status: mockComment.status,
                    visibility: mockComment.visibility,
                    likesCount: mockComment.likesCount,
                    repliesCount: mockComment.repliesCount,
                }),
                { where: { id: mockComment.id } },
            )
            expect(result).toEqual(mockComment)
        })
    })

    describe("delete", () => {
        it("deve deletar um comentário", async () => {
            // Act
            await repository.delete("comment-test-id")

            // Assert
            expect(mockModels.Comment.destroy).toHaveBeenCalledWith({
                where: { id: "comment-test-id" },
            })
        })
    })

    describe("findByMomentId", () => {
        it("deve encontrar comentários por momentId", async () => {
            // Arrange
            const mockComments = [mockComment]
            mockModels.Comment.findAll.mockResolvedValue(mockComments)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = await repository.findByMomentId("moment-123")

            // Assert
            expect(mockModels.Comment.findAll).toHaveBeenCalledWith({
                where: { momentId: "moment-123" },
                limit: 20,
                offset: 0,
                order: [["createdAt", "DESC"]],
            })
            expect(result).toEqual([mockComment])
        })
    })

    describe("findByAuthorId", () => {
        it("deve encontrar comentários por authorId", async () => {
            // Arrange
            const mockComments = [mockComment]
            mockModels.Comment.findAll.mockResolvedValue(mockComments)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = await repository.findByAuthorId("user-123")

            // Assert
            expect(mockModels.Comment.findAll).toHaveBeenCalledWith({
                where: { authorId: "user-123" },
                limit: 20,
                offset: 0,
                order: [["createdAt", "DESC"]],
            })
            expect(result).toEqual([mockComment])
        })
    })

    describe("findTopLevelComments", () => {
        it("deve encontrar comentários de nível superior", async () => {
            // Arrange
            const mockComments = [mockComment]
            mockModels.Comment.findAll.mockResolvedValue(mockComments)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = await repository.findTopLevelComments("moment-123")

            // Assert
            expect(mockModels.Comment.findAll).toHaveBeenCalledWith({
                where: {
                    momentId: "moment-123",
                    commentId: null,
                },
                limit: 20,
                offset: 0,
                order: [["createdAt", "DESC"]],
            })
            expect(result).toEqual([mockComment])
        })
    })

    describe("findRepliesToComment", () => {
        it("deve encontrar respostas a um comentário", async () => {
            // Arrange
            const mockReplies = [mockComment]
            mockModels.Comment.findAll.mockResolvedValue(mockReplies)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = await repository.findRepliesToComment("comment-test-id")

            // Assert
            expect(mockModels.Comment.findAll).toHaveBeenCalledWith({
                where: { commentId: "comment-test-id" },
                limit: 20,
                offset: 0,
                order: [["createdAt", "ASC"]],
            })
            expect(result).toEqual([mockComment])
        })
    })

    describe("findByStatus", () => {
        it("deve encontrar comentários por status", async () => {
            // Arrange
            const mockComments = [mockComment]
            mockModels.Comment.findAll.mockResolvedValue(mockComments)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = await repository.findByStatus("published")

            // Assert
            expect(mockModels.Comment.findAll).toHaveBeenCalledWith({
                where: { status: "published" },
                limit: 20,
                offset: 0,
                order: [["createdAt", "DESC"]],
            })
            expect(result).toEqual([mockComment])
        })
    })

    describe("findPendingModeration", () => {
        it("deve encontrar comentários pendentes de moderação", async () => {
            // Arrange
            const mockComments = [mockComment]
            mockModels.Comment.findAll.mockResolvedValue(mockComments)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = await repository.findPendingModeration()

            // Assert
            expect(mockModels.Comment.findAll).toHaveBeenCalledWith({
                where: {
                    isModerated: false,
                    moderationScore: {
                        [Symbol.for("gte")]: 70,
                    },
                },
                limit: 20,
                offset: 0,
                order: [["moderationScore", "DESC"]],
            })
            expect(result).toEqual([mockComment])
        })
    })

    describe("findByContent", () => {
        it("deve encontrar comentários por conteúdo", async () => {
            // Arrange
            const mockComments = [mockComment]
            mockModels.Comment.findAll.mockResolvedValue(mockComments)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = await repository.findByContent("teste")

            // Assert
            expect(mockModels.Comment.findAll).toHaveBeenCalledWith({
                where: {
                    content: {
                        [Symbol.for("iLike")]: "%teste%",
                    },
                },
                limit: 20,
                offset: 0,
                order: [["createdAt", "DESC"]],
            })
            expect(result).toEqual([mockComment])
        })
    })

    describe("countByMomentId", () => {
        it("deve contar comentários por momentId", async () => {
            // Arrange
            mockModels.Comment.count.mockResolvedValue(5)

            // Act
            const result = await repository.countByMomentId("moment-123")

            // Assert
            expect(mockModels.Comment.count).toHaveBeenCalledWith({
                where: { momentId: "moment-123" },
            })
            expect(result).toBe(5)
        })
    })

    describe("countByAuthorId", () => {
        it("deve contar comentários por authorId", async () => {
            // Arrange
            mockModels.Comment.count.mockResolvedValue(10)

            // Act
            const result = await repository.countByAuthorId("user-123")

            // Assert
            expect(mockModels.Comment.count).toHaveBeenCalledWith({
                where: { authorId: "user-123" },
            })
            expect(result).toBe(10)
        })
    })

    describe("countPendingModeration", () => {
        it("deve contar comentários pendentes de moderação", async () => {
            // Arrange
            mockModels.Comment.count.mockResolvedValue(3)

            // Act
            const result = await repository.countPendingModeration()

            // Assert
            expect(mockModels.Comment.count).toHaveBeenCalledWith({
                where: {
                    isModerated: false,
                    moderationScore: {
                        [Symbol.for("gte")]: 70,
                    },
                },
            })
            expect(result).toBe(3)
        })
    })

    describe("exists", () => {
        it("deve verificar se comentário existe", async () => {
            // Arrange
            mockModels.Comment.count.mockResolvedValue(1)

            // Act
            const result = await repository.exists("comment-test-id")

            // Assert
            expect(mockModels.Comment.count).toHaveBeenCalledWith({
                where: { id: "comment-test-id" },
            })
            expect(result).toBe(true)
        })

        it("deve retornar false quando comentário não existe", async () => {
            // Arrange
            mockModels.Comment.count.mockResolvedValue(0)

            // Act
            const result = await repository.exists("inexistente")

            // Assert
            expect(result).toBe(false)
        })
    })

    describe("createMany", () => {
        it("deve criar múltiplos comentários", async () => {
            // Arrange
            const mockComments = [mockComment, { ...mockComment, id: "comment-2" }]
            mockModels.Comment.create.mockResolvedValue(mockComment)

            // Act
            const result = await repository.createMany(mockComments)

            // Assert
            expect(result).toHaveLength(2)
            expect(mockModels.Comment.create).toHaveBeenCalledTimes(2)
        })
    })

    describe("updateMany", () => {
        it("deve atualizar múltiplos comentários", async () => {
            // Arrange
            const mockComments = [mockComment, { ...mockComment, id: "comment-2" }]

            // Act
            const result = await repository.updateMany(mockComments)

            // Assert
            expect(result).toHaveLength(2)
            expect(mockModels.Comment.update).toHaveBeenCalledTimes(2)
        })
    })

    describe("deleteMany", () => {
        it("deve deletar múltiplos comentários", async () => {
            // Act
            await repository.deleteMany(["comment-1", "comment-2", "comment-3"])

            // Assert
            expect(mockModels.Comment.destroy).toHaveBeenCalledWith({
                where: { id: { [Symbol.for("in")]: ["comment-1", "comment-2", "comment-3"] } },
            })
        })
    })

    describe("findPaginated", () => {
        it("deve retornar comentários paginados", async () => {
            // Arrange
            const mockResult = {
                count: 10,
                rows: [mockComment],
            }
            mockModels.Comment.findAndCountAll.mockResolvedValue(mockResult)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = await repository.findPaginated(1, 10)

            // Assert
            expect(result).toEqual({
                comments: [mockComment],
                total: 10,
                page: 1,
                limit: 10,
                totalPages: 1,
            })
            expect(mockModels.Comment.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                order: [["createdAt", "DESC"]],
                limit: 10,
                offset: 0,
            })
        })

        it("deve aplicar filtros corretamente", async () => {
            // Arrange
            const mockResult = {
                count: 5,
                rows: [mockComment],
            }
            mockModels.Comment.findAndCountAll.mockResolvedValue(mockResult)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            const filters = {
                momentId: "moment-123",
                authorId: "user-123",
                status: "published",
                category: "general",
                sentiment: "positive",
            }

            const sort = {
                field: "likesCount",
                direction: "ASC" as const,
            }

            // Act
            const result = await repository.findPaginated(1, 10, filters, sort)

            // Assert
            expect(mockModels.Comment.findAndCountAll).toHaveBeenCalledWith({
                where: {
                    momentId: "moment-123",
                    authorId: "user-123",
                    status: "published",
                    category: "general",
                    sentiment: "positive",
                },
                order: [["likesCount", "ASC"]],
                limit: 10,
                offset: 0,
            })
        })
    })

    describe("search", () => {
        it("deve buscar comentários com opções", async () => {
            // Arrange
            const mockComments = [mockComment]
            mockModels.Comment.findAll.mockResolvedValue(mockComments)

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            const searchOptions = {
                momentId: "moment-123",
                content: "teste",
                hashtags: ["#test"],
                mentions: ["@user"],
                limit: 20,
                offset: 0,
                sortBy: "createdAt",
                sortDirection: "DESC" as const,
            }

            // Act
            const result = await repository.search(searchOptions)

            // Assert
            expect(mockModels.Comment.findAll).toHaveBeenCalledWith({
                where: {
                    momentId: "moment-123",
                    content: {
                        [Symbol.for("iLike")]: "%teste%",
                    },
                    hashtags: {
                        [Symbol.for("overlap")]: ["#test"],
                    },
                    mentions: {
                        [Symbol.for("overlap")]: ["@user"],
                    },
                },
                order: [["createdAt", "DESC"]],
                limit: 20,
                offset: 0,
            })
            expect(result).toEqual([mockComment])
        })
    })

    describe("getAnalytics", () => {
        it("deve retornar analytics corretos", async () => {
            // Arrange
            const mockStatusDistribution = [
                { status: "published", count: "8" },
                { status: "pending", count: "2" },
            ]
            const mockCategoryDistribution = [
                { category: "general", count: "7" },
                { category: "question", count: "3" },
            ]
            const mockSentimentDistribution = [
                { sentiment: "positive", count: "6" },
                { sentiment: "neutral", count: "4" },
            ]
            const mockTopCommenters = [
                { authorId: "user-123", count: "5" },
                { authorId: "user-456", count: "3" },
            ]

            mockModels.Comment.count.mockResolvedValue(10)
            mockModels.Comment.findAll
                .mockResolvedValueOnce(mockStatusDistribution)
                .mockResolvedValueOnce(mockCategoryDistribution)
                .mockResolvedValueOnce(mockSentimentDistribution)
                .mockResolvedValueOnce(mockTopCommenters)

            // Act
            const result = await repository.getAnalytics()

            // Assert
            expect(result).toEqual({
                totalComments: 10,
                statusDistribution: [
                    { status: "published", count: 8 },
                    { status: "pending", count: 2 },
                ],
                categoryDistribution: [
                    { category: "general", count: 7 },
                    { category: "question", count: 3 },
                ],
                sentimentDistribution: [
                    { sentiment: "positive", count: 6 },
                    { sentiment: "neutral", count: 4 },
                ],
                topCommenters: [
                    { authorId: "user-123", count: 5 },
                    { authorId: "user-456", count: 3 },
                ],
            })
        })
    })

    describe("incrementLikes", () => {
        it("deve incrementar likes de um comentário", async () => {
            // Act
            await repository.incrementLikes("comment-test-id")

            // Assert
            expect(mockModels.Comment.increment).toHaveBeenCalledWith(
                { likesCount: 1 },
                { where: { id: "comment-test-id" } },
            )
        })
    })

    describe("decrementLikes", () => {
        it("deve decrementar likes de um comentário", async () => {
            // Act
            await repository.decrementLikes("comment-test-id")

            // Assert
            expect(mockModels.Comment.increment).toHaveBeenCalledWith(
                { likesCount: -1 },
                { where: { id: "comment-test-id" } },
            )
        })
    })

    describe("incrementReplies", () => {
        it("deve incrementar replies de um comentário", async () => {
            // Act
            await repository.incrementReplies("comment-test-id")

            // Assert
            expect(mockModels.Comment.increment).toHaveBeenCalledWith(
                { repliesCount: 1 },
                { where: { id: "comment-test-id" } },
            )
        })
    })

    describe("decrementReplies", () => {
        it("deve decrementar replies de um comentário", async () => {
            // Act
            await repository.decrementReplies("comment-test-id")

            // Assert
            expect(mockModels.Comment.increment).toHaveBeenCalledWith(
                { repliesCount: -1 },
                { where: { id: "comment-test-id" } },
            )
        })
    })

    describe("incrementReports", () => {
        it("deve incrementar reports de um comentário", async () => {
            // Act
            await repository.incrementReports("comment-test-id")

            // Assert
            expect(mockModels.Comment.increment).toHaveBeenCalledWith(
                { reportsCount: 1 },
                { where: { id: "comment-test-id" } },
            )
        })
    })

    describe("incrementViews", () => {
        it("deve incrementar views de um comentário", async () => {
            // Act
            await repository.incrementViews("comment-test-id")

            // Assert
            expect(mockModels.Comment.increment).toHaveBeenCalledWith(
                { viewsCount: 1 },
                { where: { id: "comment-test-id" } },
            )
        })
    })

    describe("mapToDomainEntity", () => {
        it("deve mapear dados do banco para entidade de domínio", () => {
            // Arrange
            const mockCommentData = {
                id: "comment-test-id",
                momentId: "moment-123",
                authorId: "user-123",
                content: "Teste",
                status: "published",
                visibility: "public",
                category: "general",
                sentiment: "positive",
                likesCount: 5,
                repliesCount: 2,
                reportsCount: 0,
                viewsCount: 10,
                moderationFlags: [],
                severity: "low",
                moderationScore: 20,
                isModerated: false,
                moderatedAt: null,
                moderatedBy: null,
                mentions: ["@user"],
                hashtags: ["#test"],
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            }

            // Mock do método fromEntity da entidade Comment
            vi.spyOn(Comment, "fromEntity").mockReturnValue(mockComment as any)

            // Act
            const result = (repository as any).mapToDomainEntity(mockCommentData)

            // Assert
            expect(Comment.fromEntity).toHaveBeenCalledWith({
                id: "comment-test-id",
                momentId: "moment-123",
                authorId: "user-123",
                commentId: undefined,
                content: "Teste",
                status: "published",
                visibility: "public",
                category: "general",
                sentiment: "positive",
                likesCount: 5,
                repliesCount: 2,
                reportsCount: 0,
                viewsCount: 10,
                moderationFlags: [],
                severity: "low",
                moderationScore: 20,
                isModerated: false,
                moderatedAt: null,
                moderatedBy: null,
                mentions: ["@user"],
                hashtags: ["#test"],
                metadata: {},
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
                deletedAt: null,
            })
            expect(result).toEqual(mockComment)
        })
    })
})
