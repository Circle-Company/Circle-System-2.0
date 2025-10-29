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
import { IUserRepository } from "@/domain/user/repositories/user.repository"
import { textLib } from "@/shared"
import { generateId } from "@/shared/id"
import { Moment } from "./moment.entity"

export class Comment {
    private readonly _id: string
    private readonly _momentId: string
    private readonly _userId: string
    private readonly _replyId?: string
    private _content: string
    private _richContent: string
    private _visibility: CommentVisibilityEnum
    private _sentiment: CommentSentimentEnum
    private _sentimentIntensity: number

    // Metrics
    private _likesCount: number
    private _repliesCount: number
    private _reportsCount: number
    private _viewsCount: number

    // Moderation
    private _moderationFlags: CommentModerationFlag[]
    private _severity: CommentSeverityEnum
    private _moderationScore: number
    private _isModerated: boolean
    private _moderatedAt: Date | null
    private _moderatedBy: string | null

    // Metadata
    private _mentions: string[]
    private _hashtags: string[]
    private _metadata: Record<string, any>

    // Timestamps
    private readonly _createdAt: Date
    private _updatedAt: Date
    private _deletedAt: Date | null

    // Moderation configuration
    private readonly _moderationConfig: CommentModerationConfig

    constructor(props: CommentProps, moderationConfig?: CommentModerationConfig) {
        this._id = props.id || generateId()
        this._momentId = props.momentId
        this._userId = props.userId
        this._replyId = props.replyId
        this._content = props.content
        this._richContent = props.richContent
        this._visibility = props.visibility || CommentVisibilityEnum.PUBLIC
        this._sentiment = props.sentiment || CommentSentimentEnum.NEUTRAL
        this._sentimentIntensity = props.sentimentIntensity || 0

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

    get replyId(): string | undefined {
        return this._replyId ?? undefined
    }

    get content(): string {
        return this._content
    }

    get richContent(): string {
        return this._richContent
    }

    get visibility(): CommentVisibilityEnum {
        return this._visibility
    }

    get sentiment(): CommentSentimentEnum {
        return this._sentiment
    }

    get sentimentIntensity(): number {
        return this._sentimentIntensity
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

    // ===== PERMISSION METHODS =====

    /**
     * Checks if a user can comment on this moment
     */
    public canCommentOnMoment(
        user: User,
        moment: Moment,
        momentOwner?: User,
    ): { allowed: boolean; reason?: string } {
        // Check if user is active
        if (!user.isActive()) {
            return { allowed: false, reason: "User is not active" }
        }

        // Check if user is blocked
        if (user.isBlocked()) {
            return { allowed: false, reason: "User is blocked" }
        }

        // Check if user can interact with moments
        if (!user.canInteractWithMoments()) {
            return { allowed: false, reason: "User cannot interact with moments" }
        }

        // Check if moment is active and visible
        if (moment.status.current !== "published") {
            return { allowed: false, reason: "Moment is not published" }
        }

        // Check if user can viewsee the moment
        if (moment.visibility.level === "private" && user.id !== moment.ownerId) {
            return { allowed: false, reason: "Moment is private" }
        }

        // Check if user is blocked by the moment owner
        if (momentOwner && momentOwner.id !== user.id) {
            // You can implement logic here to check if the user is blocked
            // For now, we assumeין there are no blocks
        }

        // Check comment limits per user
        // This logic can be implemented based on user metrics

        return { allowed: true }
    }

    /**
     * Checks if a user is the owner of the comment
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
    public async canViewComment(        
        userId: string,
        user: User,
        userRepository: IUserRepository,
    ): Promise<{ allowed: boolean; reason?: string }> {
        // If the comment was deleted, only the author and admins ca
        // n see it
        if(this.isOwner(userId) || user.canAccessAdminFeatures()) {
            return { allowed: true }
        }

        if (this._deletedAt !== null) {
            return { allowed: false, reason: "Comment was deleted" }
        }

        // If the comment is public, anyone can see it
        if(this._visibility === CommentVisibilityEnum.PUBLIC) {
            return { allowed: true }
        }

        if(this._visibility === CommentVisibilityEnum.FOLLOWERS_ONLY) {
            const isFollowing = await userRepository.isFollowing(userId, this._userId)
            if (isFollowing || this.isOwner(userId)) {
                return { allowed: true }
            }
            return { allowed: false, reason: "User is not following the author" }
        }

        return { allowed: false, reason: "Comment visibility not recognized" }
    }

    /**
     * Checks if a user can edit the comment
     */
    public canEditComment(userId: string, user: User): { allowed: boolean; reason?: string } {
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
     * Deletes the comment
     */
    public delete(userId: string): { success: boolean; error?: string } {
        if (!this.isOwner(userId)) {
            return { success: false, error: "Only the author can delete the comment" }
        }

        if (this._deletedAt !== null) {
            return { success: false, error: "Comment has already been deleted" }
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
     * Removes a like from the comment
     */
    public removeLike(): void {
        if (this._likesCount > 0) {
            this._likesCount--
            this._updatedAt = new Date()
        }
    }

    /**
     * Adds a reply to the comment
     */
    public addReply(): void {
        this._repliesCount++
        this._updatedAt = new Date()
    }

    /**
     * Removes a reply from the comment
     */
    public removeReply(): void {
        if (this._repliesCount > 0) {
            this._repliesCount--
            this._updatedAt = new Date()
        }
    }

    /**
     * Adds a report to the comment
     */
    public addReport(): void {
        this._reportsCount++
        this._updatedAt = new Date()

        // If many reports, it can be automatically flagged
        if (this._reportsCount >= 5) {
            this.addModerationFlag(
                CommentModerationFlagEnum.SPAM_CONTENT,
                CommentSeverityEnum.MEDIUM,
                80,
                "Multiple reports received",
            )
        }
    }

    /**
     * Increments views
     */
    public incrementViews(): void {
        this._viewsCount++
        this._updatedAt = new Date()
    }

    // ===== MODERATION METHODS =====

    /**
     * Adds a moderation flag
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

    /**
     * Applies moderation results to the comment
     */
    public applyModerationResult(moderationFields: {
        moderationFlags: CommentModerationFlag[]
        moderationScore: number
        severity: CommentSeverityEnum
        isModerated: boolean
        moderatedAt: Date | null
        moderatedBy: string | null
    }): void {
        // Clear existing flags and add new ones
        this._moderationFlags = [...moderationFields.moderationFlags]
        this._moderationScore = moderationFields.moderationScore
        this._severity = moderationFields.severity
        this._isModerated = moderationFields.isModerated
        this._moderatedAt = moderationFields.moderatedAt
        this._moderatedBy = moderationFields.moderatedBy
        this._updatedAt = new Date()
    }

    /**
     * Analyzes the comment sentiment
     */
    private analyzeSentiment(): void {
        const content = this._content.toLowerCase()
        const analysis  = textLib.sentiment.analyze(content)
        this._sentiment = analysis.sentiment as CommentSentimentEnum
        this._sentimentIntensity = analysis.intensity as number
    }

    /**
     * Recalculates the moderation score
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
     * Gets the severity weight
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
     * Gets the numeric level of severity
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
     * Extracts mentions and hashtags from content
     */
    private extractMentionsAndHashtags(): void {
        const content = this._content

        // Extract mentions (@user) - supports accented characters
        const mentionMatches = content.match(/@([a-zA-Z0-9\u00C0-\u017F_]+)/g)
        this._mentions = mentionMatches ? mentionMatches.map((m) => m.substring(1)) : []

        // Extract hashtags (#hashtag) - supports accented characters
        const hashtagMatches = content.match(/#([a-zA-Z0-9\u00C0-\u017F_]+)/g)
        this._hashtags = hashtagMatches ? hashtagMatches.map((h) => h.substring(1)) : []
    }

    /**
     * Gets default moderation configuration
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
     * Validates the comment
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
     * Converts to entity
     */
    public toEntity(): CommentEntity & { sentimentIntensity: number } {
        return {
            id: this._id,
            momentId: this._momentId,
            userId: this._userId,
            replyId: this._replyId ?? undefined,
            richContent: this._richContent,
            content: this._content,
            visibility: this._visibility,
            sentiment: this._sentiment,
            sentimentIntensity: this._sentimentIntensity,
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
     * Creates an instance from an entity
     */
    public static fromEntity(
        entity: CommentEntity & { sentimentIntensity?: number },
        moderationConfig?: CommentModerationConfig,
    ): Comment {
        return new Comment(
            {
                id: entity.id,
                momentId: entity.momentId,
                userId: entity.userId,
                replyId: entity.replyId,
                richContent: entity.richContent,
                content: entity.content,
                visibility: entity.visibility,
                sentiment: entity.sentiment,
                sentimentIntensity: entity.sentimentIntensity || 0,
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
     * Creates a new comment instance
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
