/**
 * Embeddings Module Exports
 * Adaptadores de embedding desacoplados com modelos REAIS
 */

export { RealModelsLoader } from "./real.models.loader"
export { TextEmbeddingAdapter } from "./text.embedding.adapter"
export { TranscriptionAdapter } from "./transcription.adapter"
export { VisualEmbeddingAdapter } from "./visual.embedding.adapter"

export {
    MOCK_EMBEDDING_CONFIG,
    PRODUCTION_EMBEDDING_CONFIG,
    getEmbeddingConfig,
} from "./models.config"

export type {
    CLIPConfig,
    EmbeddingModelsConfig,
    TextEmbeddingConfig,
    WhisperConfig,
} from "./models.config"
