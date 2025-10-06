import { ContentStorage, HttpAdapter, ModerationEngineConfig, ModerationRepository } from "./types"

import { ContentBlocker } from "./content/blocker"
import { ContentDetector } from "./content/detector"
import { ModerationEngine } from "./moderation"

export class ModerationEngineFactory {
    /**
     * Cria uma instância do ModerationEngine com todas as dependências
     */
    static create(
        httpAdapter: HttpAdapter,
        moderationRepository: ModerationRepository,
        contentStorage: ContentStorage,
        config: ModerationEngineConfig,
    ): ModerationEngine {
        // Criar ContentDetector
        const contentDetector = new ContentDetector(config)

        // Criar ContentBlocker
        const contentBlocker = new ContentBlocker(moderationRepository, config)

        // Criar ModerationEngine
        const moderationEngine = new ModerationEngine(
            contentDetector,
            contentBlocker,
            moderationRepository,
            contentStorage,
            httpAdapter,
            config,
        )

        return moderationEngine
    }

    /**
     * Cria configuração padrão do engine
     */
    static createDefaultConfig(): ModerationEngineConfig {
        return {
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
        }
    }

    /**
     * Cria configuração para conteúdo humano (foco em algoritmos matemáticos)
     */
    static createHumanContentConfig(): ModerationEngineConfig {
        return {
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
        }
    }

    /**
     * Cria configuração para detecção rigorosa (algoritmos matemáticos)
     */
    static createStrictConfig(): ModerationEngineConfig {
        return {
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
        }
    }

    /**
     * Cria configuração para detecção permissiva (algoritmos matemáticos)
     */
    static createPermissiveConfig(): ModerationEngineConfig {
        return {
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
        }
    }
}
