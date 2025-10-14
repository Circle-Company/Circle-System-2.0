import {
    IMomentMetricsRepository,
    MomentMetricsAnalysisService,
} from "@/domain/moment/repositories/moment.metrics.repository"

import { normalizeL2 } from "@/core/swipe.engine/utils/normalization"
import { MomentMetricsEntity } from "@/domain/moment/entities/moment.metrics.entity"
import {
    CalculateEngagementVectorParams,
    CalculateEngagementVectorResult,
    EngagementFeatures,
    EngagementMetrics,
    MomentEngagementVector,
} from "@/domain/moment/types/moment.engagement.vector.type"

// ===== EVENTOS DE MÉTRICAS =====
export interface MetricsEvent {
    type: "view" | "like" | "comment" | "report" | "share" | "completion" | "quality_update"
    momentId: string
    data: any
    timestamp: Date
}

// ===== CONFIGURAÇÃO DO SERVIÇO =====
export interface MomentMetricsServiceConfig {
    batchSize: number
    processingInterval: number // ms
    maxRetries: number
    enableRealTimeUpdates: boolean
    enableAnalytics: boolean
}

// ===== SERVIÇO DE MÉTRICAS =====
export class MomentMetricsService {
    private config: MomentMetricsServiceConfig
    private eventQueue: MetricsEvent[] = []
    private processingTimer: NodeJS.Timeout | null = null
    private analysisService: MomentMetricsAnalysisService

    constructor(
        private repository: IMomentMetricsRepository,
        config?: Partial<MomentMetricsServiceConfig>,
    ) {
        this.config = {
            batchSize: 100,
            processingInterval: 5000, // 5 segundos
            maxRetries: 3,
            enableRealTimeUpdates: true,
            enableAnalytics: true,
            ...config,
        }

        this.analysisService = new MomentMetricsAnalysisService(repository)
        this.startProcessing()
    }

    // ===== MÉTODOS PÚBLICOS =====

    /**
     * Registra uma visualização
     */
    async recordView(
        momentId: string,
        data: {
            watchTime?: number
            completionRate?: number
            device?: string
            location?: string
            userId?: string
        },
    ): Promise<void> {
        const event: MetricsEvent = {
            type: "view",
            momentId,
            data,
            timestamp: new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            await this.processEvent(event)
        } else {
            this.eventQueue.push(event)
        }
    }

    /**
     * Registra um like
     */
    async recordLike(
        momentId: string,
        data: {
            userId: string
            timestamp?: Date
        },
    ): Promise<void> {
        const event: MetricsEvent = {
            type: "like",
            momentId,
            data,
            timestamp: new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            await this.processEvent(event)
        } else {
            this.eventQueue.push(event)
        }
    }

    /**
     * Registra um comentário
     */
    async recordComment(
        momentId: string,
        data: {
            userId: string
            commentLength: number
            sentiment?: "positive" | "negative" | "neutral"
            timestamp?: Date
        },
    ): Promise<void> {
        const event: MetricsEvent = {
            type: "comment",
            momentId,
            data,
            timestamp: new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            await this.processEvent(event)
        } else {
            this.eventQueue.push(event)
        }
    }

    /**
     * Registra um report
     */
    async recordReport(
        momentId: string,
        data: {
            userId: string
            reason: string
            timestamp?: Date
        },
    ): Promise<void> {
        const event: MetricsEvent = {
            type: "report",
            momentId,
            data,
            timestamp: new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            await this.processEvent(event)
        } else {
            this.eventQueue.push(event)
        }
    }

    /**
     * Registra conclusão de visualização
     */
    async recordCompletion(
        momentId: string,
        data: {
            userId: string
            completionRate: number
            totalWatchTime: number
            timestamp?: Date
        },
    ): Promise<void> {
        const event: MetricsEvent = {
            type: "completion",
            momentId,
            data,
            timestamp: new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            await this.processEvent(event)
        } else {
            this.eventQueue.push(event)
        }
    }

    /**
     * Atualiza qualidade do conteúdo
     */
    async updateQuality(
        momentId: string,
        data: {
            contentQuality?: number
            audioQuality?: number
            videoQuality?: number
            faceDetectionRate?: number
        },
    ): Promise<void> {
        const event: MetricsEvent = {
            type: "quality_update",
            momentId,
            data,
            timestamp: new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            await this.processEvent(event)
        } else {
            this.eventQueue.push(event)
        }
    }

    /**
     * Obtém métricas de um momento
     */
    async getMetrics(momentId: string): Promise<MomentMetricsEntity | null> {
        return await this.repository.findByMomentId(momentId)
    }

    /**
     * Obtém métricas com análise
     */
    async getMetricsWithAnalysis(momentId: string): Promise<{
        metrics: MomentMetricsEntity
        analysis: any
    } | null> {
        const metrics = await this.repository.findByMomentId(momentId)
        if (!metrics) return null

        const analysis = await this.analysisService.analyzeMoment(momentId)
        return { metrics, analysis }
    }

    /**
     * Obtém métricas em lote
     */
    async getBatchMetrics(momentIds: string[]): Promise<MomentMetricsEntity[]> {
        const results: MomentMetricsEntity[] = []

        for (const momentId of momentIds) {
            const metrics = await this.repository.findByMomentId(momentId)
            if (metrics) {
                results.push(metrics)
            }
        }

        return results
    }

    /**
     * Calcula métricas agregadas
     */
    async getAggregatedMetrics(momentIds: string[]): Promise<{
        totalViews: number
        totalLikes: number
        totalComments: number
        averageEngagement: number
        averageViralScore: number
        averageTrendingScore: number
    }> {
        const metrics = await this.getBatchMetrics(momentIds)

        if (metrics.length === 0) {
            return {
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                averageEngagement: 0,
                averageViralScore: 0,
                averageTrendingScore: 0,
            }
        }

        const totalViews = metrics.reduce((sum, m) => sum + m.views.totalViews, 0)
        const totalLikes = metrics.reduce((sum, m) => sum + m.engagement.totalLikes, 0)
        const totalComments = metrics.reduce((sum, m) => sum + m.engagement.totalComments, 0)
        const averageEngagement =
            metrics.reduce((sum, m) => sum + m.calculateEngagementRate(), 0) / metrics.length
        const averageViralScore =
            metrics.reduce((sum, m) => sum + m.viral.viralScore, 0) / metrics.length
        const averageTrendingScore =
            metrics.reduce((sum, m) => sum + m.viral.trendingScore, 0) / metrics.length

        return {
            totalViews,
            totalLikes,
            totalComments,
            averageEngagement,
            averageViralScore,
            averageTrendingScore,
        }
    }

    /**
     * Calcula vetor de engajamento com features normalizadas
     * Este vetor é MUTÁVEL e deve ser atualizado periodicamente
     */
    async calculateEngagementVector(
        params: CalculateEngagementVectorParams,
    ): Promise<CalculateEngagementVectorResult> {
        try {
            console.log(`[MetricsService] 📊 Calculando engagement vector: ${params.momentId}`)

            const { metrics, duration } = params

            // Calcular features normalizadas
            const features: EngagementFeatures = {
                likeRate: metrics.views > 0 ? metrics.likes / metrics.views : 0,
                commentRate: metrics.views > 0 ? metrics.comments / metrics.views : 0,
                shareRate: metrics.views > 0 ? metrics.shares / metrics.views : 0,
                saveRate: metrics.views > 0 ? metrics.saves / metrics.views : 0,
                retentionRate:
                    metrics.views > 0 && duration > 0
                        ? metrics.avgWatchTime / (metrics.views * duration)
                        : 0,
                avgCompletionRate: metrics.completionRate,
                reportRate: metrics.views > 0 ? metrics.reports / metrics.views : 0,
                viralityScore: 0,
                qualityScore: 0,
            }

            // Calcular scores compostos
            features.viralityScore = (features.shareRate + features.saveRate) / 2
            features.qualityScore = Math.max(
                0,
                features.retentionRate + features.avgCompletionRate - features.reportRate * 2,
            )

            // Montar vetor de features (10 dimensões)
            const rawVector: number[] = [
                features.likeRate,
                features.commentRate,
                features.shareRate,
                features.saveRate,
                features.retentionRate,
                features.avgCompletionRate,
                features.reportRate,
                features.viralityScore,
                features.qualityScore,
                // Adicionar taxa de views únicas
                metrics.uniqueViews > 0 ? metrics.views / metrics.uniqueViews : 1,
            ]

            // Normalizar vetor
            const normalizedVector = normalizeL2(rawVector)

            const engagementVector: MomentEngagementVector = {
                vector: normalizedVector,
                dimension: normalizedVector.length,
                metrics,
                features,
                metadata: {
                    lastUpdated: new Date(),
                    version: "engagement-vector-v1",
                    calculationMethod: "normalized-features",
                },
            }

            console.log(
                `[MetricsService] ✅ Engagement vector calculado: dim=${normalizedVector.length}`,
            )
            console.log(`  👍 Like rate: ${(features.likeRate * 100).toFixed(2)}%`)
            console.log(`  💬 Comment rate: ${(features.commentRate * 100).toFixed(2)}%`)
            console.log(`  📤 Share rate: ${(features.shareRate * 100).toFixed(2)}%`)
            console.log(`  ⭐ Quality score: ${(features.qualityScore * 100).toFixed(2)}%`)

            return {
                success: true,
                vector: engagementVector,
            }
        } catch (error) {
            console.error("[MetricsService] ❌ Erro ao calcular engagement vector:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }

    /**
     * Calcula engagement vector para um moment existente
     */
    async calculateEngagementVectorForMoment(
        momentId: string,
        duration: number,
    ): Promise<CalculateEngagementVectorResult> {
        try {
            // Buscar métricas do moment
            const metricsEntity = await this.repository.findByMomentId(momentId)

            if (!metricsEntity) {
                return {
                    success: false,
                    error: "Metrics not found for moment",
                }
            }

            // Montar EngagementMetrics a partir da entidade
            const engagementMetrics: EngagementMetrics = {
                views: metricsEntity.views.totalViews,
                uniqueViews: metricsEntity.views.uniqueViews,
                likes: metricsEntity.engagement.totalLikes,
                comments: metricsEntity.engagement.totalComments,
                shares: (metricsEntity.engagement as any).totalShares || 0,
                saves: (metricsEntity.engagement as any).totalSaves || 0,
                avgWatchTime: metricsEntity.views.averageWatchTime,
                completionRate: (metricsEntity.views as any).completionRate || 0,
                reports: metricsEntity.engagement.totalReports,
            }

            return await this.calculateEngagementVector({
                momentId,
                metrics: engagementMetrics,
                duration,
                createdAt: metricsEntity.createdAt,
            })
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }

    /**
     * Processa fila de eventos
     */
    async processEventQueue(): Promise<void> {
        if (this.eventQueue.length === 0) return

        const batch = this.eventQueue.splice(0, this.config.batchSize)

        for (const event of batch) {
            try {
                await this.processEvent(event)
            } catch (error) {
                console.error(
                    `Erro ao processar evento ${event.type} para momento ${event.momentId}:`,
                    error,
                )
                // TODO: Implementar retry logic
            }
        }
    }

    /**
     * Para o processamento
     */
    stop(): void {
        if (this.processingTimer) {
            clearInterval(this.processingTimer)
            this.processingTimer = null
        }
    }

    // ===== MÉTODOS PRIVADOS =====

    /**
     * Inicia o processamento de eventos
     */
    private startProcessing(): void {
        if (!this.config.enableRealTimeUpdates) {
            this.processingTimer = setInterval(() => {
                this.processEventQueue()
            }, this.config.processingInterval)
        }
    }

    /**
     * Processa um evento individual
     */
    private async processEvent(event: MetricsEvent): Promise<void> {
        let metrics = await this.repository.findByMomentId(event.momentId)

        if (!metrics) {
            metrics = MomentMetricsEntity.create(event.momentId)
            await this.repository.create(metrics)
        }

        switch (event.type) {
            case "view":
                await this.processViewEvent(metrics, event.data)
                break
            case "like":
                await this.processLikeEvent(metrics, event.data)
                break
            case "comment":
                await this.processCommentEvent(metrics, event.data)
                break
            case "report":
                await this.processReportEvent(metrics, event.data)
                break
            case "completion":
                await this.processCompletionEvent(metrics, event.data)
                break
            case "quality_update":
                await this.processQualityUpdateEvent(metrics, event.data)
                break
        }

        await this.repository.update(metrics)
    }

    /**
     * Processa evento de visualização
     */
    private async processViewEvent(metrics: MomentMetricsEntity, data: any): Promise<void> {
        metrics.incrementViews()

        if (data.watchTime) {
            metrics.updateWatchTime(data.watchTime)
        }

        if (data.completionRate) {
            metrics.updateCompletionRate(data.completionRate)
        }

        // Atualizar distribuição por dispositivo
        if (data.device) {
            metrics.views.viewsByDevice[data.device] =
                (metrics.views.viewsByDevice[data.device] || 0) + 1
        }

        // Atualizar distribuição por localização
        if (data.location) {
            metrics.views.viewsByCountry[data.location] =
                (metrics.views.viewsByCountry[data.location] || 0) + 1
        }
    }

    /**
     * Processa evento de like
     */
    private async processLikeEvent(metrics: MomentMetricsEntity, data: any): Promise<void> {
        metrics.incrementLikes()
    }

    /**
     * Processa evento de comentário
     */
    private async processCommentEvent(metrics: MomentMetricsEntity, data: any): Promise<void> {
        metrics.incrementComments()

        // Atualizar análise de comentários
        if (data.sentiment) {
            switch (data.sentiment) {
                case "positive":
                    metrics.engagement.positiveComments++
                    break
                case "negative":
                    metrics.engagement.negativeComments++
                    break
                case "neutral":
                    metrics.engagement.neutralComments++
                    break
            }
        }

        // Atualizar comprimento médio dos comentários
        if (data.commentLength) {
            const totalComments = metrics.engagement.totalComments
            if (totalComments > 0) {
                metrics.engagement.averageCommentLength =
                    (metrics.engagement.averageCommentLength * (totalComments - 1) +
                        data.commentLength) /
                    totalComments
            }
        }
    }

    /**
     * Processa evento de report
     */
    private async processReportEvent(metrics: MomentMetricsEntity, data: any): Promise<void> {
        metrics.incrementReports()
    }

    /**
     * Processa evento de conclusão
     */
    private async processCompletionEvent(metrics: MomentMetricsEntity, data: any): Promise<void> {
        metrics.incrementCompletionViews()
        metrics.updateWatchTime(data.totalWatchTime)
        metrics.updateCompletionRate(data.completionRate)
    }

    /**
     * Processa evento de atualização de qualidade
     */
    private async processQualityUpdateEvent(
        metrics: MomentMetricsEntity,
        data: any,
    ): Promise<void> {
        if (data.contentQuality !== undefined) {
            metrics.updateContentQualityScore(data.contentQuality)
        }
        if (data.audioQuality !== undefined) {
            metrics.updateAudioQualityScore(data.audioQuality)
        }
        if (data.videoQuality !== undefined) {
            metrics.updateVideoQualityScore(data.videoQuality)
        }
        if (data.faceDetectionRate !== undefined) {
            metrics.updateFaceDetectionRate(data.faceDetectionRate)
        }
    }
}
