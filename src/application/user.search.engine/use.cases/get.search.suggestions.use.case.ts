import {
    UserSearchError,
    UserSearchErrorCode,
} from "@/domain/user.search.engine/errors/user.search.errors"
import { SearchError, SearchErrorType } from "@/domain/user.search.engine/types"

import { UserSearchRepositoryInterface } from "@/domain/user.search.engine/repositories/user.search.repository"

/**
 * Get Search Suggestions Use Case
 *
 * Caso de uso para obter sugestões de busca baseadas em termos parciais,
 * histórico de busca e padrões populares.
 */
export interface GetSearchSuggestionsRequest {
    partialTerm: string
    userId?: string
    limit?: number
    context?: "discovery" | "follow_suggestions" | "mention" | "admin"
    includePopular?: boolean
    includeUserHistory?: boolean
    includeTrending?: boolean
}

export interface SearchSuggestion {
    term: string
    type: "username" | "name" | "hashtag" | "popular" | "trending" | "history"
    confidence: number
    metadata?: {
        userId?: string
        userCount?: number
        isVerified?: boolean
        followersCount?: number
    }
}

export interface GetSearchSuggestionsResponse {
    success: boolean
    data?: {
        suggestions: SearchSuggestion[]
        totalCount: number
        cacheHit: boolean
    }
    error?: SearchError
}

export class GetSearchSuggestionsUseCase {
    constructor(
        private readonly userSearchRepository: UserSearchRepositoryInterface,
        private readonly cacheManager: CacheManagerInterface,
        private readonly metricsCollector: MetricsCollectorInterface,
    ) {}

    async execute(request: GetSearchSuggestionsRequest): Promise<GetSearchSuggestionsResponse> {
        const startTime = Date.now()
        let cacheHit = false

        try {
            // 1. Validação de entrada
            const validation = this.validateRequest(request)
            if (!validation.isValid) {
                return this.createErrorResponse(
                    SearchErrorType.VALIDATION_ERROR,
                    "Request inválido",
                    { errors: validation.errors },
                )
            }

            // 2. Normalização do termo parcial
            const normalizedTerm = this.normalizeSearchTerm(request.partialTerm)
            if (normalizedTerm.length < 2) {
                return {
                    success: true,
                    data: {
                        suggestions: [],
                        totalCount: 0,
                        cacheHit: false,
                    },
                }
            }

            // 3. Verificação de cache
            const cacheKey = this.generateCacheKey(normalizedTerm, request)
            let suggestions = await this.cacheManager.get<SearchSuggestion[]>(cacheKey)

            if (suggestions) {
                cacheHit = true
            } else {
                // 4. Busca de sugestões
                suggestions = await this.fetchSuggestions(normalizedTerm, request)

                // 5. Salvamento no cache
                await this.cacheManager.set(cacheKey, suggestions, this.getCacheTTL())
            }

            // 6. Aplicação de limites e ordenação
            const limitedSuggestions = suggestions.slice(0, request.limit || 10)

            // 7. Registro de métricas
            await this.metricsCollector.recordSuggestionMetrics({
                partialTerm: normalizedTerm,
                userId: request.userId,
                context: request.context || "discovery",
                suggestionCount: limitedSuggestions.length,
                cacheHit,
                duration: Date.now() - startTime,
                timestamp: new Date(),
            })

            return {
                success: true,
                data: {
                    suggestions: limitedSuggestions,
                    totalCount: suggestions.length,
                    cacheHit,
                },
            }
        } catch (error) {
            await this.metricsCollector.recordError("suggestions", error, Date.now() - startTime)

            if (error instanceof UserSearchError) {
                return this.createErrorResponse(
                    this.mapErrorType(error.code),
                    error.message,
                    error.details,
                )
            }

            return this.createErrorResponse(
                SearchErrorType.INTERNAL_ERROR,
                "Erro interno ao obter sugestões",
                { originalError: error instanceof Error ? error.message : String(error) },
            )
        }
    }

    private validateRequest(request: GetSearchSuggestionsRequest): {
        isValid: boolean
        errors: string[]
    } {
        const errors: string[] = []

        if (!request.partialTerm || request.partialTerm.trim().length === 0) {
            errors.push("Partial term é obrigatório")
        }

        if (request.partialTerm && request.partialTerm.length > 50) {
            errors.push("Partial term não pode ter mais de 50 caracteres")
        }

        if (request.limit && (request.limit < 1 || request.limit > 50)) {
            errors.push("Limit deve estar entre 1 e 50")
        }

        // Verificações de segurança
        if (request.partialTerm) {
            const suspiciousPatterns = [
                "script",
                "javascript",
                "onload",
                "onerror",
                "<script",
                "</script>",
            ]
            const lowerTerm = request.partialTerm.toLowerCase()
            if (suspiciousPatterns.some((pattern) => lowerTerm.includes(pattern))) {
                errors.push("Termo contém padrões suspeitos")
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    private normalizeSearchTerm(term: string): string {
        return term
            .trim()
            .toLowerCase()
            .replace(/[^\w\s@#-]/g, "") // Remove caracteres especiais exceto @, #, -
            .replace(/\s+/g, " ") // Normaliza espaços
    }

    private generateCacheKey(normalizedTerm: string, request: GetSearchSuggestionsRequest): string {
        const context = request.context || "discovery"
        const userId = request.userId || "anonymous"
        const limit = request.limit || 10

        return `suggestions:${context}:${userId}:${normalizedTerm}:${limit}`
    }

    private getCacheTTL(): number {
        return 2 * 60 * 1000 // 2 minutos
    }

    private async fetchSuggestions(
        normalizedTerm: string,
        request: GetSearchSuggestionsRequest,
    ): Promise<SearchSuggestion[]> {
        const suggestions: SearchSuggestion[] = []

        // 1. Buscar sugestões de usernames
        const usernameSuggestions = await this.getUsernameSuggestions(normalizedTerm, request)
        suggestions.push(...usernameSuggestions)

        // 2. Buscar sugestões de nomes
        const nameSuggestions = await this.getNameSuggestions(normalizedTerm, request)
        suggestions.push(...nameSuggestions)

        // 3. Buscar sugestões de hashtags
        const hashtagSuggestions = await this.getHashtagSuggestions(normalizedTerm, request)
        suggestions.push(...hashtagSuggestions)

        // 4. Buscar sugestões populares
        if (request.includePopular !== false) {
            const popularSuggestions = await this.getPopularSuggestions(normalizedTerm, request)
            suggestions.push(...popularSuggestions)
        }

        // 5. Buscar sugestões do histórico do usuário
        if (request.includeUserHistory && request.userId) {
            const historySuggestions = await this.getHistorySuggestions(
                normalizedTerm,
                request.userId,
            )
            suggestions.push(...historySuggestions)
        }

        // 6. Buscar sugestões trending
        if (request.includeTrending) {
            const trendingSuggestions = await this.getTrendingSuggestions(normalizedTerm, request)
            suggestions.push(...trendingSuggestions)
        }

        // 7. Remover duplicatas e ordenar por confiança
        return this.deduplicateAndRank(suggestions, normalizedTerm)
    }

    private async getUsernameSuggestions(
        term: string,
        request: GetSearchSuggestionsRequest,
    ): Promise<SearchSuggestion[]> {
        try {
            const suggestions = await this.userSearchRepository.getSearchSuggestions(
                term,
                request.userId,
            )

            return suggestions
                .filter((suggestion) => suggestion.toLowerCase().startsWith(term))
                .map((suggestion) => ({
                    term: suggestion,
                    type: "username" as const,
                    confidence: this.calculateUsernameConfidence(suggestion, term),
                    metadata: {},
                }))
                .slice(0, 5)
        } catch (error) {
            console.error("Erro ao buscar sugestões de username:", error)
            return []
        }
    }

    private async getNameSuggestions(
        term: string,
        request: GetSearchSuggestionsRequest,
    ): Promise<SearchSuggestion[]> {
        try {
            // Implementar busca por nomes de usuários
            // Por enquanto, retorna array vazio
            return []
        } catch (error) {
            console.error("Erro ao buscar sugestões de nome:", error)
            return []
        }
    }

    private async getHashtagSuggestions(
        term: string,
        request: GetSearchSuggestionsRequest,
    ): Promise<SearchSuggestion[]> {
        try {
            // Implementar busca por hashtags
            // Por enquanto, retorna array vazio
            return []
        } catch (error) {
            console.error("Erro ao buscar sugestões de hashtag:", error)
            return []
        }
    }

    private async getPopularSuggestions(
        term: string,
        request: GetSearchSuggestionsRequest,
    ): Promise<SearchSuggestion[]> {
        try {
            const popularTerms = await this.userSearchRepository.getPopularSearchTerms(20)

            return popularTerms
                .filter((item) => item.term.toLowerCase().includes(term))
                .map((item) => ({
                    term: item.term,
                    type: "popular" as const,
                    confidence: this.calculatePopularityConfidence(item.count),
                    metadata: {
                        userCount: item.count,
                    },
                }))
                .slice(0, 3)
        } catch (error) {
            console.error("Erro ao buscar sugestões populares:", error)
            return []
        }
    }

    private async getHistorySuggestions(term: string, userId: string): Promise<SearchSuggestion[]> {
        try {
            // Implementar busca no histórico do usuário
            // Por enquanto, retorna array vazio
            return []
        } catch (error) {
            console.error("Erro ao buscar sugestões do histórico:", error)
            return []
        }
    }

    private async getTrendingSuggestions(
        term: string,
        request: GetSearchSuggestionsRequest,
    ): Promise<SearchSuggestion[]> {
        try {
            // Implementar busca de termos trending
            // Por enquanto, retorna array vazio
            return []
        } catch (error) {
            console.error("Erro ao buscar sugestões trending:", error)
            return []
        }
    }

    private calculateUsernameConfidence(suggestion: string, term: string): number {
        // Maior confiança para correspondências exatas no início
        if (suggestion.toLowerCase().startsWith(term)) {
            return 0.9
        }

        // Menor confiança para correspondências parciais
        if (suggestion.toLowerCase().includes(term)) {
            return 0.7
        }

        return 0.5
    }

    private calculatePopularityConfidence(count: number): number {
        // Normaliza o count para um score entre 0.1 e 0.8
        const normalizedCount = Math.log10(count + 1) / 5
        return Math.min(0.8, Math.max(0.1, normalizedCount))
    }

    private deduplicateAndRank(suggestions: SearchSuggestion[], term: string): SearchSuggestion[] {
        // Remove duplicatas baseado no termo
        const uniqueSuggestions = new Map<string, SearchSuggestion>()

        for (const suggestion of suggestions) {
            const key = suggestion.term.toLowerCase()
            if (
                !uniqueSuggestions.has(key) ||
                uniqueSuggestions.get(key)!.confidence < suggestion.confidence
            ) {
                uniqueSuggestions.set(key, suggestion)
            }
        }

        // Ordena por confiança e relevância
        return Array.from(uniqueSuggestions.values()).sort((a, b) => {
            // Prioriza correspondências que começam com o termo
            const aStarts = a.term.toLowerCase().startsWith(term)
            const bStarts = b.term.toLowerCase().startsWith(term)

            if (aStarts && !bStarts) return -1
            if (!aStarts && bStarts) return 1

            // Se ambos começam ou não começam, ordena por confiança
            return b.confidence - a.confidence
        })
    }

    private createErrorResponse(
        errorType: SearchErrorType,
        message: string,
        details?: Record<string, any>,
    ): GetSearchSuggestionsResponse {
        return {
            success: false,
            error: {
                type: errorType,
                message,
                code: errorType,
                details,
                timestamp: new Date(),
            },
        }
    }

    private mapErrorType(errorCode: UserSearchErrorCode): SearchErrorType {
        const mapping: Record<UserSearchErrorCode, SearchErrorType> = {
            [UserSearchErrorCode.VALIDATION_ERROR]: SearchErrorType.VALIDATION_ERROR,
            [UserSearchErrorCode.INTERNAL_ERROR]: SearchErrorType.INTERNAL_ERROR,
            [UserSearchErrorCode.CACHE_ERROR]: SearchErrorType.CACHE_ERROR,
            [UserSearchErrorCode.DATABASE_ERROR]: SearchErrorType.DATABASE_ERROR,
        }

        return mapping[errorCode] || SearchErrorType.INTERNAL_ERROR
    }
}

// Interfaces para dependências
export interface CacheManagerInterface {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T, ttl?: number): Promise<void>
    delete(key: string): Promise<void>
}

export interface MetricsCollectorInterface {
    recordSuggestionMetrics(metrics: {
        partialTerm: string
        userId?: string
        context: string
        suggestionCount: number
        cacheHit: boolean
        duration: number
        timestamp: Date
    }): Promise<void>
    recordError(operation: string, error: any, duration: number): Promise<void>
}
