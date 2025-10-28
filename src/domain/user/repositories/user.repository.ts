import { Op, WhereOptions } from "sequelize"

import { Level } from "@/domain/authorization"
import { User } from "@/domain/user/entities/user.entity"
import { DatabaseAdapter } from "@/infra/database/adapter"
import UserInteractionSummaryModel from "@/infra/models/swipe.engine/user.interaction.summary.model"
import UserBlockModel from "@/infra/models/user/user.block.model"
import UserEmbeddingModel from "@/infra/models/user/user.embedding.model"
import UserFollowModel from "@/infra/models/user/user.follow.model"
import UserMetricsModel from "@/infra/models/user/user.metrics.model"
import UserModel from "@/infra/models/user/user.model"
import UserPreferencesModel from "@/infra/models/user/user.preferences.model"
import UserStatusModel from "@/infra/models/user/user.status.model"
import UserTermModel from "@/infra/models/user/user.terms.model"
import { generateId } from "@/shared"
import { UserMapper } from "../user.mapper"

/**
 * IUserRepository - Interface simplificada para operações básicas de usuário
 *
 * Interface focada nas operações essenciais para os casos de uso,
 * seguindo os princípios da Clean Architecture
 */
export interface IUserRepository {
    // ===== OPERAÇÕES BÁSICAS =====
    save(user: User): Promise<User>
    findById(id: string): Promise<User | null>
    findByUsername(username: string): Promise<User | null>
    update(user: User): Promise<User>
    deleteUser(id: string): Promise<boolean>
    exists(id: string): Promise<boolean>
    existsByUsername(username: string): Promise<boolean>

    // ===== OPERAÇÕES SOCIAIS =====
    followUser(userId: string, targetUserId: string): Promise<boolean>
    unfollowUser(userId: string, targetUserId: string): Promise<boolean>
    blockUser(userId: string, blockedUserId: string): Promise<boolean>
    unblockUser(userId: string, unblockedUserId: string): Promise<boolean>
    isFollowing(userId: string, targetUserId: string): Promise<boolean>
    isBlocked(userId: string, targetUserId: string): Promise<boolean>

    // ===== OPERAÇÕES DE BUSCA =====
    getFollowers(userId: string, limit?: number, offset?: number): Promise<User[]>
    getFollowing(userId: string, limit?: number, offset?: number): Promise<User[]>
    getBlockedUsers(userId: string, limit?: number, offset?: number): Promise<User[]>

    // ===== OPERAÇÕES DE STATUS =====
    findByStatus(status: any, limit?: number, offset?: number): Promise<User[]>
    findByRole(role: any, limit?: number, offset?: number): Promise<User[]>

    // ===== OPERAÇÕES AVANÇADAS =====
    findMostActive(limit?: number): Promise<User[]>
    findTopByFollowers(limit?: number): Promise<User[]>

    // ===== OPERAÇÕES DE PERMISSÃO E STATUS =====
    findUsersWhoCanCreateMoments(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanInteractWithMoments(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanViewMoments(options?: UserSearchOptions): Promise<User[]>
    findUsersWithAdminAccess(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanMentionUsers(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanBeMentioned(options?: UserSearchOptions): Promise<User[]>
    findUsersByActivityLevel(
        level: "low" | "medium" | "high",
        options?: UserSearchOptions,
    ): Promise<User[]>
    findUsersByReputationLevel(
        level: "novice" | "rising" | "established" | "influencer" | "celebrity",
        options?: UserSearchOptions,
    ): Promise<User[]>
}

/**
 * User Repository Interface
 *
 * Interface completa para operações de repositório de usuários
 * com suporte a todas as funcionalidades da entidade User otimizada
 */
export interface UserRepositoryInterface {
    // ===== OPERAÇÕES BÁSICAS =====
    create(user: User): Promise<User>
    findById(id: string): Promise<User | null>
    findByUsername(username: string): Promise<User | null>
    findBySearchTerm(searchTerm: string): Promise<User[]>
    update(user: User): Promise<User>
    delete(id: string): Promise<void>
    exists(id: string): Promise<boolean>
    existsByUsername(username: string): Promise<boolean>

    // ===== OPERAÇÕES DE BUSCA AVANÇADA =====
    findAll(options?: UserSearchOptions): Promise<User[]>
    findUsersByStatus(status: Level, options?: UserSearchOptions): Promise<User[]>
    findVerifiedUsers(options?: UserSearchOptions): Promise<User[]>
    findBlockedUsers(options?: UserSearchOptions): Promise<User[]>

    // ===== OPERAÇÕES DE ANÁLISE DE COMPORTAMENTO =====
    findUsersByActivityLevel(
        level: "low" | "medium" | "high",
        options?: UserSearchOptions,
    ): Promise<User[]>
    findUsersByReputationScore(
        minScore: number,
        maxScore?: number,
        options?: UserSearchOptions,
    ): Promise<User[]>
    findUsersByCreationDate(    
        startDate: Date,
        endDate?: Date,
        options?: UserSearchOptions,
    ): Promise<User[]>
    findNewUsers(daysThreshold?: number, options?: UserSearchOptions): Promise<User[]>
    findInactiveUsers(daysThreshold?: number, options?: UserSearchOptions): Promise<User[]>

    // ===== OPERAÇÕES DE PERMISSÃO E STATUS =====
    findUsersWhoCanCreateMoments(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanInteractWithMoments(options?: UserSearchOptions): Promise<User[]>
    findUsersWithAdminAccess(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanMentionUsers(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanBeMentioned(options?: UserSearchOptions): Promise<User[]>
    findUsersByReputationLevel(
        level: "novice" | "rising" | "established" | "influencer" | "celebrity",
        options?: UserSearchOptions,
    ): Promise<User[]>
    findUsersWhoCanViewMoments(options?: UserSearchOptions): Promise<User[]>
}

// ===== TIPOS DE SUPORTE =====

export interface UserSearchOptions {
    limit?: number
    offset?: number
    orderBy?: UserOrderBy
    filters?: UserFilters
}

export interface UserOrderBy {
    field:
        | "createdAt"
        | "updatedAt"
        | "username"
        | "reputationScore"
        | "engagementRate"
        | "totalFollowers"
    direction: "ASC" | "DESC"
}

export interface UserFilters {
    // Filtros básicos
    username?: string
    name?: string
    description?: string
    verified?: boolean
    blocked?: boolean
    deleted?: boolean
    muted?: boolean

    // Filtros de status
    accessLevel?: Level[]

    // Filtros temporais
    createdAfter?: Date
    createdBefore?: Date
    updatedAfter?: Date
    updatedBefore?: Date
    lastActiveAfter?: Date
    lastActiveBefore?: Date

    // Filtros de métricas
    minReputationScore?: number
    maxReputationScore?: number
    minEngagementRate?: number
    maxEngagementRate?: number
    minFollowers?: number
    maxFollowers?: number
    minFollowing?: number
    maxFollowing?: number
    minContentCreated?: number
    maxContentCreated?: number

    // Filtros de moderação
    minViolations?: number
    maxViolations?: number
    minReports?: number
    maxReports?: number
    hasModerationIssues?: boolean

    // Filtros de embeddings
    hasEmbedding?: boolean
    preferredHashtags?: string[]

    // Filtros de atividade
    activityLevel?: ("low" | "medium" | "high")[]
    isNewUser?: boolean
    isActiveUser?: boolean
    daysSinceCreation?: {
        min?: number
        max?: number
    }
}

export interface UserStatusData {
    accessLevel?: Level
    verified?: boolean
    blocked?: boolean
    deleted?: boolean
    muted?: boolean
}

export interface UserStatistics {
    totalUsers: number
    verifiedUsers: number
    blockedUsers: number
    deletedUsers: number
    mutedUsers: number
    newUsersLast7Days: number
    newUsersLast30Days: number
    inactiveUsersLast30Days: number
    usersWithEmbeddings: number
    usersWithModerationIssues: number
    averageReputationScore: number
    averageEngagementRate: number
    averageFollowers: number
    topPerformers: number
    influencers: number
}

export interface ActivityDistribution {
    low: number
    medium: number
    high: number
}

export interface ReputationDistribution {
    excellent: number // > 80
    good: number // 60-80
    average: number // 40-60
    poor: number // 20-40
    veryPoor: number // < 20
}

export interface EngagementDistribution {
    veryHigh: number // > 0.15
    high: number // 0.10-0.15
    medium: number // 0.05-0.10
    low: number // 0.02-0.05
    veryLow: number // < 0.02
}

/**
 * User Repository Implementation
 *
 * Implementação completa do repositório de usuários com suporte
 * a todas as funcionalidades da entidade User otimizada
 */
export class UserRepository implements UserRepositoryInterface, IUserRepository {
    constructor(private readonly database: DatabaseAdapter) {}

    // ===== OPERAÇÕES BÁSICAS =====

    async save(user: User): Promise<User> {
        return await this.create(user)
    }

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
        // ✅ OTIMIZADO: Usar include otimizado para reduzir memória
        const user = await UserModel.findByPk(BigInt(id), {
            include: this.getAuthIncludeOptions(),
        })

        if (!user) return null

        return UserMapper.toDomain(user as any)
    }

    async findByUsername(username: string): Promise<User | null> {
        console.log("🔍 findByUsername chamado para:", username)

        // ✅ OTIMIZADO: Usar include otimizado para reduzir memória em ~80%
        const user = await UserModel.findOne({
            where: { username },
            include: this.getAuthIncludeOptions(),
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
        let committed = false

        try {
            const userData = user.toJSON()

            if (!userData.id) {
                throw new Error("ID do usuário é obrigatório")
            }

            // ✅ OTIMIZADO: Atualizar apenas o usuário principal
            const userAttributes = UserMapper.toUserModelAttributes(user)
            await UserModel.update(userAttributes, {
                where: { id: BigInt(userData.id) },
                transaction,
            })

            // ✅ OTIMIZADO: Apenas fazer upsert se os dados realmente mudaram
            // Reduz drasticamente operações no banco durante signin
            const statusAttributes = UserMapper.toUserStatusAttributes(user)
            if (statusAttributes && this.hasStatusChanges(statusAttributes)) {
                await UserStatusModel.upsert(statusAttributes, { transaction })
            }

            // ✅ Atualizar preferências se mudaram (ex: timezone)
            const preferencesAttributes = UserMapper.toUserPreferencesAttributes(user)
            if (preferencesAttributes && this.hasPreferencesChanges(preferencesAttributes)) {
                await UserPreferencesModel.upsert(preferencesAttributes, { transaction })
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
     * ✅ Verifica se há mudanças reais no status
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

    /**
     * ✅ Verifica se há mudanças reais nas preferências
     * Evita upserts desnecessários que consomem memória
     */
    private hasPreferencesChanges(attributes: any): boolean {
        // Verificar se há qualquer campo de preferências
        // Durante signin, normalmente apenas o app_timezone muda
        return Boolean(attributes && Object.keys(attributes).length > 1) // Mais que apenas user_id
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

    // Método para a interface IUserRepository que retorna boolean
    async deleteUser(id: string): Promise<boolean> {
        try {
            await this.delete(id)
            return true
        } catch (error) {
            return false
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

    // ===== OPERAÇÕES SOCIAIS =====

    async followUser(userId: string, targetUserId: string): Promise<boolean> {
        try {
            // Verificar se já está seguindo
            const existingFollow = await UserFollowModel.findOne({
                where: {
                    followerId: BigInt(userId),
                    followingId: BigInt(targetUserId),
                },
            })

            if (existingFollow) {
                return true // Já está seguindo
            }

            // Criar relacionamento e atualizar métricas
            await Promise.all([
                UserFollowModel.create({
                    id: generateId(),
                    followerId: BigInt(userId),
                    followingId: BigInt(targetUserId),
                } as any),
                UserMetricsModel.increment("total_followers", {
                    where: { user_id: BigInt(targetUserId) },
                    by: 1,
                }),
                UserMetricsModel.increment("total_following", {
                    where: { user_id: BigInt(userId) },
                    by: 1,
                }),
                UserMetricsModel.increment("total_follows_given", {
                    where: { user_id: BigInt(userId) },
                    by: 1,
                }),
            ])

            return true
        } catch (error) {
            console.error("Erro ao seguir usuário:", error)
            return false
        }
    }

    async unfollowUser(userId: string, targetUserId: string): Promise<boolean> {
        try {
            // Verificar se existe o follow
            const existingFollow = await UserFollowModel.findOne({
                where: {
                    followerId: BigInt(userId),
                    followingId: BigInt(targetUserId),
                },
            })

            if (!existingFollow) {
                return false // Não está seguindo
            }

            // Destruir o relacionamento
            const deleted = await UserFollowModel.destroy({
                where: {
                    followerId: BigInt(userId),
                    followingId: BigInt(targetUserId),
                },
            })

            if (deleted > 0) {
                // Atualizar métricas usando models com validação
                const [targetUserMetrics] = await UserMetricsModel.findOrCreate({
                    where: { user_id: BigInt(targetUserId) },
                    defaults: {
                        user_id: BigInt(targetUserId),
                        total_followers: 0,
                        total_following: 0,
                    },
                })

                const [userMetrics] = await UserMetricsModel.findOrCreate({
                    where: { user_id: BigInt(userId) },
                    defaults: {
                        user_id: BigInt(userId),
                        total_followers: 0,
                        total_following: 0,
                    },
                })

                // Decrementar métricas com validação para evitar valores negativos
                if (targetUserMetrics.total_followers > 0) {
                    await targetUserMetrics.decrement("total_followers", { by: 1 })
                }

                if (userMetrics.total_following > 0) {
                    await userMetrics.decrement("total_following", { by: 1 })
                }

                return true
            }

            return false
        } catch (error) {
            console.error("Erro ao deixar de seguir usuário:", error)
            return false
        }
    }

    async blockUser(userId: string, blockedUserId: string): Promise<boolean> {
        try {
            // Verificar se já está bloqueado
            const existingBlock = await UserBlockModel.findOne({
                where: {
                    blockerId: BigInt(userId),
                    blockedId: BigInt(blockedUserId),
                },
            })

            if (existingBlock) {
                return true // Já está bloqueado
            }

            // Remover follow se existir (ao bloquear, automaticamente deixa de seguir)
            await UserFollowModel.destroy({
                where: {
                    [Op.or]: [
                        {
                            followerId: BigInt(userId),
                            followingId: BigInt(blockedUserId),
                        },
                        {
                            followerId: BigInt(blockedUserId),
                            followingId: BigInt(userId),
                        },
                    ],
                },
            })

            // Criar o bloqueio
            await UserBlockModel.create({
                id: generateId(),
                blockerId: BigInt(userId),
                blockedId: BigInt(blockedUserId),
            } as any)

            return true
        } catch (error) {
            console.error("Erro ao bloquear usuário:", error)
            return false
        }
    }

    async unblockUser(userId: string, unblockedUserId: string): Promise<boolean> {
        try {
            const deleted = await UserBlockModel.destroy({
                where: {
                    blockerId: BigInt(userId),
                    blockedId: BigInt(unblockedUserId),
                },
            })

            return deleted > 0
        } catch (error) {
            console.error("Erro ao desbloquear usuário:", error)
            return false
        }
    }

    async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
        try {
            const follow = await UserFollowModel.findOne({
                where: {
                    followerId: BigInt(userId),
                    followingId: BigInt(targetUserId),
                },
            })

            return !!follow
        } catch (error) {
            console.error("Erro ao verificar se está seguindo:", error)
            return false
        }
    }

    async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
        try {
            const block = await UserBlockModel.findOne({
                where: {
                    [Op.or]: [
                        {
                            blockerId: BigInt(userId),
                            blockedId: BigInt(targetUserId),
                        },
                        {
                            blockerId: BigInt(targetUserId),
                            blockedId: BigInt(userId),
                        },
                    ],
                },
            })

            return !!block
        } catch (error) {
            console.error("Erro ao verificar bloqueio:", error)
            return false
        }
    }

    async getFollowers(userId: string, limit?: number, offset?: number): Promise<User[]> {
        try {
            const follows = await UserFollowModel.findAll({
                where: {
                    followingId: BigInt(userId),
                },
                include: [
                    {
                        model: UserModel,
                        as: "follower",
                        include: [
                            {
                                model: UserStatusModel,
                                as: "status",
                                required: false,
                                separate: true,
                            },
                            {
                                model: UserMetricsModel,
                                as: "statistics",
                                required: false,
                                separate: true,
                            },
                        ],
                    },
                ],
                limit: limit || 50,
                offset: offset || 0,
                order: [["createdAt", "DESC"]],
                subQuery: false,
            })

            // Filtragem adicional para evitar duplicados
            const uniqueUsers = new Map<bigint, any>()
            for (const follow of follows) {
                const user = follow.follower
                if (user && !uniqueUsers.has(user.id)) {
                    uniqueUsers.set(user.id, user)
                }
            }

            return Array.from(uniqueUsers.values()).map((user: any) => UserMapper.toDomain(user))
        } catch (error) {
            console.error("Erro ao buscar seguidores:", error)
            return []
        }
    }

    async getFollowing(userId: string, limit?: number, offset?: number): Promise<User[]> {
        try {
            const follows = await UserFollowModel.findAll({
                where: {
                    followerId: BigInt(userId),
                },
                include: [
                    {
                        model: UserModel,
                        as: "following",
                        include: [
                            {
                                model: UserStatusModel,
                                as: "status",
                                required: false,
                                separate: true,
                            },
                            {
                                model: UserMetricsModel,
                                as: "statistics",
                                required: false,
                                separate: true,
                            },
                        ],
                    },
                ],
                limit: limit || 50,
                offset: offset || 0,
                order: [["createdAt", "DESC"]],
                subQuery: false,
            })

            // Filtragem adicional para evitar duplicados
            const uniqueUsers = new Map<bigint, any>()
            for (const follow of follows) {
                const user = follow.following
                if (user && !uniqueUsers.has(user.id)) {
                    uniqueUsers.set(user.id, user)
                }
            }

            return Array.from(uniqueUsers.values()).map((user: any) => UserMapper.toDomain(user))
        } catch (error) {
            console.error("Erro ao buscar seguindo:", error)
            return []
        }
    }

    async getBlockedUsers(userId: string, limit?: number, offset?: number): Promise<User[]> {
        try {
            const blocks = await UserBlockModel.findAll({
                where: {
                    blockerId: BigInt(userId),
                },
                include: [
                    {
                        model: UserModel,
                        as: "blocked",
                        include: [
                            {
                                model: UserStatusModel,
                                as: "status",
                                required: false,
                                separate: true,
                            },
                            {
                                model: UserMetricsModel,
                                as: "statistics",
                                required: false,
                                separate: true,
                            },
                        ],
                    },
                ],
                limit: limit || 50,
                offset: offset || 0,
                order: [["createdAt", "DESC"]],
                subQuery: false,
            })

            // Filtragem adicional para evitar duplicados
            const uniqueUsers = new Map<bigint, any>()
            for (const block of blocks) {
                const user = block.blocked
                if (user && !uniqueUsers.has(user.id)) {
                    uniqueUsers.set(user.id, user)
                }
            }

            return Array.from(uniqueUsers.values()).map((user: any) => UserMapper.toDomain(user))
        } catch (error) {
            console.error("Erro ao buscar usuários bloqueados:", error)
            return []
        }
    }

    // ===== OPERAÇÕES DE STATUS =====

    async findByStatus(status: any, limit?: number, offset?: number): Promise<User[]> {
        const options: UserSearchOptions = {
            limit: limit || 20,
            offset: offset || 0,
            filters: { accessLevel: [status] },
        }
        return this.findUsersByStatus(status, options)
    }

    async findByRole(role: any, limit?: number, offset?: number): Promise<User[]> {
        // Implementação básica - mapear role para accessLevel
        const options: UserSearchOptions = {
            limit: limit || 20,
            offset: offset || 0,
            filters: { accessLevel: [role] },
        }
        return this.findUsersByStatus(role, options)
    }

    // ===== OPERAÇÕES AVANÇADAS =====

    async findMostActive(limit?: number): Promise<User[]> {
        const options: UserSearchOptions = {
            limit: limit || 10,
            orderBy: {
                field: "engagementRate",
                direction: "DESC",
            },
        }
        return this.findAll(options)
    }

    async findTopByFollowers(limit?: number): Promise<User[]> {
        const options: UserSearchOptions = {
            limit: limit || 10,
            orderBy: {
                field: "totalFollowers",
                direction: "DESC",
            },
        }
        return this.findAll(options)
    }

    // ===== OPERAÇÕES DE PERMISSÃO E STATUS =====

    async findUsersWhoCanCreateMoments(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários que podem criar momentos usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => user.canCreateMoments())
    }

    async findUsersWhoCanInteractWithMoments(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários que podem interagir com momentos usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => user.canInteractWithMoments())
    }

    async findUsersWhoCanViewMoments(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários que podem ver momentos usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => user.canViewMoments())
    }

    async findUsersWithAdminAccess(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
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

        const users = await UserModel.findAll({
            ...queryOptions,
            include: this.getIncludeOptions(),
        })

        // Filtrar usuários que podem mencionar outros usando a lógica da entidade
        const domainUsers = UserMapper.toDomainArray(users as any)
        return domainUsers.filter((user) => user.canMentionUsers())
    }

    async findUsersWhoCanBeMentioned(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
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

        const users = await UserModel.findAll({
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

        const users = await UserModel.findAll({
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

        const whereClause: WhereOptions = {}

        if (criteria.minFollowers) {
            whereClause.total_followers = { [Op.gte]: criteria.minFollowers }
        }
        if (criteria.minEngagementRate) {
            whereClause.engagement_rate = { [Op.gte]: criteria.minEngagementRate }
        }
        if (criteria.minReputationScore) {
            whereClause.reputation_score = { [Op.gte]: criteria.minReputationScore }
        }

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserMetricsModel,
                    as: "statistics",
                    where: whereClause,
                    required: true,
                },
            ],
            order: [[{ model: UserMetricsModel, as: "statistics" }, "total_followers", "DESC"]],
        })

        return UserMapper.toDomainArray(users as any)
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

    async findUsersByStatus(status: Level, options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
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

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
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

    async findBlockedUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
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

    // ===== MÉTODOS AUXILIARES PRIVADOS =====

    private getAuthIncludeOptions() {
        return [
            {
                model: UserStatusModel,
                as: "status",
                required: false,
            },
            {
                model: UserPreferencesModel,
                as: "preferences",
                required: false,
            },
            // NÃO incluir: statistics, terms, embeddings, interaction_summary
            // Esses dados não são necessários para autenticação
        ]
    }

    private getIncludeOptions() {
        return [
            {
                model: UserStatusModel,
                as: "status",
                required: false,
            },
            {
                model: UserPreferencesModel,
                as: "preferences",
                required: false,
            },
            {
                model: UserMetricsModel,
                as: "statistics",
                required: false,
            },
            {
                model: UserTermModel,
                as: "terms",
                required: false,
            },
            {
                model: UserEmbeddingModel,
                as: "embedding",
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
                    ? [{ model: UserMetricsModel, as: "statistics" }, "engagement_rate"]
                    : options.orderBy.field === "engagementRate"
                    ? [{ model: UserMetricsModel, as: "statistics" }, "engagement_rate"]
                    : options.orderBy.field === "totalFollowers"
                    ? [{ model: UserMetricsModel, as: "statistics" }, "total_followers"]
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
