/**
 * Get User Use Case - Caso de uso para obter usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, User } from "@/domain/user"

export interface GetUserRequest {
    userId: string
    requestingUserId?: string // Para verificar permissões
    includeMetrics?: boolean
}

export interface GetUserResponse {
    success: boolean
    user?: User
    error?: string
}

export class GetUserUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(request: GetUserRequest): Promise<GetUserResponse> {
        try {
            // Buscar usuário
            const user = await this.userRepository.findById(request.userId)
            if (!user) {
                return {
                    success: false,
                    error: "Usuário não encontrado",
                }
            }

            // Verificar se o usuário pode visualizar o perfil
            const canView = await this.canViewUser(user, request.requestingUserId)
            if (!canView) {
                return {
                    success: false,
                    error: "Acesso negado ao perfil do usuário",
                }
            }

            return {
                success: true,
                user,
            }
        } catch (error: any) {
            console.error("Erro ao obter usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async canViewUser(user: User, requestingUserId?: string): Promise<boolean> {
        // Se não há usuário solicitante, permitir acesso público
        if (!requestingUserId) {
            return true
        }

        // Se é o próprio usuário, sempre pode ver
        if (requestingUserId === user.id) {
            return true
        }

        // Se o usuário está bloqueado, não pode ver
        const isBlocked = await this.userRepository.isBlocked(requestingUserId, user.id)
        if (isBlocked) {
            return false
        }

        // Por enquanto, permitir acesso público
        // TODO: Implementar verificação de privacidade quando necessário
        return true
    }
}
