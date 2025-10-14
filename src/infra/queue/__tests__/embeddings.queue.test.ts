/**
 * Testes de integração para EmbeddingsQueue
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { EmbeddingsQueue } from "../embeddings.queue"
import { EmbeddingJobPriority } from "../types/embedding.job.types"

describe("EmbeddingsQueue - Integração", () => {
    let queue: EmbeddingsQueue

    beforeAll(() => {
        queue = EmbeddingsQueue.getInstance()
    })

    afterAll(async () => {
        await queue.close()
    })

    beforeEach(async () => {
        // Limpar fila antes de cada teste
        const bullQueue = queue.getQueue()
        await bullQueue.empty()
    })

    describe("Singleton Pattern", () => {
        it("deve retornar sempre a mesma instância", () => {
            const instance1 = EmbeddingsQueue.getInstance()
            const instance2 = EmbeddingsQueue.getInstance()
            expect(instance1).toBe(instance2)
        })
    })

    describe("addJob", () => {
        it("deve adicionar job à fila com sucesso", async () => {
            const jobData = {
                momentId: "test-moment-123",
                videoUrl: "http://localhost:3000/uploads/videos/test.mp4",
                thumbnailUrl: "http://localhost:3000/uploads/thumbnails/test.jpg",
                description: "Test moment",
                hashtags: ["test", "integration"],
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 30,
                    codec: "h264",
                    hasAudio: true,
                },
                priority: EmbeddingJobPriority.NORMAL,
            }

            const job = await queue.addJob(jobData)

            expect(job).toBeDefined()
            expect(job.id).toBe(`embedding-${jobData.momentId}`)
            expect(job.data).toEqual(jobData)
        })

        it("deve adicionar job com prioridade alta", async () => {
            const jobData = {
                momentId: "high-priority-moment",
                videoUrl: "http://localhost:3000/uploads/videos/urgent.mp4",
                thumbnailUrl: "http://localhost:3000/uploads/thumbnails/urgent.jpg",
                description: "Urgent moment",
                hashtags: ["urgent"],
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 15,
                    codec: "h264",
                    hasAudio: true,
                },
                priority: EmbeddingJobPriority.HIGH,
            }

            const job = await queue.addJob(jobData, EmbeddingJobPriority.HIGH)

            expect(job).toBeDefined()
            expect(job.opts.priority).toBe(EmbeddingJobPriority.HIGH)
        })
    })

    describe("scheduleFor", () => {
        it("deve agendar job para horário futuro", async () => {
            const jobData = {
                momentId: "scheduled-moment",
                videoUrl: "http://localhost:3000/uploads/videos/scheduled.mp4",
                thumbnailUrl: "http://localhost:3000/uploads/thumbnails/scheduled.jpg",
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
        })

        it("deve agendar para 01:00 da manhã", async () => {
            const jobData = {
                momentId: "night-moment",
                videoUrl: "http://localhost:3000/uploads/videos/night.mp4",
                thumbnailUrl: "http://localhost:3000/uploads/thumbnails/night.jpg",
                description: "Night processing",
                hashtags: ["night"],
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 20,
                    codec: "h264",
                    hasAudio: true,
                },
                priority: EmbeddingJobPriority.NORMAL,
            }

            const job = await queue.scheduleFor(jobData, "01:00")

            expect(job).toBeDefined()
            expect(job.opts.delay).toBeGreaterThan(0)
        })
    })

    describe("getJob", () => {
        it("deve recuperar job por momentId", async () => {
            const jobData = {
                momentId: "retrievable-moment",
                videoUrl: "http://localhost:3000/uploads/videos/retrieve.mp4",
                thumbnailUrl: "http://localhost:3000/uploads/thumbnails/retrieve.jpg",
                description: "Retrievable moment",
                hashtags: ["retrieve"],
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 18,
                    codec: "h264",
                    hasAudio: true,
                },
                priority: EmbeddingJobPriority.NORMAL,
            }

            await queue.addJob(jobData)

            const retrievedJob = await queue.getJob(jobData.momentId)

            expect(retrievedJob).toBeDefined()
            expect(retrievedJob?.data.momentId).toBe(jobData.momentId)
        })

        it("deve retornar null para job inexistente", async () => {
            const job = await queue.getJob("non-existent-moment")
            expect(job).toBeNull()
        })
    })

    describe("removeJob", () => {
        it("deve remover job da fila", async () => {
            const jobData = {
                momentId: "removable-moment",
                videoUrl: "http://localhost:3000/uploads/videos/remove.mp4",
                thumbnailUrl: "http://localhost:3000/uploads/thumbnails/remove.jpg",
                description: "Removable moment",
                hashtags: ["remove"],
                videoMetadata: {
                    width: 1080,
                    height: 1674,
                    duration: 22,
                    codec: "h264",
                    hasAudio: true,
                },
                priority: EmbeddingJobPriority.NORMAL,
            }

            await queue.addJob(jobData)
            await queue.removeJob(jobData.momentId)

            const job = await queue.getJob(jobData.momentId)
            expect(job).toBeNull()
        })
    })

    describe("getStats", () => {
        it("deve retornar estatísticas da fila", async () => {
            // Adicionar alguns jobs
            for (let i = 0; i < 3; i++) {
                await queue.addJob({
                    momentId: `stats-moment-${i}`,
                    videoUrl: `http://localhost:3000/uploads/videos/stats-${i}.mp4`,
                    thumbnailUrl: `http://localhost:3000/uploads/thumbnails/stats-${i}.jpg`,
                    description: `Stats moment ${i}`,
                    hashtags: ["stats"],
                    videoMetadata: {
                        width: 1080,
                        height: 1674,
                        duration: 15,
                        codec: "h264",
                        hasAudio: true,
                    },
                    priority: EmbeddingJobPriority.NORMAL,
                })
            }

            const stats = await queue.getStats()

            expect(stats).toBeDefined()
            expect(stats.total).toBeGreaterThanOrEqual(3)
            expect(stats.waiting).toBeGreaterThanOrEqual(0)
            expect(stats.active).toBeGreaterThanOrEqual(0)
            expect(stats.completed).toBeGreaterThanOrEqual(0)
            expect(stats.failed).toBeGreaterThanOrEqual(0)
            expect(stats.delayed).toBeGreaterThanOrEqual(0)
        })
    })

    describe("clean", () => {
        it("deve limpar jobs antigos", async () => {
            // Este teste é mais difícil de validar sem jobs realmente antigos
            // Vamos apenas verificar se o método executa sem erros
            await expect(queue.clean(1000)).resolves.not.toThrow()
        })
    })
})
