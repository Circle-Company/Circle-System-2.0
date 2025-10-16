/**
 * Testes para a entidade Comment
 */

import { beforeEach, describe, expect, it } from "vitest"
import {
    CommentCategoryEnum,
    CommentSentimentEnum,
    CommentSeverityEnum,
    CommentStatusEnum,
    CommentVisibilityEnum,
} from "../../types/comment.type"

import { Comment } from "../comment.entity"

// Mock das dependências
const mockUser = {
    id: "user_123",
    isActive: () => true,
    isBlocked: () => false,
    canInteractWithMoments: () => true,
    canAccessAdminFeatures: () => false,
} as any

const mockMoment = {
    id: "moment_123",
    ownerId: "owner_123",
    status: { current: "published" },
    visibility: { level: "public" },
} as any

const mockMomentOwner = {
    id: "owner_123",
    canAccessAdminFeatures: () => false,
} as any

describe("Comment Entity", () => {
    let comment: Comment

    beforeEach(() => {
        comment = Comment.create({
            momentId: "moment_123",
            authorId: "user_123",
            content: "Este é um comentário de teste",
        })
    })

    describe("Constructor and Basic Properties", () => {
        it("deve criar um comentário com propriedades básicas", () => {
            expect(comment.id).toBeDefined()
            expect(comment.momentId).toBe("moment_123")
            expect(comment.authorId).toBe("user_123")
            expect(comment.content).toBe("Este é um comentário de teste")
            expect(comment.status).toBe(CommentStatusEnum.ACTIVE)
            expect(comment.visibility).toBe(CommentVisibilityEnum.PUBLIC)
            expect(comment.category).toBe(CommentCategoryEnum.NEUTRAL)
            expect(comment.sentiment).toBe(CommentSentimentEnum.NEUTRAL)
        })

        it("deve inicializar métricas com valores padrão", () => {
            expect(comment.likesCount).toBe(0)
            expect(comment.repliesCount).toBe(0)
            expect(comment.reportsCount).toBe(0)
            expect(comment.viewsCount).toBe(0)
        })

        it("deve inicializar moderação com valores padrão", () => {
            expect(comment.moderationFlags).toEqual([])
            expect(comment.severity).toBe(CommentSeverityEnum.LOW)
            expect(comment.moderationScore).toBe(0)
            expect(comment.isModerated).toBe(false)
            expect(comment.moderatedAt).toBeNull()
            expect(comment.moderatedBy).toBeNull()
        })
    })

    describe("Permission Methods", () => {
        describe("canCommentOnMoment", () => {
            it("deve permitir comentário quando usuário está ativo e pode interagir", () => {
                const result = comment.canCommentOnMoment(mockUser, mockMoment, mockMomentOwner)
                expect(result.allowed).toBe(true)
            })

            it("deve negar comentário quando usuário não está ativo", () => {
                const inactiveUser = { ...mockUser, isActive: () => false }
                const result = comment.canCommentOnMoment(inactiveUser, mockMoment, mockMomentOwner)
                expect(result.allowed).toBe(false)
                expect(result.reason).toBe("Usuário não está ativo")
            })

            it("deve negar comentário quando usuário está bloqueado", () => {
                const blockedUser = { ...mockUser, isBlocked: () => true }
                const result = comment.canCommentOnMoment(blockedUser, mockMoment, mockMomentOwner)
                expect(result.allowed).toBe(false)
                expect(result.reason).toBe("Usuário está bloqueado")
            })

            it("deve negar comentário quando usuário não pode interagir", () => {
                const restrictedUser = { ...mockUser, canInteractWithMoments: () => false }
                const result = comment.canCommentOnMoment(
                    restrictedUser,
                    mockMoment,
                    mockMomentOwner,
                )
                expect(result.allowed).toBe(false)
                expect(result.reason).toBe("Usuário não pode interagir com momentos")
            })
        })

        describe("isOwner", () => {
            it("deve retornar true quando usuário é o autor", () => {
                expect(comment.isOwner("user_123")).toBe(true)
            })

            it("deve retornar false quando usuário não é o autor", () => {
                expect(comment.isOwner("other_user")).toBe(false)
            })
        })

        describe("canDeleteComment", () => {
            it("deve permitir deleção quando usuário é o autor", () => {
                const result = comment.canDeleteComment("user_123", mockUser, mockMomentOwner)
                expect(result.allowed).toBe(true)
            })

            it("deve permitir deleção quando usuário é o owner do momento", () => {
                const result = comment.canDeleteComment("owner_123", mockUser, mockMomentOwner)
                expect(result.allowed).toBe(true)
            })

            it("deve permitir deleção quando usuário é admin", () => {
                const adminUser = { ...mockUser, canAccessAdminFeatures: () => true }
                const result = comment.canDeleteComment("admin_user", adminUser, mockMomentOwner)
                expect(result.allowed).toBe(true)
            })

            it("deve negar deleção quando usuário não tem permissão", () => {
                const result = comment.canDeleteComment("other_user", mockUser, mockMomentOwner)
                expect(result.allowed).toBe(false)
                expect(result.reason).toBe("Usuário não tem permissão para deletar este comentário")
            })
        })

        describe("canViewComment", () => {
            it("deve permitir visualização de comentário público", () => {
                const result = comment.canViewComment(
                    "any_user",
                    mockUser,
                    mockMomentOwner,
                    mockMoment,
                )
                expect(result.allowed).toBe(true)
            })

            it("deve negar visualização de comentário deletado para usuários não autorizados", () => {
                comment = Comment.create({
                    momentId: "moment_123",
                    authorId: "user_123",
                    content: "Comentário deletado",
                    status: CommentStatusEnum.DELETED,
                })

                const result = comment.canViewComment(
                    "other_user",
                    mockUser,
                    mockMomentOwner,
                    mockMoment,
                )
                expect(result.allowed).toBe(false)
                expect(result.reason).toBe("Comentário foi deletado")
            })

            it("deve permitir visualização de comentário deletado para o autor", () => {
                comment = Comment.create({
                    momentId: "moment_123",
                    authorId: "user_123",
                    content: "Comentário deletado",
                    status: CommentStatusEnum.DELETED,
                })

                const result = comment.canViewComment(
                    "user_123",
                    mockUser,
                    mockMomentOwner,
                    mockMoment,
                )
                expect(result.allowed).toBe(true)
            })
        })

        describe("canEditComment", () => {
            it("deve permitir edição quando usuário é o autor", () => {
                const result = comment.canEditComment("user_123", mockUser)
                expect(result.allowed).toBe(true)
            })

            it("deve negar edição quando usuário não é o autor", () => {
                const result = comment.canEditComment("other_user", mockUser)
                expect(result.allowed).toBe(false)
                expect(result.reason).toBe("Apenas o autor pode editar o comentário")
            })

            it("deve negar edição de comentário deletado", () => {
                comment = Comment.create({
                    momentId: "moment_123",
                    authorId: "user_123",
                    content: "Comentário deletado",
                    status: CommentStatusEnum.DELETED,
                })

                const result = comment.canEditComment("user_123", mockUser)
                expect(result.allowed).toBe(false)
                expect(result.reason).toBe("Não é possível editar comentário deletado")
            })
        })

        describe("canModerateComment", () => {
            it("deve permitir moderação quando usuário é admin", () => {
                const adminUser = { ...mockUser, canAccessAdminFeatures: () => true }
                const result = comment.canModerateComment("admin_user", adminUser)
                expect(result.allowed).toBe(true)
            })

            it("deve negar moderação quando usuário não é admin", () => {
                const result = comment.canModerateComment("user_123", mockUser)
                expect(result.allowed).toBe(false)
                expect(result.reason).toBe("Apenas administradores podem moderar comentários")
            })
        })
    })

    describe("Content Analysis", () => {
        it("deve detectar sentimento positivo", () => {
            const positiveComment = Comment.create({
                momentId: "moment_123",
                authorId: "user_123",
                content: "Muito obrigado! Excelente trabalho!",
            })

            expect(positiveComment.sentiment).toBe(CommentSentimentEnum.POSITIVE)
        })

        it("deve detectar sentimento negativo", () => {
            const negativeComment = Comment.create({
                momentId: "moment_123",
                authorId: "user_123",
                content: "Isso é horrível e péssimo!",
            })

            expect(negativeComment.sentiment).toBe(CommentSentimentEnum.NEGATIVE)
        })

        it("deve categorizar como spam", () => {
            const spamComment = Comment.create({
                momentId: "moment_123",
                authorId: "user_123",
                content: "Compre agora! Promoção imperdível! https://loja.com",
            })

            expect(spamComment.category).toBe(CommentCategoryEnum.SPAM)
        })

        it("deve categorizar como pergunta", () => {
            const questionComment = Comment.create({
                momentId: "moment_123",
                authorId: "user_123",
                content: "Como você fez isso?",
            })

            expect(questionComment.category).toBe(CommentCategoryEnum.QUESTION)
        })

        it("deve detectar menções e hashtags", () => {
            const commentWithMentions = Comment.create({
                momentId: "moment_123",
                authorId: "user_123",
                content: "Oi @usuario123, isso é #incrível!",
            })

            expect(commentWithMentions.mentions).toContain("usuario123")
            expect(commentWithMentions.hashtags).toContain("incrível")
        })
    })

    describe("Moderation", () => {
        it("deve adicionar flag de moderação", () => {
            comment.addModerationFlag(
                "spam_content" as any,
                CommentSeverityEnum.MEDIUM,
                85,
                "Conteúdo spam detectado",
            )

            expect(comment.moderationFlags).toHaveLength(1)
            expect(comment.moderationFlags[0].type).toBe("spam_content")
            expect(comment.moderationFlags[0].severity).toBe(CommentSeverityEnum.MEDIUM)
            expect(comment.moderationFlags[0].confidence).toBe(85)
        })

        it("deve aprovar comentário", () => {
            comment.approve("moderator_123")

            expect(comment.status).toBe(CommentStatusEnum.APPROVED)
            expect(comment.isModerated).toBe(true)
            expect(comment.moderatedAt).toBeDefined()
            expect(comment.moderatedBy).toBe("moderator_123")
        })

        it("deve rejeitar comentário", () => {
            comment.reject("moderator_123", "Conteúdo inapropriado")

            expect(comment.status).toBe(CommentStatusEnum.REJECTED)
            expect(comment.isModerated).toBe(true)
            expect(comment.moderatedAt).toBeDefined()
            expect(comment.moderatedBy).toBe("moderator_123")
        })

        it("deve ocultar comentário", () => {
            comment.hide("moderator_123", "Conteúdo ofensivo")

            expect(comment.status).toBe(CommentStatusEnum.HIDDEN)
            expect(comment.isModerated).toBe(true)
        })
    })

    describe("Interactions", () => {
        it("deve incrementar curtidas", () => {
            expect(comment.likesCount).toBe(0)
            comment.addLike()
            expect(comment.likesCount).toBe(1)
            comment.addLike()
            expect(comment.likesCount).toBe(2)
        })

        it("deve decrementar curtidas", () => {
            comment.addLike()
            comment.addLike()
            expect(comment.likesCount).toBe(2)
            comment.removeLike()
            expect(comment.likesCount).toBe(1)
            comment.removeLike()
            expect(comment.likesCount).toBe(0)
            comment.removeLike() // Não deve ir abaixo de 0
            expect(comment.likesCount).toBe(0)
        })

        it("deve incrementar respostas", () => {
            expect(comment.repliesCount).toBe(0)
            comment.addReply()
            expect(comment.repliesCount).toBe(1)
        })

        it("deve incrementar reports", () => {
            expect(comment.reportsCount).toBe(0)
            comment.addReport()
            expect(comment.reportsCount).toBe(1)
        })

        it("deve incrementar visualizações", () => {
            expect(comment.viewsCount).toBe(0)
            comment.incrementViews()
            expect(comment.viewsCount).toBe(1)
        })
    })

    describe("Content Editing", () => {
        it("deve editar conteúdo do comentário", () => {
            const result = comment.editContent("Novo conteúdo", "user_123")
            expect(result.success).toBe(true)
            expect(comment.content).toBe("Novo conteúdo")
        })

        it("deve negar edição quando usuário não é o autor", () => {
            const result = comment.editContent("Novo conteúdo", "other_user")
            expect(result.success).toBe(false)
            expect(result.error).toBe("Apenas o autor pode editar o comentário")
        })

        it("deve deletar comentário", () => {
            const result = comment.delete("user_123")
            expect(result.success).toBe(true)
            expect(comment.status).toBe(CommentStatusEnum.DELETED)
            expect(comment.deletedAt).toBeDefined()
        })

        it("deve negar deleção de comentário já deletado", () => {
            comment.delete("user_123")
            const result = comment.delete("user_123")
            expect(result.success).toBe(false)
            expect(result.error).toBe("Comentário já foi deletado")
        })
    })

    describe("Validation", () => {
        it("deve validar comentário com conteúdo válido", () => {
            expect(() => {
                Comment.create({
                    momentId: "moment_123",
                    authorId: "user_123",
                    content: "Comentário válido",
                })
            }).not.toThrow()
        })

        it("deve falhar com momento ID ausente", () => {
            expect(() => {
                Comment.create({
                    momentId: "",
                    authorId: "user_123",
                    content: "Comentário válido",
                })
            }).toThrow("Moment ID is required")
        })

        it("deve falhar com autor ID ausente", () => {
            expect(() => {
                Comment.create({
                    momentId: "moment_123",
                    authorId: "",
                    content: "Comentário válido",
                })
            }).toThrow("Author ID is required")
        })

        it("deve falhar com conteúdo ausente", () => {
            expect(() => {
                Comment.create({
                    momentId: "moment_123",
                    authorId: "user_123",
                    content: "",
                })
            }).toThrow("Comment content is required")
        })

        it("deve falhar com conteúdo muito longo", () => {
            const longContent = "a".repeat(501)
            expect(() => {
                Comment.create({
                    momentId: "moment_123",
                    authorId: "user_123",
                    content: longContent,
                })
            }).toThrow("Comment too long (maximum 500 characters)")
        })
    })

    describe("Entity Conversion", () => {
        it("deve converter para entidade", () => {
            const entity = comment.toEntity()
            expect(entity.id).toBe(comment.id)
            expect(entity.momentId).toBe(comment.momentId)
            expect(entity.authorId).toBe(comment.authorId)
            expect(entity.content).toBe(comment.content)
        })

        it("deve criar a partir de entidade", () => {
            const entity = comment.toEntity()
            const newComment = Comment.fromEntity(entity)
            expect(newComment.id).toBe(entity.id)
            expect(newComment.momentId).toBe(entity.momentId)
            expect(newComment.authorId).toBe(entity.authorId)
            expect(newComment.content).toBe(entity.content)
        })
    })
})
