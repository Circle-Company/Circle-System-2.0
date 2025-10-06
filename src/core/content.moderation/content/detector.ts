import {
    ContentTypeEnum,
    ModerationFlagEnum,
    ModerationSeverityEnum,
} from "@/domain/moderation/moderation.type"
import {
    ContentDetectionRequest,
    ContentDetectionResult,
    ModerationEngineConfig,
    ModerationFlag,
} from "../types"

import { ModerationAlgorithms } from "../moderation.algorithms"

export class ContentDetector {
    constructor(private readonly config: ModerationEngineConfig) {}

    /**
     * Detecta o tipo de conteúdo usando algoritmos de detecção avançados
     */
    async detectContent(request: ContentDetectionRequest): Promise<ContentDetectionResult> {
        const startTime = Date.now()
        const flags: ModerationFlag[] = []
        let contentType = ContentTypeEnum.UNKNOWN
        let isHumanContent = false
        let confidence = 0
        let reasoning = ""

        try {
            // 1. Análise de conteúdo usando algoritmo de detecção avançado
            if (request.contentData && request.contentData.length > 0) {
                const detectionResult = ModerationAlgorithms.detectContentType(
                    request.contentData,
                    request.metadata,
                )

                // Mapear resultado para enum
                switch (detectionResult.contentType) {
                    case "human":
                        contentType = ContentTypeEnum.HUMAN
                        isHumanContent = true
                        break
                    case "ai_generated":
                        contentType = ContentTypeEnum.AI_GENERATED
                        break
                    case "spam":
                        contentType = ContentTypeEnum.SPAM
                        break
                    case "bot":
                        contentType = ContentTypeEnum.BOT
                        break
                    default:
                        contentType = ContentTypeEnum.UNKNOWN
                }

                confidence = detectionResult.confidence
                reasoning = detectionResult.reasoning

                // Adicionar flags baseadas nas características detectadas
                if (detectionResult.detectedFeatures.includes("padroes_sinteticos")) {
                    flags.push({
                        type: ModerationFlagEnum.STATIC_CONTENT,
                        severity: ModerationSeverityEnum.MEDIUM,
                        confidence: detectionResult.confidence,
                        description: "Conteúdo sintético detectado por análise avançada",
                        detectedAt: new Date(),
                        metadata: {
                            detectedFeatures: detectionResult.detectedFeatures,
                            qualityScore: detectionResult.qualityScore,
                        },
                    })
                }

                if (detectionResult.detectedFeatures.includes("tamanho_insuficiente")) {
                    flags.push({
                        type: ModerationFlagEnum.LOW_QUALITY_CONTENT,
                        severity: ModerationSeverityEnum.MEDIUM,
                        confidence: 80,
                        description: "Conteúdo com tamanho insuficiente",
                        detectedAt: new Date(),
                        metadata: {
                            detectedFeatures: detectionResult.detectedFeatures,
                        },
                    })
                }

                if (detectionResult.detectedFeatures.includes("alta_repeticao")) {
                    flags.push({
                        type: ModerationFlagEnum.STATIC_CONTENT,
                        severity: ModerationSeverityEnum.LOW,
                        confidence: 70,
                        description: "Alta repetição de padrões detectada",
                        detectedAt: new Date(),
                        metadata: {
                            detectedFeatures: detectionResult.detectedFeatures,
                        },
                    })
                }
            }

            // 2. Análise de texto usando algoritmos avançados
            if (request.metadata && request.metadata.description) {
                const textAnalysis = this.analyzeTextContent(request.metadata.description)

                // Adicionar flags de texto
                if (textAnalysis.flags.length > 0) {
                    flags.push(...textAnalysis.flags)
                    reasoning += "Problemas de texto detectados. "
                }

                // Verificar se é spam baseado em algoritmos avançados
                if (textAnalysis.isSpam) {
                    contentType = ContentTypeEnum.SPAM
                    confidence = Math.max(confidence, textAnalysis.spamConfidence)
                    reasoning += "Conteúdo spam detectado por análise avançada. "

                    flags.push({
                        type: ModerationFlagEnum.SPAM_CONTENT,
                        severity: ModerationSeverityEnum.HIGH,
                        confidence: textAnalysis.spamConfidence,
                        description: `Spam detectado: ${textAnalysis.spamType}`,
                        detectedAt: new Date(),
                        metadata: {
                            spamType: textAnalysis.spamType,
                            detectedPatterns: textAnalysis.detectedPatterns,
                        },
                    })
                }
            }

            // 3. Análise de hashtags usando algoritmos avançados
            if (request.metadata && request.metadata.hashtags) {
                const hashtagAnalysis = this.analyzeHashtagContent(
                    request.metadata.hashtags,
                    request.metadata,
                )

                if (hashtagAnalysis.flags.length > 0) {
                    flags.push(...hashtagAnalysis.flags)
                    reasoning += "Problemas com hashtags detectados. "
                }
            }

            // 4. Determinar tipo final baseado nas análises
            if (contentType === ContentTypeEnum.UNKNOWN) {
                contentType = this.determineContentTypeFromAnalysis(
                    flags,
                    isHumanContent,
                    confidence,
                )
            }

            const processingTime = Date.now() - startTime

            return {
                contentType,
                confidence: Math.min(100, Math.max(0, confidence)),
                isHumanContent,
                flags,
                model: "advanced-detection-algorithm-v1",
                version: "1.0.0",
                processingTime,
                reasoning: reasoning.trim() || "Análise avançada concluída",
                detectedAt: new Date(),
            }
        } catch (error) {
            const processingTime = Date.now() - startTime

            return {
                contentType: ContentTypeEnum.UNKNOWN,
                confidence: 0,
                isHumanContent: false,
                flags: [
                    {
                        type: ModerationFlagEnum.STATIC_CONTENT,
                        severity: ModerationSeverityEnum.HIGH,
                        confidence: 100,
                        description: `Erro na análise: ${
                            error instanceof Error ? error.message : "Erro desconhecido"
                        }`,
                        detectedAt: new Date(),
                        metadata: { error: true, analysisType: "advanced" },
                    },
                ],
                model: "advanced-detection-algorithm-v1",
                version: "1.0.0",
                processingTime,
                reasoning: "Erro durante a análise avançada",
                detectedAt: new Date(),
            }
        }
    }

    /**
     * Analisa texto usando algoritmos avançados
     */
    private analyzeTextContent(text: string): {
        isSpam: boolean
        spamConfidence: number
        spamType: string
        detectedPatterns: string[]
        flags: ModerationFlag[]
    } {
        const flags: ModerationFlag[] = []
        let isSpam = false
        let spamConfidence = 0
        let spamType = ""
        const detectedPatterns: string[] = []

        try {
            // Análise de qualidade do texto
            const qualityAnalysis = ModerationAlgorithms.analyzeTextQuality(text)

            if (qualityAnalysis.qualityScore < 20) {
                flags.push({
                    type: ModerationFlagEnum.EXCESSIVE_TEXT,
                    severity: ModerationSeverityEnum.MEDIUM,
                    confidence: qualityAnalysis.confidence,
                    description: `Texto de baixa qualidade: ${qualityAnalysis.qualityScore}/100`,
                    detectedAt: new Date(),
                    metadata: {
                        qualityScore: qualityAnalysis.qualityScore,
                        analysisType: "advanced",
                    },
                })
            }

            // Análise de spam
            const spamAnalysis = ModerationAlgorithms.analyzeSpamContent(text)

            if (spamAnalysis.spamScore > 40) {
                detectedPatterns.push(...spamAnalysis.detectedPatterns)
                isSpam = true
                spamConfidence = spamAnalysis.confidence
                spamType = spamAnalysis.spamType

                flags.push({
                    type: ModerationFlagEnum.SPAM_CONTENT,
                    severity: ModerationSeverityEnum.HIGH,
                    confidence: spamAnalysis.confidence,
                    description: `Conteúdo spam detectado: ${spamAnalysis.spamScore}/100`,
                    detectedAt: new Date(),
                    metadata: {
                        spamScore: spamAnalysis.spamScore,
                        detectedPatterns: spamAnalysis.detectedPatterns,
                        analysisType: "advanced",
                    },
                })
            }

            // Detectar texto excessivo baseado na qualidade
            if (qualityAnalysis.wordCount > 500) {
                flags.push({
                    type: ModerationFlagEnum.EXCESSIVE_TEXT,
                    severity: ModerationSeverityEnum.MEDIUM,
                    confidence: 85,
                    description: `Texto muito longo: ${qualityAnalysis.wordCount} palavras`,
                    detectedAt: new Date(),
                    metadata: {
                        wordCount: qualityAnalysis.wordCount,
                        analysisType: "advanced",
                    },
                })
            }

            // Detectar hashtags excessivas
            if (qualityAnalysis.hashtags > 10) {
                flags.push({
                    type: ModerationFlagEnum.EXCESSIVE_HASHTAGS,
                    severity: ModerationSeverityEnum.MEDIUM,
                    confidence: 90,
                    description: `Muitas hashtags: ${qualityAnalysis.hashtags}`,
                    detectedAt: new Date(),
                    metadata: {
                        hashtagCount: qualityAnalysis.hashtags,
                        analysisType: "advanced",
                    },
                })
            }
        } catch (error) {
            // Em caso de erro, marcar como conteúdo suspeito
            flags.push({
                type: ModerationFlagEnum.SUSPICIOUS_PATTERNS,
                severity: ModerationSeverityEnum.MEDIUM,
                confidence: 100,
                description: "Erro na análise avançada de texto",
                detectedAt: new Date(),
                metadata: { error: true, analysisType: "mathematical" },
            })
        }

        return {
            isSpam,
            spamConfidence,
            spamType,
            detectedPatterns,
            flags,
        }
    }

    /**
     * Analisa hashtags usando algoritmos avançados
     */
    private analyzeHashtagContent(
        hashtags: string[],
        metadata?: Record<string, any>,
    ): {
        flags: ModerationFlag[]
    } {
        const flags: ModerationFlag[] = []

        try {
            const hashtagCount = hashtags.length

            // Verificar quantidade excessiva
            const maxHashtags = this.config.detection.hashtagAnalysis?.maxHashtagCount || 30
            if (hashtagCount > maxHashtags) {
                flags.push({
                    type: ModerationFlagEnum.EXCESSIVE_HASHTAGS,
                    severity: ModerationSeverityEnum.MEDIUM,
                    confidence: 95,
                    description: `Hashtags excessivas: ${hashtagCount}/${maxHashtags}`,
                    detectedAt: new Date(),
                    metadata: {
                        hashtagCount,
                        limit: maxHashtags,
                        analysisType: "advanced",
                    },
                })
            }

            // Verificar hashtags muito longas
            const maxLength = this.config.detection.hashtagAnalysis?.maxHashtagLength || 50
            const longHashtags = hashtags.filter((tag) => tag.replace("#", "").length > maxLength)
            if (longHashtags.length > 0) {
                flags.push({
                    type: ModerationFlagEnum.LONG_HASHTAGS,
                    severity: ModerationSeverityEnum.LOW,
                    confidence: 80,
                    description: `Hashtags muito longas: ${longHashtags.length}`,
                    detectedAt: new Date(),
                    metadata: {
                        longHashtagCount: longHashtags.length,
                        analysisType: "advanced",
                    },
                })
            }

            // Verificar duplicatas
            const uniqueHashtags = new Set(hashtags.map((tag) => tag.toLowerCase()))
            if (uniqueHashtags.size < hashtagCount) {
                flags.push({
                    type: ModerationFlagEnum.DUPLICATE_HASHTAGS,
                    severity: ModerationSeverityEnum.LOW,
                    confidence: 90,
                    description: `Hashtags duplicadas: ${hashtagCount - uniqueHashtags.size}`,
                    detectedAt: new Date(),
                    metadata: {
                        duplicateCount: hashtagCount - uniqueHashtags.size,
                        analysisType: "advanced",
                    },
                })
            }
        } catch (error) {
            flags.push({
                type: ModerationFlagEnum.EXCESSIVE_HASHTAGS,
                severity: ModerationSeverityEnum.LOW,
                confidence: 100,
                description: "Erro na análise matemática de hashtags",
                detectedAt: new Date(),
                metadata: { error: true, analysisType: "mathematical" },
            })
        }

        return { flags }
    }

    /**
     * Determina o tipo de conteúdo baseado nas análises matemáticas
     */
    private determineContentTypeFromAnalysis(
        flags: ModerationFlag[],
        isHumanContent: boolean,
        confidence: number,
    ): ContentTypeEnum {
        // Se tem flags de conteúdo estático/sintético, é conteúdo gerado
        if (flags.some((flag) => flag.type === ModerationFlagEnum.STATIC_CONTENT)) {
            return ContentTypeEnum.AI_GENERATED
        }

        // Se tem flags de spam, é spam
        if (flags.some((flag) => flag.type === ModerationFlagEnum.SPAM_CONTENT)) {
            return ContentTypeEnum.SPAM
        }

        // Se tem flags de padrões suspeitos, é bot
        if (flags.some((flag) => flag.type === ModerationFlagEnum.SUSPICIOUS_PATTERNS)) {
            return ContentTypeEnum.BOT
        }

        // Se é conteúdo humano, retorna HUMAN
        if (isHumanContent) {
            return ContentTypeEnum.HUMAN
        }

        // Por padrão, é desconhecido
        return ContentTypeEnum.UNKNOWN
    }

    /**
     * Detecta o tipo de mídia baseado no buffer e metadados
     */
    private detectMediaType(
        contentData: Buffer,
        metadata?: Record<string, any>,
    ): "image" | "audio" | "video" | "unknown" {
        // Primeiro, verificar metadados
        if (metadata) {
            if (metadata.type) {
                if (metadata.type.includes("image")) return "image"
                if (metadata.type.includes("audio")) return "audio"
                if (metadata.type.includes("video")) return "video"
            }

            if (metadata.format) {
                const format = metadata.format.toLowerCase()
                if (["jpg", "jpeg", "png", "gif", "webp"].includes(format)) return "image"
                if (["mp3", "wav", "aac", "ogg"].includes(format)) return "audio"
                if (["mp4", "avi", "mov", "webm"].includes(format)) return "video"
            }
        }

        // Verificar headers do buffer
        if (contentData.length >= 4) {
            const header = contentData.slice(0, 4)

            // Headers de imagem
            if (
                header[0] === 0x89 &&
                header[1] === 0x50 &&
                header[2] === 0x4e &&
                header[3] === 0x47
            )
                return "image" // PNG
            if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return "image" // JPEG
            if (
                header[0] === 0x47 &&
                header[1] === 0x49 &&
                header[2] === 0x46 &&
                header[3] === 0x38
            )
                return "image" // GIF

            // Headers de áudio
            if (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) return "audio" // MP3 ID3
            if (header[0] === 0xff && header[1] === 0xfb) return "audio" // MP3
            if (
                header[0] === 0x52 &&
                header[1] === 0x49 &&
                header[2] === 0x46 &&
                header[3] === 0x46
            )
                return "audio" // WAV

            // Headers de vídeo
            if (
                header[0] === 0x00 &&
                header[1] === 0x00 &&
                header[2] === 0x00 &&
                header[3] === 0x20
            )
                return "video" // MP4
        }

        return "unknown"
    }
}
