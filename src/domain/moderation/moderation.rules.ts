/**
 * Regras e pesos centralizados para moderação de conteúdo
 * Este arquivo contém todos os parâmetros, limiares e pesos usados nos algoritmos de moderação
 */

export const ModerationRules = {
    // ===== LIMIARES DE QUALIDADE =====
    QUALITY_THRESHOLDS: {
        // Tamanhos de arquivo
        MIN_IMAGE_SIZE: 1024, // 1KB
        MAX_IMAGE_SIZE: 50 * 1024 * 1024, // 50MB
        MIN_AUDIO_SIZE: 1000, // 1KB
        MAX_AUDIO_SIZE: 100 * 1024 * 1024, // 100MB

        // Durações de mídia
        MIN_VIDEO_DURATION: 1000, // 1 segundo
        MAX_VIDEO_DURATION: 300000, // 5 minutos
        MIN_AUDIO_DURATION: 500, // 0.5 segundos
        MAX_AUDIO_DURATION: 180000, // 3 minutos

        // Limites de texto
        MAX_HASHTAGS: 10,
        MAX_MENTIONS: 20,
        MAX_URLS: 5,
        MIN_TEXT_LENGTH: 3,
        MAX_TEXT_LENGTH: 500,

        // Scores de qualidade
        MIN_QUALITY_SCORE: 30,
        GOOD_QUALITY_SCORE: 70,
        EXCELLENT_QUALITY_SCORE: 90,
    },

    // ===== PESOS PARA DETECÇÃO DE SPAM =====
    SPAM_DETECTION: {
        // Pesos por padrão detectado
        PATTERN_MATCH_WEIGHT: 20,
        EXCESSIVE_REPETITION_WEIGHT: 30,
        EXCESSIVE_SPECIAL_CHARS_WEIGHT: 15,

        // Limiares de spam
        SPAM_THRESHOLD_LOW: 30,
        SPAM_THRESHOLD_MEDIUM: 50,
        SPAM_THRESHOLD_HIGH: 70,

        // Limiar de repetição
        MAX_REPETITION_RATIO: 0.3, // 30% de repetição máxima
        MAX_SPECIAL_CHAR_RATIO: 0.2, // 20% de caracteres especiais máximo
    },

    // ===== PESOS PARA ANÁLISE DE QUALIDADE DE TEXTO =====
    TEXT_QUALITY: {
        // Penalizações por elemento
        HASHTAG_PENALTY: 10,
        MENTION_PENALTY: 5,
        URL_PENALTY: 20,

        // Scores base
        MIN_LENGTH_SCORE: 20,
        MAX_LENGTH_SCORE: 50,
        OPTIMAL_LENGTH_SCORE: 100,

        // Pesos para cálculo geral
        HASHTAG_WEIGHT: 1,
        MENTION_WEIGHT: 1,
        URL_WEIGHT: 1,
        LENGTH_WEIGHT: 1,
    },

    // ===== PESOS PARA ANÁLISE DE PADRÕES SUSPEITOS =====
    SUSPICIOUS_PATTERNS: {
        // Pesos por padrão
        LONG_TEXT_NO_LINKS_WEIGHT: 10,
        EXCESSIVE_REPEATED_CHARS_WEIGHT: 20,
        EXCESSIVE_UPPERCASE_WEIGHT: 15,

        // Limiares
        SUSPICIOUS_THRESHOLD: 30,
        LONG_TEXT_THRESHOLD: 100,
        MAX_UPPERCASE_RATIO: 0.5, // 50% maiúsculas máximo
        MIN_REPEATED_CHARS: 4, // Mínimo de caracteres repetidos consecutivos
    },

    // ===== PESOS PARA ANÁLISE DE IMAGEM =====
    IMAGE_ANALYSIS: {
        // Pesos para cálculo de qualidade
        SIZE_WEIGHT: 1,
        FORMAT_WEIGHT: 1,
        ENTROPY_WEIGHT: 1,

        // Limiares para qualidade
        MIN_ENTROPY_SCORE: 30,
        GOOD_ENTROPY_SCORE: 60,
        MIN_FORMAT_SCORE: 50,

        // Configurações para detecção de conteúdo sintético
        CHUNK_SIZE: 256,
        MIN_BUFFER_SIZE: 1024,
        REPETITION_THRESHOLD: 70, // Score alto indica conteúdo sintético
        COLOR_DISTRIBUTION_THRESHOLD: 30,

        // Configurações para detecção de bordas
        EDGE_DETECTION_THRESHOLD: 50,
        EDGE_NORMALIZATION_FACTOR: 1000,
    },

    // ===== PESOS PARA ANÁLISE DE ÁUDIO =====
    AUDIO_ANALYSIS: {
        // Pesos para cálculo de qualidade
        SIZE_WEIGHT: 1,
        FORMAT_WEIGHT: 1,
        AMPLITUDE_WEIGHT: 1,
        FREQUENCY_WEIGHT: 1,

        // Limiares de qualidade
        MIN_AMPLITUDE_SCORE: 30,
        MIN_FREQUENCY_SCORE: 40,
        MIN_FORMAT_SCORE: 50,

        // Configurações para análise de amplitude
        AMPLITUDE_SAMPLE_SIZE: 2048,

        // Configurações para análise de frequência
        FREQUENCY_BANDS: 10,
        FREQUENCY_SAMPLE_SIZE: 1024,

        // Estimativa de duração
        ESTIMATED_BITRATE: 16 * 1024, // 16KB por segundo
    },

    // ===== PADRÕES DE SPAM =====
    SPAM_PATTERNS: [
        /\b(click here|buy now|limited time|act now|free money|make money|earn \$|guaranteed)\b/gi,
        /\b(viagra|cialis|casino|poker|lottery|winner|congratulations)\b/gi,
        /\b(follow me|subscribe|like|share|retweet|follow back)\b/gi,
    ],

    // ===== HEADERS DE FORMATOS DE ARQUIVO =====
    FILE_HEADERS: {
        IMAGE: {
            JPEG: [0xff, 0xd8, 0xff] as number[],
            PNG: [0x89, 0x50, 0x4e, 0x47] as number[],
            GIF: [0x47, 0x49, 0x46] as number[],
            WEBP: [0x52, 0x49, 0x46, 0x46] as number[],
        },
        AUDIO: {
            MP3: [0xff, 0xfb] as number[],
            WAV: [0x52, 0x49, 0x46, 0x46] as number[],
            OGG: [0x4f, 0x67, 0x67, 0x53] as number[],
            AAC: [0xff, 0xf1] as number[],
        },
    },

    // ===== CONFIGURAÇÕES DE VALIDAÇÃO =====
    VALIDATION: {
        MAX_FLAGS: 20,
        MIN_CONFIDENCE: 0,
        MAX_CONFIDENCE: 100,
        MAX_PROCESSING_TIME: 30000, // 30 segundos
        REQUIRED_FIELDS: ["contentId", "contentOwnerId"],
        DETECTION_MODELS: [
            "algorithmic-spam-detector",
            "mathematical-quality-analyzer",
            "statistical-content-classifier",
        ],
    },

    // ===== CONFIGURAÇÕES DE CONFIANÇA =====
    CONFIDENCE: {
        // Limiares de confiança para diferentes tipos de conteúdo
        MIN_HUMAN_CONTENT_CONFIDENCE: 70,
        MIN_APPROVED_CONTENT_CONFIDENCE: 80,
        MIN_REJECTED_CONTENT_CONFIDENCE: 60,

        // Fatores de multiplicação
        TEXT_CONFIDENCE_MULTIPLIER: 100,
        AUDIO_CONFIDENCE_MULTIPLIER: 100,
        IMAGE_CONFIDENCE_MULTIPLIER: 100,
    },

    // ===== CONFIGURAÇÕES DE SEVERIDADE =====
    SEVERITY: {
        // Mapeamento de scores para severidade
        HIGH_SEVERITY_THRESHOLD: 70,
        MEDIUM_SEVERITY_THRESHOLD: 40,
        LOW_SEVERITY_THRESHOLD: 20,

        // Pesos para cálculo de severidade geral
        SPAM_WEIGHT: 1,
        QUALITY_WEIGHT: 1,
        PATTERN_WEIGHT: 1,
    },

    // ===== CONFIGURAÇÕES DE STATUS =====
    STATUS: {
        // Limiares para mudança de status
        PENDING_TO_FLAGGED_THRESHOLD: 30,
        FLAGGED_TO_APPROVED_THRESHOLD: 80,
        FLAGGED_TO_REJECTED_THRESHOLD: 70,

        // Configurações de bloqueio automático
        AUTO_BLOCK_SPAM_THRESHOLD: 80,
        AUTO_BLOCK_QUALITY_THRESHOLD: 20,
    },

    // ===== CONFIGURAÇÕES DO MODERATION ENGINE =====
    ENGINE_CONFIGS: {
        // Configuração padrão
        DEFAULT: {
            detection: {
                qualityDetection: {
                    enabled: true,
                    minVideoQuality: 60,
                    minAudioQuality: 50,
                },
                textAnalysis: {
                    enabled: true,
                    maxTextLength: 500,
                    repetitiveTextThreshold: 0.8,
                    specialCharRatioThreshold: 0.3,
                    textOnlyDurationThreshold: 30000,
                },
                hashtagAnalysis: {
                    enabled: true,
                    maxHashtagCount: 10,
                    maxHashtagLength: 50,
                    spamKeywords: ["spam", "fake"],
                    relevanceThreshold: 0.5,
                },
            },
            blocking: {
                autoBlock: true,
                autoHide: true,
                autoFlag: true,
                severityThresholds: {
                    low: 30,
                    medium: 60,
                    high: 80,
                },
            },
            performance: {
                maxProcessingTime: 30000, // 30 segundos
                timeout: 10000, // 10 segundos
                retryAttempts: 3,
            },
        },

        // Configuração para conteúdo humano
        HUMAN_CONTENT: {
            detection: {
                qualityDetection: {
                    enabled: true,
                    minVideoQuality: 70,
                    minAudioQuality: 60,
                },
                textAnalysis: {
                    enabled: true,
                    maxTextLength: 500,
                    repetitiveTextThreshold: 0.8,
                    specialCharRatioThreshold: 0.3,
                    textOnlyDurationThreshold: 30000,
                },
                hashtagAnalysis: {
                    enabled: true,
                    maxHashtagCount: 10,
                    maxHashtagLength: 50,
                    spamKeywords: ["spam", "fake"],
                    relevanceThreshold: 0.5,
                },
            },
            blocking: {
                autoBlock: false,
                autoHide: true,
                autoFlag: true,
                severityThresholds: {
                    low: 40,
                    medium: 70,
                    high: 90,
                },
            },
            performance: {
                maxProcessingTime: 45000, // 45 segundos
                timeout: 15000, // 15 segundos
                retryAttempts: 2,
            },
        },

        // Configuração rigorosa
        STRICT: {
            detection: {
                qualityDetection: {
                    enabled: true,
                    minVideoQuality: 80,
                    minAudioQuality: 70,
                },
                textAnalysis: {
                    enabled: true,
                    maxTextLength: 500,
                    repetitiveTextThreshold: 0.8,
                    specialCharRatioThreshold: 0.3,
                    textOnlyDurationThreshold: 30000,
                },
                hashtagAnalysis: {
                    enabled: true,
                    maxHashtagCount: 10,
                    maxHashtagLength: 50,
                    spamKeywords: ["spam", "fake"],
                    relevanceThreshold: 0.5,
                },
            },
            blocking: {
                autoBlock: true,
                autoHide: true,
                autoFlag: true,
                severityThresholds: {
                    low: 50,
                    medium: 80,
                    high: 95,
                },
            },
            performance: {
                maxProcessingTime: 60000, // 60 segundos
                timeout: 20000, // 20 segundos
                retryAttempts: 1,
            },
        },

        // Configuração permissiva
        PERMISSIVE: {
            detection: {
                qualityDetection: {
                    enabled: true,
                    minVideoQuality: 40,
                    minAudioQuality: 30,
                },
                textAnalysis: {
                    enabled: true,
                    maxTextLength: 500,
                    repetitiveTextThreshold: 0.8,
                    specialCharRatioThreshold: 0.3,
                    textOnlyDurationThreshold: 30000,
                },
                hashtagAnalysis: {
                    enabled: true,
                    maxHashtagCount: 10,
                    maxHashtagLength: 50,
                    spamKeywords: ["spam", "fake"],
                    relevanceThreshold: 0.5,
                },
            },
            blocking: {
                autoBlock: false,
                autoHide: false,
                autoFlag: true,
                severityThresholds: {
                    low: 20,
                    medium: 50,
                    high: 70,
                },
            },
            performance: {
                maxProcessingTime: 20000, // 20 segundos
                timeout: 5000, // 5 segundos
                retryAttempts: 5,
            },
        },
    },
} as const

// ===== TIPOS PARA AS REGRAS =====
export type ModerationRulesType = typeof ModerationRules
export type QualityThresholds = typeof ModerationRules.QUALITY_THRESHOLDS
export type SpamDetection = typeof ModerationRules.SPAM_DETECTION
export type TextQuality = typeof ModerationRules.TEXT_QUALITY
export type SuspiciousPatterns = typeof ModerationRules.SUSPICIOUS_PATTERNS
export type ImageAnalysis = typeof ModerationRules.IMAGE_ANALYSIS
export type AudioAnalysis = typeof ModerationRules.AUDIO_ANALYSIS
export type Validation = typeof ModerationRules.VALIDATION
export type Confidence = typeof ModerationRules.CONFIDENCE
export type Severity = typeof ModerationRules.SEVERITY
export type Status = typeof ModerationRules.STATUS
export type EngineConfigs = typeof ModerationRules.ENGINE_CONFIGS
