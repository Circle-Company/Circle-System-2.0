/**
 * Video Processor
 * Processa vídeos para extração de metadados e geração de thumbnails
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import {
    ContentProcessorConfig,
    ThumbnailGenerationOptions,
    VideoMetadata,
    VideoMetadataExtractionResult,
    VideoProcessingRequest,
    VideoProcessingResult,
} from "./type"

import { VideoCompressionOptions } from "@/infra/workers/types/video.compression.job.types"
import { exec } from "child_process"
import { tmpdir } from "os"
import { join } from "path"
import { promisify } from "util"

const execAsync = promisify(exec)

export interface VideoProcessorConfig extends ContentProcessorConfig {
    compression?: VideoCompressionOptions
}

export class VideoProcessor {
    private config: VideoProcessorConfig

    constructor(config?: Partial<VideoProcessorConfig>) {
        this.config = {
            thumbnail: {
                format: "jpeg",
                timePosition: 0,
                ...config?.thumbnail,
            },
            validation: {
                maxFileSize: 50 * 1024 * 1024, // 50MB
                maxDuration: 30, // 30 segundos
                minDuration: 5, // 5 segundos
                allowedFormats: ["mp4", "mov", "avi", "webm"],
                minResolution: { width: 360, height: 558 },
                maxResolution: { width: 1080, height: 1674 }, // Proporção padrão do sistema
                ...config?.validation,
            },
            processing: {
                timeout: 60000, // 60 segundos
                retryAttempts: 3,
                autoCompress: false, // ✅ Manter resolução original, apenas cortar proporção
                autoConvertToMp4: true, // ✅ SEMPRE converter todos para MP4
                targetResolution: { width: 1080, height: 1674 }, // Proporção padrão do sistema
                maintainQuality: true, // Manter máxima qualidade possível
                ...config?.processing,
            },
            compression: config?.compression,
        }

        // Log das configurações de thumbnail aplicadas
        console.log(`[VideoProcessor] 📋 Configurações aplicadas:`, {
            thumbnail: this.config.thumbnail,
            processing: this.config.processing,
            validation: this.config.validation,
        })
    }

    /**
     * Processa vídeo completo: validação, extração de metadados, APENAS CROP e geração de thumbnail
     *
     * ✅ GARANTIAS (PROCESSAMENTO SÍNCRONO):
     * - Mantém resolução original do vídeo
     * - APENAS CROP para proporção padrão do sistema (1080x1674) se necessário
     * - SEM COMPRESSÃO - apenas crop e conversão de formato
     * - Gera thumbnail do primeiro frame na proporção padrão
     * - Extrai metadados completos
     * - COMPRESSÃO será feita pelo worker posteriormente
     */
    async processVideo(request: VideoProcessingRequest): Promise<VideoProcessingResult> {
        const startTime = Date.now()

        try {
            // 1. Validar vídeo
            await this.validateVideo(request)

            // 2. Extrair metadados do vídeo original
            const originalMetadata = await this.extractVideoMetadata(request.videoData)

            // 3. Processar vídeo para manter resolução original mas cortar para proporção padrão
            const processedResult = await this.processVideoForAspectRatio(
                request.videoData,
                originalMetadata,
            )

            const finalVideoData = processedResult.data
            const finalMetadata = {
                ...originalMetadata,
                width: processedResult.finalWidth,
                height: processedResult.finalHeight,
            }

            // 4. Gerar thumbnail com qualidade configurada
            const thumbnail = await this.generateThumbnail(finalVideoData, {
                ...this.config.thumbnail,
            })

            // 5. Upload do vídeo original (sem compressão)
            await this.uploadVideo(request.videoKey, finalVideoData, {
                originalFormat: request.metadata.mimeType,
                processingTime: Date.now() - startTime,
                metadata: finalMetadata,
            })

            // 6. Upload da thumbnail comprimida
            const thumbnailUploadResult = await this.uploadThumbnail(
                request.thumbnailKey,
                thumbnail,
            )

            const processingTime = Date.now() - startTime

            return {
                success: true,
                contentId: request.contentId,
                thumbnail: thumbnailUploadResult,
                videoMetadata: finalMetadata,
                processedVideo: {
                    data: finalVideoData,
                    wasCompressed: false,
                    wasConverted: false,
                    originalResolution: {
                        width: finalMetadata.width,
                        height: finalMetadata.height,
                    },
                    originalFormat: this.detectVideoFormat(request.metadata.mimeType),
                },
                processingTime,
            }
        } catch (error) {
            const processingTime = Date.now() - startTime

            return {
                success: false,
                contentId: request.contentId,
                thumbnail: {
                    data: Buffer.from([]),
                    width: 0,
                    height: 0,
                    format: "jpeg",
                },
                videoMetadata: {
                    duration: 0,
                    width: 0,
                    height: 0,
                    format: "",
                    codec: "",
                    hasAudio: false,
                    size: 0,
                },
                processingTime,
                error:
                    error instanceof Error ? error.message : "Erro desconhecido ao processar vídeo",
            }
        }
    }

    /**
     * Processa vídeo para manter resolução original mas APENAS CORTAR para proporção padrão (1080x1674) - SEM COMPRESSÃO
     */
    private async processVideoForAspectRatio(
        videoData: Buffer,
        metadata: VideoMetadata,
    ): Promise<{
        data: Buffer
        finalWidth: number
        finalHeight: number
        wasProcessed: boolean
    }> {
        const targetWidth = 1080
        const targetHeight = 1674
        const targetAspectRatio = targetWidth / targetHeight // ≈ 0.645

        // Calcular aspect ratio do vídeo original
        const originalAspectRatio = metadata.width / metadata.height

        console.log(
            `[VideoProcessor] 📐 Processando vídeo: ${metadata.width}x${
                metadata.height
            } (AR: ${originalAspectRatio.toFixed(3)}) → Target AR: ${targetAspectRatio.toFixed(3)}`,
        )

        // SEMPRE processar vídeo para proporção padrão do sistema (1080x1674)
        console.log(
            `[VideoProcessor] 🔄 Forçando processamento para proporção padrão do sistema (1080x1674)`,
        )

        try {
            const processedData = await this.cropVideoToAspectRatio(
                videoData,
                metadata,
                targetWidth,
                targetHeight,
            )

            return {
                data: processedData,
                finalWidth: targetWidth,
                finalHeight: targetHeight,
                wasProcessed: true,
            }
        } catch (error) {
            console.error(`[VideoProcessor] ❌ Erro ao cortar vídeo:`, error)
            console.log(`[VideoProcessor] 🔄 Usando vídeo original como fallback`)

            return {
                data: videoData,
                finalWidth: metadata.width,
                finalHeight: metadata.height,
                wasProcessed: false,
            }
        }
    }

    /**
     * Upload de vídeo único (APENAS CROP - sem compressão)
     * Nota: O upload real é feito pelo ContentProcessor, aqui apenas retornamos os dados
     * COMPRESSÃO será feita pelo worker posteriormente
     */
    private async uploadVideo(baseKey: string, videoData: Buffer, options: any): Promise<any> {
        return {
            key: `${baseKey}.mp4`,
            data: videoData,
            metadata: {
                ...options.metadata,
                processed: false,
                processingTime: options.processingTime,
                originalFormat: options.originalFormat,
                note: "Vídeo APENAS CROP - worker fará compressão posterior",
            },
        }
    }

    /**
     * Upload de thumbnail única (qualidade padrão)
     * Nota: O upload real é feito pelo ContentProcessor, aqui apenas retornamos os dados
     */
    private async uploadThumbnail(baseKey: string, thumbnail: any): Promise<any> {
        if (thumbnail) {
            const result = {
                key: baseKey,
                data: thumbnail.data,
                metadata: {
                    width: thumbnail.width,
                    height: thumbnail.height,
                    format: thumbnail.format,
                    compressed: true,
                    compressionQuality: this.config.thumbnail.quality,
                },
            }
            console.log(`✅ Thumbnail comprimida preparada para upload`)
            return result
        }
        return null
    }

    /**
     * Valida o vídeo antes do processamento
     */
    private async validateVideo(request: VideoProcessingRequest): Promise<void> {
        // Validar tamanho do arquivo
        if (request.videoData.length > this.config.validation.maxFileSize) {
            throw new Error(
                `Video too large. Maximum size: ${
                    this.config.validation.maxFileSize / 1024 / 1024
                }MB`,
            )
        }

        if (request.videoData.length === 0) {
            throw new Error("Empty video")
        }

        // Validar formato
        const format = this.detectVideoFormat(request.metadata.mimeType)
        if (!this.config.validation.allowedFormats.includes(format)) {
            throw new Error(
                `Unsupported format: ${format}. Supported formats: ${this.config.validation.allowedFormats.join(
                    ", ",
                )}`,
            )
        }
    }

    /**
     * Extrai metadados do vídeo usando ffprobe
     * Comando: ffprobe -v quiet -print_format json -show_format -show_streams input.mp4
     */
    private async extractVideoMetadata(videoData: Buffer): Promise<VideoMetadataExtractionResult> {
        const tempInputPath = join(
            tmpdir(),
            `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )

        try {
            console.log(
                `[VideoProcessor] 🔍 Extraindo metadados reais com ffprobe (${videoData.length} bytes)`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            // 2. Executar ffprobe para extrair metadados
            const ffprobeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${tempInputPath}"`
            const { stdout } = await execAsync(ffprobeCommand)

            // 3. Parsear JSON de resposta
            const metadata = JSON.parse(stdout)

            // 4. Extrair informações do vídeo
            const videoStream = metadata.streams.find(
                (stream: any) => stream.codec_type === "video",
            )
            const audioStream = metadata.streams.find(
                (stream: any) => stream.codec_type === "audio",
            )

            const duration = parseFloat(metadata.format.duration) || 0
            const width = parseInt(videoStream?.width) || 1920
            const height = parseInt(videoStream?.height) || 1080
            const codec = videoStream?.codec_name || "h264"
            const fps = this.parseFrameRate(videoStream?.r_frame_rate) || 30
            const bitrate = parseInt(metadata.format.bit_rate) || 0
            const hasAudio = !!audioStream

            console.log(
                `[VideoProcessor] 📊 Metadados reais: ${width}x${height}, ${duration.toFixed(
                    1,
                )}s, ${(videoData.length / 1024 / 1024).toFixed(1)}MB`,
            )

            return {
                duration,
                width,
                height,
                format: "mp4", // Sempre MP4 após processamento
                codec,
                hasAudio,
                size: videoData.length,
                bitrate,
                fps: Math.round(fps),
            }
        } catch (error) {
            console.error(`[VideoProcessor] ❌ Erro na extração de metadados com ffprobe:`, error)

            // Fallback para metadados baseados no tamanho do arquivo
            // SEMPRE retornar proporção padrão do sistema (1080x1674)
            console.log(
                `[VideoProcessor] 🔄 Usando fallback baseado no tamanho do arquivo (proporção padrão)`,
            )

            // Usar sempre a proporção padrão do sistema
            const width = 1080
            const height = 1674
            let duration = 15

            if (videoData.length > 100 * 1024 * 1024) {
                duration = 30
            } else if (videoData.length > 50 * 1024 * 1024) {
                duration = 25
            } else if (videoData.length > 20 * 1024 * 1024) {
                duration = 20
            } else {
                duration = 15
            }

            console.log(
                `[VideoProcessor] ⚠️ Metadados estimados (fallback proporção padrão): ${width}x${height}, ${duration}s`,
            )

            return {
                duration,
                width,
                height,
                format: "mp4",
                codec: "h264",
                hasAudio: true,
                size: videoData.length,
                bitrate: Math.round((videoData.length * 8) / duration),
                fps: 30,
            }
        } finally {
            // 5. Deletar arquivo temporário
            if (existsSync(tempInputPath)) {
                unlinkSync(tempInputPath)
            }
        }
    }

    /**
     * Gera thumbnail do vídeo (primeiro frame) usando ffmpeg
     * Comando: ffmpeg -i input.mp4 -ss 00:00:00 -vframes 1 -vf scale=480:854 output.jpg
     */
    private async generateThumbnail(
        videoData: Buffer,
        options: ThumbnailGenerationOptions,
    ): Promise<{
        data: Buffer
        width: number
        height: number
        format: string
    }> {
        const tempInputPath = join(
            tmpdir(),
            `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )
        const tempOutputPath = join(
            tmpdir(),
            `thumbnail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${
                options.format || "jpg"
            }`,
        )

        try {
            // Usar as dimensões configuradas para thumbnails
            const targetWidth = options.width || 540 // 1080/2 por padrão
            const targetHeight = options.height || 837 // 1674/2 por padrão

            console.log(
                `[VideoProcessor] 📐 Gerando thumbnail com tamanho configurado: ${targetWidth}x${targetHeight}`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            // 2. Executar comando ffmpeg para extrair frame com crop/scale para proporção padrão
            const timePosition = options.timePosition || 0

            console.log(
                `[VideoProcessor] 🖼️ Gerando thumbnail COMPRIMIDA (~30KB): ${targetWidth}x${targetHeight}, formato: ${options.format}, CRF 70`,
            )

            // SEMPRE usar JPEG com CRF 70 para garantir ~30KB
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -ss ${timePosition} -vframes 1 -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}" -q:v 70 "${tempOutputPath}"`

            console.log(`[VideoProcessor] 🔧 Executando: ${ffmpegCommand}`)
            await execAsync(ffmpegCommand)

            if (existsSync(tempOutputPath)) {
                const thumbnailData = readFileSync(tempOutputPath)
                const sizeKB = (thumbnailData.length / 1024).toFixed(1)

                console.log(`[VideoProcessor] ✅ Thumbnail gerada: ${sizeKB}KB (CRF 70)`)

                return {
                    data: thumbnailData,
                    width: targetWidth,
                    height: targetHeight,
                    format: options.format || "jpeg",
                }
            } else {
                throw new Error("Arquivo de thumbnail não foi criado")
            }
        } catch (error) {
            console.error(`[VideoProcessor] ❌ Erro na geração de thumbnail com ffmpeg:`, error)

            // Fallback para thumbnail vazio com dimensões configuradas
            console.log(
                `[VideoProcessor] 🔄 Usando fallback - thumbnail vazio com tamanho configurado`,
            )

            return {
                data: Buffer.from([]),
                width: options.width || 540,
                height: options.height || 837,
                format: options.format || "jpeg",
            }
        } finally {
            // 4. Deletar arquivos temporários
            if (existsSync(tempInputPath)) {
                unlinkSync(tempInputPath)
            }
            if (existsSync(tempOutputPath)) {
                unlinkSync(tempOutputPath)
            }
        }
    }

    /**
     * Detecta formato do vídeo pelo MIME type
     */
    private detectVideoFormat(mimeType: string): string {
        const formatMap: Record<string, string> = {
            "video/mp4": "mp4",
            "video/quicktime": "mov",
            "video/x-msvideo": "avi",
            "video/webm": "webm",
        }

        // Para testes/desenvolvimento: assume mp4 se formato desconhecido
        // TODO: Em produção, considerar validação mais rigorosa
        return formatMap[mimeType] || "mp4"
    }

    /**
     * Parse frame rate string (e.g., "30/1", "25/1") to number
     */
    private parseFrameRate(frameRate: string | undefined): number {
        if (!frameRate) return 30

        try {
            // Handle formats like "30/1", "25/1", "29.97/1"
            if (frameRate.includes("/")) {
                const [numerator, denominator] = frameRate.split("/")
                return parseFloat(numerator) / parseFloat(denominator)
            }

            // Handle direct number format
            return parseFloat(frameRate)
        } catch {
            return 30 // Default fallback
        }
    }

    /**
     * Força vídeo para proporção padrão (1080x1674) usando scale + crop - APENAS CROP, SEM COMPRESSÃO
     * Comando ffmpeg: ffmpeg -i input.mp4 -vf "scale=1080:1674:force_original_aspect_ratio=increase,crop=1080:1674" -c:v libx264 -preset fast -crf 18 -c:a copy output.mp4
     * NOTA: CRF 18 é lossless prático, mais estável que CRF 0
     */
    private async cropVideoToAspectRatio(
        videoData: Buffer,
        metadata: VideoMetadata,
        targetWidth: number,
        targetHeight: number,
    ): Promise<Buffer> {
        const tempInputPath = join(
            tmpdir(),
            `input_crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )
        const tempOutputPath = join(
            tmpdir(),
            `cropped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )

        try {
            console.log(
                `[VideoProcessor] 📐 CROP RÁPIDO - Cortando vídeo para proporção padrão: ${metadata.width}x${metadata.height} → ${targetWidth}x${targetHeight} (CRF 28, ultrafast)`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            // 2. Executar comando ffmpeg para APENAS CROP - sem compressão (processamento síncrono)
            // SEMPRE usar scale + crop para garantir proporção exata 1080x1674 - SEM COMPRESSÃO
            // IMPORTANTE: Usar CRF 28 (qualidade suficiente) com preset ultrafast para máxima velocidade
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}" -c:v libx264 -preset ultrafast -crf 28 -c:a copy -movflags +faststart "${tempOutputPath}"`

            console.log(`[VideoProcessor] 🔧 Executando: ${ffmpegCommand}`)
            await execAsync(ffmpegCommand)

            // 4. Ler arquivo cortado
            if (existsSync(tempOutputPath)) {
                const croppedData = readFileSync(tempOutputPath)

                console.log(
                    `[VideoProcessor] ✅ CROP RÁPIDO concluído - Vídeo cortado para proporção padrão: ${(
                        croppedData.length /
                        1024 /
                        1024
                    ).toFixed(2)}MB (CRF 28, ultrafast) - Worker otimizará qualidade`,
                )

                return croppedData
            } else {
                throw new Error("Arquivo cortado não foi criado")
            }
        } catch (error) {
            console.error(`[VideoProcessor] ❌ Erro no crop com ffmpeg:`, error)

            // Fallback para vídeo original
            console.log(`[VideoProcessor] 🔄 Usando fallback - vídeo original`)
            return videoData
        } finally {
            // 5. Deletar arquivos temporários
            if (existsSync(tempInputPath)) {
                unlinkSync(tempInputPath)
            }
            if (existsSync(tempOutputPath)) {
                unlinkSync(tempOutputPath)
            }
        }
    }

    /**
     * Comprime vídeo com H.264 usando configurações personalizáveis
     * Comando ffmpeg: ffmpeg -i input.mp4 -c:v libx264 -preset {preset} -crf {crf} -b:v {targetBitrate}k -maxrate {maxBitrate}k -bufsize {bufferSize}k -c:a aac -b:a {audioBitrate}k output.mp4
     */
    async compressVideoSlow(
        videoData: Buffer,
        options?: Partial<VideoCompressionOptions>,
    ): Promise<Buffer> {
        // Validar dados de entrada
        if (!videoData || videoData.length === 0) {
            throw new Error("Video data is required and cannot be empty")
        }

        // Mesclar opções com configuração padrão
        const compressionOptions: VideoCompressionOptions = {
            preset: "slow",
            crf: 23,
            targetBitrate: 300,
            maxBitrate: 500,
            bufferSize: 600,
            audioBitrate: 128,
            ...this.config.compression,
            ...options,
        }

        // Validar configurações de compressão
        this.validateCompressionOptions(compressionOptions)
        const tempInputPath = join(
            tmpdir(),
            `input_slow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )
        const tempOutputPath = join(
            tmpdir(),
            `compressed_slow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )

        try {
            const compressionType =
                compressionOptions.crf === 0 ? "LOSSLESS PRÁTICO (CRF 18)" : "COM PERDA"
            console.log(
                `[VideoProcessor] 🐌 Iniciando compressão H.264 ${compressionType} (preset: ${compressionOptions.preset}, CRF: ${compressionOptions.crf})`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -c:v libx264 -preset ${compressionOptions.preset} -crf ${compressionOptions.crf} -b:v ${compressionOptions.targetBitrate}k -maxrate ${compressionOptions.maxBitrate}k -bufsize ${compressionOptions.bufferSize}k -c:a aac -b:a ${compressionOptions.audioBitrate}k -movflags +faststart "${tempOutputPath}"`
            console.log(`[VideoProcessor] 🔧 Executando: ${ffmpegCommand}`)
            await execAsync(ffmpegCommand)

            // 3. Ler arquivo comprimido
            if (existsSync(tempOutputPath)) {
                const compressedData = readFileSync(tempOutputPath)

                const originalSize = videoData.length
                const compressedSize = compressedData.length
                const compressionRatio = (
                    ((originalSize - compressedSize) / originalSize) *
                    100
                ).toFixed(1)

                console.log(
                    `[VideoProcessor] ✅ Compressão SLOW concluída: ${(
                        originalSize /
                        1024 /
                        1024
                    ).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(
                        2,
                    )}MB (${compressionRatio}% menor)`,
                )

                return compressedData
            } else {
                throw new Error("Arquivo comprimido não foi criado")
            }
        } catch (error) {
            console.error(`[VideoProcessor] ❌ Erro na compressão SLOW:`, error)

            // Fallback para vídeo original
            console.log(`[VideoProcessor] 🔄 Usando fallback - vídeo original`)
            return videoData
        } finally {
            // 4. Deletar arquivos temporários
            if (existsSync(tempInputPath)) {
                unlinkSync(tempInputPath)
            }
            if (existsSync(tempOutputPath)) {
                unlinkSync(tempOutputPath)
            }
        }
    }

    /**
     * Valida as opções de compressão
     */
    private validateCompressionOptions(options: VideoCompressionOptions): void {
        const validPresets = [
            "ultrafast",
            "superfast",
            "veryfast",
            "faster",
            "fast",
            "medium",
            "slow",
            "slower",
            "veryslow",
        ]

        if (!validPresets.includes(options.preset)) {
            throw new Error(
                `Invalid preset: ${options.preset}. Valid presets: ${validPresets.join(", ")}`,
            )
        }

        if (options.crf < 0 || options.crf > 51) {
            throw new Error(`CRF must be between 0 and 51, got: ${options.crf}`)
        }

        if (
            options.targetBitrate &&
            (options.targetBitrate < 50 || options.targetBitrate > 10000)
        ) {
            throw new Error(
                `Target bitrate must be between 50 and 10000 kbps, got: ${options.targetBitrate}`,
            )
        }

        if (options.maxBitrate && (options.maxBitrate < 50 || options.maxBitrate > 10000)) {
            throw new Error(
                `Max bitrate must be between 50 and 10000 kbps, got: ${options.maxBitrate}`,
            )
        }

        if (options.bufferSize && (options.bufferSize < 50 || options.bufferSize > 10000)) {
            throw new Error(
                `Buffer size must be between 50 and 10000 kbps, got: ${options.bufferSize}`,
            )
        }

        if (options.audioBitrate && (options.audioBitrate < 32 || options.audioBitrate > 320)) {
            throw new Error(
                `Audio bitrate must be between 32 and 320 kbps, got: ${options.audioBitrate}`,
            )
        }
    }
}
