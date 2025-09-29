/**
 * Search Users Use Case - Caso de uso para buscar usuários
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity, UserStatusEnum, UserRole } from "@/domain/user"
import { UserService } from "../services/user.service"

export interface SearchUsersRequest {
    query: string
    requestingUserId?: string // Para verificar permissões e filtros
    filters?: {
        status?: UserStatusEnum[]
        role?: UserRole[]
        isPremium?: boolean
        location?: {
            latitude: number
            longitude: number
            radius: number // em km
        }
        dateRange?: {
            start: Date
            end: Date
        }
        followersRange?: {
            min: number
            max: number
        }
        activityRange?: {
            min: number
            max: number
        }
    }
    sortBy?: {
        field: "createdAt" | "updatedAt" | "lastActiveAt" | "followersCount" | "momentsCount" | "engagement" | "relevance"
        direction: "asc" | "desc"
    }
    pagination?: {
        page?: number
        limit?: number
        offset?: number
    }
}

export interface SearchUsersResponse {
    success: boolean
    users?: UserEntity[]
    total?: number
    page?: number
    limit?: number
    hasNext?: boolean
    hasPrev?: boolean
    error?: string
}

export class SearchUsersUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: SearchUsersRequest): Promise<SearchUsersResponse> {
        try {
            // Validar dados de entrada
            const validationResult = await this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Preparar filtros
            const searchFilters = await this.prepareFilters(request.filters, request.requestingUserId)
            
            // Preparar opções de ordenação
            const sortOptions = {
                field: request.sortBy?.field || "relevance",
                direction: request.sortBy?.direction || "desc",
            }

            // Preparar paginação
            const paginationOptions = {
                page: request.pagination?.page || 1,
                limit: Math.min(request.pagination?.limit || 20, 100), // Máximo de 100 por vez
                offset: request.pagination?.offset,
            }

            // Buscar usuários
            const result = await this.userService.searchUsers(
                request.query,
                searchFilters,
                sortOptions,
                paginationOptions,
            )

            // Filtrar usuários que o usuário solicitante não pode ver
            const filteredUsers = await this.filterVisibleUsers(result.users, request.requestingUserId)

            return {
                success: true,
                users: filteredUsers,
                total: result.total,
                page: result.page,
                limit: result.limit,
                hasNext: result.hasNext,
                hasPrev: result.hasPrev,
            }
        } catch (error: any) {
            console.error("Erro ao buscar usuários:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(request: SearchUsersRequest): Promise<{ isValid: boolean; error?: string }> {
        // Validar query
        if (!request.query || request.query.trim().length < 1) {
            return {
                isValid: false,
                error: "Query de busca é obrigatória",
            }
        }

        if (request.query.length > 100) {
            return {
                isValid: false,
                error: "Query de busca deve ter no máximo 100 caracteres",
            }
        }

        // Validar paginação
        if (request.pagination?.page && request.pagination.page < 1) {
            return {
                isValid: false,
                error: "Página deve ser maior que 0",
            }
        }

        if (request.pagination?.limit && (request.pagination.limit < 1 || request.pagination.limit > 100)) {
            return {
                isValid: false,
                error: "Limite deve estar entre 1 e 100",
            }
        }

        if (request.pagination?.offset && request.pagination.offset < 0) {
            return {
                isValid: false,
                error: "Offset deve ser maior ou igual a 0",
            }
        }

        // Validar filtros de localização
        if (request.filters?.location) {
            const { latitude, longitude, radius } = request.filters.location
            if (latitude < -90 || latitude > 90) {
                return {
                    isValid: false,
                    error: "Latitude deve estar entre -90 e 90",
                }
            }

            if (longitude < -180 || longitude > 180) {
                return {
                    isValid: false,
                    error: "Longitude deve estar entre -180 e 180",
                }
            }

            if (radius < 0 || radius > 1000) {
                return {
                    isValid: false,
                    error: "Raio deve estar entre 0 e 1000 km",
                }
            }
        }

        // Validar filtros de data
        if (request.filters?.dateRange) {
            const { start, end } = request.filters.dateRange
            if (start >= end) {
                return {
                    isValid: false,
                    error: "Data de início deve ser anterior à data de fim",
                }
            }
        }

        // Validar filtros de seguidores
        if (request.filters?.followersRange) {
            const { min, max } = request.filters.followersRange
            if (min < 0 || max < 0) {
                return {
                    isValid: false,
                    error: "Número de seguidores deve ser maior ou igual a 0",
                }
            }

            if (min > max) {
                return {
                    isValid: false,
                    error: "Mínimo de seguidores deve ser menor ou igual ao máximo",
                }
            }
        }

        return { isValid: true }
    }

    private async prepareFilters(filters: SearchUsersRequest["filters"], requestingUserId?: string): Promise<any> {
        const searchFilters: any = {}

        if (filters?.status) {
            searchFilters.status = filters.status
        }

        if (filters?.role) {
            searchFilters.role = filters.role
        }

        if (filters?.isPremium !== undefined) {
            searchFilters.isPremium = filters.isPremium
        }

        if (filters?.location) {
            searchFilters.location = filters.location
        }

        if (filters?.dateRange) {
            searchFilters.dateRange = filters.dateRange
        }

        if (filters?.followersRange) {
            searchFilters.followersRange = filters.followersRange
        }

        if (filters?.activityRange) {
            searchFilters.activityRange = filters.activityRange
        }

        // Se não há usuário solicitante ou não é admin, filtrar apenas usuários ativos
        if (!requestingUserId) {
            searchFilters.status = ["active"]
        } else {
            const requestingUser = await this.userService.getUserById(requestingUserId)
            if (!requestingUser || !["admin", "super_admin"].includes(requestingUser.role)) {
                searchFilters.status = ["active"]
            }
        }

        return searchFilters
    }

    private async filterVisibleUsers(users: UserEntity[], requestingUserId?: string): Promise<UserEntity[]> {
        if (!requestingUserId) {
            // Se não há usuário solicitante, mostrar apenas usuários públicos
            return users.filter(user => 
                user.preferences?.privacy?.profileVisibility === "public"
            )
        }

        const visibleUsers: UserEntity[] = []

        for (const user of users) {
            // Verificar se pode visualizar o usuário
            const canView = await this.canViewUser(user, requestingUserId)
            if (canView) {
                visibleUsers.push(user)
            }
        }

        return visibleUsers
    }

    private async canViewUser(user: UserEntity, requestingUserId: string): Promise<boolean> {
        // Se é o próprio usuário, sempre pode ver
        if (requestingUserId === user.id) {
            return true
        }

        // Se o usuário está bloqueado, não pode ver
        const isBlocked = await this.userService.isBlocked(requestingUserId, user.id)
        if (isBlocked) {
            return false
        }

        // Verificar configurações de privacidade
        const visibility = user.preferences?.privacy?.profileVisibility || "public"
        
        switch (visibility) {
            case "public":
                return true
            case "friends":
                // Verificar se são amigos/seguindo
                const isFollowing = await this.userService.isFollowing(requestingUserId, user.id)
                return isFollowing
            case "private":
                return false
            default:
                return true
        }
    }
}
