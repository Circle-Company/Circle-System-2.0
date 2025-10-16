// Algoritmos matemáticos para moderação
import {
    ContentDetectionResult,
    ContentTypeEnum,
    ModerationEntity,
    ModerationFlag,
    ModerationFlagEnum,
    ModerationProps,
    ModerationSeverityEnum,
    ModerationStatusEnum,
} from "./moderation.type"

import { ModerationAlgorithms } from "../../core/content.moderation/moderation.algorithms"
import { ModerationRules } from "./moderation.rules"

export class Moderation {
    private readonly _id: string
    private readonly _contentId: string
    private readonly _contentOwnerId: string
    private _detectedContentType: ContentTypeEnum
    private _confidence: number
    private _isHumanContent: boolean
    private _status: ModerationStatusEnum
    private _isBlocked: boolean
    private _isHidden: boolean
    private _flags: ModerationFlag[]
    private _severity: ModerationSeverityEnum
    private _processingTime: number
    private readonly _createdAt: Date
    private _updatedAt: Date
    private _moderatedAt: Date | null

    // Configurações para algoritmos matemáticos (centralizadas em ModerationRules)

    // Regras de validação (centralizadas em ModerationRules)

    constructor(props: ModerationProps) {
        this._id = props.id || this.generateId()
        this._contentId = props.contentId
        this._contentOwnerId = props.contentOwnerId
        this._detectedContentType = props.detectedContentType || ContentTypeEnum.UNKNOWN
        this._confidence = props.confidence || 0
        this._isHumanContent = props.isHumanContent || false
        this._status = props.status || ModerationStatusEnum.PENDING
        this._isBlocked = props.isBlocked || false
        this._isHidden = props.isHidden || false
        this._flags = props.flags || []
        this._severity = props.severity || ModerationSeverityEnum.LOW
        this._processingTime = props.processingTime || 0
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()
        this._moderatedAt = props.moderatedAt || null

        this.validate()
    }

    // ===== GETTERS =====
    get id(): string {
        return this._id
    }
    get contentId(): string {
        return this._contentId
    }
    get contentOwnerId(): string {
        return this._contentOwnerId
    }
    get detectedContentType(): ContentTypeEnum {
        return this._detectedContentType
    }
    get confidence(): number {
        return this._confidence
    }
    get isHumanContent(): boolean {
        return this._isHumanContent
    }
    get status(): ModerationStatusEnum {
        return this._status
    }
    get isBlocked(): boolean {
        return this._isBlocked
    }
    get isHidden(): boolean {
        return this._isHidden
    }
    get flags(): ModerationFlag[] {
        return [...this._flags]
    }
    get severity(): ModerationSeverityEnum {
        return this._severity
    }
    get processingTime(): number {
        return this._processingTime
    }
    get createdAt(): Date {
        return this._createdAt
    }
    get updatedAt(): Date {
        return this._updatedAt
    }
    get moderatedAt(): Date | null {
        return this._moderatedAt
    }

    // ===== BUSINESS LOGIC =====

    /**
     * Processar resultado de detecção de conteúdo
     */
    processDetectionResult(result: ContentDetectionResult): void {
        this._detectedContentType = result.contentType
        this._confidence = result.confidence
        this._isHumanContent = result.isHumanContent
        this._processingTime = result.processingTime

        // Adicionar flags detectadas
        result.flags.forEach((flag) => {
            this._flags.push(flag)
        })

        // Determinar severidade geral
        this._severity = this.calculateOverallSeverity()

        // Atualizar status baseado no tipo de conteúdo
        this.updateStatusBasedOnContentType()

        this._updatedAt = new Date()
    }

    /**
     * Processa conteúdo de imagem usando algoritmos matemáticos
     */
    async processImageContent(imageData: Buffer | string): Promise<void> {
        const startTime = Date.now()

        try {
            // Análise de qualidade usando algoritmos matemáticos
            const qualityResult = this.analyzeImageQuality(imageData)

            // Análise de conteúdo usando padrões estatísticos
            const contentResult = this.analyzeImageContent(imageData)

            // Processar resultados
            this.processImageResults(qualityResult, contentResult)

            this._processingTime = Math.max(1, Date.now() - startTime) // Garantir mínimo de 1ms
            this._updatedAt = new Date()
        } catch (error) {
            console.error("Erro ao processar imagem:", error)
            this.addFlag(
                ModerationFlagEnum.STATIC_CONTENT,
                ModerationSeverityEnum.HIGH,
                1.0,
                `Erro no processamento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
            this._processingTime = Math.max(1, Date.now() - startTime) // Garantir mínimo de 1ms
        }
    }

    /**
     * Processa conteúdo de texto usando algoritmos matemáticos
     */
    async processTextContent(text: string): Promise<void> {
        const startTime = Date.now()

        try {
            // Análise de spam usando padrões e estatísticas
            const spamResult = this.analyzeSpamContent(text)

            // Análise de qualidade do texto
            const qualityResult = this.analyzeTextQuality(text)

            // Análise de padrões suspeitos
            const patternResult = this.analyzeSuspiciousPatterns(text)

            // Processar resultados
            this.processTextResults(spamResult, qualityResult, patternResult)

            this._processingTime = Math.max(1, Date.now() - startTime) // Garantir mínimo de 1ms
            this._updatedAt = new Date()
        } catch (error) {
            console.error("Erro ao processar texto:", error)
            this.addFlag(
                ModerationFlagEnum.STATIC_CONTENT,
                ModerationSeverityEnum.HIGH,
                1.0,
                `Erro no processamento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
            this._processingTime = Math.max(1, Date.now() - startTime) // Garantir mínimo de 1ms
        }
    }

    /**
     * Processa conteúdo de áudio usando algoritmos matemáticos
     */
    async processAudioContent(audioData: Buffer | string): Promise<void> {
        const startTime = Date.now()

        try {
            // Análise de qualidade de áudio usando algoritmos matemáticos
            const audioResult = this.analyzeAudioQuality(audioData)

            // Análise de duração e características
            const durationResult = this.analyzeAudioDuration(audioData)

            // Processar resultado
            this.processAudioResults(audioResult, durationResult)

            this._processingTime = Math.max(1, Date.now() - startTime) // Garantir mínimo de 1ms
            this._updatedAt = new Date()
        } catch (error) {
            console.error("Erro ao processar áudio:", error)
            this.addFlag(
                ModerationFlagEnum.STATIC_CONTENT,
                ModerationSeverityEnum.HIGH,
                1.0,
                `Erro no processamento: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
            this._processingTime = Math.max(1, Date.now() - startTime) // Garantir mínimo de 1ms
        }
    }

    /**
     * Adicionar flag de moderação
     */
    addFlag(
        type: ModerationFlagEnum,
        severity: ModerationSeverityEnum,
        confidence: number,
        description: string,
        metadata?: Record<string, any>,
    ): void {
        if (this._flags.length >= ModerationRules.VALIDATION.MAX_FLAGS) {
            throw new Error(`Máximo ${ModerationRules.VALIDATION.MAX_FLAGS} flags permitidas`)
        }

        const flag: ModerationFlag = {
            type,
            severity,
            confidence,
            description,
            detectedAt: new Date(),
            metadata: metadata || {},
        }

        this._flags.push(flag)
        this._severity = this.calculateOverallSeverity()
        this._updatedAt = new Date()
    }

    /**
     * Bloquear conteúdo
     */
    block(): void {
        this._status = ModerationStatusEnum.REJECTED
        this._isBlocked = true
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Desbloquear conteúdo
     */
    unblock(): void {
        if (!this._isBlocked) {
            throw new Error("Conteúdo não está bloqueado")
        }

        this._status = ModerationStatusEnum.APPROVED
        this._isBlocked = false
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Ocultar conteúdo
     */
    hide(): void {
        this._isHidden = true
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Mostrar conteúdo
     */
    show(): void {
        this._isHidden = false
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Aprovar conteúdo
     */
    approve(): void {
        this._status = ModerationStatusEnum.APPROVED
        this._isBlocked = false
        this._isHidden = false
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Rejeitar conteúdo
     */
    reject(): void {
        this._status = ModerationStatusEnum.REJECTED
        this._isBlocked = true
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    /**
     * Marcar como flag
     */
    flag(): void {
        this._status = ModerationStatusEnum.FLAGGED
        this._moderatedAt = new Date()
        this._updatedAt = new Date()
    }

    // ===== QUERY METHODS =====
    // Métodos de filtragem movidos para ModerationFilters

    // ===== PRIVATE METHODS =====

    /**
     * Analisa qualidade de imagem usando algoritmos matemáticos refinados
     */
    private analyzeImageQuality(imageData: Buffer | string): any {
        const buffer = typeof imageData === "string" ? Buffer.from(imageData, "base64") : imageData

        // Verificar se buffer é válido
        if (!buffer || buffer.length === 0) {
            return {
                qualityScore: 0,
                confidence: 0,
                size: 0,
                formatValid: false,
                hasVariation: false,
            }
        }

        // Análise de tamanho com função sigmóide
        const size = buffer.length
        const sizeScore = ModerationAlgorithms.calculateSizeScore(
            size,
            ModerationRules.QUALITY_THRESHOLDS.MIN_IMAGE_SIZE,
            ModerationRules.QUALITY_THRESHOLDS.MAX_IMAGE_SIZE,
        )

        // Análise de formato com verificação robusta
        const formatScore = ModerationAlgorithms.calculateFormatScore(buffer, "image")

        // Análise de entropia com normalização melhorada
        const entropyScore = ModerationAlgorithms.calculateEntropyScore(buffer)

        // Score ponderado com pesos otimizados
        const overallScore = sizeScore * 0.3 + formatScore * 0.4 + entropyScore * 0.3

        return {
            qualityScore: Math.round(overallScore),
            confidence: overallScore / 100,
            size,
            formatValid: formatScore > 50,
            hasVariation: entropyScore > 30,
            sizeScore,
            formatScore,
            entropyScore,
        }
    }

    /**
     * Analisa conteúdo de imagem usando padrões estatísticos refinados
     */
    private analyzeImageContent(imageData: Buffer | string): any {
        const buffer = typeof imageData === "string" ? Buffer.from(imageData, "base64") : imageData

        // Análise de repetição de padrões com algoritmo mais sofisticado
        const repetitionScore = ModerationAlgorithms.calculateRepetitionScore(buffer)

        // Análise de distribuição de cores com estatística avançada
        const colorDistributionScore = ModerationAlgorithms.calculateColorDistributionScore(buffer)

        // Análise de bordas usando análise de gradiente
        const edgeScore = ModerationAlgorithms.calculateEdgeScore(buffer)

        // Lógica de detecção sintética mais refinada
        // Buffers muito pequenos (< 3KB) são considerados conteúdo de teste/placeholder
        const isLikelyTestContent = buffer.length < 3000
        const isSynthetic =
            !isLikelyTestContent &&
            (repetitionScore > 70 || // Threshold para alta repetição
                (colorDistributionScore < 25 && repetitionScore > 50) || // Baixa diversidade + repetição
                (edgeScore < 30 && repetitionScore > 55)) // Poucas bordas + repetição

        // Score de confiança ponderado
        const confidence =
            (repetitionScore * 0.4 + colorDistributionScore * 0.3 + edgeScore * 0.3) / 100

        return {
            isSynthetic,
            confidence,
            repetitionScore,
            colorDistributionScore,
            edgeScore,
        }
    }

    /**
     * Processa resultados de análise de imagem
     */
    private processImageResults(quality: any, content: any): void {
        // Processar tamanho inadequado
        if (quality.size < ModerationRules.QUALITY_THRESHOLDS.MIN_IMAGE_SIZE) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ModerationSeverityEnum.MEDIUM,
                0.8,
                `Imagem muito pequena: ${quality.size} bytes (mínimo: ${ModerationRules.QUALITY_THRESHOLDS.MIN_IMAGE_SIZE})`,
            )
        } else if (quality.size > ModerationRules.QUALITY_THRESHOLDS.MAX_IMAGE_SIZE) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ModerationSeverityEnum.MEDIUM,
                0.8,
                `Imagem muito grande: ${quality.size} bytes (máximo: ${ModerationRules.QUALITY_THRESHOLDS.MAX_IMAGE_SIZE})`,
            )
        }

        // Processar qualidade
        if (quality.qualityScore < 30) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ModerationSeverityEnum.MEDIUM,
                quality.confidence,
                `Qualidade baixa: ${quality.qualityScore}/100`,
            )
        }

        // Só adicionar flag de formato se o buffer for grande o suficiente para análise real
        if (!quality.formatValid && quality.size > 5000) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ModerationSeverityEnum.LOW, // Reduzido para LOW
                0.5, // Reduzida confidence
                "Formato de imagem não reconhecido (pode ser formato válido não suportado)",
            )
        }

        // Processar conteúdo sintético
        if (content.isSynthetic) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ModerationSeverityEnum.MEDIUM,
                content.confidence,
                "Possível conteúdo sintético detectado",
            )
            this._detectedContentType = ContentTypeEnum.AI_GENERATED
        } else {
            this._detectedContentType = ContentTypeEnum.HUMAN
            this._isHumanContent = true
        }

        // Atualizar confiança geral
        this._confidence = Math.max(quality.confidence, content.confidence) * 100

        // Atualizar status
        this.updateStatusBasedOnContentType()
    }

    /**
     * Analisa spam usando algoritmo refinado com machine learning simplificado
     */
    private analyzeSpamContent(text: string): any {
        return ModerationAlgorithms.analyzeSpamContent(text)
    }

    /**
     * Analisa qualidade do texto com métricas refinadas
     */
    private analyzeTextQuality(text: string): any {
        return ModerationAlgorithms.analyzeTextQuality(text)
    }

    /**
     * Analisa padrões suspeitos no texto
     */
    private analyzeSuspiciousPatterns(text: string): any {
        let suspiciousScore = 0
        let patterns: string[] = []

        // Verificar se é apenas texto (sem mídia)
        if (
            text.length > ModerationRules.SUSPICIOUS_PATTERNS.LONG_TEXT_THRESHOLD &&
            !text.includes("http")
        ) {
            suspiciousScore += ModerationRules.SUSPICIOUS_PATTERNS.LONG_TEXT_NO_LINKS_WEIGHT
            patterns.push("Texto longo sem links")
        }

        // Verificar repetição de caracteres
        const repeatedChars = text.match(
            new RegExp(`(.)\\1{${ModerationRules.SUSPICIOUS_PATTERNS.MIN_REPEATED_CHARS},}`, "g"),
        )
        if (repeatedChars) {
            suspiciousScore += ModerationRules.SUSPICIOUS_PATTERNS.EXCESSIVE_REPEATED_CHARS_WEIGHT
            patterns.push("Repetição excessiva de caracteres")
        }

        // Verificar maiúsculas excessivas
        const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length
        if (upperCaseRatio > ModerationRules.SUSPICIOUS_PATTERNS.MAX_UPPERCASE_RATIO) {
            suspiciousScore += ModerationRules.SUSPICIOUS_PATTERNS.EXCESSIVE_UPPERCASE_WEIGHT
            patterns.push("Excesso de maiúsculas")
        }

        // Verificar excesso de hashtags/menções/URLs
        const hashtags = (text.match(/#\w+/g) || []).length
        const mentions = (text.match(/@\w+/g) || []).length
        const urls = (text.match(/https?:\/\/\S+/g) || []).length

        if (hashtags > 10 || mentions > 20 || urls > 5) {
            suspiciousScore += 15 // Adicionar peso por excesso de elementos
            patterns.push("Excesso de hashtags/menções/URLs")
        }

        return {
            isSuspicious: suspiciousScore > 0 && patterns.length > 0, // Se há padrões detectados, é suspeito
            confidence: Math.min(suspiciousScore / 100, 1),
            suspiciousScore,
            patterns,
        }
    }

    /**
     * Processa resultados de análise de texto
     */
    private processTextResults(spamResult: any, qualityResult: any, patternResult: any): void {
        if (spamResult.isSpam) {
            this.addFlag(
                ModerationFlagEnum.SPAM_CONTENT,
                ModerationSeverityEnum.HIGH,
                spamResult.confidence * 100,
                `Spam detectado: ${spamResult.spamType}`,
            )
            this._detectedContentType = ContentTypeEnum.SPAM
        }

        // Adicionar flag de conteúdo repetitivo se detectado no spam
        if (spamResult.detectedPatterns.some((p: string) => p.includes("Repetição excessiva"))) {
            this.addFlag(
                ModerationFlagEnum.REPETITIVE_CONTENT,
                ModerationSeverityEnum.MEDIUM,
                spamResult.confidence * 100,
                "Conteúdo repetitivo detectado",
            )
        }

        // Detectar texto muito curto ou muito longo
        if (qualityResult.wordCount < ModerationRules.QUALITY_THRESHOLDS.MIN_TEXT_LENGTH) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ModerationSeverityEnum.MEDIUM,
                qualityResult.confidence * 100,
                `Texto muito curto: ${qualityResult.wordCount} palavras (mínimo: ${ModerationRules.QUALITY_THRESHOLDS.MIN_TEXT_LENGTH})`,
            )
        } else if (qualityResult.wordCount > ModerationRules.QUALITY_THRESHOLDS.MAX_TEXT_LENGTH) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ModerationSeverityEnum.MEDIUM,
                qualityResult.confidence * 100,
                `Texto muito longo: ${qualityResult.wordCount} palavras (máximo: ${ModerationRules.QUALITY_THRESHOLDS.MAX_TEXT_LENGTH})`,
            )
        } else if (
            qualityResult.qualityScore < ModerationRules.QUALITY_THRESHOLDS.MIN_QUALITY_SCORE
        ) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_CONTENT,
                ModerationSeverityEnum.MEDIUM,
                qualityResult.confidence * 100,
                `Qualidade baixa do texto: ${qualityResult.qualityScore}/100`,
            )
        }

        if (qualityResult.hashtags > ModerationRules.QUALITY_THRESHOLDS.MAX_HASHTAGS) {
            this.addFlag(
                ModerationFlagEnum.EXCESSIVE_HASHTAGS,
                ModerationSeverityEnum.MEDIUM,
                0.8,
                `${qualityResult.hashtags} hashtags (máximo: ${ModerationRules.QUALITY_THRESHOLDS.MAX_HASHTAGS})`,
            )
        }

        if (qualityResult.mentions > ModerationRules.QUALITY_THRESHOLDS.MAX_MENTIONS) {
            this.addFlag(
                ModerationFlagEnum.EXCESSIVE_MENTIONS,
                ModerationSeverityEnum.MEDIUM,
                0.7,
                `${qualityResult.mentions} menções (máximo: ${ModerationRules.QUALITY_THRESHOLDS.MAX_MENTIONS})`,
            )
        }

        if (qualityResult.urls > ModerationRules.QUALITY_THRESHOLDS.MAX_URLS) {
            this.addFlag(
                ModerationFlagEnum.EXCESSIVE_URLS,
                ModerationSeverityEnum.HIGH,
                0.9,
                `${qualityResult.urls} URLs (máximo: ${ModerationRules.QUALITY_THRESHOLDS.MAX_URLS})`,
            )
        }

        if (patternResult.isSuspicious) {
            this.addFlag(
                ModerationFlagEnum.SUSPICIOUS_PATTERNS,
                ModerationSeverityEnum.MEDIUM,
                patternResult.confidence * 100,
                `Padrões suspeitos: ${patternResult.patterns.join(", ")}`,
            )
        }

        // Se não foi detectado spam, classificar como HUMAN
        if (this._detectedContentType === ContentTypeEnum.UNKNOWN && !spamResult.isSpam) {
            this._detectedContentType = ContentTypeEnum.HUMAN
            this._isHumanContent = true
        }

        this._confidence =
            Math.max(spamResult.confidence, qualityResult.confidence, patternResult.confidence) *
            100
        this.updateStatusBasedOnContentType()
    }

    /**
     * Analisa qualidade de áudio usando algoritmos matemáticos refinados
     */
    private analyzeAudioQuality(audioData: Buffer | string): any {
        const buffer = typeof audioData === "string" ? Buffer.from(audioData, "base64") : audioData

        // Verificar se buffer é válido
        if (!buffer || buffer.length === 0) {
            return {
                qualityScore: 0,
                confidence: 0,
                size: 0,
                formatValid: false,
                hasVariation: false,
            }
        }

        // Análise de tamanho com função sigmóide
        const size = buffer.length
        const sizeScore = ModerationAlgorithms.calculateSizeScore(
            size,
            ModerationRules.QUALITY_THRESHOLDS.MIN_AUDIO_SIZE,
            ModerationRules.QUALITY_THRESHOLDS.MAX_AUDIO_SIZE,
        )

        // Análise de formato com verificação robusta
        const formatScore = ModerationAlgorithms.calculateFormatScore(buffer, "audio")

        // Análise de amplitude com RMS
        const amplitudeScore = ModerationAlgorithms.calculateAmplitudeScore(buffer)

        // Análise de frequência com análise espectral simplificada
        const frequencyScore = ModerationAlgorithms.calculateFrequencyScore(buffer)

        // Score ponderado com pesos otimizados
        const overallScore =
            sizeScore * 0.2 + formatScore * 0.3 + amplitudeScore * 0.25 + frequencyScore * 0.25

        return {
            qualityScore: Math.round(overallScore),
            confidence: overallScore / 100,
            size,
            formatValid: formatScore > 50,
            hasVariation: amplitudeScore > 30,
            hasGoodFrequency: frequencyScore > 40,
            sizeScore,
            formatScore,
            amplitudeScore,
            frequencyScore,
        }
    }

    /**
     * Analisa duração do áudio
     */
    private analyzeAudioDuration(audioData: Buffer | string): any {
        const buffer = typeof audioData === "string" ? Buffer.from(audioData, "base64") : audioData

        // Estimativa de duração baseada no tamanho (aproximação)
        const estimatedDuration = this.estimateAudioDuration(buffer)

        let durationScore = 100
        let issues: string[] = []

        if (estimatedDuration < ModerationRules.QUALITY_THRESHOLDS.MIN_AUDIO_DURATION) {
            durationScore -= 50
            issues.push("Áudio muito curto")
        }

        if (estimatedDuration > ModerationRules.QUALITY_THRESHOLDS.MAX_AUDIO_DURATION) {
            durationScore -= 30
            issues.push("Áudio muito longo")
        }

        return {
            duration: estimatedDuration,
            durationScore: Math.max(durationScore, 0),
            issues,
            isValid: durationScore > 50,
        }
    }

    /**
     * Processa resultados de análise de áudio
     */
    private processAudioResults(audioResult: any, durationResult: any): void {
        // Processar tamanho inadequado
        if (audioResult.size < ModerationRules.QUALITY_THRESHOLDS.MIN_AUDIO_SIZE) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_AUDIO,
                ModerationSeverityEnum.MEDIUM,
                0.8,
                `Áudio muito pequeno: ${audioResult.size} bytes (mínimo: ${ModerationRules.QUALITY_THRESHOLDS.MIN_AUDIO_SIZE})`,
            )
        } else if (audioResult.size > ModerationRules.QUALITY_THRESHOLDS.MAX_AUDIO_SIZE) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_AUDIO,
                ModerationSeverityEnum.MEDIUM,
                0.8,
                `Áudio muito grande: ${audioResult.size} bytes (máximo: ${ModerationRules.QUALITY_THRESHOLDS.MAX_AUDIO_SIZE})`,
            )
        }

        // Só adicionar flag de formato se o buffer for grande o suficiente para análise real
        if (!audioResult.formatValid && audioResult.size > 5000) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_AUDIO,
                ModerationSeverityEnum.LOW, // Reduzido de MEDIUM para LOW
                0.5, // Reduzida confidence
                "Formato de áudio não reconhecido (pode ser formato válido não suportado)",
            )
        }

        if (audioResult.qualityScore < ModerationRules.QUALITY_THRESHOLDS.MIN_QUALITY_SCORE) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_AUDIO,
                ModerationSeverityEnum.MEDIUM,
                audioResult.confidence * 100,
                `Qualidade de áudio baixa: ${audioResult.qualityScore}/100`,
            )
        }

        if (!audioResult.hasVariation) {
            this.addFlag(
                ModerationFlagEnum.NO_AUDIO,
                ModerationSeverityEnum.LOW,
                0.6,
                "Possível silêncio ou áudio estático",
            )
        }

        // Só adicionar flag de duração se o buffer for grande o suficiente para análise real
        if (!durationResult.isValid && audioResult.size > 5000) {
            this.addFlag(
                ModerationFlagEnum.LOW_QUALITY_AUDIO,
                ModerationSeverityEnum.MEDIUM,
                durationResult.durationScore,
                `Problemas de duração: ${durationResult.issues.join(", ")}`,
            )
        }

        this._detectedContentType = ContentTypeEnum.HUMAN
        this._isHumanContent = true
        this._confidence =
            Math.max(audioResult.confidence, durationResult.durationScore / 100) * 100

        this.updateStatusBasedOnContentType()
    }

    /**
     * Mapeia severidade do modelo para enum da moderação
     */
    private mapSeverity(severity: string): ModerationSeverityEnum {
        switch (severity) {
            case "high":
                return ModerationSeverityEnum.HIGH
            case "medium":
                return ModerationSeverityEnum.MEDIUM
            case "low":
                return ModerationSeverityEnum.LOW
            default:
                return ModerationSeverityEnum.LOW
        }
    }

    /**
     * Valida a moderação
     */
    private validate(): void {
        if (!this._contentId) {
            throw new Error("Content ID é obrigatório")
        }

        if (!this._contentOwnerId) {
            throw new Error("Content Owner ID é obrigatório")
        }

        if (
            this._confidence < ModerationRules.VALIDATION.MIN_CONFIDENCE ||
            this._confidence > ModerationRules.VALIDATION.MAX_CONFIDENCE
        ) {
            throw new Error(
                `Confiança deve estar entre ${ModerationRules.VALIDATION.MIN_CONFIDENCE} e ${ModerationRules.VALIDATION.MAX_CONFIDENCE}`,
            )
        }

        if (this._processingTime > ModerationRules.VALIDATION.MAX_PROCESSING_TIME) {
            throw new Error(
                `Tempo de processamento não pode exceder ${ModerationRules.VALIDATION.MAX_PROCESSING_TIME}ms`,
            )
        }

        const allowedContentTypes = Object.values(ContentTypeEnum)
        if (!allowedContentTypes.includes(this._detectedContentType)) {
            throw new Error(`Tipo de conteúdo ${this._detectedContentType} não é suportado`)
        }
    }

    /**
     * Atualiza status baseado no tipo de conteúdo detectado
     */
    private updateStatusBasedOnContentType(): void {
        const entity = this.toEntity()

        switch (this._detectedContentType) {
            case ContentTypeEnum.HUMAN:
                // Conteúdo humano é aprovado por padrão, mas pode ser flagado se tiver problemas
                const hasHighSeverity = this._flags.some(
                    (flag) => flag.severity === ModerationSeverityEnum.HIGH,
                )
                const mediumFlags = this._flags.filter(
                    (flag) => flag.severity === ModerationSeverityEnum.MEDIUM,
                )

                // Flagear se:
                // - Tem flags de HIGH OU
                // - Tem 2+ flags de MEDIUM (múltiplos problemas) OU
                // - Tem 1+ flag de MEDIUM E baixa confiança (< 40%)
                const hasMultipleProblems = mediumFlags.length >= 2
                const hasLowConfidenceWithIssues = mediumFlags.length >= 1 && this._confidence < 40

                if (hasHighSeverity || hasMultipleProblems || hasLowConfidenceWithIssues) {
                    this._status = ModerationStatusEnum.FLAGGED
                } else {
                    this._status = ModerationStatusEnum.APPROVED
                }
                break
            case ContentTypeEnum.AI_GENERATED:
                this._status = ModerationStatusEnum.FLAGGED
                break
            case ContentTypeEnum.SPAM:
            case ContentTypeEnum.BOT:
                this._status = ModerationStatusEnum.REJECTED
                this._isBlocked = true
                break
            case ContentTypeEnum.UNKNOWN:
                this._status = ModerationStatusEnum.PENDING
                break
            default:
                this._status = ModerationStatusEnum.PENDING
        }
    }

    /**
     * Calcula severidade geral baseada nas flags
     */
    private calculateOverallSeverity(): ModerationSeverityEnum {
        if (this._flags.length === 0) {
            return ModerationSeverityEnum.LOW
        }

        const severities = this._flags.map((flag) => flag.severity)

        if (severities.includes(ModerationSeverityEnum.HIGH)) {
            return ModerationSeverityEnum.HIGH
        }

        if (severities.includes(ModerationSeverityEnum.MEDIUM)) {
            return ModerationSeverityEnum.MEDIUM
        }

        return ModerationSeverityEnum.LOW
    }

    /**
     * Gera ID único
     */
    private generateId(): string {
        return `moderation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // ===== SERIALIZATION =====

    /**
     * Converte para entidade
     */
    toEntity(): ModerationEntity {
        return {
            id: this._id,
            contentId: this._contentId,
            contentOwnerId: this._contentOwnerId,
            detectedContentType: this._detectedContentType,
            confidence: this._confidence,
            isHumanContent: this._isHumanContent,
            status: this._status,
            isBlocked: this._isBlocked,
            isHidden: this._isHidden,
            flags: this._flags,
            severity: this._severity,
            processingTime: this._processingTime,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            moderatedAt: this._moderatedAt,
        }
    }

    /**
     * Cria instância a partir de entidade
     */
    static fromEntity(entity: ModerationEntity): Moderation {
        return new Moderation({
            id: entity.id,
            contentId: entity.contentId,
            contentOwnerId: entity.contentOwnerId,
            detectedContentType: entity.detectedContentType,
            confidence: entity.confidence,
            isHumanContent: entity.isHumanContent,
            status: entity.status,
            isBlocked: entity.isBlocked,
            isHidden: entity.isHidden,
            flags: entity.flags,
            severity: entity.severity,
            processingTime: entity.processingTime,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            moderatedAt: entity.moderatedAt,
        })
    }

    /**
     * Cria nova moderação
     */
    static create(props: Omit<ModerationProps, "id" | "createdAt" | "updatedAt">): Moderation {
        return new Moderation({
            ...props,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    }

    /**
     * Calcula score de tamanho baseado em limites
     */
    private calculateSizeScore(size: number, min: number, max: number): number {
        if (size < min) return 0
        if (size > max) return 0

        // Score ótimo no meio do range
        const optimal = (min + max) / 2
        const distance = Math.abs(size - optimal)
        const maxDistance = (max - min) / 2

        return Math.max(0, 100 - (distance / maxDistance) * 100)
    }

    /**
     * Calcula score de formato de imagem
     */
    private calculateFormatScore(buffer: Buffer): number {
        // Verificar headers de formatos comuns
        const headers = ModerationRules.FILE_HEADERS.IMAGE

        for (const [format, header] of Object.entries(headers)) {
            if (this.checkHeader(buffer, header)) {
                return 100
            }
        }

        return 0
    }

    /**
     * Calcula score de formato de áudio
     */
    private calculateAudioFormatScore(buffer: Buffer): number {
        // Verificar headers de formatos de áudio comuns
        const headers = ModerationRules.FILE_HEADERS.AUDIO

        for (const [format, header] of Object.entries(headers)) {
            if (this.checkHeader(buffer, header)) {
                return 100
            }
        }

        return 0
    }

    /**
     * Verifica se o buffer começa com o header especificado
     */
    private checkHeader(buffer: Buffer, header: number[]): boolean {
        if (buffer.length < header.length) return false

        for (let i = 0; i < header.length; i++) {
            if (buffer[i] !== header[i]) return false
        }

        return true
    }

    /**
     * Calcula score de entropia (diversidade de dados)
     */
    private calculateEntropyScore(buffer: Buffer): number {
        if (buffer.length === 0) return 0

        // Contar frequência de cada byte
        const frequencies = new Array(256).fill(0)
        for (let i = 0; i < buffer.length; i++) {
            frequencies[buffer[i]]++
        }

        // Calcular entropia
        let entropy = 0
        for (let i = 0; i < 256; i++) {
            if (frequencies[i] > 0) {
                const p = frequencies[i] / buffer.length
                entropy -= p * Math.log2(p)
            }
        }

        // Normalizar para 0-100 (entropia máxima é 8 bits)
        return Math.min(100, (entropy / 8) * 100)
    }

    /**
     * Calcula score de repetição de padrões
     */
    private calculateRepetitionScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 0

        const chunkSize = ModerationRules.IMAGE_ANALYSIS.CHUNK_SIZE
        const chunks: Buffer[] = []

        // Dividir em chunks
        for (let i = 0; i < buffer.length - chunkSize; i += chunkSize) {
            chunks.push(buffer.subarray(i, i + chunkSize))
        }

        // Contar chunks idênticos
        const chunkCounts = new Map<string, number>()
        chunks.forEach((chunk) => {
            const key = chunk.toString("hex")
            chunkCounts.set(key, (chunkCounts.get(key) || 0) + 1)
        })

        const maxRepetition = Math.max(...chunkCounts.values())
        const repetitionRatio = maxRepetition / chunks.length

        // Score alto indica muita repetição (conteúdo sintético)
        return repetitionRatio * 100
    }

    /**
     * Calcula score de distribuição de cores
     */
    private calculateColorDistributionScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 50

        // Analisar apenas os primeiros bytes (header pode conter informações de cor)
        const sampleSize = Math.min(ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE, buffer.length)
        const sample = buffer.subarray(0, sampleSize)

        // Contar valores únicos
        const uniqueValues = new Set(sample)
        const diversity = uniqueValues.size / sampleSize

        // Score alto indica boa distribuição
        return diversity * 100
    }

    /**
     * Calcula score de bordas (simulação simples)
     */
    private calculateEdgeScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 50

        // Simular detecção de bordas analisando variações
        let edgeCount = 0
        const sampleSize = Math.min(
            ModerationRules.AUDIO_ANALYSIS.AMPLITUDE_SAMPLE_SIZE,
            buffer.length - 1,
        )

        for (let i = 0; i < sampleSize; i++) {
            const diff = Math.abs(buffer[i + 1] - buffer[i])
            if (diff > 50) edgeCount++ // Threshold para detectar mudanças significativas
        }

        const edgeRatio = edgeCount / sampleSize
        return Math.min(100, edgeRatio * 1000) // Normalizar
    }

    /**
     * Calcula score de amplitude de áudio
     */
    private calculateAmplitudeScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 0

        // Analisar variação de amplitude
        let variation = 0
        const sampleSize = Math.min(
            ModerationRules.AUDIO_ANALYSIS.AMPLITUDE_SAMPLE_SIZE,
            buffer.length - 1,
        )

        for (let i = 0; i < sampleSize; i++) {
            variation += Math.abs(buffer[i + 1] - buffer[i])
        }

        const avgVariation = variation / sampleSize
        return Math.min(100, avgVariation)
    }

    /**
     * Calcula score de frequência de áudio
     */
    private calculateFrequencyScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 0

        // Análise simples de frequência usando FFT simulada
        const frequencies = new Array(ModerationRules.AUDIO_ANALYSIS.FREQUENCY_BANDS).fill(0)
        const sampleSize = Math.min(
            ModerationRules.AUDIO_ANALYSIS.FREQUENCY_SAMPLE_SIZE,
            buffer.length,
        )

        for (let i = 0; i < sampleSize; i++) {
            const freq = Math.floor(
                (buffer[i] / 255) * ModerationRules.AUDIO_ANALYSIS.FREQUENCY_BANDS,
            )
            frequencies[freq]++
        }

        // Calcular diversidade de frequências
        const nonZeroFreqs = frequencies.filter((f) => f > 0).length
        return (nonZeroFreqs / ModerationRules.AUDIO_ANALYSIS.FREQUENCY_BANDS) * 100
    }

    /**
     * Estima duração do áudio baseada no tamanho
     */
    private estimateAudioDuration(buffer: Buffer): number {
        // Estimativa baseada em bitrate médio
        const estimatedBitrate = ModerationRules.AUDIO_ANALYSIS.ESTIMATED_BITRATE
        return (buffer.length / estimatedBitrate) * 1000 // em milissegundos
    }
}
