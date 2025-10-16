/**
 * Content Embedding Generator
 * Serviço desacoplado para gerar embeddings de conteúdo com pipeline completo
 */

import {
    ContentEmbedding,
    ITextEmbeddingService,
    ITranscriptionService,
    IVisualEmbeddingService,
} from "../../types/embedding.generation.types"
import { combineVectors, normalizeL2 } from "../../utils/normalization"
import { EmbeddingModelsConfig } from "../embeddings/models.config"

export interface ContentEmbeddingInput {
    videoData: Buffer
    description: string
    hashtags: string[]
    videoMetadata: {
        width: number
        height: number
        duration: number
        codec: string
        hasAudio: boolean
    }
}

/**
 * Gerador de Content Embedding com arquitetura desacoplada
 */
export class ContentEmbeddingGenerator {
    constructor(
        private readonly config: EmbeddingModelsConfig,
        private readonly textEmbeddingService: ITextEmbeddingService,
        private readonly transcriptionService?: ITranscriptionService,
        private readonly visualEmbeddingService?: IVisualEmbeddingService,
        private readonly audioExtractor?: any, // Interface opcional
    ) {}

    /**
     * Gera content embedding completo
     */
    async generate(input: ContentEmbeddingInput): Promise<ContentEmbedding> {
        console.log("[ContentEmbeddingGenerator] 🧠 Gerando content embedding...")

        const embeddings: number[][] = []
        const weights: number[] = []
        const metadata: any = {
            model: "content-embedding-v2-pipeline",
            generatedAt: new Date(),
            components: {},
        }

        // Componente 1: Transcrição (opcional)
        if (
            this.transcriptionService &&
            this.audioExtractor &&
            this.config.whisper.enabled &&
            input.videoMetadata.hasAudio
        ) {
            try {
                const audioResult = await this.audioExtractor.extractAudio(input.videoData, {
                    sampleRate: this.config.whisper.sampleRate,
                    channels: this.config.whisper.audioChannels,
                })

                if (audioResult.success && audioResult.audioData) {
                    const transcription = await this.transcriptionService.transcribe(
                        audioResult.audioData,
                    )

                    metadata.components.transcription = {
                        text: transcription.text,
                        language: transcription.language,
                        confidence: transcription.confidence,
                    }
                }
            } catch (error) {
                console.warn("[ContentEmbeddingGenerator] ⚠️ Erro na transcrição:", error)
            }
        }

        // Componente 2: Visual Embedding (opcional)
        if (this.visualEmbeddingService && this.audioExtractor && this.config.clip.enabled) {
            try {
                const framesResult = await this.audioExtractor.extractFrames(input.videoData, {
                    fps: this.config.clip.framesPerSecond,
                    maxFrames: this.config.clip.maxFrames,
                })

                if (framesResult.success && framesResult.frames.length > 0) {
                    const frameBuffers = framesResult.frames.map((f: any) => f.data)
                    const visualEmbedding = await this.visualEmbeddingService.generateEmbedding(
                        frameBuffers,
                    )

                    if (visualEmbedding.success) {
                        embeddings.push(visualEmbedding.embedding)
                        weights.push(this.config.weights.visual)

                        metadata.components.visual = {
                            framesProcessed: visualEmbedding.framesProcessed,
                            dimension: visualEmbedding.embedding.length,
                        }
                    }

                    this.audioExtractor.cleanupFrames(framesResult)
                }
            } catch (error) {
                console.warn("[ContentEmbeddingGenerator] ⚠️ Erro no visual embedding:", error)
            }
        }

        // Componente 3: Text Embedding (obrigatório)
        try {
            const textParts: string[] = []

            if (input.description) {
                textParts.push(input.description)
            }

            if (metadata.components.transcription?.text) {
                textParts.push(metadata.components.transcription.text)
            }

            if (input.hashtags.length > 0) {
                textParts.push(input.hashtags.map((h) => `#${h}`).join(" "))
            }

            textParts.push(
                `resolução:${input.videoMetadata.width}x${input.videoMetadata.height} duração:${input.videoMetadata.duration}s`,
            )

            const combinedText = textParts.join(" ")
            const textEmbedding = await this.textEmbeddingService.generateEmbedding(combinedText)

            if (textEmbedding.success) {
                embeddings.push(textEmbedding.embedding)
                weights.push(this.config.weights.text)

                metadata.components.text = {
                    tokenCount: textEmbedding.tokenCount,
                    dimension: textEmbedding.embedding.length,
                    textLength: combinedText.length,
                }
            }
        } catch (error) {
            console.error("[ContentEmbeddingGenerator] ❌ Erro no text embedding:", error)
            throw error // Text embedding é obrigatório
        }

        // Combinar embeddings
        if (embeddings.length === 0) {
            throw new Error("Nenhum embedding foi gerado")
        }

        const finalVector = normalizeL2(combineVectors(embeddings, weights))

        metadata.combinedFrom = {
            components: embeddings.length,
            weights: Object.fromEntries(
                weights.map((w, i) => [["visual", "text"][i] || `component_${i}`, w]),
            ),
        }

        console.log(
            `[ContentEmbeddingGenerator] ✅ Embedding gerado: dim=${finalVector.length}, components=${embeddings.length}`,
        )

        return {
            vector: finalVector,
            dimension: finalVector.length,
            metadata,
        }
    }

    /**
     * Verifica se o gerador está disponível
     */
    isAvailable(): boolean {
        return this.textEmbeddingService !== undefined
    }
}
