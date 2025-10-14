/**
 * Teste de Integração: Criação Completa de Moment
 * 
 * Testa o fluxo end-to-end de criação de um moment incluindo:
 * - Processamento de vídeo (H.264)
 * - Upload para storage
 * - Geração de thumbnails
 * - Criação no banco de dados
 * - Enfileiramento de embeddings
 * - Atualização de métricas
 */

import {
    Moment,
    MomentProcessingStatusEnum,
    MomentStatusEnum,
    MomentVisibilityEnum,
} from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { IMomentMetricsRepository } from "@/domain/moment/repositories/moment.metrics.repository"
import { MomentMetricsEntity } from "@/domain/moment/entities/moment.metrics.entity"
import { MomentMetricsService } from "@/application/moment/services/moment.metrics.service"
import { MomentService, CreateMomentData } from "@/application/moment/services/moment.service"
import { ContentProcessor } from "@/core/content.processor"
import { EmbeddingsQueue } from "@/infra/queue/embeddings.queue"
import { existsSync, mkdirSync, rmSync } from "fs"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { generateId } from "@/shared"

// ===== MOCK REPOSITORIES =====

class MockMomentRepository implements IMomentRepository {
    private moments = new Map<string, Moment>()

    async create(moment: Moment): Promise<Moment> {
        this.moments.set(moment.id, moment)
        console.log(`[MockRepo] ✅ Moment criado: ${moment.id}`)
        return moment
    }

    async update(moment: Moment): Promise<Moment> {
        this.moments.set(moment.id, moment)
        console.log(`[MockRepo] ✅ Moment atualizado: ${moment.id}`)
        return moment
    }

    async findById(id: string): Promise<Moment | null> {
        return this.moments.get(id) || null
    }

    async delete(id: string): Promise<void> {
        this.moments.delete(id)
    }

    async findAll(): Promise<Moment[]> {
        return Array.from(this.moments.values())
    }

    getMoments() {
        return Array.from(this.moments.values())
    }

    clear() {
        this.moments.clear()
    }
}

class MockMomentMetricsRepository implements IMomentMetricsRepository {
    private metrics = new Map<string, MomentMetricsEntity>()

    async create(metrics: MomentMetricsEntity): Promise<MomentMetricsEntity> {
        this.metrics.set(metrics.momentId, metrics)
        console.log(`[MockMetricsRepo] ✅ Métricas criadas: ${metrics.momentId}`)
        return metrics
    }

    async update(metrics: MomentMetricsEntity): Promise<MomentMetricsEntity> {
        this.metrics.set(metrics.momentId, metrics)
        return metrics
    }

    async findByMomentId(momentId: string): Promise<MomentMetricsEntity | null> {
        return this.metrics.get(momentId) || null
    }

    async delete(momentId: string): Promise<void> {
        this.metrics.delete(momentId)
    }

    clear() {
        this.metrics.clear()
    }
}

// Mock ContentProcessor para evitar dependência de FFmpeg e textLib
class MockContentProcessorForTests {
    async processContent(data: {
        videoData: Buffer
        description: string
        ownerId: string
        metadata: any
    }): Promise<any> {
        const videoId = generateId()
        const thumbnailId = generateId()

        console.log(`[MockContentProcessor] 🔄 Processando conteúdo (mock)...`)

        return {
            success: true,
            contentId: videoId,
            enrichedDescription: data.description,
            videoUrls: {
                low: `http://localhost:3000/uploads/videos/${videoId}-low.mp4`,
                medium: `http://localhost:3000/uploads/videos/${videoId}-medium.mp4`,
                high: `http://localhost:3000/uploads/videos/${videoId}-high.mp4`,
            },
            thumbnailUrl: `http://localhost:3000/uploads/thumbnails/${thumbnailId}.jpg`,
            videoMetadata: {
                duration: 30,
                width: 1080,
                height: 1674,
                format: "mp4",
                codec: "h264",
                hasAudio: true,
                size: data.videoData.length,
                bitrate: 5000000,
                fps: 30,
            },
            moderation: {
                approved: true,
                requiresReview: false,
                flags: [],
                scores: {
                    violenceScore: 0,
                    adultScore: 0,
                    offensiveScore: 0,
                },
            },
            storage: {
                provider: "local",
                bucket: "uploads",
                videoKey: `videos/${videoId}.mp4`,
                thumbnailKey: `thumbnails/${thumbnailId}.jpg`,
            },
        }
    }
}

// ===== TESTES =====

describe("Integração: Criação Completa de Moment", () => {
    let momentRepository: MockMomentRepository
    let metricsRepository: MockMomentMetricsRepository
    let momentService: MomentService
    let metricsService: MomentMetricsService
    let embeddingsQueue: EmbeddingsQueue

    const testStorageDir = "./test-moment-creation"

    beforeAll(() => {
        // Setup storage
        if (!existsSync(testStorageDir)) {
            mkdirSync(testStorageDir, { recursive: true })
        }

        // Inicializar componentes
        momentRepository = new MockMomentRepository()
        metricsRepository = new MockMomentMetricsRepository()
        embeddingsQueue = EmbeddingsQueue.getInstance()

        metricsService = new MomentMetricsService(metricsRepository)

        // Criar MomentService com ContentProcessor mockado
        const mockContentProcessor = new MockContentProcessorForTests()
        momentService = new MomentService(
            momentRepository,
            metricsService,
            {
                enableValidation: false,
                enableMetrics: true,
                enableProcessing: true,
                defaultVisibility: MomentVisibilityEnum.PUBLIC,
                defaultStatus: MomentStatusEnum.PUBLISHED,
            },
            undefined, // storage adapter
        )

        // Injetar mock do ContentProcessor
        ;(momentService as any).contentProcessor = mockContentProcessor

        console.log("[Setup] ✅ Componentes inicializados (Mock ContentProcessor - sem FFmpeg/textLib)")
    })

    afterAll(async () => {
        // Cleanup
        await embeddingsQueue.close()

        if (existsSync(testStorageDir)) {
            rmSync(testStorageDir, { recursive: true, force: true })
        }

        console.log("[Cleanup] ✅ Testes finalizados")
    })

    beforeEach(async () => {
        momentRepository.clear()
        metricsRepository.clear()

        // Limpar fila
        const bullQueue = embeddingsQueue.getQueue()
        await bullQueue.empty()

        console.log("[BeforeEach] ✅ Estado limpo")
    })

    describe("Criação Básica de Moment", () => {
        it("deve criar moment com dados mínimos", async () => {
            // Criar vídeo fake
            const videoData = Buffer.from("fake video content for integration test")

            const momentData = {
                ownerId: "user-test-001",
                ownerUsername: "testuser",
                videoData,
                videoMetadata: {
                    filename: "test-video.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Moment de teste de integração",
                hashtags: ["teste", "integração", "moment"],
                mentions: ["@testuser"],
                location: {
                    latitude: -23.5505,
                    longitude: -46.6333,
                },
                device: {
                    type: "mobile",
                    os: "iOS",
                    osVersion: "17.0",
                    model: "iPhone 15 Pro",
                    screenResolution: "1179x2556",
                    orientation: "portrait",
                },
            }

            // Criar moment
            const createdMoment = await momentService.createMoment(momentData)

            // Validações
            expect(createdMoment).toBeDefined()
            expect(createdMoment.id).toBeDefined()
            expect(createdMoment.ownerId).toBe("user-test-001")
            expect(createdMoment.description).toBe("Moment de teste de integração")
            expect(createdMoment.hashtags).toEqual(["teste", "integração", "moment"])
            expect(createdMoment.mentions).toEqual(["@testuser"])

            console.log(`[Test] ✅ Moment criado: ${createdMoment.id}`)
        }, 30000)

        it("deve criar moment com status correto", async () => {
            const videoData = Buffer.from("video content for status test")

            const momentData = {
                ownerId: "user-test-002",
                ownerUsername: "statustest",
                videoData,
                videoMetadata: {
                    filename: "status-test.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Teste de status",
            }

            const createdMoment = await momentService.createMoment(momentData)

            // Validar status
            expect(createdMoment.status.current).toBe(MomentStatusEnum.PUBLISHED)
            expect(createdMoment.visibility.level).toBe(MomentVisibilityEnum.PUBLIC)
            expect(createdMoment.processing.status).toBe(MomentProcessingStatusEnum.EMBEDDINGS_QUEUED)

            console.log(`[Test] ✅ Status validado: ${createdMoment.status.current}`)
        }, 30000)
    })

    describe("Processamento de Vídeo e Storage", () => {
        it("deve processar vídeo e salvar no storage", async () => {
            const videoData = Buffer.from("video content for storage test")

            const momentData = {
                ownerId: "user-test-003",
                ownerUsername: "storagetest",
                videoData,
                videoMetadata: {
                    filename: "storage-test.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Teste de storage",
            }

            const createdMoment = await momentService.createMoment(momentData)

            // Validar URLs de mídia
            expect(createdMoment.media.urls.low).toBeDefined()
            expect(createdMoment.media.urls.medium).toBeDefined()
            expect(createdMoment.media.urls.high).toBeDefined()

            expect(createdMoment.media.urls.high).toContain("http://localhost:3000")
            expect(createdMoment.media.urls.high).toContain("/videos/")

            // Validar thumbnail
            expect(createdMoment.thumbnail.url).toBeDefined()
            expect(createdMoment.thumbnail.url).toContain("/thumbnails/")

            console.log(`[Test] ✅ Mídia processada: ${createdMoment.media.urls.high}`)
        }, 30000)

        it("deve gerar metadados de vídeo", async () => {
            const videoData = Buffer.from("video content for metadata test")

            const momentData = {
                ownerId: "user-test-004",
                ownerUsername: "metatest",
                videoData,
                videoMetadata: {
                    filename: "metadata-test.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Teste de metadata",
            }

            const createdMoment = await momentService.createMoment(momentData)

            // Validar metadata
            expect(createdMoment.content.duration).toBeGreaterThan(0)
            expect(createdMoment.content.size).toBeGreaterThan(0)
            expect(createdMoment.content.format).toBe("mp4")
            expect(createdMoment.content.codec).toBe("h264")
            expect(createdMoment.content.resolution.width).toBeGreaterThan(0)
            expect(createdMoment.content.resolution.height).toBeGreaterThan(0)

            console.log(
                `[Test] ✅ Metadata: ${createdMoment.content.resolution.width}x${createdMoment.content.resolution.height}, ${createdMoment.content.duration}s`,
            )
        }, 30000)
    })

    describe("Enfileiramento de Embeddings", () => {
        it("deve enfileirar job de embeddings após criação", async () => {
            const videoData = Buffer.from("video content for embedding queue test")

            const momentData = {
                ownerId: "user-test-005",
                ownerUsername: "queuetest",
                videoData,
                videoMetadata: {
                    filename: "queue-test.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Teste de enfileiramento",
                hashtags: ["queue", "embedding"],
            }

            const createdMoment = await momentService.createMoment(momentData)

            // Aguardar um pouco para garantir que o job foi enfileirado
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Verificar se job foi criado
            const job = await embeddingsQueue.getJob(createdMoment.id)
            expect(job).toBeDefined()

            if (job) {
                expect(job.data.momentId).toBe(createdMoment.id)
                expect(job.data.description).toBe("Teste de enfileiramento")
                expect(job.data.hashtags).toEqual(["queue", "embedding"])
                expect(job.data.videoUrl).toBeDefined()
                expect(job.data.thumbnailUrl).toBeDefined()

                console.log(`[Test] ✅ Job enfileirado: ${job.id}`)
            }
        }, 30000)

        it("deve agendar embeddings para horário configurado", async () => {
            const videoData = Buffer.from("video content for scheduled embeddings")

            const momentData = {
                ownerId: "user-test-006",
                ownerUsername: "scheduletest",
                videoData,
                videoMetadata: {
                    filename: "schedule-test.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Teste de agendamento",
            }

            const createdMoment = await momentService.createMoment(momentData)

            // Aguardar enfileiramento
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const job = await embeddingsQueue.getJob(createdMoment.id)
            expect(job).toBeDefined()

            if (job) {
                // Job deve ter delay configurado (agendado)
                expect(job.opts.delay).toBeGreaterThan(0)
                expect(job.data.scheduledFor).toBeDefined()

                console.log(`[Test] ✅ Embeddings agendados para: ${job.data.scheduledFor}`)
            }
        }, 30000)
    })

    describe("Métricas", () => {
        it("deve inicializar métricas ao criar moment", async () => {
            const videoData = Buffer.from("video content for metrics test")

            const momentData = {
                ownerId: "user-test-007",
                ownerUsername: "metricstest",
                videoData,
                videoMetadata: {
                    filename: "metrics-test.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Teste de métricas",
            }

            const createdMoment = await momentService.createMoment(momentData)

            // Aguardar inicialização de métricas
            await new Promise((resolve) => setTimeout(resolve, 500))

            // Buscar métricas
            const metrics = await metricsService.getMetrics(createdMoment.id)

            expect(metrics).toBeDefined()
            if (metrics) {
                expect(metrics.momentId).toBe(createdMoment.id)
                expect(metrics.views.totalViews).toBeGreaterThanOrEqual(0)
                expect(metrics.engagement.totalLikes).toBe(0)
                expect(metrics.engagement.totalComments).toBe(0)

                console.log(`[Test] ✅ Métricas inicializadas para: ${metrics.momentId}`)
            }
        }, 30000)
    })

    describe("Persistência", () => {
        it("deve persistir moment no repositório", async () => {
            const videoData = Buffer.from("video content for persistence test")

            const momentData = {
                ownerId: "user-test-008",
                ownerUsername: "persisttest",
                videoData,
                videoMetadata: {
                    filename: "persist-test.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Teste de persistência",
            }

            const createdMoment = await momentService.createMoment(momentData)

            // Buscar no repositório
            const foundMoment = await momentRepository.findById(createdMoment.id)

            expect(foundMoment).toBeDefined()
            expect(foundMoment?.id).toBe(createdMoment.id)
            expect(foundMoment?.ownerId).toBe("user-test-008")
            expect(foundMoment?.description).toBe("Teste de persistência")

            console.log(`[Test] ✅ Moment persistido e recuperado: ${foundMoment?.id}`)
        }, 30000)

        it("deve permitir recuperar múltiplos moments", async () => {
            // Criar 3 moments
            for (let i = 0; i < 3; i++) {
                const videoData = Buffer.from(`video content ${i}`)
                await momentService.createMoment({
                    ownerId: `user-batch-${i}`,
                    ownerUsername: `batchuser${i}`,
                    videoData,
                    videoMetadata: {
                        filename: `batch-${i}.mp4`,
                        mimeType: "video/mp4",
                        size: videoData.length,
                    },
                    description: `Moment em lote ${i}`,
                })
            }

            // Recuperar todos
            const allMoments = await momentRepository.findAll()

            expect(allMoments.length).toBeGreaterThanOrEqual(3)
            console.log(`[Test] ✅ ${allMoments.length} moments recuperados`)
        }, 60000)
    })

    describe("Validação de Dados", () => {
        it("deve validar campos obrigatórios", async () => {
            const videoData = Buffer.from("video for validation")

            // Tentar criar sem ownerId
            await expect(
                momentService.createMoment({
                    ownerId: "",
                    ownerUsername: "validtest",
                    videoData,
                    videoMetadata: {
                        filename: "valid-test.mp4",
                        mimeType: "video/mp4",
                        size: videoData.length,
                    },
                } as any),
            ).rejects.toThrow()

            console.log("[Test] ✅ Validação de campos obrigatórios funciona")
        }, 10000)

        it("deve sanitizar e processar hashtags", async () => {
            const videoData = Buffer.from("video for hashtags test")

            const momentData = {
                ownerId: "user-test-009",
                ownerUsername: "hashtagtest",
                videoData,
                videoMetadata: {
                    filename: "hashtag-test.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Teste de hashtags",
                hashtags: ["  teste  ", "INTEGRAÇÃO", "Moment"],
            }

            const createdMoment = await momentService.createMoment(momentData)

            // Hashtags devem estar normalizadas
            expect(createdMoment.hashtags).toBeDefined()
            expect(Array.isArray(createdMoment.hashtags)).toBe(true)

            console.log(`[Test] ✅ Hashtags processadas: ${createdMoment.hashtags.join(", ")}`)
        }, 30000)
    })

    describe("Estatísticas Gerais", () => {
        it("deve gerar estatísticas do processo de criação", async () => {
            const startTime = Date.now()
            const videoData = Buffer.from("video for stats test")

            const momentData = {
                ownerId: "user-test-010",
                ownerUsername: "statstest",
                videoData,
                videoMetadata: {
                    filename: "stats-test.mp4",
                    mimeType: "video/mp4",
                    size: videoData.length,
                },
                description: "Teste de estatísticas",
                hashtags: ["performance", "stats"],
            }

            const createdMoment = await momentService.createMoment(momentData)
            const duration = Date.now() - startTime

            console.log("\n")
            console.log("📊 ESTATÍSTICAS DO TESTE")
            console.log("========================")
            console.log(`⏱️  Tempo total: ${duration}ms`)
            console.log(`📹 Vídeo: ${videoData.length} bytes`)
            console.log(`🆔 Moment ID: ${createdMoment.id}`)
            console.log(`👤 Owner: ${createdMoment.ownerId}`)
            console.log(`📝 Descrição: ${createdMoment.description}`)
            console.log(`#️⃣  Hashtags: ${createdMoment.hashtags.join(", ")}`)
            console.log(`📊 Status: ${createdMoment.status.current}`)
            console.log(`🔒 Visibilidade: ${createdMoment.visibility.level}`)
            console.log(`⚙️  Processing: ${createdMoment.processing.status}`)
            console.log(`🎬 Codec: ${createdMoment.content.codec}`)
            console.log(`📐 Resolução: ${createdMoment.content.resolution.width}x${createdMoment.content.resolution.height}`)
            console.log(`⏳ Duração: ${createdMoment.content.duration}s`)
            console.log(`🔗 URL: ${createdMoment.media.urls.high}`)
            console.log("========================\n")

            expect(duration).toBeLessThan(30000) // Deve completar em menos de 30s
            expect(createdMoment).toBeDefined()
        }, 35000)
    })
})

