/**
 * Block User Use Case - Caso de uso para bloquear usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository } from "@/domain/user"

export interface BlockUserRequest {
    userId: string
    targetUserId: string
}

export interface BlockUserResponse {
    success: boolean
    blocked?: boolean
    error?: string
}

export class BlockUserUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(request: BlockUserRequest): Promise<BlockUserResponse> {
        try {
            // Validar dados de entrada
            const validationResult = await this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Verificar se já está bloqueado
            const isAlreadyBlocked = await this.userRepository.isBlocked(
                request.userId,
                request.targetUserId,
            )
            if (isAlreadyBlocked) {
                return {
                    success: false,
                    error: "Este usuário já está bloqueado",
                }
            }

            // Bloquear usuário
            const blocked = await this.userRepository.blockUser(
                request.userId,
                request.targetUserId,
            )
            if (!blocked) {
                return {
                    success: false,
                    error: "Erro ao bloquear usuário",
                }
            }

            // Se estava seguindo, parar de seguir automaticamente
            const isFollowing = await this.userRepository.isFollowing(
                request.userId,
                request.targetUserId,
            )
            if (isFollowing) {
                await this.userRepository.unfollowUser(request.userId, request.targetUserId)
            }

            return {
                success: true,
                blocked,
            }
        } catch (error: any) {
            console.error("Erro ao bloquear usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(
        request: BlockUserRequest,
    ): Promise<{ isValid: boolean; error?: string }> {
        // Verificar se o usuário está tentando bloquear a si mesmo
        if (request.userId === request.targetUserId) {
            return {
                isValid: false,
                error: "Você não pode bloquear a si mesmo",
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

        // Verificar se o usuário está ativo
        if (user.status?.blocked || user.status?.deleted) {
            return {
                isValid: false,
                error: "Usuário inativo não pode bloquear outros usuários",
            }
        }

        return { isValid: true }
    }
}
