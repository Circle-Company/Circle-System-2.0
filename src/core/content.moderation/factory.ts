import { ContentStorage, HttpAdapter, ModerationEngineConfig, ModerationRepository } from "./types"

import { ModerationRules } from "@/domain/moderation/moderation.rules"
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
        return ModerationRules.ENGINE_CONFIGS.DEFAULT as unknown as ModerationEngineConfig
    }

    /**
     * Cria configuração para conteúdo humano (foco em algoritmos matemáticos)
     */
    static createHumanContentConfig(): ModerationEngineConfig {
        return ModerationRules.ENGINE_CONFIGS.HUMAN_CONTENT as unknown as ModerationEngineConfig
    }

    /**
     * Cria configuração para detecção rigorosa (algoritmos matemáticos)
     */
    static createStrictConfig(): ModerationEngineConfig {
        return ModerationRules.ENGINE_CONFIGS.STRICT as unknown as ModerationEngineConfig
    }

    /**
     * Cria configuração para detecção permissiva (algoritmos matemáticos)
     */
    static createPermissiveConfig(): ModerationEngineConfig {
        return ModerationRules.ENGINE_CONFIGS.PERMISSIVE as unknown as ModerationEngineConfig
    }
}
