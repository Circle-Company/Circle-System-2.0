/**
 * Admin Delete User Use Case - Caso de uso administrativo para deletar usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity, UserRole } from "@/domain/user"
import { UserService } from "../../services/user.service"

export interface AdminDeleteUserRequest {
    userId: string
    adminId: string
    reason: string
    permanent?: boolean // Se true, deleta permanentemente; se false, apenas desativa
}

export interface AdminDeleteUserResponse {
    success: boolean
    deleted?: boolean
    error?: string
}

export class AdminDeleteUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: AdminDeleteUserRequest): Promise<AdminDeleteUserResponse> {
        try {
            // Verificar se o usuário é admin
            const isAdmin = await this.verifyAdminPermission(request.adminId)
            if (!isAdmin) {
                return {
                    success: false,
                    error: "Acesso negado. Apenas administradores podem deletar usuários",
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

            // Verificar se não está tentando deletar outro admin
            const canDelete = await this.canDeleteUser(user, request.adminId)
            if (!canDelete) {
                return {
                    success: false,
                    error: "Não é possível deletar este usuário",
                }
            }

            // Deletar usuário
            const deleted = await this.userService.deleteUser(request.userId, request.reason)
            if (!deleted) {
                return {
                    success: false,
                    error: "Erro ao deletar usuário",
                }
            }

            // Registrar ação de exclusão
            await this.recordDeleteAction(request)

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

    private async verifyAdminPermission(userId: string): Promise<boolean> {
        try {
            const user = await this.userService.getUserById(userId)
            return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN
        } catch (error) {
            console.error("Erro ao verificar permissões de admin:", error)
            return false
        }
    }

    private async canDeleteUser(user: UserEntity, adminId: string): Promise<boolean> {
        // Não pode deletar a si mesmo
        if (user.id === adminId) {
            return false
        }

        // Apenas super_admin pode deletar outros admins
        const admin = await this.userService.getUserById(adminId)
        if (!admin) {
            return false
        }

        if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
            return admin.role === UserRole.SUPER_ADMIN
        }

        return true
    }

    private async validateRequest(request: AdminDeleteUserRequest): Promise<{ isValid: boolean; error?: string }> {
        // Validar razão
        if (!request.reason || request.reason.trim().length < 5) {
            return {
                isValid: false,
                error: "Razão da exclusão deve ter pelo menos 5 caracteres",
            }
        }

        if (request.reason.length > 500) {
            return {
                isValid: false,
                error: "Razão da exclusão deve ter no máximo 500 caracteres",
            }
        }

        return { isValid: true }
    }

    private async recordDeleteAction(request: AdminDeleteUserRequest): Promise<void> {
        try {
            // Aqui você pode implementar a lógica para registrar a exclusão
            console.log(`Admin ${request.adminId} deletou usuário ${request.userId}. Razão: ${request.reason}`)
        } catch (error) {
            console.error("Erro ao registrar ação de exclusão:", error)
        }
    }
}
