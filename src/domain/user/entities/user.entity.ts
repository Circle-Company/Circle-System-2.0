import { Encrypt, circleTextLibrary, generateId } from "@/shared"
import {
    UserEmbedding,
    UserInterctionsSummary,
    UserPreferences,
    UserProfilePicture,
    UserProps,
    UserStatus,
    UserTerms,
} from "../types/user.type"

import { Level } from "@/domain/authorization"
import { CircleText } from "circle-text-library"
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
 * @author Circle System Team
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
    private _terms: UserTerms | null
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

    get terms(): UserTerms | null {
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

    get role(): string {
        return this._status?.accessLevel || "user"
    }

    // Métodos de domínio
    public updateUsername(username: string): void {
        if (!username) {
            throw new Error("Username não pode ser vazio")
        }
        const { isValid, errors } = circleTextLibrary.validate.username(username)
        if (!isValid) {
            throw new Error(errors.join(", "))
        }
        this._username = username.trim()
        this._updatedAt = new Date()
    }

    public updateName(name: string): void {
        if (!name || name.trim().length < 2) {
            throw new Error("Nome deve ter pelo menos 2 caracteres")
        }
        this._name = name.trim()
        this._updatedAt = new Date()
    }

    public updateSearchMatchTerm(searchTerm: string): void {
        if (!searchTerm || searchTerm.trim().length < 2) {
            throw new Error("Termo de busca deve ter pelo menos 2 caracteres")
        }
        this._searchMatchTerm = searchTerm.trim()
        this._updatedAt = new Date()
    }

    public updateDescription(description: string): void {
        if (description && description.length > 300) {
            throw new Error("Descrição deve ter no máximo 300 caracteres")
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

    public updateTerms(terms: UserTerms): void {
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
     * Obtém limite de Moments por dia (sem restrições para usuários normais)
     */
    public getDailyMomentsLimit(): number {
        // Removido sistema premium - todos têm acesso ilimitado
        return Number.MAX_SAFE_INTEGER
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
        return this._metrics?.isActiveUser(daysThreshold) ?? false
    }

    /**
     * Verifica se o usuário é considerado influencer
     */
    public isInfluencer(minFollowers?: number, minEngagementRate?: number): boolean {
        return this._metrics?.isInfluencer(minFollowers, minEngagementRate) ?? false
    }

    /**
     * Verifica se há problemas de moderação que precisam de atenção
     */
    public hasModerationIssues(): boolean {
        return this._metrics?.hasModerationIssues() ?? false
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

    // ===== MÉTODOS DE ANÁLISE DE COMPORTAMENTO =====

    /**
     * Obtém estatísticas de criação de conteúdo
     */
    public getContentCreationStats(): {
        totalMoments: number
        totalMemories: number
        averageMomentsPerDay: number
        averageMemoriesPerDay: number
        lastContentDate: Date | null
    } {
        if (!this._metrics) {
            return {
                totalMoments: 0,
                totalMemories: 0,
                averageMomentsPerDay: 0,
                averageMemoriesPerDay: 0,
                lastContentDate: null,
            }
        }

        return {
            totalMoments: this._metrics.totalMomentsCreated,
            totalMemories: this._metrics.totalMemoriesCreated,
            averageMomentsPerDay: this._metrics.momentsPerDayAverage,
            averageMemoriesPerDay: this._metrics.memoriesPerDayAverage,
            lastContentDate: this._metrics.lastMetricsUpdate,
        }
    }

    /**
     * Obtém estatísticas de engajamento
     */
    public getEngagementStats(): {
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

    /**
     * Verifica se o usuário é um administrador
     */
    public isAdmin(): boolean {
        return this._status?.accessLevel === Level.ADMIN || this._status?.accessLevel === Level.SUDO
    }

    /**
     * Obtém o nível de acesso do usuário
     */
    public getAccessLevel(): Level {
        return this._status?.accessLevel || Level.USER
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
    public getEmbeddingData(): {
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
    public shouldUpdatePassword(maxDays: number = 90): boolean {
        if (!this._lastPasswordUpdatedAt) return true

        const daysSinceUpdate = Math.floor(
            (new Date().getTime() - this._lastPasswordUpdatedAt.getTime()) / (1000 * 60 * 60 * 24),
        )

        return daysSinceUpdate > maxDays
    }

    // ===== MÉTODOS DE COMPATIBILIDADE COM MOMENTS =====

    /**
     * Obtém lista de hashtags que o usuário mais usa
     */
    public getPreferredHashtags(): string[] {
        return this._embedding?.metadata?.preferredHashtags || []
    }

    /**
     * Obtém configurações de notificação para Moments
     */
    public getMomentNotificationSettings(): {
        likeMoments: boolean
        newMemories: boolean
        addToMemory: boolean
        followUser: boolean
        viewUser: boolean
        news: boolean
        suggestions: boolean
        aroundYou: boolean
    } {
        if (!this._preferences) {
            return {
                likeMoments: true,
                newMemories: true,
                addToMemory: true,
                followUser: true,
                viewUser: true,
                news: true,
                suggestions: true,
                aroundYou: true,
            }
        }

        return {
            likeMoments: !this._preferences.disableLikeMomentPushNotification,
            newMemories: !this._preferences.disableNewMemoryPushNotification,
            addToMemory: !this._preferences.disableAddToMemoryPushNotification,
            followUser: !this._preferences.disableFollowUserPushNotification,
            viewUser: !this._preferences.disableViewUserPushNotification,
            news: !this._preferences.disableNewsPushNotification,
            suggestions: !this._preferences.disableSugestionsPushNotification,
            aroundYou: !this._preferences.disableAroundYouPushNotification,
        }
    }

    /**
     * Obtém configurações de reprodução de mídia
     */
    public getMediaPlaybackSettings(): {
        autoplay: boolean
        haptics: boolean
        language: string
        timezone: number
    } {
        return {
            autoplay: this._preferences?.disableAutoplay ? false : true,
            haptics: this._preferences?.disableHaptics ? false : true,
            language: this._preferences?.appLanguage || "pt",
            timezone: this._preferences?.appTimezone || -3,
        }
    }

    /**
     * Verifica se o usuário pode mencionar outros usuários
     */
    public canMentionUsers(): boolean {
        return this.isActive() && !this.isMuted()
    }

    /**
     * Verifica se o usuário pode ser mencionado por outros
     */
    public canBeMentioned(): boolean {
        return this.isActive() && !this.isBlocked()
    }

    /**
     * Obtém score de reputação baseado nas métricas
     */
    public getReputationScore(): number {
        if (!this._metrics) return 0

        const engagementScore = Math.min(this._metrics.engagementRate * 10, 100)
        const contentScore = Math.min(
            (this._metrics.totalMomentsCreated + this._metrics.totalMemoriesCreated) / 10,
            100,
        )
        const socialScore = Math.min(this._metrics.totalFollowers / 100, 100)
        const moderationPenalty = this._metrics.violationsCount * 10

        return Math.max(0, (engagementScore + contentScore + socialScore) / 3 - moderationPenalty)
    }

    // ===== MÉTODOS AUXILIARES =====

    /**
     * Verifica se o usuário pode realizar uma ação específica
     */
    public canPerformAction(action: string): boolean {
        if (!this.isActive()) return false

        switch (action) {
            case "create_moment":
                return this.canCreateMoments()
            case "interact_moment":
                return this.canInteractWithMoments()
            case "view_moment":
                return this.canViewMoments()
            case "mention_users":
                return this.canMentionUsers()
            case "be_mentioned":
                return this.canBeMentioned()
            case "admin_access":
                return this.canAccessAdminFeatures()
            default:
                return false
        }
    }

    /**
     * Obtém informações básicas do usuário para exibição
     */
    public getPublicProfile(): {
        id: string
        username: string
        name: string | null
        description: string | null
        isVerified: boolean
        isActive: boolean
        reputationScore: number
        profilePicture: UserProfilePicture | null
    } {
        return {
            id: this._id,
            username: this._username,
            name: this._name,
            description: this._description,
            isVerified: this.isVerified(),
            isActive: this.isActive(),
            reputationScore: this.getReputationScore(),
            profilePicture: this._profilePicture,
        }
    }

    /**
     * Verifica se o usuário precisa de verificação
     */
    public needsVerification(): boolean {
        return !this.isVerified() && this.isActive()
    }

    /**
     * Obtém estatísticas de atividade do usuário
     */
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

    // Métodos privados de validação
    private validate(): void {
        const circleText = new CircleText()
        if (!this._username || this._username.trim().length < 3) {
            throw new Error("Username deve ter pelo menos 3 caracteres")
        }

        if (!this._searchMatchTerm || this._searchMatchTerm.trim().length < 2) {
            throw new Error("Termo de busca deve ter pelo menos 2 caracteres")
        }

        if (!this.isValidPassword(this._password)) {
            throw new Error("Senha deve ter pelo menos 8 caracteres")
        }

        if (this._description && this._description.length > 300) {
            throw new Error("Descrição deve ter no máximo 300 caracteres")
        }
    }

    private isValidPassword(password: string): boolean {
        return Boolean(password && password.length >= 8)
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
