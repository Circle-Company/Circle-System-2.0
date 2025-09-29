import {
    UserSearchQuery,
    UserSearchQueryProps,
} from "@/domain/user.search.engine/entities/user.search.query.entity"
import {
    UserSearchError,
    UserSearchErrorCode,
} from "@/domain/user.search.engine/errors/user.search.errors"
import {
    SearchCriteria,
    SearchError,
    SearchErrorType,
    SearchResult,
    SecurityContext,
    ValidationResult,
} from "@/domain/user.search.engine/types"

import { UserSearchRepositoryInterface } from "@/domain/user.search.engine/repositories/user.search.repository"

/**
 * Search Users Use Case
 *
 * Caso de uso principal para busca de usuários. Coordena todas as operações
 * necessárias para executar uma busca completa e segura.
 */
export interface SearchUsersRequest {
    searchTerm: string
    searcherUserId: string
    searchType?: "all" | "related" | "unknown" | "verified" | "nearby"
    filters?: {
        includeVerified?: boolean
        includeUnverified?: boolean
        includeBlocked?: boolean
        includeMuted?: boolean
        minFollowers?: number
        maxFollowers?: number
        minEngagementRate?: number
        maxEngagementRate?: number
        maxDistance?: number
        preferredHashtags?: string[]
        excludeUserIds?: string[]
    }
    pagination?: {
        limit?: number
        offset?: number
    }
    sorting?: {
        field?: "relevance" | "followers" | "engagement" | "distance" | "created_at"
        direction?: "asc" | "desc"
    }
    searchContext?: "discovery" | "follow_suggestions" | "mention" | "admin"
    securityContext?: SecurityContext
}

export interface SearchUsersResponse {
    success: boolean
    data?: SearchResult
    error?: SearchError
    queryId: string
}

export class SearchUsersUseCase {
    constructor(
        private readonly userSearchRepository: UserSearchRepositoryInterface,
        private readonly securityValidator: SecurityValidatorInterface,
        private readonly rateLimiter: RateLimiterInterface,
        private readonly cacheManager: CacheManagerInterface,
        private readonly metricsCollector: MetricsCollectorInterface,
    ) {}

    async execute(request: SearchUsersRequest): Promise<SearchUsersResponse> {
        const startTime = Date.now()
        let queryId: string | undefined

        try {
            // 1. Validação de segurança
            const securityValidation = await this.validateSecurity(request)
            if (!securityValidation.isValid) {
                return this.createErrorResponse(
                    SearchErrorType.PERMISSION_DENIED,
                    "Falha na validação de segurança",
                    { errors: securityValidation.errors },
                    queryId,
                )
            }

            // 2. Verificação de rate limiting
            const rateLimitCheck = await this.checkRateLimit(request)
            if (!rateLimitCheck.allowed) {
                return this.createErrorResponse(
                    SearchErrorType.RATE_LIMIT_EXCEEDED,
                    "Rate limit excedido",
                    {
                        remaining: rateLimitCheck.remaining,
                        resetAt: rateLimitCheck.resetAt,
                    },
                    queryId,
                )
            }

            // 3. Criação da query de busca
            const searchQuery = this.createSearchQuery(request)
            queryId = searchQuery.id

            // 4. Verificação de cache
            const cacheKey = this.generateCacheKey(searchQuery)
            const cachedResult = await this.cacheManager.get(cacheKey)
            if (cachedResult) {
                await this.metricsCollector.recordCacheHit(queryId)
                return {
                    success: true,
                    data: cachedResult,
                    queryId,
                }
            }

            // 5. Validação da query
            const queryValidation = await this.validateSearchQuery(searchQuery)
            if (!queryValidation.isValid) {
                return this.createErrorResponse(
                    SearchErrorType.VALIDATION_ERROR,
                    "Query de busca inválida",
                    { errors: queryValidation.errors },
                    queryId,
                )
            }

            // 6. Execução da busca
            const searchCriteria = this.buildSearchCriteria(searchQuery)
            const searchResult = await this.userSearchRepository.search(searchCriteria)

            // 7. Processamento dos resultados
            const processedResult = await this.processSearchResults(searchResult, searchQuery)

            // 8. Salvamento no cache
            await this.cacheManager.set(cacheKey, processedResult, this.getCacheTTL())

            // 9. Registro de métricas
            await this.recordMetrics(searchQuery, processedResult, Date.now() - startTime)

            // 10. Registro de tentativa para rate limiting
            await this.rateLimiter.recordAttempt(
                request.searcherUserId,
                request.securityContext?.ipAddress || "",
            )

            return {
                success: true,
                data: processedResult,
                queryId,
            }
        } catch (error) {
            const duration = Date.now() - startTime
            await this.metricsCollector.recordError(queryId || "unknown", error, duration)

            if (error instanceof UserSearchError) {
                return this.createErrorResponse(
                    this.mapErrorType(error.code),
                    error.message,
                    error.details,
                    queryId,
                )
            }

            return this.createErrorResponse(
                SearchErrorType.INTERNAL_ERROR,
                "Erro interno durante a busca",
                { originalError: error instanceof Error ? error.message : String(error) },
                queryId,
            )
        }
    }

    private async validateSecurity(request: SearchUsersRequest): Promise<ValidationResult> {
        const errors: string[] = []
        const warnings: string[] = []

        // Validação básica de entrada
        if (!request.searchTerm || request.searchTerm.trim().length === 0) {
            errors.push("Search term é obrigatório")
        }

        if (!request.searcherUserId || request.searcherUserId.trim().length === 0) {
            errors.push("Searcher user ID é obrigatório")
        }

        // Validação de segurança do search term
        if (request.searchTerm) {
            const securityCheck = await this.securityValidator.validateSearchTerm(
                request.searchTerm,
            )
            if (!securityCheck.isValid) {
                errors.push(...securityCheck.errors)
            }
            warnings.push(...securityCheck.warnings)
        }

        // Validação de contexto de segurança
        if (request.securityContext) {
            const contextValidation = await this.securityValidator.validateSecurityContext(
                request.securityContext,
            )
            if (!contextValidation.isValid) {
                errors.push(...contextValidation.errors)
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    private async checkRateLimit(request: SearchUsersRequest): Promise<{
        allowed: boolean
        remaining: number
        resetAt: Date
    }> {
        const userId = request.searcherUserId
        const ipAddress = request.securityContext?.ipAddress || ""

        return await this.rateLimiter.checkLimit(userId, ipAddress)
    }

    private createSearchQuery(request: SearchUsersRequest): UserSearchQuery {
        const queryProps: UserSearchQueryProps = {
            searchTerm: request.searchTerm,
            searcherUserId: request.searcherUserId,
            searchType: request.searchType || "all",
            filters: {
                includeVerified: request.filters?.includeVerified ?? true,
                includeUnverified: request.filters?.includeUnverified ?? true,
                includeBlocked: request.filters?.includeBlocked ?? false,
                includeMuted: request.filters?.includeMuted ?? false,
                minFollowers: request.filters?.minFollowers,
                maxFollowers: request.filters?.maxFollowers,
                minEngagementRate: request.filters?.minEngagementRate,
                maxEngagementRate: request.filters?.maxEngagementRate,
                maxDistance: request.filters?.maxDistance,
                preferredHashtags: request.filters?.preferredHashtags,
                excludeUserIds: request.filters?.excludeUserIds,
            },
            pagination: {
                limit: Math.min(request.pagination?.limit || 20, 100),
                offset: request.pagination?.offset || 0,
            },
            sorting: {
                field: request.sorting?.field || "relevance",
                direction: request.sorting?.direction || "desc",
            },
            searchMetadata: {
                searchContext: request.searchContext || "discovery",
                userAgent: request.securityContext?.userAgent,
                ipAddress: request.securityContext?.ipAddress,
                sessionId: request.securityContext?.sessionId,
            },
        }

        return UserSearchQuery.create(queryProps)
    }

    private async validateSearchQuery(query: UserSearchQuery): Promise<ValidationResult> {
        return await this.userSearchRepository.validateSearchCriteria(
            this.buildSearchCriteria(query),
        )
    }

    private buildSearchCriteria(query: UserSearchQuery): SearchCriteria {
        return {
            searchTerm: query.searchTerm,
            searcherUserId: query.searcherUserId,
            searchType: query.searchType,
            filters: query.filters,
            pagination: query.pagination,
            sorting: query.sorting,
        }
    }

    private async processSearchResults(
        result: SearchResult,
        query: UserSearchQuery,
    ): Promise<SearchResult> {
        // Aplicar ranking personalizado se necessário
        if (query.searchType === "related" || query.searchType === "all") {
            result.users = await this.userSearchRepository.rankResults(
                result.users,
                this.buildSearchCriteria(query),
            )
        }

        // Filtrar resultados baseado em preferências de segurança
        result.users = result.users.filter((user) => user.isRelevant())

        // Aplicar limites de paginação
        const startIndex = query.pagination.offset
        const endIndex = startIndex + query.pagination.limit
        result.users = result.users.slice(startIndex, endIndex)

        // Atualizar metadados de paginação
        result.pagination = {
            ...result.pagination,
            limit: query.pagination.limit,
            offset: query.pagination.offset,
            hasNext: endIndex < result.pagination.total,
            hasPrevious: startIndex > 0,
            totalPages: Math.ceil(result.pagination.total / query.pagination.limit),
            currentPage: Math.floor(startIndex / query.pagination.limit) + 1,
        }

        return result
    }

    private generateCacheKey(query: UserSearchQuery): string {
        return `search:${query.searcherUserId}:${query.searchTerm}:${
            query.searchType
        }:${JSON.stringify(query.filters)}:${query.pagination.limit}:${query.pagination.offset}`
    }

    private getCacheTTL(): number {
        return 5 * 60 * 1000 // 5 minutos
    }

    private async recordMetrics(
        query: UserSearchQuery,
        result: SearchResult,
        duration: number,
    ): Promise<void> {
        await this.metricsCollector.recordSearchMetrics({
            queryId: query.id,
            searchTerm: query.searchTerm,
            searchType: query.searchType,
            searcherUserId: query.searcherUserId,
            resultCount: result.users.length,
            duration,
            timestamp: new Date(),
        })
    }

    private createErrorResponse(
        errorType: SearchErrorType,
        message: string,
        details?: Record<string, any>,
        queryId?: string,
    ): SearchUsersResponse {
        return {
            success: false,
            error: {
                type: errorType,
                message,
                code: errorType,
                details,
                timestamp: new Date(),
                queryId,
            },
            queryId: queryId || "unknown",
        }
    }

    private mapErrorType(errorCode: UserSearchErrorCode): SearchErrorType {
        const mapping: Record<UserSearchErrorCode, SearchErrorType> = {
            [UserSearchErrorCode.INVALID_SEARCH_TERM]: SearchErrorType.INVALID_SEARCH_TERM,
            [UserSearchErrorCode.SEARCH_TERM_TOO_SHORT]: SearchErrorType.SEARCH_TERM_TOO_SHORT,
            [UserSearchErrorCode.SEARCH_TERM_TOO_LONG]: SearchErrorType.SEARCH_TERM_TOO_LONG,
            [UserSearchErrorCode.SEARCH_TERM_SUSPICIOUS]: SearchErrorType.SEARCH_TERM_SUSPICIOUS,
            [UserSearchErrorCode.PERMISSION_DENIED]: SearchErrorType.PERMISSION_DENIED,
            [UserSearchErrorCode.RATE_LIMIT_EXCEEDED]: SearchErrorType.RATE_LIMIT_EXCEEDED,
            [UserSearchErrorCode.USER_NOT_FOUND]: SearchErrorType.USER_NOT_FOUND,
            [UserSearchErrorCode.SEARCH_TIMEOUT]: SearchErrorType.SEARCH_TIMEOUT,
            [UserSearchErrorCode.DATABASE_ERROR]: SearchErrorType.DATABASE_ERROR,
            [UserSearchErrorCode.CACHE_ERROR]: SearchErrorType.CACHE_ERROR,
            [UserSearchErrorCode.VALIDATION_ERROR]: SearchErrorType.VALIDATION_ERROR,
            [UserSearchErrorCode.INTERNAL_ERROR]: SearchErrorType.INTERNAL_ERROR,
        }

        return mapping[errorCode] || SearchErrorType.INTERNAL_ERROR
    }
}

// Interfaces para dependências
export interface SecurityValidatorInterface {
    validateSearchTerm(term: string): Promise<ValidationResult>
    validateSecurityContext(context: SecurityContext): Promise<ValidationResult>
}

export interface RateLimiterInterface {
    checkLimit(
        userId: string,
        ipAddress: string,
    ): Promise<{
        allowed: boolean
        remaining: number
        resetAt: Date
    }>
    recordAttempt(userId: string, ipAddress: string): Promise<void>
}

export interface CacheManagerInterface {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T, ttl?: number): Promise<void>
    delete(key: string): Promise<void>
}

export interface MetricsCollectorInterface {
    recordSearchMetrics(metrics: {
        queryId: string
        searchTerm: string
        searchType: string
        searcherUserId: string
        resultCount: number
        duration: number
        timestamp: Date
    }): Promise<void>
    recordCacheHit(queryId: string): Promise<void>
    recordError(queryId: string, error: any, duration: number): Promise<void>
}
