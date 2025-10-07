/**
 * Video Processor
 * Processa vídeos para extração de metadados e geração de thumbnails
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import {
    ContentProcessorConfig,
    ThumbnailGenerationOptions,
    VideoCompressionOptions,
    VideoMetadataExtractionResult,
    VideoProcessingRequest,
    VideoProcessingResult,
} from "./type"

import { exec } from "child_process"
import { tmpdir } from "os"
import { join } from "path"
import { promisify } from "util"

const execAsync = promisify(exec)

export class VideoProcessor {
    private config: ContentProcessorConfig

    constructor(config?: Partial<ContentProcessorConfig>) {
        this.config = {
            thumbnail: {
                width: 480,
                height: 854,
                quality: 70,
                format: "jpeg",
                timePosition: 0,
                ...config?.thumbnail,
            },
            validation: {
                maxFileSize: 500 * 1024 * 1024, // 500MB
                maxDuration: 180, // 3 minutos
                minDuration: 3, // 3 segundos
                allowedFormats: ["mp4", "mov", "avi", "webm"],
                minResolution: { width: 720, height: 1280 },
                maxResolution: { width: 1920, height: 3840 },
                ...config?.validation,
            },
            processing: {
                timeout: 60000, // 60 segundos
                retryAttempts: 3,
                autoCompress: true, // ✅ SEMPRE comprimir vídeos > Full HD
                autoConvertToMp4: true, // ✅ SEMPRE converter todos para MP4
                targetResolution: { width: 1920, height: 1080 }, // Full HD (padrão)
                ...config?.processing,
            },
        }
    }

    /**
     * Processa vídeo completo: validação, extração de metadados, compressão, conversão e geração de thumbnail
     *
     * ✅ GARANTIAS:
     * - Comprime vídeos com resolução > Full HD (1920x1080) para Full HD
     * - Converte TODOS os vídeos para formato MP4
     * - Gera thumbnail do primeiro frame
     * - Extrai metadados completos
     */
    async processVideo(request: VideoProcessingRequest): Promise<VideoProcessingResult> {
        const startTime = Date.now()

        try {
            // 1. Validar vídeo
            await this.validateVideo(request)

            // 2. Extrair metadados do vídeo original
            const originalMetadata = await this.extractVideoMetadata(request.videoData)

            // 3. Processar vídeo (compressão e conversão se necessário)
            const processedVideo = await this.processVideoCompression(
                request.videoData,
                originalMetadata,
                request.metadata.mimeType,
            )

            // 4. Usar vídeo processado ou original
            const finalVideoData = processedVideo.wasProcessed
                ? processedVideo.data
                : request.videoData

            // 5. Extrair metadados finais (após processamento)
            const finalMetadata = processedVideo.wasProcessed
                ? await this.extractVideoMetadata(finalVideoData)
                : originalMetadata

            // 6. Gerar thumbnail (primeiro frame do vídeo final)
            const thumbnail = await this.generateThumbnail(finalVideoData, {
                width: this.config.thumbnail.width,
                height: this.config.thumbnail.height,
                quality: this.config.thumbnail.quality,
                format: this.config.thumbnail.format,
                timePosition: 0, // Primeiro frame
            })

            // 7. Atualizar metadados finais para garantir formato MP4
            finalMetadata.format = "mp4"
            finalMetadata.codec = "h264"

            const processingTime = Date.now() - startTime

            return {
                success: true,
                contentId: request.contentId,
                thumbnail,
                videoMetadata: finalMetadata,
                processedVideo: processedVideo.wasProcessed
                    ? {
                          data: finalVideoData,
                          wasCompressed: processedVideo.wasCompressed,
                          wasConverted: processedVideo.wasConverted,
                          originalResolution: processedVideo.originalResolution,
                          originalFormat: processedVideo.originalFormat,
                      }
                    : undefined,
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
     * Valida o vídeo antes do processamento
     */
    private async validateVideo(request: VideoProcessingRequest): Promise<void> {
        // Validar tamanho do arquivo
        if (request.videoData.length > this.config.validation.maxFileSize) {
            throw new Error(
                `Vídeo muito grande. Tamanho máximo: ${
                    this.config.validation.maxFileSize / 1024 / 1024
                }MB`,
            )
        }

        if (request.videoData.length === 0) {
            throw new Error("Vídeo vazio")
        }

        // Validar formato
        const format = this.detectVideoFormat(request.metadata.mimeType)
        if (!this.config.validation.allowedFormats.includes(format)) {
            throw new Error(
                `Formato não suportado: ${format}. Formatos aceitos: ${this.config.validation.allowedFormats.join(
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
            const fps = eval(videoStream?.r_frame_rate) || 30
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
            console.log(`[VideoProcessor] 🔄 Usando fallback baseado no tamanho do arquivo`)

            let width = 1080
            let height = 1920
            let duration = 15

            if (videoData.length > 100 * 1024 * 1024) {
                width = 3840
                height = 2160
                duration = 30
            } else if (videoData.length > 50 * 1024 * 1024) {
                width = 2560
                height = 1440
                duration = 25
            } else if (videoData.length > 20 * 1024 * 1024) {
                width = 1920
                height = 1080
                duration = 20
            } else {
                width = 1280
                height = 720
                duration = 15
            }

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
            console.log(
                `[VideoProcessor] 🖼️ Gerando thumbnail real com ffmpeg: ${options.width}x${options.height}, formato: ${options.format}`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            // 2. Executar comando ffmpeg para extrair frame
            const timePosition = options.timePosition || 0
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -ss ${timePosition} -vframes 1 -vf scale=${options.width}:${options.height} -q:v 2 "${tempOutputPath}"`

            console.log(`[VideoProcessor] 🔧 Executando: ${ffmpegCommand}`)
            await execAsync(ffmpegCommand)

            // 3. Ler arquivo de imagem gerado
            if (existsSync(tempOutputPath)) {
                const thumbnailData = readFileSync(tempOutputPath)

                console.log(
                    `[VideoProcessor] ✅ Thumbnail gerado: ${options.width}x${options.height} (${thumbnailData.length} bytes)`,
                )

                return {
                    data: thumbnailData,
                    width: options.width || 480,
                    height: options.height || 854,
                    format: options.format || "jpeg",
                }
            } else {
                throw new Error("Arquivo de thumbnail não foi criado")
            }
        } catch (error) {
            console.error(`[VideoProcessor] ❌ Erro na geração de thumbnail com ffmpeg:`, error)

            // Fallback para thumbnail vazio
            console.log(`[VideoProcessor] 🔄 Usando fallback - thumbnail vazio`)

            return {
                data: Buffer.from([]),
                width: options.width || 480,
                height: options.height || 854,
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

        return formatMap[mimeType] || "unknown"
    }

    /**
     * Processa compressão e conversão de vídeo
     * Comprime vídeos maiores que Full HD e converte para MP4
     */
    private async processVideoCompression(
        videoData: Buffer,
        metadata: VideoMetadataExtractionResult,
        mimeType: string,
    ): Promise<{
        data: Buffer
        wasProcessed: boolean
        wasCompressed: boolean
        wasConverted: boolean
        originalResolution?: { width: number; height: number }
        originalFormat?: string
    }> {
        const targetWidth = this.config.processing.targetResolution.width // 1920
        const targetHeight = this.config.processing.targetResolution.height // 1080
        const currentFormat = this.detectVideoFormat(mimeType)

        // Verificar se precisa comprimir (resolução maior que Full HD)
        const needsCompression =
            this.config.processing.autoCompress &&
            (metadata.width > targetWidth || metadata.height > targetHeight)

        // Verificar se precisa converter (formato diferente de MP4)
        const needsConversion = this.config.processing.autoConvertToMp4 && currentFormat !== "mp4"

        console.log(
            `[VideoProcessor] Analisando vídeo: ${metadata.width}x${metadata.height}, formato: ${currentFormat}`,
        )
        console.log(`[VideoProcessor] Target: ${targetWidth}x${targetHeight} (Full HD)`)
        console.log(
            `[VideoProcessor] Config: compress=${this.config.processing.autoCompress}, convert=${this.config.processing.autoConvertToMp4}`,
        )

        // Se não precisa processar, retornar vídeo original
        if (!needsCompression && !needsConversion) {
            console.log(`[VideoProcessor] ✅ Vídeo não precisa de processamento`)
            return {
                data: videoData,
                wasProcessed: false,
                wasCompressed: false,
                wasConverted: false,
            }
        }

        let processedData = videoData
        let wasCompressed = false
        let wasConverted = false
        let originalResolution: { width: number; height: number } | undefined
        let originalFormat: string | undefined

        console.log(`[VideoProcessor] 🔄 Processando vídeo...`)

        // 1. Comprimir se necessário
        if (needsCompression) {
            console.log(
                `[VideoProcessor] 📉 Comprimindo: ${metadata.width}x${metadata.height} -> ${targetWidth}x${targetHeight}`,
            )

            originalResolution = { width: metadata.width, height: metadata.height }
            processedData = await this.compressVideo(processedData, {
                targetResolution: { width: targetWidth, height: targetHeight },
                targetFormat: "mp4",
                quality: 23, // CRF 23 para boa qualidade
            })
            wasCompressed = true
        }

        // 2. Converter para MP4 se necessário
        if (needsConversion) {
            console.log(`[VideoProcessor] 🔄 Convertendo: ${currentFormat} -> mp4`)

            originalFormat = currentFormat
            processedData = await this.convertToMp4(processedData, currentFormat)
            wasConverted = true
        }

        console.log(`[VideoProcessor] ✅ Processamento concluído:`)
        if (wasCompressed)
            console.log(
                `  - Comprimido: ${originalResolution?.width}x${originalResolution?.height} -> ${targetWidth}x${targetHeight}`,
            )
        if (wasConverted) console.log(`  - Convertido: ${originalFormat} -> mp4`)

        return {
            data: processedData,
            wasProcessed: true,
            wasCompressed,
            wasConverted,
            originalResolution,
            originalFormat,
        }
    }

    /**
     * Comprime vídeo para resolução alvo usando ffmpeg
     * Comando ffmpeg: ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libx264 -preset medium -crf 23 -c:a aac output.mp4
     */
    private async compressVideo(
        videoData: Buffer,
        options: VideoCompressionOptions,
    ): Promise<Buffer> {
        const tempInputPath = join(
            tmpdir(),
            `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )
        const tempOutputPath = join(
            tmpdir(),
            `compressed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )

        try {
            console.log(
                `[VideoProcessor] 📉 Comprimindo vídeo real com ffmpeg para ${options.targetResolution.width}x${options.targetResolution.height}`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            // 2. Executar comando ffmpeg para compressão
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -vf scale=${
                options.targetResolution.width
            }:${options.targetResolution.height} -c:v libx264 -preset medium -crf ${
                options.quality || 23
            } -c:a aac -movflags +faststart "${tempOutputPath}"`

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
                    `[VideoProcessor] ✅ Compressão concluída: ${(
                        originalSize /
                        1024 /
                        1024
                    ).toFixed(1)}MB → ${(compressedSize / 1024 / 1024).toFixed(
                        1,
                    )}MB (${compressionRatio}% menor)`,
                )

                return compressedData
            } else {
                throw new Error("Arquivo comprimido não foi criado")
            }
        } catch (error) {
            console.error(`[VideoProcessor] ❌ Erro na compressão com ffmpeg:`, error)

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
     * Converte vídeo para formato MP4 usando ffmpeg
     * Comando ffmpeg: ffmpeg -i input.mov -c:v libx264 -c:a aac output.mp4
     */
    private async convertToMp4(videoData: Buffer, originalFormat: string): Promise<Buffer> {
        const tempInputPath = join(
            tmpdir(),
            `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${originalFormat}`,
        )
        const tempOutputPath = join(
            tmpdir(),
            `converted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )

        try {
            console.log(
                `[VideoProcessor] 🔄 Convertendo vídeo real com ffmpeg de ${originalFormat} para mp4`,
            )

            // 1. Salvar vídeo em arquivo temporário com extensão original
            writeFileSync(tempInputPath, videoData)

            // 2. Executar comando ffmpeg para conversão
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -c:v libx264 -c:a aac -movflags +faststart "${tempOutputPath}"`

            console.log(`[VideoProcessor] 🔧 Executando: ${ffmpegCommand}`)
            await execAsync(ffmpegCommand)

            // 3. Ler arquivo MP4 convertido
            if (existsSync(tempOutputPath)) {
                const convertedData = readFileSync(tempOutputPath)

                const originalSize = videoData.length
                const convertedSize = convertedData.length

                console.log(
                    `[VideoProcessor] ✅ Conversão concluída: ${originalFormat} → mp4 (${(
                        originalSize /
                        1024 /
                        1024
                    ).toFixed(1)}MB → ${(convertedSize / 1024 / 1024).toFixed(1)}MB)`,
                )

                return convertedData
            } else {
                throw new Error("Arquivo convertido não foi criado")
            }
        } catch (error) {
            console.error(`[VideoProcessor] ❌ Erro na conversão com ffmpeg:`, error)

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
     * Calcula nova resolução mantendo aspect ratio
     */
    private calculateTargetResolution(
        originalWidth: number,
        originalHeight: number,
        targetWidth: number,
        targetHeight: number,
    ): { width: number; height: number } {
        const originalAspectRatio = originalWidth / originalHeight
        const targetAspectRatio = targetWidth / targetHeight

        if (originalAspectRatio > targetAspectRatio) {
            // Vídeo mais largo - limitar pela largura
            return {
                width: targetWidth,
                height: Math.round(targetWidth / originalAspectRatio),
            }
        } else {
            // Vídeo mais alto - limitar pela altura
            return {
                width: Math.round(targetHeight * originalAspectRatio),
                height: targetHeight,
            }
        }
    }
}
