import { SearchQuery, SearchResult } from "../types"

/**
 * Cache inteligente para resultados de busca
 */
export class SearchCache {
    private cache = new Map<string, CacheEntry>()
    private readonly maxSize: number
    private readonly ttl: number // Time to live em milissegundos

    constructor(maxSize = 1000, ttl = 600000) {
        // 10 minutos por padrão
        this.maxSize = maxSize
        this.ttl = ttl
    }

    /**
     * Gera chave de cache baseada na query
     */
    private generateCacheKey(query: SearchQuery): string {
        const key = {
            term: query.term,
            filters: query.filters,
            pagination: query.pagination,
        }
        return JSON.stringify(key)
    }

    /**
     * Obtém resultado do cache
     */
    get(query: SearchQuery): SearchResult | null {
        const key = this.generateCacheKey(query)
        const entry = this.cache.get(key)

        if (!entry) {
            return null
        }

        // Verificar se expirou
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key)
            return null
        }

        // Atualizar timestamp de acesso
        entry.timestamp = Date.now()
        return entry.result
    }

    /**
     * Armazena resultado no cache
     */
    set(query: SearchQuery, result: SearchResult): void {
        const key = this.generateCacheKey(query)

        // Verificar se cache está cheio
        if (this.cache.size >= this.maxSize) {
            this.evictOldest()
        }

        this.cache.set(key, {
            result,
            timestamp: Date.now(),
        })
    }

    /**
     * Remove entrada mais antiga do cache
     */
    private evictOldest(): void {
        let oldestKey = ""
        let oldestTime = Date.now()

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp
                oldestKey = key
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey)
        }
    }

    /**
     * Limpa cache expirado
     */
    cleanup(): void {
        const now = Date.now()
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key)
            }
        }
    }

    /**
     * Limpa todo o cache
     */
    clear(): void {
        this.cache.clear()
    }

    /**
     * Obtém estatísticas do cache
     */
    getStats(): CacheStats {
        const now = Date.now()
        let expired = 0
        let active = 0

        for (const entry of this.cache.values()) {
            if (now - entry.timestamp > this.ttl) {
                expired++
            } else {
                active++
            }
        }

        return {
            totalEntries: this.cache.size,
            activeEntries: active,
            expiredEntries: expired,
            hitRate: 0, // TODO: Implementar tracking de hit rate
            memoryUsage: this.estimateMemoryUsage(),
        }
    }

    /**
     * Estima uso de memória do cache
     */
    private estimateMemoryUsage(): number {
        let size = 0
        for (const [key, entry] of this.cache.entries()) {
            size += key.length * 2 // UTF-16
            size += JSON.stringify(entry.result).length * 2
            size += 8 // timestamp
        }
        return size
    }
}

interface CacheEntry {
    result: SearchResult
    timestamp: number
}

interface CacheStats {
    totalEntries: number
    activeEntries: number
    expiredEntries: number
    hitRate: number
    memoryUsage: number
}
