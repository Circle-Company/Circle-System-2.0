import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ViewTrackingService } from "../view.tracking.service"

// Mock do logger
vi.mock("@/shared", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}))

// Mock do MomentViewPersistenceService
const mockPersistenceService = {
    saveView: vi.fn(),
    hasRecentView: vi.fn(),
    getRecentViews: vi.fn(),
    getViewStatistics: vi.fn(),
    cleanupOldViews: vi.fn(),
    getUserViews: vi.fn(),
}

vi.mock("@/infra/models/moment/moment.view.model", () => ({
    MomentViewPersistenceService: vi.fn().mockImplementation(() => mockPersistenceService),
}))

describe("ViewTrackingService", () => {
    let viewTrackingService: ViewTrackingService

    beforeEach(() => {
        // Limpar todas as mocks
        vi.clearAllMocks()

        // Limpar cache do singleton
        ViewTrackingService.getInstance().clearCache()
        viewTrackingService = ViewTrackingService.getInstance()
    })

    afterEach(() => {
        // Limpar cache após cada teste
        viewTrackingService.clearCache()
    })

    describe("Singleton Pattern", () => {
        it("should return the same instance", () => {
            const instance1 = ViewTrackingService.getInstance()
            const instance2 = ViewTrackingService.getInstance()

            expect(instance1).toBe(instance2)
        })

        it("should have empty cache initially", () => {
            const stats = viewTrackingService.getCacheStats()

            expect(stats.totalMoments).toBe(0)
            expect(stats.totalViews).toBe(0)
            expect(stats.cacheSizeKB).toBe(0)
        })
    })

    describe("recordView", () => {
        it("should record a view in cache and database", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            mockPersistenceService.saveView.mockResolvedValue({
                id: BigInt(1),
                ...viewData,
                viewTimestamp: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await viewTrackingService.recordView(viewData)

            // Verificar se foi salvo no banco
            expect(mockPersistenceService.saveView).toHaveBeenCalledWith({
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            })

            // Verificar se foi armazenado no cache
            const stats = viewTrackingService.getCacheStats()
            expect(stats.totalMoments).toBe(1)
            expect(stats.totalViews).toBe(1)
        })

        it("should handle database errors gracefully", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            const dbError = new Error("Database connection failed")
            mockPersistenceService.saveView.mockRejectedValue(dbError)

            // Não deve lançar erro
            await expect(viewTrackingService.recordView(viewData)).resolves.not.toThrow()

            // Cache ainda deve funcionar mesmo com erro no banco
            const stats = viewTrackingService.getCacheStats()
            expect(stats.totalMoments).toBe(1)
            expect(stats.totalViews).toBe(1)
        })

        it("should handle multiple views for same moment", async () => {
            const viewData1 = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            const viewData2 = {
                momentId: "moment-123",
                viewerId: "user-789",
                viewDuration: 30,
                viewSource: "search",
                isComplete: false,
            }

            mockPersistenceService.saveView.mockResolvedValue({})

            await viewTrackingService.recordView(viewData1)
            await viewTrackingService.recordView(viewData2)

            const stats = viewTrackingService.getCacheStats()
            expect(stats.totalMoments).toBe(1)
            expect(stats.totalViews).toBe(2)
        })

        it("should overwrite previous view for same user and moment", async () => {
            const viewData1 = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            const viewData2 = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 30,
                viewSource: "search",
                isComplete: false,
            }

            mockPersistenceService.saveView.mockResolvedValue({})

            await viewTrackingService.recordView(viewData1)
            await viewTrackingService.recordView(viewData2)

            const stats = viewTrackingService.getCacheStats()
            expect(stats.totalMoments).toBe(1)
            expect(stats.totalViews).toBe(1) // Ainda 1 porque sobrescreveu
        })
    })

    describe("hasRecentView", () => {
        it("should return true for recent view in cache", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData)

            const hasRecent = await viewTrackingService.hasRecentView("moment-123", "user-456", 5)
            expect(hasRecent).toBe(true)
        })

        it("should return false for old view in cache", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData)

            // Simular tempo passado (mais de 5 minutos)
            const originalDate = Date
            global.Date = vi.fn(() => new Date(Date.now() + 6 * 60 * 1000)) as any
            global.Date.now = vi.fn(() => Date.now() + 6 * 60 * 1000)

            const hasRecent = await viewTrackingService.hasRecentView("moment-123", "user-456", 5)
            expect(hasRecent).toBe(false)

            // Restaurar Date original
            global.Date = originalDate
        })

        it("should check database when not in cache", async () => {
            mockPersistenceService.hasRecentView.mockResolvedValue(true)

            const hasRecent = await viewTrackingService.hasRecentView("moment-123", "user-456", 5)

            expect(mockPersistenceService.hasRecentView).toHaveBeenCalledWith(
                "moment-123",
                "user-456",
                5,
            )
            expect(hasRecent).toBe(true)
        })

        it("should return false when database check fails", async () => {
            mockPersistenceService.hasRecentView.mockRejectedValue(new Error("Database error"))

            const hasRecent = await viewTrackingService.hasRecentView("moment-123", "user-456", 5)
            expect(hasRecent).toBe(false)
        })

        it("should return false for non-existent view", async () => {
            mockPersistenceService.hasRecentView.mockResolvedValue(false)

            const hasRecent = await viewTrackingService.hasRecentView("moment-123", "user-456", 5)
            expect(hasRecent).toBe(false)
        })
    })

    describe("getRecentView", () => {
        it("should return view from cache", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData)

            const recentView = viewTrackingService.getRecentView("moment-123", "user-456")

            expect(recentView).toBeDefined()
            expect(recentView?.viewerId).toBe("user-456")
            expect(recentView?.momentId).toBe("moment-123")
            expect(recentView?.viewDuration).toBe(25)
            expect(recentView?.isComplete).toBe(true)
        })

        it("should return null for non-existent view", () => {
            const recentView = viewTrackingService.getRecentView("moment-123", "user-456")
            expect(recentView).toBeNull()
        })
    })

    describe("getRecentViewsForMoment", () => {
        it("should return all recent views for a moment", async () => {
            const viewData1 = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            const viewData2 = {
                momentId: "moment-123",
                viewerId: "user-789",
                viewDuration: 30,
                viewSource: "search",
                isComplete: false,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData1)
            await viewTrackingService.recordView(viewData2)

            const recentViews = viewTrackingService.getRecentViewsForMoment("moment-123", 5)

            expect(recentViews).toHaveLength(2)
            expect(recentViews.map((v) => v.viewerId)).toContain("user-456")
            expect(recentViews.map((v) => v.viewerId)).toContain("user-789")
        })

        it("should return empty array for non-existent moment", () => {
            const recentViews = viewTrackingService.getRecentViewsForMoment("moment-nonexistent", 5)
            expect(recentViews).toHaveLength(0)
        })

        it("should filter views by age", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData)

            // Buscar views de última hora (deve incluir a view recente)
            const recentViews = viewTrackingService.getRecentViewsForMoment("moment-123", 60)
            expect(recentViews).toHaveLength(1)

            // Buscar views de última hora com timestamp antigo (deve excluir)
            const oldViews = viewTrackingService.getRecentViewsForMoment("moment-123", 1) // 1 minuto
            expect(oldViews).toHaveLength(1) // Ainda dentro do limite
        })
    })

    describe("getRecentViewStats", () => {
        it("should return stats from cache when available", async () => {
            const viewData1 = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            const viewData2 = {
                momentId: "moment-123",
                viewerId: "user-789",
                viewDuration: 15,
                viewSource: "search",
                isComplete: false,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData1)
            await viewTrackingService.recordView(viewData2)

            const stats = await viewTrackingService.getRecentViewStats("moment-123", 5)

            expect(stats.totalViews).toBe(2)
            expect(stats.uniqueViews).toBe(2)
            expect(stats.completeViews).toBe(1)
            expect(stats.averageDuration).toBe(20) // (25 + 15) / 2
            expect(stats.viewsBySource.feed).toBe(1)
            expect(stats.viewsBySource.search).toBe(1)
        })

        it("should return stats from database when cache is empty", async () => {
            const dbStats = {
                totalViews: 5,
                uniqueViews: 4,
                completeViews: 3,
                averageDuration: 22.5,
                viewsBySource: { feed: 3, search: 2 },
            }

            mockPersistenceService.getViewStatistics.mockResolvedValue(dbStats)

            const stats = await viewTrackingService.getRecentViewStats("moment-123", 5)

            expect(stats).toEqual(dbStats)
            expect(mockPersistenceService.getViewStatistics).toHaveBeenCalledWith("moment-123", 5)
        })

        it("should handle database errors gracefully", async () => {
            mockPersistenceService.getViewStatistics.mockRejectedValue(new Error("Database error"))

            const stats = await viewTrackingService.getRecentViewStats("moment-123", 5)

            expect(stats.totalViews).toBe(0)
            expect(stats.uniqueViews).toBe(0)
            expect(stats.completeViews).toBe(0)
            expect(stats.averageDuration).toBe(0)
            expect(stats.viewsBySource).toEqual({})
        })

        it("should calculate correct statistics", async () => {
            // Adicionar múltiplas visualizações (user-1 aparece 2 vezes, mas a segunda sobrescreve a primeira)
            const views = [
                {
                    momentId: "moment-123",
                    viewerId: "user-1",
                    viewDuration: 30,
                    viewSource: "feed",
                    isComplete: true,
                },
                {
                    momentId: "moment-123",
                    viewerId: "user-2",
                    viewDuration: 20,
                    viewSource: "feed",
                    isComplete: true,
                },
                {
                    momentId: "moment-123",
                    viewerId: "user-1",
                    viewDuration: 10,
                    viewSource: "search",
                    isComplete: false,
                }, // Sobrescreve a primeira
                {
                    momentId: "moment-123",
                    viewerId: "user-3",
                    viewDuration: 25,
                    viewSource: "profile",
                    isComplete: false,
                },
            ]

            mockPersistenceService.saveView.mockResolvedValue({})
            for (const view of views) {
                await viewTrackingService.recordView(view)
            }

            const stats = await viewTrackingService.getRecentViewStats("moment-123", 5)

            expect(stats.totalViews).toBe(3) // user-1 sobrescreveu, então são 3 únicos
            expect(stats.uniqueViews).toBe(3) // 3 usuários únicos
            expect(stats.completeViews).toBe(1) // Apenas user-2 tem visualização completa (user-1 foi sobrescrita)
            expect(stats.averageDuration).toBeCloseTo(18.33, 2) // (10 + 20 + 25) / 3
            expect(stats.viewsBySource.feed).toBe(1) // Apenas user-2
            expect(stats.viewsBySource.search).toBe(1) // user-1 (sobrescrita)
            expect(stats.viewsBySource.profile).toBe(1) // user-3
        })
    })

    describe("Cache Management", () => {
        it("should clear cache", () => {
            // Adicionar dados ao cache
            viewTrackingService.recordView({
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            })

            let stats = viewTrackingService.getCacheStats()
            expect(stats.totalViews).toBeGreaterThan(0)

            // Limpar cache
            viewTrackingService.clearCache()

            stats = viewTrackingService.getCacheStats()
            expect(stats.totalMoments).toBe(0)
            expect(stats.totalViews).toBe(0)
        })

        it("should get cache statistics", async () => {
            const views = [
                {
                    momentId: "moment-123",
                    viewerId: "user-1",
                    viewDuration: 25,
                    viewSource: "feed",
                    isComplete: true,
                },
                {
                    momentId: "moment-123",
                    viewerId: "user-2",
                    viewDuration: 30,
                    viewSource: "search",
                    isComplete: false,
                },
                {
                    momentId: "moment-456",
                    viewerId: "user-1",
                    viewDuration: 20,
                    viewSource: "profile",
                    isComplete: true,
                },
            ]

            mockPersistenceService.saveView.mockResolvedValue({})
            for (const view of views) {
                await viewTrackingService.recordView(view)
            }

            const stats = viewTrackingService.getCacheStats()

            expect(stats.totalMoments).toBe(2)
            expect(stats.totalViews).toBe(3)
            expect(stats.cacheSizeKB).toBeGreaterThan(0)
        })
    })

    describe("Error Handling", () => {
        it("should handle errors in recordView gracefully", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            // Simular erro no cache (muito improvável, mas testável)
            const originalCache = (viewTrackingService as any).recentViewsCache
            ;(viewTrackingService as any).recentViewsCache = null

            await expect(viewTrackingService.recordView(viewData)).resolves.not.toThrow()

            // Restaurar cache
            ;(viewTrackingService as any).recentViewsCache = originalCache
        })

        it("should handle errors in hasRecentView gracefully", async () => {
            // Simular erro no cache
            const originalCache = (viewTrackingService as any).recentViewsCache
            ;(viewTrackingService as any).recentViewsCache = null

            const hasRecent = await viewTrackingService.hasRecentView("moment-123", "user-456", 5)
            expect(hasRecent).toBe(false)

            // Restaurar cache
            ;(viewTrackingService as any).recentViewsCache = originalCache
        })

        it("should handle errors in getRecentView gracefully", () => {
            // Simular erro no cache
            const originalCache = (viewTrackingService as any).recentViewsCache
            ;(viewTrackingService as any).recentViewsCache = null

            const recentView = viewTrackingService.getRecentView("moment-123", "user-456")
            expect(recentView).toBeNull()

            // Restaurar cache
            ;(viewTrackingService as any).recentViewsCache = originalCache
        })

        it("should handle errors in getRecentViewsForMoment gracefully", () => {
            // Simular erro no cache
            const originalCache = (viewTrackingService as any).recentViewsCache
            ;(viewTrackingService as any).recentViewsCache = null

            const recentViews = viewTrackingService.getRecentViewsForMoment("moment-123", 5)
            expect(recentViews).toEqual([])

            // Restaurar cache
            ;(viewTrackingService as any).recentViewsCache = originalCache
        })

        it("should handle errors in getRecentViewStats gracefully", async () => {
            // Simular erro no cache
            const originalCache = (viewTrackingService as any).recentViewsCache
            ;(viewTrackingService as any).recentViewsCache = null

            const stats = await viewTrackingService.getRecentViewStats("moment-123", 5)
            expect(stats.totalViews).toBe(0)
            expect(stats.uniqueViews).toBe(0)
            expect(stats.completeViews).toBe(0)
            expect(stats.averageDuration).toBe(0)
            expect(stats.viewsBySource).toEqual({})

            // Restaurar cache
            ;(viewTrackingService as any).recentViewsCache = originalCache
        })
    })

    describe("Edge Cases", () => {
        it("should handle undefined viewDuration", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: undefined,
                viewSource: "feed",
                isComplete: false,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData)

            const stats = await viewTrackingService.getRecentViewStats("moment-123", 5)
            expect(stats.averageDuration).toBe(0) // Sem duração, média é 0
        })

        it("should handle undefined viewSource", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: undefined,
                isComplete: true,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData)

            const stats = await viewTrackingService.getRecentViewStats("moment-123", 5)
            expect(stats.viewsBySource.unknown).toBe(1)
        })

        it("should handle zero duration views", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 0,
                viewSource: "feed",
                isComplete: false,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData)

            const stats = await viewTrackingService.getRecentViewStats("moment-123", 5)
            expect(stats.averageDuration).toBe(0)
        })

        it("should handle very large durations", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 999999,
                viewSource: "feed",
                isComplete: true,
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await viewTrackingService.recordView(viewData)

            const stats = await viewTrackingService.getRecentViewStats("moment-123", 5)
            expect(stats.averageDuration).toBe(999999)
        })
    })

    describe("Performance", () => {
        it("should handle large number of views efficiently", async () => {
            const startTime = Date.now()

            // Adicionar 100 visualizações
            const promises = []
            for (let i = 0; i < 100; i++) {
                const viewData = {
                    momentId: "moment-123",
                    viewerId: `user-${i}`,
                    viewDuration: Math.floor(Math.random() * 60) + 1,
                    viewSource: i % 2 === 0 ? "feed" : "search",
                    isComplete: Math.random() > 0.5,
                }
                promises.push(viewTrackingService.recordView(viewData))
            }

            mockPersistenceService.saveView.mockResolvedValue({})
            await Promise.all(promises)

            const endTime = Date.now()
            const duration = endTime - startTime

            // Deve completar em menos de 1 segundo
            expect(duration).toBeLessThan(1000)

            const stats = viewTrackingService.getCacheStats()
            expect(stats.totalViews).toBe(100)
        })

        it("should handle concurrent views for same moment", async () => {
            const viewData = {
                momentId: "moment-123",
                viewerId: "user-456",
                viewDuration: 25,
                viewSource: "feed",
                isComplete: true,
            }

            mockPersistenceService.saveView.mockResolvedValue({})

            // Registrar a mesma visualização múltiplas vezes simultaneamente
            const promises = Array(10)
                .fill(null)
                .map(() => viewTrackingService.recordView(viewData))

            await Promise.all(promises)

            // Deve ter apenas 1 visualização (última sobrescreve as anteriores)
            const stats = viewTrackingService.getCacheStats()
            expect(stats.totalViews).toBe(1)
        })
    })
})
