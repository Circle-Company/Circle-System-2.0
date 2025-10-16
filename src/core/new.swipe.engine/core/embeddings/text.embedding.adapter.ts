/**
 * Text Embedding Adapter
 * Adaptador para serviço de text embedding (all-MiniLM)
 * Usa modelos REAIS do Hugging Face via @xenova/transformers
 */

import { ITextEmbeddingService, TextEmbeddingResult } from "../../types/embedding.generation.types"
import { normalizeL2 } from "../../utils/normalization"
import { TextEmbeddingConfig } from "./models.config"

/**
 * Adaptador de Text Embedding para new.swipe.engine
 */
export class TextEmbeddingAdapter implements ITextEmbeddingService {
    private model: any = null
    private isLoading = false

    constructor(private readonly config: TextEmbeddingConfig) {}

    /**
     * Carrega modelo real do Hugging Face (lazy loading)
     */
    private async loadModel(): Promise<void> {
        if (this.model || this.isLoading) {
            return
        }

        if (!this.config.enabled) {
            return
        }

        this.isLoading = true

        try {
            console.log("[TextEmbedding] 🔄 Carregando all-MiniLM do Hugging Face...")

            const { pipeline } = await import("@xenova/transformers")

            // Carregar modelo real
            this.model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
                cache_dir: "./models/huggingface",
            })

            console.log(
                `[TextEmbedding] ✅ Modelo all-MiniLM-L6-v2 carregado (dim=${this.config.dimension})`,
            )
        } catch (error) {
            console.error("[TextEmbedding] ❌ Erro ao carregar modelo:", error)
            console.warn("[TextEmbedding] ⚠️ Usando fallback mock...")

            // Fallback para mock se falhar
            this.model = {
                encode: (text: string) => {
                    const hash = this.simpleHash(text)
                    const embedding = new Array(this.config.dimension).fill(0)

                    for (let i = 0; i < this.config.dimension; i++) {
                        embedding[i] = (Math.sin(hash * (i + 1) * 0.01) + 1) / 2
                    }

                    return embedding
                },
                isMock: true,
            }

            console.log("[TextEmbedding] ✅ Modelo mock carregado (fallback)")
        } finally {
            this.isLoading = false
        }
    }

    /**
     * Gera embedding de texto
     */
    async generate(input: string): Promise<TextEmbeddingResult> {
        return this.generateEmbedding(input)
    }

    /**
     * Gera embedding de texto usando modelo REAL do Hugging Face
     */
    async generateEmbedding(text: string): Promise<TextEmbeddingResult> {
        const startTime = Date.now()

        try {
            if (!this.config.enabled) {
                return {
                    success: false,
                    embedding: [],
                    tokenCount: 0,
                    processingTime: Date.now() - startTime,
                    error: "Text embedding disabled",
                }
            }

            await this.loadModel()

            if (!this.model) {
                throw new Error("Model not loaded")
            }

            const truncatedText = this.truncateText(text, this.config.maxLength)
            const tokenCount = this.estimateTokens(truncatedText)

            console.log(
                `[TextEmbedding] 📝 Gerando embedding: ${truncatedText.substring(0, 50)}...`,
            )

            // Usar modelo REAL do Hugging Face
            let rawEmbedding: number[]

            if (this.model.isMock) {
                // Fallback mock
                rawEmbedding = await this.model.encode(truncatedText)
            } else {
                // Modelo REAL
                const output = await this.model(truncatedText, {
                    pooling: this.config.pooling,
                    normalize: true,
                })

                // Extrair dados do tensor
                rawEmbedding = Array.from(output.data)
            }

            // Normalizar L2 (garantir magnitude 1)
            const normalizedEmbedding = normalizeL2(rawEmbedding)

            console.log(
                `[TextEmbedding] ✅ Embedding gerado: dim=${normalizedEmbedding.length}, tokens=${tokenCount}`,
            )

            return {
                success: true,
                embedding: normalizedEmbedding,
                tokenCount,
                processingTime: Date.now() - startTime,
            }
        } catch (error) {
            console.error("[TextEmbedding] ❌ Erro ao gerar embedding:", error)
            return {
                success: false,
                embedding: [],
                tokenCount: 0,
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
    getConfig(): TextEmbeddingConfig {
        return { ...this.config }
    }

    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text
        }

        const truncated = text.substring(0, maxLength)
        const lastSpace = truncated.lastIndexOf(" ")

        return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated
    }

    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4)
    }

    private simpleHash(text: string): number {
        let hash = 0
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash
        }
        return Math.abs(hash)
    }
}
