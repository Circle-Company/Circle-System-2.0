/**
 * Follow User Use Case - Caso de uso para seguir usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity } from "@/domain/user"
import { UserService } from "../services/user.service"

export interface FollowUserRequest {
    userId: string
    targetUserId: string
}

export interface FollowUserResponse {
    success: boolean
    followed?: boolean
    error?: string
}

export class FollowUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: FollowUserRequest): Promise<FollowUserResponse> {
        try {
            // Validar dados de entrada
            const validationResult = await this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Verificar se já está seguindo
            const isAlreadyFollowing = await this.userService.isFollowing(request.userId, request.targetUserId)
            if (isAlreadyFollowing) {
                return {
                    success: false,
                    error: "Você já está seguindo este usuário",
                }
            }

            // Verificar se o usuário alvo bloqueou o usuário
            const isBlocked = await this.userService.isBlocked(request.userId, request.targetUserId)
            if (isBlocked) {
                return {
                    success: false,
                    error: "Não é possível seguir este usuário",
                }
            }

            // Seguir usuário
            const followed = await this.userService.followUser(request.userId, request.targetUserId)
            if (!followed) {
                return {
                    success: false,
                    error: "Erro ao seguir usuário",
                }
            }

            return {
                success: true,
                followed,
            }
        } catch (error: any) {
            console.error("Erro ao seguir usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(request: FollowUserRequest): Promise<{ isValid: boolean; error?: string }> {
        // Verificar se o usuário está tentando seguir a si mesmo
        if (request.userId === request.targetUserId) {
            return {
                isValid: false,
                error: "Você não pode seguir a si mesmo",
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

        // Verificar se o usuário está ativo
        if (user.status !== "active") {
            return {
                isValid: false,
                error: "Usuário inativo não pode seguir outros usuários",
            }
        }

        // Verificar se o usuário alvo está ativo
        if (targetUser.status !== "active") {
            return {
                isValid: false,
                error: "Não é possível seguir um usuário inativo",
            }
        }

        return { isValid: true }
    }
}
