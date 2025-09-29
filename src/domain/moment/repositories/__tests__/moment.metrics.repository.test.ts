import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    IMomentMetricsRepository,
    MomentMetricsAnalysisService,
    MomentMetricsFilters,
} from "../moment.metrics.repository"

import { MomentMetricsEntity } from "../../entities/moment.metrics.entity"

// Mock da implementação do repositório para testes
class MockMomentMetricsRepository implements IMomentMetricsRepository {
    private metrics: Map<string, MomentMetricsEntity> = new Map()

    async create(metrics: MomentMetricsEntity): Promise<MomentMetricsEntity> {
        this.metrics.set(metrics.id, metrics)
        return metrics
    }

    async findById(id: string): Promise<MomentMetricsEntity | null> {
        return this.metrics.get(id) || null
    }

    async findByMomentId(momentId: string): Promise<MomentMetricsEntity | null> {
        return Array.from(this.metrics.values()).find((m) => m.momentId === momentId) || null
    }

    async update(metrics: MomentMetricsEntity): Promise<MomentMetricsEntity> {
        if (!this.metrics.has(metrics.id)) {
            throw new Error(`Metrics with id ${metrics.id} not found`)
        }
        this.metrics.set(metrics.id, metrics)
        return metrics
    }

    async delete(id: string): Promise<void> {
        if (!this.metrics.has(id)) {
            throw new Error(`Metrics with id ${id} not found`)
        }
        this.metrics.delete(id)
    }

    async findTopByViews(limit?: number, offset?: number): Promise<MomentMetricsEntity[]> {
        const sorted = Array.from(this.metrics.values()).sort(
            (a, b) => b.views.totalViews - a.views.totalViews,
        )
        return this.applyPagination(sorted, limit, offset)
    }

    async findTopByEngagement(limit?: number, offset?: number): Promise<MomentMetricsEntity[]> {
        const sorted = Array.from(this.metrics.values()).sort(
            (a, b) => b.calculateEngagementRate() - a.calculateEngagementRate(),
        )
        return this.applyPagination(sorted, limit, offset)
    }

    async findTopByViralScore(limit?: number, offset?: number): Promise<MomentMetricsEntity[]> {
        const sorted = Array.from(this.metrics.values()).sort(
            (a, b) => b.viral.viralScore - a.viral.viralScore,
        )
        return this.applyPagination(sorted, limit, offset)
    }

    async findTopByTrendingScore(limit?: number, offset?: number): Promise<MomentMetricsEntity[]> {
        const sorted = Array.from(this.metrics.values()).sort(
            (a, b) => b.viral.trendingScore - a.viral.trendingScore,
        )
        return this.applyPagination(sorted, limit, offset)
    }

    async findTrendingContent(limit?: number, offset?: number): Promise<MomentMetricsEntity[]> {
        const trending = Array.from(this.metrics.values()).filter((m) => m.viral.trendingScore > 70)
        const sorted = trending.sort((a, b) => b.viral.trendingScore - a.viral.trendingScore)
        return this.applyPagination(sorted, limit, offset)
    }

    async findViralContent(limit?: number, offset?: number): Promise<MomentMetricsEntity[]> {
        const viral = Array.from(this.metrics.values()).filter((m) => m.viral.viralScore > 80)
        const sorted = viral.sort((a, b) => b.viral.viralScore - a.viral.viralScore)
        return this.applyPagination(sorted, limit, offset)
    }

    async findHighEngagementContent(
        limit?: number,
        offset?: number,
    ): Promise<MomentMetricsEntity[]> {
        const highEngagement = Array.from(this.metrics.values()).filter(
            (m) => m.calculateEngagementRate() > 0.15,
        )
        const sorted = highEngagement.sort(
            (a, b) => b.calculateEngagementRate() - a.calculateEngagementRate(),
        )
        return this.applyPagination(sorted, limit, offset)
    }

    async findHighQualityContent(limit?: number, offset?: number): Promise<MomentMetricsEntity[]> {
        const highQuality = Array.from(this.metrics.values()).filter(
            (m) => m.content.contentQualityScore > 80,
        )
        const sorted = highQuality.sort(
            (a, b) => b.content.contentQualityScore - a.content.contentQualityScore,
        )
        return this.applyPagination(sorted, limit, offset)
    }

    async getAverageMetrics(): Promise<{
        averageViews: number
        averageEngagement: number
        averageViralScore: number
        averageTrendingScore: number
    }> {
        const metrics = Array.from(this.metrics.values())
        if (metrics.length === 0) {
            return {
                averageViews: 0,
                averageEngagement: 0,
                averageViralScore: 0,
                averageTrendingScore: 0,
            }
        }

        const totalViews = metrics.reduce((sum, m) => sum + m.views.totalViews, 0)
        const totalEngagement = metrics.reduce((sum, m) => sum + m.calculateEngagementRate(), 0)
        const totalViralScore = metrics.reduce((sum, m) => sum + m.viral.viralScore, 0)
        const totalTrendingScore = metrics.reduce((sum, m) => sum + m.viral.trendingScore, 0)

        return {
            averageViews: totalViews / metrics.length,
            averageEngagement: totalEngagement / metrics.length,
            averageViralScore: totalViralScore / metrics.length,
            averageTrendingScore: totalTrendingScore / metrics.length,
        }
    }

    async getMetricsDistribution(): Promise<{
        viewsDistribution: Record<string, number>
        engagementDistribution: Record<string, number>
        viralScoreDistribution: Record<string, number>
        trendingScoreDistribution: Record<string, number>
    }> {
        const metrics = Array.from(this.metrics.values())
        return {
            viewsDistribution: this.calculateDistribution(metrics.map((m) => m.views.totalViews)),
            engagementDistribution: this.calculateDistribution(
                metrics.map((m) => m.calculateEngagementRate()),
            ),
            viralScoreDistribution: this.calculateDistribution(
                metrics.map((m) => m.viral.viralScore),
            ),
            trendingScoreDistribution: this.calculateDistribution(
                metrics.map((m) => m.viral.trendingScore),
            ),
        }
    }

    async getMetricsByTimeRange(
        startDate: Date,
        endDate: Date,
        limit?: number,
        offset?: number,
    ): Promise<MomentMetricsEntity[]> {
        const filtered = Array.from(this.metrics.values()).filter((m) => {
            const updateTime = m.lastMetricsUpdate
            return updateTime >= startDate && updateTime <= endDate
        })
        return this.applyPagination(filtered, limit, offset)
    }

    async countByViewsRange(minViews: number, maxViews: number): Promise<number> {
        return Array.from(this.metrics.values()).filter(
            (m) => m.views.totalViews >= minViews && m.views.totalViews <= maxViews,
        ).length
    }

    async countByEngagementRange(minEngagement: number, maxEngagement: number): Promise<number> {
        return Array.from(this.metrics.values()).filter((m) => {
            const engagement = m.calculateEngagementRate()
            return engagement >= minEngagement && engagement <= maxEngagement
        }).length
    }

    async countByViralScoreRange(minScore: number, maxScore: number): Promise<number> {
        return Array.from(this.metrics.values()).filter(
            (m) => m.viral.viralScore >= minScore && m.viral.viralScore <= maxScore,
        ).length
    }

    async countByTrendingScoreRange(minScore: number, maxScore: number): Promise<number> {
        return Array.from(this.metrics.values()).filter(
            (m) => m.viral.trendingScore >= minScore && m.viral.trendingScore <= maxScore,
        ).length
    }

    async exists(id: string): Promise<boolean> {
        return this.metrics.has(id)
    }

    async existsByMomentId(momentId: string): Promise<boolean> {
        return Array.from(this.metrics.values()).some((m) => m.momentId === momentId)
    }

    async createMany(metrics: MomentMetricsEntity[]): Promise<MomentMetricsEntity[]> {
        metrics.forEach((m) => this.metrics.set(m.id, m))
        return metrics
    }

    async updateMany(metrics: MomentMetricsEntity[]): Promise<MomentMetricsEntity[]> {
        metrics.forEach((m) => {
            if (!this.metrics.has(m.id)) {
                throw new Error(`Metrics with id ${m.id} not found`)
            }
            this.metrics.set(m.id, m)
        })
        return metrics
    }

    async deleteMany(ids: string[]): Promise<void> {
        ids.forEach((id) => {
            if (!this.metrics.has(id)) {
                throw new Error(`Metrics with id ${id} not found`)
            }
            this.metrics.delete(id)
        })
    }

    async findPaginated(
        page: number,
        limit: number,
        filters?: MomentMetricsFilters,
    ): Promise<{
        metrics: MomentMetricsEntity[]
        total: number
        page: number
        limit: number
        totalPages: number
    }> {
        let metrics = Array.from(this.metrics.values())

        // Aplicar filtros se fornecidos
        if (filters) {
            if (filters.minViews !== undefined) {
                metrics = metrics.filter((m) => m.views.totalViews >= filters.minViews!)
            }
            if (filters.maxViews !== undefined) {
                metrics = metrics.filter((m) => m.views.totalViews <= filters.maxViews!)
            }
            if (filters.minViralScore !== undefined) {
                metrics = metrics.filter((m) => m.viral.viralScore >= filters.minViralScore!)
            }
            if (filters.maxViralScore !== undefined) {
                metrics = metrics.filter((m) => m.viral.viralScore <= filters.maxViralScore!)
            }
        }

        const total = metrics.length
        const offset = (page - 1) * limit
        const paginatedMetrics = metrics.slice(offset, offset + limit)
        const totalPages = Math.ceil(total / limit)

        return {
            metrics: paginatedMetrics,
            total,
            page,
            limit,
            totalPages,
        }
    }

    private applyPagination(
        items: MomentMetricsEntity[],
        limit?: number,
        offset?: number,
    ): MomentMetricsEntity[] {
        if (offset !== undefined) {
            items = items.slice(offset)
        }
        if (limit !== undefined) {
            items = items.slice(0, limit)
        }
        return items
    }

    private calculateDistribution(values: number[]): Record<string, number> {
        const ranges = {
            "0-25": 0,
            "26-50": 0,
            "51-75": 0,
            "76-100": 0,
        }

        values.forEach((value) => {
            if (value <= 25) ranges["0-25"]++
            else if (value <= 50) ranges["26-50"]++
            else if (value <= 75) ranges["51-75"]++
            else ranges["76-100"]++
        })

        return ranges
    }
}

// Helper para criar MomentMetricsEntity de teste
function createTestMetrics(
    id: string,
    momentId: string,
    overrides: Partial<any> = {},
): MomentMetricsEntity {
    const defaultMetrics = {
        views: {
            totalViews: 100,
            uniqueViews: 80,
            viewsByRegion: {},
            viewsByDevice: {},
            viewsByCountry: {},
            viewsByCity: {},
            averageWatchTime: 15,
            completionViews: 60,
            averageCompletionRate: 0.75,
            peakViewTime: null,
            lastViewTime: null,
        },
        engagement: {
            totalLikes: 10,
            totalComments: 5,
            totalReports: 0,
            likeRate: 0.1,
            commentRate: 0.05,
            reportRate: 0,
            averageCommentLength: 20,
            topCommenters: [],
            engagementScore: 0.15,
            lastEngagementTime: null,
        },
        performance: {
            loadTime: 2.5,
            bufferTime: 0.5,
            errorRate: 0.01,
            successRate: 0.99,
            averageQuality: 80,
            qualityDistribution: {},
            bandwidthUsage: 1024,
            serverResponseTime: 200,
            cdnHitRate: 0.95,
            lastPerformanceUpdate: null,
        },
        viral: {
            viralScore: 50,
            viralReach: 100,
            reachByPlatform: {},
            reachByUserType: {},
            viralCoefficient: 1.2,
            viralVelocity: 10,
            peakViralTime: null,
            viralDecayRate: 0.1,
            lastViralUpdate: null,
            trendingScore: 50,
        },
        audience: {
            demographics: {
                ageGroups: {},
                genders: {},
                locations: {},
                interests: {},
            },
            behavior: {
                averageSessionTime: 30,
                bounceRate: 0.2,
                returnRate: 0.3,
                engagementDepth: 0.5,
                contentPreference: {},
            },
            growth: {
                followerGrowth: 5,
                subscriberGrowth: 2,
                engagementGrowth: 0.1,
                reachGrowth: 0.2,
            },
            lastAudienceUpdate: null,
        },
        content: {
            contentQualityScore: 80,
            contentRating: 4.5,
            moderationScore: 90,
            accessibilityScore: 85,
            seoScore: 70,
            contentTags: [],
            contentCategories: [],
            contentSentiment: 0.8,
            contentComplexity: 0.6,
            lastContentUpdate: null,
        },
        monetization: {
            totalRevenue: 0,
            revenueBySource: {},
            revenueByPeriod: {},
            averageRevenuePerView: 0,
            averageRevenuePerUser: 0,
            conversionRate: 0,
            costPerAcquisition: 0,
            returnOnInvestment: 0,
            profitMargin: 0,
            lastMonetizationUpdate: null,
        },
        lastMetricsUpdate: new Date(),
        metricsVersion: "1.0",
        dataQuality: 95,
        confidenceLevel: 90,
        calculateEngagementRate: vi.fn().mockReturnValue(0.15),
        calculateViralScore: vi.fn().mockReturnValue(50),
        calculateROI: vi.fn().mockReturnValue(0),
    }

    const metrics = {
        id,
        momentId,
        ...defaultMetrics,
        ...overrides,
    } as any

    return metrics
}

describe("MomentMetricsRepository", () => {
    let repository: MockMomentMetricsRepository
    let testMetrics: MomentMetricsEntity

    beforeEach(() => {
        repository = new MockMomentMetricsRepository()
        testMetrics = createTestMetrics("test-metrics-1", "moment-1")
    })

    describe("Operações CRUD básicas", () => {
        it("deve criar métricas", async () => {
            const result = await repository.create(testMetrics)
            expect(result).toEqual(testMetrics)
            expect(await repository.exists(testMetrics.id)).toBe(true)
        })

        it("deve encontrar métricas por ID", async () => {
            await repository.create(testMetrics)
            const found = await repository.findById(testMetrics.id)
            expect(found).toEqual(testMetrics)
        })

        it("deve retornar null para ID inexistente", async () => {
            const found = await repository.findById("inexistent-id")
            expect(found).toBeNull()
        })

        it("deve encontrar métricas por momentId", async () => {
            await repository.create(testMetrics)
            const found = await repository.findByMomentId(testMetrics.momentId)
            expect(found).toEqual(testMetrics)
        })

        it("deve retornar null para momentId inexistente", async () => {
            const found = await repository.findByMomentId("inexistent-moment")
            expect(found).toBeNull()
        })

        it("deve atualizar métricas existentes", async () => {
            await repository.create(testMetrics)
            testMetrics.views.totalViews = 200
            const updated = await repository.update(testMetrics)
            expect(updated.views.totalViews).toBe(200)
        })

        it("deve lançar erro ao atualizar métricas inexistentes", async () => {
            await expect(repository.update(testMetrics)).rejects.toThrow(
                `Metrics with id ${testMetrics.id} not found`,
            )
        })

        it("deve deletar métricas existentes", async () => {
            await repository.create(testMetrics)
            await repository.delete(testMetrics.id)
            expect(await repository.exists(testMetrics.id)).toBe(false)
        })

        it("deve lançar erro ao deletar métricas inexistentes", async () => {
            await expect(repository.delete("inexistent-id")).rejects.toThrow(
                "Metrics with id inexistent-id not found",
            )
        })
    })

    describe("Busca por ranking", () => {
        it("deve encontrar top por visualizações", async () => {
            const metrics1 = createTestMetrics("id-1", "moment-1", {
                views: { ...testMetrics.views, totalViews: 100 },
            })
            const metrics2 = createTestMetrics("id-2", "moment-2", {
                views: { ...testMetrics.views, totalViews: 300 },
            })
            const metrics3 = createTestMetrics("id-3", "moment-3", {
                views: { ...testMetrics.views, totalViews: 200 },
            })

            await repository.createMany([metrics1, metrics2, metrics3])

            const topByViews = await repository.findTopByViews()
            expect(topByViews).toHaveLength(3)
            expect(topByViews[0].id).toBe("id-2") // 300 views
            expect(topByViews[1].id).toBe("id-3") // 200 views
            expect(topByViews[2].id).toBe("id-1") // 100 views
        })

        it("deve encontrar top por engajamento", async () => {
            const metrics1 = createTestMetrics("id-1", "moment-1", {
                calculateEngagementRate: vi.fn().mockReturnValue(0.1),
            })
            const metrics2 = createTestMetrics("id-2", "moment-2", {
                calculateEngagementRate: vi.fn().mockReturnValue(0.3),
            })
            const metrics3 = createTestMetrics("id-3", "moment-3", {
                calculateEngagementRate: vi.fn().mockReturnValue(0.2),
            })

            await repository.createMany([metrics1, metrics2, metrics3])

            const topByEngagement = await repository.findTopByEngagement()
            expect(topByEngagement).toHaveLength(3)
            expect(topByEngagement[0].id).toBe("id-2") // 0.3 engagement
            expect(topByEngagement[1].id).toBe("id-3") // 0.2 engagement
            expect(topByEngagement[2].id).toBe("id-1") // 0.1 engagement
        })
    })

    describe("Busca de conteúdo especial", () => {
        it("deve encontrar conteúdo viral", async () => {
            const viralMetrics = createTestMetrics("viral-1", "moment-1", {
                viral: { ...testMetrics.viral, viralScore: 85 },
            })
            const normalMetrics = createTestMetrics("normal-1", "moment-2", {
                viral: { ...testMetrics.viral, viralScore: 50 },
            })

            await repository.createMany([viralMetrics, normalMetrics])

            const viralContent = await repository.findViralContent()
            expect(viralContent).toHaveLength(1)
            expect(viralContent[0].id).toBe("viral-1")
        })

        it("deve encontrar conteúdo em alta", async () => {
            const trendingMetrics = createTestMetrics("trending-1", "moment-1", {
                viral: { ...testMetrics.viral, trendingScore: 75 },
            })
            const normalMetrics = createTestMetrics("normal-1", "moment-2", {
                viral: { ...testMetrics.viral, trendingScore: 50 },
            })

            await repository.createMany([trendingMetrics, normalMetrics])

            const trendingContent = await repository.findTrendingContent()
            expect(trendingContent).toHaveLength(1)
            expect(trendingContent[0].id).toBe("trending-1")
        })

        it("deve encontrar conteúdo de alta qualidade", async () => {
            const highQualityMetrics = createTestMetrics("quality-1", "moment-1", {
                content: { ...testMetrics.content, contentQualityScore: 85 },
            })
            const normalMetrics = createTestMetrics("normal-1", "moment-2", {
                content: { ...testMetrics.content, contentQualityScore: 70 },
            })

            await repository.createMany([highQualityMetrics, normalMetrics])

            const highQualityContent = await repository.findHighQualityContent()
            expect(highQualityContent).toHaveLength(1)
            expect(highQualityContent[0].id).toBe("quality-1")
        })
    })

    describe("Análise e agregação", () => {
        it("deve calcular métricas médias", async () => {
            const metrics1 = createTestMetrics("id-1", "moment-1", {
                views: { ...testMetrics.views, totalViews: 100 },
                viral: { ...testMetrics.viral, viralScore: 50 },
            })
            const metrics2 = createTestMetrics("id-2", "moment-2", {
                views: { ...testMetrics.views, totalViews: 300 },
                viral: { ...testMetrics.viral, viralScore: 70 },
            })

            await repository.createMany([metrics1, metrics2])

            const averages = await repository.getAverageMetrics()
            expect(averages.averageViews).toBe(200) // (100 + 300) / 2
            expect(averages.averageViralScore).toBe(60) // (50 + 70) / 2
        })

        it("deve retornar zeros para lista vazia", async () => {
            const averages = await repository.getAverageMetrics()
            expect(averages.averageViews).toBe(0)
            expect(averages.averageEngagement).toBe(0)
            expect(averages.averageViralScore).toBe(0)
        })

        it("deve calcular distribuição de métricas", async () => {
            const metrics1 = createTestMetrics("id-1", "moment-1", {
                views: { ...testMetrics.views, totalViews: 20 },
                viral: { ...testMetrics.viral, viralScore: 30 },
            })
            const metrics2 = createTestMetrics("id-2", "moment-2", {
                views: { ...testMetrics.views, totalViews: 60 },
                viral: { ...testMetrics.viral, viralScore: 80 },
            })

            await repository.createMany([metrics1, metrics2])

            const distribution = await repository.getMetricsDistribution()
            expect(distribution.viewsDistribution["0-25"]).toBe(1) // 20 views
            expect(distribution.viewsDistribution["51-75"]).toBe(1) // 60 views
            expect(distribution.viralScoreDistribution["26-50"]).toBe(1) // 30 viral
            expect(distribution.viralScoreDistribution["76-100"]).toBe(1) // 80 viral
        })
    })

    describe("Operações de existência", () => {
        it("deve verificar se métricas existem", async () => {
            await repository.create(testMetrics)
            expect(await repository.exists(testMetrics.id)).toBe(true)
            expect(await repository.exists("inexistent-id")).toBe(false)
        })

        it("deve verificar se momentId tem métricas", async () => {
            await repository.create(testMetrics)
            expect(await repository.existsByMomentId(testMetrics.momentId)).toBe(true)
            expect(await repository.existsByMomentId("inexistent-moment")).toBe(false)
        })
    })

    describe("Operações em lote", () => {
        it("deve criar múltiplas métricas", async () => {
            const metrics = [
                createTestMetrics("id-1", "moment-1"),
                createTestMetrics("id-2", "moment-2"),
                createTestMetrics("id-3", "moment-3"),
            ]

            const created = await repository.createMany(metrics)
            expect(created).toHaveLength(3)
            expect(await repository.exists("id-1")).toBe(true)
            expect(await repository.exists("id-2")).toBe(true)
            expect(await repository.exists("id-3")).toBe(true)
        })

        it("deve atualizar múltiplas métricas", async () => {
            const metrics = [
                createTestMetrics("id-1", "moment-1"),
                createTestMetrics("id-2", "moment-2"),
            ]

            await repository.createMany(metrics)

            metrics[0].views.totalViews = 500
            metrics[1].views.totalViews = 600

            const updated = await repository.updateMany(metrics)
            expect(updated[0].views.totalViews).toBe(500)
            expect(updated[1].views.totalViews).toBe(600)
        })

        it("deve deletar múltiplas métricas", async () => {
            const metrics = [
                createTestMetrics("id-1", "moment-1"),
                createTestMetrics("id-2", "moment-2"),
            ]

            await repository.createMany(metrics)

            await repository.deleteMany(["id-1", "id-2"])
            expect(await repository.exists("id-1")).toBe(false)
            expect(await repository.exists("id-2")).toBe(false)
        })
    })

    describe("Paginação", () => {
        it("deve retornar resultados paginados", async () => {
            const metrics = Array.from({ length: 5 }, (_, i) =>
                createTestMetrics(`id-${i}`, `moment-${i}`),
            )
            await repository.createMany(metrics)

            const result = await repository.findPaginated(1, 2)
            expect(result.metrics).toHaveLength(2)
            expect(result.total).toBe(5)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(2)
            expect(result.totalPages).toBe(3)
        })

        it("deve aplicar filtros na paginação", async () => {
            const metrics1 = createTestMetrics("id-1", "moment-1", {
                views: { ...testMetrics.views, totalViews: 100 },
            })
            const metrics2 = createTestMetrics("id-2", "moment-2", {
                views: { ...testMetrics.views, totalViews: 300 },
            })
            const metrics3 = createTestMetrics("id-3", "moment-3", {
                views: { ...testMetrics.views, totalViews: 200 },
            })

            await repository.createMany([metrics1, metrics2, metrics3])

            const result = await repository.findPaginated(1, 10, {
                minViews: 150,
                maxViews: 250,
            })
            expect(result.metrics).toHaveLength(1)
            expect(result.total).toBe(1)
            expect(result.metrics[0].id).toBe("id-3")
        })
    })
})

describe("MomentMetricsAnalysisService", () => {
    let repository: MockMomentMetricsRepository
    let analysisService: MomentMetricsAnalysisService

    beforeEach(() => {
        repository = new MockMomentMetricsRepository()
        analysisService = new MomentMetricsAnalysisService(repository)
    })

    describe("Análise de métricas", () => {
        it("deve analisar métricas de um momento específico", async () => {
            const metrics = createTestMetrics("test-1", "moment-1", {
                views: {
                    totalViews: 1000,
                    uniqueViews: 80,
                    viewsByRegion: {},
                    viewsByDevice: {},
                    viewsByCountry: {},
                    viewsByCity: {},
                    averageWatchTime: 15,
                    completionViews: 60,
                    averageCompletionRate: 0.75,
                    peakViewTime: null,
                    lastViewTime: null,
                },
                viral: {
                    viralScore: 80,
                    viralReach: 100,
                    reachByPlatform: {},
                    reachByUserType: {},
                    viralCoefficient: 1.2,
                    viralVelocity: 10,
                    peakViralTime: null,
                    viralDecayRate: 0.1,
                    lastViralUpdate: null,
                    trendingScore: 50,
                },
            })
            await repository.create(metrics)

            const analysis = await analysisService.analyzeMoment("moment-1")
            // Com apenas uma métrica, não há top performers (precisa ser > média * 1.5)
            expect(analysis.performanceAnalysis.topPerformers).toHaveLength(0)
            expect(analysis.viralAnalysis.viralContent).toHaveLength(1)
        })

        it("deve lançar erro para momento inexistente", async () => {
            await expect(analysisService.analyzeMoment("inexistent-moment")).rejects.toThrow(
                "Métricas não encontradas para o momento inexistent-moment",
            )
        })

        it("deve analisar múltiplas métricas", async () => {
            const metrics1 = createTestMetrics("id-1", "moment-1", {
                views: {
                    totalViews: 1000,
                    uniqueViews: 80,
                    viewsByRegion: {},
                    viewsByDevice: {},
                    viewsByCountry: {},
                    viewsByCity: {},
                    averageWatchTime: 15,
                    completionViews: 60,
                    averageCompletionRate: 0.75,
                    peakViewTime: null,
                    lastViewTime: null,
                },
                calculateEngagementRate: vi.fn().mockReturnValue(0.2),
            })
            const metrics2 = createTestMetrics("id-2", "moment-2", {
                views: {
                    totalViews: 500,
                    uniqueViews: 80,
                    viewsByRegion: {},
                    viewsByDevice: {},
                    viewsByCountry: {},
                    viewsByCity: {},
                    averageWatchTime: 15,
                    completionViews: 60,
                    averageCompletionRate: 0.75,
                    peakViewTime: null,
                    lastViewTime: null,
                },
                calculateEngagementRate: vi.fn().mockReturnValue(0.1),
            })

            const analysis = await analysisService.analyzeMetrics([metrics1, metrics2])
            expect(analysis.performanceAnalysis.averagePerformance).toBe(750) // (1000 + 500) / 2
            expect(analysis.engagementAnalysis.averageEngagement).toBeCloseTo(0.15, 2) // (0.2 + 0.1) / 2
        })

        it("deve lançar erro para lista vazia", async () => {
            await expect(analysisService.analyzeMetrics([])).rejects.toThrow(
                "Nenhuma métrica fornecida para análise",
            )
        })

        it("deve gerar recomendações baseadas nas métricas", async () => {
            // Criar duas métricas para ter uma média de comparação
            const lowViewsMetrics = createTestMetrics("id-1", "moment-1", {
                views: {
                    totalViews: 50,
                    uniqueViews: 80,
                    viewsByRegion: {},
                    viewsByDevice: {},
                    viewsByCountry: {},
                    viewsByCity: {},
                    averageWatchTime: 15,
                    completionViews: 60,
                    averageCompletionRate: 0.75,
                    peakViewTime: null,
                    lastViewTime: null,
                },
                calculateEngagementRate: vi.fn().mockReturnValue(0.05),
            })

            const highViewsMetrics = createTestMetrics("id-2", "moment-2", {
                views: {
                    totalViews: 200,
                    uniqueViews: 80,
                    viewsByRegion: {},
                    viewsByDevice: {},
                    viewsByCountry: {},
                    viewsByCity: {},
                    averageWatchTime: 15,
                    completionViews: 60,
                    averageCompletionRate: 0.75,
                    peakViewTime: null,
                    lastViewTime: null,
                },
                calculateEngagementRate: vi.fn().mockReturnValue(0.25),
            })

            const analysis = await analysisService.analyzeMetrics([
                lowViewsMetrics,
                highViewsMetrics,
            ])
            // Agora com média de 125 views, 50 views é considerado baixo (< média * 0.5)
            expect(analysis.recommendations.contentOptimization).toHaveLength(1)
            expect(analysis.recommendations.engagementImprovement).toHaveLength(1)
        })
    })
})
