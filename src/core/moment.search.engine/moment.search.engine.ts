import { defaultSearchConfig, searchRules } from "./config"
import {
    MomentSearchResult,
    SearchContext,
    SearchEngineConfig,
    SearchEngineStats,
    SearchQuery,
    SearchResult,
} from "./types"

import { SearchAnalytics } from "./analytics/search.analytics"
import { SearchCache } from "./cache/search.cache"
import { FilterEngine } from "./engines/filter.engine"
import { HashtagSearcher } from "./engines/hashtag.searcher"
import { LocationSearcher } from "./engines/location.searcher"
import { RankingEngine } from "./engines/ranking.engine"
import { TextSearcher } from "./engines/text.searcher"

export class MomentSearchEngine {
    private readonly config: SearchEngineConfig
    private readonly textSearcher: TextSearcher
    private readonly locationSearcher: LocationSearcher
    private readonly hashtagSearcher: HashtagSearcher
    private readonly rankingEngine: RankingEngine
    private readonly filterEngine: FilterEngine
    private readonly logger = console
    private repository?: any // Repository para busca real
    private readonly cache: SearchCache
    private readonly analytics: SearchAnalytics

    // Estatísticas
    private stats: SearchEngineStats = {
        totalSearches: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        topQueries: [],
        performanceMetrics: {
            memoryUsage: 0,
            cpuUsage: 0,
            activeConnections: 0,
        },
    }

    constructor(config: SearchEngineConfig = defaultSearchConfig, repository?: any) {
        this.config = config
        this.repository = repository
        this.textSearcher = new TextSearcher()
        this.locationSearcher = new LocationSearcher()
        this.hashtagSearcher = new HashtagSearcher()
        this.rankingEngine = new RankingEngine(config)
        this.filterEngine = new FilterEngine()
        this.cache = new SearchCache()
        this.analytics = new SearchAnalytics()
    }

    /**
     * Executa busca de momentos
     */
    async search(query: SearchQuery, context?: SearchContext): Promise<SearchResult> {
        const startTime = Date.now()
        this.stats.totalSearches++

        try {
            // Validar query
            this.validateQuery(query)

            // Aplicar filtros padrão
            const mergedFilters = this.mergeFilters(query.filters)

            // Executar buscas em paralelo
            const searchResults = await this.executeParallelSearches(
                {
                    ...query,
                    filters: mergedFilters,
                },
                context,
            )

            // Combinar e deduplicar resultados
            const combinedResults = this.combineResults(searchResults)

            // Aplicar filtros
            const filteredResults = await this.filterEngine.filter(
                combinedResults,
                mergedFilters,
                context,
            )

            // Ranquear resultados
            const rankedResults = await this.rankingEngine.rank(filteredResults, context)

            // Aplicar paginação
            const paginatedResults = this.applyPagination(rankedResults, query.pagination)

            // Calcular estatísticas
            const searchTime = Date.now() - startTime
            this.updateStats(searchTime)

            // Gerar sugestões
            const suggestions = await this.generateSuggestions(query.term)

            return {
                moments: paginatedResults,
                total: rankedResults.length,
                page: this.calculatePage(query.pagination),
                limit: query.pagination?.limit || this.config.defaultLimit,
                totalPages: this.calculateTotalPages(
                    rankedResults.length,
                    query.pagination?.limit || this.config.defaultLimit,
                ),
                searchTime,
                suggestions,
                filters: this.buildAppliedFilters(mergedFilters),
            }
        } catch (error) {
            this.stats.errorRate =
                (this.stats.errorRate * (this.stats.totalSearches - 1) + 1) /
                this.stats.totalSearches
            this.logger.error("Search failed:", error)
            throw error
        }
    }

    /**
     * Valida a query de busca
     */
    private validateQuery(query: SearchQuery): void {
        if (!query.term || query.term.trim().length === 0) {
            throw new Error("Termo de busca é obrigatório")
        }

        if (query.term.length < searchRules.validation.minTermLength) {
            throw new Error(
                `Termo de busca deve ter pelo menos ${searchRules.validation.minTermLength} caracteres`,
            )
        }

        if (query.term.length > searchRules.validation.maxTermLength) {
            throw new Error(
                `Termo de busca não pode exceder ${searchRules.validation.maxTermLength} caracteres`,
            )
        }

        if (query.pagination?.limit && query.pagination.limit > this.config.maxResults) {
            throw new Error(`Limite não pode exceder ${this.config.maxResults} resultados`)
        }
    }

    /**
     * Mescla filtros com padrões
     */
    private mergeFilters(filters?: any): any {
        return {
            ...this.config.defaultFilters,
            ...filters,
        }
    }

    /**
     * Executa buscas em paralelo
     */
    private async executeParallelSearches(
        query: SearchQuery,
        context?: SearchContext,
    ): Promise<MomentSearchResult[][]> {
        const searches: Promise<MomentSearchResult[]>[] = []

        // Busca textual
        searches.push(this.textSearcher.search(query, context))

        // Busca por localização (se especificada)
        if (query.filters?.location) {
            searches.push(this.locationSearcher.search(query, context))
        }

        // Busca por hashtags (se detectada)
        if (this.hasHashtags(query.term) || query.filters?.hashtags) {
            searches.push(this.hashtagSearcher.search(query, context))
        }

        // Executar em paralelo com timeout
        const results = await Promise.allSettled(searches)

        return results
            .filter((result) => result.status === "fulfilled")
            .map((result) => (result as PromiseFulfilledResult<MomentSearchResult[]>).value)
    }

    /**
     * Verifica se o termo contém hashtags
     */
    private hasHashtags(term: string): boolean {
        return /#\w+/.test(term)
    }

    /**
     * Combina e deduplica resultados
     */
    private combineResults(searchResults: MomentSearchResult[][]): MomentSearchResult[] {
        const seen = new Set<string>()
        const combined: MomentSearchResult[] = []

        for (const results of searchResults) {
            for (const result of results) {
                if (!seen.has(result.id)) {
                    seen.add(result.id)
                    combined.push(result)
                }
            }
        }

        return combined
    }

    /**
     * Aplica paginação
     */
    private applyPagination(results: MomentSearchResult[], pagination?: any): MomentSearchResult[] {
        const limit = pagination?.limit || this.config.defaultLimit
        const offset = pagination?.offset || 0

        return results.slice(offset, offset + limit)
    }

    /**
     * Calcula página atual
     */
    private calculatePage(pagination?: any): number {
        const limit = pagination?.limit || this.config.defaultLimit
        const offset = pagination?.offset || 0
        return Math.floor(offset / limit) + 1
    }

    /**
     * Calcula total de páginas
     */
    private calculateTotalPages(total: number, limit: number): number {
        return Math.ceil(total / limit)
    }

    /**
     * Gera sugestões de busca
     */
    private async generateSuggestions(term: string): Promise<string[]> {
        // TODO: Implementar geração de sugestões baseada em buscas anteriores
        // Por enquanto, retorna sugestões mockadas
        const mockSuggestions = [
            `${term} tutorial`,
            `${term} dicas`,
            `${term} review`,
            `como usar ${term}`,
            `melhor ${term}`,
        ]

        return mockSuggestions.slice(0, searchRules.performance.maxSuggestions)
    }

    /**
     * Constrói filtros aplicados
     */
    private buildAppliedFilters(filters: any): any {
        return {
            status: filters.status || [],
            visibility: filters.visibility || [],
            dateRange:
                filters.dateFrom || filters.dateTo
                    ? {
                          from: filters.dateFrom,
                          to: filters.dateTo,
                      }
                    : undefined,
            location: filters.location,
            hashtags: filters.hashtags || [],
            quality: {
                minLikes: filters.minLikes || 0,
                minViews: filters.minViews || 0,
                minComments: filters.minComments || 0,
            },
        }
    }

    /**
     * Atualiza estatísticas
     */
    private updateStats(searchTime: number): void {
        this.stats.averageResponseTime =
            (this.stats.averageResponseTime * (this.stats.totalSearches - 1) + searchTime) /
            this.stats.totalSearches
    }

    /**
     * Obtém estatísticas do motor
     */
    getStats(): SearchEngineStats {
        return { ...this.stats }
    }

    /**
     * Reseta estatísticas
     */
    resetStats(): void {
        this.stats = {
            totalSearches: 0,
            averageResponseTime: 0,
            cacheHitRate: 0,
            errorRate: 0,
            topQueries: [],
            performanceMetrics: {
                memoryUsage: 0,
                cpuUsage: 0,
                activeConnections: 0,
            },
        }
    }

    /**
     * Atualiza configuração
     */
    updateConfig(newConfig: Partial<SearchEngineConfig>): void {
        Object.assign(this.config, newConfig)
    }

    /**
     * Obtém configuração atual
     */
    getConfig(): SearchEngineConfig {
        return { ...this.config }
    }
}
