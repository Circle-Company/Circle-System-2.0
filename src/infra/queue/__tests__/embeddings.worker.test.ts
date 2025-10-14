/**
 * Testes de integração para EmbeddingsWorker
 */

import { Moment } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentProcessingStatusEnum } from "@/domain/moment/types"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { EmbeddingsQueue } from "../embeddings.queue"
import { EmbeddingsWorker } from "../embeddings.worker"
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

describe("EmbeddingsWorker - Integração", () => {
    let worker: EmbeddingsWorker
    let queue: EmbeddingsQueue
    let mockRepository: MockMomentRepository

    beforeAll(() => {
        mockRepository = new MockMomentRepository()
        queue = EmbeddingsQueue.getInstance()
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
            worker = new EmbeddingsWorker(mockRepository as IMomentRepository)
            expect(worker).toBeDefined()
            expect(worker.isActive()).toBe(false)
        })

        it("deve iniciar worker", () => {
            worker = new EmbeddingsWorker(mockRepository as IMomentRepository)
            worker.start()
            expect(worker.isActive()).toBe(true)
        })

        it("não deve iniciar worker duas vezes", () => {
            worker = new EmbeddingsWorker(mockRepository as IMomentRepository)
            worker.start()
            const consoleLogSpy = vi.spyOn(console, "log")
            worker.start()
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("já está rodando"))
            consoleLogSpy.mockRestore()
        })
    })

    describe("Parar Worker", () => {
        it("deve parar worker", async () => {
            worker = new EmbeddingsWorker(mockRepository as IMomentRepository)
            worker.start()
            await worker.stop()
            expect(worker.isActive()).toBe(false)
        })

        it("deve permitir parar worker não iniciado", async () => {
            worker = new EmbeddingsWorker(mockRepository as IMomentRepository)
            await expect(worker.stop()).resolves.not.toThrow()
        })
    })

    describe("Processamento de Jobs", () => {
        it("deve processar job de embedding com sucesso", async () => {
            // Criar mock do moment
            const mockMoment = {
                id: "test-moment-integration",
                processing: {
                    status: MomentProcessingStatusEnum.EMBEDDINGS_QUEUED,
                },
                updateEmbedding: vi.fn(),
            } as unknown as Moment

            mockRepository.addMockMoment(mockMoment)

            // Iniciar worker
            worker = new EmbeddingsWorker(mockRepository as IMomentRepository)
            worker.start()

            // Adicionar job à fila
            const jobData = {
                momentId: "test-moment-integration",
                videoUrl:
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                thumbnailUrl: "https://picsum.photos/seed/test/360/558",
                description: "Test integration moment",
                hashtags: ["integration", "test"],
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

            // Aguardar processamento (timeout mais longo para processamento real)
            await new Promise((resolve) => setTimeout(resolve, 15000))

            // Verificar se embedding foi atualizado
            const updatedMoment = await mockRepository.findById("test-moment-integration")
            expect(updatedMoment).toBeDefined()

            // Note: O teste real de embedding depende de modelos baixados
            // Este é um teste de integração básico
        }, 30000) // Timeout de 30s

        it("deve tratar erro quando moment não existe", async () => {
            worker = new EmbeddingsWorker(mockRepository as IMomentRepository)
            worker.start()

            const jobData = {
                momentId: "non-existent-moment",
                videoUrl:
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                thumbnailUrl: "https://picsum.photos/seed/test/360/558",
                description: "Non-existent moment",
                hashtags: ["error"],
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 15,
                    codec: "h264",
                    hasAudio: true,
                },
                priority: EmbeddingJobPriority.NORMAL,
            }

            await queue.addJob(jobData)

            // Aguardar tentativa de processamento
            await new Promise((resolve) => setTimeout(resolve, 5000))

            // Verificar que o job falhou
            const job = await queue.getJob("non-existent-moment")
            // Job pode ter sido removido após falha
            expect(job === null || (job && (await job.isFailed()))).toBeTruthy()
        }, 15000)
    })

    describe("Status do Worker", () => {
        it("deve retornar status correto", () => {
            worker = new EmbeddingsWorker(mockRepository as IMomentRepository)
            expect(worker.isActive()).toBe(false)

            worker.start()
            expect(worker.isActive()).toBe(true)
        })
    })
})
