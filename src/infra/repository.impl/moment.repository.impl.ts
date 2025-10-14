import {
    IMomentAnalytics,
    IMomentFilters,
    IMomentRepository,
    IMomentRepositoryStats,
    Moment,
} from "../../domain/moment"
// Importar as interfaces corretas das métricas
import { generateId } from "@/shared"
import { Op, WhereOptions } from "sequelize"

export class MomentRepositoryImpl implements IMomentRepository {
    constructor(private database: any) {}

    // ===== OPERAÇÕES BÁSICAS CRUD =====

    async create(moment: Moment): Promise<Moment> {
        const transaction = await this.database.getConnection().transaction()

        try {
            // Criar momento principal
            const momentData = moment.toEntity()
            await this.database.getConnection().models.Moment.create(
                {
                    id: momentData.id,
                    ownerId: momentData.ownerId,
                    description: momentData.description,
                    hashtags: momentData.hashtags,
                    mentions: momentData.mentions,
                    publishedAt: momentData.publishedAt,
                    archivedAt: momentData.archivedAt,
                    deletedAt: momentData.deletedAt,
                },
                { transaction },
            )

            // Criar conteúdo
            if (momentData.content) {
                const contentId = generateId()
                await this.database.getConnection().models.MomentContent.create(
                    {
                        id: contentId,
                        momentId: momentData.id,
                        duration: momentData.content.duration,
                        size: momentData.content.size,
                        format: momentData.content.format,
                        hasAudio: momentData.content.hasAudio,
                        codec: momentData.content.codec,
                    },
                    { transaction },
                )

                // Criar resolução
                if (momentData.content.resolution) {
                    await this.database.getConnection().models.MomentResolution.create(
                        {
                            id: generateId(),
                            contentId: contentId,
                            width: momentData.content.resolution.width,
                            height: momentData.content.resolution.height,
                            quality: momentData.content.resolution.quality,
                        },
                        { transaction },
                    )
                }
            }

            // Criar status
            if (momentData.status) {
                await this.database.getConnection().models.MomentStatus.create(
                    {
                        id: generateId(),
                        momentId: momentData.id,
                        current: momentData.status.current,
                        previousStatus: momentData.status.previous,
                        reason: momentData.status.reason,
                        changedBy: momentData.status.changedBy,
                        changedAt: momentData.status.changedAt,
                    },
                    { transaction },
                )
            }

            // Criar visibilidade
            if (momentData.visibility) {
                await this.database.getConnection().models.MomentVisibility.create(
                    {
                        id: generateId(),
                        momentId: momentData.id,
                        level: momentData.visibility.level,
                        allowedUsers: momentData.visibility.allowedUsers,
                        blockedUsers: momentData.visibility.blockedUsers,
                        ageRestriction: momentData.visibility.ageRestriction,
                        contentWarning: momentData.visibility.contentWarning,
                    },
                    { transaction },
                )
            }

            // Criar métricas
            if (momentData.metrics) {
                await this.database.getConnection().models.MomentMetrics.create(
                    {
                        id: generateId(),
                        momentId: momentData.id,
                        totalViews: momentData.metrics.views.totalViews,
                        uniqueViews: momentData.metrics.views.uniqueViews,
                        repeatViews: (momentData.metrics.views as any).repeatViews || 0,
                        completionViews: momentData.metrics.views.completionViews,
                        averageWatchTime: momentData.metrics.views.averageWatchTime,
                        averageCompletionRate: momentData.metrics.views.averageCompletionRate,
                        bounceRate: (momentData.metrics.views as any).bounceRate || 0,
                        totalLikes: momentData.metrics.engagement.totalLikes,
                        totalComments: momentData.metrics.engagement.totalComments,
                        totalReports: momentData.metrics.engagement.totalReports,
                        likeRate: momentData.metrics.engagement.likeRate,
                        commentRate: momentData.metrics.engagement.commentRate,
                        reportRate: momentData.metrics.engagement.reportRate,
                        loadTime: momentData.metrics.performance.loadTime,
                        bufferTime: momentData.metrics.performance.bufferTime,
                        errorRate: momentData.metrics.performance.errorRate,
                        qualitySwitches:
                            (momentData.metrics.performance as any).qualitySwitches || 0,
                        viralScore: momentData.metrics.viral.viralScore,
                        trendingScore: (momentData.metrics.viral as any).trendingScore || 0,
                        reachScore: (momentData.metrics.viral as any).reachScore || 0,
                        influenceScore: (momentData.metrics.viral as any).influenceScore || 0,
                        growthRate: (momentData.metrics.viral as any).growthRate || 0,
                        totalReach: (momentData.metrics.viral as any).totalReach || 0,
                        contentQualityScore:
                            (momentData.metrics.content as any).contentQualityScore || 0,
                        audioQualityScore:
                            (momentData.metrics.content as any).audioQualityScore || 0,
                        videoQualityScore:
                            (momentData.metrics.content as any).videoQualityScore || 0,
                        faceDetectionRate:
                            (momentData.metrics.content as any).faceDetectionRate || 0,
                        lastMetricsUpdate: momentData.metrics.lastMetricsUpdate,
                        metricsVersion: momentData.metrics.metricsVersion,
                        dataQuality: momentData.metrics.dataQuality,
                        confidenceLevel: momentData.metrics.confidenceLevel,
                    },
                    { transaction },
                )
            }

            // Criar contexto
            if (momentData.context) {
                const contextId = generateId()
                const context = await this.database.getConnection().models.MomentContext.create(
                    {
                        id: contextId,
                        momentId: momentData.id,
                    },
                    { transaction },
                )

                // Criar dispositivo
                if (momentData.context.device) {
                    await this.database.getConnection().models.MomentDevice.create(
                        {
                            id: generateId(),
                            contextId: context.id,
                            type: momentData.context.device.type,
                            os: momentData.context.device.os,
                            osVersion: momentData.context.device.osVersion,
                            model: momentData.context.device.model,
                            screenResolution: momentData.context.device.screenResolution,
                            orientation: momentData.context.device.orientation,
                        },
                        { transaction },
                    )
                }
            }

            // Criar processamento
            if (momentData.processing) {
                const processingId = generateId()
                const processing = await this.database
                    .getConnection()
                    .models.MomentProcessing.create(
                        {
                            id: processingId,
                            momentId: momentData.id,
                            status: momentData.processing.status,
                            progress: momentData.processing.progress,
                            error: momentData.processing.error,
                            startedAt: momentData.processing.startedAt,
                            completedAt: momentData.processing.completedAt,
                            estimatedCompletion: momentData.processing.estimatedCompletion,
                        },
                        { transaction },
                    )

                // Criar passos de processamento
                for (const step of momentData.processing.steps) {
                    await this.database.getConnection().models.MomentProcessingStep.create(
                        {
                            id: generateId(),
                            processingId: processing.id,
                            name: step.name,
                            status: step.status,
                            progress: step.progress,
                            startedAt: step.startedAt,
                            completedAt: step.completedAt,
                            error: step.error,
                        },
                        { transaction },
                    )
                }
            }

            // Criar embedding
            if (momentData.embedding) {
                await this.database.getConnection().models.MomentEmbedding.create(
                    {
                        id: generateId(),
                        momentId: momentData.id,
                        vector: momentData.embedding.vector,
                        dimension: momentData.embedding.dimension,
                        metadata: momentData.embedding.metadata,
                    },
                    { transaction },
                )
            }

            // Criar mídia
            if (momentData.media) {
                await this.database.getConnection().models.MomentMedia.create(
                    {
                        id: generateId(),
                        momentId: momentData.id,
                        lowUrl: momentData.media.urls.low,
                        mediumUrl: momentData.media.urls.medium,
                        highUrl: momentData.media.urls.high,
                        storageProvider: momentData.media.storage.provider,
                        bucket: momentData.media.storage.bucket,
                        key: momentData.media.storage.key,
                        region: momentData.media.storage.region,
                    },
                    { transaction },
                )
            }

            // Criar thumbnail
            if (momentData.thumbnail) {
                await this.database.getConnection().models.MomentThumbnail.create(
                    {
                        id: generateId(),
                        momentId: momentData.id,
                        url: momentData.thumbnail.url,
                        width: momentData.thumbnail.width,
                        height: momentData.thumbnail.height,
                        storageProvider: momentData.thumbnail.storage.provider,
                        bucket: momentData.thumbnail.storage.bucket,
                        key: momentData.thumbnail.storage.key,
                        region: momentData.thumbnail.storage.region,
                    },
                    { transaction },
                )
            }

            // Criar localização
            if (momentData.context.location) {
                await this.database.getConnection().models.MomentLocation.create(
                    {
                        id: generateId(),
                        momentId: momentData.id,
                        latitude: momentData.context.location.latitude,
                        longitude: momentData.context.location.longitude,
                    },
                    { transaction },
                )
            }

            await transaction.commit()
            return moment
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async findById(id: string): Promise<Moment | null> {
        const moment = await this.database.getConnection().models.Moment.findByPk(id, {
            include: [
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentResolution, as: "resolution" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
                { model: this.database.getConnection().models.MomentContext, as: "context" },
                { model: this.database.getConnection().models.MomentDevice, as: "device" },
                { model: this.database.getConnection().models.MomentProcessing, as: "processing" },
                { model: this.database.getConnection().models.MomentProcessingStep, as: "steps" },
                { model: this.database.getConnection().models.MomentEmbedding, as: "embedding" },
                { model: this.database.getConnection().models.MomentMedia, as: "media" },
                { model: this.database.getConnection().models.MomentThumbnail, as: "thumbnail" },
                { model: this.database.getConnection().models.MomentLocation, as: "location" },
            ],
        })

        if (!moment) return null

        return this.mapToDomainEntity(moment)
    }

    async update(moment: Moment): Promise<Moment> {
        const momentData = moment.toEntity()

        await this.database.getConnection().models.Moment.update(
            {
                description: momentData.description,
                hashtags: momentData.hashtags,
                mentions: momentData.mentions,
                publishedAt: momentData.publishedAt,
                archivedAt: momentData.archivedAt,
                deletedAt: momentData.deletedAt,
            },
            { where: { id: momentData.id } },
        )

        // Atualizar métricas se existirem
        if (momentData.metrics) {
            await this.database.getConnection().models.MomentMetrics.update(
                {
                    totalViews: momentData.metrics.views.totalViews,
                    uniqueViews: momentData.metrics.views.uniqueViews,
                    repeatViews: (momentData.metrics.views as any).repeatViews || 0,
                    completionViews: momentData.metrics.views.completionViews,
                    averageWatchTime: momentData.metrics.views.averageWatchTime,
                    averageCompletionRate: momentData.metrics.views.averageCompletionRate,
                    bounceRate: (momentData.metrics.views as any).bounceRate || 0,
                    totalLikes: momentData.metrics.engagement.totalLikes,
                    totalComments: momentData.metrics.engagement.totalComments,
                    totalReports: momentData.metrics.engagement.totalReports,
                    likeRate: momentData.metrics.engagement.likeRate,
                    commentRate: momentData.metrics.engagement.commentRate,
                    reportRate: momentData.metrics.engagement.reportRate,
                    viralScore: momentData.metrics.viral.viralScore,
                    trendingScore: (momentData.metrics.viral as any).trendingScore || 0,
                    reachScore: (momentData.metrics.viral as any).reachScore || 0,
                    influenceScore: (momentData.metrics.viral as any).influenceScore || 0,
                    growthRate: (momentData.metrics.viral as any).growthRate || 0,
                    totalReach: (momentData.metrics.viral as any).totalReach || 0,
                    contentQualityScore:
                        (momentData.metrics.content as any).contentQualityScore || 0,
                    audioQualityScore: (momentData.metrics.content as any).audioQualityScore || 0,
                    videoQualityScore: (momentData.metrics.content as any).videoQualityScore || 0,
                    faceDetectionRate: (momentData.metrics.content as any).faceDetectionRate || 0,
                    lastMetricsUpdate: momentData.metrics.lastMetricsUpdate,
                    dataQuality: momentData.metrics.dataQuality,
                    confidenceLevel: momentData.metrics.confidenceLevel,
                },
                { where: { momentId: momentData.id } },
            )
        }

        return moment
    }

    async delete(id: string): Promise<void> {
        await this.database.getConnection().models.Moment.destroy({ where: { id } })
    }

    // ===== OPERAÇÕES DE BUSCA =====

    async findByOwnerId(ownerId: string, limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            where: { ownerId },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    async findByStatus(status: string, limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            include: [
                {
                    model: this.database.getConnection().models.MomentStatus,
                    as: "status",
                    where: { current: status },
                },
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    async findByVisibility(visibility: string, limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            include: [
                {
                    model: this.database.getConnection().models.MomentVisibility,
                    as: "visibility",
                    where: { level: visibility },
                },
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    async findByHashtag(hashtag: string, limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            where: {
                hashtags: {
                    [Op.contains]: [hashtag],
                },
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    async findByMention(mention: string, limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            where: {
                mentions: {
                    [Op.contains]: [mention],
                },
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    // ===== OPERAÇÕES DE BUSCA AVANÇADA =====

    async search(query: string, limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            where: {
                [Op.or]: [
                    { description: { [Op.iLike]: `%${query}%` } },
                    { hashtags: { [Op.contains]: [query] } },
                    { mentions: { [Op.contains]: [query] } },
                ],
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    async fullTextSearch(query: string, limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            where: {
                [Op.or]: [
                    {
                        description: {
                            [Op.match]: query,
                        },
                    },
                    {
                        hashtags: {
                            [Op.contains]: [query],
                        },
                    },
                    {
                        mentions: {
                            [Op.contains]: [query],
                        },
                    },
                ],
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    async fullTextSearchWithRanking(
        query: string,
        limit = 20,
        offset = 0,
    ): Promise<Array<Moment & { relevance: number }>> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            attributes: [
                "*",
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "ts_rank",
                            this.database.getConnection().models.sequelize.col("description"),
                            this.database
                                .getConnection()
                                .models.sequelize.literal(
                                    `plainto_tsquery('portuguese', '${query}')`,
                                ),
                        ),
                    "relevance",
                ],
            ],
            where: {
                [Op.or]: [
                    {
                        description: {
                            [Op.match]: this.database
                                .getConnection()
                                .models.sequelize.literal(
                                    `plainto_tsquery('portuguese', '${query}')`,
                                ),
                        },
                    },
                    {
                        hashtags: {
                            [Op.contains]: [query],
                        },
                    },
                    {
                        mentions: {
                            [Op.contains]: [query],
                        },
                    },
                ],
            },
            limit,
            offset,
            order: [
                [this.database.getConnection().models.sequelize.literal("relevance"), "DESC"],
                ["createdAt", "DESC"],
            ],
            include: [
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
        })

        return moments.map((moment: any) => ({
            ...this.mapToDomainEntity(moment),
            relevance: parseFloat(moment.dataValues.relevance) || 0,
        }))
    }

    async findPublished(limit = 20, offset = 0): Promise<Moment[]> {
        return this.findByStatus("published", limit, offset)
    }

    async findRecent(limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            include: [
                {
                    model: this.database.getConnection().models.MomentStatus,
                    as: "status",
                    where: { current: "published" },
                },
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
            limit,
            offset,
            order: [["publishedAt", "DESC"]],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    // ===== OPERAÇÕES DE BUSCA ESPACIAL =====

    async findByLocation(
        latitude: number,
        longitude: number,
        radiusKm: number,
        limit = 20,
        offset = 0,
    ): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            include: [
                {
                    model: this.database.getConnection().models.MomentLocation,
                    as: "location",
                    where: this.database.getConnection().models.sequelize.where(
                        this.database.getConnection().models.sequelize.fn(
                            "ST_DWithin",
                            this.database
                                .getConnection()
                                .models.sequelize.fn("ST_Point", longitude, latitude),
                            this.database
                                .getConnection()
                                .models.sequelize.fn(
                                    "ST_Point",
                                    this.database
                                        .getConnection()
                                        .models.sequelize.col("location.longitude"),
                                    this.database
                                        .getConnection()
                                        .models.sequelize.col("location.latitude"),
                                ),
                            radiusKm * 1000, // Converter km para metros
                        ),
                        true,
                    ),
                },
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    async findByLocationWithDistance(
        latitude: number,
        longitude: number,
        radiusKm: number,
        limit = 20,
        offset = 0,
    ): Promise<Array<Moment & { distance: number }>> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            attributes: [
                "*",
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "ST_Distance",
                            this.database
                                .getConnection()
                                .models.sequelize.fn("ST_Point", longitude, latitude),
                            this.database
                                .getConnection()
                                .models.sequelize.fn(
                                    "ST_Point",
                                    this.database
                                        .getConnection()
                                        .models.sequelize.col("location.longitude"),
                                    this.database
                                        .getConnection()
                                        .models.sequelize.col("location.latitude"),
                                ),
                        ),
                    "distance",
                ],
            ],
            include: [
                {
                    model: this.database.getConnection().models.MomentLocation,
                    as: "location",
                    where: this.database.getConnection().models.sequelize.where(
                        this.database.getConnection().models.sequelize.fn(
                            "ST_DWithin",
                            this.database
                                .getConnection()
                                .models.sequelize.fn("ST_Point", longitude, latitude),
                            this.database
                                .getConnection()
                                .models.sequelize.fn(
                                    "ST_Point",
                                    this.database
                                        .getConnection()
                                        .models.sequelize.col("location.longitude"),
                                    this.database
                                        .getConnection()
                                        .models.sequelize.col("location.latitude"),
                                ),
                            radiusKm * 1000, // Converter km para metros
                        ),
                        true,
                    ),
                },
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
            limit,
            offset,
            order: [
                [this.database.getConnection().models.sequelize.literal("distance"), "ASC"],
                ["createdAt", "DESC"],
            ],
        })

        return moments.map((moment: any) => ({
            ...this.mapToDomainEntity(moment),
            distance: parseFloat(moment.dataValues.distance) / 1000, // Converter metros para km
        }))
    }

    async findByBoundingBox(
        minLat: number,
        minLng: number,
        maxLat: number,
        maxLng: number,
        limit = 20,
        offset = 0,
    ): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            include: [
                {
                    model: this.database.getConnection().models.MomentLocation,
                    as: "location",
                    where: {
                        latitude: {
                            [Op.between]: [minLat, maxLat],
                        },
                        longitude: {
                            [Op.between]: [minLng, maxLng],
                        },
                    },
                },
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    async findNearbyMoments(
        latitude: number,
        longitude: number,
        limit = 20,
        offset = 0,
    ): Promise<Array<Moment & { distance: number }>> {
        // Buscar momentos em um raio padrão de 50km
        const defaultRadiusKm = 50
        return this.findByLocationWithDistance(latitude, longitude, defaultRadiusKm, limit, offset)
    }

    // ===== OPERAÇÕES DE PROCESSAMENTO =====

    async findPendingProcessing(limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            include: [
                {
                    model: this.database.getConnection().models.MomentProcessing,
                    as: "processing",
                    where: { status: "pending" },
                },
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    async findFailedProcessing(limit = 20, offset = 0): Promise<Moment[]> {
        const moments = await this.database.getConnection().models.Moment.findAll({
            include: [
                {
                    model: this.database.getConnection().models.MomentProcessing,
                    as: "processing",
                    where: { status: "failed" },
                },
                { model: this.database.getConnection().models.MomentContent, as: "content" },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return moments.map((moment: any) => this.mapToDomainEntity(moment))
    }

    // ===== OPERAÇÕES DE CONTAGEM =====

    async countByOwnerId(ownerId: string): Promise<number> {
        return this.database.getConnection().models.Moment.count({ where: { ownerId } })
    }

    async countByStatus(status: string): Promise<number> {
        return this.database.getConnection().models.Moment.count({
            include: [
                {
                    model: this.database.getConnection().models.MomentStatus,
                    as: "status",
                    where: { current: status },
                },
            ],
        })
    }

    async countByVisibility(visibility: string): Promise<number> {
        return this.database.getConnection().models.Moment.count({
            include: [
                {
                    model: this.database.getConnection().models.MomentVisibility,
                    as: "visibility",
                    where: { level: visibility },
                },
            ],
        })
    }

    async countPublished(): Promise<number> {
        return this.countByStatus("published")
    }

    // ===== OPERAÇÕES DE EXISTÊNCIA =====

    async exists(id: string): Promise<boolean> {
        const count = await this.database.getConnection().models.Moment.count({ where: { id } })
        return count > 0
    }

    async existsByOwnerId(ownerId: string): Promise<boolean> {
        const count = await this.countByOwnerId(ownerId)
        return count > 0
    }

    // ===== OPERAÇÕES EM LOTE =====

    async createMany(moments: Moment[]): Promise<Moment[]> {
        const createdMoments: Moment[] = []
        for (const moment of moments) {
            const created = await this.create(moment)
            createdMoments.push(created)
        }
        return createdMoments
    }

    async updateMany(moments: Moment[]): Promise<Moment[]> {
        const updatedMoments: Moment[] = []
        for (const moment of moments) {
            const updated = await this.update(moment)
            updatedMoments.push(updated)
        }
        return updatedMoments
    }

    async deleteMany(ids: string[]): Promise<void> {
        await this.database
            .getConnection()
            .models.Moment.destroy({ where: { id: { [Op.in]: ids } } })
    }

    // ===== OPERAÇÕES DE PAGINAÇÃO =====

    async findPaginated(
        page: number,
        limit: number,
        filters?: IMomentFilters,
    ): Promise<{
        moments: Moment[]
        total: number
        page: number
        limit: number
        totalPages: number
    }> {
        const where: WhereOptions = {}
        const include: any[] = []

        // Aplicar filtros
        if (filters) {
            if (filters.ownerId) {
                where.ownerId = filters.ownerId
            }

            if (filters.status) {
                include.push({
                    model: this.database.getConnection().models.MomentStatus,
                    as: "status",
                    where: { current: filters.status },
                })
            }

            if (filters.visibility) {
                include.push({
                    model: this.database.getConnection().models.MomentVisibility,
                    as: "visibility",
                    where: { level: filters.visibility },
                })
            }

            if (filters.hashtags && filters.hashtags.length > 0) {
                where.hashtags = {
                    [Op.contains]: filters.hashtags,
                }
            }

            if (filters.mentions && filters.mentions.length > 0) {
                where.mentions = {
                    [Op.contains]: filters.mentions,
                }
            }

            if (filters.publishedAfter || filters.publishedBefore) {
                where.publishedAt = {} as any
                if (filters.publishedAfter) {
                    where.publishedAt[Op.gte] = filters.publishedAfter
                }
                if (filters.publishedBefore) {
                    where.publishedAt[Op.lte] = filters.publishedBefore
                }
            }

            if (filters.searchQuery) {
                ;(where as any)[Op.or] = [
                    { description: { [Op.iLike]: `%${filters.searchQuery}%` } },
                    { hashtags: { [Op.contains]: [filters.searchQuery] } },
                    { mentions: { [Op.contains]: [filters.searchQuery] } },
                ]
            }
        }

        // Incluir modelos relacionados
        include.push(
            { model: this.database.getConnection().models.MomentContent, as: "content" },
            { model: this.database.getConnection().models.MomentStatus, as: "status" },
            { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
            { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
        )

        const offset = (page - 1) * limit

        const { count, rows } = await this.database.getConnection().models.Moment.findAndCountAll({
            where,
            include,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        const moments = rows.map((moment: any) => this.mapToDomainEntity(moment))
        const totalPages = Math.ceil(count / limit)

        return {
            moments,
            total: count,
            page,
            limit,
            totalPages,
        }
    }

    // ===== ANÁLISE E ESTATÍSTICAS =====

    async getAnalytics(): Promise<IMomentAnalytics> {
        const totalMoments = await this.database.getConnection().models.Moment.count()
        const publishedMoments = await this.countByStatus("published")
        const pendingMoments = await this.countByStatus("under_review")
        const failedMoments = await this.database.getConnection().models.Moment.count({
            include: [
                {
                    model: this.database.getConnection().models.MomentProcessing,
                    as: "processing",
                    where: { status: "failed" },
                },
            ],
        })

        // Buscar top hashtags
        const hashtagResults = await this.database.getConnection().models.Moment.findAll({
            attributes: [
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "unnest",
                            this.database.getConnection().models.sequelize.col("hashtags"),
                        ),
                    "hashtag",
                ],
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "count",
                            this.database.getConnection().models.sequelize.col("id"),
                        ),
                    "count",
                ],
            ],
            group: ["hashtag"],
            order: [
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "count",
                            this.database.getConnection().models.sequelize.col("id"),
                        ),
                    "DESC",
                ],
            ],
            limit: 10,
            raw: true,
        })

        // Buscar top menções
        const mentionResults = await this.database.getConnection().models.Moment.findAll({
            attributes: [
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "unnest",
                            this.database.getConnection().models.sequelize.col("mentions"),
                        ),
                    "mention",
                ],
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "count",
                            this.database.getConnection().models.sequelize.col("id"),
                        ),
                    "count",
                ],
            ],
            group: ["mention"],
            order: [
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "count",
                            this.database.getConnection().models.sequelize.col("id"),
                        ),
                    "DESC",
                ],
            ],
            limit: 10,
            raw: true,
        })

        // Buscar momentos por dia (últimos 30 dias)
        const momentsByDay = await this.database.getConnection().models.Moment.findAll({
            attributes: [
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "date",
                            this.database.getConnection().models.sequelize.col("createdAt"),
                        ),
                    "date",
                ],
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "count",
                            this.database.getConnection().models.sequelize.col("id"),
                        ),
                    "count",
                ],
            ],
            where: {
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            },
            group: [
                this.database
                    .getConnection()
                    .models.sequelize.fn(
                        "date",
                        this.database.getConnection().models.sequelize.col("createdAt"),
                    ),
            ],
            order: [
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "date",
                            this.database.getConnection().models.sequelize.col("createdAt"),
                        ),
                    "ASC",
                ],
            ],
            raw: true,
        })

        // Buscar momentos por status
        const momentsByStatus = await this.database.getConnection().models.Moment.findAll({
            attributes: [
                [this.database.getConnection().models.sequelize.col("status.current"), "status"],
                [
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "count",
                            this.database.getConnection().models.sequelize.col("Moment.id"),
                        ),
                    "count",
                ],
            ],
            include: [
                {
                    model: this.database.getConnection().models.MomentStatus,
                    as: "status",
                    attributes: [],
                },
            ],
            group: ["status.current"],
            raw: true,
        })

        return {
            totalMoments,
            publishedMoments,
            pendingMoments,
            failedMoments,
            topHashtags: hashtagResults.map((r: any) => ({
                hashtag: r.hashtag,
                count: parseInt(r.count),
            })),
            topMentions: mentionResults.map((r: any) => ({
                mention: r.mention,
                count: parseInt(r.count),
            })),
            momentsByDay: momentsByDay.map((r: any) => ({
                date: r.date,
                count: parseInt(r.count),
            })),
            momentsByStatus: momentsByStatus.map((r: any) => ({
                status: r.status,
                count: parseInt(r.count),
            })),
        }
    }

    async getStats(): Promise<IMomentRepositoryStats> {
        const totalMoments = await this.database.getConnection().models.Moment.count()
        const publishedMoments = await this.countByStatus("published")
        const pendingMoments = await this.countByStatus("under_review")
        const failedMoments = await this.database.getConnection().models.Moment.count({
            include: [
                {
                    model: this.database.getConnection().models.MomentProcessing,
                    as: "processing",
                    where: { status: "failed" },
                },
            ],
        })

        // Contar total de hashtags e menções
        const hashtagCount =
            (await this.database
                .getConnection()
                .models.Moment.sum(
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "array_length",
                            this.database.getConnection().models.sequelize.col("hashtags"),
                            1,
                        ),
                )) || 0

        const mentionCount =
            (await this.database
                .getConnection()
                .models.Moment.sum(
                    this.database
                        .getConnection()
                        .models.sequelize.fn(
                            "array_length",
                            this.database.getConnection().models.sequelize.col("mentions"),
                            1,
                        ),
                )) || 0

        return {
            totalMoments,
            publishedMoments,
            pendingMoments,
            failedMoments,
            totalHashtags: hashtagCount,
            totalMentions: mentionCount,
            averageHashtagsPerMoment: totalMoments > 0 ? hashtagCount / totalMoments : 0,
            averageMentionsPerMoment: totalMoments > 0 ? mentionCount / totalMoments : 0,
        }
    }

    // ===== OPERAÇÕES DE PROPRIEDADE =====

    async isOwner(momentId: string, userId: string): Promise<boolean> {
        try {
            const moment = await this.database.getConnection().models.Moment.findByPk(momentId, {
                attributes: ["id", "ownerId"],
            })

            if (!moment) {
                return false
            }

            return moment.ownerId === userId
        } catch (error) {
            console.error(`Erro ao verificar propriedade do moment ${momentId}:`, error)
            return false
        }
    }

    // ===== OPERAÇÕES DE LIKES =====

    async hasUserLikedMoment(momentId: string, userId: string): Promise<boolean> {
        try {
            const like = await this.database.getConnection().models.Like.findOne({
                where: {
                    momentId,
                    userId,
                },
            })
            return !!like
        } catch (error) {
            console.error(
                `Erro ao verificar like do usuário ${userId} no momento ${momentId}:`,
                error,
            )
            return false
        }
    }

    async addLike(momentId: string, userId: string): Promise<void> {
        try {
            await this.database.getConnection().models.Like.create({
                momentId,
                userId,
            })
        } catch (error) {
            console.error(
                `Erro ao adicionar like do usuário ${userId} no momento ${momentId}:`,
                error,
            )
            throw error
        }
    }

    async removeLike(momentId: string, userId: string): Promise<void> {
        try {
            await this.database.getConnection().models.Like.destroy({
                where: {
                    momentId,
                    userId,
                },
            })
        } catch (error) {
            console.error(
                `Erro ao remover like do usuário ${userId} no momento ${momentId}:`,
                error,
            )
            throw error
        }
    }

    // ===== OPERAÇÕES DE VALIDAÇÃO DE INTERATIVIDADE =====

    async isInteractable(
        momentId: string,
        userWhoWantsToInteract: string,
        userRepository: import("@/domain/user").IUserRepository,
    ): Promise<boolean> {
        try {
            // Buscar o moment
            const moment = await this.findById(momentId)
            if (!moment) {
                return false
            }

            // Usar o método isInteractable da entidade Moment
            return await moment.isInteractable(userWhoWantsToInteract, userRepository)
        } catch (error) {
            console.error("Erro ao verificar interatividade:", error)
            return false
        }
    }

    // ===== MÉTODOS AUXILIARES =====

    private mapToDomainEntity(momentData: any): Moment {
        // Mapear dados do banco para a entidade de domínio
        const momentEntity: any = {
            id: momentData.id,
            ownerId: momentData.ownerId,
            description: momentData.description,
            hashtags: momentData.hashtags || [],
            mentions: momentData.mentions || [],
            publishedAt: momentData.publishedAt,
            archivedAt: momentData.archivedAt,
            deletedAt: momentData.deletedAt,
            createdAt: momentData.createdAt,
            updatedAt: momentData.updatedAt,
        }

        // Mapear conteúdo
        if (momentData.content) {
            momentEntity.content = {
                duration: momentData.content.duration,
                size: momentData.content.size,
                format: momentData.content.format,
                hasAudio: momentData.content.hasAudio,
                codec: momentData.content.codec,
                resolution: momentData.content.resolution || {
                    width: 0,
                    height: 0,
                    quality: "medium",
                },
                createdAt: momentData.content.createdAt,
                updatedAt: momentData.content.updatedAt,
            }
        }

        // Mapear status
        if (momentData.status) {
            momentEntity.status = {
                current: momentData.status.current,
                previous: momentData.status.previousStatus,
                reason: momentData.status.reason,
                changedBy: momentData.status.changedBy,
                changedAt: momentData.status.changedAt,
                createdAt: momentData.status.createdAt,
                updatedAt: momentData.status.updatedAt,
            }
        }

        // Mapear visibilidade
        if (momentData.visibility) {
            momentEntity.visibility = {
                level: momentData.visibility.level,
                allowedUsers: momentData.visibility.allowedUsers || [],
                blockedUsers: momentData.visibility.blockedUsers || [],
                ageRestriction: momentData.visibility.ageRestriction,
                contentWarning: momentData.visibility.contentWarning,
                createdAt: momentData.visibility.createdAt,
                updatedAt: momentData.visibility.updatedAt,
            }
        }

        // Mapear métricas
        if (momentData.metrics) {
            momentEntity.metrics = {
                views: {
                    totalViews: momentData.metrics.totalViews,
                    uniqueViews: momentData.metrics.uniqueViews,
                    repeatViews: momentData.metrics.repeatViews,
                    completionViews: momentData.metrics.completionViews,
                    averageWatchTime: momentData.metrics.averageWatchTime,
                    averageCompletionRate: momentData.metrics.averageCompletionRate,
                    bounceRate: momentData.metrics.bounceRate,
                    viewsByCountry: {},
                    viewsByRegion: {},
                    viewsByCity: {},
                    viewsByDevice: {},
                    viewsByOS: {},
                    viewsByBrowser: {},
                    viewsByHour: {},
                    viewsByDayOfWeek: {},
                    viewsByMonth: {},
                    retentionCurve: [],
                },
                engagement: {
                    totalLikes: momentData.metrics.totalLikes,
                    totalComments: momentData.metrics.totalComments,
                    totalReports: momentData.metrics.totalReports,
                    likeRate: momentData.metrics.likeRate,
                    commentRate: momentData.metrics.commentRate,
                    reportRate: momentData.metrics.reportRate,
                    positiveComments: 0,
                    negativeComments: 0,
                    neutralComments: 0,
                    averageCommentLength: 0,
                    topCommenters: [],
                    engagementByHour: {},
                    engagementByDay: {},
                    peakEngagementTime: new Date(),
                },
                performance: {
                    loadTime: momentData.metrics.loadTime,
                    bufferTime: momentData.metrics.bufferTime,
                    errorRate: momentData.metrics.errorRate,
                    qualitySwitches: momentData.metrics.qualitySwitches,
                    bandwidthUsage: 0,
                    averageBitrate: 0,
                    peakBitrate: 0,
                    processingTime: 0,
                    thumbnailGenerationTime: 0,
                    embeddingGenerationTime: 0,
                    storageSize: 0,
                    compressionRatio: 0,
                    cdnHitRate: 0,
                },
                viral: {
                    viralScore: momentData.metrics.viralScore,
                    trendingScore: momentData.metrics.trendingScore,
                    reachScore: momentData.metrics.reachScore,
                    influenceScore: momentData.metrics.influenceScore,
                    growthRate: momentData.metrics.growthRate,
                    accelerationRate: 0,
                    peakGrowthTime: new Date(),
                    organicReach: 0,
                    paidReach: 0,
                    viralReach: 0,
                    totalReach: momentData.metrics.totalReach,
                    reachByPlatform: {},
                    reachByUserType: {},
                    cascadeDepth: 0,
                },
                audience: {
                    ageDistribution: {},
                    genderDistribution: {},
                    locationDistribution: {},
                    averageSessionDuration: 0,
                    pagesPerSession: 0,
                    returnVisitorRate: 0,
                    newVisitorRate: 0,
                    premiumUsers: 0,
                    regularUsers: 0,
                    newUsers: 0,
                    powerUsers: 0,
                    repeatViewerRate: 0,
                    subscriberConversionRate: 0,
                    churnRate: 0,
                },
                content: {
                    contentQualityScore: momentData.metrics.contentQualityScore,
                    audioQualityScore: momentData.metrics.audioQualityScore,
                    videoQualityScore: momentData.metrics.videoQualityScore,
                    faceDetectionRate: momentData.metrics.faceDetectionRate,
                    motionIntensity: 0,
                    colorVariance: 0,
                    brightnessLevel: 0,
                    speechToNoiseRatio: 0,
                    averageVolume: 0,
                    silencePercentage: 0,
                    hashtagEffectiveness: 0,
                    mentionEffectiveness: 0,
                    descriptionEngagement: 0,
                },
                monetization: {
                    totalRevenue: 0,
                    adRevenue: 0,
                    subscriptionRevenue: 0,
                    tipRevenue: 0,
                    merchandiseRevenue: 0,
                    revenuePerView: 0,
                    revenuePerUser: 0,
                    averageOrderValue: 0,
                    adClickRate: 0,
                    subscriptionConversionRate: 0,
                    tipConversionRate: 0,
                    merchandiseConversionRate: 0,
                    productionCost: 0,
                    distributionCost: 0,
                    marketingCost: 0,
                    totalCost: 0,
                    returnOnInvestment: 0,
                    profitMargin: 0,
                    breakEvenPoint: new Date(),
                },
                lastMetricsUpdate: momentData.metrics.lastMetricsUpdate,
                metricsVersion: momentData.metrics.metricsVersion,
                dataQuality: momentData.metrics.dataQuality,
                confidenceLevel: momentData.metrics.confidenceLevel,
                createdAt: momentData.metrics.createdAt,
                updatedAt: momentData.metrics.updatedAt,
            }
        }

        // Mapear contexto
        if (momentData.context) {
            momentEntity.context = {
                device: momentData.context.device || {
                    type: "unknown",
                    os: "unknown",
                    osVersion: "unknown",
                    model: "unknown",
                    screenResolution: "unknown",
                    orientation: "unknown",
                },
                location: momentData.context.location || {
                    latitude: 0,
                    longitude: 0,
                },
            }
        }

        // Mapear processamento
        if (momentData.processing) {
            momentEntity.processing = {
                status: momentData.processing.status,
                progress: momentData.processing.progress,
                steps: momentData.processing.steps || [],
                error: momentData.processing.error,
                startedAt: momentData.processing.startedAt,
                completedAt: momentData.processing.completedAt,
                estimatedCompletion: momentData.processing.estimatedCompletion,
            }
        }

        // Mapear embedding
        if (momentData.embedding) {
            momentEntity.embedding = {
                vector: momentData.embedding.vector,
                dimension: momentData.embedding.dimension,
                metadata: momentData.embedding.metadata || {},
                createdAt: momentData.embedding.createdAt,
                updatedAt: momentData.embedding.updatedAt,
            }
        }

        // Mapear mídia
        if (momentData.media) {
            momentEntity.media = {
                urls: {
                    low: momentData.media.lowUrl,
                    medium: momentData.media.mediumUrl,
                    high: momentData.media.highUrl,
                },
                storage: {
                    provider: momentData.media.storageProvider,
                    bucket: momentData.media.bucket,
                    key: momentData.media.key,
                    region: momentData.media.region,
                },
                createdAt: momentData.media.createdAt,
                updatedAt: momentData.media.updatedAt,
            }
        }

        // Mapear thumbnail
        if (momentData.thumbnail) {
            momentEntity.thumbnail = {
                url: momentData.thumbnail.url,
                width: momentData.thumbnail.width,
                height: momentData.thumbnail.height,
                storage: {
                    provider: momentData.thumbnail.storageProvider,
                    bucket: momentData.thumbnail.bucket,
                    key: momentData.thumbnail.key,
                    region: momentData.thumbnail.region,
                },
                createdAt: momentData.thumbnail.createdAt,
                updatedAt: momentData.thumbnail.updatedAt,
            }
        }

        // Mapear localização
        if (momentData.location) {
            momentEntity.location = {
                latitude: momentData.location.latitude,
                longitude: momentData.location.longitude,
            }
        }

        return Moment.fromEntity(momentEntity)
    }
}
