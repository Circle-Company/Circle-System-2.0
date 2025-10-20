import { Moment as DomainMoment } from "./entities/moment.entity"
import { MomentProps } from "./types"

// Interfaces para os modelos Sequelize
interface MomentModelAttributes {
    id: string | bigint
    ownerId: string | bigint
    description: string
    hashtags: string[]
    mentions: string[]
    publishedAt: Date | null
    archivedAt: Date | null
    deletedAt: Date | null
    createdAt: Date
    updatedAt: Date
}

interface MomentContentModelAttributes {
    id: string | bigint
    momentId: string | bigint
    duration: number
    size: number
    format: string
    hasAudio: boolean
    codec: string
    createdAt: Date
    updatedAt: Date
}

interface MomentResolutionModelAttributes {
    id: string | bigint
    contentId: string | bigint
    width: number
    height: number
    quality: string
    createdAt: Date
    updatedAt: Date
}

interface MomentStatusModelAttributes {
    id: string | bigint
    momentId: string | bigint
    current: string
    previousStatus: string | null
    reason: string | null
    changedBy: string | null
    changedAt: Date
    createdAt: Date
    updatedAt: Date
}

interface MomentVisibilityModelAttributes {
    id: string | bigint
    momentId: string | bigint
    level: string
    allowedUsers: string[]
    blockedUsers: string[]
    ageRestriction: boolean
    contentWarning: boolean
    createdAt: Date
    updatedAt: Date
}

interface MomentMetricsModelAttributes {
    id: string | bigint
    momentId: string | bigint
    totalViews: number
    totalClicks: number
    uniqueViews: number
    repeatViews: number
    completionViews: number
    averageWatchTime: number
    averageCompletionRate: number
    bounceRate: number
    totalLikes: number
    totalComments: number
    totalReports: number
    likeRate: number
    clickRate: number
    commentRate: number
    reportRate: number
    loadTime: number
    bufferTime: number
    errorRate: number
    viralScore: number
    totalReach: number
    contentQualityScore: number
    lastMetricsUpdate: Date
    metricsVersion: string
    dataQuality: number
    confidenceLevel: number
    createdAt: Date
    updatedAt: Date
}

interface MomentContextModelAttributes {
    id: string | bigint
    momentId: string | bigint
    createdAt: Date
    updatedAt: Date
}

interface MomentDeviceModelAttributes {
    id: string | bigint
    contextId: string | bigint
    type: string
    os: string
    osVersion: string
    model: string
    screenResolution: string
    orientation: string
    createdAt: Date
    updatedAt: Date
}

interface MomentLocationModelAttributes {
    id: string | bigint
    momentId: string | bigint
    latitude: number
    longitude: number
    accuracy?: number | null
    altitude?: number | null
    heading?: number | null
    speed?: number | null
    address?: string | null
    city?: string | null
    country?: string | null
    createdAt: Date
    updatedAt: Date
}

interface MomentProcessingModelAttributes {
    id: string | bigint
    momentId: string | bigint
    status: string
    progress: number
    error: string | null
    startedAt: Date | null
    completedAt: Date | null
    estimatedCompletion: Date | null
    createdAt: Date
    updatedAt: Date
}

interface MomentProcessingStepModelAttributes {
    id: string | bigint
    processingId: string | bigint
    name: string
    status: string
    progress: number
    startedAt: Date | null
    completedAt: Date | null
    error: string | null
    createdAt: Date
    updatedAt: Date
}

interface MomentEmbeddingModelAttributes {
    id: string | bigint
    momentId: string | bigint
    vector: string
    dimension: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface MomentMediaModelAttributes {
    id: string | bigint
    momentId: string | bigint
    url: string
    storageProvider: string
    bucket: string
    key: string
    region: string
    createdAt: Date
    updatedAt: Date
}

interface MomentThumbnailModelAttributes {
    id: string | bigint
    momentId: string | bigint
    url: string
    width: number
    height: number
    storageProvider: string
    bucket: string
    key: string
    region: string
    createdAt: Date
    updatedAt: Date
}

// Interface para o modelo completo com relacionamentos
interface CompleteMomentModel {
    id: string | bigint
    ownerId: string | bigint
    description: string
    hashtags: string[]
    mentions: string[]
    publishedAt: Date | null
    archivedAt: Date | null
    deletedAt: Date | null
    createdAt: Date
    updatedAt: Date
    content?: MomentContentModelAttributes & {
        resolution?: MomentResolutionModelAttributes
    }
    status?: MomentStatusModelAttributes
    visibility?: MomentVisibilityModelAttributes
    metrics?: MomentMetricsModelAttributes
    context?: MomentContextModelAttributes & {
        device?: MomentDeviceModelAttributes
        location?: MomentLocationModelAttributes
    }
    processing?: MomentProcessingModelAttributes & {
        steps?: MomentProcessingStepModelAttributes[]
    }
    embedding?: MomentEmbeddingModelAttributes
    media?: MomentMediaModelAttributes
    thumbnail?: MomentThumbnailModelAttributes
    location?: MomentLocationModelAttributes
}

export class MomentMapper {
    /**
     * Converte bigint para string
     */
    private static convertToString(value: string | bigint): string {
        return typeof value === "bigint" ? value.toString() : value
    }

    /**
     * Converte string para bigint
     */
    private static convertToBigInt(value: string | bigint): bigint {
        if (typeof value === "bigint") return value
        // Verifica se a string é um número válido
        if (/^\d+$/.test(value)) {
            return BigInt(value)
        }
        // Se não for um número, retorna 0n como fallback
        return 0n
    }

    /**
     * Converte modelo Sequelize completo para entidade de domínio
     */
    static toDomain(sequelizeMoment: CompleteMomentModel): DomainMoment {
        const momentData: MomentProps = {
            id: this.convertToString(sequelizeMoment.id),
            ownerId: this.convertToString(sequelizeMoment.ownerId),
            description: sequelizeMoment.description,
            hashtags: sequelizeMoment.hashtags || [],
            mentions: sequelizeMoment.mentions || [],
            publishedAt: sequelizeMoment.publishedAt,
            archivedAt: sequelizeMoment.archivedAt,
            deletedAt: sequelizeMoment.deletedAt,
            createdAt: sequelizeMoment.createdAt,
            updatedAt: sequelizeMoment.updatedAt,
            // Campos obrigatórios com valores padrão
            content: {
                duration: 0,
                size: 0,
                format: "mp4" as any,
                hasAudio: false,
                codec: "h264" as any,
                resolution: {
                    width: 0,
                    height: 0,
                    quality: "medium" as any,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        }

        // Mapear conteúdo
        if (sequelizeMoment.content) {
            momentData.content = {
                duration: sequelizeMoment.content.duration,
                size: sequelizeMoment.content.size,
                format: sequelizeMoment.content.format as any,
                hasAudio: sequelizeMoment.content.hasAudio,
                codec: sequelizeMoment.content.codec as any,
                resolution: {
                    width: sequelizeMoment.content.resolution?.width || 0,
                    height: sequelizeMoment.content.resolution?.height || 0,
                    quality: (sequelizeMoment.content.resolution?.quality as any) || "medium",
                },
                createdAt: sequelizeMoment.content.createdAt,
                updatedAt: sequelizeMoment.content.updatedAt,
            }
        }

        // Mapear status
        if (sequelizeMoment.status) {
            momentData.status = {
                current: sequelizeMoment.status.current as any,
                previous: sequelizeMoment.status.previousStatus as any,
                reason: sequelizeMoment.status.reason,
                changedBy: sequelizeMoment.status.changedBy,
                changedAt: sequelizeMoment.status.changedAt,
                createdAt: sequelizeMoment.status.createdAt,
                updatedAt: sequelizeMoment.status.updatedAt,
            }
        }

        // Mapear visibilidade
        if (sequelizeMoment.visibility) {
            momentData.visibility = {
                level: sequelizeMoment.visibility.level as any,
                allowedUsers: sequelizeMoment.visibility.allowedUsers || [],
                blockedUsers: sequelizeMoment.visibility.blockedUsers || [],
                ageRestriction: sequelizeMoment.visibility.ageRestriction,
                contentWarning: sequelizeMoment.visibility.contentWarning,
                createdAt: sequelizeMoment.visibility.createdAt,
                updatedAt: sequelizeMoment.visibility.updatedAt,
            }
        }

        // Mapear métricas
        if (sequelizeMoment.metrics) {
            momentData.metrics = {
                views: {
                    totalViews: sequelizeMoment.metrics.totalViews,
                    uniqueViews: sequelizeMoment.metrics.uniqueViews,
                    completionViews: sequelizeMoment.metrics.completionViews,
                    averageWatchTime: sequelizeMoment.metrics.averageWatchTime,
                    averageCompletionRate: sequelizeMoment.metrics.averageCompletionRate,
                    viewsByCountry: {},
                    viewsByRegion: {},
                    viewsByCity: {},
                    viewsByDevice: {},
                    peakViewTime: null,
                    lastViewTime: null,
                },
                engagement: {
                    totalClicks: sequelizeMoment.metrics.totalClicks,
                    clickRate: sequelizeMoment.metrics.clickRate,
                    totalLikes: sequelizeMoment.metrics.totalLikes,
                    totalComments: sequelizeMoment.metrics.totalComments,
                    totalReports: sequelizeMoment.metrics.totalReports,
                    likeRate: sequelizeMoment.metrics.likeRate,
                    commentRate: sequelizeMoment.metrics.commentRate,
                    reportRate: sequelizeMoment.metrics.reportRate,
                    averageCommentLength: 0,
                    topCommenters: [],
                    engagementScore: 0,
                    lastEngagementTime: null,
                },
                performance: {
                    loadTime: sequelizeMoment.metrics.loadTime,
                    bufferTime: sequelizeMoment.metrics.bufferTime,
                    errorRate: sequelizeMoment.metrics.errorRate,
                    successRate: 100 - sequelizeMoment.metrics.errorRate,
                    averageQuality: 0,
                    qualityDistribution: {},
                    bandwidthUsage: 0,
                    serverResponseTime: 0,
                    cdnHitRate: 0,
                    lastPerformanceUpdate: null,
                },
                viral: {
                    viralScore: sequelizeMoment.metrics.viralScore,
                    viralReach: sequelizeMoment.metrics.totalReach, // Usar totalReach como viralReach
                    reachByPlatform: {},
                    reachByUserType: {},
                    viralCoefficient: 0,
                    viralVelocity: 0,
                    peakViralTime: null,
                    viralDecayRate: 0,
                    lastViralUpdate: null,
                },
                audience: {
                    demographics: {
                        ageGroups: {},
                        genders: {},
                        locations: {},
                        interests: {},
                    },
                    behavior: {
                        averageSessionTime: 0,
                        bounceRate: sequelizeMoment.metrics.bounceRate,
                        returnRate: 0,
                        engagementDepth: 0,
                        contentPreference: {},
                    },
                    growth: {
                        followerGrowth: 0,
                        subscriberGrowth: 0,
                        engagementGrowth: 0,
                        reachGrowth: 0,
                    },
                    lastAudienceUpdate: null,
                },
                content: {
                    qualityScore: sequelizeMoment.metrics.contentQualityScore,
                    contentRating: 0,
                    moderationScore: 0,
                    accessibilityScore: 0,
                    seoScore: 0,
                    contentTags: [],
                    contentCategories: [],
                    contentSentiment: 0,
                    contentComplexity: 0,
                    lastContentUpdate: null,
                },
                lastMetricsUpdate: sequelizeMoment.metrics.lastMetricsUpdate,
                metricsVersion: sequelizeMoment.metrics.metricsVersion,
                dataQuality: sequelizeMoment.metrics.dataQuality,
                confidenceLevel: sequelizeMoment.metrics.confidenceLevel,
            }
        }

        // Mapear contexto
        if (sequelizeMoment.context) {
            momentData.context = {
                device: sequelizeMoment.context.device || {
                    type: "unknown",
                    os: "unknown",
                    osVersion: "unknown",
                    model: "unknown",
                    screenResolution: "unknown",
                    orientation: "unknown",
                },
                location: sequelizeMoment.context.location || {
                    latitude: 0,
                    longitude: 0,
                },
            }
        }

        // Mapear processamento
        if (sequelizeMoment.processing) {
            momentData.processing = {
                status: sequelizeMoment.processing.status as any,
                progress: sequelizeMoment.processing.progress,
                steps: (sequelizeMoment.processing.steps || []).map((step) => ({
                    name: step.name,
                    status: step.status as any,
                    progress: step.progress,
                    startedAt: step.startedAt,
                    completedAt: step.completedAt,
                    error: step.error,
                })),
                error: sequelizeMoment.processing.error,
                startedAt: sequelizeMoment.processing.startedAt,
                completedAt: sequelizeMoment.processing.completedAt,
                estimatedCompletion: sequelizeMoment.processing.estimatedCompletion,
            }
        }

        // Mapear embedding
        if (sequelizeMoment.embedding) {
            momentData.embedding = {
                vector: sequelizeMoment.embedding.vector,
                dimension: sequelizeMoment.embedding.dimension,
                metadata: sequelizeMoment.embedding.metadata || {},
                createdAt: sequelizeMoment.embedding.createdAt,
                updatedAt: sequelizeMoment.embedding.updatedAt,
            }
        }

        // Mapear mídia
        if (sequelizeMoment.media) {
            momentData.media = {
                url: sequelizeMoment.media.url,
                storage: {
                    provider: sequelizeMoment.media.storageProvider as any,
                    bucket: sequelizeMoment.media.bucket,
                    key: sequelizeMoment.media.key,
                    region: sequelizeMoment.media.region,
                },
                createdAt: sequelizeMoment.media.createdAt,
                updatedAt: sequelizeMoment.media.updatedAt,
            }
        }

        // Mapear thumbnail
        if (sequelizeMoment.thumbnail) {
            momentData.thumbnail = {
                url: sequelizeMoment.thumbnail.url,
                width: sequelizeMoment.thumbnail.width,
                height: sequelizeMoment.thumbnail.height,
                storage: {
                    provider: sequelizeMoment.thumbnail.storageProvider as any,
                    bucket: sequelizeMoment.thumbnail.bucket,
                    key: sequelizeMoment.thumbnail.key,
                    region: sequelizeMoment.thumbnail.region,
                },
                createdAt: sequelizeMoment.thumbnail.createdAt,
                updatedAt: sequelizeMoment.thumbnail.updatedAt,
            }
        }

        // Mapear localização (se existir no contexto)
        if (sequelizeMoment.context?.location) {
            momentData.location = {
                latitude: sequelizeMoment.context.location.latitude,
                longitude: sequelizeMoment.context.location.longitude,
            }
        }

        return new DomainMoment(momentData)
    }

    /**
     * Converte entidade de domínio para atributos do modelo Moment principal
     */
    static toMomentModelAttributes(domainMoment: DomainMoment): MomentModelAttributes {
        const momentData = domainMoment.toEntity()

        return {
            id: this.convertToBigInt(momentData.id),
            ownerId: this.convertToBigInt(momentData.ownerId),
            description: momentData.description,
            hashtags: momentData.hashtags,
            mentions: momentData.mentions,
            publishedAt: momentData.publishedAt,
            archivedAt: momentData.archivedAt,
            deletedAt: momentData.deletedAt,
            createdAt: momentData.createdAt,
            updatedAt: momentData.updatedAt,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentContent
     */
    static toMomentContentAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentContentModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.content) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
            duration: momentData.content.duration,
            size: momentData.content.size,
            format: momentData.content.format,
            hasAudio: momentData.content.hasAudio,
            codec: momentData.content.codec,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentResolution
     */
    static toMomentResolutionAttributes(
        domainMoment: DomainMoment,
    ): Omit<
        MomentResolutionModelAttributes,
        "id" | "contentId" | "createdAt" | "updatedAt"
    > | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.content?.resolution) return null

        return {
            width: momentData.content.resolution.width,
            height: momentData.content.resolution.height,
            quality: momentData.content.resolution.quality,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentStatus
     */
    static toMomentStatusAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentStatusModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.status) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
            current: momentData.status.current,
            previousStatus: momentData.status.previous,
            reason: momentData.status.reason,
            changedBy: momentData.status.changedBy,
            changedAt: momentData.status.changedAt,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentVisibility
     */
    static toMomentVisibilityAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentVisibilityModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.visibility) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
            level: momentData.visibility.level,
            allowedUsers: momentData.visibility.allowedUsers,
            blockedUsers: momentData.visibility.blockedUsers,
            ageRestriction: momentData.visibility.ageRestriction,
            contentWarning: momentData.visibility.contentWarning,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentMetrics
     */
    static toMomentMetricsAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentMetricsModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.metrics) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
            totalViews: momentData.metrics.views.totalViews,
            totalClicks: momentData.metrics.engagement.totalClicks,
            uniqueViews: momentData.metrics.views.uniqueViews,
            repeatViews: 0, // Campo mantido para compatibilidade, mas não é mais usado
            completionViews: momentData.metrics.views.completionViews,
            averageWatchTime: momentData.metrics.views.averageWatchTime,
            averageCompletionRate: momentData.metrics.views.averageCompletionRate,
            bounceRate: momentData.metrics.audience.behavior.bounceRate,
            totalLikes: momentData.metrics.engagement.totalLikes,
            totalComments: momentData.metrics.engagement.totalComments,
            totalReports: momentData.metrics.engagement.totalReports,
            likeRate: momentData.metrics.engagement.likeRate,
            clickRate: momentData.metrics.engagement.clickRate,
            commentRate: momentData.metrics.engagement.commentRate,
            reportRate: momentData.metrics.engagement.reportRate,
            loadTime: momentData.metrics.performance.loadTime,
            bufferTime: momentData.metrics.performance.bufferTime,
            errorRate: momentData.metrics.performance.errorRate,
            viralScore: momentData.metrics.viral.viralScore,
            totalReach: momentData.metrics.viral.viralReach, // Usar viralReach como totalReach
            contentQualityScore: momentData.metrics.content.qualityScore,
            lastMetricsUpdate: momentData.metrics.lastMetricsUpdate,
            metricsVersion: momentData.metrics.metricsVersion,
            dataQuality: momentData.metrics.dataQuality,
            confidenceLevel: momentData.metrics.confidenceLevel,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentContext
     */
    static toMomentContextAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentContextModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.context) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentDevice
     */
    static toMomentDeviceAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentDeviceModelAttributes, "id" | "contextId" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.context?.device) return null

        return {
            type: momentData.context.device.type,
            os: momentData.context.device.os,
            osVersion: momentData.context.device.osVersion,
            model: momentData.context.device.model,
            screenResolution: momentData.context.device.screenResolution,
            orientation: momentData.context.device.orientation,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentLocation
     */
    static toMomentLocationAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentLocationModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        // A localização está no contexto, não diretamente na entidade
        if (!momentData.context?.location) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
            latitude: momentData.context.location.latitude,
            longitude: momentData.context.location.longitude,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentProcessing
     */
    static toMomentProcessingAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentProcessingModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.processing) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
            status: momentData.processing.status,
            progress: momentData.processing.progress,
            error: momentData.processing.error,
            startedAt: momentData.processing.startedAt,
            completedAt: momentData.processing.completedAt,
            estimatedCompletion: momentData.processing.estimatedCompletion,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentProcessingStep
     */
    static toMomentProcessingStepAttributes(
        domainMoment: DomainMoment,
    ): Omit<
        MomentProcessingStepModelAttributes,
        "id" | "processingId" | "createdAt" | "updatedAt"
    >[] {
        const momentData = domainMoment.toEntity()

        if (!momentData.processing?.steps) return []

        return momentData.processing.steps.map((step) => ({
            name: step.name,
            status: step.status,
            progress: step.progress,
            startedAt: step.startedAt,
            completedAt: step.completedAt,
            error: step.error,
        }))
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentEmbedding
     */
    static toMomentEmbeddingAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentEmbeddingModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.embedding) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
            vector: momentData.embedding.vector,
            dimension: momentData.embedding.dimension,
            metadata: momentData.embedding.metadata,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentMedia
     */
    static toMomentMediaAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentMediaModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.media) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
            url: momentData.media.url,
            storageProvider: momentData.media.storage.provider,
            bucket: momentData.media.storage.bucket,
            key: momentData.media.storage.key,
            region: momentData.media.storage.region,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo MomentThumbnail
     */
    static toMomentThumbnailAttributes(
        domainMoment: DomainMoment,
    ): Omit<MomentThumbnailModelAttributes, "id" | "createdAt" | "updatedAt"> | null {
        const momentData = domainMoment.toEntity()

        if (!momentData.thumbnail) return null

        return {
            momentId: this.convertToBigInt(momentData.id),
            url: momentData.thumbnail.url,
            width: momentData.thumbnail.width,
            height: momentData.thumbnail.height,
            storageProvider: momentData.thumbnail.storage.provider,
            bucket: momentData.thumbnail.storage.bucket,
            key: momentData.thumbnail.storage.key,
            region: momentData.thumbnail.storage.region,
        }
    }

    /**
     * Converte múltiplos modelos Sequelize para array de entidades de domínio
     */
    static toDomainArray(sequelizeMoments: CompleteMomentModel[]): DomainMoment[] {
        return sequelizeMoments.map((moment) => this.toDomain(moment))
    }
}
