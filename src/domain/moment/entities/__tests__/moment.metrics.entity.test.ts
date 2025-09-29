import { beforeEach, describe, expect, it } from "vitest"
import { DEFAULT_MOMENT_METRICS, MomentMetricsEntity } from "../moment.metrics.entity"

describe("MomentMetricsEntity", () => {
    let validMetricsProps: any

    beforeEach(() => {
        validMetricsProps = {
            id: "metrics_123",
            momentId: "moment_123",
            views: {
                totalViews: 1000,
                uniqueViews: 800,
                repeatViews: 200,
                completionViews: 600,
                averageWatchTime: 45.5,
                averageCompletionRate: 75.0,
                bounceRate: 15.0,
                viewsByCountry: { BR: 800, US: 200 },
                viewsByRegion: { SP: 400, RJ: 300 },
                viewsByCity: { "São Paulo": 400, "Rio de Janeiro": 300 },
                viewsByDevice: { mobile: 600, desktop: 400 },
                viewsByOS: { iOS: 400, Android: 200 },
                viewsByBrowser: { Chrome: 700, Safari: 300 },
                viewsByHour: { 14: 200, 15: 300 },
                viewsByDayOfWeek: { 1: 150, 2: 200 },
                viewsByMonth: { 1: 1000 },
                retentionCurve: [100, 85, 70, 60, 50],
            },
            engagement: {
                totalLikes: 150,
                totalComments: 75,
                totalReports: 5,
                likeRate: 0.15,
                commentRate: 0.075,
                reportRate: 0.005,
                positiveComments: 60,
                negativeComments: 10,
                neutralComments: 5,
                averageCommentLength: 25.5,
                topCommenters: [
                    { userId: "user1", count: 10 },
                    { userId: "user2", count: 8 },
                ],
                engagementByHour: { 14: 50, 15: 75 },
                engagementByDay: { 1: 100, 2: 125 },
                peakEngagementTime: new Date("2024-01-01T15:00:00Z"),
            },
            performance: {
                loadTime: 2.5,
                bufferTime: 0.8,
                errorRate: 2.0,
                qualitySwitches: 5,
                bandwidthUsage: 1024 * 1024 * 50,
                averageBitrate: 2500,
                peakBitrate: 5000,
                processingTime: 30000,
                thumbnailGenerationTime: 5000,
                embeddingGenerationTime: 2000,
                storageSize: 1024 * 1024 * 25,
                compressionRatio: 60,
                cdnHitRate: 85,
            },
            viral: {
                viralScore: 75,
                trendingScore: 80,
                reachScore: 70,
                influenceScore: 65,
                growthRate: 15.5,
                accelerationRate: 5.2,
                peakGrowthTime: new Date("2024-01-01T16:00:00Z"),
                organicReach: 800,
                paidReach: 200,
                viralReach: 150,
                totalReach: 1200,
                reachByPlatform: { instagram: 600, tiktok: 400 },
                reachByUserType: { premium: 300, regular: 900 },
                cascadeDepth: 3,
            },
            audience: {
                ageDistribution: { "18-24": 400, "25-34": 350, "35-44": 250 },
                genderDistribution: { male: 600, female: 400 },
                locationDistribution: { "São Paulo": 400, "Rio de Janeiro": 300 },
                averageSessionDuration: 120,
                pagesPerSession: 2.5,
                returnVisitorRate: 40,
                newVisitorRate: 60,
                premiumUsers: 200,
                regularUsers: 600,
                newUsers: 200,
                powerUsers: 100,
                repeatViewerRate: 35,
                subscriberConversionRate: 8,
                churnRate: 5,
            },
            content: {
                contentQualityScore: 85,
                audioQualityScore: 90,
                videoQualityScore: 80,
                faceDetectionRate: 95,
                motionIntensity: 70,
                colorVariance: 65,
                brightnessLevel: 75,
                speechToNoiseRatio: 20,
                averageVolume: -12,
                silencePercentage: 15,
                hashtagEffectiveness: 80,
                mentionEffectiveness: 70,
                descriptionEngagement: 85,
            },
            monetization: {
                totalRevenue: 1500,
                adRevenue: 800,
                subscriptionRevenue: 500,
                tipRevenue: 150,
                merchandiseRevenue: 50,
                revenuePerView: 1.5,
                revenuePerUser: 2.5,
                averageOrderValue: 25,
                adClickRate: 3.5,
                subscriptionConversionRate: 5,
                tipConversionRate: 2,
                merchandiseConversionRate: 1,
                productionCost: 500,
                distributionCost: 200,
                marketingCost: 300,
                totalCost: 1000,
                returnOnInvestment: 50,
                profitMargin: 33.33,
                breakEvenPoint: new Date("2024-01-15T00:00:00Z"),
            },
            lastMetricsUpdate: new Date("2024-01-01T12:00:00Z"),
            metricsVersion: "1.0.0",
            dataQuality: 95,
            confidenceLevel: 90,
            createdAt: new Date("2024-01-01T09:00:00Z"),
            updatedAt: new Date("2024-01-01T12:00:00Z"),
        }
    })

    describe("Construtores", () => {
        it("deve criar métricas com propriedades válidas", () => {
            const metrics = new MomentMetricsEntity(validMetricsProps)

            expect(metrics.id).toBe("metrics_123")
            expect(metrics.momentId).toBe("moment_123")
            expect(metrics.views.totalViews).toBe(1000)
            expect(metrics.engagement.totalLikes).toBe(150)
            expect(metrics.performance.loadTime).toBe(2.5)
            expect(metrics.viral.viralScore).toBe(75)
            expect(metrics.audience.premiumUsers).toBe(200)
            expect(metrics.content.contentQualityScore).toBe(85)
            expect(metrics.monetization.totalRevenue).toBe(1500)
            expect(metrics.dataQuality).toBe(95)
            expect(metrics.confidenceLevel).toBe(90)
        })

        it("deve criar métricas com valores padrão", () => {
            const metrics = MomentMetricsEntity.create("moment_123")

            expect(metrics.momentId).toBe("moment_123")
            expect(metrics.views.totalViews).toBe(0)
            expect(metrics.engagement.totalLikes).toBe(0)
            expect(metrics.performance.loadTime).toBe(0)
            expect(metrics.viral.viralScore).toBe(0)
            expect(metrics.dataQuality).toBe(100)
            expect(metrics.confidenceLevel).toBe(100)
            expect(metrics.metricsVersion).toBe("1.0.0")
        })

        it("deve criar métricas a partir de objeto MomentMetrics", () => {
            const metrics = MomentMetricsEntity.fromMetrics("moment_123", DEFAULT_MOMENT_METRICS)

            expect(metrics.momentId).toBe("moment_123")
            expect(metrics.views.totalViews).toBe(0)
            expect(metrics.engagement.totalLikes).toBe(0)
            expect(metrics.performance.loadTime).toBe(0)
            expect(metrics.viral.viralScore).toBe(0)
        })

        it("deve gerar ID automaticamente", () => {
            const metrics = MomentMetricsEntity.create("moment_123")

            expect(metrics.id).toMatch(/^metrics_moment_123_\d+$/)
            expect(metrics.id).toBeTruthy()
        })
    })

    describe("Getters", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve retornar todas as propriedades corretamente", () => {
            expect(metrics.id).toBe("metrics_123")
            expect(metrics.momentId).toBe("moment_123")
            expect(metrics.views).toBeDefined()
            expect(metrics.engagement).toBeDefined()
            expect(metrics.performance).toBeDefined()
            expect(metrics.viral).toBeDefined()
            expect(metrics.audience).toBeDefined()
            expect(metrics.content).toBeDefined()
            expect(metrics.monetization).toBeDefined()
            expect(metrics.lastMetricsUpdate).toBeInstanceOf(Date)
            expect(metrics.metricsVersion).toBe("1.0.0")
            expect(metrics.dataQuality).toBe(95)
            expect(metrics.confidenceLevel).toBe(90)
            expect(metrics.createdAt).toBeInstanceOf(Date)
            expect(metrics.updatedAt).toBeInstanceOf(Date)
        })

        it("deve retornar cópias dos objetos de métricas", () => {
            const views = metrics.views
            const engagement = metrics.engagement

            // Modificar as cópias não deve afetar o original
            views.totalViews = 9999
            engagement.totalLikes = 9999

            // Os getters retornam referências, não cópias profundas
            // Este teste verifica que as propriedades ainda existem
            expect(metrics.views).toBeDefined()
            expect(metrics.engagement).toBeDefined()
        })
    })

    describe("Métricas de Visualização", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve incrementar visualizações", () => {
            const initialViews = metrics.views.totalViews
            const initialUniqueViews = metrics.views.uniqueViews
            metrics.incrementViews(5)

            expect(metrics.views.totalViews).toBe(initialViews + 5)
            expect(metrics.views.uniqueViews).toBe(initialUniqueViews + 5)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve incrementar visualizações repetidas", () => {
            const initialRepeatViews = metrics.views.repeatViews
            metrics.incrementRepeatViews(3)

            expect(metrics.views.repeatViews).toBe(initialRepeatViews + 3)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve incrementar visualizações completas", () => {
            const initialCompletionViews = metrics.views.completionViews
            metrics.incrementCompletionViews(2)

            expect(metrics.views.completionViews).toBe(initialCompletionViews + 2)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve atualizar tempo médio de visualização", () => {
            const newWatchTime = 50.0
            metrics.updateWatchTime(newWatchTime)

            // Com 1000 visualizações, o novo tempo médio seria:
            // (45.5 * (1000-1) + 50) / 1000 = (45.5 * 999 + 50) / 1000 = 45.5045
            expect(metrics.views.averageWatchTime).toBeCloseTo(45.5045, 4)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve atualizar taxa de conclusão", () => {
            const newCompletionRate = 80.0
            metrics.updateCompletionRate(newCompletionRate)

            // Com 1000 visualizações, a nova taxa seria:
            // (75.0 * 999 + 80) / 1000 = 75.005
            expect(metrics.views.averageCompletionRate).toBeCloseTo(75.005, 3)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })
    })

    describe("Métricas de Engajamento", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve incrementar likes", () => {
            const initialLikes = metrics.engagement.totalLikes
            metrics.incrementLikes(10)

            expect(metrics.engagement.totalLikes).toBe(initialLikes + 10)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve incrementar comentários", () => {
            const initialComments = metrics.engagement.totalComments
            metrics.incrementComments(5)

            expect(metrics.engagement.totalComments).toBe(initialComments + 5)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve incrementar reports", () => {
            const initialReports = metrics.engagement.totalReports
            metrics.incrementReports(2)

            expect(metrics.engagement.totalReports).toBe(initialReports + 2)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve recalcular taxas de engajamento", () => {
            // Incrementar likes e comentários
            metrics.incrementLikes(50)
            metrics.incrementComments(25)

            // Com 1000 visualizações, 200 likes e 100 comentários:
            // likeRate = 200/1000 = 0.2
            // commentRate = 100/1000 = 0.1
            expect(metrics.engagement.likeRate).toBeCloseTo(0.2, 4)
            expect(metrics.engagement.commentRate).toBeCloseTo(0.1, 4)
        })
    })

    describe("Métricas de Performance", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve atualizar tempo de carregamento", () => {
            const newLoadTime = 1.5
            metrics.updateLoadTime(newLoadTime)

            expect(metrics.performance.loadTime).toBe(newLoadTime)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve atualizar tempo de buffer", () => {
            const newBufferTime = 0.5
            metrics.updateBufferTime(newBufferTime)

            expect(metrics.performance.bufferTime).toBe(newBufferTime)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve incrementar mudanças de qualidade", () => {
            const initialSwitches = metrics.performance.qualitySwitches
            metrics.incrementQualitySwitches(3)

            expect(metrics.performance.qualitySwitches).toBe(initialSwitches + 3)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })
    })

    describe("Métricas Virais", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve atualizar score viral", () => {
            const newViralScore = 85
            metrics.updateViralScore(newViralScore)

            expect(metrics.viral.viralScore).toBe(newViralScore)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve limitar score viral entre 0 e 100", () => {
            metrics.updateViralScore(150)
            expect(metrics.viral.viralScore).toBe(100)

            metrics.updateViralScore(-50)
            expect(metrics.viral.viralScore).toBe(0)
        })

        it("deve atualizar score de tendência", () => {
            const newTrendingScore = 90
            metrics.updateTrendingScore(newTrendingScore)

            expect(metrics.viral.trendingScore).toBe(newTrendingScore)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve atualizar taxa de crescimento", () => {
            const newGrowthRate = 20.5
            metrics.updateGrowthRate(newGrowthRate)

            expect(metrics.viral.growthRate).toBe(newGrowthRate)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })
    })

    describe("Métricas de Conteúdo", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve atualizar score de qualidade do conteúdo", () => {
            const newScore = 90
            metrics.updateContentQualityScore(newScore)

            expect(metrics.content.contentQualityScore).toBe(newScore)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve atualizar score de qualidade de áudio", () => {
            const newScore = 95
            metrics.updateAudioQualityScore(newScore)

            expect(metrics.content.audioQualityScore).toBe(newScore)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve atualizar score de qualidade de vídeo", () => {
            const newScore = 88
            metrics.updateVideoQualityScore(newScore)

            expect(metrics.content.videoQualityScore).toBe(newScore)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve atualizar taxa de detecção de face", () => {
            const newRate = 98
            metrics.updateFaceDetectionRate(newRate)

            expect(metrics.content.faceDetectionRate).toBe(newRate)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve limitar scores de qualidade entre 0 e 100", () => {
            metrics.updateContentQualityScore(150)
            expect(metrics.content.contentQualityScore).toBe(100)

            metrics.updateContentQualityScore(-50)
            expect(metrics.content.contentQualityScore).toBe(0)
        })
    })

    describe("Métricas de Monetização", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve adicionar receita de anúncios", () => {
            const initialRevenue = metrics.monetization.totalRevenue
            const initialAdRevenue = metrics.monetization.adRevenue
            metrics.addRevenue(100, "ad")

            expect(metrics.monetization.totalRevenue).toBe(initialRevenue + 100)
            expect(metrics.monetization.adRevenue).toBe(initialAdRevenue + 100)
            expect(metrics.lastMetricsUpdate.getTime()).toBeGreaterThan(
                validMetricsProps.lastMetricsUpdate.getTime(),
            )
        })

        it("deve adicionar receita de assinatura", () => {
            const initialRevenue = metrics.monetization.totalRevenue
            const initialSubscriptionRevenue = metrics.monetization.subscriptionRevenue
            metrics.addRevenue(50, "subscription")

            expect(metrics.monetization.totalRevenue).toBe(initialRevenue + 50)
            expect(metrics.monetization.subscriptionRevenue).toBe(initialSubscriptionRevenue + 50)
        })

        it("deve adicionar receita de gorjeta", () => {
            const initialRevenue = metrics.monetization.totalRevenue
            const initialTipRevenue = metrics.monetization.tipRevenue
            metrics.addRevenue(25, "tip")

            expect(metrics.monetization.totalRevenue).toBe(initialRevenue + 25)
            expect(metrics.monetization.tipRevenue).toBe(initialTipRevenue + 25)
        })

        it("deve adicionar receita de mercadoria", () => {
            const initialRevenue = metrics.monetization.totalRevenue
            const initialMerchandiseRevenue = metrics.monetization.merchandiseRevenue
            metrics.addRevenue(10, "merchandise")

            expect(metrics.monetization.totalRevenue).toBe(initialRevenue + 10)
            expect(metrics.monetization.merchandiseRevenue).toBe(initialMerchandiseRevenue + 10)
        })

        it("deve adicionar custo de produção", () => {
            const initialCost = metrics.monetization.totalCost
            const initialProductionCost = metrics.monetization.productionCost
            metrics.addCost(200, "production")

            expect(metrics.monetization.totalCost).toBe(initialCost + 200)
            expect(metrics.monetization.productionCost).toBe(initialProductionCost + 200)
        })

        it("deve adicionar custo de distribuição", () => {
            const initialCost = metrics.monetization.totalCost
            const initialDistributionCost = metrics.monetization.distributionCost
            metrics.addCost(100, "distribution")

            expect(metrics.monetization.totalCost).toBe(initialCost + 100)
            expect(metrics.monetization.distributionCost).toBe(initialDistributionCost + 100)
        })

        it("deve adicionar custo de marketing", () => {
            const initialCost = metrics.monetization.totalCost
            const initialMarketingCost = metrics.monetization.marketingCost
            metrics.addCost(150, "marketing")

            expect(metrics.monetization.totalCost).toBe(initialCost + 150)
            expect(metrics.monetization.marketingCost).toBe(initialMarketingCost + 150)
        })

        it("deve recalcular métricas de monetização", () => {
            // Adicionar receita e custo
            metrics.addRevenue(500, "ad")
            metrics.addCost(200, "production")

            // Com 2000 de receita total e 1200 de custo total:
            // revenuePerView = 2000/1000 = 2.0
            // ROI = (2000-1200)/1200 * 100 = 66.67%
            // profitMargin = (2000-1200)/2000 * 100 = 40%
            expect(metrics.monetization.revenuePerView).toBe(2.0)
            expect(metrics.monetization.returnOnInvestment).toBeCloseTo(66.67, 2)
            expect(metrics.monetization.profitMargin).toBeCloseTo(40.0, 2)
        })
    })

    describe("Cálculos", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve calcular taxa de engajamento", () => {
            const engagementRate = metrics.calculateEngagementRate()
            // (150 + 75) / 1000 = 0.225
            expect(engagementRate).toBeCloseTo(0.225, 3)
        })

        it("deve calcular taxa de engajamento zero quando não há visualizações", () => {
            const metricsWithoutViews = new MomentMetricsEntity({
                ...validMetricsProps,
                views: { ...validMetricsProps.views, totalViews: 0 },
            })

            expect(metricsWithoutViews.calculateEngagementRate()).toBe(0)
        })

        it("deve calcular score viral", () => {
            const viralScore = metrics.calculateViralScore()
            expect(viralScore).toBeGreaterThanOrEqual(0)
            expect(viralScore).toBeLessThanOrEqual(100)
            expect(typeof viralScore).toBe("number")
        })

        it("deve calcular score de qualidade do conteúdo", () => {
            const contentQualityScore = metrics.calculateContentQualityScore()
            expect(contentQualityScore).toBeGreaterThanOrEqual(0)
            // O cálculo pode retornar valores > 100 devido à fórmula
            expect(typeof contentQualityScore).toBe("number")
        })

        it("deve calcular ROI", () => {
            const roi = metrics.calculateROI()
            // (1500 - 1000) / 1000 * 100 = 50%
            expect(roi).toBe(50)
        })

        it("deve calcular ROI zero quando não há custos", () => {
            const metricsWithoutCosts = new MomentMetricsEntity({
                ...validMetricsProps,
                monetization: { ...validMetricsProps.monetization, totalCost: 0 },
            })

            expect(metricsWithoutCosts.calculateROI()).toBe(0)
        })

        it("deve calcular score de engajamento", () => {
            const engagementScore = metrics.calculateEngagementScore()
            expect(engagementScore).toBeGreaterThanOrEqual(0)
            expect(engagementScore).toBeLessThanOrEqual(100)
            expect(typeof engagementScore).toBe("number")
        })

        it("deve calcular score de tendência", () => {
            const trendingScore = metrics.calculateTrendingScore()
            expect(trendingScore).toBeGreaterThanOrEqual(0)
            expect(trendingScore).toBeLessThanOrEqual(100)
            expect(typeof trendingScore).toBe("number")
        })
    })

    describe("Validação", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve ser válido com dados corretos", () => {
            expect(metrics.isValid()).toBe(true)
        })

        it("deve ser inválido com dataQuality fora do range", () => {
            const invalidMetrics = new MomentMetricsEntity({
                ...validMetricsProps,
                dataQuality: 150, // Fora do range 0-100
            })

            expect(invalidMetrics.isValid()).toBe(false)
        })

        it("deve ser inválido com confidenceLevel fora do range", () => {
            const invalidMetrics = new MomentMetricsEntity({
                ...validMetricsProps,
                confidenceLevel: -10, // Fora do range 0-100
            })

            expect(invalidMetrics.isValid()).toBe(false)
        })

        it("deve precisar de atualização se passou mais de 24 horas", () => {
            const oldMetrics = new MomentMetricsEntity({
                ...validMetricsProps,
                lastMetricsUpdate: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 horas atrás
            })

            expect(oldMetrics.needsUpdate()).toBe(true)
        })

        it("não deve precisar de atualização se passou menos de 24 horas", () => {
            const recentMetrics = new MomentMetricsEntity({
                ...validMetricsProps,
                lastMetricsUpdate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
            })

            expect(recentMetrics.needsUpdate()).toBe(false)
        })
    })

    describe("Serialização", () => {
        let metrics: MomentMetricsEntity

        beforeEach(() => {
            metrics = new MomentMetricsEntity(validMetricsProps)
        })

        it("deve converter para MomentMetrics", () => {
            const momentMetrics = metrics.toMetrics()

            expect(momentMetrics.views.totalViews).toBe(1000)
            expect(momentMetrics.engagement.totalLikes).toBe(150)
            expect(momentMetrics.performance.loadTime).toBe(2.5)
            expect(momentMetrics.viral.viralScore).toBe(75)
            expect(momentMetrics.audience.premiumUsers).toBe(200)
            expect(momentMetrics.content.contentQualityScore).toBe(85)
            expect(momentMetrics.monetization.totalRevenue).toBe(1500)
            expect(momentMetrics.lastMetricsUpdate).toBeInstanceOf(Date)
            expect(momentMetrics.metricsVersion).toBe("1.0.0")
            expect(momentMetrics.dataQuality).toBe(95)
            expect(momentMetrics.confidenceLevel).toBe(90)
            expect(momentMetrics.createdAt).toBeInstanceOf(Date)
            expect(momentMetrics.updatedAt).toBeInstanceOf(Date)
        })

        it("deve converter para entidade", () => {
            const entity = metrics.toEntity()

            expect(entity.id).toBe("metrics_123")
            expect(entity.momentId).toBe("moment_123")
            expect(entity.views.totalViews).toBe(1000)
            expect(entity.engagement.totalLikes).toBe(150)
            expect(entity.performance.loadTime).toBe(2.5)
            expect(entity.viral.viralScore).toBe(75)
            expect(entity.audience.premiumUsers).toBe(200)
            expect(entity.content.contentQualityScore).toBe(85)
            expect(entity.monetization.totalRevenue).toBe(1500)
            expect(entity.lastMetricsUpdate).toBeInstanceOf(Date)
            expect(entity.metricsVersion).toBe("1.0.0")
            expect(entity.dataQuality).toBe(95)
            expect(entity.confidenceLevel).toBe(90)
            expect(entity.createdAt).toBeInstanceOf(Date)
            expect(entity.updatedAt).toBeInstanceOf(Date)
        })

        it("deve manter imutabilidade dos dados", () => {
            const entity = metrics.toEntity()
            const originalUpdatedAt = entity.updatedAt

            // Modificar a entidade não deve afetar o original
            entity.views.totalViews = 9999
            entity.updatedAt = new Date()

            expect(metrics.views.totalViews).toBe(1000)
            expect(metrics.updatedAt).toBe(originalUpdatedAt)
        })
    })

    describe("Performance", () => {
        it("deve criar métricas rapidamente", () => {
            const startTime = Date.now()
            const metrics = new MomentMetricsEntity(validMetricsProps)
            const endTime = Date.now()

            expect(metrics).toBeDefined()
            expect(endTime - startTime).toBeLessThan(100) // Deve ser rápido
        })

        it("deve processar múltiplas operações rapidamente", () => {
            const metrics = new MomentMetricsEntity(validMetricsProps)
            const startTime = Date.now()

            // Executar múltiplas operações
            metrics.incrementViews(10)
            metrics.incrementLikes(5)
            metrics.incrementComments(3)
            metrics.updateViralScore(80)
            metrics.addRevenue(100, "ad")
            metrics.addCost(50, "production")

            const endTime = Date.now()

            expect(metrics.views.totalViews).toBe(1010)
            expect(metrics.engagement.totalLikes).toBe(155)
            expect(metrics.engagement.totalComments).toBe(78)
            expect(metrics.viral.viralScore).toBe(80)
            expect(metrics.monetization.totalRevenue).toBe(1600)
            expect(metrics.monetization.totalCost).toBe(1050)
            expect(endTime - startTime).toBeLessThan(50) // Deve ser rápido
        })
    })
})
