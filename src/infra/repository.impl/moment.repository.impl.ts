import {
    IMomentAnalytics,
    IMomentFilters,
    IMomentRepository,
    IMomentRepositoryStats,
    Moment,
} from "../../domain/moment"
// Importar as interfaces corretas das métricas
import { IUserRepository, User } from "@/domain/user"
import { Op, WhereOptions } from "sequelize"

import { generateId } from "@/shared"

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

            // Criar métricas - apenas campos realmente usados
            if (momentData.metrics) {
                await this.database.getConnection().models.MomentMetrics.create(
                    {
                        id: generateId(),
                        momentId: momentData.id,
                        // Métricas de visualização (campos usados)
                        totalClicks: momentData.metrics.engagement.totalClicks,
                        clickRate: momentData.metrics.engagement.clickRate,
                        totalViews: momentData.metrics.views.totalViews,
                        uniqueViews: momentData.metrics.views.uniqueViews,
                        completionViews: momentData.metrics.views.completionViews,
                        averageWatchTime: momentData.metrics.views.averageWatchTime,
                        averageCompletionRate: momentData.metrics.views.averageCompletionRate,
                        bounceRate: momentData.metrics.audience?.behavior?.bounceRate || 0,
                        // Métricas de engajamento (campos usados)
                        totalLikes: momentData.metrics.engagement.totalLikes,
                        totalComments: momentData.metrics.engagement.totalComments,
                        totalReports: momentData.metrics.engagement.totalReports,
                        likeRate: momentData.metrics.engagement.likeRate,
                        commentRate: momentData.metrics.engagement.commentRate,
                        reportRate: momentData.metrics.engagement.reportRate,
                        // Métricas de performance (campos usados)
                        loadTime: momentData.metrics.performance.loadTime,
                        bufferTime: momentData.metrics.performance.bufferTime,
                        errorRate: momentData.metrics.performance.errorRate,
                        // Métricas de viralidade (campos usados)
                        viralScore: momentData.metrics.viral.viralScore,
                        totalReach: momentData.metrics.viral.viralReach || 0,
                        // Métricas de qualidade (campos usados)
                        contentQualityScore: momentData.metrics.content.qualityScore || 0,
                        // Metadados (campos usados)
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
                        url: momentData.media.url,
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
                {
                    model: this.database.getConnection().models.MomentContent,
                    as: "content",
                    include: [
                        {
                            model: this.database.getConnection().models.MomentResolution,
                            as: "resolution",
                        },
                    ],
                },
                { model: this.database.getConnection().models.MomentStatus, as: "status" },
                { model: this.database.getConnection().models.MomentVisibility, as: "visibility" },
                { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
                {
                    model: this.database.getConnection().models.MomentContext,
                    as: "context",
                    include: [
                        {
                            model: this.database.getConnection().models.MomentDevice,
                            as: "device",
                        },
                    ],
                },
                {
                    model: this.database.getConnection().models.MomentProcessing,
                    as: "processing",
                    include: [
                        {
                            model: this.database.getConnection().models.MomentProcessingStep,
                            as: "steps",
                        },
                    ],
                },
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

        // Atualizar status se existir
        if (momentData.status) {
            console.log(`[MomentRepository] 🔄 Atualizando status do moment ${momentData.id}:`, {
                current: momentData.status.current,
                previous: momentData.status.previous,
                reason: momentData.status.reason,
            })

            const statusUpdateResult = await this.database
                .getConnection()
                .models.MomentStatus.update(
                    {
                        current: momentData.status.current,
                        previousStatus: momentData.status.previous,
                        reason: momentData.status.reason,
                        changedBy: momentData.status.changedBy,
                        changedAt: momentData.status.changedAt,
                        updatedAt: momentData.status.updatedAt,
                    },
                    { where: { moment_id: momentData.id } },
                )

            console.log(
                `[MomentRepository] 📊 Resultado da atualização de status:`,
                statusUpdateResult,
            )
        }

        // Atualizar media se existir
        if (momentData.media) {
            console.log(`[MomentRepository] 🔄 Atualizando media do moment ${momentData.id}:`, {
                url: momentData.media.url,
                storageKey: momentData.media.storage?.key,
            })

            const mediaUpdateResult = await this.database.getConnection().models.MomentMedia.update(
                {
                    url: momentData.media.url,
                    updatedAt: momentData.media.updatedAt,
                },
                { where: { moment_id: momentData.id } },
            )

            console.log(
                `[MomentRepository] 📊 Resultado da atualização de media:`,
                mediaUpdateResult,
            )

            // Atualizar storage metadata se existir
            if (momentData.media.storage) {
                const storageUpdateResult = await this.database
                    .getConnection()
                    .models.MomentMedia.update(
                        {
                            storageProvider: momentData.media.storage.provider,
                            bucket: momentData.media.storage.bucket,
                            key: momentData.media.storage.key,
                            region: momentData.media.storage.region,
                        },
                        { where: { moment_id: momentData.id } },
                    )

                console.log(
                    `[MomentRepository] 📊 Resultado da atualização de storage:`,
                    storageUpdateResult,
                )
            }
        }

        // Atualizar métricas se existirem - apenas campos realmente usados
        if (momentData.metrics) {
            await this.database.getConnection().models.MomentMetrics.update(
                {
                    // Métricas de visualização (campos usados)
                    totalViews: momentData.metrics.views.totalViews,
                    uniqueViews: momentData.metrics.views.uniqueViews,
                    repeatViews: momentData.metrics.views.repeatViews || 0,
                    completionViews: momentData.metrics.views.completionViews,
                    averageWatchTime: momentData.metrics.views.averageWatchTime,
                    averageCompletionRate: momentData.metrics.views.averageCompletionRate,
                    bounceRate: momentData.metrics.audience?.behavior?.bounceRate || 0,
                    // Métricas de engajamento (campos usados)
                    totalLikes: momentData.metrics.engagement.totalLikes,
                    totalComments: momentData.metrics.engagement.totalComments,
                    totalReports: momentData.metrics.engagement.totalReports,
                    likeRate: momentData.metrics.engagement.likeRate,
                    commentRate: momentData.metrics.engagement.commentRate,
                    reportRate: momentData.metrics.engagement.reportRate,
                    // Métricas de cliques (campos usados)
                    totalClicks: momentData.metrics.engagement.totalClicks,
                    clickRate: momentData.metrics.engagement.clickRate,
                    // Métricas de performance (campos usados)
                    loadTime: momentData.metrics.performance.loadTime,
                    bufferTime: momentData.metrics.performance.bufferTime,
                    errorRate: momentData.metrics.performance.errorRate,
                    // Métricas de viralidade (campos usados)
                    viralScore: momentData.metrics.viral.viralScore,
                    totalReach: momentData.metrics.viral.viralReach || 0,
                    // Métricas de qualidade (campos usados)
                    contentQualityScore: momentData.metrics.content.qualityScore || 0,
                    // Metadados (campos usados)
                    lastMetricsUpdate: momentData.metrics.lastMetricsUpdate,
                    dataQuality: momentData.metrics.dataQuality,
                    confidenceLevel: momentData.metrics.confidenceLevel,
                },
                { where: { momentId: momentData.id } },
            )
        }

        // Atualizar embedding se existir
        if (momentData.embedding) {
            console.log(`[MomentRepository] 🔄 Atualizando embedding do moment ${momentData.id}:`, {
                dimension: momentData.embedding.dimension,
                hasVector: !!momentData.embedding.vector,
                metadata: momentData.embedding.metadata,
            })

            const embeddingUpdateResult = await this.database
                .getConnection()
                .models.MomentEmbedding.update(
                    {
                        vector: momentData.embedding.vector,
                        dimension: momentData.embedding.dimension,
                        metadata: momentData.embedding.metadata,
                        updatedAt: momentData.embedding.updatedAt,
                    },
                    { where: { momentId: momentData.id } },
                )

            console.log(
                `[MomentRepository] 📊 Resultado da atualização de embedding:`,
                embeddingUpdateResult,
            )
        }

        return moment
    }

    async delete(id: string): Promise<void> {
        await this.database.getConnection().models.Moment.destroy({ where: { id } })
    }

    // ===== OPERAÇÕES DE BUSCA =====

    async findByOwnerId(
        ownerId: string,
        limit = 20,
        offset = 0,
        filters?: { status?: string; visibility?: string },
    ): Promise<Moment[]> {
        const include: any[] = []

        // Status com filtro se fornecido
        if (filters?.status) {
            include.push({
                model: this.database.getConnection().models.MomentStatus,
                as: "status",
                where: { current: filters.status },
            })
        } else {
            include.push({ model: this.database.getConnection().models.MomentStatus, as: "status" })
        }

        // Visibility com filtro se fornecido
        if (filters?.visibility) {
            include.push({
                model: this.database.getConnection().models.MomentVisibility,
                as: "visibility",
                where: { level: filters.visibility },
            })
        } else {
            include.push({
                model: this.database.getConnection().models.MomentVisibility,
                as: "visibility",
            })
        }

        // Sempre incluir estes models
        include.push(
            { model: this.database.getConnection().models.MomentContent, as: "content" },
            { model: this.database.getConnection().models.MomentMetrics, as: "metrics" },
            { model: this.database.getConnection().models.MomentMedia, as: "media" },
            { model: this.database.getConnection().models.MomentThumbnail, as: "thumbnail" },
        )

        const moments = await this.database.getConnection().models.Moment.findAll({
            where: { ownerId },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include,
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
        userRepository: IUserRepository,
    ): Promise<boolean> {
        try {
            // Buscar o moment
            const moment = await this.findById(momentId)
            if (!moment) {
                return false
            }

            // Usar o método isInteractable da entidade Moment
            return await moment.isInteractable(
                userRepository,
                userWhoWantsToInteract as unknown as User,
            )
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

        // Mapear métricas - apenas campos realmente usados
        if (momentData.metrics) {
            momentEntity.metrics = {
                views: {
                    totalViews: momentData.metrics.totalViews,
                    uniqueViews: momentData.metrics.uniqueViews,
                    repeatViews: momentData.metrics.repeatViews || 0,
                    completionViews: momentData.metrics.completionViews,
                    averageWatchTime: momentData.metrics.averageWatchTime,
                    averageCompletionRate: momentData.metrics.averageCompletionRate,
                    bounceRate: momentData.metrics.bounceRate,
                    viewsByCountry: {},
                    viewsByRegion: {},
                    viewsByCity: {},
                    viewsByDevice: {},
                    peakViewTime: null,
                    lastViewTime: null,
                },
                engagement: {
                    totalLikes: momentData.metrics.totalLikes,
                    totalComments: momentData.metrics.totalComments,
                    totalReports: momentData.metrics.totalReports,
                    likeRate: momentData.metrics.likeRate,
                    commentRate: momentData.metrics.commentRate,
                    reportRate: momentData.metrics.reportRate,
                    totalClicks: 0, // Campo não existe na tabela
                    clickRate: 0, // Campo não existe na tabela
                    averageCommentLength: 0,
                    topCommenters: [],
                    engagementScore: 0,
                    lastEngagementTime: null,
                },
                performance: {
                    loadTime: momentData.metrics.loadTime,
                    bufferTime: momentData.metrics.bufferTime,
                    errorRate: momentData.metrics.errorRate,
                    successRate: 100 - momentData.metrics.errorRate,
                    averageQuality: 0,
                    qualityDistribution: {},
                    bandwidthUsage: 0,
                    serverResponseTime: 0,
                    cdnHitRate: 0,
                    lastPerformanceUpdate: null,
                },
                viral: {
                    viralScore: momentData.metrics.viralScore,
                    viralReach: momentData.metrics.totalReach,
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
                        bounceRate: momentData.metrics.bounceRate,
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
                    qualityScore: momentData.metrics.contentQualityScore,
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

        // Mapear mídia (com fallback) - usar apenas uma URL
        if (momentData.media) {
            momentEntity.media = {
                url: momentData.media.url || "",
                storage: {
                    provider: momentData.media.storageProvider || "unknown",
                    bucket: momentData.media.bucket || "",
                    key: momentData.media.key || "",
                    region: momentData.media.region || "",
                },
                createdAt: momentData.media.createdAt || new Date(),
                updatedAt: momentData.media.updatedAt || new Date(),
            }
        } else {
            // Fallback se media não existir
            momentEntity.media = {
                url: "",
                storage: { provider: "unknown", bucket: "", key: "", region: "" },
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        }

        // Mapear thumbnail (com fallback)
        if (momentData.thumbnail) {
            momentEntity.thumbnail = {
                url: momentData.thumbnail.url || "",
                width: momentData.thumbnail.width || 0,
                height: momentData.thumbnail.height || 0,
                storage: {
                    provider: momentData.thumbnail.storageProvider || "unknown",
                    bucket: momentData.thumbnail.bucket || "",
                    key: momentData.thumbnail.key || "",
                    region: momentData.thumbnail.region || "",
                },
                createdAt: momentData.thumbnail.createdAt || new Date(),
                updatedAt: momentData.thumbnail.updatedAt || new Date(),
            }
        } else {
            // Fallback se thumbnail não existir
            momentEntity.thumbnail = {
                url: "",
                width: 0,
                height: 0,
                storage: { provider: "unknown", bucket: "", key: "", region: "" },
                createdAt: new Date(),
                updatedAt: new Date(),
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
