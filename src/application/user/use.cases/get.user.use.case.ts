/**
 * Get User Use Case - Caso de uso para obter usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity } from "@/domain/user"
import { UserService } from "../services/user.service"

export interface GetUserRequest {
    userId: string
    requestingUserId?: string // Para verificar permissões
    includeMetrics?: boolean
}

export interface GetUserResponse {
    success: boolean
    user?: UserEntity
    error?: string
}

export class GetUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: GetUserRequest): Promise<GetUserResponse> {
        try {
            // Buscar usuário
            const user = await this.userService.getUserById(request.userId)
            if (!user) {
                return {
                    success: false,
                    error: "Usuário não encontrado",
                }
            }

            // Verificar se o usuário pode visualizar o perfil
            const canView = await this.canViewUser(user, request.requestingUserId)
            if (!canView) {
                return {
                    success: false,
                    error: "Acesso negado ao perfil do usuário",
                }
            }

            // Se incluir métricas, buscar dados adicionais
            let userWithMetrics = user
            if (request.includeMetrics && request.requestingUserId === request.userId) {
                // Apenas o próprio usuário pode ver suas métricas
                const metrics = await this.userService.getAggregatedMetrics([request.userId])
                if (metrics) {
                    // Adicionar métricas ao objeto do usuário se necessário
                    userWithMetrics = { ...user, metrics } as UserEntity
                }
            }

            return {
                success: true,
                user: userWithMetrics,
            }
        } catch (error: any) {
            console.error("Erro ao obter usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async canViewUser(user: UserEntity, requestingUserId?: string): Promise<boolean> {
        // Se não há usuário solicitante, verificar configurações de privacidade
        if (!requestingUserId) {
            return user.preferences?.privacy?.profileVisibility === "public"
        }

        // Se é o próprio usuário, sempre pode ver
        if (requestingUserId === user.id) {
            return true
        }

        // Se o usuário está bloqueado, não pode ver
        const isBlocked = await this.userService.isBlocked(requestingUserId, user.id)
        if (isBlocked) {
            return false
        }

        // Verificar configurações de privacidade
        const visibility = user.preferences?.privacy?.profileVisibility || "public"
        
        switch (visibility) {
            case "public":
                return true
            case "friends":
                // Verificar se são amigos/seguindo
                const isFollowing = await this.userService.isFollowing(requestingUserId, user.id)
                return isFollowing
            case "private":
                return false
            default:
                return true
        }
    }
}
