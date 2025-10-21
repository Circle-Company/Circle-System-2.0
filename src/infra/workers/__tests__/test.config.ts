/**
 * Video Compression Worker Test Configuration
 * Configurações e utilitários para testes do worker de compressão de vídeo
 */

import { beforeEach, vi } from "vitest"

import { Moment, MomentStatusEnum } from "@/domain/moment"
import { Job } from "bull"
import { VideoCompressionJobData } from "../types/video.compression.job.types"

/**
 * Cria um mock de Job para testes
 */
export function createMockJob(data: VideoCompressionJobData): Job<VideoCompressionJobData> {
    return {
        data,
        id: `job_${Math.random().toString(36).substr(2, 9)}`,
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
}

/**
 * Cria dados de job padrão para testes
 */
export function createDefaultJobData(
    overrides: Partial<VideoCompressionJobData> = {},
): VideoCompressionJobData {
    return {
        momentId: "test_moment_123",
        originalVideoUrl: "http://localhost:3000/uploads/videos/test.mp4",
        videoMetadata: {
            width: 1920,
            height: 1080,
            duration: 30,
            codec: "h264",
            hasAudio: true,
            size: 15728640, // 15MB
        },
        priority: 1,
        ...overrides,
    }
}

/**
 * Cria um mock de Moment para testes
 */
export function createMockMoment(overrides: Partial<Moment> = {}): Moment {
    return {
        id: "test_moment_123",
        ownerId: "user_123",
        content: {
            description: "Test video",
            hashtags: ["test"],
            mentions: [],
        },
        media: {
            url: "http://localhost:3000/uploads/videos/test.mp4",
            storage: {
                provider: "local",
                bucket: "uploads",
                key: "videos/test.mp4",
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
        ...overrides,
    } as Moment
}

/**
 * Configuração padrão para beforeEach dos testes
 */
export function setupTestEnvironment() {
    beforeEach(() => {
        // Limpar todos os mocks antes de cada teste
        vi.clearAllMocks()

        // Mock do console para evitar logs durante os testes
        vi.spyOn(console, "log").mockImplementation(() => {})
        vi.spyOn(console, "warn").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })
}

/**
 * Utilitários para simular diferentes cenários de vídeo
 */
export const VideoScenarios = {
    /**
     * Vídeo pequeno (1MB)
     */
    small: {
        size: 1024 * 1024, // 1MB
        duration: 10,
        width: 640,
        height: 480,
    },

    /**
     * Vídeo médio (15MB)
     */
    medium: {
        size: 15 * 1024 * 1024, // 15MB
        duration: 30,
        width: 1920,
        height: 1080,
    },

    /**
     * Vídeo grande (100MB)
     */
    large: {
        size: 100 * 1024 * 1024, // 100MB
        duration: 120,
        width: 3840,
        height: 2160,
    },

    /**
     * Vídeo muito grande (1GB)
     */
    veryLarge: {
        size: 1024 * 1024 * 1024, // 1GB
        duration: 600,
        width: 3840,
        height: 2160,
    },
}

/**
 * Utilitários para simular diferentes tipos de erro
 */
export const ErrorScenarios = {
    network: {
        timeout: new Error("timeout of 60000ms exceeded"),
        connection: new Error("ECONNREFUSED"),
        dns: new Error("ENOTFOUND"),
    },

    file: {
        notFound: new Error("ENOENT: no such file or directory"),
        permission: new Error("EACCES: permission denied"),
        corrupted: new Error("Invalid video data"),
    },

    compression: {
        memory: new Error("Out of memory"),
        format: new Error("Unsupported video format"),
        codec: new Error("Codec not available"),
    },

    storage: {
        space: new Error("Insufficient storage space"),
        permission: new Error("Permission denied"),
        network: new Error("Storage service unavailable"),
    },

    database: {
        connection: new Error("Database connection lost"),
        constraint: new Error("Constraint violation"),
        timeout: new Error("Query timeout"),
    },
}

/**
 * Utilitários para URLs de teste
 */
export const TestUrls = {
    local: "http://localhost:3000/uploads/videos/test.mp4",
    external: "https://example.com/videos/test.mp4",
    withParams: "https://example.com/videos/test.mp4?v=1&token=abc123",
    specialChars: "http://localhost:3000/uploads/videos/vídeo com espaços & símbolos.mp4",
    long: `http://localhost:3000/uploads/${"a".repeat(1000)}.mp4`,
    invalid: "invalid-url",
    empty: "",
}

/**
 * Configurações de teste para diferentes ambientes
 */
export const TestConfigs = {
    development: {
        baseUrl: "http://localhost:3000",
        storagePath: "./uploads",
        timeout: 60000,
    },

    test: {
        baseUrl: "http://test.local:3000",
        storagePath: "./test-uploads",
        timeout: 10000,
    },

    production: {
        baseUrl: "https://api.example.com",
        storagePath: "/var/uploads",
        timeout: 120000,
    },
}
