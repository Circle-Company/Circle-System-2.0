import {
    IMomentMetricsRepository,
    MomentMetricsAnalysisService,
} from "@/domain/moment/repositories/moment.metrics.repository"

import { MomentMetricsEntity } from "@/domain/moment/entities/moment.metrics.entity"

// ===== EVENTOS DE MÉTRICAS =====
export interface MetricsEvent {
    type:
        | "view"
        | "like"
        | "comment"
        | "report"
        | "share"
        | "completion"
        | "quality_update"
        | "revenue"
        | "cost"
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
    enableMonetizationTracking: boolean
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
            enableMonetizationTracking: true,
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
     * Registra receita
     */
    async recordRevenue(
        momentId: string,
        data: {
            amount: number
            type: "ad" | "subscription" | "tip" | "merchandise"
            source?: string
            timestamp?: Date
        },
    ): Promise<void> {
        if (!this.config.enableMonetizationTracking) return

        const event: MetricsEvent = {
            type: "revenue",
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
     * Registra custo
     */
    async recordCost(
        momentId: string,
        data: {
            amount: number
            type: "production" | "distribution" | "marketing"
            description?: string
            timestamp?: Date
        },
    ): Promise<void> {
        if (!this.config.enableMonetizationTracking) return

        const event: MetricsEvent = {
            type: "cost",
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
        totalRevenue: number
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
                totalRevenue: 0,
                averageEngagement: 0,
                averageViralScore: 0,
                averageTrendingScore: 0,
            }
        }

        const totalViews = metrics.reduce((sum, m) => sum + m.views.totalViews, 0)
        const totalLikes = metrics.reduce((sum, m) => sum + m.engagement.totalLikes, 0)
        const totalComments = metrics.reduce((sum, m) => sum + m.engagement.totalComments, 0)
        const totalRevenue = metrics.reduce((sum, m) => sum + m.monetization.totalRevenue, 0)
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
            totalRevenue,
            averageEngagement,
            averageViralScore,
            averageTrendingScore,
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
            case "revenue":
                await this.processRevenueEvent(metrics, event.data)
                break
            case "cost":
                await this.processCostEvent(metrics, event.data)
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

    /**
     * Processa evento de receita
     */
    private async processRevenueEvent(metrics: MomentMetricsEntity, data: any): Promise<void> {
        metrics.addRevenue(data.amount, data.type)
    }

    /**
     * Processa evento de custo
     */
    private async processCostEvent(metrics: MomentMetricsEntity, data: any): Promise<void> {
        metrics.addCost(data.amount, data.type)
    }
}
