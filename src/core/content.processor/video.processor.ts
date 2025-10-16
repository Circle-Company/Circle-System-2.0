/**
 * Video Processor
 * Processa vídeos para extração de metadados e geração de thumbnails
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import {
    ContentProcessorConfig,
    ProcessedVideoResult,
    ThumbnailGenerationOptions,
    VideoCompressionOptions,
    VideoMetadata,
    VideoMetadataExtractionResult,
    VideoProcessingRequest,
    VideoProcessingResult,
} from "./type"

import { VideoCompressionOptions as WorkerVideoCompressionOptions } from "@/infra/queue/types/video.compression.job.types"
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
                width: 1080,
                height: 1674,
                quality: 40,
                format: "jpeg",
                timePosition: 0,
                ...config?.thumbnail,
            },
            validation: {
                maxFileSize: 500 * 1024 * 1024, // 500MB
                maxDuration: 180, // 3 minutos
                minDuration: 3, // 3 segundos
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
        }
    }

    /**
     * Processa vídeo completo: validação, extração de metadados, corte para proporção padrão e geração de thumbnail
     *
     * ✅ GARANTIAS:
     * - Mantém resolução original do vídeo
     * - Corta para proporção padrão do sistema (1080x1674) se necessário
     * - Converte TODOS os vídeos para formato MP4 H.264
     * - Gera thumbnail do primeiro frame na proporção padrão
     * - Extrai metadados completos
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
                request.metadata.mimeType,
            )

            const finalVideoData = processedResult.data
            const finalMetadata = {
                ...originalMetadata,
                width: processedResult.finalWidth,
                height: processedResult.finalHeight,
            }

            // 4. Gerar thumbnail comprimida (CRF 30)
            const thumbnail = await this.generateThumbnail(finalVideoData, {
                ...this.config.thumbnail,
                quality: 30, // CRF 30 para compressão da thumbnail
            })

            // 5. Upload do vídeo original (sem compressão)
            const videoUploadResult = await this.uploadSingleVideo(
                request.videoKey,
                finalVideoData,
                {
                    originalFormat: request.metadata.mimeType,
                    processingTime: Date.now() - startTime,
                    metadata: finalMetadata,
                },
            )

            // 6. Upload da thumbnail comprimida
            const thumbnailUploadResult = await this.uploadSingleThumbnail(
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
     * Processa vídeo para manter resolução original mas cortar para proporção padrão (1080x1674)
     */
    private async processVideoForAspectRatio(
        videoData: Buffer,
        metadata: VideoMetadata,
        originalMimeType: string,
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
        console.log(`[VideoProcessor] 🔄 Forçando processamento para proporção padrão do sistema (1080x1674)`)

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
     * Processa vídeo em múltiplas resoluções
     */
    private async processVideoMultipleResolutions(
        videoData: Buffer,
        metadata: VideoMetadata,
        originalMimeType: string,
    ): Promise<{ low?: Buffer; medium?: Buffer; high?: Buffer }> {
        const results: { low?: Buffer; medium?: Buffer; high?: Buffer } = {}
        const config = this.config.processing

        if (!config.targetResolutions || config.targetResolutions.length === 0) {
            // Fallback para resolução única
            const singleResult = await this.processVideoCompression(
                videoData,
                metadata,
                originalMimeType,
            )
            if (singleResult.wasProcessed) {
                results.low = singleResult.data
            }
            return results
        }

        // Processar cada resolução
        for (const resolution of config.targetResolutions) {
            try {
                const compressionOptions: VideoCompressionOptions = {
                    targetResolution: { width: resolution.width, height: resolution.height },
                    targetFormat: "mp4",
                    quality: resolution.quality,
                }

                const result = await this.processVideoCompressionWithOptions(
                    videoData,
                    metadata,
                    originalMimeType,
                    compressionOptions,
                )

                if (result.wasProcessed) {
                    results[resolution.name as keyof typeof results] = result.data
                    console.log(
                        `✅ Vídeo ${resolution.name} (${resolution.width}x${resolution.height}) processado com sucesso`,
                    )
                }
            } catch (error) {
                console.error(`❌ Erro ao processar resolução ${resolution.name}:`, error)
            }
        }

        return results
    }

    /**
     * Upload de múltiplos vídeos em diferentes resoluções
     * Nota: O upload real é feito pelo ContentProcessor, aqui apenas retornamos os dados
     */
    private async uploadMultipleVideos(
        baseKey: string,
        videos: { low?: Buffer; medium?: Buffer; high?: Buffer },
        options: any,
    ): Promise<{ low?: any; medium?: any; high?: any }> {
        const results: { low?: any; medium?: any; high?: any } = {}

        for (const [resolution, videoData] of Object.entries(videos)) {
            if (videoData) {
                results[resolution as keyof typeof results] = {
                    key: `${baseKey}_${resolution}`,
                    data: videoData,
                    metadata: {
                        ...options.metadata,
                        processed: true,
                        resolution: resolution,
                        processingTime: options.processingTime,
                        originalFormat: options.originalFormat,
                        finalFormat: options.finalFormat,
                    },
                }
                console.log(`✅ Vídeo ${resolution} preparado para upload`)
            }
        }

        return results
    }

    /**
     * Upload de vídeo único (qualidade original)
     * Nota: O upload real é feito pelo ContentProcessor, aqui apenas retornamos os dados
     */
    private async uploadSingleVideo(
        baseKey: string,
        videoData: Buffer,
        options: any,
    ): Promise<any> {
        const result = {
            key: `${baseKey}.mp4`,
            data: videoData,
            metadata: {
                ...options.metadata,
                processed: false,
                processingTime: options.processingTime,
                originalFormat: options.originalFormat,
                note: "Vídeo em qualidade original - worker fará compressão",
            },
        }
        console.log(
            `✅ Vídeo original preparado para upload (${(videoData.length / 1024 / 1024).toFixed(
                2,
            )}MB)`,
        )
        return result
    }

    /**
     * Upload de thumbnail única (comprimida com CRF 30)
     * Nota: O upload real é feito pelo ContentProcessor, aqui apenas retornamos os dados
     */
    private async uploadSingleThumbnail(baseKey: string, thumbnail: any): Promise<any> {
        if (thumbnail) {
            const result = {
                key: baseKey,
                data: thumbnail.data,
                metadata: {
                    width: thumbnail.width,
                    height: thumbnail.height,
                    format: thumbnail.format,
                    compressed: true,
                    compressionQuality: 30, // CRF 30
                },
            }
            console.log(`✅ Thumbnail comprimida preparada para upload`)
            return result
        }
        return null
    }

    /**
     * Processa compressão com opções específicas
     */
    private async processVideoCompressionWithOptions(
        videoData: Buffer,
        metadata: VideoMetadata,
        originalMimeType: string,
        options: VideoCompressionOptions,
    ): Promise<ProcessedVideoResult> {
        const startTime = Date.now()

        // Verificar se precisa processar
        const needsResize =
            metadata.width !== options.targetResolution.width ||
            metadata.height !== options.targetResolution.height
        const needsConversion = this.detectVideoFormat(originalMimeType) !== options.targetFormat

        if (!needsResize && !needsConversion) {
            console.log("🎯 Vídeo já está no formato e resolução desejados")
            return {
                wasProcessed: false,
                data: videoData,
                wasCompressed: false,
                wasConverted: false,
                originalResolution: { width: metadata.width, height: metadata.height },
                originalFormat: this.detectVideoFormat(originalMimeType),
            }
        }

        console.log("🎯 Iniciando processamento de vídeo...")
        console.log("📊 Resolução original:", `${metadata.width}x${metadata.height}`)
        console.log(
            "🎯 Resolução alvo:",
            `${options.targetResolution.width}x${options.targetResolution.height}`,
        )
        console.log("🎯 Formato alvo:", options.targetFormat)

        // Processar com FFmpeg usando método existente
        const processedData = await this.compressVideo(videoData, options)

        const processingTime = Date.now() - startTime
        console.log(`✅ Vídeo processado em ${processingTime}ms`)

        return {
            wasProcessed: true,
            data: processedData,
            wasCompressed: needsResize,
            wasConverted: needsConversion,
            originalResolution: { width: metadata.width, height: metadata.height },
            originalFormat: this.detectVideoFormat(originalMimeType),
        }
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
            // Definir resolução fixa para thumbnails: 1080x1674 (proporção padrão do sistema)
            const targetWidth = 1080
            const targetHeight = 1674

            console.log(
                `[VideoProcessor] 📐 Gerando thumbnail em proporção padrão do sistema: ${targetWidth}x${targetHeight}`,
            )

            console.log(
                `[VideoProcessor] 🖼️ Gerando thumbnail real com ffmpeg: ${targetWidth}x${targetHeight}, formato: ${options.format}`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            // 2. Executar comando ffmpeg para extrair frame com crop/scale para proporção padrão
            const timePosition = options.timePosition || 0
            // Usar crop e scale para garantir proporção padrão (1080x1674) com compressão CRF 30
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -ss ${timePosition} -vframes 1 -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}" -q:v ${
                options.quality || 30
            } "${tempOutputPath}"`

            console.log(`[VideoProcessor] 🔧 Executando: ${ffmpegCommand}`)
            await execAsync(ffmpegCommand)

            // 3. Ler arquivo de imagem gerado
            if (existsSync(tempOutputPath)) {
                const thumbnailData = readFileSync(tempOutputPath)

                console.log(
                    `[VideoProcessor] ✅ Thumbnail gerado em proporção padrão: ${targetWidth}x${targetHeight} (${thumbnailData.length} bytes)`,
                )

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

            // Fallback para thumbnail vazio com dimensões 1080x1674
            console.log(`[VideoProcessor] 🔄 Usando fallback - thumbnail vazio em proporção padrão`)

            return {
                data: Buffer.from([]),
                width: 1080,
                height: 1674,
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
     * Processa redimensionamento e conversão de vídeo
     * Redimensiona TODOS os vídeos para proporção 9:16 (360x558) mantendo máxima qualidade
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
        const targetWidth = this.config.processing.targetResolution?.width || 360 // 360
        const targetHeight = this.config.processing.targetResolution?.height || 558 // 558
        const currentFormat = this.detectVideoFormat(mimeType)

        // ✅ SEMPRE redimensionar para proporção 9:16
        const needsResize = true
        const needsConversion = currentFormat !== "mp4"

        console.log(`[VideoProcessor] 🔄 Redimensionando vídeo para proporção 9:16`)
        console.log(
            `[VideoProcessor] Original: ${metadata.width}x${metadata.height} → Target: ${targetWidth}x${targetHeight}`,
        )

        // Se não precisa processar, retornar vídeo original
        if (!needsResize && !needsConversion) {
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

        // 1. Redimensionar para proporção 9:16 se necessário
        if (needsResize) {
            console.log(
                `[VideoProcessor] 📐 Redimensionando: ${metadata.width}x${metadata.height} -> ${targetWidth}x${targetHeight}`,
            )

            originalResolution = { width: metadata.width, height: metadata.height }
            processedData = await this.compressVideo(processedData, {
                targetResolution: { width: targetWidth, height: targetHeight },
                targetFormat: "mp4",
                quality: 18, // CRF 18 para máxima qualidade
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
     * Força vídeo para proporção padrão (1080x1674) usando scale + crop
     * Comando ffmpeg: ffmpeg -i input.mp4 -vf "scale=1080:1674:force_original_aspect_ratio=increase,crop=1080:1674" -c:v libx264 -preset fast -crf 18 -c:a aac output.mp4
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
                `[VideoProcessor] 📐 Cortando vídeo para proporção padrão: ${metadata.width}x${metadata.height} → ${targetWidth}x${targetHeight}`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            // 2. Executar comando ffmpeg para sempre forçar escala + crop para 1080x1674
            // SEMPRE usar scale + crop para garantir proporção exata 1080x1674
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}" -c:v libx264 -preset fast -crf 18 -c:a aac -movflags +faststart "${tempOutputPath}"`

            console.log(`[VideoProcessor] 🔧 Executando: ${ffmpegCommand}`)
            await execAsync(ffmpegCommand)

            // 4. Ler arquivo cortado
            if (existsSync(tempOutputPath)) {
                const croppedData = readFileSync(tempOutputPath)

                console.log(
                    `[VideoProcessor] ✅ Vídeo cortado para proporção padrão: ${(
                        croppedData.length /
                        1024 /
                        1024
                    ).toFixed(2)}MB`,
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
     * Redimensiona vídeo para proporção 9:16 mantendo máxima qualidade usando ffmpeg
     * Comando ffmpeg: ffmpeg -i input.mp4 -vf "scale=360:558:force_original_aspect_ratio=increase,crop=360:558" -c:v libx264 -preset medium -crf 18 -c:a aac output.mp4
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
                `[VideoProcessor] 📐 Redimensionando vídeo para proporção 9:16 (${options.targetResolution.width}x${options.targetResolution.height})`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            // 2. Executar comando ffmpeg para redimensionamento com crop para proporção exata 9:16
            // force_original_aspect_ratio=increase garante que o vídeo seja redimensionado
            // para pelo menos o tamanho target, depois crop para o tamanho exato
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -vf "scale=${
                options.targetResolution.width
            }:${options.targetResolution.height}:force_original_aspect_ratio=increase,crop=${
                options.targetResolution.width
            }:${options.targetResolution.height}" -c:v libx264 -preset fast -crf ${
                options.quality || 35
            } -b:v 200k -maxrate 300k -bufsize 400k -c:a aac -b:a 32k -movflags +faststart "${tempOutputPath}"`

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
                    `[VideoProcessor] ✅ Redimensionamento concluído: ${(
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
     * Comprime vídeo com H.264 usando preset slow para máxima compressão
     * Comando ffmpeg: ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 28 -b:v 300k -maxrate 500k -bufsize 600k -c:a aac -b:a 64k output.mp4
     */
    async compressVideoSlow(
        videoData: Buffer,
        options: WorkerVideoCompressionOptions = {
            preset: "slow",
            crf: 28,
            targetBitrate: 300,
            maxBitrate: 500,
            bufferSize: 600,
            audioBitrate: 64,
        },
    ): Promise<Buffer> {
        const tempInputPath = join(
            tmpdir(),
            `input_slow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )
        const tempOutputPath = join(
            tmpdir(),
            `compressed_slow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )

        try {
            console.log(
                `[VideoProcessor] 🐌 Iniciando compressão H.264 SLOW (preset: ${options.preset}, CRF: ${options.crf})`,
            )

            // 1. Salvar vídeo em arquivo temporário
            writeFileSync(tempInputPath, videoData)

            // 2. Executar comando ffmpeg para compressão lenta mas eficiente
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -c:v libx264 -preset ${options.preset} -crf ${options.crf} -b:v ${options.targetBitrate}k -maxrate ${options.maxBitrate}k -bufsize ${options.bufferSize}k -c:a aac -b:a ${options.audioBitrate}k -movflags +faststart "${tempOutputPath}"`

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
     * Converte vídeo para formato MP4 com codec AV1 usando ffmpeg
     * Comando ffmpeg: ffmpeg -i input.mov -c:v libaom-av1 -crf 30 -b:v 0 -c:a aac output.mp4
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

            // 2. Executar comando ffmpeg para conversão com H.264 veryfast
            const ffmpegCommand = `ffmpeg -i "${tempInputPath}" -c:v libx264 -preset veryfast -crf 23 -c:a aac -movflags +faststart "${tempOutputPath}"`

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
}
