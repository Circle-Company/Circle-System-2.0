/**
 * Video Compression Worker Integration Tests
 * Testes de integração para o worker de compressão de vídeo com a fila de jobs
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Moment, MomentStatusEnum } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { VideoCompressionQueue } from "@/infra/queue/video.compression.queue"
import { Job } from "bull"
import { VideoCompressionJobData } from "../types/video.compression.job.types"
import { VideoCompressionWorker } from "../video.compression.worker"

// Mock das dependências
vi.mock("@/infra/queue/video.compression.queue")
vi.mock("@/core/content.processor/local.storage.adapter")
vi.mock("@/core/content.processor/video.processor")

describe("VideoCompressionWorker - Integration", () => {
    let worker: VideoCompressionWorker
    let mockMomentRepository: IMomentRepository
    let mockQueue: any
    let mockBullQueue: any

    const mockMoment: Moment = {
        id: "moment_integration",
        ownerId: "user_123",
        content: {
            description: "Integration test",
            hashtags: ["test"],
            mentions: [],
        },
        media: {
            url: "http://localhost:3000/uploads/videos/integration_test.mp4",
            storage: {
                provider: "local",
                bucket: "uploads",
                key: "videos/integration_test.mp4",
                region: "local",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        status: {
            current: MomentStatusEnum.UNDER_REVIEW,
            reason: "Processing",
            changedBy: "system",
            changedAt: new Date(),
        },
        visibility: {
            type: "public",
            restrictions: [],
        },
        metrics: {
            views: {
                totalViews: 0,
                totalClicks: 0,
                uniqueViews: 0,
                repeatViews: 0,
                completionViews: 0,
                averageWatchTime: 0,
                averageCompletionRate: 0,
                viewsByCountry: {},
                viewsByRegion: {},
                viewsByCity: {},
                viewsByDevice: {},
                peakViewTime: null,
                lastViewTime: null,
            },
            engagement: {
                totalLikes: 0,
                totalComments: 0,
                totalReports: 0,
                likeRate: 0,
                commentRate: 0,
                reportRate: 0,
                totalClicks: 0,
                clickRate: 0,
                averageCommentLength: 0,
                topCommenters: [],
                engagementScore: 0,
                lastEngagementTime: null,
            },
            performance: {
                loadTime: 0,
                bufferTime: 0,
                errorRate: 0,
                qualitySwitches: 0,
            },
            viral: {
                viralScore: 0,
                trendingScore: 0,
                reachScore: 0,
                influenceScore: 0,
                growthRate: 0,
                viralReach: 0,
            },
            content: {
                contentQualityScore: 0,
                audioQualityScore: 0,
                videoQualityScore: 0,
                faceDetectionRate: 0,
            },
            audience: {
                demographics: {
                    ageGroups: {},
                    genderDistribution: {},
                    locationDistribution: {},
                },
                behavior: {
                    bounceRate: 0,
                    averageSessionDuration: 0,
                    returnRate: 0,
                },
                preferences: {
                    contentTypes: {},
                    viewingTimes: {},
                    devicePreferences: {},
                },
            },
            monetization: {
                totalRevenue: 0,
                adRevenue: 0,
                subscriptionRevenue: 0,
                tipRevenue: 0,
                merchandiseRevenue: 0,
                revenuePerView: 0,
                revenuePerUser: 0,
                averageOrderValue: 0,
                adClickRate: 0,
                subscriptionConversionRate: 0,
                tipConversionRate: 0,
                merchandiseConversionRate: 0,
                productionCost: 0,
                distributionCost: 0,
                marketingCost: 0,
                totalCost: 0,
                returnOnInvestment: 0,
                profitMargin: 0,
                breakEvenPoint: new Date(),
            },
            lastMetricsUpdate: new Date(),
            metricsVersion: "1.0.0",
            dataQuality: 100,
            confidenceLevel: 100,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    } as Moment

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock do repositório
        mockMomentRepository = {
            findById: vi.fn().mockResolvedValue(mockMoment),
            update: vi.fn().mockResolvedValue(mockMoment),
        } as any

        // Mock da fila Bull
        mockBullQueue = {
            process: vi.fn(),
            close: vi.fn(),
        }

        // Mock da VideoCompressionQueue
        mockQueue = {
            getInstance: vi.fn().mockReturnValue({
                getQueue: vi.fn().mockReturnValue(mockBullQueue),
                close: vi.fn(),
            }),
        }

        // Mock do VideoCompressionQueue.getInstance
        ;(VideoCompressionQueue.getInstance as any).mockReturnValue({
            getQueue: vi.fn().mockReturnValue(mockBullQueue),
            close: vi.fn(),
        })

        worker = new VideoCompressionWorker(mockMomentRepository)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("Integração com Fila", () => {
        it("deve registrar processador na fila ao iniciar", () => {
            worker.start()

            expect(mockBullQueue.process).toHaveBeenCalledWith(expect.any(Function))
        })

        it("deve fechar fila ao parar", async () => {
            worker.start()
            await worker.stop()

            expect(mockQueue.close).toHaveBeenCalled()
        })

        it("deve processar job da fila corretamente", async () => {
            const jobData: VideoCompressionJobData = {
                momentId: "moment_integration",
                originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            }

            const mockJob: Job<VideoCompressionJobData> = {
                data: jobData,
                id: "job_123",
                progress: vi.fn(),
                updateProgress: vi.fn(),
                log: vi.fn(),
                moveToFailed: vi.fn(),
                moveToCompleted: vi.fn(),
                retry: vi.fn(),
                remove: vi.fn(),
                finished: Promise.resolve(),
                failed: Promise.resolve(),
                processedOn: Date.now(),
                timestamp: Date.now(),
                attemptsMade: 0,
                delay: 0,
                opts: {},
                returnvalue: undefined,
                stacktrace: [],
                toJSON: vi.fn(),
            } as any

            // Mock dos métodos do worker
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            // Simular processamento do job
            const processor = mockBullQueue.process.mock.calls[0][0]
            const result = await processor(mockJob)

            expect(result.success).toBe(true)
            expect(result.momentId).toBe("moment_integration")
        })

        it("deve lidar com falha no processamento do job", async () => {
            const jobData: VideoCompressionJobData = {
                momentId: "moment_integration",
                originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            }

            const mockJob: Job<VideoCompressionJobData> = {
                data: jobData,
                id: "job_123",
                progress: vi.fn(),
                updateProgress: vi.fn(),
                log: vi.fn(),
                moveToFailed: vi.fn(),
                moveToCompleted: vi.fn(),
                retry: vi.fn(),
                remove: vi.fn(),
                finished: Promise.resolve(),
                failed: Promise.resolve(),
                processedOn: Date.now(),
                timestamp: Date.now(),
                attemptsMade: 0,
                delay: 0,
                opts: {},
                returnvalue: undefined,
                stacktrace: [],
                toJSON: vi.fn(),
            } as any

            // Mock falha no download
            vi.spyOn(worker as any, "downloadVideo").mockRejectedValue(new Error("Download failed"))

            // Simular processamento do job
            const processor = mockBullQueue.process.mock.calls[0][0]
            const result = await processor(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Download failed")
        })
    })

    describe("Integração com Repositório", () => {
        it("deve buscar momento antes de processar", async () => {
            const jobData: VideoCompressionJobData = {
                momentId: "moment_integration",
                originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            }

            const mockJob: Job<VideoCompressionJobData> = {
                data: jobData,
            } as Job<VideoCompressionJobData>

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            await (worker as any).processJob(mockJob)

            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_integration")
        })

        it("deve atualizar momento após compressão", async () => {
            const jobData: VideoCompressionJobData = {
                momentId: "moment_integration",
                originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            }

            const mockJob: Job<VideoCompressionJobData> = {
                data: jobData,
            } as Job<VideoCompressionJobData>

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            await (worker as any).processJob(mockJob)

            expect(mockMomentRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "moment_integration",
                    status: expect.objectContaining({
                        current: MomentStatusEnum.PUBLISHED,
                        reason: "Video compressed successfully",
                        changedBy: "video.compression.worker",
                    }),
                }),
            )
        })

        it("deve falhar se momento não for encontrado", async () => {
            mockMomentRepository.findById = vi.fn().mockResolvedValue(null)

            const jobData: VideoCompressionJobData = {
                momentId: "nonexistent_moment",
                originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            }

            const mockJob: Job<VideoCompressionJobData> = {
                data: jobData,
            } as Job<VideoCompressionJobData>

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Moment nonexistent_moment not found")
        })
    })

    describe("Integração com Storage", () => {
        it("deve fazer upload do vídeo comprimido", async () => {
            const jobData: VideoCompressionJobData = {
                momentId: "moment_integration",
                originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            }

            const mockJob: Job<VideoCompressionJobData> = {
                data: jobData,
            } as Job<VideoCompressionJobData>

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const mockStorageAdapter = {
                uploadVideo: vi.fn().mockResolvedValue({
                    success: true,
                    url: "http://localhost:3000/uploads/videos/compressed.mp4",
                    provider: "local",
                }),
            }

            ;(worker as any).storageAdapter = mockStorageAdapter

            await (worker as any).processJob(mockJob)

            expect(mockStorageAdapter.uploadVideo).toHaveBeenCalledWith(
                "moment_integration.mp4",
                Buffer.from("compressed video data"),
                expect.objectContaining({
                    filename: "moment_integration_compressed.mp4",
                    mimeType: "video/mp4",
                    metadata: expect.objectContaining({
                        ownerId: "moment_integration",
                        contentId: "moment_integration",
                        duration: 30,
                        compressed: true,
                    }),
                }),
            )
        })

        it("deve deletar vídeo original após upload", async () => {
            const jobData: VideoCompressionJobData = {
                momentId: "moment_integration",
                originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            }

            const mockJob: Job<VideoCompressionJobData> = {
                data: jobData,
            } as Job<VideoCompressionJobData>

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            const deleteSpy = vi
                .spyOn(worker as any, "deleteOriginalVideo")
                .mockResolvedValue(undefined)

            await (worker as any).processJob(mockJob)

            expect(deleteSpy).toHaveBeenCalledWith("http://localhost:3000/uploads/videos/test.mp4")
        })
    })

    describe("Fluxo Completo de Integração", () => {
        it("deve executar fluxo completo com sucesso", async () => {
            const jobData: VideoCompressionJobData = {
                momentId: "moment_integration",
                originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            }

            const mockJob: Job<VideoCompressionJobData> = {
                data: jobData,
            } as Job<VideoCompressionJobData>

            // Mock de todos os componentes
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(
                Buffer.from("original video"),
            )
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const mockVideoProcessor = {
                compressVideoSlow: vi.fn().mockResolvedValue(Buffer.from("compressed video")),
            }

            const mockStorageAdapter = {
                uploadVideo: vi.fn().mockResolvedValue({
                    success: true,
                    url: "http://localhost:3000/uploads/videos/compressed.mp4",
                    provider: "local",
                }),
            }

            ;(worker as any).videoProcessor = mockVideoProcessor
            ;(worker as any).storageAdapter = mockStorageAdapter

            const result = await (worker as any).processJob(mockJob)

            // Verificar resultado
            expect(result.success).toBe(true)
            expect(result.momentId).toBe("moment_integration")
            expect(result.compressedVideoUrl).toBe(
                "http://localhost:3000/uploads/videos/compressed.mp4",
            )
            expect(result.processingTime).toBeGreaterThan(0)

            // Verificar que todas as etapas foram executadas
            expect((worker as any).downloadVideo).toHaveBeenCalledWith(jobData.originalVideoUrl)
            expect(mockVideoProcessor.compressVideoSlow).toHaveBeenCalledWith(
                Buffer.from("original video"),
            )
            expect(mockStorageAdapter.uploadVideo).toHaveBeenCalled()
            expect(mockMomentRepository.findById).toHaveBeenCalledWith(jobData.momentId)
            expect(mockMomentRepository.update).toHaveBeenCalled()
            expect((worker as any).deleteOriginalVideo).toHaveBeenCalledWith(
                jobData.originalVideoUrl,
            )
        })

        it("deve manter estado consistente mesmo com falhas parciais", async () => {
            const jobData: VideoCompressionJobData = {
                momentId: "moment_integration",
                originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            }

            const mockJob: Job<VideoCompressionJobData> = {
                data: jobData,
            } as Job<VideoCompressionJobData>

            // Mock falha na deleção do arquivo original
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(
                Buffer.from("original video"),
            )
            vi.spyOn(worker as any, "deleteOriginalVideo").mockRejectedValue(
                new Error("Delete failed"),
            )

            const result = await (worker as any).processJob(mockJob)

            // Deve ser bem-sucedido mesmo com falha na deleção
            expect(result.success).toBe(true)
            expect(result.momentId).toBe("moment_integration")

            // Verificar que momento foi atualizado
            expect(mockMomentRepository.update).toHaveBeenCalled()
        })
    })
})
