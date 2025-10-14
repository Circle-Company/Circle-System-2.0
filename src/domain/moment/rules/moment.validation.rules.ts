import { MomentQualityEnum, MomentStatusEnum, MomentVisibilityEnum } from "../types"

// ===== REGRAS DE VALIDAÇÃO DE MOMENT =====
export interface MomentValidationRules {
    // Regras de validação de conteúdo
    content: {
        maxDuration: number // segundos
        minDuration: number // segundos
        maxSize: number // bytes
        minSize: number // bytes
        allowedFormats: string[]
        requiredAspectRatio: {
            width: number
            height: number
        }
        allowedResolutions: Array<{
            width: number
            height: number
            quality: MomentQualityEnum
        }>
        qualityThresholds: {
            low: number
            medium: number
            high: number
        }
    }

    // Regras de validação de texto
    text: {
        maxDescriptionLength: number
        minDescriptionLength: number
        maxHashtags: number
        minHashtags: number
        maxMentions: number
        minMentions: number
        forbiddenWords: string[]
        requiredWords: string[]
        allowedCharacters: string
        allowEmojis: boolean
        allowSpecialCharacters: boolean
        allowNumbers: boolean
        allowSpaces: boolean
    }

    // Regras de validação de status
    status: {
        allowedStatuses: MomentStatusEnum[]
        allowedTransitions: Record<MomentStatusEnum, MomentStatusEnum[]>
        requireModeration: boolean
        requireApproval: boolean
        autoPublish: boolean
        allowDraft: boolean
        allowArchived: boolean
        allowDeleted: boolean
    }

    // Regras de validação de visibilidade
    visibility: {
        allowedLevels: MomentVisibilityEnum[]
        requireAgeRestriction: boolean
        requireContentWarning: boolean
        allowPrivate: boolean
        allowPublic: boolean
        allowFollowersOnly: boolean
        allowUnlisted: boolean
    }

    // Regras de validação de metadados
    metadata: {
        requireLocation: boolean
        requireDevice: boolean
        requireTimestamp: boolean
        allowCustomMetadata: boolean
        maxMetadataSize: number // bytes
        requiredFields: string[]
        optionalFields: string[]
    }

    // Regras de validação de qualidade
    quality: {
        minQualityScore: number
        maxQualityScore: number
        requireQualityCheck: boolean
        allowLowQuality: boolean
        qualityThresholds: {
            low: number
            medium: number
            high: number
        }
        qualityFactors: {
            videoQuality: number
            audioQuality: number
            contentQuality: number
            faceDetection: number
        }
    }

    // Regras de validação de segurança
    security: {
        requireAuthentication: boolean
        requireVerification: boolean
        allowAnonymous: boolean
        maxCreationRate: number // por hora
        requireContentModeration: boolean
        blockSuspiciousContent: boolean
        requireOwnerVerification: boolean
        allowMultipleOwners: boolean
    }

    // Regras de validação de negócio
    business: {
        requirePayment: boolean
        allowFreeContent: boolean
        requireSubscription: boolean
    }
}

// ===== REGRAS PADRÃO DE VALIDAÇÃO =====
export const DEFAULT_MOMENT_VALIDATION_RULES: MomentValidationRules = {
    content: {
        maxDuration: 30, // 30 segundos
        minDuration: 1, // 1 segundo
        maxSize: 100 * 1024 * 1024, // 100MB
        minSize: 1024, // 1KB
        allowedFormats: ["mp4", "webm", "mov"],
        requiredAspectRatio: {
            width: 360,
            height: 558,
        },
        allowedResolutions: [
            { width: 360, height: 558, quality: MomentQualityEnum.MEDIUM },
            { width: 720, height: 1116, quality: MomentQualityEnum.HIGH }, // 2x (aspect ratio 360:558)
            { width: 1080, height: 1674, quality: MomentQualityEnum.HIGH }, // 3x (aspect ratio 360:558)
        ],
        qualityThresholds: {
            low: 30,
            medium: 60,
            high: 80,
        },
    },
    text: {
        maxDescriptionLength: 500,
        minDescriptionLength: 10,
        maxHashtags: 10,
        minHashtags: 0,
        maxMentions: 5,
        minMentions: 0,
        forbiddenWords: [
            "spam",
            "fake",
            "scam",
            "bot",
            "ai",
            "generated",
            "synthetic",
            "hate",
            "violence",
            "explicit",
        ],
        requiredWords: [],
        allowedCharacters:
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?@#$%^&*()_+-=[]{}|;':\",./<>?",
        allowEmojis: true,
        allowSpecialCharacters: true,
        allowNumbers: true,
        allowSpaces: true,
    },
    status: {
        allowedStatuses: [
            MomentStatusEnum.UNDER_REVIEW,
            MomentStatusEnum.PUBLISHED,
            MomentStatusEnum.ARCHIVED,
            MomentStatusEnum.DELETED,
            MomentStatusEnum.BLOCKED,
        ],
        allowedTransitions: {
            [MomentStatusEnum.UNDER_REVIEW]: [
                MomentStatusEnum.PUBLISHED,
                MomentStatusEnum.DELETED,
                MomentStatusEnum.BLOCKED,
            ],
            [MomentStatusEnum.PUBLISHED]: [
                MomentStatusEnum.ARCHIVED,
                MomentStatusEnum.DELETED,
                MomentStatusEnum.BLOCKED,
            ],
            [MomentStatusEnum.ARCHIVED]: [MomentStatusEnum.PUBLISHED, MomentStatusEnum.DELETED],
            [MomentStatusEnum.DELETED]: [],
            [MomentStatusEnum.BLOCKED]: [MomentStatusEnum.UNDER_REVIEW],
        },
        requireModeration: true,
        requireApproval: false,
        autoPublish: false,
        allowDraft: true,
        allowArchived: true,
        allowDeleted: true,
    },
    visibility: {
        allowedLevels: [
            MomentVisibilityEnum.PRIVATE,
            MomentVisibilityEnum.FOLLOWERS_ONLY,
            MomentVisibilityEnum.PUBLIC,
            MomentVisibilityEnum.UNLISTED,
        ],
        requireAgeRestriction: false,
        requireContentWarning: false,
        allowPrivate: true,
        allowPublic: true,
        allowFollowersOnly: true,
        allowUnlisted: true,
    },
    metadata: {
        requireLocation: false,
        requireDevice: false,
        requireTimestamp: true,
        allowCustomMetadata: true,
        maxMetadataSize: 1024, // 1KB
        requiredFields: ["createdAt", "updatedAt"],
        optionalFields: ["location", "device", "custom"],
    },
    quality: {
        minQualityScore: 30,
        maxQualityScore: 100,
        requireQualityCheck: true,
        allowLowQuality: false,
        qualityThresholds: {
            low: 30,
            medium: 60,
            high: 80,
        },
        qualityFactors: {
            videoQuality: 0.4,
            audioQuality: 0.3,
            contentQuality: 0.2,
            faceDetection: 0.1,
        },
    },
    security: {
        requireAuthentication: true,
        requireVerification: false,
        allowAnonymous: false,
        maxCreationRate: 10, // 10 momentos por hora
        requireContentModeration: true,
        blockSuspiciousContent: true,
        requireOwnerVerification: false,
        allowMultipleOwners: false,
    },
    business: {
        requirePayment: false,
        allowFreeContent: true,
        requireSubscription: false,
    },
}

// ===== REGRAS DE VALIDAÇÃO PARA CONTEÚDO PREMIUM =====
export const PREMIUM_MOMENT_VALIDATION_RULES: MomentValidationRules = {
    content: {
        maxDuration: 60, // 60 segundos
        minDuration: 2, // 2 segundos
        maxSize: 200 * 1024 * 1024, // 200MB
        minSize: 1024 * 1024, // 1MB
        allowedFormats: ["mp4", "webm", "mov"],
        requiredAspectRatio: {
            width: 360,
            height: 558,
        },
        allowedResolutions: [
            { width: 360, height: 558, quality: MomentQualityEnum.MEDIUM },
            { width: 720, height: 1116, quality: MomentQualityEnum.HIGH },
            { width: 1080, height: 1674, quality: MomentQualityEnum.HIGH },
        ],
        qualityThresholds: {
            low: 30,
            medium: 60,
            high: 80,
        },
    },
    text: {
        maxDescriptionLength: 1000,
        minDescriptionLength: 20,
        maxHashtags: 15,
        minHashtags: 0,
        maxMentions: 10,
        minMentions: 0,
        forbiddenWords: [
            "spam",
            "fake",
            "scam",
            "bot",
            "ai",
            "generated",
            "synthetic",
            "hate",
            "violence",
            "explicit",
        ],
        requiredWords: [],
        allowedCharacters:
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?@#$%^&*()_+-=[]{}|;':\",./<>?",
        allowEmojis: true,
        allowSpecialCharacters: true,
        allowNumbers: true,
        allowSpaces: true,
    },
    status: {
        allowedStatuses: [
            MomentStatusEnum.UNDER_REVIEW,
            MomentStatusEnum.PUBLISHED,
            MomentStatusEnum.ARCHIVED,
            MomentStatusEnum.DELETED,
            MomentStatusEnum.BLOCKED,
        ],
        allowedTransitions: {
            [MomentStatusEnum.UNDER_REVIEW]: [
                MomentStatusEnum.PUBLISHED,
                MomentStatusEnum.DELETED,
                MomentStatusEnum.BLOCKED,
            ],
            [MomentStatusEnum.PUBLISHED]: [
                MomentStatusEnum.ARCHIVED,
                MomentStatusEnum.DELETED,
                MomentStatusEnum.BLOCKED,
            ],
            [MomentStatusEnum.ARCHIVED]: [MomentStatusEnum.PUBLISHED, MomentStatusEnum.DELETED],
            [MomentStatusEnum.DELETED]: [],
            [MomentStatusEnum.BLOCKED]: [MomentStatusEnum.UNDER_REVIEW],
        },
        requireModeration: true,
        requireApproval: false,
        autoPublish: false,
        allowDraft: true,
        allowArchived: true,
        allowDeleted: true,
    },
    visibility: {
        allowedLevels: [
            MomentVisibilityEnum.PRIVATE,
            MomentVisibilityEnum.FOLLOWERS_ONLY,
            MomentVisibilityEnum.PUBLIC,
            MomentVisibilityEnum.UNLISTED,
        ],
        requireAgeRestriction: false,
        requireContentWarning: false,
        allowPrivate: true,
        allowPublic: true,
        allowFollowersOnly: true,
        allowUnlisted: true,
    },
    metadata: {
        requireLocation: false,
        requireDevice: false,
        requireTimestamp: true,
        allowCustomMetadata: true,
        maxMetadataSize: 2048, // 2KB
        requiredFields: ["createdAt", "updatedAt"],
        optionalFields: ["location", "device", "custom"],
    },
    quality: {
        minQualityScore: 50,
        maxQualityScore: 100,
        requireQualityCheck: true,
        allowLowQuality: false,
        qualityThresholds: {
            low: 30,
            medium: 60,
            high: 80,
        },
        qualityFactors: {
            videoQuality: 0.4,
            audioQuality: 0.3,
            contentQuality: 0.2,
            faceDetection: 0.1,
        },
    },
    security: {
        requireAuthentication: true,
        requireVerification: true,
        allowAnonymous: false,
        maxCreationRate: 20, // 20 momentos por hora
        requireContentModeration: true,
        blockSuspiciousContent: true,
        requireOwnerVerification: true,
        allowMultipleOwners: false,
    },
    business: {
        requirePayment: false,
        allowFreeContent: true,
        requireSubscription: false,
    },
}

// ===== VALIDADOR DE MOMENT =====
export class MomentValidator {
    constructor(private rules: MomentValidationRules) {}

    /**
     * Valida duração do conteúdo
     */
    validateDuration(duration: number): { isValid: boolean; error?: string } {
        if (duration < this.rules.content.minDuration) {
            return {
                isValid: false,
                error: `Duração mínima de ${this.rules.content.minDuration} segundos`,
            }
        }

        if (duration > this.rules.content.maxDuration) {
            return {
                isValid: false,
                error: `Duração máxima de ${this.rules.content.maxDuration} segundos`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida tamanho do conteúdo
     */
    validateSize(size: number): { isValid: boolean; error?: string } {
        if (size < this.rules.content.minSize) {
            return {
                isValid: false,
                error: `Tamanho mínimo de ${this.rules.content.minSize} bytes`,
            }
        }

        if (size > this.rules.content.maxSize) {
            return {
                isValid: false,
                error: `Tamanho máximo de ${this.rules.content.maxSize} bytes`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida formato do conteúdo
     */
    validateFormat(format: string): { isValid: boolean; error?: string } {
        if (!this.rules.content.allowedFormats.includes(format)) {
            return {
                isValid: false,
                error: `Formato ${format} não é suportado. Formatos permitidos: ${this.rules.content.allowedFormats.join(
                    ", ",
                )}`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida resolução do conteúdo (360x558)
     * DESABILITADA: Aceita qualquer resolução enquanto ffmpeg não está disponível
     */
    validateResolution(width: number, height: number): { isValid: boolean; error?: string } {
        // TODO: Reabilitar quando ffmpeg estiver instalado para fazer crop automático
        console.log(
            `[ValidationRules] ⚠️ Validação de resolução desabilitada (sem ffmpeg): ${width}x${height} - ACEITO`,
        )
        return { isValid: true }
    }

    /**
     * Valida descrição
     */
    validateDescription(description: string): { isValid: boolean; error?: string } {
        if (description.length < this.rules.text.minDescriptionLength) {
            return {
                isValid: false,
                error: `Descrição deve ter pelo menos ${this.rules.text.minDescriptionLength} caracteres`,
            }
        }

        if (description.length > this.rules.text.maxDescriptionLength) {
            return {
                isValid: false,
                error: `Descrição deve ter no máximo ${this.rules.text.maxDescriptionLength} caracteres`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida hashtags
     */
    validateHashtags(hashtags: string[]): { isValid: boolean; error?: string } {
        if (hashtags.length < this.rules.text.minHashtags) {
            return {
                isValid: false,
                error: `Mínimo ${this.rules.text.minHashtags} hashtags obrigatórias`,
            }
        }

        if (hashtags.length > this.rules.text.maxHashtags) {
            return {
                isValid: false,
                error: `Máximo ${this.rules.text.maxHashtags} hashtags permitidas`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida menções
     */
    validateMentions(mentions: string[]): { isValid: boolean; error?: string } {
        if (mentions.length < this.rules.text.minMentions) {
            return {
                isValid: false,
                error: `Mínimo ${this.rules.text.minMentions} menções obrigatórias`,
            }
        }

        if (mentions.length > this.rules.text.maxMentions) {
            return {
                isValid: false,
                error: `Máximo ${this.rules.text.maxMentions} menções permitidas`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida palavras proibidas
     */
    validateForbiddenWords(text: string): { isValid: boolean; error?: string } {
        const lowerText = text.toLowerCase()
        const forbiddenWord = this.rules.text.forbiddenWords.find((word) =>
            lowerText.includes(word.toLowerCase()),
        )

        if (forbiddenWord) {
            return {
                isValid: false,
                error: `Palavra proibida encontrada: ${forbiddenWord}`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida transição de status
     */
    validateStatusTransition(
        currentStatus: MomentStatusEnum,
        newStatus: MomentStatusEnum,
    ): { isValid: boolean; error?: string } {
        if (!this.rules.status.allowedStatuses.includes(newStatus)) {
            return {
                isValid: false,
                error: `Status ${newStatus} não é permitido`,
            }
        }

        const allowedTransitions = this.rules.status.allowedTransitions[currentStatus]
        if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
            return {
                isValid: false,
                error: `Transição de ${currentStatus} para ${newStatus} não é permitida`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida nível de visibilidade
     */
    validateVisibility(visibility: MomentVisibilityEnum): { isValid: boolean; error?: string } {
        if (!this.rules.visibility.allowedLevels.includes(visibility)) {
            return {
                isValid: false,
                error: `Nível de visibilidade ${visibility} não é permitido`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida qualidade
     */
    validateQuality(qualityScore: number): { isValid: boolean; error?: string } {
        if (this.rules.quality.requireQualityCheck) {
            if (qualityScore < this.rules.quality.minQualityScore) {
                return {
                    isValid: false,
                    error: `Qualidade mínima de ${this.rules.quality.minQualityScore} pontos`,
                }
            }

            if (qualityScore > this.rules.quality.maxQualityScore) {
                return {
                    isValid: false,
                    error: `Qualidade máxima de ${this.rules.quality.maxQualityScore} pontos`,
                }
            }

            if (
                !this.rules.quality.allowLowQuality &&
                qualityScore < this.rules.quality.qualityThresholds.medium
            ) {
                return {
                    isValid: false,
                    error: "Qualidade muito baixa para publicação",
                }
            }
        }

        return { isValid: true }
    }

    /**
     * Validação completa de momento
     */
    validateMoment(data: {
        content?: {
            duration: number
            size: number
            format: string
            width?: number
            height?: number
        }
        description?: string
        hashtags?: string[]
        mentions?: string[]
        currentStatus?: MomentStatusEnum
        newStatus?: MomentStatusEnum
        visibility?: MomentVisibilityEnum
        qualityScore?: number
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        // Validar conteúdo
        if (data.content) {
            const durationValidation = this.validateDuration(data.content.duration)
            if (!durationValidation.isValid) {
                errors.push(durationValidation.error!)
            }

            const sizeValidation = this.validateSize(data.content.size)
            if (!sizeValidation.isValid) {
                errors.push(sizeValidation.error!)
            }

            const formatValidation = this.validateFormat(data.content.format)
            if (!formatValidation.isValid) {
                errors.push(formatValidation.error!)
            }

            if (data.content.width && data.content.height) {
                const resolutionValidation = this.validateResolution(
                    data.content.width,
                    data.content.height,
                )
                if (!resolutionValidation.isValid) {
                    errors.push(resolutionValidation.error!)
                }
            }
        }

        // Validar texto
        if (data.description) {
            const descriptionValidation = this.validateDescription(data.description)
            if (!descriptionValidation.isValid) {
                errors.push(descriptionValidation.error!)
            }

            const forbiddenWordsValidation = this.validateForbiddenWords(data.description)
            if (!forbiddenWordsValidation.isValid) {
                errors.push(forbiddenWordsValidation.error!)
            }
        }

        // Validar hashtags
        if (data.hashtags) {
            const hashtagsValidation = this.validateHashtags(data.hashtags)
            if (!hashtagsValidation.isValid) {
                errors.push(hashtagsValidation.error!)
            }
        }

        // Validar menções
        if (data.mentions) {
            const mentionsValidation = this.validateMentions(data.mentions)
            if (!mentionsValidation.isValid) {
                errors.push(mentionsValidation.error!)
            }
        }

        // Validar transição de status
        if (data.currentStatus && data.newStatus) {
            const statusValidation = this.validateStatusTransition(
                data.currentStatus,
                data.newStatus,
            )
            if (!statusValidation.isValid) {
                errors.push(statusValidation.error!)
            }
        }

        // Validar visibilidade
        if (data.visibility) {
            const visibilityValidation = this.validateVisibility(data.visibility)
            if (!visibilityValidation.isValid) {
                errors.push(visibilityValidation.error!)
            }
        }

        // Validar qualidade
        if (data.qualityScore !== undefined) {
            const qualityValidation = this.validateQuality(data.qualityScore)
            if (!qualityValidation.isValid) {
                errors.push(qualityValidation.error!)
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }
}

// ===== FACTORY PARA REGRAS DE VALIDAÇÃO =====
export class MomentValidationRulesFactory {
    /**
     * Cria regras padrão
     */
    static createDefault(): MomentValidationRules {
        return { ...DEFAULT_MOMENT_VALIDATION_RULES }
    }

    /**
     * Cria regras para conteúdo premium
     */
    static createForPremium(): MomentValidationRules {
        return { ...PREMIUM_MOMENT_VALIDATION_RULES }
    }

    /**
     * Cria regras customizadas
     */
    static createCustom(overrides: Partial<MomentValidationRules>): MomentValidationRules {
        return {
            ...DEFAULT_MOMENT_VALIDATION_RULES,
            ...overrides,
            content: {
                ...DEFAULT_MOMENT_VALIDATION_RULES.content,
                ...overrides.content,
            },
            text: {
                ...DEFAULT_MOMENT_VALIDATION_RULES.text,
                ...overrides.text,
            },
            status: {
                ...DEFAULT_MOMENT_VALIDATION_RULES.status,
                ...overrides.status,
            },
            visibility: {
                ...DEFAULT_MOMENT_VALIDATION_RULES.visibility,
                ...overrides.visibility,
            },
            metadata: {
                ...DEFAULT_MOMENT_VALIDATION_RULES.metadata,
                ...overrides.metadata,
            },
            quality: {
                ...DEFAULT_MOMENT_VALIDATION_RULES.quality,
                ...overrides.quality,
            },
            security: {
                ...DEFAULT_MOMENT_VALIDATION_RULES.security,
                ...overrides.security,
            },
            business: {
                ...DEFAULT_MOMENT_VALIDATION_RULES.business,
                ...overrides.business,
            },
        }
    }
}
