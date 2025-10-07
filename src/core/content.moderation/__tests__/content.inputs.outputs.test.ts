import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    ModerationFlagEnum,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "../../../domain/moderation/moderation.type"

import { ModerationEngineFactory } from "../factory"
import { ModerationEngine } from "../moderation"
import { ContentDetectionRequest } from "../types"

describe("Content Inputs and Outputs Tests", () => {
    let moderationEngine: ModerationEngine
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
                processingTime: Math.max(1, moderation.processingTime || 10),
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

        // Criar engine com configuração padrão
        const config = ModerationEngineFactory.createDefaultConfig()
        moderationEngine = ModerationEngineFactory.create(
            mockHttpAdapter,
            mockModerationRepository,
            mockContentStorage,
            config,
        )
    })

    describe("Content Input Tests", () => {
        describe("Image Content Inputs", () => {
            it("deve processar entrada de imagem JPEG válida", async () => {
                const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
                const imageData = Buffer.concat([
                    jpegHeader,
                    Buffer.alloc(50000, 128), // 50KB de dados
                ])

                const request: ContentDetectionRequest = {
                    contentId: "img-001",
                    contentOwnerId: "user-001",
                    contentData: imageData,
                    metadata: {
                        type: "image/jpeg",
                        size: imageData.length,
                        format: "jpeg",
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation).toBeDefined()
                expect(result.moderation.contentId).toBe("img-001")
                expect(result.moderation.contentOwnerId).toBe("user-001")
                expect(result.detectionResult).toBeDefined()
                expect(result.detectionResult?.contentType).toBeDefined()
                expect(result.detectionResult?.confidence).toBeGreaterThanOrEqual(0)
                expect(result.detectionResult?.flags).toBeDefined()
            })

            it("deve processar entrada de imagem PNG válida", async () => {
                const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
                const imageData = Buffer.concat([
                    pngHeader,
                    Buffer.alloc(30000, 128), // 30KB de dados
                ])

                const request: ContentDetectionRequest = {
                    contentId: "img-002",
                    contentOwnerId: "user-002",
                    contentData: imageData,
                    metadata: {
                        type: "image/png",
                        size: imageData.length,
                        format: "png",
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation.contentId).toBe("img-002")
                expect(result.detectionResult?.contentType).toBeDefined()
            })

            it("deve processar entrada de imagem com metadados completos", async () => {
                const imageData = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.alloc(10000, 128)])

                const request: ContentDetectionRequest = {
                    contentId: "img-003",
                    contentOwnerId: "user-003",
                    contentData: imageData,
                    metadata: {
                        type: "image/jpeg",
                        size: imageData.length,
                        format: "jpeg",
                        width: 1920,
                        height: 1080,
                        colorSpace: "RGB",
                        compression: "lossy",
                        quality: 85,
                        description: "Imagem de teste com boa qualidade",
                        hashtags: ["#test", "#image", "#quality"],
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.detectionResult?.flags).toBeDefined()
            })

            it("deve detectar imagem de baixa qualidade", async () => {
                const smallImage = Buffer.from([0xff, 0xd8, 0xff]) // Muito pequena

                const request: ContentDetectionRequest = {
                    contentId: "img-004",
                    contentOwnerId: "user-004",
                    contentData: smallImage,
                    metadata: {
                        type: "image/jpeg",
                        size: smallImage.length,
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.detectionResult?.flags.length).toBeGreaterThan(0)
                expect(
                    result.detectionResult?.flags.some(
                        (flag) => flag.type === ModerationFlagEnum.LOW_QUALITY_CONTENT,
                    ),
                ).toBe(true)
            })
        })

        describe("Audio Content Inputs", () => {
            it("deve processar entrada de áudio MP3 válida", async () => {
                const mp3Header = Buffer.from([0xff, 0xfb, 0x90, 0x00])
                const audioData = Buffer.concat([
                    mp3Header,
                    Buffer.alloc(100000, 0x80), // 100KB de dados de áudio
                ])

                const request: ContentDetectionRequest = {
                    contentId: "audio-001",
                    contentOwnerId: "user-001",
                    contentData: audioData,
                    metadata: {
                        type: "audio/mpeg",
                        size: audioData.length,
                        format: "mp3",
                        duration: 30, // 30 segundos
                        bitrate: 128,
                        sampleRate: 44100,
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation.contentId).toBe("audio-001")
                expect(result.detectionResult?.contentType).toBeDefined()
            })

            it("deve processar entrada de áudio WAV válida", async () => {
                const wavHeader = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00])
                const audioData = Buffer.concat([
                    wavHeader,
                    Buffer.alloc(50000, 0x80), // 50KB de dados
                ])

                const request: ContentDetectionRequest = {
                    contentId: "audio-002",
                    contentOwnerId: "user-002",
                    contentData: audioData,
                    metadata: {
                        type: "audio/wav",
                        size: audioData.length,
                        format: "wav",
                        duration: 15,
                        bitrate: 1411,
                        sampleRate: 44100,
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation.contentId).toBe("audio-002")
            })

            it("deve detectar áudio muito curto", async () => {
                const shortAudio = Buffer.from([0xff, 0xfb]) // Muito pequeno

                const request: ContentDetectionRequest = {
                    contentId: "audio-003",
                    contentOwnerId: "user-003",
                    contentData: shortAudio,
                    metadata: {
                        type: "audio/mpeg",
                        size: shortAudio.length,
                        duration: 0.5, // 0.5 segundos
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.detectionResult?.flags.length).toBeGreaterThan(0)
            })
        })

        describe("Video Content Inputs", () => {
            it("deve processar entrada de vídeo MP4 válida", async () => {
                const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70])
                const videoData = Buffer.concat([
                    mp4Header,
                    Buffer.alloc(200000, 0x80), // 200KB de dados
                ])

                const request: ContentDetectionRequest = {
                    contentId: "video-001",
                    contentOwnerId: "user-001",
                    contentData: videoData,
                    metadata: {
                        type: "video/mp4",
                        size: videoData.length,
                        format: "mp4",
                        duration: 60, // 1 minuto
                        width: 1920,
                        height: 1080,
                        fps: 30,
                        bitrate: 5000,
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation.contentId).toBe("video-001")
                expect(result.detectionResult?.contentType).toBeDefined()
            })

            it("deve processar entrada de vídeo com metadados completos", async () => {
                const videoData = Buffer.from([
                    0x00,
                    0x00,
                    0x00,
                    0x20,
                    ...Buffer.alloc(150000, 0x80),
                ])

                const request: ContentDetectionRequest = {
                    contentId: "video-002",
                    contentOwnerId: "user-002",
                    contentData: videoData,
                    metadata: {
                        type: "video/mp4",
                        size: videoData.length,
                        format: "mp4",
                        duration: 120,
                        width: 1280,
                        height: 720,
                        fps: 24,
                        bitrate: 3000,
                        description: "Vídeo de demonstração do produto",
                        hashtags: ["#demo", "#product", "#video"],
                        hasAudio: true,
                        audioCodec: "aac",
                        videoCodec: "h264",
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.detectionResult?.flags).toBeDefined()
            })
        })

        describe("Text Content Inputs", () => {
            it("deve processar entrada de texto simples", async () => {
                const request: ContentDetectionRequest = {
                    contentId: "text-001",
                    contentOwnerId: "user-001",
                    metadata: {
                        description: "Este é um texto simples e legítimo sem problemas.",
                        type: "text",
                        language: "pt",
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation.contentId).toBe("text-001")
                expect(result.detectionResult?.contentType).toBeDefined()
            })

            it("deve processar entrada de texto com hashtags", async () => {
                const request: ContentDetectionRequest = {
                    contentId: "text-002",
                    contentOwnerId: "user-002",
                    metadata: {
                        description:
                            "Vídeo sobre programação e desenvolvimento #programming #coding #javascript",
                        hashtags: ["#programming", "#coding", "#javascript", "#webdev"],
                        type: "text",
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation.contentId).toBe("text-002")
                expect(result.detectionResult?.flags).toBeDefined()
            })

            it("deve detectar texto spam", async () => {
                const request: ContentDetectionRequest = {
                    contentId: "text-003",
                    contentOwnerId: "user-003",
                    metadata: {
                        description: "FREE MONEY!!! CLICK NOW!!! LIMITED TIME OFFER!!! BUY NOW!!!",
                        type: "text",
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.detectionResult?.flags.length).toBeGreaterThan(0)
                expect(
                    result.detectionResult?.flags.some(
                        (flag) => flag.type === ModerationFlagEnum.SPAM_CONTENT,
                    ),
                ).toBe(true)
            })

            it("deve detectar texto muito longo", async () => {
                const longText = "palavra ".repeat(600) // 600 palavras

                const request: ContentDetectionRequest = {
                    contentId: "text-004",
                    contentOwnerId: "user-004",
                    metadata: {
                        description: longText,
                        type: "text",
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.detectionResult?.flags.length).toBeGreaterThan(0)
                expect(
                    result.detectionResult?.flags.some(
                        (flag) => flag.type === ModerationFlagEnum.EXCESSIVE_TEXT,
                    ),
                ).toBe(true)
            })
        })

        describe("Mixed Content Inputs", () => {
            it("deve processar entrada com mídia e texto", async () => {
                const imageData = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.alloc(50000, 128)])

                const request: ContentDetectionRequest = {
                    contentId: "mixed-001",
                    contentOwnerId: "user-001",
                    contentData: imageData,
                    metadata: {
                        type: "image/jpeg",
                        size: imageData.length,
                        description: "Imagem compartilhada com descrição normal",
                        hashtags: ["#photo", "#nature"],
                        location: { lat: -23.5505, lng: -46.6333 },
                        timestamp: new Date().toISOString(),
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation.contentId).toBe("mixed-001")
                expect(result.detectionResult?.contentType).toBeDefined()
                expect(result.detectionResult?.flags).toBeDefined()
            })

            it("deve processar entrada com URL de conteúdo", async () => {
                const request: ContentDetectionRequest = {
                    contentId: "url-001",
                    contentOwnerId: "user-001",
                    contentUrl: "https://example.com/video.mp4",
                    metadata: {
                        type: "video/mp4",
                        description: "Vídeo compartilhado via URL",
                        hashtags: ["#video", "#share"],
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation.contentId).toBe("url-001")
            })
        })
    })

    describe("Content Output Tests", () => {
        describe("Moderation Outputs", () => {
            it("deve retornar resultado de moderação completo", async () => {
                const imageData = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.alloc(50000, 128)])

                const request: ContentDetectionRequest = {
                    contentId: "output-001",
                    contentOwnerId: "user-001",
                    contentData: imageData,
                    metadata: {
                        type: "image/jpeg",
                        description: "Texto normal",
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.moderation).toBeDefined()
                expect(result.moderation.id).toBeDefined()
                expect(result.moderation.contentId).toBe("output-001")
                expect(result.moderation.contentOwnerId).toBe("user-001")
                expect(result.moderation.detectedContentType).toBeDefined()
                expect(result.moderation.confidence).toBeGreaterThanOrEqual(0)
                expect(result.moderation.confidence).toBeLessThanOrEqual(100)
                expect(result.moderation.isHumanContent).toBeDefined()
                expect(result.moderation.flags).toBeDefined()
                expect(Array.isArray(result.moderation.flags)).toBe(true)
                expect(result.moderation.severity).toBeDefined()
                expect(result.moderation.status).toBe(ModerationStatusEnum.PENDING)
                expect(result.moderation.isBlocked).toBe(false)
                expect(result.moderation.isHidden).toBe(false)
                expect(result.moderation.processingTime).toBeGreaterThan(0)
                expect(result.moderation.createdAt).toBeInstanceOf(Date)
                expect(result.moderation.updatedAt).toBeInstanceOf(Date)
                expect(result.moderation.moderatedAt).toBeNull()
            })

            it("deve retornar resultado de detecção completo", async () => {
                const imageData = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.alloc(30000, 128)])

                const request: ContentDetectionRequest = {
                    contentId: "detection-001",
                    contentOwnerId: "user-001",
                    contentData: imageData,
                    metadata: {
                        type: "image/jpeg",
                        description: "Texto normal",
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.detectionResult).toBeDefined()
                expect(result.detectionResult?.contentType).toBeDefined()
                expect(result.detectionResult?.confidence).toBeGreaterThanOrEqual(0)
                expect(result.detectionResult?.confidence).toBeLessThanOrEqual(100)
                expect(result.detectionResult?.isHumanContent).toBeDefined()
                expect(result.detectionResult?.flags).toBeDefined()
                expect(Array.isArray(result.detectionResult?.flags)).toBe(true)
                expect(result.detectionResult?.processingTime).toBeGreaterThanOrEqual(0)
                expect(result.detectionResult?.reasoning).toBeDefined()
                expect(result.detectionResult?.detectedAt).toBeInstanceOf(Date)
            })

            it("deve retornar flags de moderação adequadas", async () => {
                const spamText = "FREE MONEY!!! CLICK NOW!!! LIMITED TIME OFFER!!!"

                const request: ContentDetectionRequest = {
                    contentId: "flags-001",
                    contentOwnerId: "user-001",
                    metadata: {
                        description: spamText,
                        hashtags: Array.from({ length: 35 }, (_, i) => `#tag${i}`), // 35 hashtags
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.detectionResult?.flags).toBeDefined()
                expect(result.detectionResult?.flags.length).toBeGreaterThan(0)

                const flags = result.detectionResult?.flags || []
                flags.forEach((flag) => {
                    expect(flag.type).toBeDefined()
                    expect(flag.severity).toBeDefined()
                    expect(flag.confidence).toBeGreaterThanOrEqual(0)
                    expect(flag.confidence).toBeLessThanOrEqual(100)
                    expect(flag.description).toBeDefined()
                    expect(flag.detectedAt).toBeInstanceOf(Date)
                    expect(flag.metadata).toBeDefined()
                })
            })

            it("deve calcular severidade corretamente", async () => {
                const highSeverityText =
                    "FREE MONEY!!! CLICK NOW!!! LIMITED TIME OFFER!!! BUY NOW!!!"

                const request: ContentDetectionRequest = {
                    contentId: "severity-001",
                    contentOwnerId: "user-001",
                    metadata: {
                        description: highSeverityText,
                    },
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.moderation.severity).toBeDefined()
                expect([
                    ModerationSeverityEnum.LOW,
                    ModerationSeverityEnum.MEDIUM,
                    ModerationSeverityEnum.HIGH,
                ]).toContain(result.moderation.severity)
            })

            it("deve retornar resultado de bloqueio automático quando aplicável", async () => {
                // Configurar engine com auto-bloqueio ativado
                const config = ModerationEngineFactory.createStrictConfig()
                const strictEngine = ModerationEngineFactory.create(
                    mockHttpAdapter,
                    mockModerationRepository,
                    mockContentStorage,
                    config,
                )

                const spamText = "FREE MONEY!!! CLICK NOW!!! LIMITED TIME OFFER!!!"

                const request: ContentDetectionRequest = {
                    contentId: "blocking-001",
                    contentOwnerId: "user-001",
                    metadata: {
                        description: spamText,
                    },
                }

                const result = await strictEngine.moderateContent(request)

                expect(result.success).toBe(true)
                expect(result.blockingResult).toBeDefined()
                expect(result.blockingResult?.success).toBeDefined()
                expect(result.blockingResult?.moderationId).toBeDefined()
                expect(result.blockingResult?.blockType).toBeDefined()
                expect(result.blockingResult?.appliedAt).toBeInstanceOf(Date)
                expect(result.blockingResult?.reason).toBeDefined()
                expect(result.blockingResult?.metadata).toBeDefined()
            })
        })

        describe("Error Outputs", () => {
            it("deve retornar erro quando processamento falha", async () => {
                // Mock repository para lançar erro
                mockModerationRepository.save.mockRejectedValue(new Error("Database error"))

                const request: ContentDetectionRequest = {
                    contentId: "error-001",
                    contentOwnerId: "user-001",
                    contentData: Buffer.from("test"),
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(false)
                expect(result.errors).toBeDefined()
                expect(result.errors?.length).toBeGreaterThan(0)
                expect(result.errors?.[0]).toContain("Database error")
                expect(result.processingTime).toBeGreaterThanOrEqual(0)
            })

            it("deve retornar moderação vazia em caso de erro", async () => {
                mockModerationRepository.save.mockRejectedValue(new Error("Test error"))

                const request: ContentDetectionRequest = {
                    contentId: "error-002",
                    contentOwnerId: "user-002",
                    contentData: Buffer.from("test"),
                }

                const result = await moderationEngine.moderateContent(request)

                expect(result.success).toBe(false)
                expect(result.moderation).toBeDefined()
                expect(result.moderation).toEqual({})
            })
        })

        describe("Performance Outputs", () => {
            it("deve retornar tempo de processamento adequado", async () => {
                const request: ContentDetectionRequest = {
                    contentId: "perf-001",
                    contentOwnerId: "user-001",
                    metadata: {
                        description: "Texto simples",
                    },
                }

                const startTime = Date.now()
                const result = await moderationEngine.moderateContent(request)
                const endTime = Date.now()

                expect(result.success).toBe(true)
                expect(result.processingTime).toBeGreaterThanOrEqual(0)
                expect(result.processingTime).toBeLessThan(endTime - startTime + 100) // Margem de erro
                expect(result.detectionResult?.processingTime).toBeGreaterThanOrEqual(0)
            })

            it("deve processar múltiplas entradas sequencialmente", async () => {
                const requests: ContentDetectionRequest[] = [
                    {
                        contentId: "batch-001",
                        contentOwnerId: "user-001",
                        metadata: { description: "Texto 1" },
                    },
                    {
                        contentId: "batch-002",
                        contentOwnerId: "user-002",
                        metadata: { description: "Texto 2" },
                    },
                    {
                        contentId: "batch-003",
                        contentOwnerId: "user-003",
                        metadata: { description: "Texto 3" },
                    },
                ]

                const startTime = Date.now()
                const results = await Promise.all(
                    requests.map((request) => moderationEngine.moderateContent(request)),
                )
                const endTime = Date.now()

                expect(results).toHaveLength(3)
                results.forEach((result, index) => {
                    expect(result.success).toBe(true)
                    expect(result.moderation.contentId).toBe(`batch-00${index + 1}`)
                    expect(result.processingTime).toBeGreaterThanOrEqual(0)
                    expect(result.processingTime).toBeLessThan(endTime - startTime + 100)
                })
            })
        })
    })

    describe("Integration Tests", () => {
        it("deve processar fluxo completo de moderação", async () => {
            const imageData = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.alloc(50000, 128)])

            const request: ContentDetectionRequest = {
                contentId: "integration-001",
                contentOwnerId: "user-001",
                contentData: imageData,
                metadata: {
                    type: "image/jpeg",
                    description: "Imagem de teste para integração",
                    hashtags: ["#test", "#integration"],
                },
            }

            // 1. Processar moderação
            const moderationResult = await moderationEngine.moderateContent(request)
            expect(moderationResult.success).toBe(true)

            const moderationId = moderationResult.moderation.id

            // 2. Buscar moderação por ID
            mockModerationRepository.findById.mockResolvedValueOnce(moderationResult.moderation)
            const retrievedModeration = await moderationEngine.getModeration(moderationId)
            expect(retrievedModeration).toBeDefined()
            expect(retrievedModeration?.contentId).toBe("integration-001")

            // 3. Buscar moderação por content ID
            mockModerationRepository.findByContentId.mockResolvedValueOnce(
                moderationResult.moderation,
            )
            const contentModeration = await moderationEngine.getModerationByContentId(
                "integration-001",
            )
            expect(contentModeration).toBeDefined()
            expect(contentModeration?.id).toBe(moderationId)

            // 4. Aprovar conteúdo
            mockModerationRepository.findById.mockResolvedValueOnce(moderationResult.moderation)
            const approvalResult = await moderationEngine.approveContent(
                moderationId,
                "Aprovado manualmente",
            )
            expect(approvalResult.success).toBe(true)
            expect(approvalResult.reason).toBe("Aprovado manualmente")

            // 5. Marcar para revisão
            mockModerationRepository.findById.mockResolvedValueOnce(moderationResult.moderation)
            const flagResult = await moderationEngine.flagContent(
                moderationId,
                "Marcado para revisão",
            )
            expect(flagResult.success).toBe(true)
            expect(flagResult.reason).toBe("Marcado para revisão")
        })

        it("deve processar fluxo de bloqueio completo", async () => {
            const spamText = "FREE MONEY!!! CLICK NOW!!! LIMITED TIME OFFER!!!"

            const request: ContentDetectionRequest = {
                contentId: "block-integration-001",
                contentOwnerId: "user-001",
                metadata: {
                    description: spamText,
                },
            }

            // 1. Processar moderação
            const moderationResult = await moderationEngine.moderateContent(request)
            expect(moderationResult.success).toBe(true)

            const moderationId = moderationResult.moderation.id

            // 2. Aplicar bloqueio manual
            mockModerationRepository.findById.mockResolvedValueOnce(moderationResult.moderation)
            const blockResult = await moderationEngine.blockContent({
                moderationId,
                reason: "Conteúdo spam detectado",
                severity: ModerationSeverityEnum.HIGH,
                blockType: "hard_block" as any,
            })
            expect(blockResult.success).toBe(true)
            expect(blockResult.blockType).toBe("hard_block")

            // 3. Remover bloqueio
            mockModerationRepository.findById.mockResolvedValueOnce(moderationResult.moderation)
            const unblockResult = await moderationEngine.unblockContent(moderationId)
            expect(unblockResult.success).toBe(true)
            expect(unblockResult.blockType).toBe("warn")
        })
    })
})
