/**
 * Video Compression Worker
 * Worker para processar jobs de compressão de vídeo em background
 */

import {
    VideoCompressionJobData,
    VideoCompressionJobResult,
} from "./types/video.compression.job.types"

import { RealLocalStorageAdapter } from "@/core/content.processor/local.storage.adapter"
import { VideoProcessor } from "@/core/content.processor/video.processor"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { VideoCompressionQueue } from "@/infra/queue/video.compression.queue"
import axios from "axios"
import { Job } from "bull"

export class VideoCompressionWorker {
    private videoProcessor: VideoProcessor
    private storageAdapter: RealLocalStorageAdapter
    private queue: VideoCompressionQueue
    private isProcessing = false

    constructor(private momentRepository: IMomentRepository) {
        this.queue = VideoCompressionQueue.getInstance()

        // Inicializar componentes
        this.videoProcessor = new VideoProcessor()
        this.storageAdapter = new RealLocalStorageAdapter(
            "./uploads",
            process.env.STORAGE_BASE_URL || "http://localhost:3000",
        )
    }

    /**
     * Inicia o worker
     */
    start(): void {
        if (this.isProcessing) {
            console.log("[VideoCompressionWorker] ⚠️ Worker já está rodando")
            return
        }

        console.log("[VideoCompressionWorker] 🚀 Iniciando worker de compressão de vídeo...")

        const bullQueue = this.queue.getQueue()

        // Processar jobs da fila
        bullQueue.process(async (job: Job<VideoCompressionJobData>) => {
            return this.processJob(job)
        })

        this.isProcessing = true
        console.log("[VideoCompressionWorker] ✅ Worker ativo e aguardando jobs de compressão...")
    }

    /**
     * Para o worker
     */
    async stop(): Promise<void> {
        if (!this.isProcessing) {
            return
        }

        console.log("[VideoCompressionWorker] 🛑 Parando worker...")

        await this.queue.close()
        this.isProcessing = false

        console.log("[VideoCompressionWorker] ✅ Worker parado")
    }

    /**
     * Processa um job de compressão de vídeo
     */
    private async processJob(
        job: Job<VideoCompressionJobData>,
    ): Promise<VideoCompressionJobResult> {
        const startTime = Date.now()
        const { momentId, originalVideoUrl, videoMetadata } = job.data

        console.log(`[VideoCompressionWorker] 🔄 Processando compressão: ${momentId}`)

        try {
            // 1. Baixar vídeo original do storage
            console.log(`[VideoCompressionWorker] 📥 Baixando vídeo original: ${originalVideoUrl}`)
            const originalVideoData = await this.downloadVideo(originalVideoUrl)

            // 2. Comprimir vídeo usando H.264 slow preset
            console.log(`[VideoCompressionWorker] 🐌 Comprimindo vídeo com H.264 slow...`)
            const compressedVideoData = await this.videoProcessor.compressVideoSlow(
                originalVideoData,
            )

            // 3. Fazer upload do vídeo comprimido
            console.log(`[VideoCompressionWorker] 📤 Fazendo upload do vídeo comprimido...`)
            const uploadResult = await this.storageAdapter.uploadVideo(
                `${momentId}.mp4`, // key simples
                compressedVideoData,
                {
                    filename: `${momentId}_compressed.mp4`,
                    mimeType: "video/mp4",
                    metadata: {
                        ownerId: momentId,
                        contentId: momentId,
                        duration: videoMetadata.duration,
                        compressed: true,
                        originalSize: originalVideoData.length,
                        compressedSize: compressedVideoData.length,
                    },
                },
            )

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || "Failed to upload compressed video")
            }

            // 4. Buscar moment e atualizar URL do vídeo
            const moment = await this.momentRepository.findById(momentId)
            if (!moment) {
                throw new Error(`Moment ${momentId} not found`)
            }

            // Atualizar media.url para apontar para o vídeo comprimido usando media.url
            moment.media.url = uploadResult.url // Versão comprimida
            // remove low medium e high

            // Atualizar metadados do vídeo com informações de compressão
            if (moment.media.storage) {
                moment.media.storage.key = `videos/compressed/${momentId}.mp4`
                moment.media.storage.provider = uploadResult.provider as any
            }

            // 5. Salvar moment atualizado
            await this.momentRepository.update(moment)

            // 6. Deletar vídeo original do storage
            console.log(`[VideoCompressionWorker] 🗑️ Deletando vídeo original...`)
            await this.deleteOriginalVideo(originalVideoUrl)

            const processingTime = Date.now() - startTime
            const originalSize = originalVideoData.length
            const compressedSize = compressedVideoData.length
            const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

            console.log(
                `[VideoCompressionWorker] ✅ Compressão concluída: ${momentId} (${processingTime}ms, ${compressionRatio.toFixed(
                    1,
                )}% menor)`,
            )

            return {
                success: true,
                momentId,
                compressedVideoUrl: uploadResult.url,
                originalSize,
                compressedSize,
                compressionRatio,
                processingTime,
                metadata: {
                    originalCodec: "unknown",
                    compressedCodec: "h264",
                    preset: "slow",
                    crf: 28,
                },
            }
        } catch (error) {
            const processingTime = Date.now() - startTime

            console.error(`[VideoCompressionWorker] ❌ Erro na compressão ${momentId}:`, error)

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
            if (url && (url.includes("localhost") || url.startsWith("/uploads/"))) {
                const fs = await import("fs")
                const path = await import("path")

                // Extrair path do arquivo
                const filePath = url.includes("localhost")
                    ? url.split("/uploads/")[1]
                    : url.replace("/uploads/", "")

                const fullPath = path.join(process.cwd(), "uploads", filePath)

                // Verificar se arquivo existe
                if (fs.existsSync(fullPath)) {
                    return fs.readFileSync(fullPath)
                } else {
                    console.warn(`[VideoCompressionWorker] ⚠️ Arquivo não encontrado: ${fullPath}`)
                    throw new Error(`Video file not found: ${fullPath}`)
                }
            }

            // URL externa (S3, CDN, etc)
            if (url && url.startsWith("http")) {
                const response = await axios.get(url, {
                    responseType: "arraybuffer",
                    timeout: 60000, // 60s
                })

                return Buffer.from(response.data)
            }

            // URL inválida ou vazia
            throw new Error(`Invalid or empty video URL: ${url}`)
        } catch (error) {
            console.error(`[VideoCompressionWorker] ❌ Erro ao baixar vídeo: ${url}`, error)
            throw new Error(`Failed to download video: ${error}`)
        }
    }

    /**
     * Deleta vídeo original do storage
     */
    private async deleteOriginalVideo(originalUrl: string): Promise<void> {
        try {
            // Extrair key do storage a partir da URL
            const key = this.extractKeyFromUrl(originalUrl)

            if (key) {
                // Usar storage adapter para deletar
                await this.storageAdapter.deleteVideo(key)
                console.log(`[VideoCompressionWorker] ✅ Vídeo original deletado: ${key}`)
            } else {
                console.warn(
                    `[VideoCompressionWorker] ⚠️ Não foi possível extrair key da URL: ${originalUrl}`,
                )
            }
        } catch (error) {
            console.error(`[VideoCompressionWorker] ⚠️ Erro ao deletar vídeo original:`, error)
            // Não falhar o job por causa disso
        }
    }

    /**
     * Extrai key do storage a partir da URL
     */
    private extractKeyFromUrl(url: string): string | null {
        try {
            if (!url) return null

            // Para URLs locais, extrair path após /uploads/
            if (url.includes("/uploads/")) {
                return url.split("/uploads/")[1]
            }

            // Para URLs externas, tentar extrair key do path
            if (url.startsWith("http")) {
                const urlObj = new URL(url)
                return urlObj.pathname.substring(1) // Remove leading slash
            }

            // Se não for URL válida, retornar null
            return null
        } catch {
            return null
        }
    }

    /**
     * Verifica se worker está ativo
     */
    isActive(): boolean {
        return this.isProcessing
    }
}
