/**
 * Follow User Use Case - Caso de uso para seguir usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository } from "@/domain/user"

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
    constructor(private readonly userRepository: IUserRepository) {}

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
            const isAlreadyFollowing = await this.userRepository.isFollowing(
                request.userId,
                request.targetUserId,
            )
            if (isAlreadyFollowing) {
                return {
                    success: true,
                    followed: true,
                }
            }

            // Verificar se o usuário alvo bloqueou o usuário ou vice-versa
            const isBlocked = await this.userRepository.isBlocked(
                request.userId,
                request.targetUserId,
            )
            if (isBlocked) {
                return {
                    success: false,
                    error: "Não é possível seguir este usuário",
                }
            }

            // Seguir usuário
            const followed = await this.userRepository.followUser(
                request.userId,
                request.targetUserId,
            )
            if (!followed) {
                return {
                    success: false,
                    error: "Erro ao seguir usuário",
                }
            }

            return {
                success: true,
                followed: true,
            }
        } catch (error: any) {
            console.error("Erro ao seguir usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(
        request: FollowUserRequest,
    ): Promise<{ isValid: boolean; error?: string }> {
        // Verificar se o usuário está tentando seguir a si mesmo
        if (request.userId === request.targetUserId) {
            return {
                isValid: false,
                error: "Você não pode seguir a si mesmo",
            }
        }

        // Verificar se o usuário existe
        const user = await this.userRepository.findById(request.userId)
        if (!user) {
            return {
                isValid: false,
                error: "Usuário não encontrado",
            }
        }

        // Verificar se o usuário alvo existe
        const targetUser = await this.userRepository.findById(request.targetUserId)
        if (!targetUser) {
            return {
                isValid: false,
                error: "Usuário alvo não encontrado",
            }
        }

        // Verificar se o usuário está bloqueado
        if (user.status?.blocked) {
            return {
                isValid: false,
                error: "Usuário bloqueado não pode seguir outros usuários",
            }
        }

        // Verificar se o usuário foi deletado
        if (user.status?.deleted) {
            return {
                isValid: false,
                error: "Usuário deletado não pode seguir outros usuários",
            }
        }

        // Verificar se o usuário alvo está bloqueado
        if (targetUser.status?.blocked) {
            return {
                isValid: false,
                error: "Não é possível seguir um usuário bloqueado",
            }
        }

        // Verificar se o usuário alvo foi deletado
        if (targetUser.status?.deleted) {
            return {
                isValid: false,
                error: "Não é possível seguir um usuário deletado",
            }
        }

        return { isValid: true }
    }
}
