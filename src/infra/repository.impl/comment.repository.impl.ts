import {
    CommentAnalytics,
    CommentFilters,
    CommentSearchOptions,
    CommentSortOptions,
} from "@/domain/moment/types/comment.type"
import { Op, WhereOptions } from "sequelize"

import { Comment } from "@/domain/moment/entities/comment.entity"
import { ICommentRepository } from "@/domain/moment/repositories/comment.repository"

export class CommentRepositoryImpl implements ICommentRepository {
    constructor(private database: any) {}

    // ===== OPERAÇÕES BÁSICAS CRUD =====

    async create(comment: Comment): Promise<Comment> {
        const transaction = await this.database.getConnection().transaction()

        try {
            const commentData = comment.toEntity()

            const createdComment = await this.database.getConnection().models.MomentComment.create(
                {
                    id: BigInt(commentData.id),
                    momentId: BigInt(commentData.momentId),
                    userId: BigInt(commentData.userId),
                    replyId: commentData.replyId ? BigInt(commentData.replyId) : null,
                    content: commentData.content,
                    richContent: commentData.richContent,
                    visibility: commentData.visibility,
                    sentiment: commentData.sentiment,
                    sentimentScore: (commentData as any).sentimentIntensity || 0,
                    moderationStatus: commentData.isModerated
                        ? commentData.moderatedBy
                            ? "approved"
                            : "pending"
                        : "pending",
                    moderationFlags: commentData.moderationFlags,
                    severity: commentData.severity,
                    moderationScore: commentData.moderationScore,
                    isModerated: commentData.isModerated,
                    moderatedAt: commentData.moderatedAt,
                    moderatedBy: commentData.moderatedBy,
                    likesCount: commentData.likesCount,
                    repliesCount: commentData.repliesCount,
                    reportsCount: commentData.reportsCount,
                    viewsCount: commentData.viewsCount,
                    metadata: commentData.metadata,
                    deleted: commentData.deletedAt !== null,
                    deletedAt: commentData.deletedAt,
                },
                { transaction },
            )

            await transaction.commit()
            return this.mapToDomainEntity(createdComment)
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async findById(id: string): Promise<Comment | null> {
        const comment = await this.database.getConnection().models.MomentComment.findByPk(BigInt(id))

        if (!comment) return null

        return this.mapToDomainEntity(comment)
    }

    async update(comment: Comment): Promise<Comment> {
        const commentData = comment.toEntity()

        await this.database.getConnection().models.MomentComment.update(
            {
                content: commentData.content,
                visibility: commentData.visibility,
                sentiment: commentData.sentiment,
                sentimentScore: (commentData as any).sentimentIntensity || 0,
                moderationStatus: commentData.isModerated
                    ? commentData.moderatedBy
                        ? "approved"
                        : "pending"
                    : "pending",
                moderationFlags: commentData.moderationFlags,
                severity: commentData.severity,
                moderationScore: commentData.moderationScore,
                isModerated: commentData.isModerated,
                moderatedAt: commentData.moderatedAt,
                moderatedBy: commentData.moderatedBy,
                likesCount: commentData.likesCount,
                repliesCount: commentData.repliesCount,
                reportsCount: commentData.reportsCount,
                viewsCount: commentData.viewsCount,
                richContent: null, // richContent pode ser processado depois
                metadata: commentData.metadata,
                deleted: commentData.deletedAt !== null,
                deletedAt: commentData.deletedAt,
            },
            { where: { id: BigInt(commentData.id) } },
        )

        return comment
    }

    async delete(id: string): Promise<void> {
        await this.database.getConnection().models.MomentComment.destroy({ where: { id: BigInt(id) } })
    }

    // ===== OPERAÇÕES DE BUSCA =====

    async findByMomentId(momentId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { momentId: BigInt(momentId), deleted: false },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByUserId(userId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { userId: BigInt(userId), deleted: false },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByReplyId(
        replyId: string,
        limit = 20,
        offset = 0,
    ): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { replyId: BigInt(replyId), deleted: false },
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    // ===== OPERAÇÕES DE BUSCA AVANÇADA =====

    async findTopLevelComments(momentId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: {
                momentId: BigInt(momentId),
                replyId: null,
                deleted: false,
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findRepliesToComment(commentId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { replyId: BigInt(commentId), deleted: false },
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByStatus(status: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { moderationStatus: status, deleted: false },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByCategory(category: string, limit = 20, offset = 0): Promise<Comment[]> {
        // Category não existe no modelo, retornar array vazio
        return []
    }

    async findBySentiment(sentiment: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { sentiment, deleted: false },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findBySeverity(severity: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { severity, deleted: false },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    // ===== OPERAÇÕES DE MODERAÇÃO =====

    async findPendingModeration(limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: {
                isModerated: false,
                moderationScore: {
                    [Op.gte]: 70,
                },
                deleted: false,
            },
            limit,
            offset,
            order: [["moderationScore", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findFlaggedComments(limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: {
                moderationFlags: {
                    [Op.ne]: [],
                },
                deleted: false,
            },
            limit,
            offset,
            order: [["moderationScore", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findHiddenComments(limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: {
                moderationStatus: "rejected",
                deleted: false,
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findDeletedComments(limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: {
                deleted: true,
            },
            limit,
            offset,
            order: [["deletedAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    // ===== OPERAÇÕES DE BUSCA POR CONTEÚDO =====

    async findByContent(content: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: {
                content: {
                    [Op.iLike]: `%${content}%`,
                },
                deleted: false,
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByMention(mention: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: {
                mentions: {
                    [Op.contains]: [mention],
                },
                deleted: false,
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByHashtag(hashtag: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: {
                hashtags: {
                    [Op.contains]: [hashtag],
                },
                deleted: false,
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    // ===== OPERAÇÕES DE CONTAGEM =====

    async countByMomentId(momentId: string): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: { momentId: BigInt(momentId), deleted: false },
        })
    }

    async countByUserId(userId: string): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: { userId: BigInt(userId), deleted: false },
        })
    }

    async countByStatus(status: string): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: { moderationStatus: status, deleted: false },
        })
    }

    async countByCategory(category: string): Promise<number> {
        // Category não existe no modelo
        return 0
    }

    async countBySentiment(sentiment: string): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: { sentiment, deleted: false },
        })
    }

    async countPendingModeration(): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: {
                isModerated: false,
                moderationScore: {
                    [Op.gte]: 70,
                },
                deleted: false,
            },
        })
    }

    // ===== OPERAÇÕES DE EXISTÊNCIA =====

    async exists(id: string): Promise<boolean> {
        const count = await this.database.getConnection().models.MomentComment.count({
            where: { id: BigInt(id), deleted: false },
        })
        return count > 0
    }

    async existsByMomentId(momentId: string): Promise<boolean> {
        const count = await this.countByMomentId(momentId)
        return count > 0
    }

    async existsByUserId(userId: string): Promise<boolean> {
        const count = await this.countByUserId(userId)
        return count > 0
    }

    // ===== OPERAÇÕES EM LOTE =====

    async createMany(comments: Comment[]): Promise<Comment[]> {
        const createdComments: Comment[] = []
        for (const comment of comments) {
            const created = await this.create(comment)
            createdComments.push(created)
        }
        return createdComments
    }

    async updateMany(comments: Comment[]): Promise<Comment[]> {
        const updatedComments: Comment[] = []
        for (const comment of comments) {
            const updated = await this.update(comment)
            updatedComments.push(updated)
        }
        return updatedComments
    }

    async deleteMany(ids: string[]): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.destroy({ where: { id: { [Op.in]: ids.map((id) => BigInt(id)) } } })
    }

    // ===== OPERAÇÕES DE PAGINAÇÃO =====

    async findPaginated(
        page: number,
        limit: number,
        filters?: CommentFilters,
        sort?: CommentSortOptions,
    ): Promise<{
        comments: Comment[]
        total: number
        page: number
        limit: number
        totalPages: number
    }> {
        const where: WhereOptions = {}
        const order: any[] = []

        // Aplicar filtros
        if (filters) {
            if (filters.momentId) {
                where.momentId = BigInt(filters.momentId)
            }

            if (filters.userId) {
                where.userId = BigInt(filters.userId)
            }

            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    where.moderationStatus = { [Op.in]: filters.status }
                } else {
                    where.moderationStatus = filters.status
                }
            }

            if (filters.category) {
                // Category não existe no modelo, ignorar
            }

            if (filters.sentiment) {
                if (Array.isArray(filters.sentiment)) {
                    where.sentiment = { [Op.in]: filters.sentiment }
                } else {
                where.sentiment = filters.sentiment
                }
            }

            if (filters.severity) {
                if (Array.isArray(filters.severity)) {
                    where.severity = { [Op.in]: filters.severity }
                } else {
                where.severity = filters.severity
                }
            }

            if (filters.isModerated !== undefined) {
                where.isModerated = filters.isModerated
            }

            if (filters.hasFlags !== undefined) {
                if (filters.hasFlags) {
                    where.moderationFlags = {
                        [Op.ne]: [],
                    }
                } else {
                    where.moderationFlags = []
                }
            }

            if (filters.contentContains) {
                where.content = {
                    [Op.iLike]: `%${filters.contentContains}%`,
                }
            }

            if (filters.minLength) {
                where.content = {
                    ...(where.content as any),
                    [Op.gte]: filters.minLength,
                }
            }

            if (filters.maxLength) {
                where.content = {
                    ...(where.content as any),
                    [Op.lte]: filters.maxLength,
                }
            }

            if (filters.minLikes) {
                where.likesCount = {
                    [Op.gte]: filters.minLikes,
                }
            }

            if (filters.maxLikes) {
                where.likesCount = {
                    ...(where.likesCount as any),
                    [Op.lte]: filters.maxLikes,
                }
            }

            if (filters.minReplies) {
                where.repliesCount = {
                    [Op.gte]: filters.minReplies,
                }
            }

            if (filters.maxReplies) {
                where.repliesCount = {
                    ...(where.repliesCount as any),
                    [Op.lte]: filters.maxReplies,
                }
            }

            if (filters.createdAfter) {
                where.createdAt = {
                    [Op.gte]: filters.createdAfter,
                }
            }

            if (filters.createdBefore) {
                where.createdAt = {
                    ...(where.createdAt as any),
                    [Op.lte]: filters.createdBefore,
                }
            }

            where.deleted = false
        } else {
            where.deleted = false
        }

        // Aplicar ordenação
        if (sort) {
            order.push([sort.field, sort.direction.toUpperCase()])
        } else {
            order.push(["createdAt", "DESC"])
        }

        const offset = (page - 1) * limit

        const { count, rows } = await this.database.getConnection().models.MomentComment.findAndCountAll({
            where,
            order,
            limit,
            offset,
        })

        const comments = rows.map((comment: any) => this.mapToDomainEntity(comment))
        const totalPages = Math.ceil(count / limit)

        return {
            comments,
            total: count,
            page,
            limit,
            totalPages,
        }
    }


    // ===== OPERAÇÕES DE INTERAÇÃO =====

    async incrementLikes(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ likesCount: 1 }, { where: { id: BigInt(commentId) } })
    }

    async decrementLikes(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ likesCount: -1 }, { where: { id: BigInt(commentId) } })
    }

    async decrementReplies(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ repliesCount: -1 }, { where: { id: BigInt(commentId) } })
    }

    async incrementReplies(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ repliesCount: 1 }, { where: { id: BigInt(commentId) } })
    }

    async incrementReports(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ reportsCount: 1 }, { where: { id: BigInt(commentId) } })
    }

    async incrementViews(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ viewsCount: 1 }, { where: { id: BigInt(commentId) } })
    }

    // ===== OPERAÇÕES DE BUSCA AVANÇADA =====

    async search(options: CommentSearchOptions): Promise<Comment[]> {
        const where: WhereOptions = {}
        const order: any[] = []

        // Aplicar query
        if (options.query) {
            const searchFields = options.fields || ["content"]
            const orConditions: any[] = []

            if (searchFields.includes("content")) {
                orConditions.push({
                    content: {
                        [Op.iLike]: `%${options.query}%`,
                    },
                })
            }

            if (searchFields.includes("userId")) {
                orConditions.push({
                    userId: {
                        [Op.iLike]: `%${options.query}%`,
                    },
                })
            }


            ;(where as any)[Op.or] = orConditions
        }

        // Aplicar filtros
        if (options.filters) {
            if (options.filters.momentId) {
                where.momentId = BigInt(options.filters.momentId)
            }

            if (options.filters.userId) {
                where.userId = BigInt(options.filters.userId)
            }

            if (options.filters.status) {
                if (Array.isArray(options.filters.status)) {
                    where.moderationStatus = {
                        [Op.in]: options.filters.status,
                    }
                } else {
                    where.moderationStatus = options.filters.status
                }
            }

            if (options.filters.category) {
                // Category não existe no modelo, ignorar
            }

            if (options.filters.sentiment) {
                if (Array.isArray(options.filters.sentiment)) {
                    where.sentiment = {
                        [Op.in]: options.filters.sentiment,
                    }
                } else {
                    where.sentiment = options.filters.sentiment
                }
            }

            if (options.filters.contentContains) {
                where.content = {
                    [Op.iLike]: `%${options.filters.contentContains}%`,
                }
            }

            where.deleted = false
        } else {
            where.deleted = false
        }

        // Ordenação padrão
        order.push(["createdAt", "DESC"])

        const limit = options.limit || 20
        const offset = options.offset || 0

        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where,
            order,
            limit,
            offset,
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async getAnalytics(filters?: CommentFilters): Promise<CommentAnalytics> {
        const where: WhereOptions = {}

        if (filters) {
            if (filters.momentId) where.momentId = BigInt(filters.momentId)
            if (filters.userId) where.userId = BigInt(filters.userId)
            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    where.moderationStatus = { [Op.in]: filters.status }
                } else {
                    where.moderationStatus = filters.status
                }
            }
            if (filters.category) {
                // Category não existe no modelo, ignorar
            }
            if (filters.sentiment) {
                if (Array.isArray(filters.sentiment)) {
                    where.sentiment = { [Op.in]: filters.sentiment }
                } else {
                    where.sentiment = filters.sentiment
                }
            }
            where.deleted = false
        } else {
            where.deleted = false
        }

        // Obter todos os comentários para análise
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where,
            raw: true,
        })

        // Calcular distribuição de sentimentos
        const sentimentDistribution: Record<string, number> = {}
        comments.forEach((comment: any) => {
            const sentiment = comment.sentiment || "neutral"
            sentimentDistribution[sentiment] = (sentimentDistribution[sentiment] || 0) + 1
        })

        // Calcular distribuição de categorias
        const categoryDistribution: Record<string, number> = {}
        comments.forEach((comment: any) => {
            const category = comment.category || "neutral"
            categoryDistribution[category] = (categoryDistribution[category] || 0) + 1
        })

        // Calcular estatísticas de moderação
        const flaggedComments = comments.filter(
            (comment: any) => comment.moderationFlags && comment.moderationFlags.length > 0,
        ).length
        const approvedComments = comments.filter((comment: any) => comment.moderationStatus === "approved").length
        const rejectedComments = comments.filter((comment: any) => comment.moderationStatus === "rejected").length

        // Calcular tempo médio de moderação (simplificado)
        const moderatedComments = comments.filter((comment: any) => comment.moderatedAt && comment.createdAt)
        const moderationTimes = moderatedComments.map((comment: any) => {
            const created = new Date(comment.createdAt)
            const moderated = new Date(comment.moderatedAt)
            return (moderated.getTime() - created.getTime()) / 1000 / 60 // em minutos
        })
        const averageModerationTime =
            moderationTimes.length > 0
                ? moderationTimes.reduce((sum, time) => sum + time, 0) / moderationTimes.length
                : 0

        // Calcular estatísticas de engajamento
        const totalLikes = comments.reduce((sum: number, comment: any) => sum + (comment.likesCount || 0), 0)
        const totalReplies = comments.reduce((sum: number, comment: any) => sum + (comment.repliesCount || 0), 0)
        const averageLikes = comments.length > 0 ? totalLikes / comments.length : 0
        const averageReplies = comments.length > 0 ? totalReplies / comments.length : 0

        // Top comentadores
        const commentersMap: Record<string, number> = {}
        comments.forEach((comment: any) => {
            commentersMap[comment.userId] = (commentersMap[comment.userId] || 0) + 1
        })
        const topCommenters = Object.entries(commentersMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([userId, count]) => ({ userId, count }))

        // Distribuição temporal simplificada
        const commentsPerHour: Record<number, number> = {}
        comments.forEach((comment: any) => {
            const hour = new Date(comment.createdAt).getHours()
            commentsPerHour[hour] = (commentsPerHour[hour] || 0) + 1
        })

        const commentsPerDay: Record<number, number> = {}
        const dayOfWeek = (date: Date) => date.getDay()
        comments.forEach((comment: any) => {
            const day = dayOfWeek(new Date(comment.createdAt))
            commentsPerDay[day] = (commentsPerDay[day] || 0) + 1
        })

        // Encontrar horário de pico (simplificado - usa o horário com mais comentários)
        const peakHour = Object.entries(commentsPerHour).sort((a, b) => b[1] - a[1])[0]?.[0]
        const peakActivityTime = new Date()
        if (peakHour) peakActivityTime.setHours(Number(peakHour))

        return {
            sentimentDistribution: sentimentDistribution as any,
            categoryDistribution: categoryDistribution as any,
            moderationStats: {
                totalFlagged: flaggedComments,
                totalApproved: approvedComments,
                totalRejected: rejectedComments,
                averageModerationTime,
            },
            engagementStats: {
                averageLikes,
                averageReplies,
                topCommenters,
            },
            timeDistribution: {
                commentsPerHour,
                commentsPerDay,
                peakActivityTime,
            },
        }
    }

    async getStats(): Promise<{
        totalComments: number
        activeComments: number
        hiddenComments: number
        deletedComments: number
        flaggedComments: number
        pendingModeration: number
        averageLikes: number
        averageReplies: number
        topCommenters: Array<{ userId: string; count: number }>
    }> {
        const [
            totalComments,
            activeComments,
            hiddenComments,
            deletedComments,
            flaggedComments,
            pendingModeration,
            averageLikesData,
            averageRepliesData,
            topCommentersData,
        ] = await Promise.all([
            this.database.getConnection().models.MomentComment.count({ where: { deleted: false } }),
            this.database.getConnection().models.MomentComment.count({ where: { moderationStatus: "approved", deleted: false } }),
            this.database.getConnection().models.MomentComment.count({ where: { moderationStatus: "rejected", deleted: false } }),
            this.database.getConnection().models.MomentComment.count({
                where: { deleted: true },
            }),
            this.database.getConnection().models.MomentComment.count({
                where: { moderationFlags: { [Op.ne]: [] } },
            }),
            this.database.getConnection().models.MomentComment.count({
                where: {
                    isModerated: false,
                    moderationScore: { [Op.gte]: 70 },
                },
            }),
            this.database.getConnection().models.MomentComment.findAll({
                attributes: [
                    [
                        this.database.getConnection().fn("AVG", this.database.getConnection().col("likesCount")),
                        "avg",
                    ],
                ],
                raw: true,
            }),
            this.database.getConnection().models.MomentComment.findAll({
                attributes: [
                    [
                        this.database.getConnection().fn("AVG", this.database.getConnection().col("repliesCount")),
                        "avg",
                    ],
                ],
                raw: true,
            }),
            this.database
                .getConnection()
                .models.MomentComment.findAll({
                    attributes: [
                        "userId",
                        [this.database.getConnection().fn("COUNT", this.database.getConnection().col("id")), "count"],
                    ],
                    group: ["userId"],
                    order: [[this.database.getConnection().fn("COUNT", this.database.getConnection().col("id")), "DESC"]],
                    limit: 10,
                    raw: true,
                }),
        ])

        const averageLikes = averageLikesData?.[0]?.avg || 0
        const averageReplies = averageRepliesData?.[0]?.avg || 0

        return {
            totalComments,
            activeComments,
            hiddenComments,
            deletedComments,
            flaggedComments,
            pendingModeration,
            averageLikes: Number(averageLikes),
            averageReplies: Number(averageReplies),
            topCommenters: (topCommentersData as any[]).map((item) => ({
                userId: item.userId,
                count: Number(item.count),
            })),
        }
    }

    // ===== MÉTODOS AUXILIARES =====

    private mapToDomainEntity(commentData: any): Comment {
        const commentEntity = {
            id: String(commentData.id),
            momentId: String(commentData.momentId),
            userId: String(commentData.userId),
            replyId: commentData.replyId ? String(commentData.replyId) : undefined,
            richContent: commentData.richContent,
            content: commentData.content,
            visibility: commentData.visibility,
            sentiment: commentData.sentiment,
            sentimentIntensity: commentData.sentimentScore || 0,
            likesCount: commentData.likesCount || 0,
            repliesCount: commentData.repliesCount || 0,
            reportsCount: commentData.reportsCount || 0,
            viewsCount: commentData.viewsCount || 0,
            moderationFlags: commentData.moderationFlags || [],
            severity: commentData.severity,
            moderationScore: commentData.moderationScore || 0,
            isModerated: commentData.isModerated || false,
            moderatedAt: commentData.moderatedAt,
            moderatedBy: commentData.moderatedBy,
            metadata: commentData.metadata || {},
            createdAt: commentData.createdAt,
            updatedAt: commentData.updatedAt,
            deletedAt: commentData.deletedAt,
        }

        return Comment.fromEntity(commentEntity as any)
    }
}
