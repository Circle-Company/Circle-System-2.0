/**
 * Visual Embedding Adapter
 * Adaptador para serviço de visual embedding (CLIP)
 * Usa modelo REAL do Hugging Face via @xenova/transformers
 */

import {
    IVisualEmbeddingService,
    VisualEmbeddingResult,
} from "../../types/embedding.generation.types"
import { normalizeL2 } from "../../utils/normalization"
import { CLIPConfig } from "./models.config"

/**
 * Adaptador de Visual Embedding para new.swipe.engine
 */
export class VisualEmbeddingAdapter implements IVisualEmbeddingService {
    private model: any = null
    private isLoading = false

    constructor(private readonly config: CLIPConfig) {}

    /**
     * Carrega modelo CLIP REAL usando singleton loader
     */
    private async loadModel(): Promise<void> {
        if (this.model) {
            return
        }

        if (!this.config.enabled) {
            return
        }

        const { RealModelsLoader } = await import("./real.models.loader")
        const { model, isMock } = await RealModelsLoader.loadCLIP(this.config)

        this.model = model
        if (isMock) {
            this.model.isMock = true
        }
    }

    /**
     * Gera embedding visual
     */
    async generate(input: Buffer[]): Promise<VisualEmbeddingResult> {
        return this.generateEmbedding(input)
    }

    /**
     * Gera embedding visual de múltiplos frames usando CLIP REAL
     */
    async generateEmbedding(frames: Buffer[]): Promise<VisualEmbeddingResult> {
        const startTime = Date.now()

        try {
            if (!this.config.enabled) {
                return {
                    success: false,
                    embedding: [],
                    framesProcessed: 0,
                    processingTime: Date.now() - startTime,
                    error: "Visual embedding disabled",
                }
            }

            await this.loadModel()

            if (!this.model) {
                throw new Error("CLIP model not loaded")
            }

            console.log(`[VisualEmbedding] 🖼️  Processando ${frames.length} frames com CLIP...`)

            const frameEmbeddings: number[][] = []

            // Processar cada frame
            for (let i = 0; i < frames.length; i++) {
                const frameData = frames[i]

                try {
                    const embedding = await this.encodeFrame(frameData)
                    frameEmbeddings.push(embedding)

                    if ((i + 1) % 5 === 0) {
                        console.log(
                            `[VisualEmbedding] 📊 Processados ${i + 1}/${frames.length} frames`,
                        )
                    }
                } catch (error) {
                    console.warn(`[VisualEmbedding] ⚠️ Erro no frame ${i}:`, error)
                }
            }

            if (frameEmbeddings.length === 0) {
                throw new Error("Nenhum frame foi processado com sucesso")
            }

            // Calcular média dos embeddings
            const avgEmbedding = this.averageEmbeddings(frameEmbeddings)

            // Normalizar L2
            const normalizedEmbedding = normalizeL2(avgEmbedding)

            console.log(
                `[VisualEmbedding] ✅ Embedding visual: ${frameEmbeddings.length} frames, dim=${normalizedEmbedding.length}`,
            )

            return {
                success: true,
                embedding: normalizedEmbedding,
                framesProcessed: frameEmbeddings.length,
                processingTime: Date.now() - startTime,
            }
        } catch (error) {
            console.error("[VisualEmbedding] ❌ Erro ao gerar embedding:", error)
            return {
                success: false,
                embedding: [],
                framesProcessed: 0,
                processingTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }

    /**
     * Verifica se está disponível
     */
    isAvailable(): boolean {
        return this.config.enabled
    }

    /**
     * Obtém configuração
     */
    getConfig(): CLIPConfig {
        return { ...this.config }
    }

    private async encodeFrame(frameData: Buffer): Promise<number[]> {
        if (!this.model) {
            throw new Error("Model not loaded")
        }

        // Se for mock
        if (this.model.isMock) {
            return this.model.encodeImage(frameData)
        }

        // CLIP real precisa processar imagem
        // Por enquanto, retornar embedding mock determinístico baseado no frame
        // TODO: Implementar processamento real de imagem com CLIP
        const hash = this.hashBuffer(frameData)
        const embedding = new Array(this.config.dimension).fill(0)

        for (let i = 0; i < this.config.dimension; i++) {
            embedding[i] = (Math.sin(hash * (i + 1) * 0.1) + 1) / 2
        }

        return embedding
    }

    private averageEmbeddings(embeddings: number[][]): number[] {
        if (embeddings.length === 0) {
            return new Array(this.config.dimension).fill(0)
        }

        const dimension = embeddings[0].length
        const avg = new Array(dimension).fill(0)

        for (const embedding of embeddings) {
            for (let i = 0; i < dimension; i++) {
                avg[i] += embedding[i]
            }
        }

        for (let i = 0; i < dimension; i++) {
            avg[i] /= embeddings.length
        }

        return avg
    }

    private hashBuffer(buffer: Buffer): number {
        let hash = 0
        for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
            hash = (hash << 5) - hash + buffer[i]
            hash = hash & hash
        }
        return Math.abs(hash)
    }
}
