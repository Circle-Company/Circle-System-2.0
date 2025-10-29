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
                    id: commentData.id,
                    momentId: commentData.momentId,
                    userId: commentData.userId,
                    parentCommentId: commentData.parentCommentId,
                    content: commentData.content,
                    status: commentData.status,
                    visibility: commentData.visibility,
                    category: commentData.category,
                    sentiment: commentData.sentiment,
                    likesCount: commentData.likesCount,
                    repliesCount: commentData.repliesCount,
                    reportsCount: commentData.reportsCount,
                    viewsCount: commentData.viewsCount,
                    moderationFlags: commentData.moderationFlags,
                    severity: commentData.severity,
                    moderationScore: commentData.moderationScore,
                    isModerated: commentData.isModerated,
                    moderatedAt: commentData.moderatedAt,
                    moderatedBy: commentData.moderatedBy,
                    mentions: commentData.mentions,
                    hashtags: commentData.hashtags,
                    metadata: commentData.metadata,
                    createdAt: commentData.createdAt,
                    updatedAt: commentData.updatedAt,
                    deletedAt: commentData.deletedAt,
                },
                { transaction },
            )

            await transaction.commit()
            return createdComment.toEntity()
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async findById(id: string): Promise<Comment | null> {
        const comment = await this.database.getConnection().models.MomentComment.findByPk(id)

        if (!comment) return null

        return this.mapToDomainEntity(comment)
    }

    async update(comment: Comment): Promise<Comment> {
        const commentData = comment.toEntity()

        await this.database.getConnection().models.MomentComment.update(
            {
                content: commentData.content,
                status: commentData.status,
                visibility: commentData.visibility,
                category: commentData.category,
                sentiment: commentData.sentiment,
                likesCount: commentData.likesCount,
                repliesCount: commentData.repliesCount,
                reportsCount: commentData.reportsCount,
                viewsCount: commentData.viewsCount,
                moderationFlags: commentData.moderationFlags,
                severity: commentData.severity,
                moderationScore: commentData.moderationScore,
                isModerated: commentData.isModerated,
                moderatedAt: commentData.moderatedAt,
                moderatedBy: commentData.moderatedBy,
                mentions: commentData.mentions,
                hashtags: commentData.hashtags,
                metadata: commentData.metadata,
                updatedAt: commentData.updatedAt,
                deletedAt: commentData.deletedAt,
            },
            { where: { id: commentData.id } },
        )

        return comment
    }

    async delete(id: string): Promise<void> {
        await this.database.getConnection().models.MomentComment.destroy({ where: { id } })
    }

    // ===== OPERAÇÕES DE BUSCA =====

    async findByMomentId(momentId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { momentId },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByUserId(userId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { userId },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByParentCommentId(
        parentCommentId: string,
        limit = 20,
        offset = 0,
    ): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { parentCommentId },
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
                momentId,
                parentCommentId: null,
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findRepliesToComment(commentId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { parentCommentId: commentId },
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByStatus(status: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { status },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByCategory(category: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { category },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findBySentiment(sentiment: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { sentiment },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findBySeverity(severity: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.MomentComment.findAll({
            where: { severity },
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
                    [Op.gte]: 70, // Score alto indica necessidade de moderação
                },
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
                    [Op.ne]: [], // Não vazio
                },
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
                status: "hidden",
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
                deletedAt: {
                    [Op.ne]: null,
                },
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
            where: { momentId },
        })
    }

    async countByUserId(userId: string): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: { userId },
        })
    }

    async countByStatus(status: string): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: { status },
        })
    }

    async countByCategory(category: string): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: { category },
        })
    }

    async countBySentiment(sentiment: string): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: { sentiment },
        })
    }

    async countPendingModeration(): Promise<number> {
        return this.database.getConnection().models.MomentComment.count({
            where: {
                isModerated: false,
                moderationScore: {
                    [Op.gte]: 70,
                },
            },
        })
    }

    // ===== OPERAÇÕES DE EXISTÊNCIA =====

    async exists(id: string): Promise<boolean> {
        const count = await this.database.getConnection().models.MomentComment.count({
            where: { id },
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
            .models.MomentComment.destroy({ where: { id: { [Op.in]: ids } } })
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
                where.momentId = filters.momentId
            }

            if (filters.userId) {
                where.userId = filters.userId
            }

            if (filters.status) {
                where.status = filters.status
            }

            if (filters.category) {
                where.category = filters.category
            }

            if (filters.sentiment) {
                where.sentiment = filters.sentiment
            }

            if (filters.severity) {
                where.severity = filters.severity
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
            .models.MomentComment.increment({ likesCount: 1 }, { where: { id: commentId } })
    }

    async decrementLikes(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ likesCount: -1 }, { where: { id: commentId } })
    }

    async decrementReplies(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ repliesCount: -1 }, { where: { id: commentId } })
    }

    async incrementReplies(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ repliesCount: 1 }, { where: { id: commentId } })
    }

    async incrementReports(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ reportsCount: 1 }, { where: { id: commentId } })
    }

    async incrementViews(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.MomentComment.increment({ viewsCount: 1 }, { where: { id: commentId } })
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

            if (searchFields.includes("mentions")) {
                orConditions.push({
                    mentions: {
                        [Op.contains]: [options.query],
                    },
                })
            }

            if (searchFields.includes("hashtags")) {
                orConditions.push({
                    hashtags: {
                        [Op.contains]: [options.query],
                    },
                })
            }

            ;(where as any)[Op.or] = orConditions
        }

        // Aplicar filtros
        if (options.filters) {
            if (options.filters.momentId) {
                where.momentId = options.filters.momentId
            }

            if (options.filters.userId) {
                where.userId = options.filters.userId
            }

            if (options.filters.status) {
                if (Array.isArray(options.filters.status)) {
                    where.status = {
                        [Op.in]: options.filters.status,
                    }
                } else {
                    where.status = options.filters.status
                }
            }

            if (options.filters.category) {
                if (Array.isArray(options.filters.category)) {
                    where.category = {
                        [Op.in]: options.filters.category,
                    }
                } else {
                    where.category = options.filters.category
                }
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
            if (filters.momentId) where.momentId = filters.momentId
            if (filters.userId) where.userId = filters.userId
            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    where.status = { [Op.in]: filters.status }
                } else {
                    where.status = filters.status
                }
            }
            if (filters.category) {
                if (Array.isArray(filters.category)) {
                    where.category = { [Op.in]: filters.category }
                } else {
                    where.category = filters.category
                }
            }
            if (filters.sentiment) {
                if (Array.isArray(filters.sentiment)) {
                    where.sentiment = { [Op.in]: filters.sentiment }
                } else {
                    where.sentiment = filters.sentiment
                }
            }
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
        const approvedComments = comments.filter((comment: any) => comment.status === "approved").length
        const rejectedComments = comments.filter((comment: any) => comment.status === "rejected").length

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
            this.database.getConnection().models.MomentComment.count(),
            this.database.getConnection().models.MomentComment.count({ where: { status: "active" } }),
            this.database.getConnection().models.MomentComment.count({ where: { status: "hidden" } }),
            this.database.getConnection().models.MomentComment.count({
                where: { deletedAt: { [Op.ne]: null } },
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
            id: commentData.id,
            momentId: commentData.momentId,
            userId: commentData.userId,
            parentCommentId: commentData.parentCommentId,
            content: commentData.content,
            status: commentData.status,
            visibility: commentData.visibility,
            category: commentData.category,
            sentiment: commentData.sentiment,
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
            mentions: commentData.mentions || [],
            hashtags: commentData.hashtags || [],
            metadata: commentData.metadata || {},
            createdAt: commentData.createdAt,
            updatedAt: commentData.updatedAt,
            deletedAt: commentData.deletedAt,
        }

        return Comment.fromEntity(commentEntity)
    }
}
