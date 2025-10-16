/**
 * Entidade Comment - Comentários de momentos
 * Implementa sistema completo de permissões, categorização e moderação
 */

import {
    CommentCategoryEnum,
    CommentEntity,
    CommentModerationConfig,
    CommentModerationFlag,
    CommentModerationFlagEnum,
    CommentProps,
    CommentSentimentEnum,
    CommentSeverityEnum,
    CommentStatusEnum,
    CommentVisibilityEnum,
} from "../types/comment.type"

import { User } from "@/domain/user/entities/user.entity"
import { generateId } from "@/shared/id"
import { Moment } from "./moment.entity"

export class Comment {
    private readonly _id: string
    private readonly _momentId: string
    private readonly _authorId: string
    private readonly _parentCommentId?: string
    private _content: string
    private _status: CommentStatusEnum
    private _visibility: CommentVisibilityEnum
    private _category: CommentCategoryEnum
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
        this._authorId = props.authorId
        this._parentCommentId = props.parentCommentId
        this._content = props.content
        this._status = props.status || CommentStatusEnum.ACTIVE
        this._visibility = props.visibility || CommentVisibilityEnum.PUBLIC
        this._category = props.category || CommentCategoryEnum.NEUTRAL
        this._sentiment = props.sentiment || CommentSentimentEnum.NEUTRAL

        // Métricas
        this._likesCount = props.likesCount || 0
        this._repliesCount = props.repliesCount || 0
        this._reportsCount = props.reportsCount || 0
        this._viewsCount = props.viewsCount || 0

        // Moderação
        this._moderationFlags = props.moderationFlags || []
        this._severity = props.severity || CommentSeverityEnum.LOW
        this._moderationScore = props.moderationScore || 0
        this._isModerated = props.isModerated || false
        this._moderatedAt = props.moderatedAt || null
        this._moderatedBy = props.moderatedBy || null

        // Metadados
        this._mentions = props.mentions || []
        this._hashtags = props.hashtags || []
        this._metadata = props.metadata || {}

        // Timestamps
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()
        this._deletedAt = props.deletedAt || null

        // Configuração de moderação
        this._moderationConfig = moderationConfig || this.getDefaultModerationConfig()

        this.validate()
        this.extractMentionsAndHashtags()
        this.analyzeContent()
    }

    // ===== GETTERS =====

    get id(): string {
        return this._id
    }

    get momentId(): string {
        return this._momentId
    }

    get authorId(): string {
        return this._authorId
    }

    get parentCommentId(): string | undefined {
        return this._parentCommentId
    }

    get content(): string {
        return this._content
    }

    get status(): CommentStatusEnum {
        return this._status
    }

    get visibility(): CommentVisibilityEnum {
        return this._visibility
    }

    get category(): CommentCategoryEnum {
        return this._category
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
        return this._authorId === userId
    }

    /**
     * Verifica se um usuário pode deletar o comentário
     */
    public canDeleteComment(
        userId: string,
        user: User,
        momentOwner?: User,
    ): { allowed: boolean; reason?: string } {
        // O autor pode deletar seu próprio comentário
        if (this.isOwner(userId)) {
            return { allowed: true }
        }

        // O owner do momento pode deletar comentários em seu momento
        if (momentOwner && momentOwner.id === userId) {
            return { allowed: true }
        }

        // Administradores podem deletar qualquer comentário
        if (user.canAccessAdminFeatures()) {
            return { allowed: true }
        }

        return { allowed: false, reason: "Usuário não tem permissão para deletar este comentário" }
    }

    /**
     * Verifica se um usuário pode visualizar o comentário
     */
    public canViewComment(
        userId: string,
        user: User,
        momentOwner?: User,
        moment?: Moment,
    ): { allowed: boolean; reason?: string } {
        // Se o comentário foi deletado, apenas o autor e admins podem ver
        if (this._status === CommentStatusEnum.DELETED) {
            if (this.isOwner(userId) || user.canAccessAdminFeatures()) {
                return { allowed: true }
            }
            return { allowed: false, reason: "Comentário foi deletado" }
        }

        // Se o comentário está oculto, apenas o autor, owner do momento e admins podem ver
        if (this._status === CommentStatusEnum.HIDDEN) {
            if (
                this.isOwner(userId) ||
                (momentOwner && momentOwner.id === userId) ||
                user.canAccessAdminFeatures()
            ) {
                return { allowed: true }
            }
            return { allowed: false, reason: "Comentário está oculto" }
        }

        // Verificar visibilidade do comentário
        switch (this._visibility) {
            case CommentVisibilityEnum.PUBLIC:
                return { allowed: true }

            case CommentVisibilityEnum.FOLLOWERS_ONLY:
                // Implementar lógica para verificar se o usuário segue o autor
                // Por enquanto, assumimos que é permitido
                return { allowed: true }

            case CommentVisibilityEnum.PRIVATE:
                // Apenas o autor pode ver comentários privados
                if (this.isOwner(userId)) {
                    return { allowed: true }
                }
                return { allowed: false, reason: "Comentário é privado" }

            case CommentVisibilityEnum.HIDDEN:
                return { allowed: false, reason: "Comentário está oculto" }

            default:
                return { allowed: false, reason: "Visibilidade do comentário não reconhecida" }
        }
    }

    /**
     * Verifica se um usuário pode editar o comentário
     */
    public canEditComment(userId: string, user: User): { allowed: boolean; reason?: string } {
        // Apenas o autor pode editar seu comentário
        if (!this.isOwner(userId)) {
            return { allowed: false, reason: "Apenas o autor pode editar o comentário" }
        }

        // Verificar se o usuário está ativo
        if (!user.isActive()) {
            return { allowed: false, reason: "Usuário não está ativo" }
        }

        // Verificar se o comentário não foi deletado
        if (this._status === CommentStatusEnum.DELETED) {
            return { allowed: false, reason: "Não é possível editar comentário deletado" }
        }

        // Verificar se não passou muito tempo desde a criação (ex: 24 horas)
        const maxEditTime = 24 * 60 * 60 * 1000 // 24 horas em milissegundos
        const timeSinceCreation = Date.now() - this._createdAt.getTime()

        if (timeSinceCreation > maxEditTime) {
            return { allowed: false, reason: "Tempo limite para edição expirado" }
        }

        return { allowed: true }
    }

    /**
     * Verifica se um usuário pode moderar o comentário
     */
    public canModerateComment(userId: string, user: User): { allowed: boolean; reason?: string } {
        // Apenas administradores podem moderar comentários
        if (!user.canAccessAdminFeatures()) {
            return { allowed: false, reason: "Apenas administradores podem moderar comentários" }
        }

        // Verificar se o usuário está ativo
        if (!user.isActive()) {
            return { allowed: false, reason: "Usuário não está ativo" }
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
        this.analyzeContent()

        return { success: true }
    }

    /**
     * Deleta o comentário
     */
    public delete(userId: string): { success: boolean; error?: string } {
        if (!this.isOwner(userId)) {
            return { success: false, error: "Apenas o autor pode deletar o comentário" }
        }

        if (this._status === CommentStatusEnum.DELETED) {
            return { success: false, error: "Comentário já foi deletado" }
        }

        this._status = CommentStatusEnum.DELETED
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
        this._status = CommentStatusEnum.APPROVED
        this._isModerated = true
        this._moderatedAt = new Date()
        this._moderatedBy = moderatedBy
        this._severity = CommentSeverityEnum.LOW
        this._updatedAt = new Date()
    }

    /**
     * Rejeita o comentário
     */
    public reject(moderatedBy: string, reason?: string): void {
        this._status = CommentStatusEnum.REJECTED
        this._isModerated = true
        this._moderatedAt = new Date()
        this._moderatedBy = moderatedBy
        this._updatedAt = new Date()

        if (reason) {
            this._metadata.moderatorReason = reason
        }
    }

    /**
     * Oculta o comentário
     */
    public hide(moderatedBy: string, reason?: string): void {
        this._status = CommentStatusEnum.HIDDEN
        this._isModerated = true
        this._moderatedAt = new Date()
        this._moderatedBy = moderatedBy
        this._updatedAt = new Date()

        if (reason) {
            this._metadata.moderatorReason = reason
        }
    }

    /**
     * Marca como em revisão
     */
    public markForReview(reason?: string): void {
        this._status = CommentStatusEnum.UNDER_REVIEW
        this._updatedAt = new Date()

        if (reason) {
            this._metadata.reviewReason = reason
        }
    }

    // ===== MÉTODOS DE ANÁLISE =====

    /**
     * Analisa o conteúdo do comentário
     */
    private analyzeContent(): void {
        this.analyzeSentiment()
        this.categorizeContent()
        this.checkForModerationFlags()
    }

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
     * Categoriza o conteúdo do comentário
     */
    private categorizeContent(): void {
        const content = this._content.toLowerCase()

        // Verificar categorias específicas
        if (this.containsSpam(content)) {
            this._category = CommentCategoryEnum.SPAM
        } else if (this.containsHarassment(content)) {
            this._category = CommentCategoryEnum.HARASSMENT
        } else if (this.containsHateSpeech(content)) {
            this._category = CommentCategoryEnum.HATE_SPEECH
        } else if (this.containsAdvertising(content)) {
            this._category = CommentCategoryEnum.ADVERTISING
        } else if (this.containsQuestion(content)) {
            this._category = CommentCategoryEnum.QUESTION
        } else if (this.containsSupport(content)) {
            this._category = CommentCategoryEnum.SUPPORTIVE
        } else if (this.containsConstructive(content)) {
            this._category = CommentCategoryEnum.CONSTRUCTIVE
        } else if (this.containsHumor(content)) {
            this._category = CommentCategoryEnum.FUNNY
        } else {
            this._category = CommentCategoryEnum.NEUTRAL
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

        if (!this._authorId) {
            throw new Error("Author ID is required")
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
            authorId: this._authorId,
            parentCommentId: this._parentCommentId,
            content: this._content,
            status: this._status,
            visibility: this._visibility,
            category: this._category,
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
                authorId: entity.authorId,
                parentCommentId: entity.parentCommentId,
                content: entity.content,
                status: entity.status,
                visibility: entity.visibility,
                category: entity.category,
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
