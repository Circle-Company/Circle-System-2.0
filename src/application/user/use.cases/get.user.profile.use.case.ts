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

import {
    IUserMetricsRepository,
    IUserRepository,
    User,
    UserMetrics,
    UserProfilePicture,
} from "@/domain/user"

import { textLib } from "@/shared/circle.text.library"

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

export interface UserProfile {
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
    interactions: {
        isFollowing: boolean
        isFollowedBy: boolean
        isBlockedBy: boolean
        isBlocking: boolean
    }
}

export interface GetUserProfileRequest {
    userId: string
    requestingUserId?: string
}

export interface GetUserProfileResponse {
    success: boolean
    profile?: UserProfile
    error?: string
}

export interface UserRelationship {
    isFollowing: boolean
    isFollowedBy: boolean
    isBlocked: boolean
    isBlockedBy: boolean
}

// ===== USE CASE =====

export class GetUserProfileUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userMetricsRepository: IUserMetricsRepository,
    ) {}

    /**
     * Executa o caso de uso de obtenção de perfil de usuário
     */
    async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
        try {
            // Validar entrada
            const validationError = this._validateRequest(request)
            if (validationError) {
                return validationError
            }

            // Buscar e validar usuários
            const usersResult = await this._fetchAndValidateUsers(request)
            if (!usersResult.success) {
                return {
                    success: false,
                    error: "error" in usersResult ? usersResult.error : "Failed to fetch users",
                }
            }

            const { targetUser, requestingUser, targetUserMetrics } = usersResult

            // Incrementar contador de visualizações do perfil do usuário alvo (se métricas existirem)
            if (targetUserMetrics) {
                await this._incrementProfileViewCount(targetUserMetrics)
            }

            // Buscar informações de relacionamento em paralelo usando apenas funções do repositório
            const [isFollowing, isFollowedBy, isBlocking, isBlockedBy] = await Promise.all([
                // Verifica se o usuário solicitante está seguindo o usuário alvo
                this.userRepository.isFollowing(request.requestingUserId!, request.userId),
                // Verifica se o usuário alvo está seguindo o usuário solicitante (invertendo os parâmetros)
                this.userRepository.isFollowing(request.userId, request.requestingUserId!),
                // Verifica se o usuário solicitante bloqueou o usuário alvo
                this.userRepository.isBlocked(request.requestingUserId!, request.userId),
                // Verifica se o usuário alvo bloqueou o usuário solicitante (invertendo os parâmetros)
                this.userRepository.isBlocked(request.userId, request.requestingUserId!),
            ])

            // Verificar permissões de acesso usando as informações de relacionamento
            const accessError = this._checkAccessPermissions(
                targetUser!,
                requestingUser!,
                isFollowing,
            )
            if (accessError) {
                return accessError
            }

            // Construir objeto de relacionamento com tipagem forte
            const relationship: UserRelationship = {
                isFollowing,
                isFollowedBy,
                isBlocked: isBlocking,
                isBlockedBy,
            }

            // Construir perfil do usuário
            const userProfile = await this._formatProfile(targetUser!, relationship)

            return {
                success: true,
                profile: userProfile,
            }
        } catch (error: any) {
            console.error("Error getting user profile:", error)
            return {
                success: false,
                error: error.message || "Internal server error",
            }
        }
    }

    private _validateRequest(request: GetUserProfileRequest): GetUserProfileResponse | null {
        if (!request.requestingUserId) {
            return {
                success: false,
                error: "Requesting user ID is required",
            }
        }
        return null
    }

    private async _fetchAndValidateUsers(
        request: GetUserProfileRequest,
    ): Promise<
        | {
              success: true
              targetUser: User
              requestingUser: User
              targetUserMetrics: UserMetrics | null
          }
        | { success: false; error: string }
    > {
        // Buscar ambos usuários em paralelo
        const [targetUser, requestingUser, targetUserMetrics] = await Promise.all([
            this.userRepository.findById(request.userId),
            this.userRepository.findById(request.requestingUserId!),
            this.userMetricsRepository.findByUserId(request.userId),
        ])

        // Validar usuário alvo
        if (!targetUser) {
            return { success: false, error: "User not found" }
        }

        if (targetUser.isDeleted()) {
            return { success: false, error: "User profile not available" }
        }

        // Validar usuário solicitante
        if (!requestingUser) {
            return { success: false, error: "Requesting user not found" }
        }

        if (requestingUser.hasViewingRestrictions()) {
            return { success: false, error: "Access denied - user has viewing restrictions" }
        }

        return {
            success: true,
            targetUser,
            requestingUser,
            targetUserMetrics,
        }
    }

    private _checkAccessPermissions(
        targetUser: User,
        requestingUser: User,
        isFollowing: boolean,
    ): GetUserProfileResponse | null {
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

    private async _formatProfile(user: User, relationship: UserRelationship): Promise<UserProfile> {
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
            interactions: {
                isFollowing: relationship.isFollowing,
                isFollowedBy: relationship.isFollowedBy,
                isBlockedBy: relationship.isBlockedBy,
                isBlocking: relationship.isBlocked,
            },
        }
    }

    private async _incrementProfileViewCount(metrics: UserMetrics): Promise<void> {
        metrics.incrementReceivedMetrics({ viewsReceived: 1 })
        await this.userMetricsRepository.update(metrics)
    }
}
