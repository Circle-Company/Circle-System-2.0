/**
 * Embeddings Queue
 * Fila para processamento assíncrono de embeddings usando Bull
 */

import Bull, { Job, Queue } from "bull"
import { bullConfig } from "./bull.config"
import {
    EmbeddingJobData,
    EmbeddingJobPriority,
    EmbeddingJobResult,
} from "./types/embedding.job.types"

export class EmbeddingsQueue {
    private queue: Queue<EmbeddingJobData>
    private static instance: EmbeddingsQueue

    private constructor() {
        this.queue = new Bull<EmbeddingJobData>("embeddings-processing", {
            redis: bullConfig.redis,
            defaultJobOptions: bullConfig.defaultJobOptions,
        })

        this.setupEventListeners()
    }

    /**
     * Singleton pattern
     */
    static getInstance(): EmbeddingsQueue {
        if (!EmbeddingsQueue.instance) {
            EmbeddingsQueue.instance = new EmbeddingsQueue()
        }
        return EmbeddingsQueue.instance
    }

    /**
     * Adiciona job para processamento imediato
     */
    async addJob(
        data: EmbeddingJobData,
        priority: EmbeddingJobPriority = EmbeddingJobPriority.NORMAL,
    ): Promise<Job<EmbeddingJobData>> {
        console.log(`[EmbeddingsQueue] 📥 Enfileirando job: ${data.momentId}`)

        const job = await this.queue.add(data, {
            priority,
            jobId: `embedding-${data.momentId}`,
        })

        console.log(`[EmbeddingsQueue] ✅ Job enfileirado: ${job.id}`)

        return job
    }

    /**
     * Agenda job para horário específico (ex: 01h da manhã)
     */
    async scheduleFor(
        data: EmbeddingJobData,
        targetTime: string, // Formato: "01:00" ou "13:30"
    ): Promise<Job<EmbeddingJobData>> {
        console.log(`[EmbeddingsQueue] 📅 Agendando job ${data.momentId} para ${targetTime}`)

        // Calcular delay até o horário target
        const delay = this.calculateDelayUntil(targetTime)

        const job = await this.queue.add(
            { ...data, scheduledFor: new Date(Date.now() + delay) },
            {
                delay,
                priority: data.priority,
                jobId: `embedding-${data.momentId}`,
            },
        )

        console.log(
            `[EmbeddingsQueue] ✅ Job agendado para ${new Date(
                Date.now() + delay,
            ).toLocaleString()}`,
        )

        return job
    }

    /**
     * Obtém job por ID do moment
     */
    async getJob(momentId: string): Promise<Job<EmbeddingJobData> | null> {
        return this.queue.getJob(`embedding-${momentId}`)
    }

    /**
     * Remove job da fila
     */
    async removeJob(momentId: string): Promise<void> {
        const job = await this.getJob(momentId)
        if (job) {
            await job.remove()
            console.log(`[EmbeddingsQueue] 🗑️  Job removido: ${momentId}`)
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

        console.log("[EmbeddingsQueue] 🧹 Limpeza de jobs antigos concluída")
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
        this.queue.on("completed", (job: Job<EmbeddingJobData>, result: EmbeddingJobResult) => {
            console.log(
                `[EmbeddingsQueue] ✅ Job completo: ${job.data.momentId} (${result.processingTime}ms)`,
            )
        })

        this.queue.on("failed", (job: Job<EmbeddingJobData>, error: Error) => {
            console.error(`[EmbeddingsQueue] ❌ Job falhou: ${job.data.momentId}`, error.message)
        })

        this.queue.on("stalled", (job: Job<EmbeddingJobData>) => {
            console.warn(`[EmbeddingsQueue] ⚠️ Job travado: ${job.data.momentId}`)
        })

        this.queue.on("error", (error: Error) => {
            console.error("[EmbeddingsQueue] ❌ Erro na fila:", error)
        })
    }

    /**
     * Fecha fila e conexões
     */
    async close(): Promise<void> {
        await this.queue.close()
        console.log("[EmbeddingsQueue] 🔌 Fila fechada")
    }

    /**
     * Retorna instância da fila (para worker)
     */
    getQueue(): Queue<EmbeddingJobData> {
        return this.queue
    }
}
