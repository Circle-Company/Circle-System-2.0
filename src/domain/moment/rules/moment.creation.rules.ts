import { MomentQualityEnum, MomentStatusEnum, MomentVisibilityEnum } from "../types"

// ===== REGRAS DE CRIAÇÃO DE MOMENT =====
export interface MomentCreationRules {
    // Regras de validação
    validation: {
        requireOwner: boolean
        requireDescription: boolean
        requireContent: boolean
        requireHashtags: boolean
        maxHashtags: number
        maxMentions: number
        maxDescriptionLength: number
        minDescriptionLength: number
    }

    // Regras de conteúdo
    content: {
        allowedFormats: string[]
        maxDuration: number // segundos
        maxSize: number // bytes
        minDuration: number // segundos
        minSize: number // bytes
        requiredAspectRatio: {
            width: number
            height: number
        }
        allowedResolutions: Array<{
            width: number
            height: number
            quality: MomentQualityEnum
        }>
    }

    // Regras de texto
    text: {
        forbiddenWords: string[]
        requiredWords: string[]
        allowedCharacters: string
        maxHashtags: number
        maxMentions: number
        maxDescriptionLength: number
        minDescriptionLength: number
        allowEmojis: boolean
        allowSpecialCharacters: boolean
    }

    // Regras de status inicial
    initialStatus: {
        defaultStatus: MomentStatusEnum
        defaultVisibility: MomentVisibilityEnum
        autoPublish: boolean
        requireModeration: boolean
        requireApproval: boolean
    }

    // Regras de metadados
    metadata: {
        requireLocation: boolean
        requireDevice: boolean
        requireTimestamp: boolean
        allowCustomMetadata: boolean
        maxMetadataSize: number // bytes
    }

    // Regras de qualidade
    quality: {
        minQualityScore: number
        requireQualityCheck: boolean
        allowLowQuality: boolean
        qualityThresholds: {
            low: number
            medium: number
            high: number
        }
    }

    // Regras de segurança
    security: {
        requireAuthentication: boolean
        requireVerification: boolean
        allowAnonymous: boolean
        maxCreationRate: number // por hora
        requireContentModeration: boolean
        blockSuspiciousContent: boolean
    }
}

// ===== REGRAS PADRÃO DE CRIAÇÃO =====
export const DEFAULT_MOMENT_CREATION_RULES: MomentCreationRules = {
    validation: {
        requireOwner: true,
        requireDescription: true,
        requireContent: true,
        requireHashtags: false,
        maxHashtags: 10,
        maxMentions: 5,
        maxDescriptionLength: 500,
        minDescriptionLength: 10,
    },
    content: {
        allowedFormats: ["mp4", "webm", "mov"],
        maxDuration: 30, // 30 segundos
        maxSize: 100 * 1024 * 1024, // 100MB
        minDuration: 1, // 1 segundo
        minSize: 1024, // 1KB
        requiredAspectRatio: {
            width: 360,
            height: 558,
        },
        allowedResolutions: [
            { width: 360, height: 558, quality: MomentQualityEnum.MEDIUM },
            { width: 1080, height: 1674, quality: MomentQualityEnum.HIGH },
        ],
    },
    text: {
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
        maxHashtags: 10,
        maxMentions: 5,
        maxDescriptionLength: 500,
        minDescriptionLength: 10,
        allowEmojis: true,
        allowSpecialCharacters: true,
    },
    initialStatus: {
        defaultStatus: MomentStatusEnum.UNDER_REVIEW,
        defaultVisibility: MomentVisibilityEnum.PRIVATE,
        autoPublish: false,
        requireModeration: true,
        requireApproval: false,
    },
    metadata: {
        requireLocation: false,
        requireDevice: false,
        requireTimestamp: true,
        allowCustomMetadata: true,
        maxMetadataSize: 1024, // 1KB
    },
    quality: {
        minQualityScore: 30,
        requireQualityCheck: true,
        allowLowQuality: false,
        qualityThresholds: {
            low: 30,
            medium: 60,
            high: 80,
        },
    },
    security: {
        requireAuthentication: true,
        requireVerification: false,
        allowAnonymous: false,
        maxCreationRate: 10, // 10 momentos por hora
        requireContentModeration: true,
        blockSuspiciousContent: true,
    },
}

// ===== REGRAS PARA CONTEÚDO HUMANO PREMIUM =====
export const HUMAN_CONTENT_CREATION_RULES: MomentCreationRules = {
    validation: {
        requireOwner: true,
        requireDescription: true,
        requireContent: true,
        requireHashtags: false,
        maxHashtags: 15,
        maxMentions: 10,
        maxDescriptionLength: 1000,
        minDescriptionLength: 20,
    },
    content: {
        allowedFormats: ["mp4", "webm", "mov"],
        maxDuration: 60, // 60 segundos
        maxSize: 200 * 1024 * 1024, // 200MB
        minDuration: 2, // 2 segundos
        minSize: 1024 * 1024, // 1MB
        requiredAspectRatio: {
            width: 360,
            height: 558,
        },
        allowedResolutions: [
            { width: 360, height: 558, quality: MomentQualityEnum.MEDIUM },
            { width: 720, height: 1116, quality: MomentQualityEnum.HIGH },
            { width: 1080, height: 1674, quality: MomentQualityEnum.HIGH },
        ],
    },
    text: {
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
        maxHashtags: 15,
        maxMentions: 10,
        maxDescriptionLength: 1000,
        minDescriptionLength: 20,
        allowEmojis: true,
        allowSpecialCharacters: true,
    },
    initialStatus: {
        defaultStatus: MomentStatusEnum.UNDER_REVIEW,
        defaultVisibility: MomentVisibilityEnum.PRIVATE,
        autoPublish: false,
        requireModeration: true,
        requireApproval: false,
    },
    metadata: {
        requireLocation: false,
        requireDevice: false,
        requireTimestamp: true,
        allowCustomMetadata: true,
        maxMetadataSize: 2048, // 2KB
    },
    quality: {
        minQualityScore: 50,
        requireQualityCheck: true,
        allowLowQuality: false,
        qualityThresholds: {
            low: 30,
            medium: 60,
            high: 80,
        },
    },
    security: {
        requireAuthentication: true,
        requireVerification: true,
        allowAnonymous: false,
        maxCreationRate: 20, // 20 momentos por hora
        requireContentModeration: true,
        blockSuspiciousContent: true,
    },
}

// ===== VALIDADOR DE REGRAS DE CRIAÇÃO =====
export class MomentCreationValidator {
    constructor(private rules: MomentCreationRules) {}

    /**
     * Valida se o owner é obrigatório
     */
    validateOwner(ownerId: string | null): { isValid: boolean; error?: string } {
        if (this.rules.validation.requireOwner && !ownerId) {
            return { isValid: false, error: "Owner é obrigatório" }
        }
        return { isValid: true }
    }

    /**
     * Valida descrição
     */
    validateDescription(description: string): { isValid: boolean; error?: string } {
        if (this.rules.validation.requireDescription && !description) {
            return { isValid: false, error: "Descrição é obrigatória" }
        }

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
        if (this.rules.validation.requireHashtags && hashtags.length === 0) {
            return { isValid: false, error: "Pelo menos uma hashtag é obrigatória" }
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
        if (mentions.length > this.rules.text.maxMentions) {
            return {
                isValid: false,
                error: `Máximo ${this.rules.text.maxMentions} menções permitidas`,
            }
        }

        return { isValid: true }
    }

    /**
     * Valida conteúdo
     */
    validateContent(content: {
        duration: number
        size: number
        format: string
        width?: number
        height?: number
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (this.rules.validation.requireContent) {
            if (content.duration < this.rules.content.minDuration) {
                errors.push(`Duração mínima de ${this.rules.content.minDuration} segundos`)
            }

            if (content.duration > this.rules.content.maxDuration) {
                errors.push(`Duração máxima de ${this.rules.content.maxDuration} segundos`)
            }

            if (content.size < this.rules.content.minSize) {
                errors.push(`Tamanho mínimo de ${this.rules.content.minSize} bytes`)
            }

            if (content.size > this.rules.content.maxSize) {
                errors.push(`Tamanho máximo de ${this.rules.content.maxSize} bytes`)
            }

            if (!this.rules.content.allowedFormats.includes(content.format)) {
                errors.push(`Formato ${content.format} não é suportado`)
            }

            if (content.width && content.height) {
                // Validação de aspect ratio e resolução DESABILITADA (sem ffmpeg para fazer crop)
                // TODO: Reabilitar quando ffmpeg estiver disponível para fazer crop automático
                console.log(
                    `[CreationRules] ⚠️ Validação desabilitada (sem ffmpeg): ${content.width}x${content.height} - ACEITO`,
                )
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
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
     * Valida taxa de criação
     */
    validateCreationRate(
        creationCount: number,
        timeWindow: number,
    ): { isValid: boolean; error?: string } {
        const rate = creationCount / (timeWindow / 3600) // por hora
        if (rate > this.rules.security.maxCreationRate) {
            return {
                isValid: false,
                error: `Taxa de criação muito alta. Máximo ${this.rules.security.maxCreationRate} momentos por hora`,
            }
        }

        return { isValid: true }
    }

    /**
     * Validação completa de criação
     */
    validateCreation(data: {
        ownerId: string | null
        description: string
        hashtags: string[]
        mentions: string[]
        content: {
            duration: number
            size: number
            format: string
            width?: number
            height?: number
        }
        qualityScore?: number
        creationCount?: number
        timeWindow?: number
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        // Validar owner
        const ownerValidation = this.validateOwner(data.ownerId)
        if (!ownerValidation.isValid) {
            errors.push(ownerValidation.error!)
        }

        // Validar descrição
        const descriptionValidation = this.validateDescription(data.description)
        if (!descriptionValidation.isValid) {
            errors.push(descriptionValidation.error!)
        }

        // Validar hashtags
        const hashtagsValidation = this.validateHashtags(data.hashtags)
        if (!hashtagsValidation.isValid) {
            errors.push(hashtagsValidation.error!)
        }

        // Validar menções
        const mentionsValidation = this.validateMentions(data.mentions)
        if (!mentionsValidation.isValid) {
            errors.push(mentionsValidation.error!)
        }

        // Validar conteúdo
        const contentValidation = this.validateContent(data.content)
        if (!contentValidation.isValid) {
            errors.push(...contentValidation.errors)
        }

        // Validar palavras proibidas
        const forbiddenWordsValidation = this.validateForbiddenWords(data.description)
        if (!forbiddenWordsValidation.isValid) {
            errors.push(forbiddenWordsValidation.error!)
        }

        // Validar qualidade
        if (data.qualityScore !== undefined) {
            const qualityValidation = this.validateQuality(data.qualityScore)
            if (!qualityValidation.isValid) {
                errors.push(qualityValidation.error!)
            }
        }

        // Validar taxa de criação
        if (data.creationCount !== undefined && data.timeWindow !== undefined) {
            const rateValidation = this.validateCreationRate(data.creationCount, data.timeWindow)
            if (!rateValidation.isValid) {
                errors.push(rateValidation.error!)
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }
}

// ===== FACTORY PARA REGRAS DE CRIAÇÃO =====
export class MomentCreationRulesFactory {
    /**
     * Cria regras padrão
     */
    static createDefault(): MomentCreationRules {
        return { ...DEFAULT_MOMENT_CREATION_RULES }
    }

    /**
     * Cria regras para conteúdo humano
     */
    static createForHumanContent(): MomentCreationRules {
        return { ...HUMAN_CONTENT_CREATION_RULES }
    }

    /**
     * Cria regras customizadas
     */
    static createCustom(overrides: Partial<MomentCreationRules>): MomentCreationRules {
        return {
            ...DEFAULT_MOMENT_CREATION_RULES,
            ...overrides,
            validation: {
                ...DEFAULT_MOMENT_CREATION_RULES.validation,
                ...overrides.validation,
            },
            content: {
                ...DEFAULT_MOMENT_CREATION_RULES.content,
                ...overrides.content,
            },
            text: {
                ...DEFAULT_MOMENT_CREATION_RULES.text,
                ...overrides.text,
            },
            initialStatus: {
                ...DEFAULT_MOMENT_CREATION_RULES.initialStatus,
                ...overrides.initialStatus,
            },
            metadata: {
                ...DEFAULT_MOMENT_CREATION_RULES.metadata,
                ...overrides.metadata,
            },
            quality: {
                ...DEFAULT_MOMENT_CREATION_RULES.quality,
                ...overrides.quality,
            },
            security: {
                ...DEFAULT_MOMENT_CREATION_RULES.security,
                ...overrides.security,
            },
        }
    }
}
