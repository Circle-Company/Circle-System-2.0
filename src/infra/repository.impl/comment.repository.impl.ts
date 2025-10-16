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
        const transaction = await this.database.getConnection().models.sequelize.transaction()

        try {
            const commentData = comment.toEntity()

            const createdComment = await this.database.getConnection().models.Comment.create(
                {
                    id: commentData.id,
                    momentId: commentData.momentId,
                    authorId: commentData.authorId,
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
            return comment
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async findById(id: string): Promise<Comment | null> {
        const comment = await this.database.getConnection().models.Comment.findByPk(id)

        if (!comment) return null

        return this.mapToDomainEntity(comment)
    }

    async update(comment: Comment): Promise<Comment> {
        const commentData = comment.toEntity()

        await this.database.getConnection().models.Comment.update(
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
        await this.database.getConnection().models.Comment.destroy({ where: { id } })
    }

    // ===== OPERAÇÕES DE BUSCA =====

    async findByMomentId(momentId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.Comment.findAll({
            where: { momentId },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByAuthorId(authorId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.Comment.findAll({
            where: { authorId },
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
        const comments = await this.database.getConnection().models.Comment.findAll({
            where: { parentCommentId },
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    // ===== OPERAÇÕES DE BUSCA AVANÇADA =====

    async findTopLevelComments(momentId: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.Comment.findAll({
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
        const comments = await this.database.getConnection().models.Comment.findAll({
            where: { parentCommentId: commentId },
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByStatus(status: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.Comment.findAll({
            where: { status },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findByCategory(category: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.Comment.findAll({
            where: { category },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findBySentiment(sentiment: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.Comment.findAll({
            where: { sentiment },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    async findBySeverity(severity: string, limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.Comment.findAll({
            where: { severity },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    // ===== OPERAÇÕES DE MODERAÇÃO =====

    async findPendingModeration(limit = 20, offset = 0): Promise<Comment[]> {
        const comments = await this.database.getConnection().models.Comment.findAll({
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
        const comments = await this.database.getConnection().models.Comment.findAll({
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
        const comments = await this.database.getConnection().models.Comment.findAll({
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
        const comments = await this.database.getConnection().models.Comment.findAll({
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
        const comments = await this.database.getConnection().models.Comment.findAll({
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
        const comments = await this.database.getConnection().models.Comment.findAll({
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
        const comments = await this.database.getConnection().models.Comment.findAll({
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
        return this.database.getConnection().models.Comment.count({
            where: { momentId },
        })
    }

    async countByAuthorId(authorId: string): Promise<number> {
        return this.database.getConnection().models.Comment.count({
            where: { authorId },
        })
    }

    async countByStatus(status: string): Promise<number> {
        return this.database.getConnection().models.Comment.count({
            where: { status },
        })
    }

    async countByCategory(category: string): Promise<number> {
        return this.database.getConnection().models.Comment.count({
            where: { category },
        })
    }

    async countBySentiment(sentiment: string): Promise<number> {
        return this.database.getConnection().models.Comment.count({
            where: { sentiment },
        })
    }

    async countPendingModeration(): Promise<number> {
        return this.database.getConnection().models.Comment.count({
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
        const count = await this.database.getConnection().models.Comment.count({
            where: { id },
        })
        return count > 0
    }

    async existsByMomentId(momentId: string): Promise<boolean> {
        const count = await this.countByMomentId(momentId)
        return count > 0
    }

    async existsByAuthorId(authorId: string): Promise<boolean> {
        const count = await this.countByAuthorId(authorId)
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
            .models.Comment.destroy({ where: { id: { [Op.in]: ids } } })
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

            if (filters.authorId) {
                where.authorId = filters.authorId
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

        const { count, rows } = await this.database.getConnection().models.Comment.findAndCountAll({
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

    // ===== OPERAÇÕES DE BUSCA =====

    async search(options: CommentSearchOptions): Promise<Comment[]> {
        const where: WhereOptions = {}
        const order: any[] = []

        // Aplicar filtros de busca
        if (options.momentId) {
            where.momentId = options.momentId
        }

        if (options.authorId) {
            where.authorId = options.authorId
        }

        if (options.status) {
            where.status = options.status
        }

        if (options.category) {
            where.category = options.category
        }

        if (options.sentiment) {
            where.sentiment = options.sentiment
        }

        if (options.content) {
            where.content = {
                [Op.iLike]: `%${options.content}%`,
            }
        }

        if (options.hashtags && options.hashtags.length > 0) {
            where.hashtags = {
                [Op.overlap]: options.hashtags,
            }
        }

        if (options.mentions && options.mentions.length > 0) {
            where.mentions = {
                [Op.overlap]: options.mentions,
            }
        }

        if (options.dateFrom) {
            where.createdAt = {
                [Op.gte]: options.dateFrom,
            }
        }

        if (options.dateTo) {
            where.createdAt = {
                ...(where.createdAt as any),
                [Op.lte]: options.dateTo,
            }
        }

        // Aplicar ordenação
        if (options.sortBy) {
            order.push([options.sortBy, options.sortDirection || "DESC"])
        } else {
            order.push(["createdAt", "DESC"])
        }

        const comments = await this.database.getConnection().models.Comment.findAll({
            where,
            order,
            limit: options.limit || 20,
            offset: options.offset || 0,
        })

        return comments.map((comment: any) => this.mapToDomainEntity(comment))
    }

    // ===== ANÁLISE E ESTATÍSTICAS =====

    async getAnalytics(filters?: CommentFilters): Promise<CommentAnalytics> {
        const where: WhereOptions = {}

        // Aplicar filtros se fornecidos
        if (filters) {
            if (filters.momentId) where.momentId = filters.momentId
            if (filters.authorId) where.authorId = filters.authorId
            if (filters.status) where.status = filters.status
            if (filters.category) where.category = filters.category
            if (filters.sentiment) where.sentiment = filters.sentiment
        }

        // Buscar estatísticas básicas
        const totalComments = await this.database.getConnection().models.Comment.count({ where })

        const statusDistribution = await this.database.getConnection().models.Comment.findAll({
            attributes: [
                "status",
                [this.database.getConnection().models.sequelize.fn("count", "*"), "count"],
            ],
            where,
            group: ["status"],
            raw: true,
        })

        const categoryDistribution = await this.database.getConnection().models.Comment.findAll({
            attributes: [
                "category",
                [this.database.getConnection().models.sequelize.fn("count", "*"), "count"],
            ],
            where,
            group: ["category"],
            raw: true,
        })

        const sentimentDistribution = await this.database.getConnection().models.Comment.findAll({
            attributes: [
                "sentiment",
                [this.database.getConnection().models.sequelize.fn("count", "*"), "count"],
            ],
            where,
            group: ["sentiment"],
            raw: true,
        })

        // Buscar top comentaristas
        const topCommenters = await this.database.getConnection().models.Comment.findAll({
            attributes: [
                "authorId",
                [this.database.getConnection().models.sequelize.fn("count", "*"), "count"],
            ],
            where,
            group: ["authorId"],
            order: [[this.database.getConnection().models.sequelize.fn("count", "*"), "DESC"]],
            limit: 10,
            raw: true,
        })

        return {
            totalComments,
            statusDistribution: statusDistribution.map((item: any) => ({
                status: item.status,
                count: parseInt(item.count),
            })),
            categoryDistribution: categoryDistribution.map((item: any) => ({
                category: item.category,
                count: parseInt(item.count),
            })),
            sentimentDistribution: sentimentDistribution.map((item: any) => ({
                sentiment: item.sentiment,
                count: parseInt(item.count),
            })),
            topCommenters: topCommenters.map((item: any) => ({
                authorId: item.authorId,
                count: parseInt(item.count),
            })),
        }
    }

    // ===== OPERAÇÕES DE INTERAÇÃO =====

    async incrementLikes(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.Comment.increment({ likesCount: 1 }, { where: { id: commentId } })
    }

    async decrementLikes(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.Comment.increment({ likesCount: -1 }, { where: { id: commentId } })
    }

    async decrementReplies(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.Comment.increment({ repliesCount: -1 }, { where: { id: commentId } })
    }

    async incrementReplies(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.Comment.increment({ repliesCount: 1 }, { where: { id: commentId } })
    }

    async incrementReports(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.Comment.increment({ reportsCount: 1 }, { where: { id: commentId } })
    }

    async incrementViews(commentId: string): Promise<void> {
        await this.database
            .getConnection()
            .models.Comment.increment({ viewsCount: 1 }, { where: { id: commentId } })
    }

    // ===== MÉTODOS AUXILIARES =====

    private mapToDomainEntity(commentData: any): Comment {
        const commentEntity = {
            id: commentData.id,
            momentId: commentData.momentId,
            authorId: commentData.authorId,
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
