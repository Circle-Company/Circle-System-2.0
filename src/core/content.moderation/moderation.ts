import {
    ModerationEntity,
    ModerationProps,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "../../domain/moderation/moderation.type"
import {
    ContentBlockingRequest,
    ContentBlockingResult,
    ContentDetectionRequest,
    ContentStorage,
    ModerationEngineConfig,
    ModerationRepository,
    ModerationResult,
} from "./types"

import { Comment } from "../../domain/moment/entities/comment.entity"
import {
    CommentModerationFlag,
    CommentModerationFlagEnum,
    CommentSentimentEnum,
    CommentSeverityEnum,
} from "../../domain/moment/types/comment.type"
import { ContentBlocker } from "./content/blocker"
import { ContentDetector } from "./content/detector"
import { CommentModerationResult } from "./types"

export class ModerationEngine {
    constructor(
        private readonly contentDetector: ContentDetector,
        private readonly contentBlocker: ContentBlocker,
        private readonly moderationRepository: ModerationRepository,
        private readonly contentStorage: ContentStorage,
        private readonly config: ModerationEngineConfig,
    ) {}

    /**
     * Processa moderação completa de um conteúdo
     */
    async moderateContent(request: ContentDetectionRequest): Promise<ModerationResult> {
        const startTime = Date.now()
        const errors: string[] = []

        try {
            // 1. Verificar se já existe moderação para este conteúdo
            const existingModeration = await this.moderationRepository.findByContentId(
                request.contentId,
            )
            if (existingModeration) {
                return {
                    success: true,
                    moderation: existingModeration,
                    processingTime: Date.now() - startTime,
                }
            }

            // 2. Armazenar conteúdo se necessário
            if (request.contentData) {
                await this.contentStorage.store(request.contentId, request.contentData)
            }

            // 3. Detectar tipo de conteúdo
            const detectionResult = await this.contentDetector.detectContent(request)

            // 4. Criar moderação
            const moderationProps: ModerationProps = {
                contentId: request.contentId,
                contentOwnerId: request.contentOwnerId,
                detectedContentType: detectionResult.contentType,
                confidence: detectionResult.confidence,
                isHumanContent: detectionResult.isHumanContent,
                status: ModerationStatusEnum.PENDING,
                isBlocked: false,
                isHidden: false,
                flags: detectionResult.flags,
                severity: this.calculateSeverity(detectionResult.flags),
                processingTime: detectionResult.processingTime,
                moderatedAt: null,
            }

            const moderation = await this.moderationRepository.save(
                moderationProps as ModerationEntity,
            )

            // 5. Aplicar bloqueio automático se configurado
            let blockingResult: ContentBlockingResult | undefined
            if (this.config.blocking.autoBlock) {
                blockingResult = await this.contentBlocker.applyAutomaticBlocking(moderation)
            }

            return {
                success: true,
                moderation,
                detectionResult,
                blockingResult,
                processingTime: Date.now() - startTime,
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
            errors.push(errorMessage)

            return {
                success: false,
                moderation: {} as ModerationEntity, // Moderação vazia em caso de erro
                processingTime: Date.now() - startTime,
                errors,
            }
        }
    }

    /**
     * Aplica bloqueio manual em uma moderação
     */
    async blockContent(
        request: ContentBlockingRequest,
    ): Promise<ContentBlockingResult | { success: false; error: string }> {
        try {
            return await this.contentBlocker.blockContent(request)
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            }
        }
    }

    /**
     * Remove bloqueio de uma moderação
     */
    async unblockContent(
        moderationId: string,
    ): Promise<ContentBlockingResult | { success: false; error: string }> {
        try {
            return await this.contentBlocker.unblockContent(moderationId)
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            }
        }
    }

    /**
     * Aprova conteúdo manualmente
     */
    async approveContent(moderationId: string, reason?: string): Promise<ContentBlockingResult> {
        try {
            const moderation = await this.moderationRepository.findById(moderationId)
            if (!moderation) {
                throw new Error(`Moderação não encontrada: ${moderationId}`)
            }

            // Atualizar moderação para aprovada
            await this.moderationRepository.update(moderationId, {
                status: ModerationStatusEnum.APPROVED,
                isBlocked: false,
                isHidden: false,
                moderatedAt: new Date(),
            })

            return {
                success: true,
                moderationId,
                blockType: "approve" as any,
                appliedAt: new Date(),
                reason: reason || "Conteúdo aprovado manualmente",
                metadata: { manual: true },
            }
        } catch (error) {
            return {
                success: false,
                moderationId,
                blockType: "approve" as any,
                appliedAt: new Date(),
                reason: `Erro ao aprovar conteúdo: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                metadata: { error: true },
            }
        }
    }

    /**
     * Marca conteúdo para revisão
     */
    async flagContent(moderationId: string, reason?: string): Promise<ContentBlockingResult> {
        try {
            const moderation = await this.moderationRepository.findById(moderationId)
            if (!moderation) {
                throw new Error(`Moderação não encontrada: ${moderationId}`)
            }

            // Atualizar moderação para flagada
            await this.moderationRepository.update(moderationId, {
                status: ModerationStatusEnum.FLAGGED,
                moderatedAt: new Date(),
            })

            return {
                success: true,
                moderationId,
                blockType: "review" as any,
                appliedAt: new Date(),
                reason: reason || "Conteúdo marcado para revisão",
                metadata: { manual: true },
            }
        } catch (error) {
            return {
                success: false,
                moderationId,
                blockType: "review" as any,
                appliedAt: new Date(),
                reason: `Erro ao marcar conteúdo: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                metadata: { error: true },
            }
        }
    }

    /**
     * Obtém moderação por ID
     */
    async getModeration(moderationId: string): Promise<ModerationEntity | null> {
        return this.moderationRepository.findById(moderationId)
    }

    /**
     * Obtém moderação por content ID
     */
    async getModerationByContentId(contentId: string): Promise<ModerationEntity | null> {
        return this.moderationRepository.findByContentId(contentId)
    }

    /**
     * Moderates a moment comment and returns moderation field updates
     */
    async moderateComment(comment: Comment): Promise<CommentModerationResult> {
        const startTime = Date.now()
        const flags: CommentModerationFlag[] = []

        try {
            const content = comment.content.toLowerCase()
            const sentiment = comment.sentiment
            const commentEntity = comment.toEntity()
            const sentimentIntensity = (commentEntity as any).sentimentIntensity || 0
            const hashtags = comment.hashtags
            const mentions = comment.mentions
            const reportsCount = comment.reportsCount

            // Analyze content for spam patterns
            if (this.detectSpam(content, hashtags)) {
                flags.push({
                    type: CommentModerationFlagEnum.SPAM_CONTENT,
                    severity: CommentSeverityEnum.MEDIUM,
                    confidence: 0.75,
                    description: "Potential spam content detected",
                    detectedAt: new Date(),
                    metadata: {},
                })
            }

            // Analyze for inappropriate language
            if (this.detectInappropriateLanguage(content)) {
                flags.push({
                    type: CommentModerationFlagEnum.INAPPROPRIATE_LANGUAGE,
                    severity: CommentSeverityEnum.HIGH,
                    confidence: 0.8,
                    description: "Inappropriate language detected",
                    detectedAt: new Date(),
                    metadata: {},
                })
            }

            // Analyze for hate speech
            if (this.detectHateSpeech(content)) {
                flags.push({
                    type: CommentModerationFlagEnum.HATE_SPEECH,
                    severity: CommentSeverityEnum.CRITICAL,
                    confidence: 0.85,
                    description: "Hate speech detected",
                    detectedAt: new Date(),
                    metadata: {},
                })
            }

            // Analyze for harassment
            if (this.detectHarassment(content, mentions)) {
                flags.push({
                    type: CommentModerationFlagEnum.HARASSMENT,
                    severity: CommentSeverityEnum.HIGH,
                    confidence: 0.7,
                    description: "Harassment detected",
                    detectedAt: new Date(),
                    metadata: {},
                })
            }

            // Analyze content quality
            if (content.length < 3) {
                flags.push({
                    type: CommentModerationFlagEnum.TOO_SHORT,
                    severity: CommentSeverityEnum.LOW,
                    confidence: 0.6,
                    description: "Comment is too short",
                    detectedAt: new Date(),
                    metadata: {},
                })
            }

            if (content.length > 500) {
                flags.push({
                    type: CommentModerationFlagEnum.TOO_LONG,
                    severity: CommentSeverityEnum.LOW,
                    confidence: 0.6,
                    description: "Comment is too long",
                    detectedAt: new Date(),
                    metadata: {},
                })
            }

            // Check for repetitive content
            if (this.detectRepetitiveContent(content)) {
                flags.push({
                    type: CommentModerationFlagEnum.REPETITIVE,
                    severity: CommentSeverityEnum.MEDIUM,
                    confidence: 0.65,
                    description: "Repetitive content detected",
                    detectedAt: new Date(),
                    metadata: {},
                })
            }

            // Check reports count
            if (reportsCount >= 3) {
                flags.push({
                    type: CommentModerationFlagEnum.SPAM_CONTENT,
                    severity: CommentSeverityEnum.MEDIUM,
                    confidence: 0.7,
                    description: "Multiple user reports received",
                    detectedAt: new Date(),
                    metadata: { reportsCount },
                })
            }

            // Analyze sentiment for moderation
            const sentimentFlags = this.analyzeSentimentForModeration(sentiment, sentimentIntensity)
            flags.push(...sentimentFlags)

            // Calculate moderation score and severity (including sentiment impact)
            const { moderationScore, severity } = this.calculateCommentModerationScore(
                flags,
                sentimentIntensity,
            )

            // Determine if content should be auto-approved
            const isModerated = flags.length > 0 || reportsCount > 0 || sentimentIntensity < -0.5

            return {
                success: true,
                moderationFields: {
                    moderationFlags: flags,
                    moderationScore,
                    severity,
                    isModerated,
                    moderatedAt: isModerated ? new Date() : null,
                    moderatedBy: isModerated ? "system" : null,
                },
                processingTime: Date.now() - startTime,
            }
        } catch (error) {
            return {
                success: false,
                moderationFields: {
                    moderationFlags: [],
                    moderationScore: 0,
                    severity: CommentSeverityEnum.LOW,
                    isModerated: false,
                    moderatedAt: null,
                    moderatedBy: null,
                },
                processingTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : "Unknown error",
            }
        }
    }

    /**
     * Detects spam patterns in content
     */
    private detectSpam(content: string, hashtags: string[]): boolean {
        const spamPatterns = [
            /buy now/i,
            /click here/i,
            /limited time/i,
            /act now/i,
            /\$\$\$/,
            /!!!{3,}/,
        ]

        // Too many hashtags
        if (hashtags.length > 10) {
            return true
        }

        // Spam patterns in content
        return spamPatterns.some((pattern) => pattern.test(content))
    }

    /**
     * Detects inappropriate language
     */
    private detectInappropriateLanguage(content: string): boolean {
        const inappropriateWords = [
            "fuck",
            "shit",
            "damn",
            "bitch",
            "asshole",
            // Add more as needed
        ]

        return inappropriateWords.some((word) => content.includes(word))
    }

    /**
     * Detects hate speech
     */
    private detectHateSpeech(content: string): boolean {
        const hateSpeechPatterns = [
            /kill.*yourself/i,
            /you.*should.*die/i,
            /hate.*group/i,
            // Add more patterns as needed
        ]

        return hateSpeechPatterns.some((pattern) => pattern.test(content))
    }

    /**
     * Detects harassment
     */
    private detectHarassment(content: string, mentions: string[]): boolean {
        const harassmentPatterns = [
            /stupid/i,
            /idiot/i,
            /moron/i,
            /you.*are.*worthless/i,
            // Add more patterns as needed
        ]

        // Multiple mentions with negative language might indicate harassment
        if (mentions.length > 3 && harassmentPatterns.some((pattern) => pattern.test(content))) {
            return true
        }

        return harassmentPatterns.some((pattern) => pattern.test(content))
    }

    /**
     * Detects repetitive content
     */
    private detectRepetitiveContent(content: string): boolean {
        // Check for repeated characters (e.g., "aaaaa", "!!!!!!")
        if (/(.)\1{4,}/.test(content)) {
            return true
        }

        // Check for repeated words
        const words = content.split(/\s+/)
        const wordCounts: Record<string, number> = {}
        for (const word of words) {
            wordCounts[word] = (wordCounts[word] || 0) + 1
            if (wordCounts[word] > 5) {
                return true
            }
        }

        return false
    }

    /**
     * Analyzes sentiment and returns moderation flags if needed
     */
    private analyzeSentimentForModeration(
        sentiment: CommentSentimentEnum,
        sentimentIntensity: number,
    ): CommentModerationFlag[] {
        const flags: CommentModerationFlag[] = []

        // Very negative sentiment with high intensity may indicate toxic content
        if (
            sentiment === CommentSentimentEnum.VERY_NEGATIVE &&
            sentimentIntensity <= -0.7 &&
            Math.abs(sentimentIntensity) >= 0.7
        ) {
            flags.push({
                type: CommentModerationFlagEnum.TROLLING,
                severity: CommentSeverityEnum.MEDIUM,
                confidence: Math.min(Math.abs(sentimentIntensity), 0.8),
                description: `Very negative sentiment speech detected (intensity: ${sentimentIntensity.toFixed(2)})`,
                detectedAt: new Date(),
                metadata: { sentiment, sentimentIntensity },
            })
        }

        // Negative sentiment with very high intensity might be harassment
        if (
            sentiment === CommentSentimentEnum.NEGATIVE &&
            sentimentIntensity <= -0.8 &&
            Math.abs(sentimentIntensity) >= 0.8
        ) {
            flags.push({
                type: CommentModerationFlagEnum.FLAME_BAIT,
                severity: CommentSeverityEnum.HIGH,
                confidence: Math.min(Math.abs(sentimentIntensity), 0.75),
                description: `Highly negative sentiment detected (intensity: ${sentimentIntensity.toFixed(2)})`,
                detectedAt: new Date(),
                metadata: { sentiment, sentimentIntensity },
            })
        }

        return flags
    }

    /**
     * Calculates moderation score and severity for comments
     */
    private calculateCommentModerationScore(
        flags: CommentModerationFlag[],
        sentimentIntensity: number = 0,
    ): {
        moderationScore: number
        severity: CommentSeverityEnum
    } {
        // Base score from flags
        let totalScore = 0
        let maxSeverity = CommentSeverityEnum.LOW

        const severityWeights: Record<CommentSeverityEnum, number> = {
            [CommentSeverityEnum.LOW]: 1,
            [CommentSeverityEnum.MEDIUM]: 2,
            [CommentSeverityEnum.HIGH]: 3,
            [CommentSeverityEnum.CRITICAL]: 4,
        }

        const severityLevels: Record<CommentSeverityEnum, number> = {
            [CommentSeverityEnum.LOW]: 1,
            [CommentSeverityEnum.MEDIUM]: 2,
            [CommentSeverityEnum.HIGH]: 3,
            [CommentSeverityEnum.CRITICAL]: 4,
        }

        flags.forEach((flag) => {
            const weight = severityWeights[flag.severity]
            totalScore += flag.confidence * weight

            if (severityLevels[flag.severity] > severityLevels[maxSeverity]) {
                maxSeverity = flag.severity
            }
        })

        // Adjust score based on sentiment intensity
        // Negative sentiment increases moderation score
        let sentimentAdjustment = 0
        if (sentimentIntensity < -0.5) {
            // Strong negative sentiment adds to moderation score
            sentimentAdjustment = Math.abs(sentimentIntensity) * 0.3 // Up to 0.3 additional score
        } else if (sentimentIntensity > 0.7) {
            // Strong positive sentiment slightly reduces moderation concerns
            sentimentAdjustment = -sentimentIntensity * 0.1 // Reduce by up to 0.07
        }

        let moderationScore = 0
        if (flags.length > 0) {
            moderationScore = Math.min((totalScore / flags.length) * 100, 100) / 100 // Normalize to 0-1
        }

        // Apply sentiment adjustment
        moderationScore = Math.max(0, Math.min(1, moderationScore + sentimentAdjustment))

        // If no flags but strong negative sentiment, set minimum score
        if (flags.length === 0 && sentimentIntensity < -0.7) {
            moderationScore = Math.abs(sentimentIntensity) * 0.5 // Between 0.35-0.5
        }

        return {
            moderationScore,
            severity: maxSeverity,
        }
    }

    /**
     * Calcula severidade baseada nas flags
     */
    private calculateSeverity(flags: any[]): ModerationSeverityEnum {
        if (flags.length === 0) {
            return ModerationSeverityEnum.LOW
        }

        const severities = flags.map((flag) => flag.severity)

        if (severities.includes(ModerationSeverityEnum.HIGH)) {
            return ModerationSeverityEnum.HIGH
        }

        if (severities.includes(ModerationSeverityEnum.MEDIUM)) {
            return ModerationSeverityEnum.MEDIUM
        }

        return ModerationSeverityEnum.LOW
    }
}
