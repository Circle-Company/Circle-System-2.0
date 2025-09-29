/**
 * Get User Followers Use Case - Caso de uso para obter seguidores do usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity } from "@/domain/user"
import { UserService } from "../services/user.service"

export interface GetUserFollowersRequest {
    userId: string
    requestingUserId?: string // Para verificar permissões
    limit?: number
    offset?: number
}

export interface GetUserFollowersResponse {
    success: boolean
    followers?: UserEntity[]
    total?: number
    error?: string
}

export class GetUserFollowersUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: GetUserFollowersRequest): Promise<GetUserFollowersResponse> {
        try {
            // Validar dados de entrada
            const validationResult = await this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Verificar se pode visualizar seguidores
            const canView = await this.canViewFollowers(request.userId, request.requestingUserId)
            if (!canView) {
                return {
                    success: false,
                    error: "Acesso negado para visualizar seguidores",
                }
            }

            // Obter seguidores
            const limit = Math.min(request.limit || 20, 100) // Máximo de 100 por vez
            const offset = request.offset || 0

            const followers = await this.userService.getFollowers(request.userId, limit, offset)

            // Obter total de seguidores (implementação pode variar dependendo do repositório)
            let total = 0
            try {
                const user = await this.userService.getUserById(request.userId)
                total = user?.statistics?.followersCount || 0
            } catch (error) {
                console.warn("Erro ao obter total de seguidores:", error)
            }

            return {
                success: true,
                followers,
                total,
            }
        } catch (error: any) {
            console.error("Erro ao obter seguidores:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(request: GetUserFollowersRequest): Promise<{ isValid: boolean; error?: string }> {
        // Verificar se o usuário existe
        const user = await this.userService.getUserById(request.userId)
        if (!user) {
            return {
                isValid: false,
                error: "Usuário não encontrado",
            }
        }

        // Validar limites
        if (request.limit && (request.limit < 1 || request.limit > 100)) {
            return {
                isValid: false,
                error: "Limite deve estar entre 1 e 100",
            }
        }

        if (request.offset && request.offset < 0) {
            return {
                isValid: false,
                error: "Offset deve ser maior ou igual a 0",
            }
        }

        return { isValid: true }
    }

    private async canViewFollowers(userId: string, requestingUserId?: string): Promise<boolean> {
        // Se não há usuário solicitante, verificar configurações de privacidade
        if (!requestingUserId) {
            const user = await this.userService.getUserById(userId)
            return user?.preferences?.privacy?.profileVisibility === "public"
        }

        // Se é o próprio usuário, sempre pode ver
        if (requestingUserId === userId) {
            return true
        }

        // Se o usuário está bloqueado, não pode ver
        const isBlocked = await this.userService.isBlocked(requestingUserId, userId)
        if (isBlocked) {
            return false
        }

        // Verificar configurações de privacidade
        const user = await this.userService.getUserById(userId)
        if (!user) return false

        const visibility = user.preferences?.privacy?.profileVisibility || "public"
        
        switch (visibility) {
            case "public":
                return true
            case "friends":
                // Verificar se são amigos/seguindo
                const isFollowing = await this.userService.isFollowing(requestingUserId, userId)
                return isFollowing
            case "private":
                return false
            default:
                return true
        }
    }
}
