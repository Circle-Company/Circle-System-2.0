/**
 * Unfollow User Use Case - Caso de uso para parar de seguir usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity } from "@/domain/user"
import { UserService } from "../services/user.service"

export interface UnfollowUserRequest {
    userId: string
    targetUserId: string
}

export interface UnfollowUserResponse {
    success: boolean
    unfollowed?: boolean
    error?: string
}

export class UnfollowUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: UnfollowUserRequest): Promise<UnfollowUserResponse> {
        try {
            // Validar dados de entrada
            const validationResult = await this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Verificar se está seguindo
            const isFollowing = await this.userService.isFollowing(request.userId, request.targetUserId)
            if (!isFollowing) {
                return {
                    success: false,
                    error: "Você não está seguindo este usuário",
                }
            }

            // Parar de seguir usuário
            const unfollowed = await this.userService.unfollowUser(request.userId, request.targetUserId)
            if (!unfollowed) {
                return {
                    success: false,
                    error: "Erro ao parar de seguir usuário",
                }
            }

            return {
                success: true,
                unfollowed,
            }
        } catch (error: any) {
            console.error("Erro ao parar de seguir usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(request: UnfollowUserRequest): Promise<{ isValid: boolean; error?: string }> {
        // Verificar se o usuário está tentando parar de seguir a si mesmo
        if (request.userId === request.targetUserId) {
            return {
                isValid: false,
                error: "Você não pode parar de seguir a si mesmo",
            }
        }

        // Verificar se o usuário existe
        const user = await this.userService.getUserById(request.userId)
        if (!user) {
            return {
                isValid: false,
                error: "Usuário não encontrado",
            }
        }

        // Verificar se o usuário alvo existe
        const targetUser = await this.userService.getUserById(request.targetUserId)
        if (!targetUser) {
            return {
                isValid: false,
                error: "Usuário alvo não encontrado",
            }
        }

        return { isValid: true }
    }
}
