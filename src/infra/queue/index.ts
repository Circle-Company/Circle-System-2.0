/**
 * Queue Exports
 * Exportações centralizadas para filas e workers
 */

// Embeddings
export { EmbeddingsQueue } from "./embeddings.queue"
export { EmbeddingsWorker } from "./embeddings.worker"

// Video Compression
export { VideoCompressionQueue } from "./video.compression.queue"
export { VideoCompressionWorker } from "./video.compression.worker"

// Types
export * from "./types/embedding.job.types"
export * from "./types/video.compression.job.types"

// Configuration
export { bullConfig, createRedisClient, testRedisConnection } from "./bull.config"
