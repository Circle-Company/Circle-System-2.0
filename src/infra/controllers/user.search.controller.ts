import {
    GetSearchSuggestionsRequest,
    GetSearchSuggestionsUseCase,
} from "@/application/user.search.engine/use.cases/get.search.suggestions.use.case"
import {
    SearchUsersRequest,
    SearchUsersUseCase,
} from "@/application/user.search.engine/use.cases/search.users.use.case"
import { SearchErrorType } from "@/domain/user.search.engine/types"
import { Request, Response } from "express"

/**
 * User Search Controller
 *
 * Controller responsável por gerenciar as requisições HTTP relacionadas
 * à busca de usuários.
 */
export class UserSearchController {
    constructor(
        private readonly searchUsersUseCase: SearchUsersUseCase,
        private readonly getSuggestionsUseCase: GetSearchSuggestionsUseCase,
    ) {}

    /**
     * Endpoint para buscar usuários
     * POST /api/user-search/search
     */
    async searchUsers(req: Request, res: Response): Promise<void> {
        try {
            // Extrai dados da requisição
            const {
                searchTerm,
                searchType = "all",
                filters = {},
                pagination = {},
                sorting = {},
                searchContext = "discovery",
            } = req.body

            // Extrai informações de segurança do contexto
            const securityContext = {
                userId: req.user?.id || (req.headers["x-user-id"] as string),
                ipAddress: req.ip || req.connection.remoteAddress || "",
                userAgent: req.headers["user-agent"] || "",
                sessionId: req.headers["x-session-id"] as string,
                permissions: req.user?.permissions || [],
            }

            // Validação básica
            if (!searchTerm || typeof searchTerm !== "string") {
                res.status(400).json({
                    success: false,
                    error: {
                        type: SearchErrorType.VALIDATION_ERROR,
                        message: "Search term é obrigatório",
                        code: SearchErrorType.VALIDATION_ERROR,
                        timestamp: new Date(),
                    },
                })
                return
            }

            if (!securityContext.userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        type: SearchErrorType.PERMISSION_DENIED,
                        message: "Usuário não autenticado",
                        code: SearchErrorType.PERMISSION_DENIED,
                        timestamp: new Date(),
                    },
                })
                return
            }

            // Monta request para o caso de uso
            const searchRequest: SearchUsersRequest = {
                searchTerm: searchTerm.trim(),
                searcherUserId: securityContext.userId,
                searchType,
                filters: {
                    includeVerified: filters.includeVerified,
                    includeUnverified: filters.includeUnverified,
                    includeBlocked: filters.includeBlocked,
                    includeMuted: filters.includeMuted,
                    minFollowers: filters.minFollowers,
                    maxFollowers: filters.maxFollowers,
                    minEngagementRate: filters.minEngagementRate,
                    maxEngagementRate: filters.maxEngagementRate,
                    maxDistance: filters.maxDistance,
                    preferredHashtags: filters.preferredHashtags,
                    excludeUserIds: filters.excludeUserIds,
                },
                pagination: {
                    limit: Math.min(pagination.limit || 20, 100),
                    offset: Math.max(pagination.offset || 0, 0),
                },
                sorting: {
                    field: sorting.field || "relevance",
                    direction: sorting.direction || "desc",
                },
                searchContext,
                securityContext,
            }

            // Executa busca
            const result = await this.searchUsersUseCase.execute(searchRequest)

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.data,
                    queryId: result.queryId,
                    timestamp: new Date(),
                })
            } else {
                const statusCode = this.getErrorStatusCode(result.error?.type)
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    queryId: result.queryId,
                    timestamp: new Date(),
                })
            }
        } catch (error) {
            console.error("Erro no controller de busca de usuários:", error)

            res.status(500).json({
                success: false,
                error: {
                    type: SearchErrorType.INTERNAL_ERROR,
                    message: "Erro interno do servidor",
                    code: SearchErrorType.INTERNAL_ERROR,
                    timestamp: new Date(),
                },
            })
        }
    }

    /**
     * Endpoint para obter sugestões de busca
     * GET /api/user-search/suggestions
     */
    async getSearchSuggestions(req: Request, res: Response): Promise<void> {
        try {
            const { term, limit = 10, context = "discovery" } = req.query

            // Extrai informações do usuário
            const userId = req.user?.id || (req.headers["x-user-id"] as string)

            // Validação
            if (!term || typeof term !== "string") {
                res.status(400).json({
                    success: false,
                    error: {
                        type: SearchErrorType.VALIDATION_ERROR,
                        message: "Termo de busca é obrigatório",
                        code: SearchErrorType.VALIDATION_ERROR,
                        timestamp: new Date(),
                    },
                })
                return
            }

            // Monta request para o caso de uso
            const suggestionRequest: GetSearchSuggestionsRequest = {
                partialTerm: term.trim(),
                userId,
                limit: Math.min(parseInt(limit as string) || 10, 50),
                context: context as any,
                includePopular: req.query.includePopular !== "false",
                includeUserHistory: req.query.includeUserHistory === "true",
                includeTrending: req.query.includeTrending === "true",
            }

            // Executa busca de sugestões
            const result = await this.getSuggestionsUseCase.execute(suggestionRequest)

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.data,
                    timestamp: new Date(),
                })
            } else {
                const statusCode = this.getErrorStatusCode(result.error?.type)
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date(),
                })
            }
        } catch (error) {
            console.error("Erro no controller de sugestões:", error)

            res.status(500).json({
                success: false,
                error: {
                    type: SearchErrorType.INTERNAL_ERROR,
                    message: "Erro interno do servidor",
                    code: SearchErrorType.INTERNAL_ERROR,
                    timestamp: new Date(),
                },
            })
        }
    }

    /**
     * Endpoint para buscar usuários relacionados
     * GET /api/user-search/related
     */
    async searchRelatedUsers(req: Request, res: Response): Promise<void> {
        try {
            const { searchTerm, limit = 10 } = req.query
            const userId = req.user?.id || (req.headers["x-user-id"] as string)

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        type: SearchErrorType.PERMISSION_DENIED,
                        message: "Usuário não autenticado",
                        code: SearchErrorType.PERMISSION_DENIED,
                        timestamp: new Date(),
                    },
                })
                return
            }

            const searchRequest: SearchUsersRequest = {
                searchTerm: (searchTerm as string)?.trim() || "",
                searcherUserId: userId,
                searchType: "related",
                pagination: {
                    limit: Math.min(parseInt(limit as string) || 10, 50),
                    offset: 0,
                },
                searchContext: "follow_suggestions",
            }

            const result = await this.searchUsersUseCase.execute(searchRequest)

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.data,
                    queryId: result.queryId,
                    timestamp: new Date(),
                })
            } else {
                const statusCode = this.getErrorStatusCode(result.error?.type)
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    queryId: result.queryId,
                    timestamp: new Date(),
                })
            }
        } catch (error) {
            console.error("Erro ao buscar usuários relacionados:", error)

            res.status(500).json({
                success: false,
                error: {
                    type: SearchErrorType.INTERNAL_ERROR,
                    message: "Erro interno do servidor",
                    code: SearchErrorType.INTERNAL_ERROR,
                    timestamp: new Date(),
                },
            })
        }
    }

    /**
     * Endpoint para buscar usuários próximos
     * GET /api/user-search/nearby
     */
    async searchNearbyUsers(req: Request, res: Response): Promise<void> {
        try {
            const { searchTerm, latitude, longitude, radius = 50, limit = 20 } = req.query
            const userId = req.user?.id || (req.headers["x-user-id"] as string)

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        type: SearchErrorType.PERMISSION_DENIED,
                        message: "Usuário não autenticado",
                        code: SearchErrorType.PERMISSION_DENIED,
                        timestamp: new Date(),
                    },
                })
                return
            }

            if (!latitude || !longitude) {
                res.status(400).json({
                    success: false,
                    error: {
                        type: SearchErrorType.VALIDATION_ERROR,
                        message: "Latitude e longitude são obrigatórios",
                        code: SearchErrorType.VALIDATION_ERROR,
                        timestamp: new Date(),
                    },
                })
                return
            }

            const searchRequest: SearchUsersRequest = {
                searchTerm: (searchTerm as string)?.trim() || "",
                searcherUserId: userId,
                searchType: "nearby",
                filters: {
                    maxDistance: parseInt(radius as string) || 50,
                },
                pagination: {
                    limit: Math.min(parseInt(limit as string) || 20, 50),
                    offset: 0,
                },
                searchContext: "discovery",
            }

            const result = await this.searchUsersUseCase.execute(searchRequest)

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.data,
                    queryId: result.queryId,
                    timestamp: new Date(),
                })
            } else {
                const statusCode = this.getErrorStatusCode(result.error?.type)
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    queryId: result.queryId,
                    timestamp: new Date(),
                })
            }
        } catch (error) {
            console.error("Erro ao buscar usuários próximos:", error)

            res.status(500).json({
                success: false,
                error: {
                    type: SearchErrorType.INTERNAL_ERROR,
                    message: "Erro interno do servidor",
                    code: SearchErrorType.INTERNAL_ERROR,
                    timestamp: new Date(),
                },
            })
        }
    }

    /**
     * Endpoint para buscar usuários verificados
     * GET /api/user-search/verified
     */
    async searchVerifiedUsers(req: Request, res: Response): Promise<void> {
        try {
            const { searchTerm, limit = 20 } = req.query
            const userId = req.user?.id || (req.headers["x-user-id"] as string)

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        type: SearchErrorType.PERMISSION_DENIED,
                        message: "Usuário não autenticado",
                        code: SearchErrorType.PERMISSION_DENIED,
                        timestamp: new Date(),
                    },
                })
                return
            }

            const searchRequest: SearchUsersRequest = {
                searchTerm: (searchTerm as string)?.trim() || "",
                searcherUserId: userId,
                searchType: "verified",
                pagination: {
                    limit: Math.min(parseInt(limit as string) || 20, 50),
                    offset: 0,
                },
                searchContext: "discovery",
            }

            const result = await this.searchUsersUseCase.execute(searchRequest)

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.data,
                    queryId: result.queryId,
                    timestamp: new Date(),
                })
            } else {
                const statusCode = this.getErrorStatusCode(result.error?.type)
                res.status(statusCode).json({
                    success: false,
                    error: result.error,
                    queryId: result.queryId,
                    timestamp: new Date(),
                })
            }
        } catch (error) {
            console.error("Erro ao buscar usuários verificados:", error)

            res.status(500).json({
                success: false,
                error: {
                    type: SearchErrorType.INTERNAL_ERROR,
                    message: "Erro interno do servidor",
                    code: SearchErrorType.INTERNAL_ERROR,
                    timestamp: new Date(),
                },
            })
        }
    }

    /**
     * Endpoint para obter estatísticas de busca
     * GET /api/user-search/stats
     */
    async getSearchStats(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id || (req.headers["x-user-id"] as string)

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        type: SearchErrorType.PERMISSION_DENIED,
                        message: "Usuário não autenticado",
                        code: SearchErrorType.PERMISSION_DENIED,
                        timestamp: new Date(),
                    },
                })
                return
            }

            // Por enquanto, retorna estatísticas básicas
            // Em uma implementação completa, isso viria de um serviço de métricas
            res.status(200).json({
                success: true,
                data: {
                    totalSearches: 0,
                    successfulSearches: 0,
                    failedSearches: 0,
                    averageResponseTime: 0,
                    cacheHitRate: 0,
                    topSearchTerms: [],
                    searchTypesDistribution: {},
                    errorDistribution: {},
                },
                timestamp: new Date(),
            })
        } catch (error) {
            console.error("Erro ao obter estatísticas:", error)

            res.status(500).json({
                success: false,
                error: {
                    type: SearchErrorType.INTERNAL_ERROR,
                    message: "Erro interno do servidor",
                    code: SearchErrorType.INTERNAL_ERROR,
                    timestamp: new Date(),
                },
            })
        }
    }

    /**
     * Mapeia tipos de erro para códigos de status HTTP
     */
    private getErrorStatusCode(errorType?: SearchErrorType): number {
        switch (errorType) {
            case SearchErrorType.VALIDATION_ERROR:
                return 400

            case SearchErrorType.PERMISSION_DENIED:
            case SearchErrorType.USER_NOT_AUTHORIZED:
                return 401

            case SearchErrorType.RATE_LIMIT_EXCEEDED:
            case SearchErrorType.TOO_MANY_REQUESTS:
                return 429

            case SearchErrorType.USER_NOT_FOUND:
                return 404

            case SearchErrorType.SEARCH_TIMEOUT:
                return 408

            case SearchErrorType.DATABASE_ERROR:
            case SearchErrorType.CACHE_ERROR:
            case SearchErrorType.INTERNAL_ERROR:
            default:
                return 500
        }
    }

    /**
     * Middleware para validação de entrada
     */
    static validateSearchRequest(req: Request, res: Response, next: Function): void {
        const { searchTerm } = req.body

        if (!searchTerm || typeof searchTerm !== "string") {
            res.status(400).json({
                success: false,
                error: {
                    type: SearchErrorType.VALIDATION_ERROR,
                    message: "Search term é obrigatório e deve ser uma string",
                    code: SearchErrorType.VALIDATION_ERROR,
                    timestamp: new Date(),
                },
            })
            return
        }

        if (searchTerm.trim().length < 1) {
            res.status(400).json({
                success: false,
                error: {
                    type: SearchErrorType.SEARCH_TERM_TOO_SHORT,
                    message: "Search term deve ter pelo menos 1 caractere",
                    code: SearchErrorType.SEARCH_TERM_TOO_SHORT,
                    timestamp: new Date(),
                },
            })
            return
        }

        if (searchTerm.length > 100) {
            res.status(400).json({
                success: false,
                error: {
                    type: SearchErrorType.SEARCH_TERM_TOO_LONG,
                    message: "Search term não pode ter mais de 100 caracteres",
                    code: SearchErrorType.SEARCH_TERM_TOO_LONG,
                    timestamp: new Date(),
                },
            })
            return
        }

        next()
    }

    /**
     * Middleware para rate limiting
     */
    static rateLimitMiddleware(req: Request, res: Response, next: Function): void {
        // Implementação básica de rate limiting
        // Em produção, usar Redis ou similar
        const userId = req.user?.id || req.ip
        const now = Date.now()

        // Por enquanto, apenas chama next()
        // Implementação completa seria necessária aqui
        next()
    }
}
