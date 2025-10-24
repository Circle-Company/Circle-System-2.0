/**
 * Content Processor
 * Orquestrador principal de processamento de conteúdo
 * Integra processamento de vídeo, moderação e upload
 */

import { generateId, textLib } from "@/shared"
import { ContentProcessorConfig, StorageAdapter, VideoProcessingRequest } from "./type"

import { ModerationEngine } from "@/core/content.moderation"
import { ContentDetectionRequest } from "@/core/content.moderation/types"
import { VideoProcessor } from "./video.processor"

export interface ContentProcessingRequest {
    ownerId: string
    videoData: Buffer
    description: string
    metadata: {
        filename: string
        mimeType: string
        size: number
    }
}

export interface ContentProcessingSuccessResult {
    success: boolean
    contentId: string
    enrichedDescription: string
    videoUrl: string // Vídeo em qualidade original
    thumbnailUrl: string
    storage: {
        videoKey: string
        thumbnailKey: string
        bucket?: string
        region?: string
        provider: string
    }
    videoMetadata: {
        duration: number
        width: number
        height: number
        format: string
        codec: string
        hasAudio: boolean
        size: number
        bitrate?: number
        fps?: number
    }
    moderation: {
        moderationId: string
        approved: boolean
        requiresReview: boolean
        flags: string[]
        confidence: number
    }
    processingTime: number
    error?: string
}

export interface ContentProcessingErrorResult {
    success: false
    error: string
    metadata: {
        contentId: string
        processingTime: number
    }
}

export class ContentProcessor {
    private videoProcessor: VideoProcessor
    private moderationEngine: ModerationEngine | null = null
    private storageAdapter: StorageAdapter

    constructor(
        storageAdapter: StorageAdapter,
        config?: Partial<ContentProcessorConfig>,
        moderationEngine?: ModerationEngine,
    ) {
        this.storageAdapter = storageAdapter

        // Log das configurações que serão passadas para o VideoProcessor
        console.log(`[ContentProcessor] 📋 Configurações passadas para VideoProcessor:`, {
            thumbnail: config?.thumbnail,
            processing: config?.processing,
            validation: config?.validation,
        })

        this.videoProcessor = new VideoProcessor(config)
        this.moderationEngine = moderationEngine || null
    }

    /**
     * Processa conteúdo completo: processamento, moderação e upload
     */
    async processContent(
        request: ContentProcessingRequest,
    ): Promise<ContentProcessingSuccessResult | ContentProcessingErrorResult> {
        const startTime = Date.now()
        const contentId = generateId()

        try {
            const baseKey = contentId.toString()
            // 1. Processar vídeo (extração de metadados e thumbnail)
            const processingRequest: VideoProcessingRequest = {
                contentId,
                videoData: request.videoData,
                videoKey: `videos/${baseKey}`,
                thumbnailKey: `thumbnails/${baseKey}`,
                metadata: request.metadata,
            }

            const videoResult = await this.videoProcessor.processVideo(processingRequest)

            if (!videoResult.success) {
                throw new Error(videoResult.error || "Error to process video")
            }

            // 2. Moderação de conteúdo (se disponível)
            let moderationResult = {
                moderationId: "",
                approved: true,
                requiresReview: false,
                flags: [] as string[],
                confidence: 100,
            }

            if (this.moderationEngine) {
                const moderation = await this.moderateContent({
                    contentId,
                    contentOwnerId: request.ownerId,
                    contentData: request.videoData,
                    metadata: {
                        filename: request.metadata.filename,
                        mimeType: request.metadata.mimeType,
                        size: request.metadata.size,
                        duration: videoResult.videoMetadata.duration,
                        resolution: {
                            width: videoResult.videoMetadata.width,
                            height: videoResult.videoMetadata.height,
                        },
                    },
                })

                moderationResult = {
                    moderationId: moderation.moderation.id,
                    approved: moderation.moderation.status === "approved",
                    requiresReview: moderation.moderation.status === "pending",
                    flags: moderation.moderation.flags.map((f) => f.type),
                    confidence: moderation.moderation.confidence,
                }

                // Se não aprovado, não fazer upload
                if (!moderationResult.approved && !moderationResult.requiresReview) {
                    throw new Error(
                        `Content blocked by moderation: ${moderationResult.flags.join(", ")}`,
                    )
                }
            }

            // 3. Upload para storage (paralelizado)

            // Preparar uploads para serem executados em paralelo
            const uploadPromises: Promise<{ type: string; result: any }>[] = []

            // Upload do vídeo original (sem compressão)
            if (videoResult.processedVideo) {
                uploadPromises.push(
                    this.storageAdapter
                        .uploadVideo(baseKey, videoResult.processedVideo.data, {
                            contentType: "video/mp4",
                            ownerId: request.ownerId,
                            contentId,
                            duration: videoResult.videoMetadata.duration,
                            wasProcessed: false, // Vídeo original - worker fará compressão
                        })
                        .then((result) => ({ type: "video", result })),
                )
            }

            // Upload de thumbnail única
            if (videoResult.thumbnail) {
                uploadPromises.push(
                    this.storageAdapter
                        .uploadThumbnail(contentId, videoResult.thumbnail.data, {
                            contentType: `image/${videoResult.thumbnail.format}`,
                            ownerId: request.ownerId,
                            contentId,
                        })
                        .then((result) => ({ type: "thumbnail", result })),
                )
            }

            // Executar todos os uploads em paralelo
            const uploadResults = await Promise.all(uploadPromises)

            // Processar resultados dos uploads
            let videoUrl = ""
            let thumbnailUrl = ""

            for (const uploadResult of uploadResults) {
                if (uploadResult.type === "video") {
                    if (!uploadResult.result.success) {
                        throw new Error(uploadResult.result.error || "Error to upload video")
                    }
                    videoUrl = uploadResult.result.url || ""
                    console.log(`✅ Upload vídeo original concluído`)
                } else if (uploadResult.type === "thumbnail") {
                    if (!uploadResult.result.success) {
                        throw new Error(uploadResult.result.error || "Error to upload thumbnail")
                    }
                    thumbnailUrl = uploadResult.result.url || ""
                }
            }

            const processingTime = Date.now() - startTime
            const enrichedDescription = textLib.rich.formatToEnriched(request.description)

            return {
                success: true,
                contentId,
                enrichedDescription,
                videoUrl,
                thumbnailUrl,
                storage: {
                    videoKey: baseKey,
                    thumbnailKey: `thumb_${contentId}`,
                    bucket: videoUrl ? "local" : undefined,
                    region: videoUrl ? "local" : undefined,
                    provider: "local",
                },
                videoMetadata: videoResult.videoMetadata,
                moderation: moderationResult,
                processingTime,
            }
        } catch (error) {
            const processingTime = Date.now() - startTime

            return {
                success: false,
                metadata: {
                    contentId,
                    processingTime,
                },
                error: error instanceof Error ? error.message : "Unknown error",
            }
        }
    }

    /**
     * Modera conteúdo antes do upload
     */
    private async moderateContent(request: ContentDetectionRequest): Promise<any> {
        if (!this.moderationEngine) {
            throw new Error("Moderation engine not configured")
        }

        return await this.moderationEngine.moderateContent(request)
    }

    /**
     * Deleta conteúdo do storage (paralelizado)
     */
    async deleteContent(videoKey: string, thumbnailKey: string): Promise<void> {
        try {
            // Deletar vídeo e thumbnail em paralelo
            await Promise.all([
                this.storageAdapter.deleteVideo(videoKey),
                this.storageAdapter.deleteThumbnail(thumbnailKey),
            ])
        } catch (error) {
            console.error("Error to delete content:", error)
            throw error
        }
    }
}
