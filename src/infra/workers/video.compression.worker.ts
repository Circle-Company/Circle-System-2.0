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
import { networkInterfaces } from "os"

export class VideoCompressionWorker {
    private videoProcessor: VideoProcessor
    private storageAdapter: LocalStorageAdapter
    private queue: VideoCompressionQueue
    private isProcessing = false
    private machineIP: string

    constructor(private momentRepository: IMomentRepository) {
        // Obter IP da máquina para detectar URLs locais
        this.machineIP = this.getMachineIP()
        this.queue = VideoCompressionQueue.getInstance()

        // Inicializar componentes com configuração de ALTA QUALIDADE para vídeos
        // CRF Scale: 0 (lossless) - 18 (very high quality) - 23 (high quality) - 28 (good) - 35 (poor) - 51 (worst)
        // Preset: veryslow = máxima qualidade possível (máxima eficiência de compressão)
        this.videoProcessor = new VideoProcessor({
            compression: {
                preset: "veryslow", // Preset mais lento possível para máxima qualidade
                crf: 34, // Alta qualidade (lossless prático)
                targetBitrate: 800, // Bitrate alto para manter qualidade
                maxBitrate: 1000, // Bitrate máximo alto para qualidade preservada
                bufferSize: 1000, // Buffer grande para evitar variações
                audioBitrate: 64, // Áudio de alta qualidade
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

        console.log(
            `[VideoCompressionWorker] 🚀 Iniciando compressão ULTRA ALTA QUALIDADE para moment ${momentId}`,
        )
        console.log("📋 Configuração:", {
            preset: this.videoProcessor.getConfig().compression?.preset,
            crf: this.videoProcessor.getConfig().compression?.crf,
            targetBitrate: this.videoProcessor.getConfig().compression?.targetBitrate,
            maxBitrate: this.videoProcessor.getConfig().compression?.maxBitrate,
            audioBitrate: this.videoProcessor.getConfig().compression?.audioBitrate,
        })

        try {
            const originalVideoData = await this.downloadVideo(originalVideoUrl)
            const compressedVideoData = await this.videoProcessor.compressVideoSlow(
                originalVideoData,
            )

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

            const moment = await this.momentRepository.findById(momentId)
            if (!moment) {
                throw new Error(`Moment ${momentId} not found`)
            }

            try {
                moment.media.url = uploadResult.url // Versão comprimida
                const previousStatus = moment.status.current
                moment.status.current = MomentStatusEnum.PUBLISHED
                moment.status.previous = previousStatus
                moment.status.reason = "Video compressed successfully"
                moment.status.changedBy = "video.compression.worker"
                moment.status.changedAt = new Date()
                moment.status.updatedAt = new Date()

                // Atualizar metadados do vídeo com informações de compressão
                if (moment.media.storage) {
                    // Usar a key real retornada pelo uploadResult
                    moment.media.storage.key = uploadResult.key
                    moment.media.storage.provider = uploadResult.provider as any
                    moment.media.storage.bucket = uploadResult.bucket || moment.media.storage.bucket
                    moment.media.storage.region = uploadResult.region || moment.media.storage.region

                    console.log(`[VideoCompressionWorker] ✅ Storage metadata atualizado`)
                } else console.log(`[VideoCompressionWorker] ⚠️ Moment não possui storage metadata`)

                const updatedMoment = await this.momentRepository.update(moment)

                if (!updatedMoment) throw new Error("Failed to update moment in repository")

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
                    preset: "veryslow", // Preset mais lento para máxima qualidade
                    crf: 18, // Lossless prático - máxima qualidade possível
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
            // Converter URL com IP da máquina para localhost se necessário
            const localUrl = this.convertToLocalhostIfNeeded(url)
            
            // Se for URL local (localhost ou IP da máquina)
            if (
                localUrl &&
                (localUrl.includes("localhost") ||
                    localUrl.startsWith("/uploads/") ||
                    localUrl.startsWith("/storage/"))
            ) {
                const fs = await import("fs")
                const path = await import("path")

                // Extrair path do arquivo mantendo o diretório
                let filePath: string
                if (localUrl.includes("localhost")) {
                    // Exemplo: http://localhost:3000/storage/videos/video_123.mp4
                    if (localUrl.includes("/storage/videos/")) {
                        filePath = "videos/" + localUrl.split("/storage/videos/")[1]
                    } else if (localUrl.includes("/storage/thumbnails/")) {
                        filePath = "thumbnails/" + localUrl.split("/storage/thumbnails/")[1]
                    } else if (localUrl.includes("/uploads/")) {
                        filePath = localUrl.split("/uploads/")[1]
                    } else {
                        throw new Error(`Cannot extract file path from URL: ${localUrl}`)
                    }
                } else {
                    // Exemplo: /storage/videos/video_123.mp4 ou /uploads/videos/video_123.mp4
                    filePath = localUrl.replace("/storage/", "").replace("/uploads/", "")
                }

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

    /**
     * Obtém o IP da máquina
     */
    private getMachineIP(): string {
        const interfaces = networkInterfaces()
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name] || []) {
                // Ignorar endereços internos e IPv6
                if (iface.family === "IPv4" && !iface.internal) {
                    return iface.address
                }
            }
        }
        return "localhost"
    }

    /**
     * Converte URL com IP da máquina para localhost se necessário
     */
    private convertToLocalhostIfNeeded(url: string): string {
        if (!url) return url
        
        // Se a URL contém o IP da máquina, substituir por localhost
        if (url.includes(this.machineIP)) {
            return url.replace(this.machineIP, "localhost")
        }
        
        return url
    }
}
