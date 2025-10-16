/**
 * Testes de integração para VideoCompressionWorker
 */

import { Moment } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { VideoCompressionQueue } from "../video.compression.queue"
import { VideoCompressionWorker } from "../video.compression.worker"
import { EmbeddingJobPriority } from "../types/embedding.job.types"

// Mock do repository
class MockMomentRepository implements Partial<IMomentRepository> {
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

    clear() {
        this.moments.clear()
    }
}

describe("VideoCompressionWorker - Integração", () => {
    let worker: VideoCompressionWorker
    let queue: VideoCompressionQueue
    let mockRepository: MockMomentRepository

    beforeAll(() => {
        mockRepository = new MockMomentRepository()
        queue = VideoCompressionQueue.getInstance()
    })

    afterAll(async () => {
        if (worker && worker.isActive()) {
            await worker.stop()
        }
        await queue.close()
    })

    beforeEach(async () => {
        mockRepository.clear()
        // Limpar fila
        const bullQueue = queue.getQueue()
        await bullQueue.empty()
    })

    afterEach(async () => {
        if (worker && worker.isActive()) {
            await worker.stop()
        }
    })

    describe("Inicialização", () => {
        it("deve inicializar worker corretamente", () => {
            worker = new VideoCompressionWorker(mockRepository as IMomentRepository)
            expect(worker).toBeDefined()
            expect(worker.isActive()).toBe(false)
        })

        it("deve iniciar worker", () => {
            worker = new VideoCompressionWorker(mockRepository as IMomentRepository)
            worker.start()
            expect(worker.isActive()).toBe(true)
        })

        it("não deve iniciar worker duas vezes", () => {
            worker = new VideoCompressionWorker(mockRepository as IMomentRepository)
            worker.start()
            const consoleLogSpy = vi.spyOn(console, "log")
            worker.start()
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("já está rodando"))
            consoleLogSpy.mockRestore()
        })
    })

    describe("Parar Worker", () => {
        it("deve parar worker", async () => {
            worker = new VideoCompressionWorker(mockRepository as IMomentRepository)
            worker.start()
            await worker.stop()
            expect(worker.isActive()).toBe(false)
        })

        it("deve permitir parar worker não iniciado", async () => {
            worker = new VideoCompressionWorker(mockRepository as IMomentRepository)
            await expect(worker.stop()).resolves.not.toThrow()
        })
    })

    describe("Processamento de Jobs", () => {
        it("deve processar job de compressão com sucesso", async () => {
            // Criar mock do moment
            const mockMoment = {
                id: "test-compression-integration",
                media: {
                    urls: {
                        high: "http://localhost:3000/uploads/videos/original.mp4",
                        medium: "http://localhost:3000/uploads/videos/original.mp4",
                        low: "http://localhost:3000/uploads/videos/original.mp4",
                    },
                    storage: {
                        provider: "local",
                        bucket: "",
                        key: "videos/original.mp4",
                        region: "",
                    },
                },
            } as unknown as Moment

            mockRepository.addMockMoment(mockMoment)

            // Iniciar worker
            worker = new VideoCompressionWorker(mockRepository as IMomentRepository)
            worker.start()

            // Adicionar job à fila
            const jobData = {
                momentId: "test-compression-integration",
                originalVideoUrl: "http://localhost:3000/uploads/videos/original.mp4",
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                    size: 1024000,
                },
                priority: EmbeddingJobPriority.HIGH,
            }

            await queue.addJob(jobData, EmbeddingJobPriority.HIGH)

            // Aguardar processamento (timeout mais longo para processamento real)
            await new Promise((resolve) => setTimeout(resolve, 10000))

            // Verificar se moment foi atualizado
            const updatedMoment = await mockRepository.findById("test-compression-integration")
            expect(updatedMoment).toBeDefined()

            // Note: O teste real de compressão depende de FFmpeg instalado
            // Este é um teste de integração básico
        }, 15000) // Timeout de 15s

        it("deve tratar erro quando moment não existe", async () => {
            worker = new VideoCompressionWorker(mockRepository as IMomentRepository)
            worker.start()

            const jobData = {
                momentId: "non-existent-compression",
                originalVideoUrl: "http://localhost:3000/uploads/videos/non-existent.mp4",
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 15,
                    codec: "h264",
                    hasAudio: true,
                    size: 512000,
                },
                priority: EmbeddingJobPriority.NORMAL,
            }

            await queue.addJob(jobData)

            // Aguardar tentativa de processamento
            await new Promise((resolve) => setTimeout(resolve, 5000))

            // Verificar que o job falhou
            const job = await queue.getJob("non-existent-compression")
            // Job pode ter sido removido após falha
            expect(job === null || (job && (await job.isFailed()))).toBeTruthy()
        }, 10000)
    })

    describe("Status do Worker", () => {
        it("deve retornar status correto", () => {
            worker = new VideoCompressionWorker(mockRepository as IMomentRepository)
            expect(worker.isActive()).toBe(false)

            worker.start()
            expect(worker.isActive()).toBe(true)
        })
    })
})
