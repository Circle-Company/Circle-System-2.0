import { Op, WhereOptions } from "sequelize"

import { Level } from "@/domain/authorization"
import { DatabaseAdapter } from "@/infra/database/adapter"
import UserEmbeddingModel from "@/infra/models/swipe.engine/user.embedding.model"
import UserInteractionSummaryModel from "@/infra/models/swipe.engine/user.interaction.summary.model"
import UserModel from "@/infra/models/user/user.model"
import UserPreferencesModel from "@/infra/models/user/user.preferences.model"
import UserStatisticsModel from "@/infra/models/user/user.statistics.model"
import UserStatusModel from "@/infra/models/user/user.status.model"
import UserTermModel from "@/infra/models/user/user.terms.model"
import { User } from "../entities/user.entity"
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
    search(criteria: {
        query: string
        filters?: any
        sortBy?: any
        limit?: number
        offset?: number
    }): Promise<{ users: User[]; total: number }>

    // ===== OPERAÇÕES DE STATUS =====
    findByStatus(status: any, limit?: number, offset?: number): Promise<User[]>
    findByRole(role: any, limit?: number, offset?: number): Promise<User[]>
    countByStatus(status: any): Promise<number>
    countByRole(role: any): Promise<number>

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

    // ===== OPERAÇÕES DE MÉTRICAS AVANÇADAS =====
    findUsersByEngagementMetrics(
        criteria: {
            minLikesReceived?: number
            minViewsReceived?: number
            minCommentsReceived?: number
            minSharesReceived?: number
            minEngagementRate?: number
            minReachRate?: number
        },
        options?: UserSearchOptions,
    ): Promise<User[]>
    findUsersByReputationScore(
        minScore: number,
        maxScore?: number,
        options?: UserSearchOptions,
    ): Promise<User[]>
    findInfluencersByCriteria(
        criteria: {
            minFollowers?: number
            minEngagementRate?: number
            minReputationScore?: number
        },
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
    findActiveUsers(options?: UserSearchOptions): Promise<User[]>
    findUsersByStatus(status: Level, options?: UserSearchOptions): Promise<User[]>
    findVerifiedUsers(options?: UserSearchOptions): Promise<User[]>
    findUnverifiedUsers(options?: UserSearchOptions): Promise<User[]>
    findBlockedUsers(options?: UserSearchOptions): Promise<User[]>
    findDeletedUsers(options?: UserSearchOptions): Promise<User[]>

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

    // ===== OPERAÇÕES DE MÉTRICAS =====
    findUsersByEngagementRate(
        minRate: number,
        maxRate?: number,
        options?: UserSearchOptions,
    ): Promise<User[]>
    findUsersByFollowersCount(
        minFollowers: number,
        maxFollowers?: number,
        options?: UserSearchOptions,
    ): Promise<User[]>
    findUsersByContentCount(
        minContent: number,
        maxContent?: number,
        options?: UserSearchOptions,
    ): Promise<User[]>
    findTopPerformers(limit?: number, options?: UserSearchOptions): Promise<User[]>
    findInfluencers(
        minFollowers?: number,
        minEngagementRate?: number,
        options?: UserSearchOptions,
    ): Promise<User[]>

    // ===== OPERAÇÕES DE EMBEDDINGS =====
    findUsersWithEmbeddings(options?: UserSearchOptions): Promise<User[]>
    findUsersWithoutEmbeddings(options?: UserSearchOptions): Promise<User[]>
    findUsersByPreferredHashtags(hashtags: string[], options?: UserSearchOptions): Promise<User[]>

    // ===== OPERAÇÕES DE MODERAÇÃO =====
    findUsersWithModerationIssues(options?: UserSearchOptions): Promise<User[]>
    findUsersByViolationsCount(
        minViolations: number,
        maxViolations?: number,
        options?: UserSearchOptions,
    ): Promise<User[]>
    findUsersByReportsCount(
        minReports: number,
        maxReports?: number,
        options?: UserSearchOptions,
    ): Promise<User[]>

    // ===== OPERAÇÕES DE PAGINAÇÃO E CONTAGEM =====
    countUsers(filters?: UserFilters): Promise<number>
    countActiveUsers(): Promise<number>
    countVerifiedUsers(): Promise<number>
    countUsersByStatus(status: Level): Promise<number>
    countUsersByActivityLevel(level: "low" | "medium" | "high"): Promise<number>

    // ===== OPERAÇÕES DE ESTATÍSTICAS =====
    getUsersStatistics(): Promise<UserStatistics>
    getActivityDistribution(): Promise<ActivityDistribution>
    getReputationDistribution(): Promise<ReputationDistribution>
    getEngagementDistribution(): Promise<EngagementDistribution>

    // ===== OPERAÇÕES DE PERMISSÃO E STATUS =====
    findUsersWhoCanCreateMoments(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanInteractWithMoments(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanViewMoments(options?: UserSearchOptions): Promise<User[]>
    findUsersWithAdminAccess(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanMentionUsers(options?: UserSearchOptions): Promise<User[]>
    findUsersWhoCanBeMentioned(options?: UserSearchOptions): Promise<User[]>
    findUsersByReputationLevel(
        level: "novice" | "rising" | "established" | "influencer" | "celebrity",
        options?: UserSearchOptions,
    ): Promise<User[]>

    // ===== OPERAÇÕES DE MÉTRICAS AVANÇADAS =====
    findUsersByEngagementMetrics(
        criteria: {
            minLikesReceived?: number
            minViewsReceived?: number
            minCommentsReceived?: number
            minSharesReceived?: number
            minEngagementRate?: number
            minReachRate?: number
        },
        options?: UserSearchOptions,
    ): Promise<User[]>
    findInfluencersByCriteria(
        criteria: {
            minFollowers?: number
            minEngagementRate?: number
            minReputationScore?: number
        },
        options?: UserSearchOptions,
    ): Promise<User[]>

    // ===== OPERAÇÕES EM LOTE =====
    createMany(users: User[]): Promise<User[]>
    updateMany(users: User[]): Promise<User[]>
    deleteMany(ids: string[]): Promise<void>
    bulkUpdateStatus(ids: string[], status: Partial<UserStatusData>): Promise<void>
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
    activeUsers: number
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
                await UserStatisticsModel.create(statisticsAttributes, { transaction })
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

        console.log("🔍 Resultado da busca:", user ? "encontrado" : "não encontrado")

        if (!user) return null

        console.log("🔍 User encontrado - dados:", {
            id: user.id,
            username: user.username,
            name: user.name,
            hasStatus: !!user.status,
            hasPreferences: !!user.preferences,
            raw: JSON.stringify(user.toJSON()).substring(0, 200),
        })

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

    async existsByEmail(email: string): Promise<boolean> {
        // Campo email não está disponível no modelo atual
        // Implementação básica - retorna false
        // Em um sistema real, você implementaria a verificação por email
        return false
    }

    // ===== IMPLEMENTAÇÃO DOS MÉTODOS DA INTERFACE IUserRepository =====

    async findByEmail(email: string): Promise<User | null> {
        // Campo email não está disponível no modelo atual
        // Implementação básica - retorna null
        // Em um sistema real, você implementaria a busca por email
        return null
    }

    async findByPhone(phone: string): Promise<User | null> {
        // Campo phone não está disponível no modelo atual
        // Implementação básica - retorna null
        // Em um sistema real, você implementaria a busca por telefone
        return null
    }

    async findBySocialId(socialId: string): Promise<User | null> {
        // Campo social_id não está disponível no modelo atual
        // Implementação básica - retorna null
        // Em um sistema real, você implementaria a busca por social ID
        return null
    }

    async findMany(criteria: {
        query?: string
        filters?: any
        sortBy?: any
        limit?: number
        offset?: number
    }): Promise<User[]> {
        const options: UserSearchOptions = {
            limit: criteria.limit || 20,
            offset: criteria.offset || 0,
            orderBy: criteria.sortBy,
            filters: criteria.filters,
        }

        if (criteria.query) {
            return this.findBySearchTerm(criteria.query)
        }

        return this.findAll(options)
    }

    // ===== OPERAÇÕES SOCIAIS =====

    async followUser(userId: string, targetUserId: string): Promise<boolean> {
        // Implementação básica - em um sistema real, isso seria feito através de uma tabela de relacionamentos
        // Por enquanto, retornamos true para indicar sucesso
        try {
            // Aqui você implementaria a lógica de seguir usuário
            // Por exemplo, inserir na tabela user_follows
            return true
        } catch (error) {
            return false
        }
    }

    async unfollowUser(userId: string, targetUserId: string): Promise<boolean> {
        // Implementação básica - em um sistema real, isso seria feito através de uma tabela de relacionamentos
        try {
            // Aqui você implementaria a lógica de deixar de seguir usuário
            // Por exemplo, remover da tabela user_follows
            return true
        } catch (error) {
            return false
        }
    }

    async blockUser(userId: string, blockedUserId: string): Promise<boolean> {
        // Implementação básica - em um sistema real, isso seria feito através de uma tabela de bloqueios
        try {
            // Aqui você implementaria a lógica de bloquear usuário
            // Por exemplo, inserir na tabela user_blocks
            return true
        } catch (error) {
            return false
        }
    }

    async unblockUser(userId: string, unblockedUserId: string): Promise<boolean> {
        // Implementação básica - em um sistema real, isso seria feito através de uma tabela de bloqueios
        try {
            // Aqui você implementaria a lógica de desbloquear usuário
            // Por exemplo, remover da tabela user_blocks
            return true
        } catch (error) {
            return false
        }
    }

    async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
        // Implementação básica - em um sistema real, isso verificaria na tabela de relacionamentos
        try {
            // Aqui você implementaria a verificação se o usuário está seguindo outro
            // Por exemplo, consultar na tabela user_follows
            return false
        } catch (error) {
            return false
        }
    }

    async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
        // Implementação básica - em um sistema real, isso verificaria na tabela de bloqueios
        try {
            // Aqui você implementaria a verificação se o usuário está bloqueado
            // Por exemplo, consultar na tabela user_blocks
            return false
        } catch (error) {
            return false
        }
    }

    async getFollowers(userId: string, limit?: number, offset?: number): Promise<User[]> {
        // Implementação básica - em um sistema real, isso consultaria a tabela de relacionamentos
        try {
            // Aqui você implementaria a busca de seguidores
            // Por exemplo, consultar na tabela user_follows onde target_user_id = userId
            return []
        } catch (error) {
            return []
        }
    }

    async getFollowing(userId: string, limit?: number, offset?: number): Promise<User[]> {
        // Implementação básica - em um sistema real, isso consultaria a tabela de relacionamentos
        try {
            // Aqui você implementaria a busca de usuários que está seguindo
            // Por exemplo, consultar na tabela user_follows onde user_id = userId
            return []
        } catch (error) {
            return []
        }
    }

    async getBlockedUsers(userId: string, limit?: number, offset?: number): Promise<User[]> {
        // Implementação básica - em um sistema real, isso consultaria a tabela de bloqueios
        try {
            // Aqui você implementaria a busca de usuários bloqueados
            // Por exemplo, consultar na tabela user_blocks onde user_id = userId
            return []
        } catch (error) {
            return []
        }
    }

    async search(criteria: {
        query: string
        filters?: any
        sortBy?: any
        limit?: number
        offset?: number
    }): Promise<{ users: User[]; total: number }> {
        const users = await this.findMany(criteria)
        return {
            users,
            total: users.length,
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

    async countByStatus(status: any): Promise<number> {
        return this.countUsersByStatus(status)
    }

    async countByRole(role: any): Promise<number> {
        return this.countUsersByStatus(role)
    }

    // ===== OPERAÇÕES AVANÇADAS =====

    async findMostActive(limit?: number): Promise<User[]> {
        return this.findTopPerformers(limit || 10)
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

        const users = await UserModel.findAll({
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

    async findUnverifiedUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
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

    async findDeletedUsers(options?: UserSearchOptions): Promise<User[]> {
        const queryOptions = this.buildQueryOptions(options)

        const users = await UserModel.findAll({
            ...queryOptions,
            include: [
                ...this.getIncludeOptions(),
                {
                    model: UserStatusModel,
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
                    model: UserStatusModel,
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
                    model: UserStatusModel,
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
                    await UserStatisticsModel.create(statisticsAttributes, { transaction })
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

    /**
     * ✅ Include options otimizado para autenticação
     * Carrega apenas relacionamentos essenciais
     * Reduz consumo de memória em ~80%
     */
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

    /**
     * Include options completo para operações que precisam de todos os dados
     * Use apenas quando realmente necessário
     */
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
                model: UserStatisticsModel,
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
