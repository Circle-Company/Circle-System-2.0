import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentMetricsService, MomentMetricsServiceConfig } from "../moment.metrics.service"

import { MomentMetricsEntity } from "../../../../domain/moment/entities/moment.metrics.entity"

describe("MomentMetricsService", () => {
    let metricsService: MomentMetricsService
    let mockRepository: any
    let mockAnalysisService: any

    const mockMetrics: MomentMetricsEntity = {
        id: "metrics_123",
        momentId: "moment_123",
        views: {
            totalViews: 100,
            uniqueViews: 80,
            repeatViews: 20,
            completionViews: 60,
            averageWatchTime: 15,
            averageCompletionRate: 0.75,
            bounceRate: 0.25,
            viewsByCountry: {},
            viewsByRegion: {},
            viewsByCity: {},
            viewsByDevice: {},
            viewsByOS: {},
            viewsByBrowser: {},
            viewsByHour: {},
            viewsByDayOfWeek: {},
            viewsByMonth: {},
            retentionCurve: [],
        },
        engagement: {
            totalLikes: 10,
            totalComments: 5,
            totalReports: 0,
            likeRate: 0.1,
            commentRate: 0.05,
            reportRate: 0,
            positiveComments: 3,
            negativeComments: 0,
            neutralComments: 2,
            averageCommentLength: 50,
            topCommenters: [],
            engagementByHour: {},
            engagementByDay: {},
            peakEngagementTime: new Date(),
        },
        performance: {
            loadTime: 2.5,
            bufferTime: 0.5,
            errorRate: 0.01,
            qualitySwitches: 1,
            bandwidthUsage: 1024,
            averageBitrate: 2000,
            peakBitrate: 4000,
            processingTime: 30,
            thumbnailGenerationTime: 5,
            embeddingGenerationTime: 10,
            storageSize: 2048,
            compressionRatio: 0.8,
            cdnHitRate: 0.95,
        },
        viral: {
            viralScore: 75,
            trendingScore: 80,
            reachScore: 70,
            influenceScore: 65,
            growthRate: 0.15,
            accelerationRate: 0.05,
            peakGrowthTime: new Date(),
            organicReach: 1000,
            paidReach: 0,
            viralReach: 500,
            totalReach: 1500,
            reachByPlatform: {},
            reachByUserType: {},
            cascadeDepth: 3,
        },
        audience: {
            ageDistribution: {},
            genderDistribution: {},
            locationDistribution: {},
            averageSessionDuration: 120,
            pagesPerSession: 1,
            returnVisitorRate: 0.3,
            newVisitorRate: 0.7,
            premiumUsers: 50,
            regularUsers: 950,
            newUsers: 700,
            powerUsers: 10,
            repeatViewerRate: 0.2,
            subscriberConversionRate: 0.05,
            churnRate: 0.02,
        },
        content: {
            contentQualityScore: 85,
            audioQualityScore: 80,
            videoQualityScore: 90,
            faceDetectionRate: 0.95,
            motionIntensity: 0.7,
            colorVariance: 0.6,
            brightnessLevel: 0.8,
            speechToNoiseRatio: 0.9,
            averageVolume: -12,
            silencePercentage: 0.1,
            hashtagEffectiveness: 0.8,
            mentionEffectiveness: 0.6,
            descriptionEngagement: 0.7,
        },
        monetization: {
            totalRevenue: 100,
            adRevenue: 50,
            subscriptionRevenue: 30,
            tipRevenue: 20,
            merchandiseRevenue: 0,
            revenuePerView: 0.1,
            revenuePerUser: 1.0,
            averageOrderValue: 25,
            adClickRate: 0.02,
            subscriptionConversionRate: 0.03,
            tipConversionRate: 0.02,
            merchandiseConversionRate: 0,
            productionCost: 50,
            distributionCost: 10,
            marketingCost: 20,
            totalCost: 80,
            returnOnInvestment: 0.25,
            profitMargin: 0.2,
            breakEvenPoint: new Date(),
        },
        lastMetricsUpdate: new Date(),
        metricsVersion: "1.0",
        dataQuality: 0.95,
        confidenceLevel: 0.9,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementViews: vi.fn(),
        incrementLikes: vi.fn(),
        incrementComments: vi.fn(),
        incrementReports: vi.fn(),
        incrementCompletionViews: vi.fn(),
        updateWatchTime: vi.fn(),
        updateCompletionRate: vi.fn(),
        updateContentQualityScore: vi.fn(),
        updateAudioQualityScore: vi.fn(),
        updateVideoQualityScore: vi.fn(),
        updateFaceDetectionRate: vi.fn(),
        addRevenue: vi.fn(),
        addCost: vi.fn(),
        calculateEngagementRate: vi.fn().mockReturnValue(0.15),
    } as any

    beforeEach(() => {
        mockRepository = {
            create: vi.fn(),
            update: vi.fn(),
            findByMomentId: vi.fn(),
        }

        mockAnalysisService = {
            analyzeMoment: vi.fn(),
        }

        // Mock do MomentMetricsEntity.create
        vi.spyOn(MomentMetricsEntity, "create").mockReturnValue(mockMetrics)

        metricsService = new MomentMetricsService(mockRepository)
    })

    describe("recordView", () => {
        it("deve registrar visualização com atualizações em tempo real", async () => {
            // Arrange
            const viewData = {
                watchTime: 30,
                completionRate: 0.8,
                device: "mobile",
                location: "BR",
                userId: "user_123",
            }

            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.recordView("moment_123", viewData)

            // Assert
            expect(mockRepository.findByMomentId).toHaveBeenCalledWith("moment_123")
            expect(mockMetrics.incrementViews).toHaveBeenCalled()
            expect(mockMetrics.updateWatchTime).toHaveBeenCalledWith(30)
            expect(mockMetrics.updateCompletionRate).toHaveBeenCalledWith(0.8)
            expect(mockRepository.update).toHaveBeenCalledWith(mockMetrics)
        })

        it("deve criar métricas se não existirem", async () => {
            // Arrange
            const viewData = {
                watchTime: 30,
                completionRate: 0.8,
                device: "mobile",
                location: "BR",
                userId: "user_123",
            }

            mockRepository.findByMomentId.mockResolvedValue(null)
            mockRepository.create.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.recordView("moment_123", viewData)

            // Assert
            expect(MomentMetricsEntity.create).toHaveBeenCalledWith("moment_123")
            expect(mockRepository.create).toHaveBeenCalledWith(mockMetrics)
        })
    })

    describe("recordLike", () => {
        it("deve registrar like", async () => {
            // Arrange
            const likeData = {
                userId: "user_123",
                timestamp: new Date(),
            }

            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.recordLike("moment_123", likeData)

            // Assert
            expect(mockMetrics.incrementLikes).toHaveBeenCalled()
            expect(mockRepository.update).toHaveBeenCalledWith(mockMetrics)
        })
    })

    describe("recordComment", () => {
        it("deve registrar comentário", async () => {
            // Arrange
            const commentData = {
                userId: "user_123",
                commentLength: 50,
                sentiment: "positive" as const,
                timestamp: new Date(),
            }

            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.recordComment("moment_123", commentData)

            // Assert
            expect(mockMetrics.incrementComments).toHaveBeenCalled()
            expect(mockRepository.update).toHaveBeenCalledWith(mockMetrics)
        })
    })

    describe("recordReport", () => {
        it("deve registrar denúncia", async () => {
            // Arrange
            const reportData = {
                userId: "user_123",
                reason: "inappropriate",
                timestamp: new Date(),
            }

            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.recordReport("moment_123", reportData)

            // Assert
            expect(mockMetrics.incrementReports).toHaveBeenCalled()
            expect(mockRepository.update).toHaveBeenCalledWith(mockMetrics)
        })
    })

    describe("recordCompletion", () => {
        it("deve registrar conclusão de visualização", async () => {
            // Arrange
            const completionData = {
                userId: "user_123",
                completionRate: 1.0,
                totalWatchTime: 30,
                timestamp: new Date(),
            }

            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.recordCompletion("moment_123", completionData)

            // Assert
            expect(mockMetrics.incrementCompletionViews).toHaveBeenCalled()
            expect(mockMetrics.updateWatchTime).toHaveBeenCalledWith(30)
            expect(mockMetrics.updateCompletionRate).toHaveBeenCalledWith(1.0)
            expect(mockRepository.update).toHaveBeenCalledWith(mockMetrics)
        })
    })

    describe("updateQuality", () => {
        it("deve atualizar qualidade do conteúdo", async () => {
            // Arrange
            const qualityData = {
                contentQuality: 90,
                audioQuality: 85,
                videoQuality: 95,
                faceDetectionRate: 0.98,
            }

            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.updateQuality("moment_123", qualityData)

            // Assert
            expect(mockMetrics.updateContentQualityScore).toHaveBeenCalledWith(90)
            expect(mockMetrics.updateAudioQualityScore).toHaveBeenCalledWith(85)
            expect(mockMetrics.updateVideoQualityScore).toHaveBeenCalledWith(95)
            expect(mockMetrics.updateFaceDetectionRate).toHaveBeenCalledWith(0.98)
            expect(mockRepository.update).toHaveBeenCalledWith(mockMetrics)
        })
    })

    describe("recordRevenue", () => {
        it("deve registrar receita quando monetização está habilitada", async () => {
            // Arrange
            const revenueData = {
                amount: 100,
                type: "ad" as const,
                source: "google",
                timestamp: new Date(),
            }

            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.recordRevenue("moment_123", revenueData)

            // Assert
            expect(mockMetrics.addRevenue).toHaveBeenCalledWith(100, "ad")
            expect(mockRepository.update).toHaveBeenCalledWith(mockMetrics)
        })

        it("não deve registrar receita quando monetização está desabilitada", async () => {
            // Arrange
            const serviceWithoutMonetization = new MomentMetricsService(mockRepository, {
                enableMonetizationTracking: false,
            })

            const revenueData = {
                amount: 100,
                type: "ad" as const,
                source: "google",
                timestamp: new Date(),
            }

            // Act
            await serviceWithoutMonetization.recordRevenue("moment_123", revenueData)

            // Assert
            expect(mockRepository.findByMomentId).not.toHaveBeenCalled()
        })
    })

    describe("recordCost", () => {
        it("deve registrar custo quando monetização está habilitada", async () => {
            // Arrange
            const costData = {
                amount: 50,
                type: "production" as const,
                description: "Video editing",
                timestamp: new Date(),
            }

            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.recordCost("moment_123", costData)

            // Assert
            expect(mockMetrics.addCost).toHaveBeenCalledWith(50, "production")
            expect(mockRepository.update).toHaveBeenCalledWith(mockMetrics)
        })
    })

    describe("getMetrics", () => {
        it("deve retornar métricas do momento", async () => {
            // Arrange
            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)

            // Act
            const result = await metricsService.getMetrics("moment_123")

            // Assert
            expect(result).toEqual(mockMetrics)
            expect(mockRepository.findByMomentId).toHaveBeenCalledWith("moment_123")
        })

        it("deve retornar null para momento sem métricas", async () => {
            // Arrange
            mockRepository.findByMomentId.mockResolvedValue(null)

            // Act
            const result = await metricsService.getMetrics("moment_123")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("getMetricsWithAnalysis", () => {
        it("deve retornar métricas com análise", async () => {
            // Arrange
            const mockAnalysis = {
                engagementAnalysis: { averageEngagement: 0.15 },
                performanceAnalysis: { averagePerformance: 100 },
                qualityAnalysis: { averageQuality: 85 },
                viralAnalysis: { averageViralScore: 75 },
                recommendations: { contentOptimization: [] },
            }
            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockAnalysisService.analyzeMoment.mockResolvedValue(mockAnalysis)

            // Act
            const result = await metricsService.getMetricsWithAnalysis("moment_123")

            // Assert
            expect(result).toBeDefined()
            expect(result?.metrics).toEqual(mockMetrics)
            expect(result?.analysis).toBeDefined()
            expect(result?.analysis.engagementAnalysis).toBeDefined()
            expect(result?.analysis.performanceAnalysis).toBeDefined()
            expect(result?.analysis.qualityAnalysis).toBeDefined()
            expect(result?.analysis.viralAnalysis).toBeDefined()
            expect(result?.analysis.recommendations).toBeDefined()
        })

        it("deve retornar null para momento sem métricas", async () => {
            // Arrange
            mockRepository.findByMomentId.mockResolvedValue(null)

            // Act
            const result = await metricsService.getMetricsWithAnalysis("moment_123")

            // Assert
            expect(result).toBeNull()
        })
    })

    describe("getBatchMetrics", () => {
        it("deve retornar métricas em lote", async () => {
            // Arrange
            const metrics1 = { ...mockMetrics, id: "metrics_1", momentId: "moment_1" }
            const metrics2 = { ...mockMetrics, id: "metrics_2", momentId: "moment_2" }

            mockRepository.findByMomentId
                .mockResolvedValueOnce(metrics1)
                .mockResolvedValueOnce(metrics2)
                .mockResolvedValueOnce(null)

            // Act
            const result = await metricsService.getBatchMetrics([
                "moment_1",
                "moment_2",
                "moment_3",
            ])

            // Assert
            expect(result).toEqual([metrics1, metrics2])
            expect(mockRepository.findByMomentId).toHaveBeenCalledTimes(3)
        })
    })

    describe("getAggregatedMetrics", () => {
        it("deve retornar métricas agregadas", async () => {
            // Arrange
            const metrics1 = {
                ...mockMetrics,
                views: { ...mockMetrics.views, totalViews: 100 },
                engagement: { ...mockMetrics.engagement, totalLikes: 10, totalComments: 5 },
                viral: { ...mockMetrics.viral, viralScore: 70, trendingScore: 75 },
                monetization: { ...mockMetrics.monetization, totalRevenue: 50 },
            }
            const metrics2 = {
                ...mockMetrics,
                views: { ...mockMetrics.views, totalViews: 200 },
                engagement: { ...mockMetrics.engagement, totalLikes: 20, totalComments: 10 },
                viral: { ...mockMetrics.viral, viralScore: 80, trendingScore: 85 },
                monetization: { ...mockMetrics.monetization, totalRevenue: 100 },
            }

            mockRepository.findByMomentId
                .mockResolvedValueOnce(metrics1)
                .mockResolvedValueOnce(metrics2)

            // Act
            const result = await metricsService.getAggregatedMetrics(["moment_1", "moment_2"])

            // Assert
            expect(result).toEqual({
                totalViews: 300,
                totalLikes: 30,
                totalComments: 15,
                totalRevenue: 150,
                averageEngagement: 0.15,
                averageViralScore: 75,
                averageTrendingScore: 80,
            })
        })

        it("deve retornar zeros para lista vazia", async () => {
            // Act
            const result = await metricsService.getAggregatedMetrics([])

            // Assert
            expect(result).toEqual({
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                totalRevenue: 0,
                averageEngagement: 0,
                averageViralScore: 0,
                averageTrendingScore: 0,
            })
        })
    })

    describe("processEventQueue", () => {
        it("deve processar fila de eventos", async () => {
            // Arrange
            const event1 = {
                type: "view" as const,
                momentId: "moment_1",
                data: { watchTime: 30 },
                timestamp: new Date(),
            }
            const event2 = {
                type: "like" as const,
                momentId: "moment_2",
                data: { userId: "user_123" },
                timestamp: new Date(),
            }

            // Adicionar eventos à fila
            await metricsService.recordView("moment_1", { watchTime: 30 })
            await metricsService.recordLike("moment_2", { userId: "user_123" })

            mockRepository.findByMomentId.mockResolvedValue(mockMetrics)
            mockRepository.update.mockResolvedValue(mockMetrics)

            // Act
            await metricsService.processEventQueue()

            // Assert
            expect(mockRepository.findByMomentId).toHaveBeenCalled()
            expect(mockRepository.update).toHaveBeenCalled()
        })

        it("não deve processar fila vazia", async () => {
            // Act
            await metricsService.processEventQueue()

            // Assert
            expect(mockRepository.findByMomentId).not.toHaveBeenCalled()
        })
    })

    describe("stop", () => {
        it("deve parar o processamento", () => {
            // Act
            metricsService.stop()

            // Assert - não deve lançar erro
            expect(true).toBe(true)
        })
    })

    describe("configuração", () => {
        it("deve usar configuração padrão", () => {
            // Arrange & Act
            const service = new MomentMetricsService(mockRepository)

            // Assert
            expect(service).toBeDefined()
        })

        it("deve usar configuração customizada", () => {
            // Arrange
            const customConfig: Partial<MomentMetricsServiceConfig> = {
                batchSize: 50,
                processingInterval: 10000,
                enableRealTimeUpdates: false,
            }

            // Act
            const service = new MomentMetricsService(mockRepository, customConfig)

            // Assert
            expect(service).toBeDefined()
        })
    })
})
