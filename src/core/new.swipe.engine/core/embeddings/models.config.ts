/**
 * Configuração de Modelos de Embedding
 * Define configurações para Whisper, text-embedding e CLIP
 */

export interface ModelConfig {
    enabled: boolean
    modelPath?: string
    dimension: number
    batchSize: number
    timeout: number
}

export interface WhisperConfig extends ModelConfig {
    model: "tiny" | "base" | "small"
    language: string
    task: "transcribe" | "translate"
    sampleRate: number
    audioChannels: number
}

export interface TextEmbeddingConfig extends ModelConfig {
    model: "all-MiniLM-L6-v2" | "all-MiniLM-L12-v2"
    maxLength: number
    pooling: "mean" | "cls"
}

export interface CLIPConfig extends ModelConfig {
    model: "ViT-B/32" | "ViT-B/16"
    imageSize: number
    framesPerSecond: number
    maxFrames: number
}

export interface EmbeddingModelsConfig {
    whisper: WhisperConfig
    textEmbedding: TextEmbeddingConfig
    clip: CLIPConfig
    weights: {
        text: number
        visual: number
    }
}

// Configuração mock para desenvolvimento (compatível com new.swipe.engine)
export const MOCK_EMBEDDING_CONFIG: EmbeddingModelsConfig = {
    whisper: {
        enabled: false,
        model: "tiny",
        language: "pt",
        task: "transcribe",
        sampleRate: 16000,
        audioChannels: 1,
        dimension: 128,
        batchSize: 1,
        timeout: 5000,
    },
    textEmbedding: {
        enabled: true,
        model: "all-MiniLM-L6-v2",
        dimension: 128,
        maxLength: 256,
        pooling: "mean",
        batchSize: 16,
        timeout: 5000,
    },
    clip: {
        enabled: false,
        model: "ViT-B/32",
        dimension: 128,
        imageSize: 224,
        framesPerSecond: 1,
        maxFrames: 5,
        batchSize: 4,
        timeout: 10000,
    },
    weights: {
        text: 0.6,
        visual: 0.4,
    },
}

// Configuração para produção
export const PRODUCTION_EMBEDDING_CONFIG: EmbeddingModelsConfig = {
    whisper: {
        enabled: true,
        model: "base",
        language: "pt",
        task: "transcribe",
        sampleRate: 16000,
        audioChannels: 1,
        dimension: 512,
        batchSize: 1,
        timeout: 60000,
    },
    textEmbedding: {
        enabled: true,
        model: "all-MiniLM-L12-v2",
        dimension: 384,
        maxLength: 512,
        pooling: "mean",
        batchSize: 32,
        timeout: 15000,
    },
    clip: {
        enabled: true,
        model: "ViT-B/16",
        dimension: 512,
        imageSize: 224,
        framesPerSecond: 1,
        maxFrames: 15,
        batchSize: 16,
        timeout: 30000,
    },
    weights: {
        text: 0.5,
        visual: 0.5,
    },
}

/**
 * Obtém configuração baseada no ambiente
 */
export function getEmbeddingConfig(): EmbeddingModelsConfig {
    const env = process.env.NODE_ENV || "development"

    switch (env) {
        case "production":
            return PRODUCTION_EMBEDDING_CONFIG
        case "test":
            return MOCK_EMBEDDING_CONFIG
        default:
            return MOCK_EMBEDDING_CONFIG
    }
}
