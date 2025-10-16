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

import { IUserRepository, UserPreferences, UserRole, UserStatusEnum } from "../../../domain/user"

import { User } from "../../../domain/user/entities/user.entity"
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
export class UserService {
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
     * Obtém usuário por username
     */
    async getUserByUsername(username: string): Promise<User | null> {
        try {
            return await this.repository.findByUsername(username)
        } catch (error) {
            console.error("Erro ao obter usuário por username:", error)
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
            if (data.name) fieldsChanged.push("name")
            if (data.bio !== undefined) fieldsChanged.push("bio")
            if (data.profilePicture !== undefined) fieldsChanged.push("profilePicture")
            if (data.preferences) fieldsChanged.push("preferences")
            if (data.metadata) fieldsChanged.push("metadata")

            const updatedUser = await this.repository.update(user)

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
     * Bloqueia usuário
     */
    async blockUser(userId: string, blockedUserId: string): Promise<boolean> {
        try {
            if (!this.config.enableSocialFeatures) {
                throw new Error("Recursos sociais desabilitados")
            }

            const result = await this.repository.blockUser(userId, blockedUserId)

            if (result && this.config.enableMetrics) {
                await this.metricsService.recordSocialActivity(userId, "block", {
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
                await this.metricsService.recordSocialActivity(userId, "unblock", {
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
                await this.metricsService.recordSocialActivity(userId, "follow", {
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
                await this.metricsService.recordSocialActivity(userId, "unfollow", {
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
    async getFollowers(userId: string, limit: number = 20, offset: number = 0): Promise<User[]> {
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
    async getFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<User[]> {
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
    async getBlockedUsers(userId: string, limit: number = 20, offset: number = 0): Promise<User[]> {
        try {
            return await this.repository.getBlockedUsers(userId, limit, offset)
        } catch (error) {
            console.error("Erro ao obter usuários bloqueados:", error)
            return []
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

    // ===== MÉTODOS PRIVADOS =====

    private async validateUpdateData(data: UpdateUserData): Promise<void> {
        if (data.name && data.name.trim().length < 2) {
            throw new Error("Nome deve ter pelo menos 2 caracteres")
        }

        if (data.bio && data.bio.length > 500) {
            throw new Error("Bio deve ter no máximo 500 caracteres")
        }
    }
}
