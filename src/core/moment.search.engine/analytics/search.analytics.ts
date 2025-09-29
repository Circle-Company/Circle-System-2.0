import { SearchEngineStats, SearchQuery, SearchResult } from "../types"

/**
 * Classe para análise e métricas de busca
 */
export class SearchAnalytics {
    private readonly logger = console
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

    /**
     * Registra uma busca realizada
     */
    recordSearch(query: SearchQuery, result: SearchResult, searchTime: number): void {
        this.stats.totalSearches++

        // Atualizar tempo médio de resposta
        this.stats.averageResponseTime =
            (this.stats.averageResponseTime * (this.stats.totalSearches - 1) + searchTime) /
            this.stats.totalSearches

        // Atualizar top queries
        this.updateTopQueries(query.term, searchTime)

        this.logger.log(`Search recorded: "${query.term}" in ${searchTime}ms`)
    }

    /**
     * Registra um erro de busca
     */
    recordError(query: SearchQuery, error: Error): void {
        this.stats.errorRate =
            (this.stats.errorRate * (this.stats.totalSearches - 1) + 1) / this.stats.totalSearches

        this.logger.error(`Search error: "${query.term}" - ${error.message}`)
    }

    /**
     * Registra hit do cache
     */
    recordCacheHit(): void {
        // TODO: Implementar tracking de cache hits
        this.logger.log("Cache hit recorded")
    }

    /**
     * Registra miss do cache
     */
    recordCacheMiss(): void {
        // TODO: Implementar tracking de cache misses
        this.logger.log("Cache miss recorded")
    }

    /**
     * Atualiza métricas de performance
     */
    updatePerformanceMetrics(metrics: {
        memoryUsage?: number
        cpuUsage?: number
        activeConnections?: number
    }): void {
        if (metrics.memoryUsage !== undefined) {
            this.stats.performanceMetrics.memoryUsage = metrics.memoryUsage
        }
        if (metrics.cpuUsage !== undefined) {
            this.stats.performanceMetrics.cpuUsage = metrics.cpuUsage
        }
        if (metrics.activeConnections !== undefined) {
            this.stats.performanceMetrics.activeConnections = metrics.activeConnections
        }
    }

    /**
     * Obtém estatísticas atuais
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
     * Atualiza top queries
     */
    private updateTopQueries(query: string, searchTime: number): void {
        const existingQuery = this.stats.topQueries.find((q) => q.query === query)

        if (existingQuery) {
            existingQuery.count++
            existingQuery.avgResponseTime =
                (existingQuery.avgResponseTime * (existingQuery.count - 1) + searchTime) /
                existingQuery.count
        } else {
            this.stats.topQueries.push({
                query,
                count: 1,
                avgResponseTime: searchTime,
            })
        }

        // Manter apenas top 10 queries
        this.stats.topQueries.sort((a, b) => b.count - a.count)
        this.stats.topQueries = this.stats.topQueries.slice(0, 10)
    }
}
