import {
    ClusterAnalysis,
    ClusterConfiguration,
    ClusterEntity,
    ClusterIssue,
    ClusterProps,
    ClusterQualityEnum,
    ClusterRecommendation,
    ClusterStatistics,
    ClusterStatusEnum,
    ClusterTypeEnum,
} from "./cluster.type"

import { ClusterRules } from "./cluster.rules"
import { generateId } from "@/shared"

/**
 * Entidade de Cluster
 * Representa um agrupamento de momentos similares
 */
export class Cluster {
    private readonly _id: string
    private _name: string
    private _description?: string
    private _centroid: number[]
    private readonly _dimension: number
    private _size: number
    private _density: number
    private _coherence: number
    private _topics: string[]
    private _dominantTopics: string[]
    private _avgEngagement: number
    private _quality: ClusterQualityEnum
    private _type: ClusterTypeEnum
    private _status: ClusterStatusEnum
    private _statistics: ClusterStatistics
    private _config: ClusterConfiguration
    private readonly _createdAt: Date
    private _updatedAt: Date
    private _lastRecomputedAt?: Date

    constructor(props: ClusterProps) {
        this._id = props.id || this.generateId()
        this._name = props.name || `Cluster ${this._id.slice(0, 8)}`
        this._description = props.description
        this._centroid = this.parseCentroid(props.centroid)
        this._dimension = props.dimension
        this._size = props.size || 0
        this._density = props.density || 0
        this._coherence = props.coherence || 0
        this._topics = props.topics || []
        this._dominantTopics = props.dominantTopics || []
        this._avgEngagement = props.avgEngagement || 0
        this._quality = props.quality || this.calculateQualityLevel()
        this._type = props.type || ClusterTypeEnum.CONTENT_BASED
        this._status = props.status || ClusterStatusEnum.ACTIVE
        this._statistics = props.statistics || this.createDefaultStatistics()
        this._config = props.config || ClusterRules.DEFAULT_CONFIG
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()
        this._lastRecomputedAt = props.lastRecomputedAt

        this.validate()
    }

    // ===== GETTERS =====
    get id(): string {
        return this._id
    }
    get name(): string {
        return this._name
    }
    get description(): string | undefined {
        return this._description
    }
    get centroid(): number[] {
        return [...this._centroid]
    }
    get dimension(): number {
        return this._dimension
    }
    get size(): number {
        return this._size
    }
    get density(): number {
        return this._density
    }
    get coherence(): number {
        return this._coherence
    }
    get topics(): string[] {
        return [...this._topics]
    }
    get dominantTopics(): string[] {
        return [...this._dominantTopics]
    }
    get avgEngagement(): number {
        return this._avgEngagement
    }
    get quality(): ClusterQualityEnum {
        return this._quality
    }
    get type(): ClusterTypeEnum {
        return this._type
    }
    get status(): ClusterStatusEnum {
        return this._status
    }
    get statistics(): ClusterStatistics {
        return { ...this._statistics }
    }
    get config(): ClusterConfiguration {
        return { ...this._config }
    }
    get createdAt(): Date {
        return this._createdAt
    }
    get updatedAt(): Date {
        return this._updatedAt
    }
    get lastRecomputedAt(): Date | undefined {
        return this._lastRecomputedAt
    }

    // ===== MÉTODOS DE NEGÓCIO =====

    /**
     * Atualiza o centroide do cluster
     */
    updateCentroid(newCentroid: number[]): void {
        if (newCentroid.length !== this._dimension) {
            throw new Error(
                `Centroid dimension mismatch: expected ${this._dimension}, got ${newCentroid.length}`,
            )
        }

        this._centroid = this.normalizeCentroid(newCentroid)
        this._lastRecomputedAt = new Date()
        this._updatedAt = new Date()
        this.recalculateQuality()
    }

    /**
     * Adiciona um momento ao cluster
     */
    addMoment(): void {
        this._size += 1
        this._statistics.totalMoments += 1
        this._statistics.activeMoments += 1
        this._updatedAt = new Date()
        this.recalculateMetrics()
    }

    /**
     * Remove um momento do cluster
     */
    removeMoment(): void {
        if (this._size > 0) {
            this._size -= 1
            this._statistics.totalMoments = Math.max(0, this._statistics.totalMoments - 1)
            this._statistics.activeMoments = Math.max(0, this._statistics.activeMoments - 1)
            this._updatedAt = new Date()
            this.recalculateMetrics()
        }
    }

    /**
     * Atualiza métricas do cluster
     */
    updateMetrics(metrics: { density?: number; coherence?: number; avgEngagement?: number }): void {
        if (metrics.density !== undefined) {
            this._density = Math.max(0, Math.min(1, metrics.density))
        }
        if (metrics.coherence !== undefined) {
            this._coherence = Math.max(0, Math.min(1, metrics.coherence))
        }
        if (metrics.avgEngagement !== undefined) {
            this._avgEngagement = Math.max(0, metrics.avgEngagement)
        }

        this._updatedAt = new Date()
        this.recalculateQuality()
    }

    /**
     * Atualiza tópicos do cluster
     */
    updateTopics(topics: string[], dominantTopics?: string[]): void {
        if (topics.length > ClusterRules.VALIDATION.MAX_TOPICS) {
            throw new Error(
                `Too many topics: max ${ClusterRules.VALIDATION.MAX_TOPICS}, got ${topics.length}`,
            )
        }

        this._topics = [...new Set(topics)] // Remove duplicatas
        this._dominantTopics = dominantTopics
            ? [...new Set(dominantTopics)]
            : this.identifyDominantTopics()
        this._updatedAt = new Date()
    }

    /**
     * Atualiza estatísticas do cluster
     */
    updateStatistics(stats: Partial<ClusterStatistics>): void {
        this._statistics = {
            ...this._statistics,
            ...stats,
            lastCalculatedAt: new Date(),
        }
        this._updatedAt = new Date()
    }

    /**
     * Arquiva o cluster
     */
    archive(): void {
        this._status = ClusterStatusEnum.ARCHIVED
        this._updatedAt = new Date()
    }

    /**
     * Ativa o cluster
     */
    activate(): void {
        this._status = ClusterStatusEnum.ACTIVE
        this._updatedAt = new Date()
    }

    /**
     * Desativa o cluster
     */
    deactivate(): void {
        this._status = ClusterStatusEnum.INACTIVE
        this._updatedAt = new Date()
    }

    /**
     * Analisa a saúde do cluster
     */
    analyzeHealth(): ClusterAnalysis {
        const issues: ClusterIssue[] = []
        const recommendations: ClusterRecommendation[] = []

        // Verificar coerência
        if (this._coherence < ClusterRules.ANALYSIS.LOW_COHERENCE_THRESHOLD) {
            issues.push({
                type: "low_coherence",
                severity: "high",
                description: `Cluster coherence is ${this._coherence.toFixed(2)}, below threshold`,
                suggestedAction: "Consider recomputing cluster or splitting into sub-clusters",
            })

            recommendations.push({
                type: "recompute",
                reason: "Low coherence detected",
                confidence: ClusterRules.ANALYSIS.RECOMPUTE_RECOMMENDATION_CONFIDENCE,
            })
        }

        // Verificar densidade
        if (this._density < ClusterRules.ANALYSIS.LOW_DENSITY_THRESHOLD) {
            issues.push({
                type: "low_density",
                severity: "medium",
                description: `Cluster density is ${this._density.toFixed(2)}, below threshold`,
                suggestedAction: "Consider merging with similar clusters",
            })
        }

        // Verificar tamanho
        if (this._size > ClusterRules.ANALYSIS.OVERSIZED_THRESHOLD) {
            issues.push({
                type: "oversized",
                severity: "medium",
                description: `Cluster has ${this._size} moments, exceeds recommended size`,
                suggestedAction: "Consider splitting cluster",
            })

            recommendations.push({
                type: "split",
                reason: "Cluster is too large",
                confidence: ClusterRules.ANALYSIS.SPLIT_RECOMMENDATION_CONFIDENCE,
            })
        } else if (this._size < ClusterRules.ANALYSIS.UNDERSIZED_THRESHOLD) {
            issues.push({
                type: "undersized",
                severity: "low",
                description: `Cluster has only ${this._size} moments`,
                suggestedAction: "Consider merging with similar clusters or archiving",
            })

            recommendations.push({
                type: "merge",
                reason: "Cluster is too small",
                confidence: ClusterRules.ANALYSIS.MERGE_RECOMMENDATION_CONFIDENCE,
            })
        }

        // Verificar idade
        if (this.isStale()) {
            issues.push({
                type: "stale",
                severity: "medium",
                description: "Cluster hasn't been recomputed recently",
                suggestedAction: "Recompute cluster centroid",
            })

            recommendations.push({
                type: "recompute",
                reason: "Cluster is stale",
                confidence: ClusterRules.ANALYSIS.RECOMPUTE_RECOMMENDATION_CONFIDENCE + 0.1,
            })
        }

        // Calcular scores
        const coherenceScore = this._coherence
        const densityScore = this._density
        const diversityScore = this.calculateDiversityScore()
        const stabilityScore = this.calculateStabilityScore()

        return {
            clusterId: this._id,
            quality: this._quality,
            coherenceScore,
            densityScore,
            diversityScore,
            stabilityScore,
            recommendations: recommendations.slice(
                0,
                ClusterRules.ANALYSIS.MAX_RECOMMENDATIONS_PER_ANALYSIS,
            ),
            issues: issues.slice(0, ClusterRules.ANALYSIS.MAX_ISSUES_PER_ANALYSIS),
            analyzedAt: new Date(),
        }
    }

    /**
     * Verifica se o cluster está obsoleto
     */
    isStale(): boolean {
        if (!this._lastRecomputedAt) {
            return true
        }

        const hoursSinceRecompute =
            (Date.now() - this._lastRecomputedAt.getTime()) / (1000 * 60 * 60)
        return hoursSinceRecompute > ClusterRules.CLUSTERING.STALE_THRESHOLD_HOURS
    }
    // ===== MÉTODOS PRIVADOS =====

    private parseCentroid(centroid: number[] | string): number[] {
        if (typeof centroid === "string") {
            try {
                return JSON.parse(centroid) as number[]
            } catch (error) {
                throw new Error("Invalid centroid JSON format")
            }
        }
        return centroid
    }

    private normalizeCentroid(centroid: number[]): number[] {
        const magnitude = Math.sqrt(centroid.reduce((sum, val) => sum + val * val, 0))

        if (magnitude === 0) {
            return centroid
        }

        if (magnitude > ClusterRules.VALIDATION.MAX_CENTROID_MAGNITUDE) {
            // Normalizar para magnitude unitária
            return centroid.map((val) => val / magnitude)
        }

        return centroid
    }

    private calculateQualityLevel(): ClusterQualityEnum {
        const score = this.calculateQualityScore()

        if (score >= ClusterRules.QUALITY_MAPPING.EXCELLENT.min) {
            return ClusterQualityEnum.EXCELLENT
        } else if (score >= ClusterRules.QUALITY_MAPPING.HIGH.min) {
            return ClusterQualityEnum.HIGH
        } else if (score >= ClusterRules.QUALITY_MAPPING.MEDIUM.min) {
            return ClusterQualityEnum.MEDIUM
        }
        return ClusterQualityEnum.LOW
    }

    private calculateQualityScore(): number {
        const coherenceScore = this._coherence * ClusterRules.QUALITY_CALCULATION.COHERENCE_WEIGHT
        const densityScore = this._density * ClusterRules.QUALITY_CALCULATION.DENSITY_WEIGHT

        // Score de tamanho (ideal entre optimal min e max)
        const minSizeScore = ClusterRules.QUALITY_CALCULATION.SIZE_SCORE_MIN
        const maxSizeScore = ClusterRules.QUALITY_CALCULATION.SIZE_SCORE_MAX
        let sizeScore: number = minSizeScore
        if (
            this._size >= ClusterRules.QUALITY_THRESHOLDS.OPTIMAL_MIN_SIZE &&
            this._size <= ClusterRules.QUALITY_THRESHOLDS.OPTIMAL_MAX_SIZE
        ) {
            sizeScore = maxSizeScore
        } else if (this._size > 0) {
            const ratio =
                this._size < ClusterRules.QUALITY_THRESHOLDS.OPTIMAL_MIN_SIZE
                    ? this._size / ClusterRules.QUALITY_THRESHOLDS.OPTIMAL_MIN_SIZE
                    : ClusterRules.QUALITY_THRESHOLDS.OPTIMAL_MAX_SIZE / this._size
            sizeScore = Math.max(minSizeScore, ratio * maxSizeScore)
        }
        sizeScore *= ClusterRules.QUALITY_CALCULATION.SIZE_WEIGHT

        const engagementScore =
            Math.min(this._avgEngagement, ClusterRules.QUALITY_CALCULATION.ENGAGEMENT_MAX) *
            ClusterRules.QUALITY_CALCULATION.ENGAGEMENT_WEIGHT

        return coherenceScore + densityScore + sizeScore + engagementScore
    }

    private recalculateQuality(): void {
        this._quality = this.calculateQualityLevel()
    }

    private recalculateMetrics(): void {
        this.recalculateQuality()

        // Atualizar estatísticas
        if (this._size > 0) {
            this._density = Math.min(1, this._statistics.totalInteractions / (this._size * 100))
        }
    }

    private identifyDominantTopics(): string[] {
        // Retorna os 3 tópicos mais frequentes
        return this._topics.slice(0, 3)
    }

    private calculateDiversityScore(): number {
        if (this._topics.length === 0) {
            return 0
        }

        // Score baseado na variedade de tópicos
        const topicRatio = Math.min(this._topics.length / ClusterRules.VALIDATION.MAX_TOPICS, 1)
        const minScore = 0.2
        return topicRatio * 0.8 + minScore
    }

    private calculateStabilityScore(): number {
        // Score baseado na idade e taxa de crescimento
        const ageInDays = (Date.now() - this._createdAt.getTime()) / (1000 * 60 * 60 * 24)
        const maxAgeDays = 30
        const ageScore = Math.min(ageInDays / maxAgeDays, 1)

        const growthStability = 1 - Math.abs(this._statistics.growthRate)
        return ageScore * 0.5 + growthStability * 0.5
    }

    private createDefaultStatistics(): ClusterStatistics {
        return {
            totalMoments: 0,
            activeMoments: 0,
            totalInteractions: 0,
            avgViewsPerMoment: 0,
            avgLikesPerMoment: 0,
            avgCommentsPerMoment: 0,
            avgSharesPerMoment: 0,
            engagementRate: 0,
            growthRate: 0,
            retentionRate: 0,
            lastCalculatedAt: new Date(),
        }
    }

    private validate(): void {
        // Validar campos obrigatórios
        if (!this._centroid || this._centroid.length === 0) {
            throw new Error("Centroid is required")
        }

        if (this._centroid.length !== this._dimension) {
            throw new Error(
                `Centroid dimension mismatch: expected ${this._dimension}, got ${this._centroid.length}`,
            )
        }

        // Validar dimensão
        if (
            this._dimension < ClusterRules.CLUSTERING.MIN_DIMENSION ||
            this._dimension > ClusterRules.CLUSTERING.MAX_DIMENSION
        ) {
            throw new Error(
                `Invalid dimension: must be between ${ClusterRules.CLUSTERING.MIN_DIMENSION} and ${ClusterRules.CLUSTERING.MAX_DIMENSION}`,
            )
        }

        // Validar ranges
        if (this._coherence < 0 || this._coherence > 1) {
            throw new Error("Coherence must be between 0 and 1")
        }

        if (this._density < 0 || this._density > 1) {
            throw new Error("Density must be between 0 and 1")
        }

        // Validar nome
        if (this._name.length > ClusterRules.VALIDATION.MAX_NAME_LENGTH) {
            throw new Error(
                `Name too long: max ${ClusterRules.VALIDATION.MAX_NAME_LENGTH} characters`,
            )
        }

        // Validar descrição
        if (
            this._description &&
            this._description.length > ClusterRules.VALIDATION.MAX_DESCRIPTION_LENGTH
        ) {
            throw new Error(
                `Description too long: max ${ClusterRules.VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
            )
        }

        // Validar tópicos
        if (this._topics.length > ClusterRules.VALIDATION.MAX_TOPICS) {
            throw new Error(
                `Too many topics: max ${ClusterRules.VALIDATION.MAX_TOPICS}, got ${this._topics.length}`,
            )
        }
    }

    private generateId(): string {
        return `cluster_${generateId()}`
    }

    // ===== MÉTODOS DE SERIALIZAÇÃO =====

    toEntity(): ClusterEntity {
        return {
            id: this._id,
            name: this._name,
            description: this._description,
            centroid: JSON.stringify(this._centroid),
            dimension: this._dimension,
            size: this._size,
            density: this._density,
            coherence: this._coherence,
            topics: this._topics,
            dominantTopics: this._dominantTopics,
            avgEngagement: this._avgEngagement,
            quality: this._quality,
            type: this._type,
            status: this._status,
            statistics: this._statistics,
            config: this._config,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            lastRecomputedAt: this._lastRecomputedAt,
        }
    }

    static fromEntity(entity: ClusterEntity): Cluster {
        return new Cluster({
            id: entity.id,
            name: entity.name,
            description: entity.description,
            centroid: entity.centroid,
            dimension: entity.dimension,
            size: entity.size,
            density: entity.density,
            coherence: entity.coherence,
            topics: entity.topics,
            dominantTopics: entity.dominantTopics,
            avgEngagement: entity.avgEngagement,
            quality: entity.quality,
            type: entity.type,
            status: entity.status,
            statistics: entity.statistics,
            config: entity.config,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            lastRecomputedAt: entity.lastRecomputedAt,
        })
    }

    static create(props: Omit<ClusterProps, "id" | "createdAt" | "updatedAt">): Cluster {
        return new Cluster({
            ...props,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    }
}
