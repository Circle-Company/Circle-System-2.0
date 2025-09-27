import {
    AIDetectionModel,
    ContentStorage,
    FaceDetectionModel,
    HttpAdapter,
    ModerationEngineConfig,
    ModerationRepository,
    QualityDetectionModel,
    SpamDetectionModel,
} from "./types"

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
        faceDetectionModel: FaceDetectionModel,
        aiDetectionModel: AIDetectionModel,
        qualityDetectionModel: QualityDetectionModel,
        spamDetectionModel: SpamDetectionModel,
        config: ModerationEngineConfig,
    ): ModerationEngine {
        // Criar ContentDetector
        const contentDetector = new ContentDetector(
            faceDetectionModel,
            aiDetectionModel,
            qualityDetectionModel,
            spamDetectionModel,
            config,
        )

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
                faceDetection: {
                    enabled: true,
                    minConfidence: 70,
                    model: "face-detector-v1",
                },
                aiDetection: {
                    enabled: true,
                    minConfidence: 80,
                    model: "ai-detector-v1",
                },
                qualityDetection: {
                    enabled: true,
                    minVideoQuality: 60,
                    minAudioQuality: 50,
                },
                spamDetection: {
                    enabled: true,
                    minConfidence: 75,
                    model: "spam-detector-v1",
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
     * Cria configuração para conteúdo humano (foco em rostos)
     */
    static createHumanContentConfig(): ModerationEngineConfig {
        return {
            detection: {
                faceDetection: {
                    enabled: true,
                    minConfidence: 80,
                    model: "face-detector-v1",
                },
                aiDetection: {
                    enabled: true,
                    minConfidence: 90,
                    model: "ai-detector-v1",
                },
                qualityDetection: {
                    enabled: true,
                    minVideoQuality: 70,
                    minAudioQuality: 60,
                },
                spamDetection: {
                    enabled: true,
                    minConfidence: 80,
                    model: "spam-detector-v1",
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
     * Cria configuração para detecção rigorosa
     */
    static createStrictConfig(): ModerationEngineConfig {
        return {
            detection: {
                faceDetection: {
                    enabled: true,
                    minConfidence: 90,
                    model: "face-detector-v1",
                },
                aiDetection: {
                    enabled: true,
                    minConfidence: 95,
                    model: "ai-detector-v1",
                },
                qualityDetection: {
                    enabled: true,
                    minVideoQuality: 80,
                    minAudioQuality: 70,
                },
                spamDetection: {
                    enabled: true,
                    minConfidence: 85,
                    model: "spam-detector-v1",
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
     * Cria configuração para detecção permissiva
     */
    static createPermissiveConfig(): ModerationEngineConfig {
        return {
            detection: {
                faceDetection: {
                    enabled: true,
                    minConfidence: 50,
                    model: "face-detector-v1",
                },
                aiDetection: {
                    enabled: true,
                    minConfidence: 70,
                    model: "ai-detector-v1",
                },
                qualityDetection: {
                    enabled: true,
                    minVideoQuality: 40,
                    minAudioQuality: 30,
                },
                spamDetection: {
                    enabled: true,
                    minConfidence: 60,
                    model: "spam-detector-v1",
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
