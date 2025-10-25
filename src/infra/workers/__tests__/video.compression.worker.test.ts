/**
 * Video Compression Worker Tests
 * Testes para o worker de compressão de vídeo
 */

import { Moment, MomentStatusEnum } from "@/domain/moment"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LocalStorageAdapter } from "@/core/content.processor/local.storage.adapter"
import { VideoProcessor } from "@/core/content.processor/video.processor"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { VideoCompressionQueue } from "@/infra/queue/video.compression.queue"
import axios from "axios"
import { Job } from "bull"
import fs from "fs"
import path from "path"
import { VideoCompressionJobData } from "../types/video.compression.job.types"
import { VideoCompressionWorker } from "../video.compression.worker"

// Mock das dependências
vi.mock("axios")
vi.mock("fs")
vi.mock("path")
vi.mock("@/infra/queue/video.compression.queue")
vi.mock("@/core/content.processor/local.storage.adapter")
vi.mock("@/core/content.processor/video.processor")
vi.mock("@/shared")

const mockAxios = axios as any
const mockFs = fs as any
const mockPath = path as any

describe("VideoCompressionWorker", () => {
    let worker: VideoCompressionWorker
    let mockMomentRepository: IMomentRepository
    let mockVideoCompressionQueue: any
    let mockLocalStorageAdapter: any
    let mockVideoProcessor: any
    let mockJob: Job<VideoCompressionJobData>

    const mockMoment: Moment = {
        id: "moment_123",
        ownerId: "user_123",
        content: {
            description: "Test video",
            hashtags: ["test"],
            mentions: [],
        },
        media: {
            url: "http://localhost:3000/uploads/videos/original_video.mp4",
            storage: {
                provider: "local",
                bucket: "uploads",
                key: "videos/original_video.mp4",
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

    const mockJobData: VideoCompressionJobData = {
        momentId: "moment_123",
        originalVideoUrl: "http://localhost:3000/uploads/videos/original_video.mp4",
        videoMetadata: {
            width: 1920,
            height: 1080,
            duration: 30,
            codec: "h264",
            hasAudio: true,
            size: 15728640, // 15MB
        },
        priority: 1,
    }

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks()

        // Mock do repositório
        mockMomentRepository = {
            findById: vi.fn().mockResolvedValue(mockMoment),
            update: vi.fn().mockResolvedValue(mockMoment),
        } as any

        // Mock da fila
        mockVideoCompressionQueue = {
            getInstance: vi.fn().mockReturnValue({
                getQueue: vi.fn().mockReturnValue({
                    process: vi.fn(),
                }),
                close: vi.fn(),
            }),
        }

        // Mock do VideoCompressionQueue.getInstance
        vi.mocked(VideoCompressionQueue.getInstance).mockReturnValue({
            getQueue: vi.fn().mockReturnValue({
                process: vi.fn(),
            }),
            close: vi.fn(),
        })

        // Mock do storage adapter
        mockLocalStorageAdapter = {
            uploadVideo: vi.fn().mockResolvedValue({
                success: true,
                url: "http://localhost:3000/uploads/videos/compressed_video.mp4",
                provider: "local",
            }),
            deleteVideo: vi.fn().mockResolvedValue(true),
        }

        // Mock do LocalStorageAdapter
        vi.mocked(LocalStorageAdapter).mockImplementation(() => mockLocalStorageAdapter)

        // Mock do processador de vídeo
        mockVideoProcessor = {
            compressVideoSlow: vi.fn().mockResolvedValue(Buffer.from("compressed video data")),
        }

        // Mock do VideoProcessor
        vi.mocked(VideoProcessor).mockImplementation(() => mockVideoProcessor)

        // Mock do job
        mockJob = {
            data: mockJobData,
        } as Job<VideoCompressionJobData>

        // Mock do fs
        mockFs.existsSync = vi.fn().mockReturnValue(true)
        mockFs.readFileSync = vi.fn().mockReturnValue(Buffer.from("original video data"))

        // Mock do path
        mockPath.join = vi.fn().mockImplementation((...args) => args.join("/"))

        // Mock do axios
        mockAxios.get = vi.fn().mockResolvedValue({
            data: Buffer.from("video data"),
        })

        // Criar worker
        worker = new VideoCompressionWorker(mockMomentRepository)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("Construtor", () => {
        it("deve inicializar corretamente", () => {
            expect(worker).toBeDefined()
            expect(worker.isActive()).toBe(false)
        })
    })

    describe("start()", () => {
        it("deve iniciar o worker corretamente", () => {
            worker.start()

            expect(worker.isActive()).toBe(true)
        })

        it("não deve iniciar se já estiver rodando", () => {
            worker.start()
            const consoleSpy = vi.spyOn(console, "log")

            worker.start()

            expect(consoleSpy).toHaveBeenCalledWith(
                "[VideoCompressionWorker] ⚠️ Worker já está rodando",
            )
        })
    })

    describe("stop()", () => {
        it("deve parar o worker corretamente", async () => {
            worker.start()
            expect(worker.isActive()).toBe(true)

            await worker.stop()

            expect(worker.isActive()).toBe(false)
        })

        it("não deve fazer nada se worker não estiver rodando", async () => {
            const consoleSpy = vi.spyOn(console, "log")

            await worker.stop()

            expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("Parando worker"))
        })
    })

    describe("processJob()", () => {
        beforeEach(() => {
            // Mock dos métodos privados usando reflection
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)
        })

        it("deve processar job com sucesso", async () => {
            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(true)
            expect(result.momentId).toBe("moment_123")
            expect(result.compressedVideoUrl).toBe(
                "http://localhost:3000/uploads/videos/compressed_video.mp4",
            )
            expect(result.originalSize).toBeDefined()
            expect(result.compressedSize).toBeDefined()
            expect(result.compressionRatio).toBeDefined()
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
            expect(result.metadata).toEqual({
                originalCodec: "unknown",
                compressedCodec: "h264",
                preset: "slow",
                crf: 28,
            })
        })

        it("deve atualizar o momento após compressão", async () => {
            await (worker as any).processJob(mockJob)

            expect(mockMomentRepository.findById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    media: expect.objectContaining({
                        url: "http://localhost:3000/uploads/videos/compressed_video.mp4",
                    }),
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

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Moment moment_123 not found")
        })

        it("deve falhar se upload falhar", async () => {
            mockLocalStorageAdapter.uploadVideo = vi.fn().mockResolvedValue({
                success: false,
                error: "Upload failed",
            })

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Upload failed")
        })

        it("deve falhar se compressão falhar", async () => {
            mockVideoProcessor.compressVideoSlow = vi
                .fn()
                .mockRejectedValue(new Error("Compression failed"))

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Compression failed")
        })
    })

    describe("downloadVideo()", () => {
        it("deve baixar vídeo local corretamente", async () => {
            const url = "http://localhost:3000/uploads/videos/test.mp4"

            // Mock do método downloadVideo diretamente
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))

            const result = await (worker as any).downloadVideo(url)

            expect(result).toEqual(Buffer.from("video data"))
        })

        it("deve baixar vídeo externo via HTTP", async () => {
            const url = "https://example.com/video.mp4"
            const videoData = Buffer.from("video data")

            mockAxios.get.mockResolvedValue({
                data: videoData,
            })

            const result = await (worker as any).downloadVideo(url)

            expect(mockAxios.get).toHaveBeenCalledWith(url, {
                responseType: "arraybuffer",
                timeout: 60000,
            })
            expect(result).toEqual(videoData)
        })

        it("deve falhar se arquivo local não existir", async () => {
            const url = "http://localhost:3000/uploads/videos/nonexistent.mp4"

            mockFs.existsSync.mockReturnValue(false)

            await expect((worker as any).downloadVideo(url)).rejects.toThrow("Video file not found")
        })

        it("deve falhar se URL for inválida", async () => {
            const url = ""

            await expect((worker as any).downloadVideo(url)).rejects.toThrow(
                "Invalid or empty video URL",
            )
        })

        it("deve falhar se download HTTP falhar", async () => {
            const url = "https://example.com/video.mp4"

            mockAxios.get.mockRejectedValue(new Error("Network error"))

            await expect((worker as any).downloadVideo(url)).rejects.toThrow(
                "Failed to download video",
            )
        })
    })

    describe("deleteOriginalVideo()", () => {
        it("deve deletar vídeo original com sucesso", async () => {
            const url = "http://localhost:3000/uploads/videos/original.mp4"

            vi.spyOn(worker as any, "extractKeyFromUrl").mockReturnValue("videos/original.mp4")

            await (worker as any).deleteOriginalVideo(url)

            expect(mockLocalStorageAdapter.deleteVideo).toHaveBeenCalledWith("videos/original.mp4")
        })

        it("não deve falhar se key não puder ser extraída", async () => {
            const url = "invalid-url"

            vi.spyOn(worker as any, "extractKeyFromUrl").mockReturnValue(null)
            const consoleSpy = vi.spyOn(console, "warn")

            await (worker as any).deleteOriginalVideo(url)

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Não foi possível extrair key da URL"),
            )
            expect(mockLocalStorageAdapter.deleteVideo).not.toHaveBeenCalled()
        })

        it("não deve falhar se deleção falhar", async () => {
            const url = "http://localhost:3000/uploads/videos/original.mp4"

            vi.spyOn(worker as any, "extractKeyFromUrl").mockReturnValue("videos/original.mp4")
            mockLocalStorageAdapter.deleteVideo.mockRejectedValue(new Error("Delete failed"))
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

            await (worker as any).deleteOriginalVideo(url)

            expect(consoleSpy).toHaveBeenCalledWith(
                "[VideoCompressionWorker] ⚠️ Erro ao deletar vídeo original:",
                expect.any(Error),
            )
        })
    })

    describe("extractKeyFromUrl()", () => {
        it("deve extrair key de URL local", () => {
            const url = "http://localhost:3000/uploads/videos/test.mp4"

            const result = (worker as any).extractKeyFromUrl(url)

            expect(result).toBe("videos/test.mp4")
        })

        it("deve extrair key de URL externa", () => {
            const url = "https://example.com/bucket/videos/test.mp4"

            const result = (worker as any).extractKeyFromUrl(url)

            expect(result).toBe("bucket/videos/test.mp4")
        })

        it("deve retornar null para URL inválida", () => {
            const url = "invalid-url"

            const result = (worker as any).extractKeyFromUrl(url)

            expect(result).toBeNull()
        })

        it("deve retornar null para URL vazia", () => {
            const url = ""

            const result = (worker as any).extractKeyFromUrl(url)

            expect(result).toBeNull()
        })
    })

    describe("isActive()", () => {
        it("deve retornar false quando worker não está ativo", () => {
            expect(worker.isActive()).toBe(false)
        })

        it("deve retornar true quando worker está ativo", () => {
            worker.start()
            expect(worker.isActive()).toBe(true)
        })
    })

    describe("Integração", () => {
        it("deve processar job completo com todas as etapas", async () => {
            // Mock de todos os métodos necessários
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(
                Buffer.from("original video"),
            )
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const result = await (worker as any).processJob(mockJob)

            // Verificar que todas as etapas foram executadas
            expect((worker as any).downloadVideo).toHaveBeenCalledWith(mockJobData.originalVideoUrl)
            expect(mockVideoProcessor.compressVideoSlow).toHaveBeenCalledWith(
                Buffer.from("original video"),
            )
            expect(mockLocalStorageAdapter.uploadVideo).toHaveBeenCalled()
            expect(mockMomentRepository.findById).toHaveBeenCalledWith(mockJobData.momentId)
            expect(mockMomentRepository.update).toHaveBeenCalled()
            expect((worker as any).deleteOriginalVideo).toHaveBeenCalledWith(
                mockJobData.originalVideoUrl,
            )

            // Verificar resultado
            expect(result.success).toBe(true)
            expect(result.momentId).toBe(mockJobData.momentId)
            expect(result.compressedVideoUrl).toBeDefined()
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
        })

        it("deve calcular taxa de compressão corretamente", async () => {
            const originalSize = 1000000 // 1MB
            const compressedSize = 500000 // 500KB
            const expectedRatio = 50 // 50% de redução

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.alloc(originalSize))
            mockVideoProcessor.compressVideoSlow.mockResolvedValue(Buffer.alloc(compressedSize))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const result = await (worker as any).processJob(mockJob)

            expect(result.originalSize).toBe(originalSize)
            expect(result.compressedSize).toBe(compressedSize)
            expect(result.compressionRatio).toBe(expectedRatio)
        })
    })
})
