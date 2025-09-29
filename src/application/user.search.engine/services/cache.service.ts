/**
 * Cache Service Interface
 *
 * Interface para operações de cache do sistema de busca
 */
export interface CacheServiceInterface {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T, ttl?: number): Promise<void>
    delete(key: string): Promise<void>
    exists(key: string): Promise<boolean>
    clear(): Promise<void>
    getStats(): Promise<CacheStats>
}

export interface CacheStats {
    hits: number
    misses: number
    hitRate: number
    totalKeys: number
    memoryUsage: number
    evictions: number
}

export interface CacheEntry<T> {
    data: T
    timestamp: number
    expiresAt: number
    hitCount: number
    lastAccessed: number
}

/**
 * In-Memory Cache Service
 *
 * Implementação de cache em memória para resultados de busca
 */
export class InMemoryCacheService implements CacheServiceInterface {
    private cache = new Map<string, CacheEntry<any>>()
    private stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
    }
    private maxSize: number
    private defaultTTL: number
    private cleanupInterval: NodeJS.Timeout | null = null

    constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
        this.maxSize = maxSize
        this.defaultTTL = defaultTTL
        this.startCleanupInterval()
    }

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key)

        if (!entry) {
            this.stats.misses++
            return null
        }

        // Verifica se a entrada expirou
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key)
            this.stats.misses++
            this.stats.evictions++
            return null
        }

        // Atualiza estatísticas
        entry.hitCount++
        entry.lastAccessed = Date.now()
        this.stats.hits++

        return entry.data as T
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const now = Date.now()
        const expiresAt = now + (ttl || this.defaultTTL)

        // Se o cache está cheio, remove a entrada mais antiga
        if (this.cache.size >= this.maxSize) {
            await this.evictOldestEntry()
        }

        const entry: CacheEntry<T> = {
            data: value,
            timestamp: now,
            expiresAt,
            hitCount: 0,
            lastAccessed: now,
        }

        this.cache.set(key, entry)
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key)
    }

    async exists(key: string): Promise<boolean> {
        const entry = this.cache.get(key)
        if (!entry) return false

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key)
            this.stats.evictions++
            return false
        }

        return true
    }

    async clear(): Promise<void> {
        this.cache.clear()
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
        }
    }

    async getStats(): Promise<CacheStats> {
        const totalRequests = this.stats.hits + this.stats.misses
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0

        // Calcula uso de memória aproximado
        let memoryUsage = 0
        for (const [key, entry] of this.cache) {
            memoryUsage += key.length * 2 // UTF-16 characters
            memoryUsage += JSON.stringify(entry).length * 2
        }

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate,
            totalKeys: this.cache.size,
            memoryUsage,
            evictions: this.stats.evictions,
        }
    }

    private async evictOldestEntry(): Promise<void> {
        let oldestKey: string | null = null
        let oldestTime = Date.now()

        for (const [key, entry] of this.cache) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed
                oldestKey = key
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey)
            this.stats.evictions++
        }
    }

    private startCleanupInterval(): void {
        // Limpa entradas expiradas a cada minuto
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredEntries()
        }, 60 * 1000)
    }

    private cleanupExpiredEntries(): void {
        const now = Date.now()
        const keysToDelete: string[] = []

        for (const [key, entry] of this.cache) {
            if (now > entry.expiresAt) {
                keysToDelete.push(key)
            }
        }

        for (const key of keysToDelete) {
            this.cache.delete(key)
            this.stats.evictions++
        }
    }

    public destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
            this.cleanupInterval = null
        }
    }
}

/**
 * Redis Cache Service
 *
 * Implementação de cache usando Redis (para produção)
 */
export class RedisCacheService implements CacheServiceInterface {
    private redis: any // Redis client
    private keyPrefix: string

    constructor(redisClient: any, keyPrefix: string = "user_search:") {
        this.redis = redisClient
        this.keyPrefix = keyPrefix
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const fullKey = this.keyPrefix + key
            const data = await this.redis.get(fullKey)

            if (!data) {
                return null
            }

            return JSON.parse(data) as T
        } catch (error) {
            console.error("Erro ao obter do cache Redis:", error)
            return null
        }
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        try {
            const fullKey = this.keyPrefix + key
            const data = JSON.stringify(value)

            if (ttl) {
                await this.redis.setex(fullKey, Math.floor(ttl / 1000), data)
            } else {
                await this.redis.set(fullKey, data)
            }
        } catch (error) {
            console.error("Erro ao salvar no cache Redis:", error)
        }
    }

    async delete(key: string): Promise<void> {
        try {
            const fullKey = this.keyPrefix + key
            await this.redis.del(fullKey)
        } catch (error) {
            console.error("Erro ao deletar do cache Redis:", error)
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const fullKey = this.keyPrefix + key
            const exists = await this.redis.exists(fullKey)
            return exists === 1
        } catch (error) {
            console.error("Erro ao verificar existência no cache Redis:", error)
            return false
        }
    }

    async clear(): Promise<void> {
        try {
            const pattern = this.keyPrefix + "*"
            const keys = await this.redis.keys(pattern)

            if (keys.length > 0) {
                await this.redis.del(...keys)
            }
        } catch (error) {
            console.error("Erro ao limpar cache Redis:", error)
        }
    }

    async getStats(): Promise<CacheStats> {
        try {
            const info = await this.redis.info("stats")
            const lines = info.split("\r\n")

            let hits = 0
            let misses = 0

            for (const line of lines) {
                if (line.startsWith("keyspace_hits:")) {
                    hits = parseInt(line.split(":")[1]) || 0
                } else if (line.startsWith("keyspace_misses:")) {
                    misses = parseInt(line.split(":")[1]) || 0
                }
            }

            const totalRequests = hits + misses
            const hitRate = totalRequests > 0 ? (hits / totalRequests) * 100 : 0

            // Conta chaves com nosso prefixo
            const pattern = this.keyPrefix + "*"
            const keys = await this.redis.keys(pattern)
            const totalKeys = keys.length

            return {
                hits,
                misses,
                hitRate,
                totalKeys,
                memoryUsage: 0, // Redis não fornece essa informação facilmente
                evictions: 0, // Redis não fornece essa informação facilmente
            }
        } catch (error) {
            console.error("Erro ao obter estatísticas do cache Redis:", error)
            return {
                hits: 0,
                misses: 0,
                hitRate: 0,
                totalKeys: 0,
                memoryUsage: 0,
                evictions: 0,
            }
        }
    }
}

/**
 * Cache Service Factory
 *
 * Factory para criar instâncias de cache baseado na configuração
 */
export class CacheServiceFactory {
    static create(type: "memory" | "redis", config?: any): CacheServiceInterface {
        switch (type) {
            case "memory":
                return new InMemoryCacheService(
                    config?.maxSize || 1000,
                    config?.defaultTTL || 5 * 60 * 1000,
                )

            case "redis":
                if (!config?.redisClient) {
                    throw new Error("Redis client é obrigatório para cache Redis")
                }
                return new RedisCacheService(
                    config.redisClient,
                    config?.keyPrefix || "user_search:",
                )

            default:
                throw new Error(`Tipo de cache não suportado: ${type}`)
        }
    }
}

/**
 * Cache Key Generator
 *
 * Utilitário para gerar chaves de cache consistentes
 */
export class CacheKeyGenerator {
    static generateSearchKey(
        searcherUserId: string,
        searchTerm: string,
        searchType: string,
        filters: any,
        pagination: any,
    ): string {
        const filterHash = this.hashObject(filters)
        const paginationHash = this.hashObject(pagination)

        return `search:${searcherUserId}:${this.sanitizeKey(
            searchTerm,
        )}:${searchType}:${filterHash}:${paginationHash}`
    }

    static generateSuggestionKey(
        userId: string,
        partialTerm: string,
        context: string,
        limit: number,
    ): string {
        return `suggestions:${context}:${userId}:${this.sanitizeKey(partialTerm)}:${limit}`
    }

    static generateUserCacheKey(userId: string): string {
        return `user:${userId}`
    }

    static generateRelationshipKey(userId1: string, userId2: string): string {
        const [id1, id2] = [userId1, userId2].sort()
        return `relationship:${id1}:${id2}`
    }

    private static sanitizeKey(key: string): string {
        return key
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "")
    }

    private static hashObject(obj: any): string {
        const str = JSON.stringify(obj, Object.keys(obj).sort())
        return Buffer.from(str)
            .toString("base64")
            .replace(/[^a-zA-Z0-9]/g, "")
    }
}
