/**
 * Embeddings Worker
 * Worker para processar jobs de embeddings em background
 */

import {
    ContentEmbeddingGenerator,
    TextEmbeddingAdapter,
    TranscriptionAdapter,
    VisualEmbeddingAdapter,
    getEmbeddingConfig,
} from "@/core/new.swipe.engine"
import { EmbeddingJobData, EmbeddingJobResult } from "./types/embedding.job.types"

import { AudioExtractor } from "@/core/content.processor/audio.extractor"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { MomentProcessingStatusEnum } from "@/domain/moment/types"
import { EmbeddingsQueue } from "@/infra/queue/embeddings.queue"
import axios from "axios"
import { Job } from "bull"

export class EmbeddingsWorker {
    private contentEmbeddingGenerator: ContentEmbeddingGenerator
    private queue: EmbeddingsQueue
    private isProcessing = false

    constructor(private momentRepository: IMomentRepository) {
        this.queue = EmbeddingsQueue.getInstance()

        // Configurar generator de embeddings
        const config = getEmbeddingConfig()
        const textService = new TextEmbeddingAdapter(config.textEmbedding)
        const visualService = new VisualEmbeddingAdapter(config.clip)
        const transcriptionService = new TranscriptionAdapter(config.whisper)
        const audioExtractor = new AudioExtractor()

        this.contentEmbeddingGenerator = new ContentEmbeddingGenerator(
            config,
            textService,
            transcriptionService,
            visualService,
            audioExtractor,
        )
    }

    /**
     * Inicia o worker
     */
    start(): void {
        if (this.isProcessing) {
            console.log("[EmbeddingsWorker] ⚠️ Worker já está rodando")
            return
        }

        console.log("[EmbeddingsWorker] 🚀 Iniciando worker de embeddings...")

        const bullQueue = this.queue.getQueue()

        // Processar jobs da fila
        bullQueue.process(async (job: Job<EmbeddingJobData>) => {
            return this.processJob(job)
        })

        this.isProcessing = true
        console.log("[EmbeddingsWorker] ✅ Worker ativo e aguardando jobs...")
    }

    /**
     * Para o worker
     */
    async stop(): Promise<void> {
        if (!this.isProcessing) {
            return
        }

        console.log("[EmbeddingsWorker] 🛑 Parando worker...")

        await this.queue.close()
        this.isProcessing = false

        console.log("[EmbeddingsWorker] ✅ Worker parado")
    }

    /**
     * Processa um job de embedding
     */
    private async processJob(job: Job<EmbeddingJobData>): Promise<EmbeddingJobResult> {
        const startTime = Date.now()
        const { momentId, videoUrl, description, hashtags, videoMetadata } = job.data

        console.log(`[EmbeddingsWorker] 🔄 Processando job: ${momentId}`)

        try {
            // 1. Atualizar status: embeddings_queued → processing
            await this.updateMomentStatus(momentId, "processing" as MomentProcessingStatusEnum)

            // 2. Baixar vídeo do storage
            console.log(`[EmbeddingsWorker] 📥 Baixando vídeo: ${videoUrl}`)
            const videoData = await this.downloadVideo(videoUrl)

            // 3. Gerar embeddings usando NEW Swipe Engine
            console.log(`[EmbeddingsWorker] 🧠 Gerando embeddings...`)
            const embedding = await this.contentEmbeddingGenerator.generate({
                videoData,
                description,
                hashtags,
                videoMetadata,
            })

            // 4. Buscar moment e atualizar embedding
            const moment = await this.momentRepository.findById(momentId)

            if (!moment) {
                throw new Error(`Moment ${momentId} not found`)
            }

            moment.updateEmbedding(
                JSON.stringify(embedding.vector),
                embedding.dimension,
                embedding.metadata,
            )

            moment.updateProcessingStatus(MomentProcessingStatusEnum.EMBEDDINGS_PROCESSED, 100)

            // 6. Salvar moment com embedding
            await this.momentRepository.update(moment)

            const processingTime = Date.now() - startTime

            console.log(
                `[EmbeddingsWorker] ✅ Job concluído: ${momentId} (${processingTime}ms, dim=${embedding.dimension})`,
            )

            return {
                success: true,
                momentId,
                embeddingDimension: embedding.dimension,
                processingTime,
                metadata: {
                    components: Object.keys(embedding.metadata.components),
                    model: embedding.metadata.model,
                },
            }
        } catch (error) {
            const processingTime = Date.now() - startTime

            console.error(`[EmbeddingsWorker] ❌ Erro no job ${momentId}:`, error)

            // Marcar como failed
            await this.updateMomentStatus(momentId, "failed" as MomentProcessingStatusEnum)

            return {
                success: false,
                momentId,
                processingTime,
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }

    /**
     * Baixa vídeo do storage
     */
    private async downloadVideo(url: string): Promise<Buffer> {
        try {
            // Se for URL local (localhost)
            if (url.includes("localhost") || url.startsWith("/uploads/")) {
                const fs = await import("fs")
                const path = await import("path")

                // Extrair path do arquivo
                const filePath = url.includes("localhost")
                    ? url.split("/uploads/")[1]
                    : url.replace("/uploads/", "")

                const fullPath = path.join(process.cwd(), "uploads", filePath)

                return fs.readFileSync(fullPath)
            }

            // URL externa (S3, CDN, etc)
            const response = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 60000, // 60s
            })

            return Buffer.from(response.data)
        } catch (error) {
            console.error(`[EmbeddingsWorker] ❌ Erro ao baixar vídeo: ${url}`, error)
            throw new Error(`Failed to download video: ${error}`)
        }
    }

    /**
     * Atualiza status de processamento do moment
     */
    private async updateMomentStatus(
        momentId: string,
        status: MomentProcessingStatusEnum,
    ): Promise<void> {
        try {
            const moment = await this.momentRepository.findById(momentId)

            if (moment) {
                moment.processing.status = status
                if (status === MomentProcessingStatusEnum.EMBEDDINGS_PROCESSED) {
                    moment.processing.completedAt = new Date()
                }

                await this.momentRepository.update(moment)
            }
        } catch (error) {
            console.error(`[EmbeddingsWorker] ⚠️ Erro ao atualizar status:`, error)
        }
    }

    /**
     * Verifica se worker está ativo
     */
    isActive(): boolean {
        return this.isProcessing
    }
}
