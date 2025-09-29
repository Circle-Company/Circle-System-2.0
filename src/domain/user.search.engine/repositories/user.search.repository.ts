import { SearchCriteria, SearchFilters, SearchResult } from "../types"

import { UserSearchQuery } from "../entities/user.search.query.entity"
import { UserSearchResult } from "../entities/user.search.result.entity"

/**
 * User Search Repository Interface
 *
 * Interface para operações de busca de usuários no domínio.
 * Define contratos para diferentes estratégias de busca e armazenamento.
 */
export interface UserSearchRepositoryInterface {
    // ===== OPERAÇÕES BÁSICAS DE BUSCA =====

    /**
     * Executa uma busca de usuários baseada nos critérios fornecidos
     */
    search(criteria: SearchCriteria): Promise<SearchResult>

    /**
     * Busca usuários relacionados (baseado em conexões sociais)
     */
    searchRelated(
        searchTerm: string,
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>

    /**
     * Busca usuários desconhecidos (sem conexões sociais)
     */
    searchUnknown(
        searchTerm: string,
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>

    /**
     * Busca usuários verificados
     */
    searchVerified(
        searchTerm: string,
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>

    /**
     * Busca usuários próximos geograficamente
     */
    searchNearby(
        searchTerm: string,
        searcherUserId: string,
        latitude: number,
        longitude: number,
        radiusKm: number,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>

    // ===== OPERAÇÕES DE BUSCA AVANÇADA =====

    /**
     * Busca com filtros avançados
     */
    searchWithFilters(criteria: SearchCriteria, filters: SearchFilters): Promise<SearchResult>

    /**
     * Busca por hashtags preferidas
     */
    searchByPreferredHashtags(
        hashtags: string[],
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>

    /**
     * Busca por nível de engajamento
     */
    searchByEngagementLevel(
        level: "low" | "medium" | "high",
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>

    /**
     * Busca por nível de influência
     */
    searchByInfluenceLevel(
        level: "low" | "medium" | "high",
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>

    // ===== OPERAÇÕES DE RANKING E SCORING =====

    /**
     * Calcula score de relevância para um usuário
     */
    calculateRelevanceScore(
        userId: string,
        searchTerm: string,
        searcherUserId: string,
    ): Promise<number>

    /**
     * Aplica algoritmo de ranking aos resultados
     */
    rankResults(results: UserSearchResult[], criteria: SearchCriteria): Promise<UserSearchResult[]>

    /**
     * Obtém fatores de ranking para um usuário
     */
    getRankingFactors(userId: string, searchTerm: string, searcherUserId: string): Promise<string[]>

    // ===== OPERAÇÕES DE RELACIONAMENTOS SOCIAIS =====

    /**
     * Verifica status de relacionamento entre usuários
     */
    getRelationshipStatus(userId: string, searcherUserId: string): Promise<RelationshipStatus>

    /**
     * Obtém força do relacionamento social
     */
    getRelationshipStrength(userId: string, searcherUserId: string): Promise<number>

    /**
     * Verifica se usuários têm conexões em comum
     */
    getMutualConnections(userId: string, searcherUserId: string): Promise<string[]>

    // ===== OPERAÇÕES DE LOCALIZAÇÃO =====

    /**
     * Calcula distância entre usuários
     */
    calculateDistance(userId: string, searcherUserId: string): Promise<number | null>

    /**
     * Obtém usuários em uma área geográfica
     */
    getUsersInArea(
        latitude: number,
        longitude: number,
        radiusKm: number,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>

    // ===== OPERAÇÕES DE CACHE =====

    /**
     * Obtém resultado do cache
     */
    getFromCache(cacheKey: string): Promise<SearchResult | null>

    /**
     * Salva resultado no cache
     */
    saveToCache(cacheKey: string, result: SearchResult, ttl?: number): Promise<void>

    /**
     * Invalida cache para um usuário
     */
    invalidateUserCache(userId: string): Promise<void>

    /**
     * Limpa cache expirado
     */
    clearExpiredCache(): Promise<void>

    // ===== OPERAÇÕES DE MÉTRICAS E ANALYTICS =====

    /**
     * Registra métricas de busca
     */
    recordSearchMetrics(query: UserSearchQuery, result: SearchResult): Promise<void>

    /**
     * Obtém estatísticas de busca
     */
    getSearchStatistics(userId?: string): Promise<SearchStatistics>

    /**
     * Obtém termos de busca mais populares
     */
    getPopularSearchTerms(limit?: number): Promise<Array<{ term: string; count: number }>>

    /**
     * Obtém sugestões de busca
     */
    getSearchSuggestions(partialTerm: string, userId?: string): Promise<string[]>

    // ===== OPERAÇÕES DE VALIDAÇÃO E SEGURANÇA =====

    /**
     * Valida critérios de busca
     */
    validateSearchCriteria(criteria: SearchCriteria): Promise<ValidationResult>

    /**
     * Verifica rate limiting
     */
    checkRateLimit(userId: string, ipAddress: string): Promise<RateLimitStatus>

    /**
     * Registra tentativa de busca para rate limiting
     */
    recordSearchAttempt(userId: string, ipAddress: string): Promise<void>

    // ===== OPERAÇÕES DE CONFIGURAÇÃO =====

    /**
     * Obtém configuração do motor de busca
     */
    getSearchEngineConfig(): Promise<SearchEngineConfig>

    /**
     * Atualiza configuração do motor de busca
     */
    updateSearchEngineConfig(config: Partial<SearchEngineConfig>): Promise<void>
}

// ===== TIPOS DE SUPORTE =====

export interface SearchOptions {
    limit?: number
    offset?: number
    includeInactive?: boolean
    includeBlocked?: boolean
    includeMuted?: boolean
    sortBy?: "relevance" | "followers" | "engagement" | "distance" | "created_at"
    sortDirection?: "asc" | "desc"
}

export interface RelationshipStatus {
    youFollow: boolean
    followsYou: boolean
    isBlocked: boolean
    isMuted: boolean
    relationshipStrength: number
    mutualConnections: number
}

export interface SearchStatistics {
    totalSearches: number
    successfulSearches: number
    failedSearches: number
    averageResponseTime: number
    cacheHitRate: number
    topSearchTerms: Array<{ term: string; count: number }>
    searchTypesDistribution: Record<string, number>
    errorDistribution: Record<string, number>
}

export interface RateLimitStatus {
    allowed: boolean
    remaining: number
    resetAt: Date
    limit: number
}

export interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

export interface SearchEngineConfig {
    search: {
        maxResults: number
        defaultLimit: number
        maxLimit: number
        timeout: number
        cacheExpiration: number
    }
    ranking: {
        weights: Record<string, number>
        factors: Record<string, number>
    }
    security: {
        maxSearchTermLength: number
        minSearchTermLength: number
        suspiciousPatterns: string[]
        rateLimitPerUser: number
        rateLimitPerIP: number
    }
    performance: {
        enableCaching: boolean
        enableMetrics: boolean
        batchSize: number
        maxConcurrentQueries: number
    }
}

/**
 * User Search Repository Base Class
 *
 * Implementação base com funcionalidades comuns para todos os repositórios
 */
export abstract class UserSearchRepositoryBase implements UserSearchRepositoryInterface {
    protected readonly config: SearchEngineConfig

    constructor(config: SearchEngineConfig) {
        this.config = config
    }

    // Implementações abstratas que devem ser implementadas pelas subclasses
    abstract search(criteria: SearchCriteria): Promise<SearchResult>
    abstract searchRelated(
        searchTerm: string,
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>
    abstract searchUnknown(
        searchTerm: string,
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>
    abstract searchVerified(
        searchTerm: string,
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>
    abstract searchNearby(
        searchTerm: string,
        searcherUserId: string,
        latitude: number,
        longitude: number,
        radiusKm: number,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]>

    // Implementações padrão que podem ser sobrescritas
    async searchWithFilters(
        criteria: SearchCriteria,
        filters: SearchFilters,
    ): Promise<SearchResult> {
        // Implementação padrão que combina critérios com filtros
        const combinedCriteria: SearchCriteria = {
            ...criteria,
            filters: { ...criteria.filters, ...filters },
        }
        return this.search(combinedCriteria)
    }

    async calculateRelevanceScore(
        userId: string,
        searchTerm: string,
        searcherUserId: string,
    ): Promise<number> {
        // Implementação padrão de cálculo de relevância
        // Pode ser sobrescrita por implementações específicas
        return 0.5
    }

    async rankResults(
        results: UserSearchResult[],
        criteria: SearchCriteria,
    ): Promise<UserSearchResult[]> {
        // Implementação padrão de ranking
        return results.sort((a, b) => b.searchScore - a.searchScore)
    }

    async getRankingFactors(
        userId: string,
        searchTerm: string,
        searcherUserId: string,
    ): Promise<string[]> {
        // Implementação padrão retorna fatores básicos
        return ["relevance", "social", "engagement"]
    }

    async getRelationshipStatus(
        userId: string,
        searcherUserId: string,
    ): Promise<RelationshipStatus> {
        // Implementação padrão - deve ser sobrescrita
        return {
            youFollow: false,
            followsYou: false,
            isBlocked: false,
            isMuted: false,
            relationshipStrength: 0,
            mutualConnections: 0,
        }
    }

    async getRelationshipStrength(userId: string, searcherUserId: string): Promise<number> {
        const status = await this.getRelationshipStatus(userId, searcherUserId)
        return status.relationshipStrength
    }

    async getMutualConnections(userId: string, searcherUserId: string): Promise<string[]> {
        // Implementação padrão - deve ser sobrescrita
        return []
    }

    async calculateDistance(userId: string, searcherUserId: string): Promise<number | null> {
        // Implementação padrão - deve ser sobrescrita
        return null
    }

    async getUsersInArea(
        latitude: number,
        longitude: number,
        radiusKm: number,
        options?: SearchOptions,
    ): Promise<UserSearchResult[]> {
        // Implementação padrão - deve ser sobrescrita
        return []
    }

    // Operações de cache
    async getFromCache(cacheKey: string): Promise<SearchResult | null> {
        // Implementação padrão - deve ser sobrescrita
        return null
    }

    async saveToCache(cacheKey: string, result: SearchResult, ttl?: number): Promise<void> {
        // Implementação padrão - deve ser sobrescrita
    }

    async invalidateUserCache(userId: string): Promise<void> {
        // Implementação padrão - deve ser sobrescrita
    }

    async clearExpiredCache(): Promise<void> {
        // Implementação padrão - deve ser sobrescrita
    }

    // Operações de métricas
    async recordSearchMetrics(query: UserSearchQuery, result: SearchResult): Promise<void> {
        // Implementação padrão - deve ser sobrescrita
    }

    async getSearchStatistics(userId?: string): Promise<SearchStatistics> {
        // Implementação padrão - deve ser sobrescrita
        return {
            totalSearches: 0,
            successfulSearches: 0,
            failedSearches: 0,
            averageResponseTime: 0,
            cacheHitRate: 0,
            topSearchTerms: [],
            searchTypesDistribution: {},
            errorDistribution: {},
        }
    }

    async getPopularSearchTerms(
        limit: number = 10,
    ): Promise<Array<{ term: string; count: number }>> {
        // Implementação padrão - deve ser sobrescrita
        return []
    }

    async getSearchSuggestions(partialTerm: string, userId?: string): Promise<string[]> {
        // Implementação padrão - deve ser sobrescrita
        return []
    }

    // Operações de validação e segurança
    async validateSearchCriteria(criteria: SearchCriteria): Promise<ValidationResult> {
        const errors: string[] = []
        const warnings: string[] = []

        // Validações básicas
        if (!criteria.searchTerm || criteria.searchTerm.trim().length === 0) {
            errors.push("Search term é obrigatório")
        }

        if (
            criteria.searchTerm &&
            criteria.searchTerm.length < this.config.security.minSearchTermLength
        ) {
            errors.push(
                `Search term deve ter pelo menos ${this.config.security.minSearchTermLength} caracteres`,
            )
        }

        if (
            criteria.searchTerm &&
            criteria.searchTerm.length > this.config.security.maxSearchTermLength
        ) {
            errors.push(
                `Search term não pode ter mais de ${this.config.security.maxSearchTermLength} caracteres`,
            )
        }

        if (criteria.pagination.limit > this.config.search.maxLimit) {
            errors.push(`Limit não pode ser maior que ${this.config.search.maxLimit}`)
        }

        // Verificações de segurança
        if (criteria.searchTerm) {
            const suspiciousPatterns = this.config.security.suspiciousPatterns
            const lowerTerm = criteria.searchTerm.toLowerCase()
            for (const pattern of suspiciousPatterns) {
                if (lowerTerm.includes(pattern)) {
                    errors.push("Search term contém padrões suspeitos")
                    break
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    async checkRateLimit(userId: string, ipAddress: string): Promise<RateLimitStatus> {
        // Implementação padrão - deve ser sobrescrita
        return {
            allowed: true,
            remaining: 100,
            resetAt: new Date(Date.now() + 3600000), // 1 hora
            limit: 100,
        }
    }

    async recordSearchAttempt(userId: string, ipAddress: string): Promise<void> {
        // Implementação padrão - deve ser sobrescrita
    }

    // Operações de configuração
    async getSearchEngineConfig(): Promise<SearchEngineConfig> {
        return this.config
    }

    async updateSearchEngineConfig(config: Partial<SearchEngineConfig>): Promise<void> {
        // Implementação padrão - deve ser sobrescrita
        Object.assign(this.config, config)
    }

    // Métodos auxiliares protegidos
    protected generateCacheKey(criteria: SearchCriteria): string {
        const criteriaString = JSON.stringify(criteria)
        return `search:${Buffer.from(criteriaString).toString("base64")}`
    }

    protected isValidSearchTerm(term: string): boolean {
        return (
            term &&
            term.trim().length >= this.config.security.minSearchTermLength &&
            term.length <= this.config.security.maxSearchTermLength &&
            !this.containsSuspiciousPatterns(term)
        )
    }

    protected containsSuspiciousPatterns(term: string): boolean {
        const lowerTerm = term.toLowerCase()
        return this.config.security.suspiciousPatterns.some((pattern) =>
            lowerTerm.includes(pattern),
        )
    }

    protected sanitizeSearchTerm(term: string): string {
        return term.trim().replace(/[<>{}()\[\]]/g, "")
    }
}
