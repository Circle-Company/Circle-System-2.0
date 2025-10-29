/**
 * User Metrics Entity
 *
 * Responsável por gerenciar métricas relacionadas ao usuário no sistema
 * Features:
 * - Métricas de engajamento
 * - Métricas de crescimento
 * - Métricas de atividade
 * - Cálculos automáticos de taxas
 * - Validação de dados
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { GrowthMetrics, MetricsUpdateInput, UserMetricsProps } from "../types/user.metrics.type"

import { generateId } from "@/shared"

/**
 * Entidade UserMetrics
 */
export class UserMetrics {
    private readonly _id: string
    private readonly _userId: string
    private _totalLikesReceived: number
    private _totalViewsReceived: number
    private _totalSharesReceived: number
    private _totalCommentsReceived: number
    private _totalMomentsCreated: number
    private _totalLikesGiven: number
    private _totalCommentsGiven: number
    private _totalSharesGiven: number
    private _totalFollowsGiven: number
    private _totalReportsSpecifically: number
    private _totalFollowers: number
    private _totalFollowing: number
    private _totalRelations: number
    private _engagementRate: number
    private _reachRate: number
    private _momentsPublishedGrowthRate30d: number
    private _followerGrowthRate30d: number
    private _engagementGrowthRate30d: number
    private _interactionsGrowthRate30d: number
    private _momentsPerDayAverage: number
    private _reportsReceived: number
    private _violationsCount: number
    private _lastMetricsUpdate: Date
    private readonly _createdAt: Date
    private _updatedAt: Date

    constructor(props: UserMetricsProps) {
        this._id = props.id || generateId()
        this._userId = props.userId
        
        // Helper para garantir valores não negativos
        const ensureNonNegative = (value: number | undefined): number => 
            value !== undefined && value >= 0 ? value : 0
        
        this._totalLikesReceived = ensureNonNegative(props.totalLikesReceived)
        this._totalViewsReceived = ensureNonNegative(props.totalViewsReceived)
        this._totalSharesReceived = ensureNonNegative(props.totalSharesReceived)
        this._totalCommentsReceived = ensureNonNegative(props.totalCommentsReceived)
        this._totalMomentsCreated = ensureNonNegative(props.totalMomentsCreated)
        this._totalLikesGiven = ensureNonNegative(props.totalLikesGiven)
        this._totalCommentsGiven = ensureNonNegative(props.totalCommentsGiven)
        this._totalSharesGiven = ensureNonNegative(props.totalSharesGiven)
        this._totalFollowsGiven = ensureNonNegative(props.totalFollowsGiven)
        this._totalReportsSpecifically = ensureNonNegative(props.totalReportsGiven)
        this._totalFollowers = ensureNonNegative(props.totalFollowers)
        this._totalFollowing = ensureNonNegative(props.totalFollowing)
        this._totalRelations = ensureNonNegative(props.totalRelations)
        this._engagementRate = Math.max(0, ensureNonNegative(props.engagementRate))
        this._reachRate = Math.max(0, ensureNonNegative(props.reachRate))
        this._momentsPublishedGrowthRate30d = ensureNonNegative(props.momentsPublishedGrowthRate30d)
        this._followerGrowthRate30d = ensureNonNegative(props.followerGrowthRate30d)
        this._engagementGrowthRate30d = ensureNonNegative(props.engagementGrowthRate30d)
        this._interactionsGrowthRate30d = ensureNonNegative(props.interactionsGrowthRate30d)
        this._momentsPerDayAverage = ensureNonNegative(props.momentsPerDayAverage)
        this._reportsReceived = ensureNonNegative(props.reportsReceived)
        this._violationsCount = ensureNonNegative(props.violationsCount)
        this._lastMetricsUpdate = props.lastMetricsUpdate || new Date()
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()

        // Não validar automaticamente - deixar para o validate() manual se necessário
    }

    // ===== GETTERS =====
    get id(): string {
        return this._id
    }
    get userId(): string {
        return this._userId
    }
    get totalLikesReceived(): number {
        return this._totalLikesReceived
    }
    get totalViewsReceived(): number {
        return this._totalViewsReceived
    }
    get totalSharesReceived(): number {
        return this._totalSharesReceived
    }
    get totalCommentsReceived(): number {
        return this._totalCommentsReceived
    }
    get totalMomentsCreated(): number {
        return this._totalMomentsCreated
    }
    get totalLikesGiven(): number {
        return this._totalLikesGiven
    }
    get totalCommentsGiven(): number {
        return this._totalCommentsGiven
    }
    get totalSharesGiven(): number {
        return this._totalSharesGiven
    }
    get totalFollowsGiven(): number {
        return this._totalFollowsGiven
    }
    get totalReportsGiven(): number {
        return this._totalReportsSpecifically
    }
    get totalFollowers(): number {
        return this._totalFollowers
    }
    get totalFollowing(): number {
        return this._totalFollowing
    }
    get totalRelations(): number {
        return this._totalRelations
    }
    get engagementRate(): number {
        return this._engagementRate
    }
    get reachRate(): number {
        return this._reachRate
    }
    get momentsPublishedGrowthRate30d(): number {
        return this._momentsPublishedGrowthRate30d
    }
    get followerGrowthRate30d(): number {
        return this._followerGrowthRate30d
    }
    get engagementGrowthRate30d(): number {
        return this._engagementGrowthRate30d
    }
    get interactionsGrowthRate30d(): number {
        return this._interactionsGrowthRate30d
    }
    get momentsPerDayAverage(): number {
        return this._momentsPerDayAverage
    }
    get reportsReceived(): number {
        return this._reportsReceived
    }
    get violationsCount(): number {
        return this._violationsCount
    }
    get lastMetricsUpdate(): Date {
        return this._lastMetricsUpdate
    }
    get createdAt(): Date {
        return this._createdAt
    }
    get updatedAt(): Date {
        return this._updatedAt
    }

    // ===== MÉTODOS DE DOMÍNIO =====

    /**
     * Incrementa métricas de recebimento (likes, views, etc.)
     */
    public incrementReceivedMetrics(metrics: Partial<MetricsUpdateInput>): void {
        if (metrics.likesReceived) {
            this._totalLikesReceived += metrics.likesReceived
        }
        if (metrics.viewsReceived) {
            this._totalViewsReceived += metrics.viewsReceived
        }
        if (metrics.sharesReceived) {
            this._totalSharesReceived += metrics.sharesReceived
        }
        if (metrics.commentsReceived) {
            this._totalCommentsReceived += metrics.commentsReceived
        }

        this.recalculateEngagementRate()
        this.updateLastMetricsUpdate()
    }

    /**
     * Incrementa métricas de criação (memories, moments)
     */
    public incrementCreationMetrics(metrics: Partial<MetricsUpdateInput>): void {
        if (metrics.momentsCreated) {
            this._totalMomentsCreated += metrics.momentsCreated
        }

        this.recalculateActivityAverages()
        this.updateLastMetricsUpdate()
    }

    /**
     * Incrementa métricas de ações (likes given, comments given, etc.)
     */
    public incrementActionMetrics(metrics: Partial<MetricsUpdateInput>): void {
        if (metrics.likesGiven) {
            this._totalLikesGiven += metrics.likesGiven
        }

        if (metrics.commentsGiven) {
            this._totalCommentsGiven += metrics.commentsGiven
        }
        if (metrics.sharesGiven) {
            this._totalSharesGiven += metrics.sharesGiven
        }
        if (metrics.followsGiven) {
            this._totalFollowsGiven += metrics.followsGiven
        }
        if (metrics.reportsGiven) {
            this._totalReportsSpecifically += metrics.reportsGiven
        }

        this.updateLastMetricsUpdate()
    }

    /**
     * Atualiza relacionamentos (followers/following)
     */
    public updateRelationshipMetrics(metrics: Partial<MetricsUpdateInput>): void {
        if (metrics.followers !== undefined) {
            this._totalFollowers = metrics.followers
        }
        if (metrics.following !== undefined) {
            this._totalFollowing = metrics.following
        }

        this._totalRelations = this._totalFollowers + this._totalFollowing
        this.updateLastMetricsUpdate()
    }

    /**
     * Atualiza métricas de moderação
     */
    public updateModerationMetrics(reportsReceived: number, violations: number): void {
        this._reportsReceived += reportsReceived
        this._violationsCount += violations
        this.updateLastMetricsUpdate()
    }

    /**
     * Recalcula taxa de engajamento automaticamente
     */
    public recalculateEngagementRate(): void {
        const totalEngagement =
            this._totalLikesReceived +
            this._totalViewsReceived +
            this._totalSharesReceived +
            this._totalCommentsReceived

        if (this._totalMomentsCreated > 0) {
            this._engagementRate = totalEngagement / this._totalMomentsCreated
        } else {
            this._engagementRate = 0
        }
    }

    /**
     * Recalcula métricas médias de atividade
     */
    public recalculateActivityAverages(): void {
        const currentDate = new Date()
        const daysSinceCreation = Math.ceil(
            (currentDate.getTime() - this._createdAt.getTime()) / (1000 * 60 * 60 * 24),
        )

        if (daysSinceCreation > 0) {
            this._momentsPerDayAverage = this._totalMomentsCreated / daysSinceCreation
        }
    }

    /**
     * Calcula taxa de alcance baseada nos seguidores
     */
    public recalculateReachRate(): void {
        if (this._totalFollowers > 0) {
            this._reachRate = (this._totalMomentsCreated * this._totalFollowers) / 1000
        } else {
            this._reachRate = 0
        }
    }

    /**
     * Atualiza métricas de crescimento em 30 dias
     */
    public updateGrowthMetrics(growth: GrowthMetrics): void {
        this._momentsPublishedGrowthRate30d = growth.momentsPublishedGrowthRate30d
        this._followerGrowthRate30d = growth.followerGrowthRate30d
        this._engagementGrowthRate30d = growth.engagementGrowthRate30d
        this._interactionsGrowthRate30d = growth.interactionsGrowthRate30d

        this.updateLastMetricsUpdate()
    }

    /**
     * Obtém resumo das métricas principais
     */
    public getMetricsSummary(): {
        totalContent: number
        totalEngagement: number
        totalRelations: number
        averageEngagementRate: number
        averageActivityRate: number
    } {
        return {
            totalContent: this._totalMomentsCreated,
            totalEngagement:
                this._totalLikesReceived +
                this._totalViewsReceived +
                this._totalSharesReceived +
                this._totalCommentsReceived,
            totalRelations: this._totalRelations,
            averageEngagementRate: this._engagementRate,
            averageActivityRate: this._momentsPerDayAverage,
        }
    }

    /**
     * Verifica se o usuário está ativo baseado nas métricas
     */
    public isRecentlyActiveUser(daysThreshold: number = 30): boolean {
        const currentDate = new Date()
        const daysSinceUpdate = Math.floor(
            (currentDate.getTime() - this._lastMetricsUpdate.getTime()) / (1000 * 60 * 60 * 24),
        )

        return daysSinceUpdate <= daysThreshold
    }

    /**
     * Verifica se o usuário é considerado influencer (para Swipe Engine)
     */
    public isInfluencer(minFollowers: number = 10000, minEngagementRate: number = 0.1): boolean {
        return this._totalFollowers >= minFollowers && this._engagementRate >= minEngagementRate
    }

    // ===== MÉTODOS PRIVADOS =====

    private updateLastMetricsUpdate(): void {
        this._lastMetricsUpdate = new Date()
        this._updatedAt = new Date()
    }

    private validate(): void {
        if (!this._userId || this._userId.trim().length === 0) {
            throw new Error("User ID is required")
        }

        // Validate that negative numbers are not allowed
        const metrics = [
            this._totalLikesReceived,
            this._totalViewsReceived,
            this._totalSharesReceived,
            this._totalCommentsReceived,
            this._totalMomentsCreated,
            this._totalLikesGiven,
            this._totalCommentsGiven,
            this._totalSharesGiven,
            this._totalFollowsGiven,
            this._totalReportsSpecifically,
            this._totalFollowers,
            this._totalFollowing,
            this._reportsReceived,
            this._violationsCount,
        ]

        for (const metric of metrics) {
            if (metric < 0) {
                throw new Error("Metrics cannot be negative")
            }
        }

        // Validate rates
        const rates = [
            this._engagementRate,
            this._reachRate,
            this._momentsPublishedGrowthRate30d,
            this._followerGrowthRate30d,
            this._engagementGrowthRate30d,
            this._interactionsGrowthRate30d,
            this._momentsPerDayAverage,
        ]

        for (const rate of rates) {
            if (rate < 0 || rate > 1000) {
                // Reasonable maximum rate
                throw new Error("Rates must be between 0 and 1000")
            }
        }
    }

    /**
     * Factory method para criar métricas inicializadas
     */
    public static create(userId: string): UserMetrics {
        const now = new Date()
        return new UserMetrics({
            userId,
            totalLikesReceived: 0,
            totalViewsReceived: 0,
            totalSharesReceived: 0,
            totalCommentsReceived: 0,
            totalMomentsCreated: 0,
            totalLikesGiven: 0,
            totalCommentsGiven: 0,
            totalSharesGiven: 0,
            totalFollowsGiven: 0,
            totalReportsGiven: 0,
            totalFollowers: 0,
            totalFollowing: 0,
            totalRelations: 0,
            engagementRate: 0,
            reachRate: 0,
            momentsPublishedGrowthRate30d: 0,
            followerGrowthRate30d: 0,
            engagementGrowthRate30d: 0,
            interactionsGrowthRate30d: 0,
            momentsPerDayAverage: 0,
            reportsReceived: 0,
            violationsCount: 0,
            lastMetricsUpdate: now,
            createdAt: now,
            updatedAt: now,
        })
    }

    /**
     * Método para serialização
     */
    public toJSON(): UserMetricsProps {
        return {
            id: this._id,
            userId: this._userId,
            totalLikesReceived: this._totalLikesReceived,
            totalViewsReceived: this._totalViewsReceived,
            totalSharesReceived: this._totalSharesReceived,
            totalCommentsReceived: this._totalCommentsReceived,
            totalMomentsCreated: this._totalMomentsCreated,
            totalLikesGiven: this._totalLikesGiven,
            totalCommentsGiven: this._totalCommentsGiven,
            totalSharesGiven: this._totalSharesGiven,
            totalFollowsGiven: this._totalFollowsGiven,
            totalReportsGiven: this._totalReportsSpecifically,
            totalFollowers: this._totalFollowers,
            totalFollowing: this._totalFollowing,
            totalRelations: this._totalRelations,
            engagementRate: this._engagementRate,
            reachRate: this._reachRate,
            momentsPublishedGrowthRate30d: this._momentsPublishedGrowthRate30d,
            followerGrowthRate30d: this._followerGrowthRate30d,
            engagementGrowthRate30d: this._engagementGrowthRate30d,
            interactionsGrowthRate30d: this._interactionsGrowthRate30d,
            momentsPerDayAverage: this._momentsPerDayAverage,
            reportsReceived: this._reportsReceived,
            violationsCount: this._violationsCount,
            lastMetricsUpdate: this._lastMetricsUpdate,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        }
    }
}
