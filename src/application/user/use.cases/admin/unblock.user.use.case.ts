/**
 * Admin Unblock User Use Case - Caso de uso administrativo para desbloquear usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserRole } from "@/domain/user"

import { UserService } from "../../services/user.service"

export interface AdminUnblockUserRequest {
    userId: string
    adminId: string
    reason?: string
}

export interface AdminUnblockUserResponse {
    success: boolean
    user?: {
        id: string
        status: string
        unblockedAt: Date
        unblockedBy: string
        reason?: string
    }
    error?: string
}

export class AdminUnblockUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: AdminUnblockUserRequest): Promise<AdminUnblockUserResponse> {
        try {
            // Verificar se o usuário é admin
            const isAdmin = await this.verifyAdminPermission(request.adminId)
            if (!isAdmin) {
                return {
                    success: false,
                    error: "Acesso negado. Apenas administradores podem desbloquear usuários",
                }
            }

            // Validar dados de entrada
            const validationResult = await this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Buscar usuário
            const user = await this.userService.getUserById(request.userId)
            if (!user) {
                return {
                    success: false,
                    error: "Usuário não encontrado",
                }
            }

            // Verificar se está bloqueado
            if (user.status !== "blocked") {
                return {
                    success: false,
                    error: "Usuário não está bloqueado",
                }
            }

            // Desbloquear usuário (voltar para ativo)
            const updatedUser = await this.userService.updateStatus(request.userId, "active" as any)
            if (!updatedUser) {
                return {
                    success: false,
                    error: "Erro ao desbloquear usuário",
                }
            }

            // Registrar desbloqueio no histórico
            await this.recordUnblockAction(request)

            return {
                success: true,
                user: {
                    id: updatedUser.id,
                    status: updatedUser.status,
                    unblockedAt: new Date(),
                    unblockedBy: request.adminId,
                    reason: request.reason,
                },
            }
        } catch (error: any) {
            console.error("Erro ao desbloquear usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async verifyAdminPermission(userId: string): Promise<boolean> {
        try {
            const user = await this.userService.getUserById(userId)
            return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN
        } catch (error) {
            console.error("Erro ao verificar permissões de admin:", error)
            return false
        }
    }

    private async validateRequest(
        request: AdminUnblockUserRequest,
    ): Promise<{ isValid: boolean; error?: string }> {
        // Validar razão se fornecida
        if (request.reason && request.reason.length > 500) {
            return {
                isValid: false,
                error: "Razão do desbloqueio deve ter no máximo 500 caracteres",
            }
        }

        return { isValid: true }
    }

    private async recordUnblockAction(request: AdminUnblockUserRequest): Promise<void> {
        try {
            // Aqui você pode implementar a lógica para registrar o desbloqueio
            console.log(
                `Admin ${request.adminId} desbloqueou usuário ${request.userId}. Razão: ${
                    request.reason || "Não especificada"
                }`,
            )
        } catch (error) {
            console.error("Erro ao registrar ação de desbloqueio:", error)
        }
    }
}
