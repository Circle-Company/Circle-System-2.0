/**
 * Get User Profile Use Case
 *
 * Caso de uso responsável por buscar e retornar o perfil completo de um usuário,
 * incluindo seus moments publicados e informações de relacionamento.
 *
 * Features:
 * - Verificações de segurança em múltiplas camadas
 * - Filtro automático de conteúdo publicado
 * - Suporte a timezone do usuário
 * - Formatação de texto enriquecido
 * - Controle de privacidade e bloqueios
 *
 * @author Circle System Team
 * @version 2.0.0
 */

import { IUserRepository, TimezoneCode, User, UserProfilePicture } from "@/domain/user"
import { Timezone, textLib } from "@/shared/circle.text.library"

export interface Moment {
    id: string
    media: {
        urls: {
            high: string
            medium: string
        }
    }
    thumbnail: {
        url: string
    }
    description: string | null
    richDescription: string | null
    hashtags: string[]
    createdAt: Date
}

export interface UserAccount {
    id: string
    username: string
    name: string | null
    description: string | null
    richDescription: string | null
    profilePicture: Partial<UserProfilePicture> | null
    status: {
        verified: boolean
    }
    metrics: {
        totalMomentsCreated: number
        totalFollowers: number
    }
}

export interface GetUserAccountResponse {
    success: boolean
    account?: UserAccount
    error?: string
}

export interface UserRelationship {
    isFollowing: boolean
    isFollowedBy: boolean
    isBlocked: boolean
    isBlockedBy: boolean
}

// ===== USE CASE =====

export class GetUserAccountUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    /**
     * Executa o caso de uso de obtenção de perfil de usuário
     */
    async execute(userId: string): Promise<GetUserAccountResponse> {
        try {
            // Validar entrada
            const validationError = this.validateRequest(userId)
            if (validationError) {
                return validationError
            }

            // Buscar e validar usuário
            const userResult = await this.fetchAndValidateUser(userId)
            if (!userResult.success) {
                return {
                    success: false,
                    error: userResult.error,
                }
            }

            // Construir conta do usuário
            const userAccount = await this.buildAccount(userResult.user)

            return {
                success: true,
                account: userAccount,
            }
        } catch (error: any) {
            console.error("Error getting user account:", error)
            return {
                success: false,
                error: error.message || "Internal server error",
            }
        }
    }

    // ===== MÉTODOS PRIVADOS DE VALIDAÇÃO =====

    /**
     * Valida os dados de entrada da requisição
     */
    private validateRequest(userId: string): GetUserAccountResponse | null {
        if (userId) {
            return {
                success: false,
                error: "User ID is required",
            }
        }
        return null
    }

    /**
     * Busca e valida o usuário
     */
    private async fetchAndValidateUser(
        userId: string,
    ): Promise<{ success: true; user: User } | { success: false; error: string }> {
        // Buscar o usuário
        const user = await this.userRepository.findById(userId)
        if (!user) {
            return { success: false, error: "User not found" }
        }

        if (user.hasViewingRestrictions()) {
            return { success: false, error: "Access denied - user has viewing restrictions" }
        }

        return {
            success: true,
            user,
        }
    }

    /**
     * Verifica permissões de acesso ao perfil usando método da entidade User
     */
    private checkAccessPermissions(
        targetUser: User,
        requestingUser: User,
        isFollowing: boolean,
    ): GetUserAccountResponse | null {
        // Usar o método da entidade User para verificar se pode visualizar o perfil
        const canView = requestingUser.canViewProfile(targetUser, isFollowing)

        if (!canView) {
            return {
                success: false,
                error: "Access denied to user profile",
            }
        }

        return null
    }

    /**
     * Calcula a data de última publicação com timezone do usuário
     */
    private calculateLastPublishedAt(moments: Moment[], timezoneCode?: TimezoneCode): Date | null {
        if (moments.length === 0) {
            return null
        }

        // Já está ordenado por mais recente, pegar o primeiro
        const mostRecentMoment = moments[0]
        const lastPublishedAt = mostRecentMoment.createdAt

        // Converter para timezone local do usuário se fornecido
        if (timezoneCode) {
            const tz = new Timezone()
            tz.setLocalTimezone(timezoneCode)
            return tz.UTCToLocal(lastPublishedAt)
        }

        return lastPublishedAt
    }

    // ===== MÉTODOS PRIVADOS DE CONSTRUÇÃO DE RESPOSTA =====

    /**
     * Constrói o objeto UserProfile completo
     */
    private async buildAccount(user: User): Promise<UserAccount> {
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            description: user.description,
            richDescription: user.description
                ? textLib.rich.formatToEnriched(user.description)
                : null,
            profilePicture: user.profilePicture || null,
            status: {
                verified: user.isVerified(),
            },
            metrics: {
                totalMomentsCreated: user.metrics?.totalMomentsCreated || 0,
                totalFollowers: user.metrics?.totalFollowers || 0,
            },
        }
    }
}
