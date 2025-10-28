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
import { UserMapper } from "@/domain/user/user.mapper"
import { DatabaseAdapter } from "@/infra/database/adapter"
import UserInteractionSummaryModel from "@/infra/models/swipe.engine/user.interaction.summary.model"
import UserEmbeddingModel from "@/infra/models/user/user.embedding.model"
import UserMetricsModel from "@/infra/models/user/user.metrics.model"
import UserModel from "@/infra/models/user/user.model"
import UserPreferencesModel from "@/infra/models/user/user.preferences.model"
import UserStatusModel from "@/infra/models/user/user.status.model"
import UserTermModel from "@/infra/models/user/user.terms.model"

/**
 * User Repository Implementation
 *
 * Implementação completa do repositório de usuários com suporte
 * a todas as funcionalidades da entidade User otimizada
 */
export class UserRepositoryImpl implements UserRepositoryInterface {
    constructor(private readonly database: DatabaseAdapter) {}

    /**
     * Obtém o UserModel do database adapter
     */
    private get UserModel() {
        return this.database.getConnection().models.User
    }

    /**
     * Obtém os models do database adapter
     */
    private get models() {
        return this.database.getConnection().models
    }

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
            await this.models.User.create(userAttributes as any, { transaction })

            // Criar registros relacionados usando o mapper
            const statusAttributes = UserMapper.toUserStatusAttributes(user)
            if (statusAttributes) {
                await this.models.UserStatus.create(statusAttributes as any, { transaction })
            }

            const preferencesAttributes = UserMapper.toUserPreferencesAttributes(user)
            if (preferencesAttributes) {
                await this.models.UserPreferences.create(preferencesAttributes as any, {
                    transaction,
                })
            }

            const statisticsAttributes = UserMapper.toUserStatisticsAttributes(user)
            if (statisticsAttributes) {
                await this.models.UserMetrics.create(statisticsAttributes as any, {
                    transaction,
                })
            }

            const termsAttributes = UserMapper.toUserTermAttributes(user)
            if (termsAttributes) {
                await this.models.UserTerm.create(termsAttributes as any, { transaction })
            }

            const embeddingAttributes = UserMapper.toUserEmbeddingAttributes(user)
            if (embeddingAttributes) {
                await this.models.UserEmbedding.create(embeddingAttributes as any, {
                    transaction,
                })
            }

            const interactionSummaryAttributes = UserMapper.toUserInteractionSummaryAttributes(user)
            if (interactionSummaryAttributes) {
                await this.models.UserInteractionSummary.create(
                    interactionSummaryAttributes as any,
                    {
                        transaction,
                    },
                )
            }

            await transaction.commit()
            return user
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.UserModel.findByPk(BigInt(id), {
            include: this.getIncludeOptions(),
        })

        if (!user) return null

        return UserMapper.toDomain(user as any)
    }

    async findByUsername(username: string): Promise<User | null> {
        // Otimizado: carregar apenas relacionamentos essenciais para autenticação
        const user = await this.UserModel.findOne({
            where: { username },
            include: [
                {
                    model: this.models.UserStatus,
                    as: "status",
                    required: false,
                },
                {
                    model: this.models.UserPreferences,
                    as: "preferences",
                    required: false,
                },
                // Não carregar statistics, embeddings e interaction_summary no login
                // para reduzir carga de memória
            ],
        })

        if (!user) return null

        return UserMapper.toDomain(user as any)
    }

    async findBySearchTerm(searchTerm: string): Promise<User[]> {
        const users = await this.UserModel.findAll({
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
        let committed = false

        try {
            const userData = user.toJSON()

            if (!userData.id) {
                throw new Error("ID do usuário é obrigatório")
            }

            // Atualizar apenas o usuário principal
            const userAttributes = UserMapper.toUserModelAttributes(user)
            await this.UserModel.update(userAttributes, {
                where: { id: BigInt(userData.id) },
                transaction,
            })

            // Apenas fazer upsert se os dados realmente mudaram
            // Isso reduz drasticamente operações no banco durante signin
            const statusAttributes = UserMapper.toUserStatusAttributes(user)
            if (statusAttributes && this.hasStatusChanges(statusAttributes)) {
                await this.models.UserStatus.upsert(statusAttributes as any, { transaction })
            }

            await transaction.commit()
            committed = true
            return user
        } catch (error) {
            if (!committed) {
                await transaction.rollback()
            }
            throw error
        }
    }

    /**
     * Verifica se há mudanças reais no status
     * Evita upserts desnecessários que consomem memória
     */
    private hasStatusChanges(attributes: any): boolean {
        // Verificar apenas campos que realmente mudam no login
        return Boolean(
            attributes.last_login_at ||
                attributes.last_login_ip ||
                attributes.last_login_device ||
                attributes.last_login_user_agent,
        )
    }

    async delete(id: string): Promise<void> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            // Soft delete - marcar como deletado no status
            await this.models.UserStatus.update(
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
        const count = await this.UserModel.count({
            where: { id: BigInt(id) },
        })
        return count > 0
    }

    async existsByUsername(username: string): Promise<boolean> {
        const count = await this.UserModel.count({
            where: { username },
        })
        return count > 0
    }

    // ===== OPERAÇÕES DE BUSCA AVANÇADA =====

    async findAll(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findActiveUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: this.models.UserStatus,
                    as: "status",
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: this.models.UserStatus,
                    as: "status",
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: this.models.UserStatus,
                    as: "status",
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: this.models.UserStatus,
                    as: "status",
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: this.models.UserStatus,
                    as: "status",
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: this.models.UserStatus,
                    as: "status",
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

        const users = await this.UserModel.findAll({
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

    // ===== OPERAÇÕES DE PERMISSÃO E STATUS =====

    async findUsersWhoCanCreateMoments(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários que podem criar momentos usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => user.canCreateMoments())
    }

    async findUsersWhoCanInteractWithMoments(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários que podem interagir com momentos usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => user.canInteractWithMoments())
    }

    async findUsersWhoCanViewMoments(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários que podem ver momentos usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => user.canViewMoments())
    }

    async findUsersWithAdminAccess(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: this.models.UserStatus,
                    as: "status",
                    where: {
                        access_level: {
                            [Op.in]: [Level.ADMIN, Level.SUDO],
                        },
                    },
                    required: true,
                },
            ],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUsersWhoCanMentionUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários que podem mencionar outros usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => user.canMentionUsers())
    }

    async findUsersWhoCanBeMentioned(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários que podem ser mencionados usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => user.canBeMentioned())
    }

    async findUsersByReputationLevel(
        level: "novice" | "rising" | "established" | "influencer" | "celebrity",
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários por nível de reputação usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => {
            const reputationDetails = user.getReputationDetails()
            return reputationDetails.level === level
        })
    }

    // ===== OPERAÇÕES DE MÉTRICAS AVANÇADAS =====

    async findUsersByEngagementMetrics(
        criteria: {
            minLikesReceived?: number
            minViewsReceived?: number
            minCommentsReceived?: number
            minSharesReceived?: number
            minEngagementRate?: number
            minReachRate?: number
        },
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários por métricas de engajamento usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => {
            const engagementMetrics = user.getEngagementMetrics()

            if (
                criteria.minLikesReceived &&
                engagementMetrics.totalLikesReceived < criteria.minLikesReceived
            ) {
                return false
            }
            if (
                criteria.minViewsReceived &&
                engagementMetrics.totalViewsReceived < criteria.minViewsReceived
            ) {
                return false
            }
            if (
                criteria.minCommentsReceived &&
                engagementMetrics.totalCommentsReceived < criteria.minCommentsReceived
            ) {
                return false
            }
            if (
                criteria.minSharesReceived &&
                engagementMetrics.totalSharesReceived < criteria.minSharesReceived
            ) {
                return false
            }
            if (
                criteria.minEngagementRate &&
                engagementMetrics.engagementRate < criteria.minEngagementRate
            ) {
                return false
            }
            if (criteria.minReachRate && engagementMetrics.reachRate < criteria.minReachRate) {
                return false
            }

            return true
        })
    }

    async findInfluencersByCriteria(
        criteria: {
            minFollowers?: number
            minEngagementRate?: number
            minReputationScore?: number
        },
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar influenciadores usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => {
            const isInfluencer = user.isInfluencer(
                criteria.minFollowers || 1000,
                criteria.minEngagementRate || 0.05,
            )

            if (!isInfluencer) return false

            if (criteria.minReputationScore) {
                const reputationScore = user.getReputationScore()
                return reputationScore >= criteria.minReputationScore
            }

            return true
        })
    }

    async findUsersByReputationScore(
        minScore: number,
        maxScore?: number,
        options?: UserSearchOptions,
    ): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
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
            created_at: {
                [Op.gte]: startDate,
            },
        }

        if (endDate) {
            whereClause.created_at = {
                [Op.between]: [startDate, endDate],
            }
        }

        const users = await this.UserModel.findAll({
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

        const users = await this.UserModel.findAll({
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserMetricsModel,
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserMetricsModel,
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserMetricsModel,
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
            order: [
                [{ model: UserMetricsModel, as: "statistics" }, "engagement_rate", "DESC"],
                [{ model: UserMetricsModel, as: "statistics" }, "total_followers", "DESC"],
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserMetricsModel,
                    as: "statistics",
                    where: {
                        total_followers: { [Op.gte]: minFollowers },
                        engagement_rate: { [Op.gte]: minEngagementRate },
                    },
                    required: true,
                },
            ],
            order: [[{ model: UserMetricsModel, as: "statistics" }, "total_followers", "DESC"]],
        })

        return UserMapper.toDomainArray(users as any)
    }

    // ===== OPERAÇÕES DE EMBEDDINGS =====

    async findUsersWithEmbeddings(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserEmbeddingModel,
                    as: "embedding",
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserEmbeddingModel,
                    as: "embedding",
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserEmbeddingModel,
                    as: "embedding",
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserMetricsModel,
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserMetricsModel,
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

        const users = await this.UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserMetricsModel,
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
                    model: this.models.UserStatus,
                    as: "status",
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
                    model: this.models.UserStatus,
                    as: "status",
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
                    model: this.models.UserStatus,
                    as: "status",
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
                    await UserMetricsModel.create(statisticsAttributes, { transaction })
                }

                const termsAttributes = UserMapper.toUserTermAttributes(user)
                if (termsAttributes) {
                    await UserTermModel.create(termsAttributes, { transaction })
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
                await this.UserModel.update(userAttributes, {
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
                    await UserMetricsModel.upsert(statisticsAttributes, { transaction })
                }

                const termsAttributes = UserMapper.toUserTermAttributes(user)
                if (termsAttributes) {
                    await UserTermModel.upsert(termsAttributes, { transaction })
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
            await this.models.UserStatus.update(
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
            await this.models.UserStatus.update(status, {
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
                model: this.models.UserStatus,
                as: "status",
                required: false,
            },
            {
                model: this.models.UserPreferences,
                as: "preferences",
                required: false,
            },
            {
                model: this.models.UserMetrics,
                as: "statistics",
                required: false,
            },
            // Removendo UserTermModel temporariamente para debug
            // {
            //     model: this.models.UserTermModel,
            //     as: "terms",
            //     required: false,
            // },
            {
                model: this.models.UserEmbedding,
                as: "embedding",
                required: false,
            },
            {
                model: this.models.UserInteractionSummary,
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
                    ? [{ model: this.models.UserStatistics, as: "statistics" }, "engagement_rate"]
                    : options.orderBy.field === "engagementRate"
                    ? [{ model: this.models.UserStatistics, as: "statistics" }, "engagement_rate"]
                    : options.orderBy.field === "totalFollowers"
                    ? [{ model: this.models.UserStatistics, as: "statistics" }, "total_followers"]
                    : [options.orderBy.field]

            queryOptions.order = [[...orderField, options.orderBy.direction]]
        } else {
            queryOptions.order = [["created_at", "DESC"]]
        }

        if (options?.filters) {
            queryOptions.where = this.buildWhereClause(options.filters)
        }

        return queryOptions
    }

    async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
        try {
            const UserBlockModel = this.models.UserBlock
            const block = await UserBlockModel.findOne({
                where: {
                    blockerId: BigInt(userId),
                    blockedId: BigInt(targetUserId),
                },
            })
            return !!block
        } catch (error) {
            console.error("Erro ao verificar se usuário está bloqueado:", error)
            return false
        }
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
            whereClause.created_at = {}
            if (filters.createdAfter) {
                whereClause.created_at[Op.gte] = filters.createdAfter
            }
            if (filters.createdBefore) {
                whereClause.created_at[Op.lte] = filters.createdBefore
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
