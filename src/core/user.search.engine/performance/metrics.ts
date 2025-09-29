import { performance } from "perf_hooks"

export interface SearchMetrics {
    // Tempo de execução
    totalDuration: number
    relatedSearchDuration: number
    unknownSearchDuration: number
    hydrationDuration: number
    mixingDuration: number
    filteringDuration: number

    // Contadores
    relatedCandidatesFound: number
    unknownCandidatesFound: number
    finalCandidatesCount: number
    cacheHits: number
    cacheMisses: number

    // Memória
    memoryStart: NodeJS.MemoryUsage
    memoryEnd: NodeJS.MemoryUsage
    memoryPeak: NodeJS.MemoryUsage

    // Timestamps
    startTime: number
    endTime: number

    // Erros
    errors: string[]
}

export class PerformanceMetrics {
    private metrics: Partial<SearchMetrics> = {}
    private startTime: number = 0
    private memoryStart: NodeJS.MemoryUsage = process.memoryUsage()
    private memoryPeak: NodeJS.MemoryUsage = this.memoryStart
    private errors: string[] = []

    constructor() {
        this.reset()
    }

    /**
     * Inicia a coleta de métricas
     */
    start(): void {
        this.startTime = performance.now()
        this.memoryStart = process.memoryUsage()
        this.memoryPeak = this.memoryStart
        this.errors = []
    }

    /**
     * Finaliza a coleta de métricas
     */
    end(): SearchMetrics {
        const endTime = performance.now()
        const memoryEnd = process.memoryUsage()

        // Atualiza pico de memória se necessário
        if (memoryEnd.heapUsed > this.memoryPeak.heapUsed) {
            this.memoryPeak = memoryEnd
        }

        // Calcula duração total
        const totalDuration = endTime - this.startTime

        this.metrics = {
            ...this.metrics,
            totalDuration,
            endTime,
            memoryEnd,
            memoryPeak: this.memoryPeak,
            errors: [...this.errors],
        }

        return this.metrics as SearchMetrics
    }

    /**
     * Registra duração de uma operação específica
     */
    recordDuration(
        operation: keyof Pick<
            SearchMetrics,
            | "relatedSearchDuration"
            | "unknownSearchDuration"
            | "hydrationDuration"
            | "mixingDuration"
            | "filteringDuration"
        >,
        duration: number
    ): void {
        // Acumula a duração em vez de sobrescrever
        this.metrics[operation] = (this.metrics[operation] || 0) + duration
    }

    /**
     * Registra contadores
     */
    recordCount(
        type:
            | "relatedCandidatesFound"
            | "unknownCandidatesFound"
            | "finalCandidatesCount"
            | "cacheHits"
            | "cacheMisses",
        count: number
    ): void {
        this.metrics[type] = (this.metrics[type] || 0) + count
    }

    /**
     * Registra erro
     */
    recordError(error: string): void {
        this.errors.push(error)
    }

    /**
     * Obtém métricas atuais
     */
    getMetrics(): Partial<SearchMetrics> {
        return { ...this.metrics }
    }

    /**
     * Reseta métricas
     */
    reset(): void {
        this.metrics = {
            totalDuration: 0,
            relatedSearchDuration: 0,
            unknownSearchDuration: 0,
            hydrationDuration: 0,
            mixingDuration: 0,
            filteringDuration: 0,
            relatedCandidatesFound: 0,
            unknownCandidatesFound: 0,
            finalCandidatesCount: 0,
            cacheHits: 0,
            cacheMisses: 0,
            memoryStart: process.memoryUsage(),
            memoryEnd: process.memoryUsage(),
            memoryPeak: process.memoryUsage(),
            startTime: 0,
            endTime: 0,
            errors: [],
        }
        this.startTime = 0
        this.memoryStart = process.memoryUsage()
        this.memoryPeak = this.memoryStart
        this.errors = []
    }

    /**
     * Gera relatório resumido das métricas
     */
    generateReport(): string {
        const m = this.metrics as SearchMetrics

        return JSON.stringify(
            {
                performance: {
                    totalDuration: `${m.totalDuration.toFixed(2)}ms`,
                    relatedSearch: `${m.relatedSearchDuration.toFixed(2)}ms`,
                    unknownSearch: `${m.unknownSearchDuration.toFixed(2)}ms`,
                    hydration: `${m.hydrationDuration.toFixed(2)}ms`,
                    mixing: `${m.mixingDuration.toFixed(2)}ms`,
                    filtering: `${m.filteringDuration.toFixed(2)}ms`,
                },
                results: {
                    relatedCandidates: m.relatedCandidatesFound,
                    unknownCandidates: m.unknownCandidatesFound,
                    finalCandidates: m.finalCandidatesCount,
                    cacheHitRate:
                        m.cacheHits + m.cacheMisses > 0
                            ? `${((m.cacheHits / (m.cacheHits + m.cacheMisses)) * 100).toFixed(1)}%`
                            : "0%",
                },
                memory: {
                    startHeap: `${(m.memoryStart.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                    endHeap: `${(m.memoryEnd.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                    peakHeap: `${(m.memoryPeak.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                    memoryDelta: `${(
                        (m.memoryEnd.heapUsed - m.memoryStart.heapUsed) /
                        1024 /
                        1024
                    ).toFixed(2)}MB`,
                },
                errors: m.errors.length > 0 ? m.errors : null,
            },
            null,
            2
        )
    }
}
