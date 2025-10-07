/**
 * Content Processor
 * Orquestrador principal de processamento de conteúdo
 * Integra processamento de vídeo, moderação e upload
 */

import { circleTextLibrary, generateId } from "@/shared"
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

export interface ContentProcessingResult {
    success: boolean
    contentId: string
    enrichedDescription: string
    videoUrls: {
        low: string
        medium: string
        high: string
    }
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
        this.videoProcessor = new VideoProcessor(config)
        this.moderationEngine = moderationEngine || null
    }

    /**
     * Processa conteúdo completo: processamento, moderação e upload
     */
    async processContent(request: ContentProcessingRequest): Promise<ContentProcessingResult> {
        const startTime = Date.now()
        const contentId = generateId()

        try {
            // 1. Processar vídeo (extração de metadados e thumbnail)
            const processingRequest: VideoProcessingRequest = {
                contentId,
                videoData: request.videoData,
                metadata: request.metadata,
            }

            const videoResult = await this.videoProcessor.processVideo(processingRequest)

            if (!videoResult.success) {
                throw new Error(videoResult.error || "Falha ao processar vídeo")
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
                        `Conteúdo bloqueado pela moderação: ${moderationResult.flags.join(", ")}`,
                    )
                }
            }

            // 3. Upload para storage
            // Usar vídeo processado se disponível, senão usar original
            const finalVideoData = videoResult.processedVideo
                ? videoResult.processedVideo.data
                : request.videoData

            const videoKey = `videos/${request.ownerId}/${contentId}.mp4`
            const thumbnailKey = `thumbnails/${request.ownerId}/${contentId}.jpg`

            const videoUpload = await this.storageAdapter.uploadVideo(videoKey, finalVideoData, {
                contentType: "video/mp4", // Sempre MP4 após processamento
                ownerId: request.ownerId,
                contentId,
                duration: videoResult.videoMetadata.duration,
                wasProcessed: !!videoResult.processedVideo,
                wasCompressed: videoResult.processedVideo?.wasCompressed || false,
                wasConverted: videoResult.processedVideo?.wasConverted || false,
            })

            if (!videoUpload.success) {
                throw new Error(videoUpload.error || "Falha ao fazer upload do vídeo")
            }

            const thumbnailUpload = await this.storageAdapter.uploadThumbnail(
                thumbnailKey,
                videoResult.thumbnail.data,
                {
                    contentType: `image/${videoResult.thumbnail.format}`,
                    ownerId: request.ownerId,
                    contentId,
                },
            )

            if (!thumbnailUpload.success) {
                throw new Error(thumbnailUpload.error || "Falha ao fazer upload do thumbnail")
            }

            // 4. Gerar URLs para diferentes qualidades
            const videoUrls = {
                low: await this.storageAdapter.getVideoUrl(videoKey, "low"),
                medium: await this.storageAdapter.getVideoUrl(videoKey, "medium"),
                high: await this.storageAdapter.getVideoUrl(videoKey, "high"),
            }

            const thumbnailUrl = await this.storageAdapter.getThumbnailUrl(thumbnailKey)

            const processingTime = Date.now() - startTime
            const enrichedDescription = circleTextLibrary.richText.formatToEnriched(
                request.description,
            )

            return {
                success: true,
                contentId,
                enrichedDescription,
                videoUrls,
                thumbnailUrl,
                storage: {
                    videoKey,
                    thumbnailKey,
                    bucket: videoUpload.bucket,
                    region: videoUpload.region,
                    provider: videoUpload.provider,
                },
                videoMetadata: videoResult.videoMetadata,
                moderation: moderationResult,
                processingTime,
            }
        } catch (error) {
            const processingTime = Date.now() - startTime

            return {
                success: false,
                contentId,
                enrichedDescription: "",
                videoUrls: {
                    low: "",
                    medium: "",
                    high: "",
                },
                thumbnailUrl: "",
                storage: {
                    videoKey: "",
                    thumbnailKey: "",
                    provider: "unknown",
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
                moderation: {
                    moderationId: "",
                    approved: false,
                    requiresReview: false,
                    flags: [],
                    confidence: 0,
                },
                processingTime,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            }
        }
    }

    /**
     * Modera conteúdo antes do upload
     */
    private async moderateContent(request: ContentDetectionRequest): Promise<any> {
        if (!this.moderationEngine) {
            throw new Error("Motor de moderação não configurado")
        }

        return await this.moderationEngine.moderateContent(request)
    }

    /**
     * Deleta conteúdo do storage
     */
    async deleteContent(videoKey: string, thumbnailKey: string): Promise<void> {
        try {
            await this.storageAdapter.deleteVideo(videoKey)
            await this.storageAdapter.deleteThumbnail(thumbnailKey)
        } catch (error) {
            console.error("Erro ao deletar conteúdo:", error)
            throw error
        }
    }
}
