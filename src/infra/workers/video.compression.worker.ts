/**
 * Video Compression Worker
 * Worker para processar jobs de compressão de vídeo em background
 */

import {
    VideoCompressionJobData,
    VideoCompressionJobResult,
} from "./types/video.compression.job.types"

import { LocalStorageAdapter } from "@/core/content.processor/local.storage.adapter"
import { VideoProcessor } from "@/core/content.processor/video.processor"
import { MomentStatusEnum } from "@/domain/moment"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { VideoCompressionQueue } from "@/infra/queue/video.compression.queue"
import { logger } from "@/shared"
import axios from "axios"
import { Job } from "bull"

export class VideoCompressionWorker {
    private videoProcessor: VideoProcessor
    private storageAdapter: LocalStorageAdapter
    private queue: VideoCompressionQueue
    private isProcessing = false

    constructor(private momentRepository: IMomentRepository) {
        this.queue = VideoCompressionQueue.getInstance()

        // Inicializar componentes com configuração de ALTA QUALIDADE para vídeos
        // CRF Scale: 0 (lossless) - 23 (high quality) - 28 (good) - 35 (poor) - 51 (worst)
        this.videoProcessor = new VideoProcessor({
            compression: {
                preset: "slow", // Preset lento para máxima eficiência de compressão
                crf: 18, // Alta qualidade com compressão moderada
                targetBitrate: 300, // Bitrate otimizado para alta qualidade
                maxBitrate: 500, // Bitrate máximo moderado
                bufferSize: 600, // Buffer moderado
                audioBitrate: 128, // Áudio de boa qualidade
            },
        })
        this.storageAdapter = new LocalStorageAdapter(
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

        console.log(`[VideoCompressionWorker] 🚀 Iniciando compressão para moment ${momentId}`)
        console.log(`[VideoCompressionWorker] 📊 Dados do job:`, {
            momentId,
            originalVideoUrl,
            videoMetadata: {
                width: videoMetadata.width,
                height: videoMetadata.height,
                duration: videoMetadata.duration,
            },
        })

        try {
            // 1. Baixar vídeo original do storage
            console.log(`[VideoCompressionWorker] 📥 Baixando vídeo original...`)
            const originalVideoData = await this.downloadVideo(originalVideoUrl)
            console.log(
                `[VideoCompressionWorker] ✅ Vídeo baixado: ${(
                    originalVideoData.length /
                    1024 /
                    1024
                ).toFixed(2)}MB`,
            )

            // 2. Comprimir vídeo usando H.264 slow preset
            console.log(`[VideoCompressionWorker] 🗜️ Comprimindo vídeo...`)
            const compressedVideoData = await this.videoProcessor.compressVideoSlow(
                originalVideoData,
            )
            console.log(
                `[VideoCompressionWorker] ✅ Vídeo comprimido: ${(
                    compressedVideoData.length /
                    1024 /
                    1024
                ).toFixed(2)}MB`,
            )

            // 3. Fazer upload do vídeo comprimido
            console.log(`[VideoCompressionWorker] ☁️ Fazendo upload do vídeo comprimido...`)
            const uploadResult = await this.storageAdapter.uploadVideo(
                `${momentId}_compressed`, // key sem extensão
                compressedVideoData,
                {
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

            console.log(`[VideoCompressionWorker] ✅ Upload concluído: ${uploadResult.url}`)
            console.log(`[VideoCompressionWorker] 📋 Upload result details:`, {
                success: uploadResult.success,
                url: uploadResult.url,
                key: uploadResult.key,
                provider: uploadResult.provider,
                bucket: uploadResult.bucket,
                region: uploadResult.region,
            })

            // 4. Buscar moment e atualizar URL do vídeo
            console.log(`[VideoCompressionWorker] 🔍 Buscando moment ${momentId} no repositório...`)
            const moment = await this.momentRepository.findById(momentId)
            if (!moment) {
                throw new Error(`Moment ${momentId} not found`)
            }
            console.log(`[VideoCompressionWorker] ✅ Moment encontrado no repositório`)

            console.log(`[VideoCompressionWorker] 📋 Moment encontrado:`, {
                id: moment.id,
                currentStatus: moment.status.current,
                currentVideoUrl: moment.media.url,
            })

            try {
                // Atualizar media.url para apontar para o vídeo comprimido
                console.log(`[VideoCompressionWorker] 🔄 Atualizando URL do vídeo...`)
                moment.media.url = uploadResult.url // Versão comprimida

                // Atualizar status para PUBLISHED
                console.log(`[VideoCompressionWorker] 🔄 Atualizando status para PUBLISHED...`)
                const previousStatus = moment.status.current
                moment.status.current = MomentStatusEnum.PUBLISHED
                moment.status.previous = previousStatus
                moment.status.reason = "Video compressed successfully"
                moment.status.changedBy = "video.compression.worker"
                moment.status.changedAt = new Date()
                moment.status.updatedAt = new Date()

                // Atualizar metadados do vídeo com informações de compressão
                if (moment.media.storage) {
                    console.log(`[VideoCompressionWorker] 🔄 Atualizando storage metadata:`, {
                        oldKey: moment.media.storage.key,
                        newKey: uploadResult.key,
                        oldProvider: moment.media.storage.provider,
                        newProvider: uploadResult.provider,
                    })

                    // Usar a key real retornada pelo uploadResult
                    moment.media.storage.key = uploadResult.key
                    moment.media.storage.provider = uploadResult.provider as any
                    moment.media.storage.bucket = uploadResult.bucket || moment.media.storage.bucket
                    moment.media.storage.region = uploadResult.region || moment.media.storage.region

                    console.log(`[VideoCompressionWorker] ✅ Storage metadata atualizado`)
                } else {
                    console.log(`[VideoCompressionWorker] ⚠️ Moment não possui storage metadata`)
                }

                console.log(`[VideoCompressionWorker] 🔄 Atualizando moment:`, {
                    newVideoUrl: moment.media.url,
                    newStatus: moment.status.current,
                    storageKey: moment.media.storage?.key,
                })

                // 5. Salvar moment atualizado
                console.log(`[VideoCompressionWorker] 💾 Salvando moment no repositório...`)

                // Log detalhado antes da atualização
                console.log(`[VideoCompressionWorker] 📋 Estado do moment antes de salvar:`, {
                    id: moment.id,
                    statusCurrent: moment.status.current,
                    statusPrevious: moment.status.previous,
                    statusReason: moment.status.reason,
                    mediaUrl: moment.media.url,
                    storageKey: moment.media.storage?.key,
                })

                const updatedMoment = await this.momentRepository.update(moment)

                if (!updatedMoment) {
                    throw new Error("Failed to update moment in repository")
                }

                // Log detalhado após a atualização
                console.log(`[VideoCompressionWorker] 📋 Estado do moment após salvar:`, {
                    id: updatedMoment.id,
                    statusCurrent: updatedMoment.status.current,
                    statusPrevious: updatedMoment.status.previous,
                    statusReason: updatedMoment.status.reason,
                    mediaUrl: updatedMoment.media.url,
                    storageKey: updatedMoment.media.storage?.key,
                })

                console.log(`[VideoCompressionWorker] ✅ Moment atualizado com sucesso:`, {
                    id: updatedMoment.id,
                    status: updatedMoment.status.current,
                    videoUrl: updatedMoment.media.url,
                })
            } catch (updateError) {
                console.error(`[VideoCompressionWorker] ❌ Erro ao atualizar moment:`, updateError)
                throw new Error(
                    `Failed to update moment: ${
                        updateError instanceof Error ? updateError.message : String(updateError)
                    }`,
                )
            }

            // 6. Deletar vídeo original do storage
            await this.deleteOriginalVideo(originalVideoUrl)

            const processingTime = Date.now() - startTime
            const originalSize = originalVideoData.length
            const compressedSize = compressedVideoData.length
            const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

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
                    crf: 23, // Alta qualidade com compressão moderada
                },
            }
        } catch (error) {
            const processingTime = Date.now() - startTime

            logger.error(`[VideoCompressionWorker] ❌ Erro na compressão ${momentId}:`, error)

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
