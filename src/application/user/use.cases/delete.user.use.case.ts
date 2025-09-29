/**
 * Delete User Use Case - Caso de uso para deletar usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity, UserRole } from "@/domain/user"
import { UserService } from "../services/user.service"

export interface DeleteUserRequest {
    userId: string
    requestingUserId: string // Quem está fazendo a exclusão
    reason?: string
    permanent?: boolean // Se true, deleta permanentemente; se false, apenas desativa
}

export interface DeleteUserResponse {
    success: boolean
    deleted?: boolean
    error?: string
}

export class DeleteUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: DeleteUserRequest): Promise<DeleteUserResponse> {
        try {
            // Verificar se o usuário pode deletar
            const canDelete = await this.canDeleteUser(request.userId, request.requestingUserId)
            if (!canDelete) {
                return {
                    success: false,
                    error: "Acesso negado para deletar este usuário",
                }
            }

            // Buscar usuário para verificar se existe
            const user = await this.userService.getUserById(request.userId)
            if (!user) {
                return {
                    success: false,
                    error: "Usuário não encontrado",
                }
            }

            // Verificar se é uma exclusão permanente ou apenas desativação
            let deleted = false
            if (request.permanent) {
                // Exclusão permanente
                deleted = await this.userService.deleteUser(request.userId, request.reason)
            } else {
                // Apenas desativar o usuário
                await this.userService.updateStatus(request.userId, "inactive" as any)
                deleted = true
            }

            if (deleted) {
                console.log(`Usuário ${request.userId} ${request.permanent ? "deletado permanentemente" : "desativado"}. Razão: ${request.reason || "Não especificada"}`)
            }

            return {
                success: true,
                deleted,
            }
        } catch (error: any) {
            console.error("Erro ao deletar usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async canDeleteUser(userId: string, requestingUserId: string): Promise<boolean> {
        // O próprio usuário pode deletar sua conta
        if (userId === requestingUserId) {
            return true
        }

        // Verificar se o usuário solicitante é admin
        const requestingUser = await this.userService.getUserById(requestingUserId)
        if (!requestingUser) {
            return false
        }

        // Apenas admins podem deletar outros usuários
        return requestingUser.role === UserRole.ADMIN || requestingUser.role === UserRole.SUPER_ADMIN
    }
}
