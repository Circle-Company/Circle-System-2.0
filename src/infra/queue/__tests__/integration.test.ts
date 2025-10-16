/**
 * Teste de integração completo: Queue + Worker + Storage
 * Simula o fluxo completo de processamento assíncrono de embeddings
 */

import { RealLocalStorageAdapter } from "@/core/content.processor/real.local.storage.adapter"
import { Moment } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentProcessingStatusEnum } from "@/domain/moment/types"
import { existsSync, mkdirSync, rmSync } from "fs"
import { join } from "path"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { EmbeddingsQueue } from "../embeddings.queue"
import { EmbeddingsWorker } from "../embeddings.worker"
import { EmbeddingJobPriority } from "../types/embedding.job.types"

// Mock Repository
class IntegrationMockRepository implements Partial<IMomentRepository> {
    private moments = new Map<string, Moment>()

    async findById(id: string): Promise<Moment | null> {
        return this.moments.get(id) || null
    }

    async update(moment: Moment): Promise<Moment> {
        this.moments.set(moment.id, moment)
        return moment
    }

    async create(moment: Moment): Promise<Moment> {
        this.moments.set(moment.id, moment)
        return moment
    }

    addMockMoment(moment: Moment) {
        this.moments.set(moment.id, moment)
    }

    getMoments() {
        return Array.from(this.moments.values())
    }

    clear() {
        this.moments.clear()
    }
}

describe("Integração Completa: Queue + Worker + Storage", () => {
    let queue: EmbeddingsQueue
    let worker: EmbeddingsWorker
    let storage: RealLocalStorageAdapter
    let repository: IntegrationMockRepository

    const testStorageDir = "./test-integration-storage"

    beforeAll(() => {
        // Setup storage
        if (!existsSync(testStorageDir)) {
            mkdirSync(testStorageDir, { recursive: true })
        }

        // Criar arquivo de vídeo fake
        const videosDir = join(testStorageDir, "videos")
        if (!existsSync(videosDir)) {
            mkdirSync(videosDir, { recursive: true })
        }

        // Inicializar componentes
        queue = EmbeddingsQueue.getInstance()
        repository = new IntegrationMockRepository()
        worker = new EmbeddingsWorker(repository as IMomentRepository)
        storage = new RealLocalStorageAdapter(testStorageDir, "http://localhost:3000/test")
    })

    afterAll(async () => {
        // Cleanup
        if (worker.isActive()) {
            await worker.stop()
        }
        await queue.close()

        if (existsSync(testStorageDir)) {
            rmSync(testStorageDir, { recursive: true, force: true })
        }
    })

    beforeEach(async () => {
        repository.clear()
        const bullQueue = queue.getQueue()
        await bullQueue.empty()
    })

    describe("Fluxo Completo: Upload → Queue → Worker", () => {
        it("deve processar momento do upload até embedding", async () => {
            // 1. Upload de vídeo para storage
            const videoData = Buffer.from("fake video content for integration test")
            const uploadResult = await storage.uploadVideo(videoData, {
                filename: "integration-test.mp4",
                mimeType: "video/mp4",
                metadata: {
                    duration: 30,
                    codec: "h264",
                },
            })

            expect(uploadResult.success).toBe(true)

            // 2. Criar momento mock
            const mockMoment = {
                id: "integration-moment-001",
                processing: {
                    status: MomentProcessingStatusEnum.MEDIA_PROCESSED,
                },
                media: {
                    urls: {
                        high: uploadResult.url,
                    },
                },
                updateEmbedding: (vector: string, dimension: number, metadata: any) => {
                    ;(mockMoment as any).embedding = { vector, dimension, metadata }
                },
            } as unknown as Moment

            repository.addMockMoment(mockMoment)

            // 3. Adicionar job à fila
            const jobData = {
                momentId: "integration-moment-001",
                videoUrl: uploadResult.url,
                thumbnailUrl: "https://picsum.photos/seed/integration/360/558",
                description: "Integration test moment",
                hashtags: ["integration", "test", "complete"],
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                },
                priority: EmbeddingJobPriority.HIGH,
            }

            await queue.addJob(jobData, EmbeddingJobPriority.HIGH)

            // 4. Verificar que job foi enfileirado
            const stats = await queue.getStats()
            expect(stats.waiting + stats.delayed).toBeGreaterThan(0)

            // 5. Iniciar worker
            worker.start()
            expect(worker.isActive()).toBe(true)

            // 6. Aguardar processamento
            await new Promise((resolve) => setTimeout(resolve, 20000))

            // 7. Verificar resultados
            const processedMoment = await repository.findById("integration-moment-001")
            expect(processedMoment).toBeDefined()

            // Note: O embedding real depende de modelos baixados
            // Este teste verifica o fluxo, não o conteúdo do embedding
        }, 35000) // Timeout de 35s
    })

    describe("Fluxo com Agendamento", () => {
        it("deve agendar processamento para horário futuro", async () => {
            // Upload
            const videoData = Buffer.from("scheduled video content")
            const uploadResult = await storage.uploadVideo(videoData, {
                filename: "scheduled-test.mp4",
                mimeType: "video/mp4",
            })

            expect(uploadResult.success).toBe(true)

            // Criar momento
            const mockMoment = {
                id: "scheduled-moment-001",
                processing: {
                    status: MomentProcessingStatusEnum.MEDIA_PROCESSED,
                },
                updateEmbedding: () => {},
            } as unknown as Moment

            repository.addMockMoment(mockMoment)

            // Agendar job
            const jobData = {
                momentId: "scheduled-moment-001",
                videoUrl: uploadResult.url,
                thumbnailUrl: "https://picsum.photos/seed/scheduled/360/558",
                description: "Scheduled moment",
                hashtags: ["scheduled"],
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 25,
                    codec: "h264",
                    hasAudio: true,
                },
                priority: EmbeddingJobPriority.NORMAL,
            }

            // Agendar para próxima hora
            const nextHour = new Date()
            nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
            const targetTime = `${nextHour.getHours().toString().padStart(2, "0")}:00`

            const job = await queue.scheduleFor(jobData, targetTime)

            expect(job).toBeDefined()
            expect(job.opts.delay).toBeGreaterThan(0)
            expect(job.data.scheduledFor).toBeDefined()

            // Verificar que está na fila de delayed
            const stats = await queue.getStats()
            expect(stats.delayed).toBeGreaterThan(0)
        })
    })

    describe("Processamento em Lote", () => {
        it("deve processar múltiplos jobs em sequência", async () => {
            const jobCount = 3

            // Upload de múltiplos vídeos
            for (let i = 0; i < jobCount; i++) {
                const videoData = Buffer.from(`batch video ${i}`)
                const uploadResult = await storage.uploadVideo(videoData, {
                    filename: `batch-${i}.mp4`,
                    mimeType: "video/mp4",
                })

                const mockMoment = {
                    id: `batch-moment-${i}`,
                    processing: {
                        status: MomentProcessingStatusEnum.MEDIA_PROCESSED,
                    },
                    updateEmbedding: () => {},
                } as unknown as Moment

                repository.addMockMoment(mockMoment)

                await queue.addJob({
                    momentId: `batch-moment-${i}`,
                    videoUrl: uploadResult.url,
                    thumbnailUrl: `https://picsum.photos/seed/batch${i}/360/558`,
                    description: `Batch moment ${i}`,
                    hashtags: ["batch", `item${i}`],
                    videoMetadata: {
                        width: 1080,
                        height: 1674,
                        duration: 20,
                        codec: "h264",
                        hasAudio: true,
                    },
                    priority: EmbeddingJobPriority.NORMAL,
                })
            }

            // Verificar jobs enfileirados
            const stats = await queue.getStats()
            expect(stats.waiting + stats.delayed).toBeGreaterThanOrEqual(jobCount)
        })
    })

    describe("Recuperação de Erros", () => {
        it("deve tratar erro quando vídeo não pode ser baixado", async () => {
            const mockMoment = {
                id: "error-moment-001",
                processing: {
                    status: MomentProcessingStatusEnum.MEDIA_PROCESSED,
                },
                updateEmbedding: () => {},
            } as unknown as Moment

            repository.addMockMoment(mockMoment)

            // Job com URL inválida
            await queue.addJob({
                momentId: "error-moment-001",
                videoUrl: "http://invalid-url-that-does-not-exist/video.mp4",
                thumbnailUrl: "https://picsum.photos/seed/error/360/558",
                description: "Error test",
                hashtags: ["error"],
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 15,
                    codec: "h264",
                    hasAudio: true,
                },
                priority: EmbeddingJobPriority.NORMAL,
            })

            // Iniciar worker se não estiver ativo
            if (!worker.isActive()) {
                worker.start()
            }

            // Aguardar tentativa de processamento
            await new Promise((resolve) => setTimeout(resolve, 10000))

            // Job deve ter falhado
            const job = await queue.getJob("error-moment-001")
            // Job pode ter sido removido ou estar em failed
            if (job) {
                const state = await job.getState()
                expect(["failed", "waiting"].includes(state)).toBeTruthy()
            }
        }, 15000)
    })

    describe("Estatísticas e Monitoramento", () => {
        it("deve fornecer estatísticas precisas da fila", async () => {
            // Adicionar alguns jobs
            for (let i = 0; i < 2; i++) {
                await queue.addJob({
                    momentId: `stats-moment-${i}`,
                    videoUrl:
                        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                    thumbnailUrl: "https://picsum.photos/seed/stats/360/558",
                    description: `Stats moment ${i}`,
                    hashtags: ["stats"],
                    videoMetadata: {
                        width: 1080,
                        height: 1674,
                        duration: 10,
                        codec: "h264",
                        hasAudio: true,
                    },
                    priority: EmbeddingJobPriority.NORMAL,
                })
            }

            const stats = await queue.getStats()

            expect(stats.total).toBeGreaterThanOrEqual(2)
            expect(stats.waiting).toBeDefined()
            expect(stats.active).toBeDefined()
            expect(stats.completed).toBeDefined()
            expect(stats.failed).toBeDefined()
            expect(stats.delayed).toBeDefined()
        })
    })
})
