import { Encrypt, generateId, textLib } from "@/shared"
import {
    UserEmbedding,
    UserInterctionsSummary,
    UserPreferences,
    UserProfilePicture,
    UserProps,
    UserPublicProfile,
    UserStatus,
    UserTerm,
} from "../types/user.type"
import {
    shouldUpdatePassword,
    validateDescription,
    validateName,
    validatePassword,
    validateSearchMatchTerm,
    validateUsername,
} from "../user.rules"

import { Level } from "@/domain/authorization"
import { UserMetrics } from "./user.metrics.entity"

/**
 * User Domain Entity
 *
 * Entidade principal do usuário que integra perfeitamente com o sistema de Moments.
 * Projetada para ser robusta, profissional e escalável, sem restrições de criação de conteúdo.
 *
 * Features:
 * - Gestão completa de perfil de usuário
 * - Integração nativa com sistema de métricas
 * - Suporte a embeddings para recomendações
 * - Sistema de preferências personalizáveis
 * - Controle de status e permissões flexível
 * - Histórico de interações robusto
 *
 * @author Circle Team
 * @version 2.0.0
 */
export class User {
    private readonly _id: string
    private _username: string
    private _name: string | null
    private _searchMatchTerm: string
    private _password: string
    private _oldPassword: string | null
    private _description: string | null
    private _lastPasswordUpdatedAt: Date | null
    private _profilePicture: UserProfilePicture | null
    private _status: UserStatus | null
    private _metrics: UserMetrics | null
    private _preferences: UserPreferences | null
    private _terms: UserTerm | null
    private _embedding: UserEmbedding | null
    private _interctionsSummary: UserInterctionsSummary | null
    private readonly _createdAt: Date
    private _updatedAt: Date

    constructor(props: UserProps) {
        this._id = props.id || generateId()
        this._username = props.username
        this._name = props.name || null
        this._searchMatchTerm = props.searchMatchTerm
        this._password = props.password
        this._oldPassword = props.oldPassword || null
        this._description = props.description || null
        this._lastPasswordUpdatedAt = props.lastPasswordUpdatedAt || null
        this._profilePicture = props.profilePicture || null
        this._status = props.status || null
        this._metrics = props.metrics || null
        this._preferences = props.preferences || null
        this._terms = props.terms || null
        this._embedding = props.embedding || null
        this._interctionsSummary = props.interctionsSummary || null
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()

        this.validate()
    }

    // Getters
    get id(): string {
        return this._id
    }

    get username(): string {
        return this._username
    }

    get name(): string | null {
        return this._name
    }

    get searchMatchTerm(): string {
        return this._searchMatchTerm
    }

    get password(): string {
        return this._password
    }

    get oldPassword(): string | null {
        return this._oldPassword
    }

    get description(): string | null {
        return this._description
    }

    get lastPasswordUpdatedAt(): Date | null {
        return this._lastPasswordUpdatedAt
    }

    get profilePicture(): UserProfilePicture | null {
        return this._profilePicture
    }

    get status(): UserStatus | null {
        return this._status
    }

    get metrics(): UserMetrics | null {
        return this._metrics
    }

    get preferences(): UserPreferences | null {
        return this._preferences
    }

    get terms(): UserTerm | null {
        return this._terms
    }

    get embedding(): UserEmbedding | null {
        return this._embedding
    }

    get interctionsSummary(): UserInterctionsSummary | null {
        return this._interctionsSummary
    }

    get createdAt(): Date {
        return this._createdAt
    }

    get updatedAt(): Date {
        return this._updatedAt
    }

    get level(): string {
        return this._status?.accessLevel || "user"
    }

    // Métodos de domínio
    public updateUsername(username: string): void {
        if (!username) {
            throw new Error("Username não pode ser vazio")
        }
        if (!validateUsername(username)) {
            throw new Error("Username inválido")
        }
        this._username = username.trim()
        this._updatedAt = new Date()
    }

    public updateName(name: string): void {
        if (!validateName(name)) {
            throw new Error("Nome inválido")
        }
        this._name = name.trim()
        this._updatedAt = new Date()
    }

    public updateSearchMatchTerm(searchTerm: string): void {
        if (!validateSearchMatchTerm(searchTerm)) {
            throw new Error("Termo de busca inválido")
        }
        this._searchMatchTerm = searchTerm.trim()
        this._updatedAt = new Date()
    }

    public updateDescription(description: string): void {
        if (!validateDescription(description)) {
            throw new Error("Descrição inválida")
        }
        this._description = description || null
        this._updatedAt = new Date()
    }

    public async validatePassword(inputPassword: string): Promise<boolean> {
        const encrypt = new Encrypt(inputPassword)
        return await encrypt.compare({
            value: inputPassword,
            encryptedValue: this._password,
        })
    }

    public updateProfilePicture(profilePicture: UserProfilePicture): void {
        this._profilePicture = profilePicture
        this._updatedAt = new Date()
    }

    public updateStatus(status: UserStatus): void {
        this._status = status
        this._updatedAt = new Date()
    }

    public updateMetrics(metrics: UserMetrics): void {
        this._metrics = metrics
        this._updatedAt = new Date()
    }

    public updatePreferences(preferences: UserPreferences): void {
        this._preferences = preferences
        this._updatedAt = new Date()
    }

    public updateTerms(terms: UserTerm): void {
        this._terms = terms
        this._updatedAt = new Date()
    }

    public updateEmbedding(embedding: UserEmbedding): void {
        this._embedding = embedding
        this._updatedAt = new Date()
    }

    public updateInterctionsSummary(summary: UserInterctionsSummary): void {
        this._interctionsSummary = summary
        this._updatedAt = new Date()
    }

    // ===== MÉTODOS DE INTEGRAÇÃO COM MOMENTS =====

    /**
     * Verifica se o usuário pode criar Moments
     * Removido qualquer bloqueio - todos os usuários podem criar conteúdo
     */
    public canCreateMoments(): boolean {
        if (this.canAccessAdminFeatures()) {
            return true
        }
        return this.isActive()
    }

    /**
     * Verifica se o usuário pode interagir com Moments
     */
    public canInteractWithMoments(): boolean {
        return this.isActive() && !this.isMuted()
    }

    /**
     * Verifica se o usuário pode ver Moments de outros usuários
     */
    public canViewMoments(): boolean {
        return this.isActive()
    }

    /**
     * Obtém configurações de visibilidade padrão para novos Moments
     */
    public getDefaultMomentVisibility(): "public" | "followers_only" | "private" {
        return (this._preferences as any)?.defaultMomentVisibility || "public"
    }

    // ===== MÉTODOS DE MÉTRICAS INTEGRADAS =====

    /**
     * Incrementa métricas quando usuário recebe engajamento
     */
    public incrementReceivedMetrics(metrics: {
        likesReceived?: number
        viewsReceived?: number
        sharesReceived?: number
        commentsReceived?: number
    }): void {
        if (this._metrics) {
            this._metrics.incrementReceivedMetrics(metrics)
            this._updatedAt = new Date()
        }
    }

    /**
     * Incrementa métricas quando usuário cria conteúdo
     */
    public incrementCreationMetrics(metrics: {
        memoriesCreated?: number
        momentsCreated?: number
    }): void {
        if (this._metrics) {
            this._metrics.incrementCreationMetrics(metrics)
            this._updatedAt = new Date()
        }
    }

    /**
     * Incrementa métricas quando usuário interage com conteúdo
     */
    public incrementActionMetrics(metrics: {
        likesGiven?: number
        commentsGiven?: number
        sharesGiven?: number
        followsGiven?: number
        reportsGiven?: number
    }): void {
        if (this._metrics) {
            this._metrics.incrementActionMetrics(metrics)
            this._updatedAt = new Date()
        }
    }

    /**
     * Atualiza métricas de relacionamentos sociais
     */
    public updateRelationshipMetrics(followers: number, following: number): void {
        if (this._metrics) {
            this._metrics.updateRelationshipMetrics({ followers, following })
            this._updatedAt = new Date()
        }
    }

    /**
     * Atualiza métricas de moderação
     */
    public updateModerationMetrics(reportsReceived: number, violations: number): void {
        if (this._metrics) {
            this._metrics.updateModerationMetrics(reportsReceived, violations)
            this._updatedAt = new Date()
        }
    }

    /**
     * Verifica se o usuário está ativo baseado nas métricas
     */
    public isActiveByMetrics(daysThreshold?: number): boolean {
        return this._metrics?.isRecentlyActiveUser(daysThreshold) ?? false
    }

    /**
     * Verifica se o usuário é considerado influencer
     */
    public isInfluencer(minFollowers?: number, minEngagementRate?: number): boolean {
        return this._metrics?.isInfluencer(minFollowers, minEngagementRate) ?? false
    }

    /**
     * Obtém resumo completo das métricas do usuário
     */
    public getMetricsSummary(): {
        totalContent: number
        totalEngagement: number
        totalRelations: number
        averageEngagementRate: number
        averageActivityRate: number
    } | null {
        return this._metrics?.getMetricsSummary() ?? null
    }

    /**
     * Obtém estatísticas de engajamento
     */
    public getEngagementMetrics(): {
        totalLikesReceived: number
        totalViewsReceived: number
        totalCommentsReceived: number
        totalSharesReceived: number
        engagementRate: number
        reachRate: number
    } {
        if (!this._metrics) {
            return {
                totalLikesReceived: 0,
                totalViewsReceived: 0,
                totalCommentsReceived: 0,
                totalSharesReceived: 0,
                engagementRate: 0,
                reachRate: 0,
            }
        }

        return {
            totalLikesReceived: this._metrics.totalLikesReceived,
            totalViewsReceived: this._metrics.totalViewsReceived,
            totalCommentsReceived: this._metrics.totalCommentsReceived,
            totalSharesReceived: this._metrics.totalSharesReceived,
            engagementRate: this._metrics.engagementRate,
            reachRate: this._metrics.reachRate,
        }
    }

    // ===== MÉTODOS DE STATUS E PERMISSÕES =====

    /**
     * Verifica se o usuário está ativo no sistema
     */
    public isActive(): boolean {
        return (
            this._status?.accessLevel !== undefined &&
            this._status?.accessLevel !== null &&
            !this._status?.blocked &&
            !this._status?.deleted
        )
    }

    /**
     * Verifica se o usuário foi verificado
     */
    public isVerified(): boolean {
        return this._status?.verified || false
    }

    /**
     * Verifica se o usuário está bloqueado
     */
    public isBlocked(): boolean {
        return this._status?.blocked || false
    }

    /**
     * Verifica se o usuário foi deletado
     */
    public isDeleted(): boolean {
        return this._status?.deleted || false
    }

    /**
     * Verifica se o usuário está silenciado
     */
    public isMuted(): boolean {
        return this._status?.muted || false
    }

    /**
     * Verifica se o usuário pode acessar recursos administrativos
     */
    public canAccessAdminFeatures(): boolean {
        return this._status?.accessLevel === Level.ADMIN || this._status?.accessLevel === Level.SUDO
    }

    // ===== MÉTODOS DE EMBEDDINGS E RECOMENDAÇÕES =====

    /**
     * Verifica se o usuário tem embedding configurado para recomendações
     */
    public hasEmbedding(): boolean {
        return this._embedding !== null && this._embedding.vector.length > 0
    }

    /**
     * Obtém dados do embedding para sistema de recomendações
     */
    public getSwipeEngineEmbedding(): {
        vector: string
        dimension: number
        metadata: Record<string, any>
        lastUpdate: Date
    } | null {
        if (!this._embedding) return null

        return {
            vector: this._embedding.vector,
            dimension: this._embedding.dimension,
            metadata: this._embedding.metadata,
            lastUpdate: this._embedding.updatedAt,
        }
    }

    /**
     * Atualiza embedding com novos dados de comportamento
     */
    public updateEmbeddingFromBehavior(behaviorData: {
        contentInteractions: Record<string, number>
        topicPreferences: string[]
        timePatterns: Record<string, number>
        socialConnections: string[]
    }): void {
        const metadata = {
            ...this._embedding?.metadata,
            ...behaviorData,
            lastBehaviorUpdate: new Date().toISOString(),
        }

        if (this._embedding) {
            this._embedding.metadata = metadata
            this._embedding.updatedAt = new Date()
        }

        this._updatedAt = new Date()
    }

    /**
     * Registra login do usuário - atualiza lastLogin e outras propriedades
     */
    public recordLogin(loginData?: {
        device?: string
        ipAddress?: string
        userAgent?: string
        location?: string
    }): void {
        // Atualizar timestamp de última atividade
        this._updatedAt = new Date()

        // Atualizar métricas se disponível
        if (this._metrics) {
            this._metrics.incrementActionMetrics({ likesGiven: 0 }) // Apenas para atualizar timestamp
        }

        // Atualizar embedding com dados de login se disponível
        if (this._embedding && loginData) {
            const metadata = {
                ...this._embedding.metadata,
                lastLogin: new Date().toISOString(),
                lastLoginDevice: loginData.device,
                lastLoginIp: loginData.ipAddress,
                loginHistory: [
                    ...(this._embedding.metadata?.loginHistory || []).slice(-9), // Manter últimos 10
                    {
                        timestamp: new Date().toISOString(),
                        device: loginData.device,
                        ip: loginData.ipAddress,
                        location: loginData.location,
                    },
                ],
            }

            this._embedding.metadata = metadata
            this._embedding.updatedAt = new Date()
        }
    }

    /**
     * Atualiza senha do usuário
     */
    public updatePassword(newPassword: string): void {
        // Armazenar senha antiga
        this._oldPassword = this._password
        this._password = newPassword
        this._lastPasswordUpdatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Verifica se a senha precisa ser atualizada (política de segurança)
     */
    public shouldUpdatePassword(maxDays?: number): boolean {
        if (!this._lastPasswordUpdatedAt) return true

        if (maxDays) {
            const daysSinceUpdate = Math.floor(
                (new Date().getTime() - this._lastPasswordUpdatedAt.getTime()) /
                    (1000 * 60 * 60 * 24),
            )
            return daysSinceUpdate > maxDays
        }

        return shouldUpdatePassword(this._lastPasswordUpdatedAt)
    }

    public canMentionUsers(): boolean {
        return this.isActive() && !this.isMuted()
    }

    public canBeMentioned(): boolean {
        return this.isActive() && !this.isBlocked()
    }

    public canSign(): boolean {
        const active = this.isActive()
        const blocked = this.isBlocked()
        const deleted = this.isDeleted()

        console.log("🔍 canSign check:", {
            username: this.username,
            active,
            blocked,
            deleted,
            status: this._status,
            canSign: active && !blocked && !deleted,
        })

        return active && !blocked && !deleted
    }

    /**
     * Verifica se o perfil do usuário pode ser visualizado publicamente
     */
    public isPublicProfile(): boolean {
        return this.isActive() && !this.isDeleted()
    }

    /**
     * Verifica se o usuário pode visualizar outro perfil
     * Considera status, bloqueios e configurações de privacidade
     */
    public canViewProfile(targetUser: User, isFollowing: boolean = false): boolean {
        // Não pode ver perfis deletados
        if (targetUser.isDeleted()) {
            return false
        }

        // Não pode ver perfis bloqueados (a menos que seja admin)
        if (targetUser.isBlocked() && !this.canAccessAdminFeatures()) {
            return false
        }

        // Usuário deletado não pode ver nada
        if (this.isDeleted()) {
            return false
        }

        // Usuário bloqueado tem acesso limitado
        if (this.isBlocked() && !this.canAccessAdminFeatures()) {
            return false
        }

        // Se o perfil for público, qualquer um pode ver
        const defaultVisibility = targetUser.getDefaultMomentVisibility()
        if (defaultVisibility === "public") {
            return true
        }

        // Se o perfil for privado (followers_only), precisa estar seguindo
        if (defaultVisibility === "followers_only") {
            return isFollowing
        }

        // Se o perfil for privado, não pode ver
        if (defaultVisibility === "private") {
            return false
        }

        return true
    }

    /**
     * Verifica se o usuário tem restrições de visualização
     */
    public hasViewingRestrictions(): boolean {
        return this.isBlocked() || this.isDeleted() || this.isMuted()
    }

    /**
     * Obtém nível de acesso que outro usuário tem a este perfil
     */
    public getAccessLevel(
        requestingUser: User | null,
        isFollowing: boolean = false,
    ): "full" | "limited" | "none" {
        // Sem usuário solicitante - acesso público básico
        if (!requestingUser) {
            if (this.isDeleted() || this.isBlocked()) {
                return "none"
            }
            const visibility = this.getDefaultMomentVisibility()
            if (visibility === "public") {
                return "limited"
            }
            return "none"
        }

        // Próprio usuário - acesso completo
        if (requestingUser.id === this.id) {
            return "full"
        }

        // Admin sempre tem acesso completo
        if (requestingUser.canAccessAdminFeatures()) {
            return "full"
        }

        // Usuário deletado ou bloqueado não tem acesso
        if (requestingUser.isDeleted() || requestingUser.isBlocked()) {
            return "none"
        }

        // Perfil alvo deletado - sem acesso
        if (this.isDeleted()) {
            return "none"
        }

        // Perfil alvo bloqueado - sem acesso (exceto admin)
        if (this.isBlocked()) {
            return "none"
        }

        // Verificar visibilidade
        const visibility = this.getDefaultMomentVisibility()
        if (visibility === "public") {
            return "limited"
        }

        if (visibility === "followers_only" && isFollowing) {
            return "limited"
        }

        return "none"
    }

    public getPublicProfile(): UserPublicProfile {
        return {
            id: this._id,
            username: this._username,
            name: this._name,
            description: this._description,
            richDescription: this._description
                ? textLib.rich.formatToEnriched(this._description)
                : null,
            isVerified: this.isVerified(),
            isActive: this.isActive(),
            profilePicture: this._profilePicture,
        }
    }

    public getActivityStats(): {
        daysSinceCreation: number
        isNewUser: boolean
        isActiveUser: boolean
        activityLevel: "low" | "medium" | "high"
    } {
        const now = new Date()
        const daysSinceCreation = Math.floor(
            (now.getTime() - this._createdAt.getTime()) / (1000 * 60 * 60 * 24),
        )

        const isNewUser = daysSinceCreation <= 7
        const isActiveUser = this.isActiveByMetrics(30)

        let activityLevel: "low" | "medium" | "high" = "low"
        if (this._metrics) {
            const totalActions =
                this._metrics.totalMomentsCreated + this._metrics.totalMemoriesCreated
            if (totalActions > 50) activityLevel = "high"
            else if (totalActions > 10) activityLevel = "medium"
        }

        return {
            daysSinceCreation,
            isNewUser,
            isActiveUser,
            activityLevel,
        }
    }

    /**
     * Calcula o score de reputação do usuário baseado em suas métricas
     *
     * O score é calculado considerando:
     * - Engajamento recebido (likes, comentários, shares, views)
     * - Crescimento de seguidores
     * - Taxa de engajamento
     * - Atividade de criação de conteúdo
     * - Penalizações por reports e violações
     *
     * @returns Score de reputação entre 0 e 1000
     */
    public getReputationScore(): number {
        if (!this._metrics) {
            return 0
        }

        const metrics = this._metrics

        // Fatores positivos (pesos)
        const engagementWeight = 0.3
        const growthWeight = 0.25
        const activityWeight = 0.2
        const reachWeight = 0.15
        const consistencyWeight = 0.1

        // Cálculo do engajamento (0-300 pontos)
        const totalEngagement =
            metrics.totalLikesReceived +
            metrics.totalCommentsReceived +
            metrics.totalSharesReceived +
            metrics.totalViewsReceived * 0.1 // Views têm peso menor

        const engagementScore = Math.min(totalEngagement * engagementWeight, 300)

        // Cálculo do crescimento (0-250 pontos)
        const growthScore = Math.min(
            (metrics.followerGrowthRate30d * 10 + metrics.engagementGrowthRate30d * 5) *
                growthWeight,
            250,
        )

        // Cálculo da atividade (0-200 pontos)
        const totalContent = metrics.totalMomentsCreated + metrics.totalMemoriesCreated
        const activityScore = Math.min(totalContent * activityWeight, 200)

        // Cálculo do alcance (0-150 pontos)
        const reachScore = Math.min(
            (metrics.totalFollowers * 0.1 + metrics.reachRate * 100) * reachWeight,
            150,
        )

        // Cálculo da consistência (0-100 pontos)
        const consistencyScore = Math.min(
            (metrics.momentsPerDayAverage + metrics.memoriesPerDayAverage) * consistencyWeight * 10,
            100,
        )

        // Penalizações
        const penaltyMultiplier = Math.max(
            1 - (metrics.reportsReceived * 0.1 + metrics.violationsCount * 0.2),
            0.1, // Mínimo de 10% do score original
        )

        // Score final
        const rawScore =
            engagementScore + growthScore + activityScore + reachScore + consistencyScore
        const finalScore = Math.round(rawScore * penaltyMultiplier)

        // Garantir que o score esteja entre 0 e 1000
        return Math.max(0, Math.min(finalScore, 1000))
    }

    /**
     * Retorna informações detalhadas sobre o score de reputação
     */
    public getReputationDetails(): {
        score: number
        level: "novice" | "rising" | "established" | "influencer" | "celebrity"
        breakdown: {
            engagement: number
            growth: number
            activity: number
            reach: number
            consistency: number
        }
        penalties: {
            reports: number
            violations: number
        }
    } {
        if (!this._metrics) {
            return {
                score: 0,
                level: "novice",
                breakdown: {
                    engagement: 0,
                    growth: 0,
                    activity: 0,
                    reach: 0,
                    consistency: 0,
                },
                penalties: {
                    reports: 0,
                    violations: 0,
                },
            }
        }

        const metrics = this._metrics
        const score = this.getReputationScore()

        // Determinar nível baseado no score
        let level: "novice" | "rising" | "established" | "influencer" | "celebrity"
        if (score >= 800) level = "celebrity"
        else if (score >= 600) level = "influencer"
        else if (score >= 400) level = "established"
        else if (score >= 200) level = "rising"
        else level = "novice"

        // Calcular breakdown detalhado
        const totalEngagement =
            metrics.totalLikesReceived +
            metrics.totalCommentsReceived +
            metrics.totalSharesReceived +
            metrics.totalViewsReceived * 0.1

        const breakdown = {
            engagement: Math.round(Math.min(totalEngagement * 0.3, 300)),
            growth: Math.round(
                Math.min(
                    (metrics.followerGrowthRate30d * 10 + metrics.engagementGrowthRate30d * 5) *
                        0.25,
                    250,
                ),
            ),
            activity: Math.round(
                Math.min((metrics.totalMomentsCreated + metrics.totalMemoriesCreated) * 0.2, 200),
            ),
            reach: Math.round(
                Math.min((metrics.totalFollowers * 0.1 + metrics.reachRate * 100) * 0.15, 150),
            ),
            consistency: Math.round(
                Math.min(
                    (metrics.momentsPerDayAverage + metrics.memoriesPerDayAverage) * 0.1 * 10,
                    100,
                ),
            ),
        }

        return {
            score,
            level,
            breakdown,
            penalties: {
                reports: metrics.reportsReceived,
                violations: metrics.violationsCount,
            },
        }
    }
    private validate(): void {
        if (!validateUsername(this._username)) {
            throw new Error("Username validation failed")
        }

        if (!validateName(this._name)) {
            throw new Error("Name validation failed")
        }

        if (!validateSearchMatchTerm(this._searchMatchTerm)) {
            throw new Error("Search term validation failed")
        }

        if (!validatePassword(this._password)) {
            throw new Error("Password validation failed")
        }

        if (!validateDescription(this._description)) {
            throw new Error("Description validation failed")
        }
    }

    // Factory method para criar usuário
    public static async create(
        props: Omit<UserProps, "id" | "createdAt" | "updatedAt">,
    ): Promise<User> {
        // Encriptar a senha automaticamente
        const encrypt = new Encrypt(props.password)
        const hashedPassword = await encrypt.hashStr()

        return new User({
            ...props,
            password: hashedPassword,
        })
    }

    // Método para serialização
    public toJSON(): UserProps {
        return {
            id: this._id,
            username: this._username,
            name: this._name,
            searchMatchTerm: this._searchMatchTerm,
            password: this._password,
            oldPassword: this._oldPassword,
            description: this._description,
            lastPasswordUpdatedAt: this._lastPasswordUpdatedAt,
            profilePicture: this._profilePicture || undefined,
            status: this._status || undefined,
            metrics: this._metrics || undefined,
            preferences: this._preferences || undefined,
            terms: this._terms || undefined,
            embedding: this._embedding || undefined,
            interctionsSummary: this._interctionsSummary || undefined,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        }
    }
}
