/**
 * User Service - Serviço principal de usuário
 *
 * Features:
 * - CRUD completo de usuários
 * - Gestão de perfis e configurações
 * - Sistema de seguidores/seguindo
 * - Bloqueios e denúncias
 * - Gestão de status premium
 * - Busca e filtros avançados
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import {
    IUserRepository,
    UserEntity,
    UserPreferences,
    UserRole,
    UserStatistics,
    UserStatusEnum,
} from "@/domain/user"

import { UserMetricsService } from "./user.metrics.service"

// ===== INTERFACES DE DADOS =====
export interface CreateUserData {
    name: string
    email: string
    password: string
    profilePicture?: string
    bio?: string
    preferences?: Partial<UserPreferences>
    metadata?: Record<string, any>
}

export interface UpdateUserData {
    name?: string
    bio?: string
    profilePicture?: string
    preferences?: Partial<UserPreferences>
    metadata?: Record<string, any>
}

export interface UserSearchFilters {
    status?: UserStatusEnum
    role?: UserRole
    isPremium?: boolean
    location?: {
        latitude: number
        longitude: number
        radius: number
    }
    dateRange?: {
        start: Date
        end: Date
    }
    followersRange?: {
        min: number
        max: number
    }
    activityRange?: {
        min: number
        max: number
    }
}

export interface UserSortOptions {
    field:
        | "createdAt"
        | "updatedAt"
        | "lastActiveAt"
        | "followersCount"
        | "momentsCount"
        | "engagement"
    direction: "asc" | "desc"
}

export interface UserPaginationOptions {
    page: number
    limit: number
    offset?: number
}

export interface UserServiceConfig {
    enableValidation: boolean
    enableMetrics: boolean
    enableSocialFeatures: boolean
    defaultRole: UserRole
    defaultStatus: UserStatusEnum
    maxSearchResults: number
    enableCaching: boolean
    cacheTimeout: number
}

// ===== SERVIÇO PRINCIPAL DE USUÁRIO =====
export class UserService implements IUserRepository {
    private config: UserServiceConfig

    constructor(
        private repository: IUserRepository,
        private metricsService: UserMetricsService,
        config?: Partial<UserServiceConfig>,
    ) {
        this.config = {
            enableValidation: true,
            enableMetrics: true,
            enableSocialFeatures: true,
            defaultRole: UserRole.USER,
            defaultStatus: UserStatusEnum.ACTIVE,
            maxSearchResults: 100,
            enableCaching: true,
            cacheTimeout: 300000, // 5 minutos
            ...config,
        }
    }

    /**
     * Cria um novo usuário
     */
    async createUser(data: CreateUserData): Promise<User> {
        try {
            if (this.config.enableValidation) {
                await this.validateCreateData(data)
            }

            const user = User.create({
                username: data.email, // Usar email como username temporário
                name: data.name,
                searchMatchTerm: `${data.name} ${data.email}`,
                password: data.password,
                description: data.bio,
                profilePicture: data.profilePicture
                    ? {
                          tinyResolution: data.profilePicture,
                          fullhdResolution: data.profilePicture,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                      }
                    : undefined,
            })

            const savedUser = await this.repository.save(user)

            if (this.config.enableMetrics) {
                await this.metricsService.recordProfileEdit(savedUser.id, {
                    fieldsChanged: ["created"],
                    timestamp: new Date(),
                })
            }

            return savedUser
        } catch (error) {
            console.error("Erro ao criar usuário:", error)
            throw error
        }
    }

    /**
     * Obtém usuário por ID
     */
    async getUserById(id: string): Promise<User | null> {
        try {
            return await this.repository.findById(id)
        } catch (error) {
            console.error("Erro ao obter usuário:", error)
            return null
        }
    }

    /**
     * Obtém usuário por email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        try {
            return await this.repository.findByEmail(email)
        } catch (error) {
            console.error("Erro ao obter usuário por email:", error)
            return null
        }
    }

    /**
     * Atualiza usuário
     */
    async updateUser(id: string, data: UpdateUserData): Promise<User | null> {
        try {
            const user = await this.repository.findById(id)
            if (!user) {
                throw new Error("Usuário não encontrado")
            }

            if (this.config.enableValidation) {
                await this.validateUpdateData(data)
            }

            const fieldsChanged: string[] = []
            if (data.name && data.name !== user.name) fieldsChanged.push("name")
            if (data.bio !== undefined && data.bio !== user.bio) fieldsChanged.push("bio")
            if (data.profilePicture !== undefined && data.profilePicture !== user.profilePicture) {
                fieldsChanged.push("profilePicture")
            }
            if (data.preferences) fieldsChanged.push("preferences")
            if (data.metadata) fieldsChanged.push("metadata")

            const updatedUser = await this.repository.update({
                ...user,
                ...data,
                updatedAt: new Date(),
            })

            if (this.config.enableMetrics && fieldsChanged.length > 0) {
                await this.metricsService.recordProfileEdit(id, {
                    fieldsChanged,
                    timestamp: new Date(),
                })
            }

            return updatedUser
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error)
            throw error
        }
    }

    /**
     * Deleta usuário
     */
    async deleteUser(id: string, reason?: string): Promise<boolean> {
        try {
            const user = await this.repository.findById(id)
            if (!user) {
                throw new Error("Usuário não encontrado")
            }

            const result = await this.repository.delete(id)
            if (result) {
                console.log(`Usuário ${id} deletado. Razão: ${reason || "Não especificada"}`)
            }

            return result
        } catch (error) {
            console.error("Erro ao deletar usuário:", error)
            throw error
        }
    }

    /**
     * Bloqueia usuário
     */
    async blockUser(userId: string, blockedUserId: string): Promise<boolean> {
        try {
            if (!this.config.enableSocialFeatures) {
                throw new Error("Recursos sociais desabilitados")
            }

            const result = await this.repository.blockUser(userId, blockedUserId)

            if (result && this.config.enableMetrics) {
                await this.metricsService.recordSocialActivity("block", userId, {
                    targetUserId: blockedUserId,
                    timestamp: new Date(),
                })
            }

            return result
        } catch (error) {
            console.error("Erro ao bloquear usuário:", error)
            throw error
        }
    }

    /**
     * Desbloqueia usuário
     */
    async unblockUser(userId: string, unblockedUserId: string): Promise<boolean> {
        try {
            if (!this.config.enableSocialFeatures) {
                throw new Error("Recursos sociais desabilitados")
            }

            const result = await this.repository.unblockUser(userId, unblockedUserId)

            if (result && this.config.enableMetrics) {
                await this.metricsService.recordSocialActivity("unblock", userId, {
                    targetUserId: unblockedUserId,
                    timestamp: new Date(),
                })
            }

            return result
        } catch (error) {
            console.error("Erro ao desbloquear usuário:", error)
            throw error
        }
    }

    /**
     * Segue usuário
     */
    async followUser(userId: string, targetUserId: string): Promise<boolean> {
        try {
            if (!this.config.enableSocialFeatures) {
                throw new Error("Recursos sociais desabilitados")
            }

            if (userId === targetUserId) {
                throw new Error("Não é possível seguir a si mesmo")
            }

            const result = await this.repository.followUser(userId, targetUserId)

            if (result && this.config.enableMetrics) {
                await this.metricsService.recordSocialActivity("follow", userId, {
                    targetUserId,
                    timestamp: new Date(),
                })
            }

            return result
        } catch (error) {
            console.error("Erro ao seguir usuário:", error)
            throw error
        }
    }

    /**
     * Para de seguir usuário
     */
    async unfollowUser(userId: string, targetUserId: string): Promise<boolean> {
        try {
            if (!this.config.enableSocialFeatures) {
                throw new Error("Recursos sociais desabilitados")
            }

            const result = await this.repository.unfollowUser(userId, targetUserId)

            if (result && this.config.enableMetrics) {
                await this.metricsService.recordSocialActivity("unfollow", userId, {
                    targetUserId,
                    timestamp: new Date(),
                })
            }

            return result
        } catch (error) {
            console.error("Erro ao parar de seguir usuário:", error)
            throw error
        }
    }

    /**
     * Verifica se usuário A segue usuário B
     */
    async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
        try {
            return await this.repository.isFollowing(userId, targetUserId)
        } catch (error) {
            console.error("Erro ao verificar se está seguindo:", error)
            return false
        }
    }

    /**
     * Verifica se usuário A bloqueou usuário B
     */
    async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
        try {
            return await this.repository.isBlocked(userId, targetUserId)
        } catch (error) {
            console.error("Erro ao verificar se está bloqueado:", error)
            return false
        }
    }

    /**
     * Obtém seguidores do usuário
     */
    async getFollowers(
        userId: string,
        limit: number = 20,
        offset: number = 0,
    ): Promise<UserEntity[]> {
        try {
            return await this.repository.getFollowers(userId, limit, offset)
        } catch (error) {
            console.error("Erro ao obter seguidores:", error)
            return []
        }
    }

    /**
     * Obtém usuários seguidos
     */
    async getFollowing(
        userId: string,
        limit: number = 20,
        offset: number = 0,
    ): Promise<UserEntity[]> {
        try {
            return await this.repository.getFollowing(userId, limit, offset)
        } catch (error) {
            console.error("Erro ao obter seguindo:", error)
            return []
        }
    }

    /**
     * Obtém usuários bloqueados
     */
    async getBlockedUsers(
        userId: string,
        limit: number = 20,
        offset: number = 0,
    ): Promise<UserEntity[]> {
        try {
            return await this.repository.getBlockedUsers(userId, limit, offset)
        } catch (error) {
            console.error("Erro ao obter usuários bloqueados:", error)
            return []
        }
    }

    /**
     * Atualiza preferências do usuário
     */
    async updatePreferences(
        userId: string,
        preferences: Partial<UserPreferences>,
    ): Promise<UserEntity | null> {
        try {
            const user = await this.repository.findById(userId)
            if (!user) {
                throw new Error("Usuário não encontrado")
            }

            const updatedUser = await this.repository.update({
                ...user,
                preferences: {
                    ...user.preferences,
                    ...preferences,
                },
                updatedAt: new Date(),
            })

            if (this.config.enableMetrics) {
                await this.metricsService.recordProfileEdit(userId, {
                    fieldsChanged: ["preferences"],
                    timestamp: new Date(),
                })
            }

            return updatedUser
        } catch (error) {
            console.error("Erro ao atualizar preferências:", error)
            throw error
        }
    }

    /**
     * Atualiza estatísticas do usuário
     */
    async updateStatistics(
        userId: string,
        statistics: Partial<UserStatistics>,
    ): Promise<UserEntity | null> {
        try {
            const user = await this.repository.findById(userId)
            if (!user) {
                throw new Error("Usuário não encontrado")
            }

            const updatedUser = await this.repository.update({
                ...user,
                statistics: {
                    ...user.statistics,
                    ...statistics,
                },
                updatedAt: new Date(),
            })

            return updatedUser
        } catch (error) {
            console.error("Erro ao atualizar estatísticas:", error)
            throw error
        }
    }

    /**
     * Atualiza status do usuário
     */
    async updateStatus(userId: string, status: UserStatusEnum): Promise<UserEntity | null> {
        try {
            const user = await this.repository.findById(userId)
            if (!user) {
                throw new Error("Usuário não encontrado")
            }

            const updatedUser = await this.repository.update({
                ...user,
                status,
                updatedAt: new Date(),
            })

            return updatedUser
        } catch (error) {
            console.error("Erro ao atualizar status:", error)
            throw error
        }
    }

    /**
     * Atualiza role do usuário
     */
    async updateRole(userId: string, role: UserRole): Promise<UserEntity | null> {
        try {
            const user = await this.repository.findById(userId)
            if (!user) {
                throw new Error("Usuário não encontrado")
            }

            const updatedUser = await this.repository.update({
                ...user,
                role,
                updatedAt: new Date(),
            })

            return updatedUser
        } catch (error) {
            console.error("Erro ao atualizar role:", error)
            throw error
        }
    }

    /**
     * Busca usuários
     */
    async searchUsers(
        query: string,
        filters?: UserSearchFilters,
        sortBy?: UserSortOptions,
        pagination?: UserPaginationOptions,
    ): Promise<{
        users: UserEntity[]
        total: number
        page: number
        limit: number
        hasNext: boolean
        hasPrev: boolean
    }> {
        try {
            const limit = Math.min(pagination?.limit || 20, this.config.maxSearchResults)
            const offset = pagination?.offset || (pagination?.page || 1 - 1) * limit

            const result = await this.repository.search({
                query,
                filters,
                sortBy,
                limit,
                offset,
            })

            return {
                users: result.users,
                total: result.total,
                page: pagination?.page || 1,
                limit,
                hasNext: offset + limit < result.total,
                hasPrev: offset > 0,
            }
        } catch (error) {
            console.error("Erro ao buscar usuários:", error)
            return {
                users: [],
                total: 0,
                page: 1,
                limit: 20,
                hasNext: false,
                hasPrev: false,
            }
        }
    }

    /**
     * Obtém usuários por status
     */
    async getUsersByStatus(
        status: UserStatusEnum,
        limit: number = 20,
        offset: number = 0,
    ): Promise<UserEntity[]> {
        try {
            return await this.repository.findByStatus(status, limit, offset)
        } catch (error) {
            console.error("Erro ao obter usuários por status:", error)
            return []
        }
    }

    /**
     * Obtém usuários por role
     */
    async getUsersByRole(
        role: UserRole,
        limit: number = 20,
        offset: number = 0,
    ): Promise<UserEntity[]> {
        try {
            return await this.repository.findByRole(role, limit, offset)
        } catch (error) {
            console.error("Erro ao obter usuários por role:", error)
            return []
        }
    }

    /**
     * Conta usuários por status
     */
    async countUsersByStatus(status: UserStatusEnum): Promise<number> {
        try {
            return await this.repository.countByStatus(status)
        } catch (error) {
            console.error("Erro ao contar usuários por status:", error)
            return 0
        }
    }

    /**
     * Conta usuários por role
     */
    async countUsersByRole(role: UserRole): Promise<number> {
        try {
            return await this.repository.countByRole(role)
        } catch (error) {
            console.error("Erro ao contar usuários por role:", error)
            return 0
        }
    }

    /**
     * Verifica se email já existe
     */
    async emailExists(email: string): Promise<boolean> {
        try {
            return await this.repository.existsByEmail(email)
        } catch (error) {
            console.error("Erro ao verificar se email existe:", error)
            return false
        }
    }

    /**
     * Obtém métricas agregadas
     */
    async getAggregatedMetrics(userIds?: string[]) {
        try {
            if (this.config.enableMetrics) {
                return await this.metricsService.getAggregatedMetrics(userIds || [])
            }
            return null
        } catch (error) {
            console.error("Erro ao obter métricas agregadas:", error)
            return null
        }
    }

    /**
     * Obtém usuários mais ativos
     */
    async getMostActiveUsers(limit: number = 10) {
        try {
            return await this.repository.findMostActive(limit)
        } catch (error) {
            console.error("Erro ao obter usuários mais ativos:", error)
            return []
        }
    }

    /**
     * Obtém usuários com mais seguidores
     */
    async getTopUsersByFollowers(limit: number = 10) {
        try {
            return await this.repository.findTopByFollowers(limit)
        } catch (error) {
            console.error("Erro ao obter top usuários por seguidores:", error)
            return []
        }
    }

    // ===== IMPLEMENTAÇÃO DA INTERFACE IUserRepository =====

    async save(user: User): Promise<User> {
        // Se o usuário já tem ID, atualizar
        if (user.id) {
            const updatedUser = await this.updateUser(user.id, {
                name: user.name || "",
                bio: user.description,
                profilePicture: user.profilePicture,
                preferences: user.preferences,
                metadata: user.metadata,
            })
            if (!updatedUser) {
                throw new Error("Erro ao atualizar usuário")
            }
            return updatedUser
        }

        // Caso contrário, criar novo usuário
        return await this.createUser({
            name: user.name || "",
            email: user.email,
            password: user.password,
            profilePicture: user.profilePicture,
            bio: user.description,
            preferences: user.preferences,
            metadata: user.metadata,
        })
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.getUserByEmail(email)
    }

    async findByUsername(username: string): Promise<User | null> {
        try {
            return await this.repository.findByUsername(username)
        } catch (error) {
            console.error("Erro ao obter usuário por username:", error)
            return null
        }
    }

    async exists(id: string): Promise<boolean> {
        try {
            const user = await this.repository.findById(id)
            return user !== null
        } catch (error) {
            console.error("Erro ao verificar se usuário existe:", error)
            return false
        }
    }

    async existsByEmail(email: string): Promise<boolean> {
        return await this.emailExists(email)
    }

    async findByStatus(status: any, limit: number = 20, offset: number = 0): Promise<User[]> {
        return await this.getUsersByStatus(status, limit, offset)
    }

    async findByRole(role: any, limit: number = 20, offset: number = 0): Promise<User[]> {
        return await this.getUsersByRole(role, limit, offset)
    }

    async countByStatus(status: any): Promise<number> {
        return await this.countUsersByStatus(status)
    }

    async countByRole(role: any): Promise<number> {
        return await this.countUsersByRole(role)
    }

    async findMostActive(limit: number = 10): Promise<User[]> {
        return await this.getMostActiveUsers(limit)
    }

    async findTopByFollowers(limit: number = 10): Promise<User[]> {
        return await this.getTopUsersByFollowers(limit)
    }

    // ===== MÉTODOS PRIVADOS =====

    private async validateCreateData(data: CreateUserData): Promise<void> {
        if (!data.name || data.name.trim().length < 2) {
            throw new Error("Nome deve ter pelo menos 2 caracteres")
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error("Email inválido")
        }

        if (!data.password || data.password.length < 6) {
            throw new Error("Senha deve ter pelo menos 6 caracteres")
        }

        const emailExists = await this.emailExists(data.email)
        if (emailExists) {
            throw new Error("Email já está em uso")
        }
    }

    private async validateUpdateData(data: UpdateUserData): Promise<void> {
        if (data.name && data.name.trim().length < 2) {
            throw new Error("Nome deve ter pelo menos 2 caracteres")
        }

        if (data.bio && data.bio.length > 500) {
            throw new Error("Bio deve ter no máximo 500 caracteres")
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }
}
