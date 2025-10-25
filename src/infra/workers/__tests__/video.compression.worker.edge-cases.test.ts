/**
 * Video Compression Worker Edge Cases Tests
 * Testes para cenários de erro e casos extremos do worker de compressão de vídeo
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { Moment, MomentStatusEnum } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import axios from "axios"
import { Job } from "bull"
import fs from "fs"
import { VideoCompressionJobData } from "../types/video.compression.job.types"
import { VideoCompressionWorker } from "../video.compression.worker"

const mockAxios = axios as any
const mockFs = fs as any

describe("VideoCompressionWorker - Edge Cases", () => {
    let worker: VideoCompressionWorker
    let mockMomentRepository: IMomentRepository
    let mockJob: Job<VideoCompressionJobData>

    const mockMoment: Moment = {
        id: "moment_edge_case",
        ownerId: "user_123",
        content: {
            description: "Edge case test",
            hashtags: ["test"],
            mentions: [],
        },
        media: {
            url: "http://localhost:3000/uploads/videos/edge_case.mp4",
            storage: {
                provider: "local",
                bucket: "uploads",
                key: "videos/edge_case.mp4",
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

        mockMomentRepository = {
            findById: vi.fn().mockResolvedValue(mockMoment),
            update: vi.fn().mockResolvedValue(mockMoment),
        } as any

        mockJob = {
            data: {
                momentId: "moment_edge_case",
                originalVideoUrl: "http://localhost:3000/uploads/videos/edge_case.mp4",
                videoMetadata: {
                    width: 1920,
                    height: 1080,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 15728640,
                },
                priority: 1,
            },
        } as Job<VideoCompressionJobData>

        worker = new VideoCompressionWorker(mockMomentRepository)
    })

    describe("Cenários de Erro de Download", () => {
        it("deve lidar com timeout de download", async () => {
            mockAxios.get.mockRejectedValue({
                code: "ECONNABORTED",
                message: "timeout of 60000ms exceeded",
            })

            vi.spyOn(worker as any, "downloadVideo").mockRejectedValue(
                new Error("Failed to download video: timeout of 60000ms exceeded"),
            )

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Failed to download video")
        })

        it("deve lidar com erro de rede", async () => {
            mockAxios.get.mockRejectedValue({
                code: "ENOTFOUND",
                message: "getaddrinfo ENOTFOUND example.com",
            })

            vi.spyOn(worker as any, "downloadVideo").mockRejectedValue(
                new Error("Failed to download video: getaddrinfo ENOTFOUND example.com"),
            )

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Failed to download video")
        })

        it("deve lidar com arquivo corrompido", async () => {
            mockFs.existsSync.mockReturnValue(true)
            mockFs.readFileSync.mockImplementation(() => {
                throw new Error("ENOENT: no such file or directory")
            })

            vi.spyOn(worker as any, "downloadVideo").mockRejectedValue(
                new Error("Failed to download video: ENOENT: no such file or directory"),
            )

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Failed to download video")
        })
    })

    describe("Cenários de Erro de Compressão", () => {
        it("deve lidar com vídeo muito grande", async () => {
            const largeBuffer = Buffer.alloc(100 * 1024 * 1024) // 100MB

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(largeBuffer)
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            // Mock do VideoProcessor para simular erro de memória
            const mockVideoProcessor = {
                compressVideoSlow: vi
                    .fn()
                    .mockRejectedValue(new Error("Out of memory: Cannot allocate buffer")),
            }

            // Substituir o processador no worker
            ;(worker as any).videoProcessor = mockVideoProcessor

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Out of memory")
        })

        it("deve lidar com formato de vídeo não suportado", async () => {
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("invalid video"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const mockVideoProcessor = {
                compressVideoSlow: vi.fn().mockRejectedValue(new Error("Unsupported video format")),
            }

            ;(worker as any).videoProcessor = mockVideoProcessor

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Unsupported video format")
        })

        it("deve lidar com vídeo corrompido", async () => {
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(
                Buffer.from("corrupted data"),
            )
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const mockVideoProcessor = {
                compressVideoSlow: vi
                    .fn()
                    .mockRejectedValue(new Error("Invalid video data: corrupted file")),
            }

            ;(worker as any).videoProcessor = mockVideoProcessor

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Invalid video data")
        })
    })

    describe("Cenários de Erro de Upload", () => {
        it("deve lidar com falha de upload por espaço insuficiente", async () => {
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const mockLocalStorageAdapter = {
                uploadVideo: vi.fn().mockResolvedValue({
                    success: false,
                    error: "Insufficient storage space",
                }),
            }

            ;(worker as any).storageAdapter = mockLocalStorageAdapter

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Insufficient storage space")
        })

        it("deve lidar com falha de upload por permissões", async () => {
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const mockLocalStorageAdapter = {
                uploadVideo: vi.fn().mockResolvedValue({
                    success: false,
                    error: "Permission denied",
                }),
            }

            ;(worker as any).storageAdapter = mockLocalStorageAdapter

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Permission denied")
        })
    })

    describe("Cenários de Erro de Banco de Dados", () => {
        it("deve lidar com falha ao buscar momento", async () => {
            mockMomentRepository.findById = vi
                .fn()
                .mockRejectedValue(new Error("Database connection lost"))

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Database connection lost")
        })

        it("deve lidar com falha ao atualizar momento", async () => {
            mockMomentRepository.update = vi
                .fn()
                .mockRejectedValue(new Error("Update failed: constraint violation"))

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Update failed")
        })
    })

    describe("Cenários de URLs Especiais", () => {
        it("deve lidar com URL com caracteres especiais", async () => {
            const specialUrl =
                "http://localhost:3000/uploads/videos/vídeo com espaços & símbolos.mp4"

            mockJob.data.originalVideoUrl = specialUrl

            mockFs.existsSync.mockReturnValue(true)
            mockFs.readFileSync.mockReturnValue(Buffer.from("video data"))

            const result = await (worker as any).downloadVideo(specialUrl)

            expect(result).toEqual(Buffer.from("video data"))
        })

        it("deve lidar com URL muito longa", async () => {
            const longUrl = "http://localhost:3000/uploads/" + "a".repeat(1000) + ".mp4"

            mockJob.data.originalVideoUrl = longUrl

            mockAxios.get.mockResolvedValue({
                data: Buffer.from("video data"),
            })

            const result = await (worker as any).downloadVideo(longUrl)

            expect(result).toEqual(Buffer.from("video data"))
        })

        it("deve lidar com URL com query parameters", async () => {
            const urlWithParams = "https://example.com/video.mp4?v=1&token=abc123"

            mockJob.data.originalVideoUrl = urlWithParams

            mockAxios.get.mockResolvedValue({
                data: Buffer.from("video data"),
            })

            const result = await (worker as any).downloadVideo(urlWithParams)

            expect(result).toEqual(Buffer.from("video data"))
        })
    })

    describe("Cenários de Performance", () => {
        it("deve medir tempo de processamento corretamente", async () => {
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const startTime = Date.now()
            const result = await (worker as any).processJob(mockJob)
            const endTime = Date.now()

            expect(result.processingTime).toBeGreaterThan(0)
            expect(result.processingTime).toBeLessThanOrEqual(endTime - startTime + 100) // Margem de erro
        })

        it("deve calcular taxa de compressão para vídeo pequeno", async () => {
            const smallBuffer = Buffer.alloc(1024) // 1KB
            const compressedBuffer = Buffer.alloc(512) // 512B

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(smallBuffer)
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const mockVideoProcessor = {
                compressVideoSlow: vi.fn().mockResolvedValue(compressedBuffer),
            }

            ;(worker as any).videoProcessor = mockVideoProcessor

            const result = await (worker as any).processJob(mockJob)

            expect(result.originalSize).toBe(1024)
            expect(result.compressedSize).toBe(512)
            expect(result.compressionRatio).toBe(50) // 50% de redução
        })

        it("deve calcular taxa de compressão para vídeo que cresceu", async () => {
            const originalBuffer = Buffer.alloc(1024) // 1KB
            const compressedBuffer = Buffer.alloc(2048) // 2KB (cresceu!)

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(originalBuffer)
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const mockVideoProcessor = {
                compressVideoSlow: vi.fn().mockResolvedValue(compressedBuffer),
            }

            ;(worker as any).videoProcessor = mockVideoProcessor

            const result = await (worker as any).processJob(mockJob)

            expect(result.originalSize).toBe(1024)
            expect(result.compressedSize).toBe(2048)
            expect(result.compressionRatio).toBe(-100) // -100% (aumentou)
        })
    })

    describe("Cenários de Recuperação de Erro", () => {
        it("deve continuar processamento mesmo se deleção de arquivo original falhar", async () => {
            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockRejectedValue(
                new Error("Delete failed"),
            )

            const result = await (worker as any).processJob(mockJob)

            // Deve ser bem-sucedido mesmo com falha na deleção
            expect(result.success).toBe(true)
            expect(result.momentId).toBe("moment_edge_case")
        })

        it("deve limpar recursos mesmo em caso de erro", async () => {
            mockMomentRepository.findById = vi.fn().mockRejectedValue(new Error("Database error"))

            vi.spyOn(worker as any, "downloadVideo").mockResolvedValue(Buffer.from("video data"))
            vi.spyOn(worker as any, "deleteOriginalVideo").mockResolvedValue(undefined)

            const result = await (worker as any).processJob(mockJob)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Database error")
            // Verificar que recursos foram limpos
            expect((worker as any).deleteOriginalVideo).toHaveBeenCalled()
        })
    })
})
