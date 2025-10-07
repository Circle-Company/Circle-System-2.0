/**
 * Algoritmos matemáticos refinados para moderação de conteúdo
 * Este arquivo contém implementações otimizadas e mais precisas dos algoritmos
 */

import { ModerationRules } from "@/domain/moderation/moderation.rules"

export class ModerationAlgorithms {
    /**
     * Calcula score de tamanho com função sigmóide para melhor distribuição
     */
    static calculateSizeScore(size: number, min: number, max: number): number {
        if (size < min || size > max) return 0

        // Usar função sigmóide para distribuição mais suave
        const normalizedSize = (size - min) / (max - min)
        const sigmoid = 1 / (1 + Math.exp(-10 * (normalizedSize - 0.5)))

        return Math.round(sigmoid * 100)
    }

    /**
     * Calcula score de formato com verificação mais robusta de headers
     */
    static calculateFormatScore(buffer: Buffer, type: "image" | "audio"): number {
        if (buffer.length < 4) return 0

        const headers =
            type === "image"
                ? ModerationRules.FILE_HEADERS.IMAGE
                : ModerationRules.FILE_HEADERS.AUDIO

        for (const [format, header] of Object.entries(headers)) {
            if (this.checkHeader(buffer, header)) {
                // Bonus para formatos mais comuns
                const formatBonus = this.getFormatBonus(format)
                return Math.min(100, 100 + formatBonus)
            }
        }

        return 0
    }

    /**
     * Calcula entropia de Shannon com normalização melhorada
     */
    static calculateEntropyScore(buffer: Buffer): number {
        if (buffer.length === 0) return 0

        // Contar frequência de cada byte
        const frequencies = new Array(256).fill(0)
        for (let i = 0; i < buffer.length; i++) {
            frequencies[buffer[i]]++
        }

        // Calcular entropia de Shannon
        let entropy = 0
        for (let i = 0; i < 256; i++) {
            if (frequencies[i] > 0) {
                const p = frequencies[i] / buffer.length
                entropy -= p * Math.log2(p)
            }
        }

        // Normalizar para 0-100 com curva exponencial
        const normalizedEntropy = Math.pow(entropy / 8, 1.5) * 100
        return Math.min(100, normalizedEntropy)
    }

    /**
     * Calcula score de repetição de padrões com análise de chunks mais sofisticada
     */
    static calculateRepetitionScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 0

        const chunkSize = Math.min(
            ModerationRules.IMAGE_ANALYSIS.CHUNK_SIZE,
            Math.floor(buffer.length / 100),
        )
        const chunks: string[] = []
        const hashMap = new Map<string, number>()

        // Dividir em chunks e calcular hashes
        for (let i = 0; i <= buffer.length - chunkSize; i += Math.floor(chunkSize / 2)) {
            const chunk = buffer.subarray(i, i + chunkSize)
            const hash = this.simpleHash(chunk.toString("hex"))
            chunks.push(hash)
            hashMap.set(hash, (hashMap.get(hash) || 0) + 1)
        }

        if (chunks.length === 0) return 0

        // Calcular score de repetição
        let maxRepetition = 0
        let totalChunks = chunks.length

        for (const count of hashMap.values()) {
            maxRepetition = Math.max(maxRepetition, count)
        }

        const repetitionRatio = maxRepetition / totalChunks

        // Usar função exponencial para penalizar alta repetição
        return Math.round(Math.pow(repetitionRatio, 2) * 100)
    }

    /**
     * Calcula score de distribuição de cores com análise estatística
     */
    static calculateColorDistributionScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 50

        const sampleSize = Math.min(ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE, buffer.length)
        const sample = buffer.subarray(0, sampleSize)

        // Analisar distribuição de valores
        const valueCounts = new Array(256).fill(0)
        for (let i = 0; i < sample.length; i++) {
            valueCounts[sample[i]]++
        }

        // Calcular coeficiente de variação
        const mean = sample.length / 256
        let variance = 0
        for (let i = 0; i < 256; i++) {
            variance += Math.pow(valueCounts[i] - mean, 2)
        }
        variance /= 256

        const stdDev = Math.sqrt(variance)
        const coefficientOfVariation = stdDev / mean

        // Score baseado na variação (mais variação = melhor distribuição)
        return Math.min(100, Math.round(coefficientOfVariation * 100))
    }

    /**
     * Calcula score de bordas usando análise de gradiente
     */
    static calculateEdgeScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 50

        let edgeCount = 0
        const sampleSize = Math.min(
            ModerationRules.AUDIO_ANALYSIS.AMPLITUDE_SAMPLE_SIZE,
            buffer.length - 1,
        )

        // Analisar gradientes locais
        for (let i = 0; i < sampleSize; i++) {
            const gradient = Math.abs(buffer[i + 1] - buffer[i])
            if (gradient > 30) {
                // Threshold para detectar mudanças significativas
                edgeCount++
            }
        }

        const edgeRatio = edgeCount / sampleSize

        // Normalizar com função logarítmica
        return Math.min(100, Math.round(Math.log(1 + edgeRatio * 100) * 20))
    }

    /**
     * Calcula score de amplitude de áudio com análise de RMS
     */
    static calculateAmplitudeScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 0

        const sampleSize = Math.min(
            ModerationRules.AUDIO_ANALYSIS.AMPLITUDE_SAMPLE_SIZE,
            buffer.length,
        )
        const sample = buffer.subarray(0, sampleSize)

        // Calcular RMS (Root Mean Square)
        let sumSquares = 0
        for (let i = 0; i < sample.length; i++) {
            const amplitude = (sample[i] - 128) / 128 // Normalizar para -1 a 1
            sumSquares += amplitude * amplitude
        }

        const rms = Math.sqrt(sumSquares / sample.length)

        // Converter RMS para score (0-100)
        return Math.min(100, Math.round(rms * 200))
    }

    /**
     * Calcula score de frequência com análise espectral simplificada
     */
    static calculateFrequencyScore(buffer: Buffer): number {
        if (buffer.length < ModerationRules.IMAGE_ANALYSIS.MIN_BUFFER_SIZE) return 0

        const sampleSize = Math.min(
            ModerationRules.AUDIO_ANALYSIS.FREQUENCY_SAMPLE_SIZE,
            buffer.length,
        )
        const sample = buffer.subarray(0, sampleSize)

        // Análise de frequência usando histograma de diferenças
        const frequencies = new Array(ModerationRules.AUDIO_ANALYSIS.FREQUENCY_BANDS).fill(0)

        for (let i = 0; i < sample.length - 1; i++) {
            const diff = Math.abs(sample[i + 1] - sample[i])
            const freqBand = Math.floor(
                (diff / 255) * ModerationRules.AUDIO_ANALYSIS.FREQUENCY_BANDS,
            )
            frequencies[freqBand]++
        }

        // Calcular diversidade de frequências
        const nonZeroFreqs = frequencies.filter((f) => f > 0).length
        const diversity = nonZeroFreqs / ModerationRules.AUDIO_ANALYSIS.FREQUENCY_BANDS

        // Usar função quadrática para dar mais peso à diversidade
        return Math.round(Math.pow(diversity, 1.5) * 100)
    }

    /**
     * Analisa spam com algoritmo de machine learning simplificado
     */
    static analyzeSpamContent(text: string): {
        isSpam: boolean
        confidence: number
        spamScore: number
        detectedPatterns: string[]
        spamType: "low" | "medium" | "high"
    } {
        let spamScore = 0
        let detectedPatterns: string[] = []

        // 1. Verificar padrões de spam com pesos dinâmicos
        ModerationRules.SPAM_PATTERNS.forEach((pattern, index) => {
            const matches = text.match(pattern)
            if (matches) {
                // Peso base por match encontrado, sem penalizar muito por tamanho do texto
                const baseWeight = ModerationRules.SPAM_DETECTION.PATTERN_MATCH_WEIGHT
                const matchRatio = Math.min(1, matches.length / 5) // Normalizar até 5 matches
                const weight = baseWeight * (0.5 + matchRatio * 0.5) // Score mínimo de 50% do peso base
                spamScore += weight
                detectedPatterns.push(`Padrão ${index + 1}: ${matches.join(", ")}`)
            }
        })

        // 2. Análise de repetição com algoritmo mais sofisticado
        const words = text
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 2)
        if (words.length > 0) {
            const wordCounts = new Map<string, number>()
            words.forEach((word) => {
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
            })

            const maxRepetition = Math.max(...wordCounts.values())
            const repetitionRatio = maxRepetition / words.length

            if (repetitionRatio > ModerationRules.SPAM_DETECTION.MAX_REPETITION_RATIO) {
                spamScore +=
                    ModerationRules.SPAM_DETECTION.EXCESSIVE_REPETITION_WEIGHT * repetitionRatio
                detectedPatterns.push("Repetição excessiva de palavras")
            }
        }

        // 3. Análise de caracteres especiais com contexto
        const specialCharCount = (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length
        const specialCharRatio = specialCharCount / text.length

        if (specialCharRatio > ModerationRules.SPAM_DETECTION.MAX_SPECIAL_CHAR_RATIO) {
            spamScore +=
                ModerationRules.SPAM_DETECTION.EXCESSIVE_SPECIAL_CHARS_WEIGHT * specialCharRatio
            detectedPatterns.push("Excesso de caracteres especiais")
        }

        // 4. Detectar padrão de spam com hashtags/menções/URLs excessivas
        const hashtags = (text.match(/#\w+/g) || []).length
        const mentions = (text.match(/@\w+/g) || []).length
        const urls = (text.match(/https?:\/\/\S+/g) || []).length

        if (hashtags > 10 || mentions > 20 || urls > 5) {
            spamScore += 20 // Adicionar peso por excesso de elementos
            detectedPatterns.push("Muitas hashtags/menções/URLs")
        }

        // 4. Análise de densidade de palavras-chave suspeitas
        const suspiciousWords = [
            "free",
            "money",
            "click",
            "buy",
            "now",
            "limited",
            "time",
            "offer",
            "win",
            "prize",
        ]
        const suspiciousCount = suspiciousWords.reduce((count, word) => {
            const regex = new RegExp(`\\b${word}\\b`, "gi")
            const matches = text.match(regex)
            return count + (matches ? matches.length : 0)
        }, 0)

        if (suspiciousCount > 3) {
            spamScore += suspiciousCount * 5
            detectedPatterns.push("Muitas palavras-chave suspeitas")
        }

        // Normalizar score
        const normalizedScore = Math.min(100, spamScore)
        const confidence = normalizedScore / 100

        return {
            isSpam: normalizedScore > ModerationRules.SPAM_DETECTION.SPAM_THRESHOLD_LOW,
            confidence,
            spamScore: normalizedScore,
            detectedPatterns,
            spamType:
                normalizedScore > ModerationRules.SPAM_DETECTION.SPAM_THRESHOLD_HIGH
                    ? "high"
                    : normalizedScore > ModerationRules.SPAM_DETECTION.SPAM_THRESHOLD_MEDIUM
                    ? "medium"
                    : "low",
        }
    }

    /**
     * Analisa qualidade de texto com métricas mais refinadas
     */
    static analyzeTextQuality(text: string): {
        qualityScore: number
        confidence: number
        hashtags: number
        mentions: number
        urls: number
        wordCount: number
        charCount: number
        readabilityScore: number
    } {
        const words = text.split(/\s+/).filter((word) => word.length > 0)
        const chars = text.replace(/\s/g, "")

        // Análise de hashtags
        const hashtags = (text.match(/#\w+/g) || []).length
        const hashtagPenalty = Math.min(
            100,
            hashtags * ModerationRules.TEXT_QUALITY.HASHTAG_PENALTY,
        )

        // Análise de menções
        const mentions = (text.match(/@\w+/g) || []).length
        const mentionPenalty = Math.min(
            100,
            mentions * ModerationRules.TEXT_QUALITY.MENTION_PENALTY,
        )

        // Análise de URLs
        const urls = (text.match(/https?:\/\/\S+/g) || []).length
        const urlPenalty = Math.min(100, urls * ModerationRules.TEXT_QUALITY.URL_PENALTY)

        // Análise de comprimento com função sigmóide
        let lengthScore = 0
        if (words.length < ModerationRules.QUALITY_THRESHOLDS.MIN_TEXT_LENGTH) {
            lengthScore = ModerationRules.TEXT_QUALITY.MIN_LENGTH_SCORE
        } else if (words.length > ModerationRules.QUALITY_THRESHOLDS.MAX_TEXT_LENGTH) {
            lengthScore = ModerationRules.TEXT_QUALITY.MAX_LENGTH_SCORE
        } else {
            // Usar função sigmóide para comprimento ótimo
            const normalizedLength =
                (words.length - ModerationRules.QUALITY_THRESHOLDS.MIN_TEXT_LENGTH) /
                (ModerationRules.QUALITY_THRESHOLDS.MAX_TEXT_LENGTH -
                    ModerationRules.QUALITY_THRESHOLDS.MIN_TEXT_LENGTH)
            const sigmoid = 1 / (1 + Math.exp(-10 * (normalizedLength - 0.3)))
            lengthScore = ModerationRules.TEXT_QUALITY.OPTIMAL_LENGTH_SCORE * sigmoid
        }

        // Análise de legibilidade (Flesch Reading Ease simplificado)
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
        const avgWordsPerSentence =
            sentences.length > 0 ? words.length / sentences.length : words.length
        const avgSyllablesPerWord = this.estimateSyllables(words) / words.length

        const readabilityScore = Math.max(
            0,
            206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord,
        )
        const normalizedReadability = Math.max(0, Math.min(100, readabilityScore))

        // Calcular score geral com pesos
        const overallScore =
            (100 - hashtagPenalty) * 0.2 +
            (100 - mentionPenalty) * 0.2 +
            (100 - urlPenalty) * 0.2 +
            lengthScore * 0.2 +
            normalizedReadability * 0.2

        return {
            qualityScore: Math.round(overallScore),
            confidence: overallScore / 100,
            hashtags,
            mentions,
            urls,
            wordCount: words.length,
            charCount: chars.length,
            readabilityScore: Math.round(normalizedReadability),
        }
    }

    // ===== HELPER METHODS =====

    /**
     * Verifica se o buffer começa com o header especificado
     */
    private static checkHeader(buffer: Buffer, header: number[]): boolean {
        if (buffer.length < header.length) return false

        for (let i = 0; i < header.length; i++) {
            if (buffer[i] !== header[i]) return false
        }

        return true
    }

    /**
     * Retorna bonus para formatos mais comuns
     */
    private static getFormatBonus(format: string): number {
        const bonuses: Record<string, number> = {
            JPEG: 5,
            PNG: 3,
            GIF: 2,
            WEBP: 1,
            MP3: 5,
            WAV: 3,
            OGG: 2,
            AAC: 1,
        }
        return bonuses[format] || 0
    }

    /**
     * Hash simples para chunks
     */
    private static simpleHash(str: string): string {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash // Convert to 32-bit integer
        }
        return hash.toString(36)
    }

    /**
     * Estima número de sílabas em palavras (aproximação)
     */
    private static estimateSyllables(words: string[]): number {
        let totalSyllables = 0

        words.forEach((word) => {
            // Remover caracteres especiais
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "")

            if (cleanWord.length === 0) return

            // Contar vogais
            const vowels = cleanWord.match(/[aeiouy]/g)
            let syllableCount = vowels ? vowels.length : 0

            // Ajustes para português/inglês
            if (cleanWord.endsWith("e") && syllableCount > 1) {
                syllableCount--
            }

            // Mínimo de 1 sílaba por palavra
            totalSyllables += Math.max(1, syllableCount)
        })

        return totalSyllables
    }

    // ===== ALGORITMOS DE DETECÇÃO REAL =====

    /**
     * Algoritmo principal de detecção de conteúdo usando análise avançada
     */
    static detectContentType(
        buffer: Buffer,
        metadata?: Record<string, any>,
    ): {
        contentType: "human" | "ai_generated" | "spam" | "bot" | "unknown"
        confidence: number
        qualityScore: number
        reasoning: string
        detectedFeatures: string[]
    } {
        const detectedFeatures: string[] = []
        let confidence = 0
        let qualityScore = 0
        let reasoning = ""
        let contentType: "human" | "ai_generated" | "spam" | "bot" | "unknown" = "unknown"

        try {
            // 1. Análise de qualidade estrutural
            const structuralAnalysis = this.analyzeStructuralQuality(buffer)
            qualityScore = structuralAnalysis.qualityScore
            detectedFeatures.push(...structuralAnalysis.features)

            // 2. Análise de padrões de conteúdo
            const patternAnalysis = this.analyzeContentPatterns(buffer)
            detectedFeatures.push(...patternAnalysis.features)

            // 3. Análise de texto (se disponível)
            let textAnalysis: {
                isSpam: boolean
                confidence: number
                spamType: string
                detectedPatterns: string[]
            } | null = null

            if (metadata && metadata.description) {
                const spamAnalysis = this.analyzeSpamContent(metadata.description)
                textAnalysis = {
                    isSpam: spamAnalysis.isSpam,
                    confidence: spamAnalysis.confidence,
                    spamType: spamAnalysis.spamType,
                    detectedPatterns: spamAnalysis.detectedPatterns,
                }
                detectedFeatures.push(...textAnalysis.detectedPatterns)
            }

            // 4. Determinar tipo de conteúdo baseado nas análises
            const classification = this.classifyContentType(
                structuralAnalysis,
                patternAnalysis,
                textAnalysis,
            )

            contentType = classification.contentType
            confidence = classification.confidence
            reasoning = classification.reasoning

            return {
                contentType,
                confidence,
                qualityScore,
                reasoning,
                detectedFeatures,
            }
        } catch (error) {
            return {
                contentType: "unknown",
                confidence: 0,
                qualityScore: 0,
                reasoning: `Erro na análise: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                detectedFeatures: ["erro_analise"],
            }
        }
    }

    /**
     * Analisa qualidade estrutural do conteúdo
     */
    private static analyzeStructuralQuality(buffer: Buffer): {
        qualityScore: number
        features: string[]
    } {
        const features: string[] = []
        let qualityScore = 0

        // Análise de tamanho
        const sizeScore = this.calculateSizeScore(buffer.length, 1024, 10 * 1024 * 1024)
        qualityScore += sizeScore * 0.3

        if (sizeScore > 80) features.push("tamanho_adequado")
        else if (sizeScore < 30) features.push("tamanho_insuficiente")

        // Análise de entropia
        const entropyScore = this.calculateEntropyScore(buffer)
        qualityScore += entropyScore * 0.3

        if (entropyScore > 70) features.push("alta_entropia")
        else if (entropyScore < 30) features.push("baixa_entropia")

        // Análise de repetição
        const repetitionScore = this.calculateRepetitionScore(buffer)
        qualityScore += (100 - repetitionScore) * 0.2

        if (repetitionScore > 80) features.push("alta_repeticao")
        else if (repetitionScore < 20) features.push("baixa_repeticao")

        // Análise de distribuição
        const distributionScore = this.calculateColorDistributionScore(buffer)
        qualityScore += distributionScore * 0.2

        if (distributionScore > 70) features.push("boa_distribuicao")
        else if (distributionScore < 30) features.push("distribuicao_ruim")

        return {
            qualityScore: Math.min(100, qualityScore),
            features,
        }
    }

    /**
     * Analisa padrões de conteúdo para detectar características específicas
     */
    private static analyzeContentPatterns(buffer: Buffer): {
        features: string[]
        isSynthetic: boolean
        confidence: number
    } {
        const features: string[] = []
        let isSynthetic = false
        let confidence = 0

        // Detecção de padrões sintéticos
        const entropyScore = this.calculateEntropyScore(buffer)
        const repetitionScore = this.calculateRepetitionScore(buffer)
        const edgeScore = this.calculateEdgeScore(buffer)

        // Critérios para conteúdo sintético
        if (entropyScore < 25 && repetitionScore > 85) {
            isSynthetic = true
            confidence = 85
            features.push("padroes_sinteticos", "baixa_entropia", "alta_repeticao")
        } else if (edgeScore < 15 && repetitionScore > 75) {
            isSynthetic = true
            confidence = 75
            features.push("bordas_simples", "padroes_repetitivos")
        } else if (entropyScore < 20) {
            isSynthetic = true
            confidence = 70
            features.push("muito_baixa_entropia")
        }

        // Detecção de qualidade humana
        if (entropyScore > 60 && repetitionScore < 40 && edgeScore > 25) {
            features.push("caracteristicas_humanas")
        }

        // Detecção de conteúdo estático
        if (repetitionScore > 90) {
            features.push("conteudo_estatico")
        }

        return {
            features,
            isSynthetic,
            confidence,
        }
    }

    /**
     * Classifica o tipo de conteúdo baseado em todas as análises
     */
    private static classifyContentType(
        structuralAnalysis: any,
        patternAnalysis: any,
        textAnalysis: any,
    ): {
        contentType: "human" | "ai_generated" | "spam" | "bot" | "unknown"
        confidence: number
        reasoning: string
    } {
        let contentType: "human" | "ai_generated" | "spam" | "bot" | "unknown" = "unknown"
        let confidence = 0
        let reasoning = ""

        // Prioridade 1: Spam (se análise de texto disponível)
        if (textAnalysis && textAnalysis.isSpam) {
            contentType = "spam"
            confidence = textAnalysis.confidence * 100
            reasoning = `Conteúdo spam detectado: ${textAnalysis.spamType}`
            return { contentType, confidence, reasoning }
        }

        // Prioridade 2: Conteúdo sintético/AI
        if (patternAnalysis.isSynthetic) {
            contentType = "ai_generated"
            confidence = patternAnalysis.confidence
            reasoning = `Conteúdo sintético detectado: ${patternAnalysis.features.join(", ")}`
            return { contentType, confidence, reasoning }
        }

        // Prioridade 3: Bot (padrões suspeitos)
        if (
            patternAnalysis.features.includes("conteudo_estatico") &&
            structuralAnalysis.qualityScore < 30
        ) {
            contentType = "bot"
            confidence = 70
            reasoning = "Padrões de bot detectados: conteúdo estático com baixa qualidade"
            return { contentType, confidence, reasoning }
        }

        // Prioridade 4: Conteúdo humano
        if (
            patternAnalysis.features.includes("caracteristicas_humanas") &&
            structuralAnalysis.qualityScore > 50
        ) {
            contentType = "human"
            confidence = Math.min(90, structuralAnalysis.qualityScore)
            reasoning = "Características humanas detectadas: boa entropia e variação"
            return { contentType, confidence, reasoning }
        }

        // Padrão: desconhecido
        contentType = "unknown"
        confidence = 50
        reasoning = "Tipo de conteúdo não determinado"

        return { contentType, confidence, reasoning }
    }
}
