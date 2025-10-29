/**
 * Comment Entity - Moment comments
 * Implements a complete system for permissions, categorization and moderation
 */

import {
    CommentEntity,
    CommentModerationConfig,
    CommentModerationFlag,
    CommentModerationFlagEnum,
    CommentProps,
    CommentSentimentEnum,
    CommentSeverityEnum,
    CommentVisibilityEnum
} from "../types/comment.type"

import { User } from "@/domain/user/entities/user.entity"
import { generateId } from "@/shared/id"
import { Moment } from "./moment.entity"

export class Comment {
    private readonly _id: string
    private readonly _momentId: string
    private readonly _userId: string
    private readonly _parentCommentId?: string
    private _content: string
    private _visibility: CommentVisibilityEnum
    private _sentiment: CommentSentimentEnum

    // Métricas
    private _likesCount: number
    private _repliesCount: number
    private _reportsCount: number
    private _viewsCount: number

    // Moderação
    private _moderationFlags: CommentModerationFlag[]
    private _severity: CommentSeverityEnum
    private _moderationScore: number
    private _isModerated: boolean
    private _moderatedAt: Date | null
    private _moderatedBy: string | null

    // Metadados
    private _mentions: string[]
    private _hashtags: string[]
    private _metadata: Record<string, any>

    // Timestamps
    private readonly _createdAt: Date
    private _updatedAt: Date
    private _deletedAt: Date | null

    // Configuração de moderação
    private readonly _moderationConfig: CommentModerationConfig

    constructor(props: CommentProps, moderationConfig?: CommentModerationConfig) {
        this._id = props.id || generateId()
        this._momentId = props.momentId
        this._userId = props.userId
        this._parentCommentId = props.parentCommentId
        this._content = props.content
        this._visibility = props.visibility || CommentVisibilityEnum.PUBLIC
        this._sentiment = props.sentiment || CommentSentimentEnum.NEUTRAL

        // Metrics
        this._likesCount = props.likesCount || 0
        this._repliesCount = props.repliesCount || 0
        this._reportsCount = props.reportsCount || 0
        this._viewsCount = props.viewsCount || 0

        // Moderation
        this._moderationFlags = props.moderationFlags || []
        this._severity = props.severity || CommentSeverityEnum.LOW
        this._moderationScore = props.moderationScore || 0
        this._isModerated = props.isModerated || false
        this._moderatedAt = props.moderatedAt || null
        this._moderatedBy = props.moderatedBy || null

        // Metadata
        this._mentions = props.mentions || []
        this._hashtags = props.hashtags || []
        this._metadata = props.metadata || {}

        // Timestamps
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()
        this._deletedAt = props.deletedAt || null

        // Moderation configuration
        this._moderationConfig = moderationConfig || this.getDefaultModerationConfig()

        this.validate()
        this.extractMentionsAndHashtags()
        this.analyzeSentiment()
    }

    // ===== GETTERS =====

    get id(): string {
        return this._id
    }

    get momentId(): string {
        return this._momentId
    }

    get userId(): string {
        return this._userId
    }

    get parentCommentId(): string | undefined {
        return this._parentCommentId
    }

    get content(): string {
        return this._content
    }

    get visibility(): CommentVisibilityEnum {
        return this._visibility
    }

    get sentiment(): CommentSentimentEnum {
        return this._sentiment
    }

    get likesCount(): number {
        return this._likesCount
    }

    get repliesCount(): number {
        return this._repliesCount
    }

    get reportsCount(): number {
        return this._reportsCount
    }

    get viewsCount(): number {
        return this._viewsCount
    }

    get moderationFlags(): CommentModerationFlag[] {
        return [...this._moderationFlags]
    }

    get severity(): CommentSeverityEnum {
        return this._severity
    }

    get moderationScore(): number {
        return this._moderationScore
    }

    get isModerated(): boolean {
        return this._isModerated
    }

    get moderatedAt(): Date | null {
        return this._moderatedAt
    }

    get moderatedBy(): string | null {
        return this._moderatedBy
    }

    get mentions(): string[] {
        return [...this._mentions]
    }

    get hashtags(): string[] {
        return [...this._hashtags]
    }

    get metadata(): Record<string, any> {
        return { ...this._metadata }
    }

    get createdAt(): Date {
        return this._createdAt
    }

    get updatedAt(): Date {
        return this._updatedAt
    }

    get deletedAt(): Date | null {
        return this._deletedAt
    }

    // ===== MÉTODOS DE PERMISSÃO =====

    /**
     * Verifica se um usuário pode comentar neste momento
     */
    public canCommentOnMoment(
        user: User,
        moment: Moment,
        momentOwner?: User,
    ): { allowed: boolean; reason?: string } {
        // Verificar se o usuário está ativo
        if (!user.isActive()) {
            return { allowed: false, reason: "Usuário não está ativo" }
        }

        // Verificar se o usuário está bloqueado
        if (user.isBlocked()) {
            return { allowed: false, reason: "Usuário está bloqueado" }
        }

        // Verificar se o usuário pode interagir com momentos
        if (!user.canInteractWithMoments()) {
            return { allowed: false, reason: "Usuário não pode interagir com momentos" }
        }

        // Verificar se o momento está ativo e visível
        if (moment.status.current !== "published") {
            return { allowed: false, reason: "Moment não está publicado" }
        }

        // Verificar se o usuário pode visualizar o momento
        if (moment.visibility.level === "private" && user.id !== moment.ownerId) {
            return { allowed: false, reason: "Moment é privado" }
        }

        // Verificar se o usuário está bloqueado pelo owner do momento
        if (momentOwner && momentOwner.id !== user.id) {
            // Aqui você pode implementar lógica para verificar se o usuário está bloqueado
            // por enquanto, assumimos que não há bloqueios
        }

        // Verificar limites de comentários por usuário
        // Esta lógica pode ser implementada com base em métricas do usuário

        return { allowed: true }
    }

    /**
     * Verifica se um usuário é o dono do comentário
     */
    public isOwner(userId: string): boolean {
        return this._userId === userId
    }

    /**
     * Checks if a user can delete the comment
     */
    public canDeleteComment(
        userId: string,
        user: User,
        momentOwner?: User,
    ): { allowed: boolean; reason?: string } {
        // The author can delete their own comment
        if (this.isOwner(userId)) {
            return { allowed: true }
        }

        // The moment owner can delete comments on their moment
        if (momentOwner && momentOwner.id === userId) {
            return { allowed: true }
        }

        // Administrators can delete any comment
        if (user.canAccessAdminFeatures()) {
            return { allowed: true }
        }

        return { allowed: false, reason: "User does not have permission to delete this comment" }
    }

    /**
     * Checks if a user can view the comment
     */
    public canViewComment(
        userId: string,
        user: User,
        momentOwner?: User,
        moment?: Moment,
    ): { allowed: boolean; reason?: string } {
        // If the comment was deleted, only the author and admins can see it
        if (this._deletedAt !== null) {
            if (this.isOwner(userId) || user.canAccessAdminFeatures()) {
                return { allowed: true }
            }
            return { allowed: false, reason: "Comment was deleted" }
        }

        // Check comment visibility
        switch (this._visibility) {
            case CommentVisibilityEnum.PUBLIC:
                return { allowed: true }

            case CommentVisibilityEnum.FOLLOWERS_ONLY:
                // Implement logic to check if user follows the author
                // For now, we assume it's allowed
                return { allowed: true }

            default:
                return { allowed: false, reason: "Comment visibility not recognized" }
        }
    }

    /**
     * Checks if a user can edit the comment
    了他的 public canEditComment(userId: string, user: User): { allowed: boolean; reason?: string } {
        // Only the author can edit their comment
        if (!this.isOwner(userId)) {
            return { allowed: false, reason: "Only the author can edit the comment" }
        }

        // Check if user is active
        if (!user.isActive()) {
            return { allowed: false, reason: "User is not active" }
        }

        // Check if comment was not deleted
        if (this._deletedAt !== null) {
            return { allowed: false, reason: "Cannot edit deleted comment" }
        }

        // Check if too much time has passed since creation (e.g., 24 hours)
        const maxEditTime = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        const timeSinceCreation = Date.now() - this._createdAt.getTime()

        if (timeSinceCreation > maxEditTime) {
            return { allowed: false, reason: "Edit time limit expired" }
        }

        return { allowed: true }
    }

    /**
     * Checks if a user can moderate the comment
     */
    public canModerateComment(userId: string, user: User): { allowed: boolean; reason?: string } {
        // Only administrators can moderate comments
        if (!user.canAccessAdminFeatures()) {
            return { allowed: false, reason: "Only administrators can moderate comments" }
        }

        // Check if user is active
        if (!user.isActive()) {
            return { allowed: false, reason: "User is not active" }
        }

        return { allowed: true }
    }

    // ===== MÉTODOS DE AÇÃO =====

    /**
     * Edita o conteúdo do comentário
     */
    public editContent(
        newContent: string,
        userId: string,
        user?: User,
    ): { success: boolean; error?: string } {
        if (user) {
            const canEdit = this.canEditComment(userId, user)

            if (!canEdit.allowed) {
                return { success: false, error: canEdit.reason }
            }
        } else {
            // Verificação básica sem user - apenas se é o owner
            if (!this.isOwner(userId)) {
                return { success: false, error: "Apenas o autor pode editar o comentário" }
            }
        }

        this._content = newContent
        this._updatedAt = new Date()
        this.extractMentionsAndHashtags()
        this.analyzeSentiment()

        return { success: true }
    }

    /**
     * Deleta o comentário
     */
    public delete(userId: string): { success: boolean; error?: string } {
        if (!this.isOwner(userId)) {
            return { success: false, error: "Apenas o autor pode deletar o comentário" }
        }

        if (this._deletedAt !== null) {
            return { success: false, error: "Comentário já foi deletado" }
        }

        this._deletedAt = new Date()
        this._updatedAt = new Date()

        return { success: true }
    }

    /**
     * Adiciona uma curtida ao comentário
     */
    public addLike(): void {
        this._likesCount++
        this._updatedAt = new Date()
    }

    /**
     * Remove uma curtida do comentário
     */
    public removeLike(): void {
        if (this._likesCount > 0) {
            this._likesCount--
            this._updatedAt = new Date()
        }
    }

    /**
     * Adiciona uma resposta ao comentário
     */
    public addReply(): void {
        this._repliesCount++
        this._updatedAt = new Date()
    }

    /**
     * Remove uma resposta do comentário
     */
    public removeReply(): void {
        if (this._repliesCount > 0) {
            this._repliesCount--
            this._updatedAt = new Date()
        }
    }

    /**
     * Adiciona um report ao comentário
     */
    public addReport(): void {
        this._reportsCount++
        this._updatedAt = new Date()

        // Se muitos reports, pode ser flagado automaticamente
        if (this._reportsCount >= 5) {
            this.addModerationFlag(
                CommentModerationFlagEnum.SPAM_CONTENT,
                CommentSeverityEnum.MEDIUM,
                80,
                "Múltiplos reports recebidos",
            )
        }
    }

    /**
     * Incrementa visualizações
     */
    public incrementViews(): void {
        this._viewsCount++
        this._updatedAt = new Date()
    }

    // ===== MÉTODOS DE MODERAÇÃO =====

    /**
     * Adiciona uma flag de moderação
     */
    public addModerationFlag(
        type: CommentModerationFlagEnum,
        severity: CommentSeverityEnum,
        confidence: number,
        description: string,
        metadata?: Record<string, any>,
    ): void {
        const flag: CommentModerationFlag = {
            type,
            severity,
            confidence,
            description,
            detectedAt: new Date(),
            metadata: metadata || {},
        }

        this._moderationFlags.push(flag)
        this.recalculateModerationScore()
        this._updatedAt = new Date()
    }

    /**
     * Remove uma flag de moderação
     */
    public removeModerationFlag(type: CommentModerationFlagEnum): void {
        this._moderationFlags = this._moderationFlags.filter((flag) => flag.type !== type)
        this.recalculateModerationScore()
        this._updatedAt = new Date()
    }

    /**
     * Aprova o comentário
     */
    public approve(moderatedBy: string): void {
        this._isModerated = true
        this._moderatedAt = new Date()
        this._moderatedBy = moderatedBy
        this._severity = CommentSeverityEnum.LOW
        this._updatedAt = new Date()
    }

    /**
     * Rejeita o comentário (deleta)
     */
    public reject(moderatedBy: string, reason?: string): void {
        this._isModerated = true
        this._moderatedAt = new Date()
        this._moderatedBy = moderatedBy
        this._deletedAt = new Date()
        this._updatedAt = new Date()

        if (reason) {
            this._metadata.moderatorReason = reason
        }
    }

    // ===== MÉTODOS DE ANÁLISE =====

    /**
     * Analisa o conteúdo do comentário
     */

    /**
     * Analisa o sentimento do comentário
     */
    private analyzeSentiment(): void {
        const content = this._content.toLowerCase()

        // Palavras positivas
        const positiveWords = [
            "obrigado",
            "obrigada",
            "legal",
            "bacana",
            "incrível",
            "fantástico",
            "excelente",
            "maravilhoso",
            "perfeito",
            "ótimo",
            "bom",
            "bom trabalho",
            "parabéns",
            "amei",
            "adoro",
            "love",
            "like",
            "good",
            "great",
            "awesome",
        ]

        // Palavras negativas
        const negativeWords = [
            "odioso",
            "horrível",
            "péssimo",
            "ruim",
            "merda",
            "lixo",
            "porcaria",
            "hate",
            "bad",
            "terrible",
            "awful",
            "disgusting",
            "stupid",
            "idiot",
        ]

        let positiveCount = 0
        let negativeCount = 0

        positiveWords.forEach((word) => {
            if (content.includes(word)) positiveCount++
        })

        negativeWords.forEach((word) => {
            if (content.includes(word)) negativeCount++
        })

        // Determinar sentimento baseado na contagem
        if (positiveCount > negativeCount && positiveCount > 0) {
            this._sentiment = CommentSentimentEnum.POSITIVE
        } else if (negativeCount > positiveCount && negativeCount > 0) {
            this._sentiment = CommentSentimentEnum.NEGATIVE
        } else {
            this._sentiment = CommentSentimentEnum.NEUTRAL
        }
    }

    /**
     * Verifica se o conteúdo contém spam
     */
    private containsSpam(content: string): boolean {
        const spamPatterns = [
            /(https?:\/\/[^\s]+)/gi, // URLs
            /(www\.[^\s]+)/gi, // www links
            /(compre|venda|promoção|oferta|desconto)/gi, // Palavras comerciais
            /(call|whatsapp|telegram|contato)/gi, // Contatos
            /(follow|seguir|instagram|youtube)/gi, // Redes sociais
        ]

        return spamPatterns.some((pattern) => pattern.test(content))
    }

    /**
     * Verifica se o conteúdo contém assédio
     */
    private containsHarassment(content: string): boolean {
        const harassmentWords = [
            "idiota",
            "burro",
            "estúpido",
            "imbecil",
            "retardado",
            "vai se foder",
            "filho da puta",
            "fdp",
            "merda",
        ]

        return harassmentWords.some((word) => content.includes(word))
    }

    /**
     * Verifica se o conteúdo contém discurso de ódio
     */
    private containsHateSpeech(content: string): boolean {
        const hateWords = [
            "preto",
            "negra",
            "mulata",
            "japa",
            "chinês",
            "viado",
            "bicha",
            "traveco",
            "mulher",
            "gay",
            "lésbica",
        ]

        return hateWords.some((word) => content.includes(word))
    }

    /**
     * Verifica se o conteúdo contém publicidade
     */
    private containsAdvertising(content: string): boolean {
        const adWords = [
            "promoção",
            "oferta",
            "desconto",
            "compre",
            "venda",
            "loja",
            "produto",
            "serviço",
            "empresa",
        ]

        return adWords.some((word) => content.includes(word))
    }

    /**
     * Verifica se o conteúdo contém pergunta
     */
    private containsQuestion(content: string): boolean {
        return (
            content.includes("?") ||
            content.startsWith("como") ||
            content.startsWith("onde") ||
            content.startsWith("quando") ||
            content.startsWith("por que") ||
            content.startsWith("porque")
        )
    }

    /**
     * Verifica se o conteúdo é de apoio
     */
    private containsSupport(content: string): boolean {
        const supportWords = [
            "força",
            "apoio",
            "estamos juntos",
            "juntos",
            "unidos",
            "pode contar",
            "conte comigo",
            "estou aqui",
        ]

        return supportWords.some((word) => content.includes(word))
    }

    /**
     * Verifica se o conteúdo é construtivo
     */
    private containsConstructive(content: string): boolean {
        const constructiveWords = [
            "sugestão",
            "dica",
            "dica",
            "recomendo",
            "sugiro",
            "talvez",
            "acho que",
            "na minha opinião",
        ]

        return constructiveWords.some((word) => content.includes(word))
    }

    /**
     * Verifica se o conteúdo contém humor
     */
    private containsHumor(content: string): boolean {
        const humorIndicators = [
            "kkk",
            "haha",
            "hehe",
            "rsrs",
            "lol",
            "😂",
            "😄",
            "😆",
            "😅",
            "🤣",
            "risos",
            "engraçado",
            "hilário",
        ]

        return humorIndicators.some((indicator) => content.includes(indicator))
    }

    /**
     * Verifica se o comentário precisa de moderação
     */
    private checkForModerationFlags(): void {
        const content = this._content.toLowerCase()

        // Verificar spam
        if (this.containsSpam(content)) {
            this.addModerationFlag(
                CommentModerationFlagEnum.SPAM_CONTENT,
                CommentSeverityEnum.MEDIUM,
                85,
                "Possível conteúdo spam detectado",
            )
        }

        // Verificar assédio
        if (this.containsHarassment(content)) {
            this.addModerationFlag(
                CommentModerationFlagEnum.HARASSMENT,
                CommentSeverityEnum.HIGH,
                90,
                "Possível assédio detectado",
            )
        }

        // Verificar discurso de ódio
        if (this.containsHateSpeech(content)) {
            this.addModerationFlag(
                CommentModerationFlagEnum.HATE_SPEECH,
                CommentSeverityEnum.CRITICAL,
                95,
                "Possível discurso de ódio detectado",
            )
        }

        // Verificar qualidade baixa
        if (this._content.length < 3) {
            this.addModerationFlag(
                CommentModerationFlagEnum.TOO_SHORT,
                CommentSeverityEnum.LOW,
                70,
                "Comentário muito curto",
            )
        }

        if (this._content.length > 500) {
            this.addModerationFlag(
                CommentModerationFlagEnum.TOO_LONG,
                CommentSeverityEnum.LOW,
                60,
                "Comentário muito longo",
            )
        }
    }

    /**
     * Recalcula o score de moderação
     */
    private recalculateModerationScore(): void {
        if (this._moderationFlags.length === 0) {
            this._moderationScore = 0
            this._severity = CommentSeverityEnum.LOW
            return
        }

        let totalScore = 0
        let maxSeverity = CommentSeverityEnum.LOW

        this._moderationFlags.forEach((flag) => {
            totalScore += flag.confidence * this.getSeverityWeight(flag.severity)

            if (this.getSeverityLevel(flag.severity) > this.getSeverityLevel(maxSeverity)) {
                maxSeverity = flag.severity
            }
        })

        this._moderationScore = Math.min(totalScore / this._moderationFlags.length, 100)
        this._severity = maxSeverity
    }

    /**
     * Obtém o peso da severidade
     */
    private getSeverityWeight(severity: CommentSeverityEnum): number {
        switch (severity) {
            case CommentSeverityEnum.LOW:
                return 1
            case CommentSeverityEnum.MEDIUM:
                return 2
            case CommentSeverityEnum.HIGH:
                return 3
            case CommentSeverityEnum.CRITICAL:
                return 4
            default:
                return 1
        }
    }

    /**
     * Obtém o nível numérico da severidade
     */
    private getSeverityLevel(severity: CommentSeverityEnum): number {
        switch (severity) {
            case CommentSeverityEnum.LOW:
                return 1
            case CommentSeverityEnum.MEDIUM:
                return 2
            case CommentSeverityEnum.HIGH:
                return 3
            case CommentSeverityEnum.CRITICAL:
                return 4
            default:
                return 1
        }
    }

    /**
     * Extrai menções e hashtags do conteúdo
     */
    private extractMentionsAndHashtags(): void {
        const content = this._content

        // Extrair menções (@usuario) - suporta caracteres acentuados
        const mentionMatches = content.match(/@([a-zA-Z0-9\u00C0-\u017F_]+)/g)
        this._mentions = mentionMatches ? mentionMatches.map((m) => m.substring(1)) : []

        // Extrair hashtags (#hashtag) - suporta caracteres acentuados
        const hashtagMatches = content.match(/#([a-zA-Z0-9\u00C0-\u017F_]+)/g)
        this._hashtags = hashtagMatches ? hashtagMatches.map((h) => h.substring(1)) : []
    }

    /**
     * Obtém configuração padrão de moderação
     */
    private getDefaultModerationConfig(): CommentModerationConfig {
        return {
            thresholds: {
                spamThreshold: 70,
                harassmentThreshold: 80,
                hateSpeechThreshold: 90,
                inappropriateThreshold: 75,
                qualityThreshold: 60,
            },
            weights: {
                sentimentWeight: 0.3,
                contentQualityWeight: 0.4,
                userBehaviorWeight: 0.2,
                contextWeight: 0.1,
            },
            actions: {
                autoHideSpam: true,
                autoFlagHarassment: true,
                requireApprovalForNegative: true,
                notifyOnFlag: true,
            },
        }
    }

    /**
     * Valida o comentário
     */
    private validate(): void {
        if (!this._momentId) {
            throw new Error("Moment ID is required")
        }

        if (!this._userId) {
            throw new Error("User ID is required")
        }

        if (!this._content || this._content.trim().length === 0) {
            throw new Error("Comment content is required")
        }

        if (this._content.length > 500) {
            throw new Error("Comment too long (maximum 500 characters)")
        }

        if (this._content.length < 1) {
            throw new Error("Comment too short (minimum 1 character)")
        }
    }

    /**
     * Converte para entidade
     */
    public toEntity(): CommentEntity {
        return {
            id: this._id,
            momentId: this._momentId,
            userId: this._userId,
            parentCommentId: this._parentCommentId,
            content: this._content,
            visibility: this._visibility,
            sentiment: this._sentiment,
            likesCount: this._likesCount,
            repliesCount: this._repliesCount,
            reportsCount: this._reportsCount,
            viewsCount: this._viewsCount,
            moderationFlags: this._moderationFlags,
            severity: this._severity,
            moderationScore: this._moderationScore,
            isModerated: this._isModerated,
            moderatedAt: this._moderatedAt,
            moderatedBy: this._moderatedBy,
            mentions: this._mentions,
            hashtags: this._hashtags,
            metadata: this._metadata,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            deletedAt: this._deletedAt,
        }
    }

    /**
     * Cria uma instância a partir de uma entidade
     */
    public static fromEntity(
        entity: CommentEntity,
        moderationConfig?: CommentModerationConfig,
    ): Comment {
        return new Comment(
            {
                id: entity.id,
                momentId: entity.momentId,
                userId: entity.userId,
                parentCommentId: entity.parentCommentId,
                content: entity.content,
                visibility: entity.visibility,
                sentiment: entity.sentiment,
                likesCount: entity.likesCount,
                repliesCount: entity.repliesCount,
                reportsCount: entity.reportsCount,
                viewsCount: entity.viewsCount,
                moderationFlags: entity.moderationFlags,
                severity: entity.severity,
                moderationScore: entity.moderationScore,
                isModerated: entity.isModerated,
                moderatedAt: entity.moderatedAt,
                moderatedBy: entity.moderatedBy,
                mentions: entity.mentions,
                hashtags: entity.hashtags,
                metadata: entity.metadata,
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
                deletedAt: entity.deletedAt,
            },
            moderationConfig,
        )
    }

    /**
     * Cria uma nova instância de comentário
     */
    public static create(
        props: Omit<CommentProps, "id" | "createdAt" | "updatedAt">,
        moderationConfig?: CommentModerationConfig,
    ): Comment {
        return new Comment(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            moderationConfig,
        )
    }
}
