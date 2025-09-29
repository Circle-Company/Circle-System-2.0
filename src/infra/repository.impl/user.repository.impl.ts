import {
    ActivityDistribution,
    EngagementDistribution,
    ReputationDistribution,
    UserFilters,
    UserRepositoryInterface,
    UserSearchOptions,
    UserStatistics,
    UserStatusData,
} from "@/domain/user/repositories/user.repository"
import { Op, WhereOptions } from "sequelize"

import { Level } from "@/domain/authorization"
import { User } from "@/domain/user/entities/user.entity"
import { UserMapper } from "@/domain/user/mappers/user.mapper"
import { DatabaseAdapter } from "@/infra/database/adapter"
import UserEmbeddingModel from "@/infra/models/swipe.engine/user.embedding.model"
import UserInteractionSummaryModel from "@/infra/models/swipe.engine/user.interaction.summary.model"
import UserModel from "@/infra/models/user/user.model"
import UserPreferencesModel from "@/infra/models/user/user.preferences.model"
import UserStatisticsModel from "@/infra/models/user/user.statistics.model"
import UserStatusModel from "@/infra/models/user/user.status.model"
import UserTermsModel from "@/infra/models/user/user.terms.model"

/**
 * User Repository Implementation
 *
 * Implementação completa do repositório de usuários com suporte
 * a todas as funcionalidades da entidade User otimizada
 */
export class UserRepositoryImpl implements UserRepositoryInterface {
    constructor(private readonly database: DatabaseAdapter) {}

    // ===== OPERAÇÕES BÁSICAS =====

    async create(user: User): Promise<User> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            const userData = user.toJSON()

            if (!userData.id) {
                throw new Error("ID do usuário é obrigatório")
            }

            // Criar usuário principal usando o mapper
            const userAttributes = UserMapper.toUserModelAttributes(user)
            await UserModel.create(userAttributes, { transaction })

            // Criar registros relacionados usando o mapper
            const statusAttributes = UserMapper.toUserStatusAttributes(user)
            if (statusAttributes) {
                await UserStatusModel.create(statusAttributes, { transaction })
            }

            const preferencesAttributes = UserMapper.toUserPreferencesAttributes(user)
            if (preferencesAttributes) {
                await UserPreferencesModel.create(preferencesAttributes, { transaction })
            }

            const statisticsAttributes = UserMapper.toUserStatisticsAttributes(user)
            if (statisticsAttributes) {
                await UserStatisticsModel.create(statisticsAttributes, { transaction })
            }

            const termsAttributes = UserMapper.toUserTermsAttributes(user)
            if (termsAttributes) {
                await UserTermsModel.create(termsAttributes, { transaction })
            }

            const embeddingAttributes = UserMapper.toUserEmbeddingAttributes(user)
            if (embeddingAttributes) {
                await UserEmbeddingModel.create(embeddingAttributes, { transaction })
            }

            const interactionSummaryAttributes = UserMapper.toUserInteractionSummaryAttributes(user)
            if (interactionSummaryAttributes) {
                await UserInteractionSummaryModel.create(interactionSummaryAttributes, {
                    transaction,
                })
            }

            await transaction.commit()
            return user
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async findById(id: string): Promise<User | null> {
        const user = await UserModel.findByPk(BigInt(id), {
            include: this.getIncludeOptions(),
        })

        if (!user) return null

        return UserMapper.toDomain(user as any)
    }

    async findByUsername(username: string): Promise<User | null> {
        const user = await UserModel.findOne({
            where: { username },
            include: this.getIncludeOptions(),
        })

        if (!user) return null

        return UserMapper.toDomain(user as any)
    }

    async findBySearchTerm(searchTerm: string): Promise<User[]> {
        const users = await UserModel.findAll({
            where: {
                search_match_term: {
                    [Op.like]: `%${searchTerm}%`,
                },
            },
            include: this.getIncludeOptions(),
            limit: 50,
        })

        return UserMapper.toDomainArray(users as any)
    }

    async update(user: User): Promise<User> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            const userData = user.toJSON()

            if (!userData.id) {
                throw new Error("ID do usuário é obrigatório")
            }

            // Atualizar usuário principal usando o mapper
            const userAttributes = UserMapper.toUserModelAttributes(user)
            await UserModel.update(userAttributes, {
                where: { id: BigInt(userData.id) },
                transaction,
            })

            // Atualizar registros relacionados usando o mapper
            const statusAttributes = UserMapper.toUserStatusAttributes(user)
            if (statusAttributes) {
                await UserStatusModel.upsert(statusAttributes, { transaction })
            }

            const preferencesAttributes = UserMapper.toUserPreferencesAttributes(user)
            if (preferencesAttributes) {
                await UserPreferencesModel.upsert(preferencesAttributes, { transaction })
            }

            const statisticsAttributes = UserMapper.toUserStatisticsAttributes(user)
            if (statisticsAttributes) {
                await UserStatisticsModel.upsert(statisticsAttributes, { transaction })
            }

            const termsAttributes = UserMapper.toUserTermsAttributes(user)
            if (termsAttributes) {
                await UserTermsModel.upsert(termsAttributes, { transaction })
            }

            const embeddingAttributes = UserMapper.toUserEmbeddingAttributes(user)
            if (embeddingAttributes) {
                await UserEmbeddingModel.upsert(embeddingAttributes, { transaction })
            }

            const interactionSummaryAttributes = UserMapper.toUserInteractionSummaryAttributes(user)
            if (interactionSummaryAttributes) {
                await UserInteractionSummaryModel.upsert(interactionSummaryAttributes, {
                    transaction,
                })
            }

            await transaction.commit()
            return user
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async delete(id: string): Promise<void> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            // Soft delete - marcar como deletado no status
            await UserStatusModel.update(
                {
                    deleted: true,
                },
                {
                    where: { user_id: BigInt(id) },
                    transaction,
                },
            )

            await transaction.commit()
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async exists(id: string): Promise<boolean> {
        const count = await UserModel.count({
            where: { id: BigInt(id) },
        })
        return count > 0
    }

    async existsByUsername(username: string): Promise<boolean> {
        const count = await UserModel.count({
            where: { username },
        })
        return count > 0
    }

    // ===== OPERAÇÕES DE BUSCA AVANÇADA =====

    async findAll(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findActiveUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        deleted: false,
                        blocked: false,
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUsersByStatus(status: Level, options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        access_level: status,
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findVerifiedUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        verified: true,
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUnverifiedUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        verified: false,
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findBlockedUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        blocked: true,
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findDeletedUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        deleted: true,
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    // ===== OPERAÇÕES DE ANÁLISE DE COMPORTAMENTO =====

    async findUsersByActivityLevel(
        level: "low" | "medium" | "high",
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar por nível de atividade usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => {
            const activityStats = user.getActivityStats()
            return activityStats.activityLevel === level
        })
    }

    async findUsersByReputationScore(
        minScore: number,
        maxScore?: number,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar por score de reputação usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => {
            const score = user.getReputationScore()
            if (maxScore !== undefined) {
                return score >= minScore && score <= maxScore
            }
            return score >= minScore
        })
    }

    async findUsersByCreationDate(
        startDate: Date,
        endDate?: Date,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const whereClause: WhereOptions = {
            createdAt: {
                [Op.gte]: startDate,
            },
        }

        if (endDate) {
            whereClause.createdAt = {
                [Op.between]: [startDate, endDate],
            }
        }

        const users = await UserModel.findAll({
            ...queryOptions,
            where: whereClause,
            include: this.getIncludeOptions(),
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findNewUsers(daysThreshold: number = 7, options?: UserSearchOptions): Promise<User[]> {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysThreshold)

        return this.findUsersByCreationDate(startDate, undefined, options)
    }

    async findInactiveUsers(
        daysThreshold: number = 30,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários inativos usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

        return domainUsers.filter((user) => {
            // Usar a data de atualização como proxy para última atividade
            const lastActive = user.updatedAt
            return !lastActive || lastActive < thresholdDate
        })
    }

    // ===== OPERAÇÕES DE MÉTRICAS =====

    async findUsersByEngagementRate(
        minRate: number,
        maxRate?: number,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    where: {
                        engagement_rate: maxRate
                            ? { [Op.between]: [minRate, maxRate] }
                            : { [Op.gte]: minRate },
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUsersByFollowersCount(
        minFollowers: number,
        maxFollowers?: number,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    where: {
                        total_followers: maxFollowers
                            ? { [Op.between]: [minFollowers, maxFollowers] }
                            : { [Op.gte]: minFollowers },
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUsersByContentCount(
        minContent: number,
        maxContent?: number,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    where: {
                        total_moments_created: maxContent
                            ? { [Op.between]: [minContent, maxContent] }
                            : { [Op.gte]: minContent },
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findTopPerformers(limit: number = 10, options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions({ ...options, limit })

        const users = await UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
            order: [
                [{ model: UserStatisticsModel, as: "statistics" }, "engagement_rate", "DESC"],
                [{ model: UserStatisticsModel, as: "statistics" }, "total_followers", "DESC"],
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findInfluencers(
        minFollowers: number = 1000,
        minEngagementRate: number = 0.05,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    where: {
                        total_followers: { [Op.gte]: minFollowers },
                        engagement_rate: { [Op.gte]: minEngagementRate },
                    },
                    required: true,
                },
            ],
            order: [[{ model: UserStatisticsModel, as: "statistics" }, "total_followers", "DESC"]],
        })

        return UserMapper.toDomainArray(users as any)
    }

    // ===== OPERAÇÕES DE EMBEDDINGS =====

    async findUsersWithEmbeddings(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserEmbeddingModel,
                    as: "user_embedding",
                    where: {
                        embedding_vector: { [Op.ne]: null },
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUsersWithoutEmbeddings(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserEmbeddingModel,
                    as: "user_embedding",
                    where: {
                        embedding_vector: { [Op.is]: null },
                    },
                    required: false,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUsersByPreferredHashtags(
        hashtags: string[],
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserEmbeddingModel,
                    as: "user_embedding",
                    where: {
                        preferred_hashtags: {
                            [Op.overlap]: hashtags,
                        },
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    // ===== OPERAÇÕES DE MODERAÇÃO =====

    async findUsersWithModerationIssues(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    where: {
                        [Op.or]: [
                            { violations_count: { [Op.gt]: 0 } },
                            { reports_received: { [Op.gt]: 0 } },
                        ],
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUsersByViolationsCount(
        minViolations: number,
        maxViolations?: number,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    where: {
                        violations_count: maxViolations
                            ? { [Op.between]: [minViolations, maxViolations] }
                            : { [Op.gte]: minViolations },
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUsersByReportsCount(
        minReports: number,
        maxReports?: number,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    where: {
                        reports_received: maxReports
                            ? { [Op.between]: [minReports, maxReports] }
                            : { [Op.gte]: minReports },
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    // ===== OPERAÇÕES DE PAGINAÇÃO E CONTAGEM =====

    async countUsers(filters?: UserFilters): Promise<number> {
        const whereClause = this.buildWhereClause(filters)

        return await UserModel.count({
            where: whereClause,
            include: this.getIncludeOptions(),
            distinct: true,
        })
    }

    async countActiveUsers(): Promise<number> {
        return await UserModel.count({
            include: [
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        deleted: false,
                        blocked: false,
                    },
                    required: true,
                },
            ],
            distinct: true,
        })
    }

    async countVerifiedUsers(): Promise<number> {
        return await UserModel.count({
            include: [
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        verified: true,
                    },
                    required: true,
                },
            ],
            distinct: true,
        })
    }

    async countUsersByStatus(status: Level): Promise<number> {
        return await UserModel.count({
            include: [
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        access_level: status,
                    },
                    required: true,
                },
            ],
            distinct: true,
        })
    }

    async countUsersByActivityLevel(level: "low" | "medium" | "high"): Promise<number> {
        // Esta implementação seria mais complexa, envolvendo cálculos de métricas
        // Por agora, retornamos um valor padrão
        return await UserModel.count({
            include: this.getIncludeOptions(),
            distinct: true,
        })
    }

    // ===== OPERAÇÕES DE ESTATÍSTICAS =====

    async getUsersStatistics(): Promise<UserStatistics> {
        const [totalUsers, activeUsers, verifiedUsers, blockedUsers, deletedUsers, mutedUsers] =
            await Promise.all([
                this.countUsers(),
                this.countActiveUsers(),
                this.countVerifiedUsers(),
                this.countUsers({ blocked: true }),
                this.countUsers({ deleted: true }),
                this.countUsers({ muted: true }),
            ])

        const now = new Date()
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const [newUsersLast7Days, newUsersLast30Days] = await Promise.all([
            this.countUsers({ createdAfter: last7Days }),
            this.countUsers({ createdAfter: last30Days }),
        ])

        // Implementar outras estatísticas conforme necessário
        return {
            totalUsers,
            activeUsers,
            verifiedUsers,
            blockedUsers,
            deletedUsers,
            mutedUsers,
            newUsersLast7Days,
            newUsersLast30Days,
            inactiveUsersLast30Days: 0, // Implementar conforme necessário
            usersWithEmbeddings: 0, // Implementar conforme necessário
            usersWithModerationIssues: 0, // Implementar conforme necessário
            averageReputationScore: 0, // Implementar conforme necessário
            averageEngagementRate: 0, // Implementar conforme necessário
            averageFollowers: 0, // Implementar conforme necessário
            topPerformers: 0, // Implementar conforme necessário
            influencers: 0, // Implementar conforme necessário
        }
    }

    async getActivityDistribution(): Promise<ActivityDistribution> {
        // Implementar distribuição de atividade
        return {
            low: 0,
            medium: 0,
            high: 0,
        }
    }

    async getReputationDistribution(): Promise<ReputationDistribution> {
        // Implementar distribuição de reputação
        return {
            excellent: 0,
            good: 0,
            average: 0,
            poor: 0,
            veryPoor: 0,
        }
    }

    async getEngagementDistribution(): Promise<EngagementDistribution> {
        // Implementar distribuição de engajamento
        return {
            veryHigh: 0,
            high: 0,
            medium: 0,
            low: 0,
            veryLow: 0,
        }
    }

    // ===== OPERAÇÕES EM LOTE =====

    async createMany(users: User[]): Promise<User[]> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            const createdUsers: User[] = []

            for (const user of users) {
                const userData = user.toJSON()

                if (!userData.id) {
                    throw new Error("ID do usuário é obrigatório")
                }

                // Criar usuário principal
                const userAttributes = UserMapper.toUserModelAttributes(user)
                await UserModel.create(userAttributes, { transaction })

                // Criar registros relacionados
                const statusAttributes = UserMapper.toUserStatusAttributes(user)
                if (statusAttributes) {
                    await UserStatusModel.create(statusAttributes, { transaction })
                }

                const preferencesAttributes = UserMapper.toUserPreferencesAttributes(user)
                if (preferencesAttributes) {
                    await UserPreferencesModel.create(preferencesAttributes, { transaction })
                }

                const statisticsAttributes = UserMapper.toUserStatisticsAttributes(user)
                if (statisticsAttributes) {
                    await UserStatisticsModel.create(statisticsAttributes, { transaction })
                }

                const termsAttributes = UserMapper.toUserTermsAttributes(user)
                if (termsAttributes) {
                    await UserTermsModel.create(termsAttributes, { transaction })
                }

                const embeddingAttributes = UserMapper.toUserEmbeddingAttributes(user)
                if (embeddingAttributes) {
                    await UserEmbeddingModel.create(embeddingAttributes, { transaction })
                }

                const interactionSummaryAttributes =
                    UserMapper.toUserInteractionSummaryAttributes(user)
                if (interactionSummaryAttributes) {
                    await UserInteractionSummaryModel.create(interactionSummaryAttributes, {
                        transaction,
                    })
                }

                createdUsers.push(user)
            }

            await transaction.commit()
            return createdUsers
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async updateMany(users: User[]): Promise<User[]> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            const updatedUsers: User[] = []

            for (const user of users) {
                const userData = user.toJSON()

                if (!userData.id) {
                    throw new Error("ID do usuário é obrigatório")
                }

                // Atualizar usuário principal
                const userAttributes = UserMapper.toUserModelAttributes(user)
                await UserModel.update(userAttributes, {
                    where: { id: BigInt(userData.id) },
                    transaction,
                })

                // Atualizar registros relacionados
                const statusAttributes = UserMapper.toUserStatusAttributes(user)
                if (statusAttributes) {
                    await UserStatusModel.upsert(statusAttributes, { transaction })
                }

                const preferencesAttributes = UserMapper.toUserPreferencesAttributes(user)
                if (preferencesAttributes) {
                    await UserPreferencesModel.upsert(preferencesAttributes, { transaction })
                }

                const statisticsAttributes = UserMapper.toUserStatisticsAttributes(user)
                if (statisticsAttributes) {
                    await UserStatisticsModel.upsert(statisticsAttributes, { transaction })
                }

                const termsAttributes = UserMapper.toUserTermsAttributes(user)
                if (termsAttributes) {
                    await UserTermsModel.upsert(termsAttributes, { transaction })
                }

                const embeddingAttributes = UserMapper.toUserEmbeddingAttributes(user)
                if (embeddingAttributes) {
                    await UserEmbeddingModel.upsert(embeddingAttributes, { transaction })
                }

                const interactionSummaryAttributes =
                    UserMapper.toUserInteractionSummaryAttributes(user)
                if (interactionSummaryAttributes) {
                    await UserInteractionSummaryModel.upsert(interactionSummaryAttributes, {
                        transaction,
                    })
                }

                updatedUsers.push(user)
            }

            await transaction.commit()
            return updatedUsers
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async deleteMany(ids: string[]): Promise<void> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            await UserStatusModel.update(
                {
                    deleted: true,
                },
                {
                    where: {
                        user_id: {
                            [Op.in]: ids.map((id) => BigInt(id)),
                        },
                    },
                    transaction,
                },
            )

            await transaction.commit()
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async bulkUpdateStatus(ids: string[], status: Partial<UserStatusData>): Promise<void> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            await UserStatusModel.update(status, {
                where: {
                    user_id: {
                        [Op.in]: ids.map((id) => BigInt(id)),
                    },
                },
                transaction,
            })

            await transaction.commit()
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    // ===== MÉTODOS AUXILIARES PRIVADOS =====

    private getIncludeOptions() {
        return [
            {
                model: UserStatusModel,
                as: "user_status",
                required: false,
            },
            {
                model: UserPreferencesModel,
                as: "preferences",
                required: false,
            },
            {
                model: UserStatisticsModel,
                as: "statistics",
                required: false,
            },
            {
                model: UserTermsModel,
                as: "user_terms",
                required: false,
            },
            {
                model: UserEmbeddingModel,
                as: "user_embedding",
                required: false,
            },
            {
                model: UserInteractionSummaryModel,
                as: "user_interaction_summary",
                required: false,
            },
        ]
    }

    private buildQueryOptions(options?: UserSearchOptions) {
        const queryOptions: any = {
            limit: options?.limit || 50,
            offset: options?.offset || 0,
        }

        if (options?.orderBy) {
            const orderField =
                options.orderBy.field === "reputationScore"
                    ? [{ model: UserStatisticsModel, as: "statistics" }, "engagement_rate"]
                    : options.orderBy.field === "engagementRate"
                    ? [{ model: UserStatisticsModel, as: "statistics" }, "engagement_rate"]
                    : options.orderBy.field === "totalFollowers"
                    ? [{ model: UserStatisticsModel, as: "statistics" }, "total_followers"]
                    : [options.orderBy.field]

            queryOptions.order = [[...orderField, options.orderBy.direction]]
        } else {
            queryOptions.order = [["createdAt", "DESC"]]
        }

        if (options?.filters) {
            queryOptions.where = this.buildWhereClause(options.filters)
        }

        return queryOptions
    }

    private buildWhereClause(filters?: UserFilters): WhereOptions {
        const whereClause: WhereOptions = {}

        if (!filters) return whereClause

        // Filtros básicos
        if (filters.username) {
            whereClause.username = { [Op.like]: `%${filters.username}%` }
        }

        if (filters.name) {
            whereClause.name = { [Op.like]: `%${filters.name}%` }
        }

        if (filters.description) {
            whereClause.description = { [Op.like]: `%${filters.description}%` }
        }

        // Filtros temporais
        if (filters.createdAfter || filters.createdBefore) {
            whereClause.createdAt = {}
            if (filters.createdAfter) {
                whereClause.createdAt[Op.gte] = filters.createdAfter
            }
            if (filters.createdBefore) {
                whereClause.createdAt[Op.lte] = filters.createdBefore
            }
        }

        if (filters.updatedAfter || filters.updatedBefore) {
            whereClause.updatedAt = {}
            if (filters.updatedAfter) {
                whereClause.updatedAt[Op.gte] = filters.updatedAfter
            }
            if (filters.updatedBefore) {
                whereClause.updatedAt[Op.lte] = filters.updatedBefore
            }
        }

        return whereClause
    }
}
