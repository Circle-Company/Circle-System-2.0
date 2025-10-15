import { MomentViewPersistenceService } from "@/infra/models/moment/moment.view.model"
import { logger } from "@/shared"

// ===== TIPOS PARA TRACKING DE VISUALIZAÇÕES =====
export interface ViewRecord {
    viewerId: string
    momentId: string
    viewTimestamp: Date
    viewDuration?: number
    viewSource?: string
    isComplete: boolean // Se assistiu até o final
}

export interface RecentViewCache {
    [momentId: string]: {
        [viewerId: string]: ViewRecord
    }
}

// ===== SERVIÇO DE TRACKING DE VISUALIZAÇÕES =====
export class ViewTrackingService {
    private static instance: ViewTrackingService
    private recentViewsCache: RecentViewCache = {}
    private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos
    private readonly MAX_CACHE_SIZE = 10000 // Máximo de registros em cache
    private persistenceService: MomentViewPersistenceService

    private constructor() {
        this.persistenceService = new MomentViewPersistenceService()
        // Iniciar limpeza periódica do cache
        this.startCacheCleanup()
    }

    static getInstance(): ViewTrackingService {
        if (!ViewTrackingService.instance) {
            ViewTrackingService.instance = new ViewTrackingService()
        }
        return ViewTrackingService.instance
    }

    /**
     * Registra uma visualização
     */
    async recordView(viewRecord: Omit<ViewRecord, "viewTimestamp">): Promise<void> {
        try {
            const record: ViewRecord = {
                ...viewRecord,
                viewTimestamp: new Date(),
            }

            // Salvar no banco de dados (assíncrono, não bloquear)
            this.persistenceService
                .saveView({
                    momentId: viewRecord.momentId,
                    viewerId: viewRecord.viewerId,
                    viewDuration: viewRecord.viewDuration,
                    viewSource: viewRecord.viewSource,
                    isComplete: viewRecord.isComplete,
                })
                .catch((error) => {
                    logger.error("Erro ao salvar visualização no banco:", error)
                })

            // Inicializar cache para o momento se não existir
            if (!this.recentViewsCache[viewRecord.momentId]) {
                this.recentViewsCache[viewRecord.momentId] = {}
            }

            // Armazenar visualização no cache (para acesso rápido)
            this.recentViewsCache[viewRecord.momentId][viewRecord.viewerId] = record

            // Log da visualização
            logger.info(`View recorded: ${viewRecord.viewerId} -> ${viewRecord.momentId}`, {
                duration: viewRecord.viewDuration,
                source: viewRecord.viewSource,
                complete: viewRecord.isComplete,
            })

            // Limitar tamanho do cache
            this.enforceCacheLimits()
        } catch (error) {
            logger.error("Erro ao registrar visualização:", error)
        }
    }

    /**
     * Verifica se um usuário visualizou um momento recentemente
     */
    async hasRecentView(
        momentId: string,
        viewerId: string,
        maxAgeInMinutes: number = 5,
    ): Promise<boolean> {
        try {
            // Primeiro verificar no cache (mais rápido)
            const momentViews = this.recentViewsCache[momentId]
            if (momentViews) {
                const viewRecord = momentViews[viewerId]
                if (viewRecord) {
                    const ageInMs = Date.now() - viewRecord.viewTimestamp.getTime()
                    const maxAgeInMs = maxAgeInMinutes * 60 * 1000
                    if (ageInMs <= maxAgeInMs) {
                        return true
                    }
                }
            }

            // Se não encontrou no cache, verificar no banco
            return await this.persistenceService.hasRecentView(momentId, viewerId, maxAgeInMinutes)
        } catch (error) {
            logger.error("Erro ao verificar visualização recente:", error)
            return false
        }
    }

    /**
     * Obtém informações sobre uma visualização recente
     */
    getRecentView(momentId: string, viewerId: string): ViewRecord | null {
        try {
            const momentViews = this.recentViewsCache[momentId]
            if (!momentViews) {
                return null
            }

            return momentViews[viewerId] || null
        } catch (error) {
            logger.error("Erro ao obter visualização recente:", error)
            return null
        }
    }

    /**
     * Obtém todas as visualizações recentes de um momento
     */
    getRecentViewsForMoment(momentId: string, maxAgeInMinutes: number = 5): ViewRecord[] {
        try {
            const momentViews = this.recentViewsCache[momentId]
            if (!momentViews) {
                return []
            }

            const maxAgeInMs = maxAgeInMinutes * 60 * 1000
            const now = Date.now()

            return Object.values(momentViews).filter(
                (view) => now - view.viewTimestamp.getTime() <= maxAgeInMs,
            )
        } catch (error) {
            logger.error("Erro ao obter visualizações recentes do momento:", error)
            return []
        }
    }

    /**
     * Obtém estatísticas de visualizações recentes
     */
    async getRecentViewStats(
        momentId: string,
        maxAgeInMinutes: number = 5,
    ): Promise<{
        totalViews: number
        uniqueViews: number
        completeViews: number
        averageDuration: number
        viewsBySource: Record<string, number>
    }> {
        try {
            // Primeiro tentar obter do cache
            const recentViews = this.getRecentViewsForMoment(momentId, maxAgeInMinutes)

            if (recentViews.length > 0) {
                // Usar dados do cache se disponíveis
                const stats = {
                    totalViews: recentViews.length,
                    uniqueViews: new Set(recentViews.map((v) => v.viewerId)).size,
                    completeViews: recentViews.filter((v) => v.isComplete).length,
                    averageDuration: 0,
                    viewsBySource: {} as Record<string, number>,
                }

                // Calcular duração média
                const viewsWithDuration = recentViews.filter(
                    (v) => v.viewDuration && v.viewDuration > 0,
                )
                if (viewsWithDuration.length > 0) {
                    const totalDuration = viewsWithDuration.reduce(
                        (sum, v) => sum + (v.viewDuration || 0),
                        0,
                    )
                    stats.averageDuration = totalDuration / viewsWithDuration.length
                }

                // Contar por fonte
                recentViews.forEach((view) => {
                    const source = view.viewSource || "unknown"
                    stats.viewsBySource[source] = (stats.viewsBySource[source] || 0) + 1
                })

                return stats
            } else {
                // Se cache está vazio, buscar do banco
                return await this.persistenceService.getViewStatistics(momentId, maxAgeInMinutes)
            }
        } catch (error) {
            logger.error("Erro ao obter estatísticas de visualizações recentes:", error)
            return {
                totalViews: 0,
                uniqueViews: 0,
                completeViews: 0,
                averageDuration: 0,
                viewsBySource: {},
            }
        }
    }

    /**
     * Remove visualizações antigas do cache
     */
    private cleanupExpiredViews(): void {
        try {
            const now = Date.now()
            const expiredThreshold = now - this.CACHE_TTL_MS

            Object.keys(this.recentViewsCache).forEach((momentId) => {
                const momentViews = this.recentViewsCache[momentId]

                Object.keys(momentViews).forEach((viewerId) => {
                    const viewRecord = momentViews[viewerId]
                    if (viewRecord.viewTimestamp.getTime() < expiredThreshold) {
                        delete momentViews[viewerId]
                    }
                })

                // Se não há mais visualizações para este momento, remover
                if (Object.keys(momentViews).length === 0) {
                    delete this.recentViewsCache[momentId]
                }
            })
        } catch (error) {
            logger.error("Erro na limpeza de visualizações expiradas:", error)
        }
    }

    /**
     * Enforça limites de tamanho do cache
     */
    private enforceCacheLimits(): void {
        try {
            let totalRecords = 0
            Object.values(this.recentViewsCache).forEach((momentViews) => {
                totalRecords += Object.keys(momentViews).length
            })

            if (totalRecords > this.MAX_CACHE_SIZE) {
                // Remover visualizações mais antigas até atingir o limite
                this.removeOldestViews(totalRecords - this.MAX_CACHE_SIZE)
            }
        } catch (error) {
            logger.error("Erro ao aplicar limites do cache:", error)
        }
    }

    /**
     * Remove as visualizações mais antigas
     */
    private removeOldestViews(count: number): void {
        try {
            const allViews: Array<{ momentId: string; viewerId: string; timestamp: Date }> = []

            Object.keys(this.recentViewsCache).forEach((momentId) => {
                Object.keys(this.recentViewsCache[momentId]).forEach((viewerId) => {
                    const view = this.recentViewsCache[momentId][viewerId]
                    allViews.push({
                        momentId,
                        viewerId,
                        timestamp: view.viewTimestamp,
                    })
                })
            })

            // Ordenar por timestamp (mais antigas primeiro)
            allViews.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

            // Remover as mais antigas
            for (let i = 0; i < Math.min(count, allViews.length); i++) {
                const { momentId, viewerId } = allViews[i]
                delete this.recentViewsCache[momentId][viewerId]

                // Se não há mais visualizações para este momento, remover
                if (Object.keys(this.recentViewsCache[momentId]).length === 0) {
                    delete this.recentViewsCache[momentId]
                }
            }
        } catch (error) {
            logger.error("Erro ao remover visualizações antigas:", error)
        }
    }

    /**
     * Inicia limpeza periódica do cache
     */
    private startCacheCleanup(): void {
        // Limpar a cada 2 minutos
        setInterval(() => {
            this.cleanupExpiredViews()
        }, 2 * 60 * 1000)
    }

    /**
     * Limpa todo o cache (útil para testes)
     */
    clearCache(): void {
        this.recentViewsCache = {}
    }

    /**
     * Obtém estatísticas do cache
     */
    getCacheStats(): {
        totalMoments: number
        totalViews: number
        cacheSizeKB: number
    } {
        try {
            const totalMoments = Object.keys(this.recentViewsCache).length
            let totalViews = 0

            Object.values(this.recentViewsCache).forEach((momentViews) => {
                totalViews += Object.keys(momentViews).length
            })

            const cacheSizeKB = JSON.stringify(this.recentViewsCache).length / 1024

            return {
                totalMoments,
                totalViews,
                cacheSizeKB: Math.round(cacheSizeKB * 100) / 100,
            }
        } catch (error) {
            logger.error("Erro ao obter estatísticas do cache:", error)
            return {
                totalMoments: 0,
                totalViews: 0,
                cacheSizeKB: 0,
            }
        }
    }
}
