// NEW SWIPE ENGINE - Arquitetura desacoplada
import {
    ContentProcessingErrorResult,
    ContentProcessingSuccessResult,
    ContentProcessor,
    StorageAdapter,
} from "@/core/content.processor"
import {
    Moment,
    MomentProcessingStatusEnum,
    MomentProps,
    MomentStatusEnum,
    MomentVisibilityEnum,
} from "@/domain/moment"
import { logger, textLib } from "@/shared"

import { EmbeddingsQueue } from "@/infra/queue/embeddings.queue"
import { EmbeddingJobPriority } from "@/infra/workers/types/embedding.job.types"
// Audio extractor (mantido do old system)
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
// Redis Queue para processamento assíncrono
import { ModerationEngine } from "@/core/content.moderation"
import { MomentMetricsService } from "./moment.metrics.service"
// Fallback para old system se necessário
import { TimezoneCode } from "@/domain/user"
import { VideoCompressionQueue } from "@/infra/queue/video.compression.queue"

export interface CreateMomentData {
    ownerId: string
    ownerUsername: string
    videoData: Buffer
    videoMetadata: {
        filename: string
        mimeType: string
        size: number
    }
    description?: string
    mentions?: string[]
    visibility: MomentVisibilityEnum
    location?: {
        latitude: number
        longitude: number
    }
    device?: {
        type: string
        os: string
        osVersion: string
        model: string
        screenResolution: string
        orientation: string
    }
    timezone?: TimezoneCode
}

export interface UpdateMomentData {
    description?: string
    hashtags?: string[]
    mentions?: string[]
    status?: MomentStatusEnum
    visibility?: MomentVisibilityEnum
}

export interface MomentSearchFilters {
    ownerId?: string
    status?: MomentStatusEnum
    visibility?: MomentVisibilityEnum
    hashtags?: string[]
    mentions?: string[]
    location?: {
        latitude: number
        longitude: number
        radius: number
    }
    dateRange?: {
        start: Date
        end: Date
    }
    quality?: {
        min: number
        max: number
    }
}

export interface MomentSortOptions {
    field: "createdAt" | "updatedAt" | "publishedAt" | "views" | "likes" | "engagement"
    direction: "asc" | "desc"
}

export interface MomentPaginationOptions {
    page: number
    limit: number
    offset?: number
}

export interface MomentServiceConfig {
    enableValidation: boolean
    enableMetrics: boolean
    enableProcessing: boolean
    defaultVisibility: MomentVisibilityEnum
    defaultStatus: MomentStatusEnum
    maxSearchResults: number
    enableCaching: boolean
    cacheTimeout: number
}

// ===== SERVIÇO PRINCIPAL DE MOMENT =====
export class MomentService {
    private config: MomentServiceConfig
    private contentProcessor: ContentProcessor | null = null
    private embeddingsQueue: EmbeddingsQueue
    private videoCompressionQueue: VideoCompressionQueue

    constructor(
        private repository: IMomentRepository,
        private metricsService: MomentMetricsService,
        config?: Partial<MomentServiceConfig>,
        storageAdapter?: StorageAdapter,
        moderationEngine?: ModerationEngine,
    ) {
        this.config = {
            enableValidation: true,
            enableMetrics: true,
            enableProcessing: true,
            defaultVisibility: MomentVisibilityEnum.PRIVATE,
            defaultStatus: MomentStatusEnum.PUBLISHED,
            maxSearchResults: 1000,
            enableCaching: false,
            cacheTimeout: 300000, // 5 minutos
            ...config,
        }

        // Inicializar processador de conteúdo se adapter fornecido
        if (storageAdapter) {
            // Configurações otimizadas para processamento síncrono: APENAS CROP, SEM COMPRESSÃO
            const syncProcessingConfig = {
                thumbnail: {
                    width: 540, // 1080/2 - thumbnail menor
                    height: 837, // 1674/2 - thumbnail menor
                    format: "jpeg" as const,
                    timePosition: 0,
                    quality: 70, // CRF 70 para garantir ~15KB (thumbnail menor)
                },
                processing: {
                    timeout: 60000, // 60 segundos
                    retryAttempts: 3,
                    autoCompress: false, // ✅ SEM COMPRESSÃO - apenas crop
                    autoConvertToMp4: true, // ✅ Converter para MP4
                    targetResolution: { width: 1080, height: 1674 },
                    maintainQuality: true, // Manter qualidade original
                },
                validation: {
                    maxFileSize: 50 * 1024 * 1024, // 50MB
                    maxDuration: 30, // 30 segundos
                    minDuration: 5, // 5 segundos
                    allowedFormats: ["mp4", "mov", "avi", "webm"],
                    minResolution: { width: 360, height: 558 },
                    maxResolution: { width: 1080, height: 1674 },
                },
            }

            this.contentProcessor = new ContentProcessor(
                storageAdapter,
                syncProcessingConfig,
                moderationEngine,
            )
        }

        // Redis queue para embeddings assíncronos
        this.embeddingsQueue = EmbeddingsQueue.getInstance()
        // Redis queue para compressão de vídeo assíncrona
        this.videoCompressionQueue = VideoCompressionQueue.getInstance()
    }

    /**
     * Cria um novo moment
     */
    async createMoment(data: CreateMomentData): Promise<Moment> {
        // Validar dados de entrada
        if (this.config.enableValidation) {
            await this._validateCreateData(data)
        }

        if (!this.contentProcessor) {
            throw new Error("Content processor not configured. Please configure storage adapter.")
        }
        // Processar vídeo (extração de metadados, thumbnail, moderação e upload)
        const processingResult = (await this.contentProcessor.processContent({
            description: data.description || "",
            ownerId: data.ownerId,
            videoData: data.videoData,
            metadata: data.videoMetadata,
        })) as ContentProcessingSuccessResult

        this._validateProcessingResult(processingResult)
        const momentData = this._formatMomentData(
            data,
            processingResult as ContentProcessingSuccessResult,
        )
        const moment = new Moment(momentData)
        const createdMoment = await this.repository.create(moment)
        const scheduleTime = process.env.EMBEDDINGS_SCHEDULE_TIME || "01:00"

        // Enfileirar job de compressão de vídeo imediatamente
        await this._scheduleVideoCompressionJob(createdMoment, processingResult)
            .then(async () => {
                createdMoment.processing.status = MomentProcessingStatusEnum.MEDIA_PROCESSED
                createdMoment.processing.progress = 50
                createdMoment.processing.steps.push({
                    name: "video_compression",
                    status: MomentProcessingStatusEnum.PROCESSING,
                    progress: 50,
                    startedAt: new Date(),
                    completedAt: null,
                    error: null,
                })
                await this.repository.update(createdMoment)
                logger.info(
                    `[MomentService] ✅ Status de processamento atualizado para moment ${createdMoment.id}`,
                )
            })
            .catch((error) => {
                logger.error(
                    `[MomentService] ❌ Erro ao enfileirar compressão para moment ${createdMoment.id}:`,
                    error,
                )
                // Não re-throw aqui para não interromper o fluxo principal
            })

        // Enfileirar job de embeddings para processamento
        await this._scheduleEmbeddingJob(createdMoment, processingResult, scheduleTime)
            .then(async () => {
                createdMoment.processing.status = MomentProcessingStatusEnum.EMBEDDINGS_QUEUED
                logger.info(`[MomentService] ✅ Embeddings agendados para ${scheduleTime}`)

                await this.repository.update(createdMoment)
            })
            .catch((error) => {
                logger.error(
                    `[MomentService] ❌ Erro ao agendar embeddings para moment ${createdMoment.id}:`,
                    error,
                )
                // Não re-throw aqui para não interromper o fluxo principal
            })
        await this.repository.update(createdMoment)

        return createdMoment
    }

    // Exclui um moment (soft delete)
    async deleteMomentSoft(id: string, reason?: string): Promise<boolean> {
        const existingMoment = await this.repository.findById(id)
        if (!existingMoment) {
            throw new Error(`Moment with ID ${id} not found`)
        }

        // Atualizar status para deletado
        const updatedProps: any = {
            status: {
                ...existingMoment.status,
                current: MomentStatusEnum.DELETED,
                previous: existingMoment.status.current,
                reason: reason || "Deleted by user",
                changedBy: existingMoment.ownerId,
                changedAt: new Date(),
                updatedAt: new Date(),
            },
            deletedAt: new Date(),
            updatedAt: new Date(),
        }

        // Aplicar atualizações ao momento existente
        Object.assign(existingMoment, updatedProps)

        // Salvar exclusão (soft delete)
        const updatedMoment = await this.repository.update(existingMoment)
        return updatedMoment !== null
    }

    async hasUserLikedMoment(momentId: string, userId: string): Promise<boolean> {
        // Validar parâmetros
        if (!momentId || !userId) {
            return false
        }

        // Verificar se o momento existe
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return false
        }

        // Verificar se o usuário curtiu o momento
        return await this.repository.hasUserLikedMoment(momentId, userId)
    }

    async likeMoment(momentId: string, userId: string): Promise<Moment | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // Verificar se já curtiu
        const hasLiked = await this.hasUserLikedMoment(momentId, userId)
        if (hasLiked) {
            return moment
        }

        // Adicionar like no banco de dados
        await this.repository.addLike(momentId, userId)

        // Incrementar contador de likes
        const updatedMoment = await this._incrementMomentLikes(momentId)

        return updatedMoment
    }

    async unlikeMoment(momentId: string, userId: string): Promise<Moment | null> {
        const moment = await this.repository.findById(momentId)
        if (!moment) {
            return null
        }

        // Verificar se curtiu
        const hasLiked = await this.hasUserLikedMoment(momentId, userId)
        if (!hasLiked) {
            return moment
        }

        // Remover like do banco de dados
        await this.repository.removeLike(momentId, userId)

        // Decrementar contador de likes
        const updatedMoment = await this._decrementMomentLikes(momentId)

        return updatedMoment
    }

    async adminBlockMoment(data: { momentId: string; adminId: string; reason: string }): Promise<{
        success: boolean
        moment?: {
            id: string
            status: string
            reason: string
            blockedBy: string
            blockedAt: Date
        }
        error?: string
    }> {
        try {
            const moment = await this.repository.findById(data.momentId)
            if (!moment) {
                return {
                    success: false,
                    error: "Moment not found",
                }
            }
            const previousStatus = moment.status.current

            moment.status.current = MomentStatusEnum.BLOCKED
            moment.status.previous = previousStatus
            moment.status.reason = data.reason || "Moment blocked by Circle Admin Team"
            moment.status.changedBy = data.adminId
            moment.status.changedAt = new Date()
            moment.status.updatedAt = new Date()

            const updatedMoment = await this.repository.update(moment)

            return {
                success: true,
                moment: {
                    id: updatedMoment.id,
                    status: updatedMoment.status.current as string,
                    reason: data.reason,
                    blockedBy: data.adminId,
                    blockedAt: new Date(),
                },
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to block moment: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            }
        }
    }

    async adminUnlockMoment(data: { momentId: string; adminId: string; reason?: string }): Promise<{
        success: boolean
        moment?: {
            id: string
            status: string
            reason?: string
            unblockedBy: string
            unblockedAt: Date
        }
        error?: string
    }> {
        try {
            const moment = await this.repository.findById(data.momentId)!
            if (!moment) {
                return {
                    success: false,
                    error: "Moment not found",
                }
            }

            moment.status.current = MomentStatusEnum.PUBLISHED
            moment.status.previous = MomentStatusEnum.BLOCKED
            moment.status.reason = data.reason || "Moment unlocked by Circle Admin Team"
            moment.status.changedBy = data.adminId
            moment.status.changedAt = new Date()
            moment.status.updatedAt = new Date()

            const updatedMoment = await this.repository.update(moment)

            return {
                success: true,
                moment: {
                    id: updatedMoment.id,
                    status: updatedMoment.status.current as string,
                    reason: updatedMoment.status.reason as string,
                    unblockedBy: data.adminId,
                    unblockedAt: updatedMoment.status.changedAt,
                },
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to unblock moment: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            }
        }
    }

    // ===== MÉTODOS PRIVADOS =====
    private async _incrementMomentLikes(momentId: string): Promise<Moment | null> {
        const moment = (await this.repository.findById(momentId)!) as Moment
        moment.incrementLikes()
        return await this.repository.update(moment)
    }

    private async _decrementMomentLikes(momentId: string): Promise<Moment | null> {
        const moment = (await this.repository.findById(momentId)!) as Moment
        moment.decrementLikes()
        return await this.repository.update(moment)
    }

    private async _validateCreateData(data: CreateMomentData): Promise<void> {
        // Validações básicas
        if (!data.ownerId) {
            throw new Error("Owner ID is required")
        }

        // Validar videoData
        if (!data.videoData || data.videoData.length === 0) {
            throw new Error("Video data is required")
        }

        // Validar metadata do vídeo
        if (!data.videoMetadata) {
            throw new Error("Video metadata is required")
        }

        if (!data.videoMetadata.filename) {
            throw new Error("Filename is required")
        }

        if (!data.videoMetadata.mimeType) {
            throw new Error("MIME type is required")
        }

        if (!data.videoMetadata.mimeType.startsWith("video/")) {
            throw new Error("File must be a video")
        }

        // Validar que usuário não pode mencionar a si mesmo
        if (data.mentions && data.mentions.includes(data.ownerUsername)) {
            throw new Error("You cannot mention yourself")
        }

        // Validar menções duplicadas
        if (data.mentions && new Set(data.mentions).size !== data.mentions.length) {
            throw new Error("Cannot mention the same user more than once")
        }

        textLib.validator.description(data.description || "")

        data.mentions?.forEach((mention) => {
            textLib.validator.username(mention)
        })
    }

    private _validateProcessingResult(
        processingResult: ContentProcessingSuccessResult | ContentProcessingErrorResult,
    ): { success: boolean; error?: string } {
        if (!processingResult.success) {
            return {
                success: false,
                error: `Error processing content: ${processingResult.error || "Unknown error"}`,
            }
        }

        // Type assertion para ContentProcessingSuccessResult após verificar success
        const successResult = processingResult as ContentProcessingSuccessResult

        if (!successResult.moderation.approved && !successResult.moderation.requiresReview) {
            return {
                success: false,
                error: `Content blocked by moderation: ${successResult.moderation.flags.join(
                    ", ",
                )}`,
            }
        }

        if (!successResult.videoUrl) {
            return { success: false, error: "Video URL was not generated during processing" }
        }

        if (!successResult.thumbnailUrl) {
            return { success: false, error: "Thumbnail URL was not generated during processing" }
        }

        if (!successResult.contentId) {
            return { success: false, error: "Content ID was not generated during processing" }
        }

        if (!successResult.storage?.provider) {
            return {
                success: false,
                error: "Storage provider was not configured during processing",
            }
        }

        if (!successResult.storage?.videoKey) {
            return {
                success: false,
                error: "Video storage key was not generated during processing",
            }
        }

        if (!successResult.storage?.thumbnailKey) {
            return {
                success: false,
                error: "Thumbnail storage key was not generated during processing",
            }
        }

        return { success: true }
    }

    private async _scheduleVideoCompressionJob(
        createdMoment: Moment,
        successResult: ContentProcessingSuccessResult,
    ): Promise<void> {
        logger.info(
            `[MomentService] 📅 Agendando compressão de vídeo para moment ${createdMoment.id}`,
        )

        try {
            await this.videoCompressionQueue.addJob(
                {
                    momentId: createdMoment.id,
                    originalVideoUrl: successResult.videoUrl,
                    videoMetadata: {
                        width: successResult.videoMetadata?.width || 0,
                        height: successResult.videoMetadata?.height || 0,
                        duration: successResult.videoMetadata?.duration || 0,
                        codec: successResult.videoMetadata?.codec || "h264",
                        hasAudio: successResult.videoMetadata?.hasAudio || false,
                        size: successResult.videoMetadata?.size || 0,
                    },
                    priority: EmbeddingJobPriority.HIGH,
                },
                EmbeddingJobPriority.HIGH,
            )

            logger.info(
                `[MomentService] ✅ Job de compressão adicionado à fila para moment ${createdMoment.id}`,
            )
        } catch (error) {
            logger.error(`[MomentService] ❌ Erro ao adicionar job de compressão à fila:`, error)
            throw error // Re-throw para ser capturado pelo .catch() do método principal
        }
    }

    private async _scheduleEmbeddingJob(
        createdMoment: Moment,
        successResult: ContentProcessingSuccessResult,
        scheduleTime: string,
    ): Promise<void> {
        logger.info(
            `[MomentService] 📅 Agendando embeddings para moment ${createdMoment.id} às ${scheduleTime}`,
        )

        try {
            await this.embeddingsQueue.scheduleFor(
                {
                    momentId: createdMoment.id,
                    videoUrl: successResult.videoUrl, // Usar vídeo original (será atualizado após compressão)
                    thumbnailUrl: successResult.thumbnailUrl,
                    description: createdMoment.description || "",
                    hashtags: [],
                    videoMetadata: {
                        width: successResult.videoMetadata?.width || 0,
                        height: successResult.videoMetadata?.height || 0,
                        duration: successResult.videoMetadata?.duration || 0,
                        codec: successResult.videoMetadata?.codec || "h264",
                        hasAudio: successResult.videoMetadata?.hasAudio || false,
                    },
                    priority: EmbeddingJobPriority.NORMAL,
                },
                scheduleTime,
            )

            logger.info(
                `[MomentService] ✅ Job de embeddings agendado para moment ${createdMoment.id} às ${scheduleTime}`,
            )
        } catch (error) {
            logger.error(`[MomentService] ❌ Erro ao agendar job de embeddings:`, error)
            throw error // Re-throw para ser capturado pelo .catch() do método principal
        }
    }

    private _formatMomentData(
        data: CreateMomentData,
        processingResult: ContentProcessingSuccessResult,
    ): MomentProps {
        return {
            id: processingResult.contentId,
            ownerId: data.ownerId,
            content: {
                duration: processingResult.videoMetadata?.duration || 0,
                size: processingResult.videoMetadata?.size || 0,
                format: processingResult.videoMetadata?.format || ("mp4" as any),
                resolution: {
                    width: processingResult.videoMetadata?.width || 0,
                    height: processingResult.videoMetadata?.height || 0,
                    quality: "medium" as any,
                },
                hasAudio: processingResult.videoMetadata?.hasAudio || false,
                codec: processingResult.videoMetadata?.codec || ("h264" as any),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            description: data.description || "",
            hashtags: [],
            mentions: data.mentions || [],
            media: {
                url: processingResult.videoUrl,
                storage: {
                    provider: processingResult.storage.provider as any,
                    bucket: processingResult.storage.bucket || "",
                    key: processingResult.storage.videoKey,
                    region: processingResult.storage.region || "",
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            thumbnail: {
                url: processingResult.thumbnailUrl,
                width: processingResult.videoMetadata?.width || 0,
                height: processingResult.videoMetadata?.height || 0,
                storage: {
                    provider: processingResult.storage.provider as any,
                    bucket: processingResult.storage.bucket || "",
                    key: processingResult.storage.thumbnailKey,
                    region: processingResult.storage.region || "",
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            status: {
                current: this.config.defaultStatus,
                previous: null,
                reason: null,
                changedBy: "moment.creation.service",
                changedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            visibility: {
                level: this.config.defaultVisibility,
                allowedUsers: [],
                blockedUsers: [],
                ageRestriction: false,
                contentWarning: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            context:
                data.location && data.device
                    ? {
                          device: {
                              type: data.device.type,
                              os: data.device.os,
                              osVersion: data.device.osVersion,
                              model: data.device.model,
                              screenResolution: data.device.screenResolution,
                              orientation: data.device.orientation,
                          },
                          location: {
                              latitude: data.location.latitude,
                              longitude: data.location.longitude,
                          },
                      }
                    : undefined,
            processing: {
                status: MomentProcessingStatusEnum.MEDIA_PROCESSED,
                progress: 50,
                steps: [
                    {
                        name: "video_processing",
                        status: "completed" as any,
                        progress: 100,
                        startedAt: new Date(),
                        completedAt: new Date(),
                        error: null,
                    },
                    {
                        name: "moderation",
                        status: "completed" as any,
                        progress: 100,
                        startedAt: new Date(),
                        completedAt: new Date(),
                        error: null,
                    },
                    {
                        name: "upload",
                        status: "completed" as any,
                        progress: 100,
                        startedAt: new Date(),
                        completedAt: new Date(),
                        error: null,
                    },
                    {
                        name: "embedding_generation",
                        status: "pending" as any,
                        progress: 0,
                        startedAt: new Date(),
                        completedAt: null,
                        error: null,
                    },
                ],
                error: null,
                startedAt: new Date(),
                completedAt: null,
                estimatedCompletion: null,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedAt: null,
            archivedAt: null,
            deletedAt: null,
        }
    }
}
