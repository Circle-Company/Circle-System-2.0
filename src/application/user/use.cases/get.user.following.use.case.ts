/**
 * Get User Following Use Case - Caso de uso para obter usuários seguidos
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity } from "@/domain/user"

import { UserService } from "../services/user.service"

export interface GetUserFollowingRequest {
    userId: string
    requestingUserId?: string // Para verificar permissões
    limit?: number
    offset?: number
}

export interface GetUserFollowingResponse {
    success: boolean
    following?: UserEntity[]
    total?: number
    error?: string
}

export class GetUserFollowingUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: GetUserFollowingRequest): Promise<GetUserFollowingResponse> {
        try {
            // Validar dados de entrada
            const validationResult = await this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Verificar se pode visualizar seguindo
            const canView = await this.canViewFollowing(request.userId, request.requestingUserId)
            if (!canView) {
                return {
                    success: false,
                    error: "Acesso negado para visualizar seguindo",
                }
            }

            // Obter usuários seguidos
            const limit = Math.min(request.limit || 20, 100) // Máximo de 100 por vez
            const offset = request.offset || 0

            const following = await this.userService.getFollowing(request.userId, limit, offset)

            // Obter total de seguindo (implementação pode variar dependendo do repositório)
            let total = 0
            try {
                const user = await this.userService.getUserById(request.userId)
                total = user?.statistics?.followingCount || 0
            } catch (error) {
                console.warn("Erro ao obter total de seguindo:", error)
            }

            return {
                success: true,
                following,
                total,
            }
        } catch (error: any) {
            console.error("Erro ao obter seguindo:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(
        request: GetUserFollowingRequest,
    ): Promise<{ isValid: boolean; error?: string }> {
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

    private async canViewFollowing(userId: string, requestingUserId?: string): Promise<boolean> {
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
