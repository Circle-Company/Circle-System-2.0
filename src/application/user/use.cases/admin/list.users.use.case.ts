/**
 * Admin List Users Use Case - Caso de uso administrativo para listar usuários
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity, UserRole, UserStatusEnum } from "@/domain/user"

import { UserService } from "../../services/user.service"

export interface AdminListUsersRequest {
    adminId: string
    page?: number
    limit?: number
    status?: UserStatusEnum[]
    role?: UserRole[]
    search?: string
    sortBy?: "createdAt" | "updatedAt" | "lastActiveAt" | "followersCount" | "momentsCount"
    sortOrder?: "asc" | "desc"
    includeDeleted?: boolean
}

export interface AdminListUsersResponse {
    success: boolean
    users?: Array<{
        id: string
        name: string
        email: string
        role: string
        status: string
        createdAt: Date
        updatedAt: Date
        lastActiveAt?: Date
        statistics: {
            followersCount: number
            followingCount: number
            momentsCount: number
            totalLikes: number
            totalComments: number
        }
        subscription?: {
            isActive: boolean
            plan: string
        }
    }>
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    error?: string
}

export class AdminListUsersUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: AdminListUsersRequest): Promise<AdminListUsersResponse> {
        try {
            // Verificar se o usuário é admin
            const isAdmin = await this.verifyAdminPermission(request.adminId)
            if (!isAdmin) {
                return {
                    success: false,
                    error: "Acesso negado. Apenas administradores podem listar usuários",
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

            // Preparar filtros
            const filters = this.prepareFilters(request)

            // Preparar opções de ordenação
            const sortBy = request.sortBy || "createdAt"
            const sortOrder = request.sortOrder || "desc"

            // Preparar paginação
            const page = request.page || 1
            const limit = Math.min(request.limit || 20, 100) // Máximo de 100 por vez
            const offset = (page - 1) * limit

            // Buscar usuários
            const result = await this.userService.searchUsers(
                request.search || "",
                filters,
                { field: sortBy, direction: sortOrder },
                { page, limit, offset },
            )

            // Formatar usuários para resposta administrativa
            const formattedUsers = result.users.map((user) => this.formatUserForAdmin(user))

            return {
                success: true,
                users: formattedUsers,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                },
            }
        } catch (error: any) {
            console.error("Erro ao listar usuários:", error)
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
        request: AdminListUsersRequest,
    ): Promise<{ isValid: boolean; error?: string }> {
        // Validar paginação
        if (request.page !== undefined && request.page < 1) {
            return {
                isValid: false,
                error: "Página deve ser maior que 0",
            }
        }

        if (request.limit !== undefined && (request.limit < 1 || request.limit > 100)) {
            return {
                isValid: false,
                error: "Limite deve estar entre 1 e 100",
            }
        }

        // Validar busca
        if (request.search && request.search.length > 100) {
            return {
                isValid: false,
                error: "Termo de busca deve ter no máximo 100 caracteres",
            }
        }

        return { isValid: true }
    }

    private prepareFilters(request: AdminListUsersRequest): any {
        const filters: any = {}

        if (request.status && request.status.length > 0) {
            filters.status = request.status
        }

        if (request.role && request.role.length > 0) {
            filters.role = request.role
        }

        // Incluir usuários deletados se solicitado
        if (request.includeDeleted) {
            // Implementação pode variar dependendo do repositório
        }

        return filters
    }

    private formatUserForAdmin(user: UserEntity): any {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastActiveAt: user.updatedAt, // Assumindo que updatedAt é o último acesso
            statistics: {
                followersCount: user.statistics?.followersCount || 0,
                followingCount: user.statistics?.followingCount || 0,
                momentsCount: user.statistics?.momentsCount || 0,
                totalLikes: user.statistics?.totalLikes || 0,
                totalComments: user.statistics?.totalComments || 0,
            },
            subscription: user.subscription
                ? {
                      isActive: user.subscription.isActive || false,
                      plan: user.subscription.plan || "free",
                  }
                : undefined,
        }
    }
}
