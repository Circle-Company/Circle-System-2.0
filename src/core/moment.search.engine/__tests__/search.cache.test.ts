import { beforeEach, describe, expect, it } from "vitest"
import { SearchQuery, SearchResult } from "../types"

import { SearchCache } from "../cache/search.cache"

describe("SearchCache", () => {
    let cache: SearchCache
    let mockQuery: SearchQuery
    let mockResult: SearchResult

    beforeEach(() => {
        cache = new SearchCache(10, 1000) // 10 itens, 1 segundo TTL
        mockQuery = {
            term: "teste",
            filters: { status: ["PUBLISHED"] },
            pagination: { limit: 20, offset: 0 },
        }
        mockResult = {
            moments: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            searchTime: 100,
            suggestions: [],
        }
    })

    describe("get", () => {
        it("deve retornar null para cache vazio", () => {
            const result = cache.get(mockQuery)
            expect(result).toBeNull()
        })

        it("deve retornar resultado armazenado", () => {
            cache.set(mockQuery, mockResult)
            const result = cache.get(mockQuery)
            expect(result).toEqual(mockResult)
        })

        it("deve retornar null para entrada expirada", async () => {
            cache.set(mockQuery, mockResult)

            // Aguardar expiração
            await new Promise((resolve) => setTimeout(resolve, 1100))

            const result = cache.get(mockQuery)
            expect(result).toBeNull()
        })
    })

    describe("set", () => {
        it("deve armazenar resultado no cache", () => {
            cache.set(mockQuery, mockResult)
            const result = cache.get(mockQuery)
            expect(result).toEqual(mockResult)
        })

        it("deve remover entrada mais antiga quando cache está cheio", () => {
            // Preencher cache
            for (let i = 0; i < 10; i++) {
                const query = { ...mockQuery, term: `teste${i}` }
                const result = { ...mockResult, total: i }
                cache.set(query, result)
            }

            // Adicionar mais um item
            const newQuery = { ...mockQuery, term: "novo" }
            const newResult = { ...mockResult, total: 999 }
            cache.set(newQuery, newResult)

            // Verificar que o primeiro item foi removido
            const firstQuery = { ...mockQuery, term: "teste0" }
            expect(cache.get(firstQuery)).toBeNull()

            // Verificar que o novo item está presente
            expect(cache.get(newQuery)).toEqual(newResult)
        })
    })

    describe("cleanup", () => {
        it("deve remover entradas expiradas", async () => {
            cache.set(mockQuery, mockResult)

            // Aguardar expiração
            await new Promise((resolve) => setTimeout(resolve, 1100))

            cache.cleanup()
            const result = cache.get(mockQuery)
            expect(result).toBeNull()
        })
    })

    describe("clear", () => {
        it("deve limpar todo o cache", () => {
            cache.set(mockQuery, mockResult)
            cache.clear()

            const result = cache.get(mockQuery)
            expect(result).toBeNull()
        })
    })

    describe("getStats", () => {
        it("deve retornar estatísticas do cache", () => {
            cache.set(mockQuery, mockResult)
            const stats = cache.getStats()

            expect(stats.totalEntries).toBe(1)
            expect(stats.activeEntries).toBe(1)
            expect(stats.expiredEntries).toBe(0)
            expect(stats.memoryUsage).toBeGreaterThan(0)
        })
    })

    describe("generateCacheKey", () => {
        it("deve gerar chaves consistentes para mesma query", () => {
            const query1 = { ...mockQuery }
            const query2 = { ...mockQuery }

            cache.set(query1, mockResult)
            const result = cache.get(query2)

            expect(result).toEqual(mockResult)
        })

        it("deve gerar chaves diferentes para queries diferentes", () => {
            const query1 = { ...mockQuery, term: "teste1" }
            const query2 = { ...mockQuery, term: "teste2" }

            cache.set(query1, mockResult)
            const result = cache.get(query2)

            expect(result).toBeNull()
        })
    })
})
