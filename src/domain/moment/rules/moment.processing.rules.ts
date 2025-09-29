import { MomentQualityEnum } from "../types"

// ===== REGRAS DE PROCESSAMENTO DE MOMENT =====
export interface MomentProcessingRules {
    // Regras de conteúdo
    content: {
        maxDuration: number // segundos
        maxSize: number // bytes
        allowedFormats: string[]
        allowedResolutions: Array<{
            width: number
            height: number
            quality: MomentQualityEnum
        }>
    }

    // Regras de texto
    text: {
        maxHashtags: number
        maxMentions: number
        maxDescriptionLength: number
        forbiddenWords: string[]
    }

    // Regras de processamento
    processing: {
        maxProcessingTime: number // segundos
        retryAttempts: number
        qualityLevels: string[]
        thumbnailGeneration: boolean
        embeddingGeneration: boolean
    }

    // Regras de armazenamento
    storage: {
        providers: string[]
        maxConcurrentUploads: number
        compressionEnabled: boolean
        cdnEnabled: boolean
    }
}

// ===== REGRAS PADRÃO (APENAS CONTEÚDO HUMANO) =====
export const DEFAULT_MOMENT_PROCESSING_RULES: MomentProcessingRules = {
    content: {
        maxDuration: 30, // 30 segundos máximo
        maxSize: 100 * 1024 * 1024, // 100MB máximo
        allowedFormats: ["mp4", "webm", "mov"],
        allowedResolutions: [
            { width: 720, height: 1280, quality: MomentQualityEnum.MEDIUM }, // 9:16
            { width: 1080, height: 1920, quality: MomentQualityEnum.HIGH }, // 9:16
        ],
    },
    text: {
        maxHashtags: 10,
        maxMentions: 2,
        maxDescriptionLength: 500,
        forbiddenWords: ["spam", "fake", "scam", "bot", "ai", "generated", "synthetic"],
    },
    processing: {
        maxProcessingTime: 300, // 5 minutos
        retryAttempts: 1,
        qualityLevels: ["medium", "high"],
        thumbnailGeneration: true,
        embeddingGeneration: true,
    },
    storage: {
        providers: ["aws", "gcp"],
        maxConcurrentUploads: 1,
        compressionEnabled: true,
        cdnEnabled: true,
    },
}

// ===== REGRAS PARA CONTEÚDO HUMANO PREMIUM =====
export const HUMAN_CONTENT_PROCESSING_RULES: MomentProcessingRules = {
    content: {
        maxDuration: 60, // 60 segundos para conteúdo humano premium
        maxSize: 200 * 1024 * 1024, // 200MB para conteúdo humano premium
        allowedFormats: ["mp4", "webm", "mov"],
        allowedResolutions: [
            { width: 1080, height: 1920, quality: MomentQualityEnum.HIGH }, // 9:16
            { width: 1440, height: 2560, quality: MomentQualityEnum.HIGH }, // 9:16
            { width: 2160, height: 3840, quality: MomentQualityEnum.HIGH }, // 9:16 (4K)
        ],
    },
    text: {
        maxHashtags: 10,
        maxMentions: 3,
        maxDescriptionLength: 500,
        forbiddenWords: ["spam", "fake", "scam", "bot", "ai", "generated", "synthetic"],
    },
    processing: {
        maxProcessingTime: 600, // 10 minutos
        retryAttempts: 3,
        qualityLevels: ["high"],
        thumbnailGeneration: true,
        embeddingGeneration: true,
    },
    storage: {
        providers: ["aws"],
        maxConcurrentUploads: 5,
        compressionEnabled: true,
        cdnEnabled: true,
    },
}

// ===== REGRAS PARA CONTEÚDO HUMANO ULTRA PREMIUM =====
export const HIGH_QUALITY_PROCESSING_RULES: MomentProcessingRules = {
    content: {
        maxDuration: 120, // 2 minutos
        maxSize: 500 * 1024 * 1024, // 500MB
        allowedFormats: ["mp4", "webm"],
        allowedResolutions: [
            { width: 1440, height: 2560, quality: MomentQualityEnum.HIGH }, // 9:16
            { width: 2160, height: 3840, quality: MomentQualityEnum.HIGH }, // 9:16 (4K)
        ],
    },
    text: {
        maxHashtags: 20,
        maxMentions: 50,
        maxDescriptionLength: 2000,
        forbiddenWords: ["spam", "fake", "scam", "bot", "ai", "generated", "synthetic"],
    },
    processing: {
        maxProcessingTime: 900, // 15 minutos
        retryAttempts: 3,
        qualityLevels: ["high"],
        thumbnailGeneration: true,
        embeddingGeneration: true,
    },
    storage: {
        providers: ["aws"],
        maxConcurrentUploads: 3,
        compressionEnabled: false,
        cdnEnabled: true,
    },
}

// ===== UTILITÁRIOS DE VALIDAÇÃO =====
export class MomentProcessingValidator {
    constructor(private rules: MomentProcessingRules) {}

    /**
     * Valida duração do conteúdo
     */
    validateDuration(duration: number): boolean {
        return duration <= this.rules.content.maxDuration
    }

    /**
     * Valida tamanho do conteúdo
     */
    validateSize(size: number): boolean {
        return size <= this.rules.content.maxSize
    }

    /**
     * Valida formato do conteúdo
     */
    validateFormat(format: string): boolean {
        return this.rules.content.allowedFormats.includes(format)
    }

    /**
     * Valida resolução do conteúdo (apenas 9:16)
     */
    validateResolution(width: number, height: number): boolean {
        // Verificar se é aspect ratio 9:16
        const aspectRatio = width / height
        const targetRatio = 9 / 16
        const tolerance = 0.01 // 1% de tolerância

        if (Math.abs(aspectRatio - targetRatio) > tolerance) {
            return false
        }

        // Verificar se a resolução está próxima de uma resolução permitida
        return this.rules.content.allowedResolutions.some((res) => {
            const widthDiff = Math.abs(width - res.width)
            const heightDiff = Math.abs(height - res.height)
            return widthDiff <= 2 && heightDiff <= 2 // Tolerância de 2 pixels
        })
    }

    /**
     * Valida número de hashtags
     */
    validateHashtags(hashtags: string[]): boolean {
        return hashtags.length <= this.rules.text.maxHashtags
    }

    /**
     * Valida número de menções
     */
    validateMentions(mentions: string[]): boolean {
        return mentions.length <= this.rules.text.maxMentions
    }

    /**
     * Valida comprimento da descrição
     */
    validateDescription(description: string): boolean {
        return description.length <= this.rules.text.maxDescriptionLength
    }

    /**
     * Valida palavras proibidas
     */
    validateForbiddenWords(text: string): boolean {
        const lowerText = text.toLowerCase()
        return !this.rules.text.forbiddenWords.some((word) =>
            lowerText.includes(word.toLowerCase()),
        )
    }

    /**
     * Valida conteúdo completo
     */
    validateContent(content: {
        duration: number
        size: number
        format: string
        width?: number
        height?: number
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!this.validateDuration(content.duration)) {
            errors.push(`Duração máxima de ${this.rules.content.maxDuration} segundos`)
        }

        if (!this.validateSize(content.size)) {
            errors.push(`Tamanho máximo de ${this.rules.content.maxSize} bytes`)
        }

        if (!this.validateFormat(content.format)) {
            errors.push(`Formato ${content.format} não é suportado`)
        }

        if (
            content.width &&
            content.height &&
            !this.validateResolution(content.width, content.height)
        ) {
            errors.push(`Resolução ${content.width}x${content.height} não é suportada`)
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    /**
     * Valida texto completo
     */
    validateText(text: { description: string; hashtags: string[]; mentions: string[] }): {
        isValid: boolean
        errors: string[]
    } {
        const errors: string[] = []

        if (!this.validateDescription(text.description)) {
            errors.push(
                `Descrição muito longa. Máximo ${this.rules.text.maxDescriptionLength} caracteres`,
            )
        }

        if (!this.validateHashtags(text.hashtags)) {
            errors.push(`Máximo ${this.rules.text.maxHashtags} hashtags permitidas`)
        }

        if (!this.validateMentions(text.mentions)) {
            errors.push(`Máximo ${this.rules.text.maxMentions} menções permitidas`)
        }

        if (!this.validateForbiddenWords(text.description)) {
            errors.push("Descrição contém palavras proibidas")
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }
}

// ===== FACTORY PARA REGRAS =====
export class MomentProcessingRulesFactory {
    /**
     * Cria regras padrão
     */
    static createDefault(): MomentProcessingRules {
        return { ...DEFAULT_MOMENT_PROCESSING_RULES }
    }

    /**
     * Cria regras para conteúdo humano
     */
    static createForHumanContent(): MomentProcessingRules {
        return { ...HUMAN_CONTENT_PROCESSING_RULES }
    }

    /**
     * Cria regras para alta qualidade
     */
    static createForHighQuality(): MomentProcessingRules {
        return { ...HIGH_QUALITY_PROCESSING_RULES }
    }

    /**
     * Cria regras customizadas
     */
    static createCustom(overrides: Partial<MomentProcessingRules>): MomentProcessingRules {
        return {
            ...DEFAULT_MOMENT_PROCESSING_RULES,
            ...overrides,
            content: {
                ...DEFAULT_MOMENT_PROCESSING_RULES.content,
                ...overrides.content,
            },
            text: {
                ...DEFAULT_MOMENT_PROCESSING_RULES.text,
                ...overrides.text,
            },
            processing: {
                ...DEFAULT_MOMENT_PROCESSING_RULES.processing,
                ...overrides.processing,
            },
            storage: {
                ...DEFAULT_MOMENT_PROCESSING_RULES.storage,
                ...overrides.storage,
            },
        }
    }
}
