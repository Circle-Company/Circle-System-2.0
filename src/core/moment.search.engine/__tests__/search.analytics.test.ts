import { beforeEach, describe, expect, it, vi } from "vitest"
import { SearchQuery, SearchResult } from "../types"

import { SearchAnalytics } from "../analytics/search.analytics"

describe("SearchAnalytics", () => {
    let analytics: SearchAnalytics
    let mockQuery: SearchQuery
    let mockResult: SearchResult

    beforeEach(() => {
        analytics = new SearchAnalytics()
        mockQuery = {
            term: "vídeo sobre vlog",
            filters: {},
            pagination: { limit: 20, offset: 0 },
        }
        mockResult = {
            moments: [],
            total: 100,
            page: 1,
            limit: 20,
            totalPages: 5,
            searchTime: 150,
            suggestions: [],
        }
    })

    describe("recordSearch", () => {
        it("deve registrar busca com sucesso", () => {
            const initialStats = analytics.getStats()
            analytics.recordSearch(mockQuery, mockResult, 150)
            const updatedStats = analytics.getStats()

            expect(updatedStats.totalSearches).toBe(initialStats.totalSearches + 1)
            expect(updatedStats.averageResponseTime).toBe(150)
        })

        it("deve atualizar tempo médio de resposta", () => {
            analytics.recordSearch(mockQuery, mockResult, 100)
            analytics.recordSearch(mockQuery, mockResult, 200)

            const stats = analytics.getStats()
            expect(stats.averageResponseTime).toBe(150) // (100 + 200) / 2
        })

        it("deve atualizar top queries", () => {
            analytics.recordSearch(mockQuery, mockResult, 150)

            const stats = analytics.getStats()
            expect(stats.topQueries).toHaveLength(1)
            expect(stats.topQueries[0].query).toBe("vídeo sobre vlog")
            expect(stats.topQueries[0].count).toBe(1)
            expect(stats.topQueries[0].avgResponseTime).toBe(150)
        })

        it("deve incrementar contador para query repetida", () => {
            analytics.recordSearch(mockQuery, mockResult, 100)
            analytics.recordSearch(mockQuery, mockResult, 200)

            const stats = analytics.getStats()
            expect(stats.topQueries).toHaveLength(1)
            expect(stats.topQueries[0].count).toBe(2)
            expect(stats.topQueries[0].avgResponseTime).toBe(150) // (100 + 200) / 2
        })

        it("deve manter apenas top 10 queries", () => {
            // Adicionar 15 queries diferentes
            for (let i = 0; i < 15; i++) {
                const query = { ...mockQuery, term: `query${i}` }
                analytics.recordSearch(query, mockResult, 100)
            }

            const stats = analytics.getStats()
            expect(stats.topQueries).toHaveLength(10)
        })

        it("deve ordenar queries por contagem", () => {
            analytics.recordSearch({ ...mockQuery, term: "query1" }, mockResult, 100)
            analytics.recordSearch({ ...mockQuery, term: "query2" }, mockResult, 100)
            analytics.recordSearch({ ...mockQuery, term: "query1" }, mockResult, 100)

            const stats = analytics.getStats()
            expect(stats.topQueries[0].query).toBe("query1")
            expect(stats.topQueries[0].count).toBe(2)
            expect(stats.topQueries[1].query).toBe("query2")
            expect(stats.topQueries[1].count).toBe(1)
        })
    })

    describe("recordError", () => {
        it("deve registrar erro de busca", () => {
            const initialStats = analytics.getStats()
            const error = new Error("Erro de busca")

            analytics.recordError(mockQuery, error)

            const updatedStats = analytics.getStats()
            expect(updatedStats.errorRate).toBeGreaterThan(initialStats.errorRate)
        })

        it("deve calcular taxa de erro corretamente", () => {
            // Primeiro registro de busca
            analytics.recordSearch(mockQuery, mockResult, 100)

            // Primeiro erro
            analytics.recordError(mockQuery, new Error("Erro 1"))

            let stats = analytics.getStats()
            expect(stats.errorRate).toBe(0.5) // 1 erro de 2 operações

            // Segundo erro
            analytics.recordError(mockQuery, new Error("Erro 2"))

            stats = analytics.getStats()
            expect(stats.errorRate).toBe(0.67) // 2 erros de 3 operações (aproximadamente)
        })
    })

    describe("recordCacheHit", () => {
        it("deve registrar hit do cache", () => {
            // Mock do logger para verificar se foi chamado
            const loggerSpy = vi.spyOn(console, "log")

            analytics.recordCacheHit()

            expect(loggerSpy).toHaveBeenCalledWith("Cache hit recorded")

            loggerSpy.mockRestore()
        })
    })

    describe("recordCacheMiss", () => {
        it("deve registrar miss do cache", () => {
            // Mock do logger para verificar se foi chamado
            const loggerSpy = vi.spyOn(console, "log")

            analytics.recordCacheMiss()

            expect(loggerSpy).toHaveBeenCalledWith("Cache miss recorded")

            loggerSpy.mockRestore()
        })
    })

    describe("updatePerformanceMetrics", () => {
        it("deve atualizar métricas de performance", () => {
            const metrics = {
                memoryUsage: 1024,
                cpuUsage: 0.5,
                activeConnections: 10,
            }

            analytics.updatePerformanceMetrics(metrics)

            const stats = analytics.getStats()
            expect(stats.performanceMetrics.memoryUsage).toBe(1024)
            expect(stats.performanceMetrics.cpuUsage).toBe(0.5)
            expect(stats.performanceMetrics.activeConnections).toBe(10)
        })

        it("deve atualizar apenas métricas fornecidas", () => {
            // Definir métricas iniciais
            analytics.updatePerformanceMetrics({
                memoryUsage: 1024,
                cpuUsage: 0.5,
                activeConnections: 10,
            })

            // Atualizar apenas uma métrica
            analytics.updatePerformanceMetrics({
                memoryUsage: 2048,
            })

            const stats = analytics.getStats()
            expect(stats.performanceMetrics.memoryUsage).toBe(2048)
            expect(stats.performanceMetrics.cpuUsage).toBe(0.5) // Mantido
            expect(stats.performanceMetrics.activeConnections).toBe(10) // Mantido
        })
    })

    describe("getStats", () => {
        it("deve retornar cópia das estatísticas", () => {
            analytics.recordSearch(mockQuery, mockResult, 150)

            const stats1 = analytics.getStats()
            const stats2 = analytics.getStats()

            expect(stats1).not.toBe(stats2) // Diferentes objetos
            expect(stats1).toEqual(stats2) // Mesmo conteúdo
        })

        it("deve retornar estatísticas iniciais", () => {
            const stats = analytics.getStats()

            expect(stats.totalSearches).toBe(0)
            expect(stats.averageResponseTime).toBe(0)
            expect(stats.cacheHitRate).toBe(0)
            expect(stats.errorRate).toBe(0)
            expect(stats.topQueries).toEqual([])
            expect(stats.performanceMetrics.memoryUsage).toBe(0)
            expect(stats.performanceMetrics.cpuUsage).toBe(0)
            expect(stats.performanceMetrics.activeConnections).toBe(0)
        })
    })

    describe("resetStats", () => {
        it("deve resetar todas as estatísticas", () => {
            // Adicionar alguns dados
            analytics.recordSearch(mockQuery, mockResult, 150)
            analytics.recordError(mockQuery, new Error("Erro"))
            analytics.updatePerformanceMetrics({
                memoryUsage: 1024,
                cpuUsage: 0.5,
                activeConnections: 10,
            })

            // Resetar
            analytics.resetStats()

            const stats = analytics.getStats()
            expect(stats.totalSearches).toBe(0)
            expect(stats.averageResponseTime).toBe(0)
            expect(stats.cacheHitRate).toBe(0)
            expect(stats.errorRate).toBe(0)
            expect(stats.topQueries).toEqual([])
            expect(stats.performanceMetrics.memoryUsage).toBe(0)
            expect(stats.performanceMetrics.cpuUsage).toBe(0)
            expect(stats.performanceMetrics.activeConnections).toBe(0)
        })
    })
})
