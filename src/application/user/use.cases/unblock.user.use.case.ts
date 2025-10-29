/**
 * Unblock User Use Case - Caso de uso para desbloquear usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository } from "@/domain/user"

export interface UnblockUserRequest {
    userId: string
    targetUserId: string
}

export interface UnblockUserResponse {
    success: boolean
    unblocked?: boolean
    error?: string
}

export class UnblockUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(request: UnblockUserRequest): Promise<UnblockUserResponse> {
        try {
            // Validar dados de entrada
            const validationResult = await this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Verificar se está bloqueado
            const isBlocked = await this.userRepository.isBlocked(request.userId, request.targetUserId)
            if (!isBlocked) {
                return {
                    success: false,
                    error: "Este usuário não está bloqueado",
                }
            }

            // Desbloquear usuário
            const unblocked = await this.userRepository.unblockUser(
                request.userId,
                request.targetUserId,
            )
            if (!unblocked) {
                return {
                    success: false,
                    error: "Erro ao desbloquear usuário",
                }
            }

            return {
                success: true,
                unblocked,
            }
        } catch (error: any) {
            console.error("Erro ao desbloquear usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(
        request: UnblockUserRequest,
    ): Promise<{ isValid: boolean; error?: string }> {
        // Verificar se o usuário está tentando desbloquear a si mesmo
        if (request.userId === request.targetUserId) {
            return {
                isValid: false,
                error: "Você não pode desbloquear a si mesmo",
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

        return { isValid: true }
    }
}
