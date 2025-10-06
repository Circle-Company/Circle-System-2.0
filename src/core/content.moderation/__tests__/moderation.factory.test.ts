import { beforeEach, describe, expect, it, vi } from "vitest"

import { ModerationEngineFactory } from "../factory"
import { ModerationEngineConfig } from "../types"

describe("ModerationEngineFactory", () => {
    let mockHttpAdapter: any
    let mockModerationRepository: any
    let mockContentStorage: any

    beforeEach(() => {
        // Mock HttpAdapter
        mockHttpAdapter = {
            get: vi.fn().mockResolvedValue(Buffer.from("test data")),
            post: vi.fn().mockResolvedValue({ success: true }),
            put: vi.fn().mockResolvedValue({ success: true }),
            delete: vi.fn().mockResolvedValue({ success: true }),
        }

        // Mock ModerationRepository
        mockModerationRepository = {
            save: vi.fn().mockImplementation((moderation) => ({
                ...moderation,
                id: "mod-123",
                createdAt: new Date(),
                updatedAt: new Date(),
            })),
            findById: vi.fn().mockResolvedValue(null),
            findByContentId: vi.fn().mockResolvedValue(null),
            update: vi.fn().mockImplementation((id, updates) => ({
                id,
                ...updates,
                updatedAt: new Date(),
            })),
            delete: vi.fn().mockResolvedValue(undefined),
        }

        // Mock ContentStorage
        mockContentStorage = {
            store: vi.fn().mockResolvedValue("storage-url"),
            retrieve: vi.fn().mockResolvedValue(Buffer.from("stored data")),
            delete: vi.fn().mockResolvedValue(undefined),
        }
    })

    describe("create", () => {
        it("deve criar instância do ModerationEngine com sucesso", () => {
            const config = ModerationEngineFactory.createDefaultConfig()

            const engine = ModerationEngineFactory.create(
                mockHttpAdapter,
                mockModerationRepository,
                mockContentStorage,
                config,
            )

            expect(engine).toBeDefined()
            expect(typeof engine.moderateContent).toBe("function")
            expect(typeof engine.blockContent).toBe("function")
            expect(typeof engine.unblockContent).toBe("function")
            expect(typeof engine.approveContent).toBe("function")
            expect(typeof engine.flagContent).toBe("function")
            expect(typeof engine.getModeration).toBe("function")
            expect(typeof engine.getModerationByContentId).toBe("function")
        })

        it("deve criar engine com configuração personalizada", () => {
            const customConfig: ModerationEngineConfig = {
                detection: {
                    qualityDetection: {
                        enabled: false,
                        minVideoQuality: 80,
                        minAudioQuality: 70,
                    },
                    textAnalysis: {
                        enabled: true,
                        maxTextLength: 1000,
                        repetitiveTextThreshold: 0.5,
                        specialCharRatioThreshold: 0.2,
                        textOnlyDurationThreshold: 60000,
                    },
                    hashtagAnalysis: {
                        enabled: true,
                        maxHashtagCount: 5,
                        maxHashtagLength: 30,
                        spamKeywords: ["spam", "fake"],
                        relevanceThreshold: 0.8,
                    },
                },
                blocking: {
                    autoBlock: false,
                    autoHide: true,
                    autoFlag: false,
                    severityThresholds: {
                        low: 20,
                        medium: 50,
                        high: 80,
                    },
                },
                performance: {
                    maxProcessingTime: 45000,
                    timeout: 15000,
                    retryAttempts: 2,
                },
            }

            const engine = ModerationEngineFactory.create(
                mockHttpAdapter,
                mockModerationRepository,
                mockContentStorage,
                customConfig,
            )

            expect(engine).toBeDefined()
        })
    })

    describe("createDefaultConfig", () => {
        it("deve criar configuração padrão válida", () => {
            const config = ModerationEngineFactory.createDefaultConfig()

            expect(config).toBeDefined()
            expect(config.detection.qualityDetection.enabled).toBe(true)
            expect(config.detection.textAnalysis.enabled).toBe(true)
            expect(config.detection.hashtagAnalysis.enabled).toBe(true)
            expect(config.blocking.autoBlock).toBe(true)
            expect(config.blocking.autoHide).toBe(true)
            expect(config.blocking.autoFlag).toBe(true)
            expect(config.performance.maxProcessingTime).toBe(30000)
            expect(config.performance.timeout).toBe(10000)
            expect(config.performance.retryAttempts).toBe(3)
        })

        it("deve ter configurações de qualidade adequadas", () => {
            const config = ModerationEngineFactory.createDefaultConfig()

            expect(config.detection.qualityDetection.minVideoQuality).toBe(60)
            expect(config.detection.qualityDetection.minAudioQuality).toBe(50)
        })

        it("deve ter configurações de texto adequadas", () => {
            const config = ModerationEngineFactory.createDefaultConfig()

            expect(config.detection.textAnalysis.maxTextLength).toBe(500)
            expect(config.detection.textAnalysis.repetitiveTextThreshold).toBe(0.8)
            expect(config.detection.textAnalysis.specialCharRatioThreshold).toBe(0.3)
            expect(config.detection.textAnalysis.textOnlyDurationThreshold).toBe(30000)
        })

        it("deve ter configurações de hashtag adequadas", () => {
            const config = ModerationEngineFactory.createDefaultConfig()

            expect(config.detection.hashtagAnalysis.maxHashtagCount).toBe(10)
            expect(config.detection.hashtagAnalysis.maxHashtagLength).toBe(50)
            expect(config.detection.hashtagAnalysis.spamKeywords).toEqual(["spam", "fake"])
            expect(config.detection.hashtagAnalysis.relevanceThreshold).toBe(0.5)
        })

        it("deve ter thresholds de severidade adequados", () => {
            const config = ModerationEngineFactory.createDefaultConfig()

            expect(config.blocking.severityThresholds.low).toBe(30)
            expect(config.blocking.severityThresholds.medium).toBe(60)
            expect(config.blocking.severityThresholds.high).toBe(80)
        })
    })

    describe("createHumanContentConfig", () => {
        it("deve criar configuração para conteúdo humano", () => {
            const config = ModerationEngineFactory.createHumanContentConfig()

            expect(config).toBeDefined()
            expect(config.detection.qualityDetection.minVideoQuality).toBe(70)
            expect(config.detection.qualityDetection.minAudioQuality).toBe(60)
            expect(config.blocking.autoBlock).toBe(false)
            expect(config.blocking.autoHide).toBe(true)
            expect(config.blocking.autoFlag).toBe(true)
            expect(config.blocking.severityThresholds.low).toBe(40)
            expect(config.blocking.severityThresholds.medium).toBe(70)
            expect(config.blocking.severityThresholds.high).toBe(90)
        })

        it("deve ter configurações de performance adequadas para conteúdo humano", () => {
            const config = ModerationEngineFactory.createHumanContentConfig()

            expect(config.performance.maxProcessingTime).toBe(45000)
            expect(config.performance.timeout).toBe(15000)
            expect(config.performance.retryAttempts).toBe(2)
        })
    })

    describe("createStrictConfig", () => {
        it("deve criar configuração rigorosa", () => {
            const config = ModerationEngineFactory.createStrictConfig()

            expect(config).toBeDefined()
            expect(config.detection.qualityDetection.minVideoQuality).toBe(80)
            expect(config.detection.qualityDetection.minAudioQuality).toBe(70)
            expect(config.blocking.autoBlock).toBe(true)
            expect(config.blocking.autoHide).toBe(true)
            expect(config.blocking.autoFlag).toBe(true)
            expect(config.blocking.severityThresholds.low).toBe(50)
            expect(config.blocking.severityThresholds.medium).toBe(80)
            expect(config.blocking.severityThresholds.high).toBe(95)
        })

        it("deve ter configurações de performance rigorosas", () => {
            const config = ModerationEngineFactory.createStrictConfig()

            expect(config.performance.maxProcessingTime).toBe(60000)
            expect(config.performance.timeout).toBe(20000)
            expect(config.performance.retryAttempts).toBe(1)
        })
    })

    describe("createPermissiveConfig", () => {
        it("deve criar configuração permissiva", () => {
            const config = ModerationEngineFactory.createPermissiveConfig()

            expect(config).toBeDefined()
            expect(config.detection.qualityDetection.minVideoQuality).toBe(40)
            expect(config.detection.qualityDetection.minAudioQuality).toBe(30)
            expect(config.blocking.autoBlock).toBe(false)
            expect(config.blocking.autoHide).toBe(false)
            expect(config.blocking.autoFlag).toBe(true)
            expect(config.blocking.severityThresholds.low).toBe(20)
            expect(config.blocking.severityThresholds.medium).toBe(50)
            expect(config.blocking.severityThresholds.high).toBe(70)
        })

        it("deve ter configurações de performance permissivas", () => {
            const config = ModerationEngineFactory.createPermissiveConfig()

            expect(config.performance.maxProcessingTime).toBe(20000)
            expect(config.performance.timeout).toBe(5000)
            expect(config.performance.retryAttempts).toBe(5)
        })
    })

    describe("Configurações Comparativas", () => {
        it("deve ter diferentes níveis de qualidade entre configurações", () => {
            const defaultConfig = ModerationEngineFactory.createDefaultConfig()
            const humanConfig = ModerationEngineFactory.createHumanContentConfig()
            const strictConfig = ModerationEngineFactory.createStrictConfig()
            const permissiveConfig = ModerationEngineFactory.createPermissiveConfig()

            // Qualidade de vídeo
            expect(strictConfig.detection.qualityDetection.minVideoQuality).toBeGreaterThan(
                humanConfig.detection.qualityDetection.minVideoQuality,
            )
            expect(humanConfig.detection.qualityDetection.minVideoQuality).toBeGreaterThan(
                defaultConfig.detection.qualityDetection.minVideoQuality,
            )
            expect(defaultConfig.detection.qualityDetection.minVideoQuality).toBeGreaterThan(
                permissiveConfig.detection.qualityDetection.minVideoQuality,
            )

            // Qualidade de áudio
            expect(strictConfig.detection.qualityDetection.minAudioQuality).toBeGreaterThan(
                humanConfig.detection.qualityDetection.minAudioQuality,
            )
            expect(humanConfig.detection.qualityDetection.minAudioQuality).toBeGreaterThan(
                defaultConfig.detection.qualityDetection.minAudioQuality,
            )
            expect(defaultConfig.detection.qualityDetection.minAudioQuality).toBeGreaterThan(
                permissiveConfig.detection.qualityDetection.minAudioQuality,
            )
        })

        it("deve ter diferentes thresholds de severidade", () => {
            const defaultConfig = ModerationEngineFactory.createDefaultConfig()
            const humanConfig = ModerationEngineFactory.createHumanContentConfig()
            const strictConfig = ModerationEngineFactory.createStrictConfig()
            const permissiveConfig = ModerationEngineFactory.createPermissiveConfig()

            // Threshold alto
            expect(strictConfig.blocking.severityThresholds.high).toBeGreaterThan(
                humanConfig.blocking.severityThresholds.high,
            )
            expect(humanConfig.blocking.severityThresholds.high).toBeGreaterThan(
                defaultConfig.blocking.severityThresholds.high,
            )
            expect(defaultConfig.blocking.severityThresholds.high).toBeGreaterThan(
                permissiveConfig.blocking.severityThresholds.high,
            )

            // Threshold médio
            expect(strictConfig.blocking.severityThresholds.medium).toBeGreaterThan(
                humanConfig.blocking.severityThresholds.medium,
            )
            expect(humanConfig.blocking.severityThresholds.medium).toBeGreaterThan(
                defaultConfig.blocking.severityThresholds.medium,
            )
            expect(defaultConfig.blocking.severityThresholds.medium).toBeGreaterThan(
                permissiveConfig.blocking.severityThresholds.medium,
            )

            // Threshold baixo
            expect(strictConfig.blocking.severityThresholds.low).toBeGreaterThan(
                humanConfig.blocking.severityThresholds.low,
            )
            expect(humanConfig.blocking.severityThresholds.low).toBeGreaterThan(
                defaultConfig.blocking.severityThresholds.low,
            )
            expect(defaultConfig.blocking.severityThresholds.low).toBeGreaterThan(
                permissiveConfig.blocking.severityThresholds.low,
            )
        })

        it("deve ter diferentes configurações de auto-bloqueio", () => {
            const defaultConfig = ModerationEngineFactory.createDefaultConfig()
            const humanConfig = ModerationEngineFactory.createHumanContentConfig()
            const strictConfig = ModerationEngineFactory.createStrictConfig()
            const permissiveConfig = ModerationEngineFactory.createPermissiveConfig()

            // AutoBlock
            expect(strictConfig.blocking.autoBlock).toBe(true)
            expect(defaultConfig.blocking.autoBlock).toBe(true)
            expect(humanConfig.blocking.autoBlock).toBe(false)
            expect(permissiveConfig.blocking.autoBlock).toBe(false)

            // AutoHide
            expect(strictConfig.blocking.autoHide).toBe(true)
            expect(defaultConfig.blocking.autoHide).toBe(true)
            expect(humanConfig.blocking.autoHide).toBe(true)
            expect(permissiveConfig.blocking.autoHide).toBe(false)

            // AutoFlag
            expect(strictConfig.blocking.autoFlag).toBe(true)
            expect(defaultConfig.blocking.autoFlag).toBe(true)
            expect(humanConfig.blocking.autoFlag).toBe(true)
            expect(permissiveConfig.blocking.autoFlag).toBe(true)
        })
    })
})
