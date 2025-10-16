/**
 * Video Compression Queue
 * Fila para processamento assíncrono de compressão de vídeo usando Bull
 */

import Bull, { Job, Queue } from "bull"
import {
    VideoCompressionJobData,
    VideoCompressionJobResult,
} from "./types/video.compression.job.types"

import { bullConfig } from "./bull.config"
import { EmbeddingJobPriority } from "./types/embedding.job.types"

export class VideoCompressionQueue {
    private queue: Queue<VideoCompressionJobData>
    private static instance: VideoCompressionQueue

    private constructor() {
        this.queue = new Bull<VideoCompressionJobData>("video-compression", {
            redis: bullConfig.redis,
            defaultJobOptions: bullConfig.defaultJobOptions,
        })

        this.setupEventListeners()
    }

    /**
     * Singleton pattern
     */
    static getInstance(): VideoCompressionQueue {
        if (!VideoCompressionQueue.instance) {
            VideoCompressionQueue.instance = new VideoCompressionQueue()
        }
        return VideoCompressionQueue.instance
    }

    /**
     * Adiciona job para compressão imediata
     */
    async addJob(
        data: VideoCompressionJobData,
        priority: number = EmbeddingJobPriority.NORMAL,
    ): Promise<Job<VideoCompressionJobData>> {
        console.log(`[VideoCompressionQueue] 📥 Enfileirando compressão: ${data.momentId}`)

        const job = await this.queue.add(data, {
            priority,
            jobId: `compression-${data.momentId}`,
        })

        console.log(`[VideoCompressionQueue] ✅ Job de compressão enfileirado: ${job.id}`)

        return job
    }

    /**
     * Agenda job para horário específico
     */
    async scheduleFor(
        data: VideoCompressionJobData,
        targetTime: string, // Formato: "01:00" ou "13:30"
    ): Promise<Job<VideoCompressionJobData>> {
        console.log(
            `[VideoCompressionQueue] 📅 Agendando compressão ${data.momentId} para ${targetTime}`,
        )

        // Calcular delay até o horário target
        const delay = this.calculateDelayUntil(targetTime)

        const job = await this.queue.add(
            { ...data, scheduledFor: new Date(Date.now() + delay) },
            {
                delay,
                priority: data.priority,
                jobId: `compression-${data.momentId}`,
            },
        )

        console.log(
            `[VideoCompressionQueue] ✅ Compressão agendada para ${new Date(
                Date.now() + delay,
            ).toLocaleString()}`,
        )

        return job
    }

    /**
     * Obtém job por ID do moment
     */
    async getJob(momentId: string): Promise<Job<VideoCompressionJobData> | null> {
        return this.queue.getJob(`compression-${momentId}`)
    }

    /**
     * Remove job da fila
     */
    async removeJob(momentId: string): Promise<void> {
        const job = await this.getJob(momentId)
        if (job) {
            await job.remove()
            console.log(`[VideoCompressionQueue] 🗑️  Job de compressão removido: ${momentId}`)
        }
    }

    /**
     * Obtém estatísticas da fila
     */
    async getStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount(),
            this.queue.getDelayedCount(),
        ])

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed,
        }
    }

    /**
     * Limpa jobs antigos
     */
    async clean(grace: number = 86400000): Promise<void> {
        // Limpar completed > 24h
        await this.queue.clean(grace, "completed")
        // Limpar failed > 7 dias
        await this.queue.clean(grace * 7, "failed")

        console.log("[VideoCompressionQueue] 🧹 Limpeza de jobs antigos concluída")
    }

    /**
     * Calcula delay em ms até horário target
     */
    private calculateDelayUntil(targetTime: string): number {
        const [hours, minutes] = targetTime.split(":").map(Number)

        const now = new Date()
        const target = new Date()
        target.setHours(hours, minutes, 0, 0)

        // Se horário já passou hoje, agendar para amanhã
        if (target <= now) {
            target.setDate(target.getDate() + 1)
        }

        return target.getTime() - now.getTime()
    }

    /**
     * Configura listeners de eventos
     */
    private setupEventListeners(): void {
        this.queue.on(
            "completed",
            (job: Job<VideoCompressionJobData>, result: VideoCompressionJobResult) => {
                console.log(
                    `[VideoCompressionQueue] ✅ Compressão completa: ${job.data.momentId} (${
                        result.processingTime
                    }ms, ${result.compressionRatio?.toFixed(1)}% menor)`,
                )
            },
        )

        this.queue.on("failed", (job: Job<VideoCompressionJobData>, error: Error) => {
            console.error(
                `[VideoCompressionQueue] ❌ Compressão falhou: ${job.data.momentId}`,
                error.message,
            )
        })

        this.queue.on("stalled", (job: Job<VideoCompressionJobData>) => {
            console.warn(`[VideoCompressionQueue] ⚠️ Compressão travada: ${job.data.momentId}`)
        })

        this.queue.on("error", (error: Error) => {
            console.error("[VideoCompressionQueue] ❌ Erro na fila:", error)
        })
    }

    /**
     * Fecha fila e conexões
     */
    async close(): Promise<void> {
        await this.queue.close()
        console.log("[VideoCompressionQueue] 🔌 Fila fechada")
    }

    /**
     * Retorna instância da fila (para worker)
     */
    getQueue(): Queue<VideoCompressionJobData> {
        return this.queue
    }
}
