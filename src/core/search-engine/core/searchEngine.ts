import { Op, Sequelize } from "sequelize"
import { PerformanceMetrics, SearchMetrics } from "../performance"
import { ValidationError, ValidationResult } from "../types"

import Block from "@models/user/block-model"
import Follow from "@models/user/follow-model"
// HydrationService será importado dinamicamente para evitar dependência circular
import SecurityToolkit from "security-toolkit"
import { config } from "../config"

export class SearchEngine {
    public readonly rules: typeof config.rules
    public readonly weights: typeof config.weights
    public searchTerm: string
    public user: {
        id: string
    }
    public readonly security: SecurityToolkit
    public hydratation: any
    private metrics: PerformanceMetrics
    private enableMetrics: boolean

    constructor({
        searchTerm,
        user,
        enableMetrics = false,
    }: {
        searchTerm: string
        user: {
            id: string
        }
        enableMetrics?: boolean
    }) {
        this.rules = config.rules
        this.weights = config.weights
        this.searchTerm = searchTerm
        this.user = enableMetrics ? { id: "7367261504967544832" } : user
        this.security = new SecurityToolkit()
        // HydrationService será inicializado dinamicamente para evitar dependência circular
        this.hydratation = null
        this.enableMetrics = enableMetrics
        this.metrics = new PerformanceMetrics()
    }

    /**
     * Inicializa o HydrationService dinamicamente para evitar dependência circular
     */
    public async initializeHydrationService() {
        if (!this.hydratation) {
            const { HydrationService } = await import("./hydrationService")
            this.hydratation = new HydrationService(this.searchTerm, BigInt(this.user.id), {
                batchSize: this.rules.batch.size,
                maxConcurrentBatches: this.rules.batch.maxConcurrent,
            })
        }
        return this.hydratation
    }

    /**
     * Busca principal com paralelização otimizada
     */
    public async search() {
        if (this.enableMetrics) {
            this.metrics.start()
        }

        try {
            // Inicializa HydrationService dinamicamente
            await this.initializeHydrationService()

            // Importações dinâmicas para evitar dependência circular
            const { relatedCandidates } = await import("./relatedCandiades")
            const { unknownCandidates } = await import("./unknownCandidates")
            const { mixerService } = await import("./mixerService")
            const { securityFilter } = await import("./securityFilter")

            // Inicializa serviços em paralelo
            const [related, unknown, mixer, security] = await Promise.all([
                new relatedCandidates(this),
                new unknownCandidates(this),
                new mixerService(this),
                new securityFilter(this),
            ])

            // Executa buscas em paralelo
            const [relatedResults, unknownResults] = await this.executeParallelCandidatesSearch(
                related,
                unknown
            )

            // Mistura resultados
            const mixingStart = performance.now()
            const mixed = mixer.mix(relatedResults, unknownResults)
            if (this.enableMetrics) {
                this.metrics.recordDuration("mixingDuration", performance.now() - mixingStart)
            }

            // Filtra resultados
            const filteringStart = performance.now()
            const finalResults = security.filter(mixed)
            if (this.enableMetrics) {
                this.metrics.recordDuration("filteringDuration", performance.now() - filteringStart)
                this.metrics.recordCount("finalCandidatesCount", finalResults.length)
            }

            // Finaliza métricas antes de retornar
            if (this.enableMetrics) {
                this.metrics.end()
                return {
                    results: finalResults,
                    metrics: JSON.parse(this.metrics.generateReport()),
                }
            }

            return finalResults
        } catch (error) {
            if (this.enableMetrics) {
                this.metrics.recordError(error instanceof Error ? error.message : String(error))
                this.metrics.end()
            }
            throw error
        }
    }

    /**
     * Executa busca de candidatos em paralelo
     */
    private async executeParallelCandidatesSearch(
        related: any,
        unknown: any
    ): Promise<[any[], any[]]> {
        const searchPromises = [
            this.executeWithTimeout(related.process(), "related", this.rules.results.timeout),
            this.executeWithTimeout(unknown.process(), "unknown", this.rules.results.timeout),
        ]

        // Executa com Promise.allSettled para melhor controle de erros
        const results = await Promise.allSettled(searchPromises)

        // Processa resultados com fallback
        const [relatedResult, unknownResult] = results.map((result, index) => {
            if (result.status === "fulfilled") {
                // Só registra contadores, as durações já foram registradas nos serviços individuais
                if (this.enableMetrics) {
                    if (index === 0) {
                        this.metrics.recordCount(
                            "relatedCandidatesFound",
                            (result.value as any[]).length
                        )
                    } else {
                        this.metrics.recordCount(
                            "unknownCandidatesFound",
                            (result.value as any[]).length
                        )
                    }
                }
                return result.value as any[]
            } else {
                if (this.enableMetrics) {
                    this.metrics.recordError(
                        `${index === 0 ? "related" : "unknown"} search failed: ${result.reason}`
                    )
                }
                return [] // Fallback para array vazio
            }
        }) as [any[], any[]]

        return [relatedResult, unknownResult]
    }

    /**
     * Executa promise com timeout
     */
    private async executeWithTimeout<T>(
        promise: Promise<T>,
        operation: string,
        timeoutMs: number
    ): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Timeout: ${operation} excedeu ${timeoutMs}ms`))
            }, timeoutMs)
        })

        return Promise.race([promise, timeoutPromise])
    }

    /**
     * Validates search term according to security and business rules
     * @returns ValidationResult with detailed information about validation status
     */
    public isValidSearchTerm(): ValidationResult {
        try {
            // Type validation
            if (typeof this.searchTerm !== "string") {
                return {
                    isValid: false,
                    error: ValidationError.INVALID_TYPE,
                    message: "Search term must be a string",
                    code: "SEARCH_INVALID_TYPE",
                }
            }

            // Normalize search term
            const normalizedTerm = this.searchTerm.trim()

            // Empty string validation
            if (normalizedTerm === "") {
                return {
                    isValid: false,
                    error: ValidationError.EMPTY_TERM,
                    message: "Search term cannot be empty or contain only whitespace",
                    code: "SEARCH_EMPTY_TERM",
                }
            }

            // Length validation
            if (normalizedTerm.length < this.rules.term.minLength) {
                return {
                    isValid: false,
                    error: ValidationError.TOO_SHORT,
                    message: `Search term must be at least ${this.rules.term.minLength} character(s)`,
                    code: "SEARCH_TOO_SHORT",
                    details: {
                        currentLength: normalizedTerm.length,
                        minimumLength: this.rules.term.minLength,
                    },
                }
            }

            if (normalizedTerm.length > this.rules.term.maxLength) {
                return {
                    isValid: false,
                    error: ValidationError.TOO_LONG,
                    message: `Search term cannot exceed ${this.rules.term.maxLength} characters`,
                    code: "SEARCH_TOO_LONG",
                    details: {
                        currentLength: normalizedTerm.length,
                        maximumLength: this.rules.term.maxLength,
                    },
                }
            }

            // Security validation
            const sanitization = this.security.sanitizerMethods.sanitizeSQLInjection(normalizedTerm)

            if (sanitization.isDangerous) {
                return {
                    isValid: false,
                    error: ValidationError.SECURITY_THREAT,
                    message: "Search term contains potentially malicious characters",
                    code: "SEARCH_SECURITY_THREAT",
                }
            }

            // Character set validation (for internationalization)
            if (!this.isValidCharacterSet(normalizedTerm)) {
                return {
                    isValid: false,
                    error: ValidationError.INVALID_CHARACTERS,
                    message: "Search term contains invalid characters",
                    code: "SEARCH_INVALID_CHARACTERS",
                }
            }

            // Success validation
            return {
                isValid: true,
                error: null,
                message: "Search term is valid",
                code: "SEARCH_VALID",
                details: {
                    normalizedTerm,
                    originalLength: this.searchTerm.length,
                    normalizedLength: normalizedTerm.length,
                },
            }
        } catch (error: any) {
            console.error("Critical error during search validation:", {
                error: error.message,
                stack: error.stack,
                searchTerm: this.searchTerm,
                timestamp: new Date().toISOString(),
            })

            return {
                isValid: false,
                error: ValidationError.VALIDATION_ERROR,
                message: "An unexpected error occurred during validation",
                code: "SEARCH_VALIDATION_ERROR",
                details: {
                    errorId: this.generateErrorId(),
                    timestamp: new Date().toISOString(),
                },
            }
        }
    }

    /**
     * Validates character set for internationalization support
     * @param term - The search term to validate
     * @returns boolean indicating if character set is valid
     */
    private isValidCharacterSet(term: string): boolean {
        // Allow letters, numbers, spaces, hyphens, underscores, and common punctuation
        // Support for international characters (Unicode)
        const validCharacterRegex = /^[\p{L}\p{N}\s\-_.,!?@#$%&*()+=\[\]{}|\\:";'<>\/]+$/u
        return validCharacterRegex.test(term)
    }

    /**
     * Generates unique error ID for tracking
     * @returns string error ID
     */
    public generateErrorId(): string {
        return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    public async findFollow(followed_user_id: string) {
        const user_followed = await Follow.findOne({
            attributes: ["followed_user_id", "user_id"],
            where: { followed_user_id, user_id: this.user.id },
        })

        return Boolean(user_followed)
    }

    public async findBlock(blocked_user_id: string) {
        const user_blocked = await Block.findOne({
            attributes: ["blocked_user_id", "user_id"],
            where: { blocked_user_id, user_id: this.user.id },
        })
        return Boolean(user_blocked)
    }

    public filterSearchParams() {
        return {
            [Op.and]: [
                Sequelize.literal(
                    `MATCH (username) AGAINST ('${this.searchTerm}*' IN BOOLEAN MODE)`
                ),
                { id: { [Op.not]: this.user.id } },
                { blocked: { [Op.not]: true } },
                { deleted: { [Op.not]: true } },
            ],
        }
    }

    public rank(candidates: any[], type: "related" | "unknown"): any[] {
        // Calcula o score de cada candidato e retorna ordenando do maior para o menor
        const weights = this.weights[type]
        return candidates
            .map((candidate) => {
                let totalScore = candidate.weight

                for (const criterion in weights) {
                    if (
                        candidate[criterion] !== undefined &&
                        weights[criterion].weight !== undefined
                    ) {
                        totalScore += candidate[criterion] ? weights[criterion].weight : 0
                    }
                }
                return {
                    id: candidate.id,
                    username: candidate.username,
                    name: candidate.name,
                    verifyed: candidate.verifyed,
                    blocked: candidate.blocked,
                    you_follow: candidate.you_follow,
                    profile_picture: candidate.profile_picture,
                    statistics: candidate?.statistics,
                    score: totalScore,
                }
            })
            .sort((a, b) => b.score - a.score)
    }

    /**
     * Obtém as métricas de performance se habilitadas
     */
    public getMetrics(): SearchMetrics | null {
        if (!this.enableMetrics) {
            return null
        }
        return this.metrics.getMetrics() as SearchMetrics
    }

    /**
     * Obtém relatório de métricas em formato JSON
     */
    public getMetricsReport(): string | null {
        if (!this.enableMetrics) {
            return null
        }
        return this.metrics.generateReport()
    }

    /**
     * Habilita ou desabilita coleta de métricas
     */
    public setMetricsEnabled(enabled: boolean): void {
        this.enableMetrics = enabled
        if (enabled && !this.metrics) {
            this.metrics = new PerformanceMetrics()
        }
    }

    /**
     * Verifica se métricas estão habilitadas
     */
    public isMetricsEnabled(): boolean {
        return this.enableMetrics
    }

    /**
     * Obtém instância das métricas para uso em subclasses
     */
    protected getMetricsInstance(): PerformanceMetrics {
        return this.metrics
    }
}
