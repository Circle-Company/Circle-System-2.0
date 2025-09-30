/**
 * Admin Block User Use Case - Caso de uso administrativo para bloquear usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserRole } from "@/domain/user"

import { UserService } from "../../services/user.service"

export interface AdminBlockUserRequest {
    userId: string
    adminId: string
    reason: string
    duration?: number // em dias, se não especificado, bloqueio permanente
}

export interface AdminBlockUserResponse {
    success: boolean
    user?: {
        id: string
        status: string
        blockedAt: Date
        blockedBy: string
        reason: string
        unblockAt?: Date
    }
    error?: string
}

export class AdminBlockUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: AdminBlockUserRequest): Promise<AdminBlockUserResponse> {
        try {
            // Verificar se o usuário é admin
            const isAdmin = await this.verifyAdminPermission(request.adminId)
            if (!isAdmin) {
                return {
                    success: false,
                    error: "Acesso negado. Apenas administradores podem bloquear usuários",
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

            // Verificar se já está bloqueado
            if (user.status === "blocked") {
                return {
                    success: false,
                    error: "Usuário já está bloqueado",
                }
            }

            // Bloquear usuário
            const updatedUser = await this.userService.updateStatus(
                request.userId,
                "blocked" as any,
            )
            if (!updatedUser) {
                return {
                    success: false,
                    error: "Erro ao bloquear usuário",
                }
            }

            // Registrar bloqueio no histórico (implementação pode variar)
            await this.recordBlockAction(request)

            return {
                success: true,
                user: {
                    id: updatedUser.id,
                    status: updatedUser.status,
                    blockedAt: new Date(),
                    blockedBy: request.adminId,
                    reason: request.reason,
                    unblockAt: request.duration
                        ? new Date(Date.now() + request.duration * 24 * 60 * 60 * 1000)
                        : undefined,
                },
            }
        } catch (error: any) {
            console.error("Erro ao bloquear usuário:", error)
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
        request: AdminBlockUserRequest,
    ): Promise<{ isValid: boolean; error?: string }> {
        // Validar razão
        if (!request.reason || request.reason.trim().length < 5) {
            return {
                isValid: false,
                error: "Razão do bloqueio deve ter pelo menos 5 caracteres",
            }
        }

        if (request.reason.length > 500) {
            return {
                isValid: false,
                error: "Razão do bloqueio deve ter no máximo 500 caracteres",
            }
        }

        // Validar duração se fornecida
        if (request.duration !== undefined && (request.duration < 1 || request.duration > 365)) {
            return {
                isValid: false,
                error: "Duração do bloqueio deve estar entre 1 e 365 dias",
            }
        }

        // Verificar se não está tentando bloquear a si mesmo
        if (request.userId === request.adminId) {
            return {
                isValid: false,
                error: "Não é possível bloquear a si mesmo",
            }
        }

        return { isValid: true }
    }

    private async recordBlockAction(request: AdminBlockUserRequest): Promise<void> {
        try {
            // Aqui você pode implementar a lógica para registrar o bloqueio
            // Por exemplo, salvar em uma tabela de histórico de ações administrativas
            console.log(
                `Admin ${request.adminId} bloqueou usuário ${request.userId}. Razão: ${request.reason}`,
            )
        } catch (error) {
            console.error("Erro ao registrar ação de bloqueio:", error)
        }
    }
}
