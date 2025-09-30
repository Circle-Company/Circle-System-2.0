/**
 * User Metrics Service - Serviço de métricas de usuário
 *
 * Features:
 * - Coleta e processamento de métricas de usuário
 * - Análise de comportamento e engajamento
 * - Relatórios de performance
 * - Tracking de atividades
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { UserMetrics } from "@/domain/user/entities/user.metrics.entity"
import { IUserMetricsRepository } from "@/domain/user/repositories/user.metrics.repository"

// ===== INTERFACES DE EVENTOS =====
export interface UserMetricsEvent {
    type:
        | "login"
        | "logout"
        | "profile_view"
        | "profile_edit"
        | "moment_create"
        | "moment_like"
        | "moment_comment"
        | "moment_share"
        | "search"
        | "follow"
        | "unfollow"
        | "block"
        | "unblock"
        | "report"
        | "premium_upgrade"
        | "premium_downgrade"
    userId: string
    data: any
    timestamp: Date
}

// ===== CONFIGURAÇÃO DO SERVIÇO =====
export interface UserMetricsServiceConfig {
    batchSize: number
    processingInterval: number // ms
    maxRetries: number
    enableRealTimeUpdates: boolean
    enableAnalytics: boolean
    enableBehaviorTracking: boolean
}

// ===== SERVIÇO DE MÉTRICAS =====
export class UserMetricsService {
    private config: UserMetricsServiceConfig
    private eventQueue: UserMetricsEvent[] = []
    private processingTimer: NodeJS.Timeout | null = null

    constructor(
        private repository: IUserMetricsRepository,
        config?: Partial<UserMetricsServiceConfig>,
    ) {
        this.config = {
            batchSize: 100,
            processingInterval: 5000,
            maxRetries: 3,
            enableRealTimeUpdates: true,
            enableAnalytics: true,
            enableBehaviorTracking: true,
            ...config,
        }

        if (this.config.enableRealTimeUpdates) {
            this.startProcessing()
        }
    }

    /**
     * Registra login do usuário
     */
    async recordLogin(
        userId: string,
        data: {
            device: string
            ipAddress?: string
            userAgent?: string
            location?: string
            timestamp?: Date
        },
    ): Promise<void> {
        const event: UserMetricsEvent = {
            type: "login",
            userId,
            data,
            timestamp: data.timestamp || new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            this.eventQueue.push(event)
        } else {
            await this.processEvent(event)
        }
    }

    /**
     * Registra logout do usuário
     */
    async recordLogout(
        userId: string,
        data: {
            sessionDuration?: number
            timestamp?: Date
        },
    ): Promise<void> {
        const event: UserMetricsEvent = {
            type: "logout",
            userId,
            data,
            timestamp: data.timestamp || new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            this.eventQueue.push(event)
        } else {
            await this.processEvent(event)
        }
    }

    /**
     * Registra visualização de perfil
     */
    async recordProfileView(
        userId: string,
        data: {
            viewerId?: string
            profileOwnerId: string
            duration?: number
            timestamp?: Date
        },
    ): Promise<void> {
        const event: UserMetricsEvent = {
            type: "profile_view",
            userId,
            data,
            timestamp: data.timestamp || new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            this.eventQueue.push(event)
        } else {
            await this.processEvent(event)
        }
    }

    /**
     * Registra edição de perfil
     */
    async recordProfileEdit(
        userId: string,
        data: {
            fieldsChanged: string[]
            timestamp?: Date
        },
    ): Promise<void> {
        const event: UserMetricsEvent = {
            type: "profile_edit",
            userId,
            data,
            timestamp: data.timestamp || new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            this.eventQueue.push(event)
        } else {
            await this.processEvent(event)
        }
    }

    /**
     * Registra atividade de criação de momento
     */
    async recordMomentActivity(
        userId: string,
        activityType: "moment_create" | "moment_like" | "moment_comment" | "moment_share",
        data: {
            momentId?: string
            targetUserId?: string
            timestamp?: Date
        },
    ): Promise<void> {
        const event: UserMetricsEvent = {
            type: activityType,
            userId,
            data,
            timestamp: data.timestamp || new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            this.eventQueue.push(event)
        } else {
            await this.processEvent(event)
        }
    }

    /**
     * Registra busca realizada
     */
    async recordSearch(
        userId: string,
        data: {
            query: string
            resultsCount: number
            filters?: any
            timestamp?: Date
        },
    ): Promise<void> {
        const event: UserMetricsEvent = {
            type: "search",
            userId,
            data,
            timestamp: data.timestamp || new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            this.eventQueue.push(event)
        } else {
            await this.processEvent(event)
        }
    }

    /**
     * Registra atividade social (follow, unfollow, block, unblock)
     */
    async recordSocialActivity(
        userId: string,
        activityType: "follow" | "unfollow" | "block" | "unblock",
        data: {
            targetUserId: string
            timestamp?: Date
        },
    ): Promise<void> {
        const event: UserMetricsEvent = {
            type: activityType,
            userId,
            data,
            timestamp: data.timestamp || new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            this.eventQueue.push(event)
        } else {
            await this.processEvent(event)
        }
    }

    /**
     * Registra report de usuário
     */
    async recordReport(
        userId: string,
        data: {
            targetUserId: string
            reason: string
            timestamp?: Date
        },
    ): Promise<void> {
        const event: UserMetricsEvent = {
            type: "report",
            userId,
            data,
            timestamp: data.timestamp || new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            this.eventQueue.push(event)
        } else {
            await this.processEvent(event)
        }
    }

    /**
     * Registra mudança de status premium
     */
    async recordPremiumChange(
        userId: string,
        changeType: "premium_upgrade" | "premium_downgrade",
        data: {
            previousPlan?: string
            newPlan: string
            amount?: number
            timestamp?: Date
        },
    ): Promise<void> {
        const event: UserMetricsEvent = {
            type: changeType,
            userId,
            data,
            timestamp: data.timestamp || new Date(),
        }

        if (this.config.enableRealTimeUpdates) {
            this.eventQueue.push(event)
        } else {
            await this.processEvent(event)
        }
    }

    /**
     * Obtém métricas do usuário
     */
    async getMetrics(userId: string): Promise<UserMetrics | null> {
        try {
            return await this.repository.findByUserId(userId)
        } catch (error) {
            console.error("Erro ao obter métricas do usuário:", error)
            return null
        }
    }

    /**
     * Obtém métricas com análise
     */
    async getMetricsWithAnalysis(userId: string): Promise<{
        metrics: UserMetrics
        analysis: any
    } | null> {
        try {
            const metrics = await this.repository.findByUserId(userId)
            if (!metrics) return null

            const analysis = await this.analyzeUserMetrics(metrics)
            return { metrics, analysis }
        } catch (error) {
            console.error("Erro ao obter métricas com análise:", error)
            return null
        }
    }

    /**
     * Obtém métricas em lote
     */
    async getBatchMetrics(userIds: string[]): Promise<UserMetrics[]> {
        const metrics: UserMetrics[] = []
        for (const userId of userIds) {
            const userMetrics = await this.repository.findByUserId(userId)
            if (userMetrics) metrics.push(userMetrics)
        }
        return metrics
    }

    /**
     * Obtém métricas agregadas
     */
    async getAggregatedMetrics(userIds: string[]): Promise<{
        totalUsers: number
        totalLogins: number
        totalProfileViews: number
        totalMomentsCreated: number
        totalLikes: number
        totalComments: number
        averageEngagement: number
        averageSessionDuration: number
        premiumUsers: number
        activeUsers: number
    }> {
        try {
            const metrics = await this.getBatchMetrics(userIds)
            if (metrics.length === 0) {
                return {
                    totalUsers: 0,
                    totalLogins: 0,
                    totalProfileViews: 0,
                    totalMomentsCreated: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    averageEngagement: 0,
                    averageSessionDuration: 0,
                    premiumUsers: 0,
                    activeUsers: 0,
                }
            }

            const aggregated = metrics.reduce(
                (acc, metric) => ({
                    totalLogins: acc.totalLogins + 1, // Assumindo 1 login por métrica
                    totalProfileViews: acc.totalProfileViews + (metric.totalViewsReceived || 0),
                    totalMomentsCreated:
                        acc.totalMomentsCreated + (metric.totalMomentsCreated || 0),
                    totalLikes: acc.totalLikes + (metric.totalLikesGiven || 0),
                    totalComments: acc.totalComments + (metric.totalCommentsGiven || 0),
                    averageEngagement: acc.averageEngagement + (metric.engagementRate || 0),
                    averageSessionDuration:
                        acc.averageSessionDuration + (metric.momentsPerDayAverage || 0),
                    premiumUsers: acc.premiumUsers + 0, // Premium users não disponível nesta versão
                    activeUsers: acc.activeUsers + (metric.totalMomentsCreated > 0 ? 1 : 0),
                }),
                {
                    totalLogins: 0,
                    totalProfileViews: 0,
                    totalMomentsCreated: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    averageEngagement: 0,
                    averageSessionDuration: 0,
                    premiumUsers: 0,
                    activeUsers: 0,
                },
            )

            return {
                totalUsers: metrics.length,
                ...aggregated,
                averageEngagement: aggregated.averageEngagement / metrics.length,
                averageSessionDuration: aggregated.averageSessionDuration / metrics.length,
            }
        } catch (error) {
            console.error("Erro ao calcular métricas agregadas:", error)
            return {
                totalUsers: 0,
                totalLogins: 0,
                totalProfileViews: 0,
                totalMomentsCreated: 0,
                totalLikes: 0,
                totalComments: 0,
                averageEngagement: 0,
                averageSessionDuration: 0,
                premiumUsers: 0,
                activeUsers: 0,
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
                console.error("Erro ao processar evento:", error)
                // Recolocar na fila se não excedeu maxRetries
                if (this.eventQueue.length < this.config.maxRetries * this.config.batchSize) {
                    this.eventQueue.push(event)
                }
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

    private startProcessing(): void {
        this.processingTimer = setInterval(() => {
            this.processEventQueue().catch((error) => {
                console.error("Erro no processamento de eventos:", error)
            })
        }, this.config.processingInterval)
    }

    private async processEvent(event: UserMetricsEvent): Promise<void> {
        try {
            let metrics = await this.repository.findByUserId(event.userId)

            if (!metrics) {
                // Criar métricas básicas se não existirem
                metrics = UserMetrics.create(event.userId)
                await this.repository.create(metrics)
            }

            switch (event.type) {
                case "login":
                    await this.processLoginEvent(metrics, event.data)
                    break
                case "logout":
                    await this.processLogoutEvent(metrics, event.data)
                    break
                case "profile_view":
                    await this.processProfileViewEvent(metrics, event.data)
                    break
                case "profile_edit":
                    await this.processProfileEditEvent(metrics, event.data)
                    break
                case "moment_create":
                    await this.processMomentCreateEvent(metrics, event.data)
                    break
                case "moment_like":
                    await this.processMomentLikeEvent(metrics, event.data)
                    break
                case "moment_comment":
                    await this.processMomentCommentEvent(metrics, event.data)
                    break
                case "moment_share":
                    await this.processMomentShareEvent(metrics, event.data)
                    break
                case "search":
                    await this.processSearchEvent(metrics, event.data)
                    break
                case "follow":
                    await this.processFollowEvent(metrics, event.data)
                    break
                case "unfollow":
                    await this.processUnfollowEvent(metrics, event.data)
                    break
                case "block":
                    await this.processBlockEvent(metrics, event.data)
                    break
                case "unblock":
                    await this.processUnblockEvent(metrics, event.data)
                    break
                case "report":
                    await this.processReportEvent(metrics, event.data)
                    break
                case "premium_upgrade":
                    await this.processPremiumUpgradeEvent(metrics, event.data)
                    break
                case "premium_downgrade":
                    await this.processPremiumDowngradeEvent(metrics, event.data)
                    break
            }

            await this.repository.update(metrics)
        } catch (error) {
            console.error("Erro ao processar evento de métricas:", error)
            throw error
        }
    }

    private async processLoginEvent(metrics: UserMetrics, data: any): Promise<void> {
        // Atualizar métricas de atividade - usando os métodos da entidade
        metrics.incrementActionMetrics({ likesGiven: 0 }) // Apenas para atualizar o timestamp
    }

    private async processLogoutEvent(metrics: UserMetrics, data: any): Promise<void> {
        // Processar logout se necessário
    }

    private async processProfileViewEvent(metrics: UserMetrics, data: any): Promise<void> {
        // Incrementar views recebidas
        metrics.incrementReceivedMetrics({ viewsReceived: 1 })
    }

    private async processProfileEditEvent(metrics: UserMetrics, data: any): Promise<void> {
        // Atualizar timestamp
        metrics.incrementActionMetrics({ likesGiven: 0 })
    }

    private async processMomentCreateEvent(metrics: UserMetrics, data: any): Promise<void> {
        metrics.incrementCreationMetrics({ momentsCreated: 1 })
    }

    private async processMomentLikeEvent(metrics: UserMetrics, data: any): Promise<void> {
        metrics.incrementActionMetrics({ likesGiven: 1 })
    }

    private async processMomentCommentEvent(metrics: UserMetrics, data: any): Promise<void> {
        metrics.incrementActionMetrics({ commentsGiven: 1 })
    }

    private async processMomentShareEvent(metrics: UserMetrics, data: any): Promise<void> {
        metrics.incrementActionMetrics({ sharesGiven: 1 })
    }

    private async processSearchEvent(metrics: UserMetrics, data: any): Promise<void> {
        // Atualizar timestamp
        metrics.incrementActionMetrics({ likesGiven: 0 })
    }

    private async processFollowEvent(metrics: UserMetrics, data: any): Promise<void> {
        metrics.incrementActionMetrics({ followsGiven: 1 })
    }

    private async processUnfollowEvent(metrics: UserMetrics, data: any): Promise<void> {
        // Não há método para decrementar, então não fazemos nada aqui
        // Em um sistema real, você teria um método específico para isso
    }

    private async processBlockEvent(metrics: UserMetrics, data: any): Promise<void> {
        metrics.incrementActionMetrics({ reportsGiven: 1 })
    }

    private async processUnblockEvent(metrics: UserMetrics, data: any): Promise<void> {
        // Não há método para decrementar
    }

    private async processReportEvent(metrics: UserMetrics, data: any): Promise<void> {
        metrics.incrementActionMetrics({ reportsGiven: 1 })
    }

    private async processPremiumUpgradeEvent(metrics: UserMetrics, data: any): Promise<void> {
        // Atualizar timestamp
        metrics.incrementActionMetrics({ likesGiven: 0 })
    }

    private async processPremiumDowngradeEvent(metrics: UserMetrics, data: any): Promise<void> {
        // Atualizar timestamp
        metrics.incrementActionMetrics({ likesGiven: 0 })
    }

    private async analyzeUserMetrics(metrics: UserMetrics): Promise<any> {
        return {
            engagementAnalysis: {
                engagementScore: metrics.engagementRate,
                activityLevel: this.calculateActivityLevel(metrics),
                socialActivity: this.calculateSocialActivity(metrics),
            },
            behaviorAnalysis: {
                sessionPatterns: this.analyzeSessionPatterns(metrics),
                contentPreferences: this.analyzeContentPreferences(metrics),
                peakActivityTimes: this.analyzePeakActivityTimes(metrics),
            },
            performanceAnalysis: {
                growthTrend: this.calculateGrowthTrend(metrics),
                retentionRate: this.calculateRetentionRate(metrics),
                monetizationPotential: this.calculateMonetizationPotential(metrics),
            },
            recommendations: {
                contentSuggestions: this.generateContentSuggestions(metrics),
                engagementImprovements: this.generateEngagementImprovements(metrics),
                monetizationSuggestions: this.generateMonetizationSuggestions(metrics),
            },
        }
    }

    private calculateActivityLevel(metrics: UserMetrics): string {
        const totalActions =
            metrics.totalLikesGiven + metrics.totalCommentsGiven + metrics.totalSharesGiven
        const daysSinceRegistration = this.getDaysSinceRegistration(metrics)

        if (totalActions / daysSinceRegistration > 5) return "high"
        if (totalActions / daysSinceRegistration > 2) return "medium"
        return "low"
    }

    private calculateSocialActivity(metrics: UserMetrics): string {
        const followingCount = metrics.totalFollowing
        const followersCount = metrics.totalFollowers

        if (followingCount > 100 && followersCount > 50) return "high"
        if (followingCount > 20 && followersCount > 10) return "medium"
        return "low"
    }

    private analyzeSessionPatterns(metrics: UserMetrics): any {
        return {
            averageActivity: metrics.momentsPerDayAverage,
            totalInteractions:
                metrics.totalLikesGiven + metrics.totalCommentsGiven + metrics.totalSharesGiven,
            contentCreated: metrics.totalMomentsCreated,
        }
    }

    private analyzeContentPreferences(metrics: UserMetrics): any {
        return {
            totalContent: metrics.totalMomentsCreated,
            engagementReceived:
                metrics.totalLikesReceived +
                metrics.totalCommentsReceived +
                metrics.totalSharesReceived,
            engagementGiven:
                metrics.totalLikesGiven + metrics.totalCommentsGiven + metrics.totalSharesGiven,
        }
    }

    private analyzePeakActivityTimes(metrics: UserMetrics): any {
        return {
            lastUpdate: metrics.lastMetricsUpdate,
            activityLevel: this.calculateActivityLevel(metrics),
        }
    }

    private calculateGrowthTrend(metrics: UserMetrics): string {
        const recentGrowth = metrics.followerGrowthRate30d
        if (recentGrowth > 0.1) return "growing"
        if (recentGrowth > 0) return "stable"
        return "declining"
    }

    private calculateRetentionRate(metrics: UserMetrics): number {
        return metrics.engagementRate
    }

    private calculateMonetizationPotential(metrics: UserMetrics): string {
        const engagementScore = metrics.engagementRate
        const followersCount = metrics.totalFollowers

        if (engagementScore > 0.7 && followersCount > 1000) return "high"
        if (engagementScore > 0.4 && followersCount > 100) return "medium"
        return "low"
    }

    private generateContentSuggestions(metrics: UserMetrics): string[] {
        const suggestions: string[] = []
        const engagementScore = metrics.engagementRate

        if (engagementScore < 0.3) {
            suggestions.push("Criar conteúdo mais interativo")
            suggestions.push("Usar hashtags mais populares")
        }

        if (metrics.totalFollowers < 50) {
            suggestions.push("Interagir mais com outros usuários")
            suggestions.push("Colaborar com outros criadores")
        }

        return suggestions
    }

    private generateEngagementImprovements(metrics: UserMetrics): string[] {
        const improvements: string[] = []
        const activityRate = metrics.momentsPerDayAverage

        if (activityRate < 0.1) {
            improvements.push("Melhorar qualidade do conteúdo")
            improvements.push("Postar em horários de pico")
        }

        return improvements
    }

    private generateMonetizationSuggestions(metrics: UserMetrics): string[] {
        const suggestions: string[] = []
        const potential = this.calculateMonetizationPotential(metrics)

        if (potential === "high") {
            suggestions.push("Considerar programa de monetização")
            suggestions.push("Criar conteúdo premium")
        }

        return suggestions
    }

    private getDaysSinceRegistration(metrics: UserMetrics): number {
        const createdAt = metrics.createdAt
        const now = new Date()
        return Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    }
}
