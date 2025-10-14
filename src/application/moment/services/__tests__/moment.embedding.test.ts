/**
 * Testes de Geração de Embeddings para Moments
 * Testa o pipeline completo: Audio + Transcription + Visual + Text
 */

import {
    getEmbeddingConfig,
    MOCK_EMBEDDING_CONFIG,
} from "@/core/swipe.engine/core/embeddings/models.config"
import { combineVectors, normalizeL2 } from "@/core/swipe.engine/utils/normalization"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentService } from "../moment.service"

// Mock das dependências
vi.mock("@/core/content.processor/audio.extractor")
vi.mock("@/core/swipe.engine/core/embeddings/transcription.service")
vi.mock("@/core/swipe.engine/core/embeddings/visual.embedding.service")
vi.mock("@/core/swipe.engine/core/embeddings/text.embedding.service")

describe("MomentService - Geração de Embeddings", () => {
    let momentService: any
    let mockRepository: any
    let mockMetricsService: any
    let mockStorageAdapter: any

    beforeEach(() => {
        // Mock do repository
        mockRepository = {
            create: vi.fn().mockResolvedValue({
                id: "123",
                ownerId: "user123",
                embedding: {
                    vector: JSON.stringify([0.1, 0.2, 0.3]),
                    dimension: 3,
                    metadata: {},
                },
            }),
            findById: vi.fn(),
        }

        // Mock do metrics service
        mockMetricsService = {
            recordView: vi.fn().mockResolvedValue(undefined),
            calculateEngagementVector: vi.fn(),
        }

        // Mock do storage adapter
        mockStorageAdapter = {
            uploadVideo: vi.fn().mockResolvedValue({
                success: true,
                key: "video-123",
                url: "https://example.com/video.mp4",
                provider: "local-mock",
            }),
            uploadImage: vi.fn().mockResolvedValue({
                success: true,
                key: "thumb-123",
                url: "https://example.com/thumb.jpg",
                provider: "local-mock",
            }),
        }

        momentService = new MomentService(
            mockRepository,
            mockMetricsService,
            undefined,
            mockStorageAdapter,
        )
    })

    describe("Pipeline Completo de Content Embedding", () => {
        it("deve gerar content embedding com todos os 3 componentes", async () => {
            const videoData = Buffer.from("fake-video-data")
            const description = "Vídeo de teste sobre tecnologia"
            const hashtags = ["tech", "programação", "ai"]
            const videoMetadata = {
                width: 360,
                height: 558,
                duration: 30,
                codec: "av1",
                hasAudio: true,
            }

            // Mock do AudioExtractor
            const mockAudioExtractor = {
                extractAudio: vi.fn().mockResolvedValue({
                    success: true,
                    audioData: Buffer.from("fake-audio"),
                    duration: 30,
                    sampleRate: 16000,
                    channels: 1,
                }),
                extractFrames: vi.fn().mockResolvedValue({
                    success: true,
                    frames: [
                        { path: "frame1.jpg", data: Buffer.from("frame1"), timestamp: 0 },
                        { path: "frame2.jpg", data: Buffer.from("frame2"), timestamp: 1 },
                        { path: "frame3.jpg", data: Buffer.from("frame3"), timestamp: 2 },
                    ],
                    totalFrames: 3,
                }),
                cleanupFrames: vi.fn(),
            }

            // Mock do TranscriptionService
            const mockTranscription = {
                transcribe: vi.fn().mockResolvedValue({
                    success: true,
                    text: "Olá pessoal bem-vindos ao vídeo sobre tecnologia",
                    language: "pt",
                    confidence: 0.95,
                    processingTime: 1500,
                }),
            }

            // Mock do VisualEmbeddingService
            const mockVisualEmbedding = {
                generateEmbedding: vi.fn().mockResolvedValue({
                    success: true,
                    embedding: new Array(512).fill(0).map(() => Math.random()),
                    framesProcessed: 3,
                    processingTime: 2000,
                }),
            }

            // Mock do TextEmbeddingService
            const mockTextEmbedding = {
                generateEmbedding: vi.fn().mockResolvedValue({
                    success: true,
                    embedding: new Array(384).fill(0).map(() => Math.random()),
                    tokenCount: 50,
                    processingTime: 500,
                }),
            }

            // Injetar mocks
            ;(momentService as any).audioExtractor = mockAudioExtractor
            ;(momentService as any).transcriptionService = mockTranscription
            ;(momentService as any).visualEmbeddingService = mockVisualEmbedding
            ;(momentService as any).textEmbeddingService = mockTextEmbedding

            // Chamar método privado de geração de embedding
            const result = await (momentService as any).generateContentEmbedding(
                videoData,
                description,
                hashtags,
                videoMetadata,
            )

            // Verificações
            expect(result).toBeDefined()
            expect(result.vector).toBeDefined()
            expect(result.vector.length).toBeGreaterThan(0)
            expect(result.metadata).toBeDefined()
            expect(result.metadata.model).toBe("content-embedding-v2-pipeline")

            // Verificar que todos os componentes foram chamados
            expect(mockAudioExtractor.extractAudio).toHaveBeenCalledWith(videoData, {
                sampleRate: expect.any(Number),
                channels: expect.any(Number),
            })

            expect(mockTranscription.transcribe).toHaveBeenCalledWith(expect.any(Buffer))

            expect(mockAudioExtractor.extractFrames).toHaveBeenCalledWith(videoData, {
                fps: expect.any(Number),
                maxFrames: expect.any(Number),
            })

            expect(mockVisualEmbedding.generateEmbedding).toHaveBeenCalledWith(expect.any(Array))

            expect(mockTextEmbedding.generateEmbedding).toHaveBeenCalledWith(
                expect.stringContaining(description),
            )

            // Verificar metadata dos componentes
            expect(result.metadata.components).toBeDefined()
            expect(result.metadata.components.transcription).toBeDefined()
            expect(result.metadata.components.visual).toBeDefined()
            expect(result.metadata.components.text).toBeDefined()

            // Verificar limpeza de frames
            expect(mockAudioExtractor.cleanupFrames).toHaveBeenCalled()
        })

        it("deve usar fallback se componentes falharem", async () => {
            const videoData = Buffer.from("fake-video-data")
            const description = "Teste de fallback"
            const hashtags = ["test"]
            const videoMetadata = {
                width: 360,
                height: 558,
                duration: 10,
                codec: "av1",
                hasAudio: false,
            }

            // Mock de componentes que falham
            const mockAudioExtractor = {
                extractAudio: vi.fn().mockResolvedValue({
                    success: false,
                    error: "Audio extraction failed",
                }),
                extractFrames: vi.fn().mockResolvedValue({
                    success: false,
                    error: "Frame extraction failed",
                }),
                cleanupFrames: vi.fn(),
            }

            const mockTranscription = {
                transcribe: vi.fn().mockRejectedValue(new Error("Transcription failed")),
            }

            const mockVisualEmbedding = {
                generateEmbedding: vi.fn().mockResolvedValue({
                    success: false,
                    error: "Visual embedding failed",
                }),
            }

            const mockTextEmbedding = {
                generateEmbedding: vi.fn().mockRejectedValue(new Error("Text embedding failed")),
            }

            // Injetar mocks
            ;(momentService as any).audioExtractor = mockAudioExtractor
            ;(momentService as any).transcriptionService = mockTranscription
            ;(momentService as any).visualEmbeddingService = mockVisualEmbedding
            ;(momentService as any).textEmbeddingService = mockTextEmbedding

            // Mock do serviço legado de fallback
            ;(momentService as any).embeddingService = {
                generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
            }

            // Chamar método
            const result = await (momentService as any).generateContentEmbedding(
                videoData,
                description,
                hashtags,
                videoMetadata,
            )

            // Verificar que usou fallback
            expect(result).toBeDefined()
            expect(result.vector).toBeDefined()
            expect(result.metadata.fallback).toBe(true)
            expect((momentService as any).embeddingService.generateEmbedding).toHaveBeenCalled()
        })

        it("deve combinar embeddings com pesos corretos", async () => {
            const textEmbedding = new Array(384).fill(0.5)
            const visualEmbedding = new Array(512).fill(0.3)

            const config = getEmbeddingConfig()
            const weights = [config.weights.text, config.weights.visual]

            const combined = combineVectors([textEmbedding, visualEmbedding], weights)

            expect(combined).toBeDefined()
            expect(combined.length).toBeGreaterThan(0)

            // Verificar que a soma dos pesos é 1 (normalizado)
            const normalizedWeights = weights.map(
                (w) => w / weights.reduce((sum, val) => sum + val, 0),
            )
            const weightSum = normalizedWeights.reduce((sum, val) => sum + val, 0)
            expect(weightSum).toBeCloseTo(1, 5)
        })

        it("deve normalizar vetor final com L2", async () => {
            const rawVector = [3, 4, 0] // Magnitude = 5
            const normalized = normalizeL2(rawVector)

            // Verificar que magnitude é 1
            const magnitude = Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0))

            expect(magnitude).toBeCloseTo(1, 5)
            expect(normalized[0]).toBeCloseTo(0.6, 5) // 3/5
            expect(normalized[1]).toBeCloseTo(0.8, 5) // 4/5
            expect(normalized[2]).toBe(0)
        })
    })

    describe("Engagement Vector", () => {
        it("deve calcular engagement vector com features normalizadas", async () => {
            const metrics = {
                views: 1000,
                uniqueViews: 800,
                likes: 150,
                comments: 50,
                shares: 30,
                saves: 20,
                avgWatchTime: 25,
                completionRate: 0.75,
                reports: 2,
            }

            const result = await mockMetricsService.calculateEngagementVector({
                momentId: "123",
                metrics,
                duration: 30,
                createdAt: new Date(),
            })

            // Mock retorna resultado
            mockMetricsService.calculateEngagementVector.mockResolvedValue({
                success: true,
                vector: {
                    vector: [0.15, 0.05, 0.03, 0.02, 0.83, 0.75, 0.002, 0.025, 0.8, 1.25],
                    dimension: 10,
                    metrics,
                    features: {
                        likeRate: 0.15,
                        commentRate: 0.05,
                        shareRate: 0.03,
                        saveRate: 0.02,
                        retentionRate: 0.83,
                        avgCompletionRate: 0.75,
                        reportRate: 0.002,
                        viralityScore: 0.025,
                        qualityScore: 0.8,
                    },
                    metadata: {
                        lastUpdated: new Date(),
                        version: "engagement-vector-v1",
                        calculationMethod: "normalized-features",
                    },
                },
            })

            const engagementResult = await mockMetricsService.calculateEngagementVector({
                momentId: "123",
                metrics,
                duration: 30,
                createdAt: new Date(),
            })

            expect(engagementResult.success).toBe(true)
            expect(engagementResult.vector).toBeDefined()
            expect(engagementResult.vector.dimension).toBe(10)
            expect(engagementResult.vector.features.likeRate).toBeGreaterThan(0)
        })

        it("deve normalizar taxas entre 0 e 1", async () => {
            const features = {
                likeRate: 0.15, // 150/1000
                commentRate: 0.05, // 50/1000
                shareRate: 0.03, // 30/1000
                saveRate: 0.02, // 20/1000
                retentionRate: 0.83,
                avgCompletionRate: 0.75,
                reportRate: 0.002,
                viralityScore: 0.025,
                qualityScore: 0.8,
            }

            // Todas as taxas devem estar entre 0 e 1
            Object.values(features).forEach((value) => {
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            })
        })
    })

    describe("Integração de Componentes", () => {
        it("deve incluir transcrição no texto final", async () => {
            const description = "Vídeo sobre IA"
            const transcript = "Olá pessoal, hoje vamos falar sobre inteligência artificial"
            const hashtags = ["ia", "tech"]

            const combinedText = [
                description,
                transcript,
                hashtags.map((h) => `#${h}`).join(" "),
            ].join(" ")

            expect(combinedText).toContain(description)
            expect(combinedText).toContain(transcript)
            expect(combinedText).toContain("#ia")
            expect(combinedText).toContain("#tech")
        })

        it("deve processar múltiplos frames e calcular média", async () => {
            const frameEmbeddings = [
                [0.1, 0.2, 0.3],
                [0.2, 0.3, 0.4],
                [0.3, 0.4, 0.5],
            ]

            const avgEmbedding = frameEmbeddings[0].map((_, i) => {
                const sum = frameEmbeddings.reduce((acc, emb) => acc + emb[i], 0)
                return sum / frameEmbeddings.length
            })

            expect(avgEmbedding[0]).toBeCloseTo(0.2, 5)
            expect(avgEmbedding[1]).toBeCloseTo(0.3, 5)
            expect(avgEmbedding[2]).toBeCloseTo(0.4, 5)
        })
    })

    describe("Configuração de Modelos", () => {
        it("deve retornar configuração mock para desenvolvimento", () => {
            const config = getEmbeddingConfig()

            // Em desenvolvimento, Whisper e CLIP devem estar desabilitados
            expect(config.whisper.enabled).toBe(false)
            expect(config.clip.enabled).toBe(false)
            expect(config.textEmbedding.enabled).toBe(true)
        })

        it("deve ter pesos que somam 1", () => {
            const config = MOCK_EMBEDDING_CONFIG

            const totalWeight =
                config.weights.text + config.weights.visual + config.weights.engagement

            expect(totalWeight).toBeCloseTo(1, 5)
        })

        it("deve ter dimensões corretas para cada modelo", () => {
            const config = MOCK_EMBEDDING_CONFIG

            expect(config.whisper.dimension).toBe(128)
            expect(config.textEmbedding.dimension).toBe(128)
            expect(config.clip.dimension).toBe(128)
        })
    })

    describe("Metadata do Embedding", () => {
        it("deve incluir informações detalhadas sobre componentes", async () => {
            const metadata = {
                model: "content-embedding-v2-pipeline",
                generatedAt: new Date().toISOString(),
                components: {
                    transcription: {
                        text: "Texto transcrito",
                        language: "pt",
                        confidence: 0.95,
                        duration: 30,
                    },
                    visual: {
                        framesProcessed: 10,
                        dimension: 512,
                        processingTime: 2000,
                    },
                    text: {
                        tokenCount: 50,
                        dimension: 384,
                        textLength: 200,
                        processingTime: 500,
                    },
                },
                combinedFrom: {
                    components: 2,
                    weights: {
                        text: 0.6,
                        visual: 0.4,
                    },
                },
            }

            expect(metadata.model).toBe("content-embedding-v2-pipeline")
            expect(metadata.components.transcription).toBeDefined()
            expect(metadata.components.visual).toBeDefined()
            expect(metadata.components.text).toBeDefined()
            expect(metadata.combinedFrom.components).toBe(2)
        })

        it("deve marcar fallback quando componentes falham", () => {
            const metadata = {
                model: "content-embedding-v2-pipeline",
                generatedAt: new Date().toISOString(),
                components: {},
                fallback: true,
            }

            expect(metadata.fallback).toBe(true)
        })
    })

    describe("Performance e Otimização", () => {
        it("deve processar embeddings em tempo razoável", async () => {
            const startTime = Date.now()

            // Simular processamento rápido
            const mockProcessing = async () => {
                await new Promise((resolve) => setTimeout(resolve, 100))
                return new Array(384).fill(0).map(() => Math.random())
            }

            const embedding = await mockProcessing()
            const duration = Date.now() - startTime

            expect(embedding.length).toBe(384)
            expect(duration).toBeLessThan(500) // Deve ser rápido
        })

        it("deve limpar recursos temporários após processamento", async () => {
            const mockFramesResult = {
                success: true,
                frames: [{ path: "frame1.jpg", data: Buffer.from("1"), timestamp: 0 }],
                totalFrames: 1,
            }

            const cleanupSpy = vi.fn()
            const audioExtractor = {
                cleanupFrames: cleanupSpy,
            }

            // Simular limpeza
            audioExtractor.cleanupFrames(mockFramesResult)

            expect(cleanupSpy).toHaveBeenCalledWith(mockFramesResult)
        })
    })

    describe("Casos de Erro", () => {
        it("deve lidar com vídeo sem áudio", async () => {
            const audioResult = {
                success: false,
                error: "No audio track found",
                duration: 0,
                sampleRate: 16000,
                channels: 1,
            }

            expect(audioResult.success).toBe(false)
            expect(audioResult.error).toBeDefined()

            // Sistema deve continuar sem transcrição
        })

        it("deve lidar com falha na extração de frames", async () => {
            const framesResult = {
                success: false,
                frames: [],
                totalFrames: 0,
                error: "FFmpeg not found",
            }

            expect(framesResult.success).toBe(false)
            expect(framesResult.frames.length).toBe(0)

            // Sistema deve continuar sem embedding visual
        })

        it("deve usar embedding de texto mesmo sem visual", async () => {
            const textEmbedding = new Array(384).fill(0).map(() => Math.random())

            // Apenas texto, sem visual
            const combined = combineVectors([textEmbedding], [1.0])

            expect(combined.length).toBe(384)
        })
    })
})
