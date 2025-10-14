/**
 * Real Models Loader
 * Carrega modelos REAIS do Hugging Face
 */

import { CLIPConfig, TextEmbeddingConfig, WhisperConfig } from "./models.config"

/**
 * Gerenciador de modelos reais do Hugging Face
 */
export class RealModelsLoader {
    private static textModel: any = null
    private static clipModel: any = null
    private static whisperModel: any = null
    private static isLoadingText = false
    private static isLoadingClip = false
    private static isLoadingWhisper = false

    /**
     * Carrega modelo de text embedding (singleton)
     */
    static async loadTextEmbedding(
        config: TextEmbeddingConfig,
    ): Promise<{ model: any; isMock: boolean }> {
        if (this.textModel) {
            return { model: this.textModel, isMock: this.textModel.isMock || false }
        }

        if (this.isLoadingText) {
            // Aguardar carregamento
            await new Promise((resolve) => setTimeout(resolve, 100))
            return this.loadTextEmbedding(config)
        }

        if (!config.enabled) {
            return { model: null, isMock: false }
        }

        this.isLoadingText = true

        try {
            console.log("[ModelsLoader] 🔄 Carregando all-MiniLM...")

            const { pipeline } = await import("@xenova/transformers")

            this.textModel = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
                cache_dir: "./models/huggingface",
            })

            console.log("[ModelsLoader] ✅ all-MiniLM carregado")
            return { model: this.textModel, isMock: false }
        } catch (error) {
            console.error("[ModelsLoader] ❌ Erro ao carregar all-MiniLM:", error)
            console.warn("[ModelsLoader] ⚠️ Usando fallback mock para text embedding")

            this.textModel = this.createMockTextModel(config.dimension)
            return { model: this.textModel, isMock: true }
        } finally {
            this.isLoadingText = false
        }
    }

    /**
     * Carrega modelo CLIP (singleton)
     */
    static async loadCLIP(config: CLIPConfig): Promise<{ model: any; isMock: boolean }> {
        if (this.clipModel) {
            return { model: this.clipModel, isMock: this.clipModel.isMock || false }
        }

        if (this.isLoadingClip) {
            await new Promise((resolve) => setTimeout(resolve, 100))
            return this.loadCLIP(config)
        }

        if (!config.enabled) {
            return { model: null, isMock: false }
        }

        this.isLoadingClip = true

        try {
            console.log("[ModelsLoader] 🔄 Carregando CLIP...")

            const { pipeline } = await import("@xenova/transformers")

            this.clipModel = await pipeline(
                "zero-shot-image-classification",
                "Xenova/clip-vit-base-patch32",
                {
                    cache_dir: "./models/huggingface",
                },
            )

            console.log("[ModelsLoader] ✅ CLIP carregado")
            return { model: this.clipModel, isMock: false }
        } catch (error) {
            console.error("[ModelsLoader] ❌ Erro ao carregar CLIP:", error)
            console.warn("[ModelsLoader] ⚠️ Usando fallback mock para CLIP")

            this.clipModel = this.createMockCLIPModel(config.dimension)
            return { model: this.clipModel, isMock: true }
        } finally {
            this.isLoadingClip = false
        }
    }

    /**
     * Carrega modelo Whisper (singleton)
     */
    static async loadWhisper(config: WhisperConfig): Promise<{ model: any; isMock: boolean }> {
        if (this.whisperModel) {
            return { model: this.whisperModel, isMock: this.whisperModel.isMock || false }
        }

        if (this.isLoadingWhisper) {
            await new Promise((resolve) => setTimeout(resolve, 100))
            return this.loadWhisper(config)
        }

        if (!config.enabled) {
            return { model: null, isMock: false }
        }

        this.isLoadingWhisper = true

        try {
            console.log("[ModelsLoader] 🔄 Carregando Whisper...")

            const { pipeline } = await import("@xenova/transformers")

            this.whisperModel = await pipeline(
                "automatic-speech-recognition",
                "Xenova/whisper-tiny",
                {
                    cache_dir: "./models/huggingface",
                },
            )

            console.log("[ModelsLoader] ✅ Whisper carregado")
            return { model: this.whisperModel, isMock: false }
        } catch (error) {
            console.error("[ModelsLoader] ❌ Erro ao carregar Whisper:", error)
            console.warn("[ModelsLoader] ⚠️ Usando fallback mock para Whisper")

            this.whisperModel = this.createMockWhisperModel()
            return { model: this.whisperModel, isMock: true }
        } finally {
            this.isLoadingWhisper = false
        }
    }

    /**
     * Limpa cache de modelos (útil para testes)
     */
    static clearCache(): void {
        this.textModel = null
        this.clipModel = null
        this.whisperModel = null
    }

    /**
     * Cria modelo mock de text embedding
     */
    private static createMockTextModel(dimension: number) {
        return {
            encode: (text: string) => {
                let hash = 0
                for (let i = 0; i < text.length; i++) {
                    hash = (hash << 5) - hash + text.charCodeAt(i)
                    hash = hash & hash
                }
                hash = Math.abs(hash)

                const embedding = new Array(dimension).fill(0)
                for (let i = 0; i < dimension; i++) {
                    embedding[i] = (Math.sin(hash * (i + 1) * 0.01) + 1) / 2
                }

                return embedding
            },
            isMock: true,
        }
    }

    /**
     * Cria modelo mock de CLIP
     */
    private static createMockCLIPModel(dimension: number) {
        return {
            encodeImage: (imageData: Buffer) => {
                let hash = 0
                for (let i = 0; i < Math.min(imageData.length, 1000); i++) {
                    hash = (hash << 5) - hash + imageData[i]
                    hash = hash & hash
                }
                hash = Math.abs(hash)

                const embedding = new Array(dimension).fill(0)
                for (let i = 0; i < dimension; i++) {
                    embedding[i] = (Math.sin(hash * (i + 1) * 0.1) + 1) / 2
                }

                return embedding
            },
            isMock: true,
        }
    }

    /**
     * Cria modelo mock de Whisper
     */
    private static createMockWhisperModel() {
        return {
            transcribe: (audioData: Buffer) => {
                const estimatedWords = Math.max(10, Math.floor(audioData.length / 1000))
                const words = [
                    "olá",
                    "pessoal",
                    "bem-vindos",
                    "vídeo",
                    "hoje",
                    "vamos",
                    "falar",
                    "sobre",
                ]
                const transcript = Array(estimatedWords)
                    .fill(null)
                    .map((_, i) => words[i % words.length])
                    .join(" ")

                return { text: transcript }
            },
            isMock: true,
        }
    }
}
