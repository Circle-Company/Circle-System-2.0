import {
    ContentTypeEnum,
    ModerationFlagEnum,
    ModerationSeverityEnum,
} from "../../../domain/moderation/moderation.type"
import {
    AIDetectionModel,
    AIDetectionResult,
    ContentDetectionRequest,
    ContentDetectionResult,
    FaceDetectionModel,
    FaceDetectionResult,
    MemeDetectionResult,
    ModerationEngineConfig,
    ModerationFlag,
    QualityDetectionModel,
    SpamDetectionModel,
    SpamDetectionResult,
} from "../types"

export class ContentDetector {
    constructor(
        private readonly faceDetectionModel: FaceDetectionModel,
        private readonly aiDetectionModel: AIDetectionModel,
        private readonly qualityDetectionModel: QualityDetectionModel,
        private readonly spamDetectionModel: SpamDetectionModel,
        private readonly config: ModerationEngineConfig,
    ) {}

    /**
     * Detecta o tipo de conteúdo e aplica todas as regras de detecção
     */
    async detectContent(request: ContentDetectionRequest): Promise<ContentDetectionResult> {
        const startTime = Date.now()
        const flags: ModerationFlag[] = []
        let contentType = ContentTypeEnum.UNKNOWN
        let isHumanContent = false
        let confidence = 0
        let reasoning = ""

        try {
            // 1. Detecção de rosto (prioridade alta para conteúdo humano)
            if (this.config.detection.faceDetection.enabled) {
                const faceResult = await this.detectFaces(request.contentData!)
                if (faceResult.facesDetected > 0) {
                    contentType = ContentTypeEnum.HUMAN
                    isHumanContent = true
                    confidence = Math.max(confidence, faceResult.confidence)
                    reasoning += `Rosto detectado (${faceResult.facesDetected} faces). `
                } else {
                    flags.push({
                        type: ModerationFlagEnum.NO_FACE_DETECTED,
                        severity: ModerationSeverityEnum.MEDIUM,
                        confidence: 90,
                        description: "Nenhum rosto detectado no conteúdo",
                        detectedAt: new Date(),
                        metadata: { facesDetected: 0 },
                    })
                }
            }

            // 2. Detecção de IA (se não for conteúdo humano)
            if (this.config.detection.aiDetection.enabled && !isHumanContent) {
                const aiResult = await this.detectAI(request.contentData!)
                if (aiResult.isAIGenerated) {
                    contentType = ContentTypeEnum.AI_GENERATED
                    confidence = Math.max(confidence, aiResult.confidence)
                    reasoning += `Conteúdo gerado por IA detectado. `

                    flags.push({
                        type: ModerationFlagEnum.AI_CONTENT,
                        severity: ModerationSeverityEnum.HIGH,
                        confidence: aiResult.confidence,
                        description: aiResult.reasoning,
                        detectedAt: new Date(),
                        metadata: { model: aiResult.model },
                    })
                }
            }

            // 3. Detecção de qualidade (para todos os tipos)
            if (this.config.detection.qualityDetection.enabled) {
                const qualityFlags = await this.detectQuality(request.contentData!)
                flags.push(...qualityFlags)
            }

            // 4. Detecção de spam/meme
            if (this.config.detection.spamDetection.enabled) {
                const spamResult = await this.detectSpam(request.contentData!, request.metadata)
                if (spamResult.isSpam) {
                    contentType = ContentTypeEnum.SPAM
                    confidence = Math.max(confidence, spamResult.confidence)
                    reasoning += `Conteúdo spam detectado. `

                    flags.push({
                        type: ModerationFlagEnum.SPAM_CONTENT,
                        severity: ModerationSeverityEnum.HIGH,
                        confidence: spamResult.confidence,
                        description: spamResult.reasoning,
                        detectedAt: new Date(),
                        metadata: { spamType: spamResult.spamType },
                    })
                }

                const memeResult = await this.detectMeme(request.contentData!)
                if (memeResult.isMeme) {
                    contentType = ContentTypeEnum.MEME
                    confidence = Math.max(confidence, memeResult.confidence)
                    reasoning += `Conteúdo meme detectado. `

                    flags.push({
                        type: ModerationFlagEnum.MEME_CONTENT,
                        severity: ModerationSeverityEnum.MEDIUM,
                        confidence: memeResult.confidence,
                        description: memeResult.reasoning,
                        detectedAt: new Date(),
                        metadata: { memeType: memeResult.memeType },
                    })
                }
            }

            // 5. Determinar tipo final baseado nas detecções
            if (contentType === ContentTypeEnum.UNKNOWN) {
                contentType = this.determineContentType(flags, isHumanContent)
            }

            const processingTime = Date.now() - startTime

            return {
                contentType,
                confidence,
                isHumanContent,
                flags,
                model: "moderation-engine-v1",
                version: "1.0.0",
                processingTime,
                reasoning: reasoning.trim(),
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
                        type: ModerationFlagEnum.AI_CONTENT, // Flag genérica para erro
                        severity: ModerationSeverityEnum.HIGH,
                        confidence: 100,
                        description: `Erro na detecção: ${
                            error instanceof Error ? error.message : "Erro desconhecido"
                        }`,
                        detectedAt: new Date(),
                        metadata: { error: true },
                    },
                ],
                model: "moderation-engine-v1",
                version: "1.0.0",
                processingTime,
                reasoning: "Erro durante a detecção de conteúdo",
                detectedAt: new Date(),
            }
        }
    }

    /**
     * Detecta rostos no conteúdo
     */
    private async detectFaces(contentData: Buffer): Promise<FaceDetectionResult> {
        try {
            return await this.faceDetectionModel.detectFaces(contentData)
        } catch (error) {
            return {
                facesDetected: 0,
                faceQuality: "none",
                confidence: 0,
            }
        }
    }

    /**
     * Detecta conteúdo gerado por IA
     */
    private async detectAI(contentData: Buffer): Promise<AIDetectionResult> {
        try {
            return await this.aiDetectionModel.detectAI(contentData)
        } catch (error) {
            return {
                isAIGenerated: false,
                confidence: 0,
                reasoning: "Erro na detecção de IA",
            }
        }
    }

    /**
     * Detecta qualidade do conteúdo
     */
    private async detectQuality(contentData: Buffer): Promise<ModerationFlag[]> {
        const flags: ModerationFlag[] = []

        try {
            // Detectar qualidade de vídeo
            const videoResult = await this.qualityDetectionModel.detectVideoQuality(contentData)
            if (videoResult.quality === "poor" || videoResult.quality === "very_poor") {
                flags.push({
                    type: ModerationFlagEnum.LOW_QUALITY_VIDEO,
                    severity: ModerationSeverityEnum.MEDIUM,
                    confidence: videoResult.confidence,
                    description: `Qualidade de vídeo ruim: ${videoResult.issues.join(", ")}`,
                    detectedAt: new Date(),
                    metadata: {
                        quality: videoResult.quality,
                        issues: videoResult.issues,
                        resolution: videoResult.resolution,
                        bitrate: videoResult.bitrate,
                    },
                })
            }

            // Detectar qualidade de áudio
            const audioResult = await this.qualityDetectionModel.detectAudioQuality(contentData)
            if (audioResult.quality === "poor") {
                flags.push({
                    type: ModerationFlagEnum.LOW_QUALITY_AUDIO,
                    severity: ModerationSeverityEnum.LOW,
                    confidence: audioResult.confidence,
                    description: `Qualidade de áudio ruim: ${audioResult.issues.join(", ")}`,
                    detectedAt: new Date(),
                    metadata: {
                        quality: audioResult.quality,
                        issues: audioResult.issues,
                        hasAudio: audioResult.hasAudio,
                        sampleRate: audioResult.sampleRate,
                    },
                })
            }

            if (!audioResult.hasAudio) {
                flags.push({
                    type: ModerationFlagEnum.NO_AUDIO,
                    severity: ModerationSeverityEnum.LOW,
                    confidence: 100,
                    description: "Conteúdo sem áudio detectado",
                    detectedAt: new Date(),
                    metadata: { hasAudio: false },
                })
            }

            // Detectar conteúdo estático
            if (this.isStaticContent(contentData)) {
                flags.push({
                    type: ModerationFlagEnum.STATIC_CONTENT,
                    severity: ModerationSeverityEnum.LOW,
                    confidence: 80,
                    description: "Conteúdo estático detectado",
                    detectedAt: new Date(),
                    metadata: { isStatic: true },
                })
            }
        } catch (error) {
            // Em caso de erro, adicionar flag de qualidade ruim
            flags.push({
                type: ModerationFlagEnum.LOW_QUALITY_VIDEO,
                severity: ModerationSeverityEnum.MEDIUM,
                confidence: 100,
                description: "Erro na detecção de qualidade",
                detectedAt: new Date(),
                metadata: { error: true },
            })
        }

        return flags
    }

    /**
     * Detecta conteúdo spam
     */
    private async detectSpam(
        contentData: Buffer,
        metadata?: Record<string, any>,
    ): Promise<SpamDetectionResult> {
        try {
            return await this.spamDetectionModel.detectSpam(contentData, metadata)
        } catch (error) {
            return {
                isSpam: false,
                confidence: 0,
                reasoning: "Erro na detecção de spam",
            }
        }
    }

    /**
     * Detecta conteúdo meme
     */
    private async detectMeme(contentData: Buffer): Promise<MemeDetectionResult> {
        try {
            return await this.spamDetectionModel.detectMeme(contentData)
        } catch (error) {
            return {
                isMeme: false,
                confidence: 0,
                reasoning: "Erro na detecção de meme",
            }
        }
    }

    /**
     * Determina o tipo de conteúdo baseado nas flags e detecções
     */
    private determineContentType(
        flags: ModerationFlag[],
        isHumanContent: boolean,
    ): ContentTypeEnum {
        // Se tem flags de IA, é conteúdo sintético
        if (flags.some((flag) => flag.type === ModerationFlagEnum.AI_CONTENT)) {
            return ContentTypeEnum.AI_GENERATED
        }

        // Se tem flags de spam, é spam
        if (flags.some((flag) => flag.type === ModerationFlagEnum.SPAM_CONTENT)) {
            return ContentTypeEnum.SPAM
        }

        // Se tem flags de meme, é meme
        if (flags.some((flag) => flag.type === ModerationFlagEnum.MEME_CONTENT)) {
            return ContentTypeEnum.MEME
        }

        // Se tem flags de bot, é bot
        if (flags.some((flag) => flag.type === ModerationFlagEnum.BOT_CONTENT)) {
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
     * Verifica se o conteúdo é estático
     */
    private isStaticContent(contentData: Buffer): boolean {
        // Implementação simples para detectar conteúdo estático
        // Em uma implementação real, isso seria mais sofisticado
        const minSize = 1024 // 1KB
        const maxSize = 10 * 1024 * 1024 // 10MB

        if (contentData.length < minSize || contentData.length > maxSize) {
            return true
        }

        // Verificar se é uma imagem estática (PNG, JPEG, etc.)
        const header = contentData.slice(0, 4)
        const imageHeaders = [
            Buffer.from([0x89, 0x50, 0x4e, 0x47]), // PNG
            Buffer.from([0xff, 0xd8, 0xff, 0xe0]), // JPEG
            Buffer.from([0x47, 0x49, 0x46, 0x38]), // GIF
        ]

        return imageHeaders.some((imgHeader) => header.equals(imgHeader))
    }
}
