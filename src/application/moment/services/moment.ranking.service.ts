/**
 * Moment Ranking Service
 * Serviço especializado para ranking e ordenação de momentos usando sistema de pontuação sofisticado
 * 
 * Features:
 * - Sistema de pontuação com engajamento e decaimento temporal
 * - Ranking por popularidade, trending, relevância
 * - Cache de pontuações para performance
 * - Algoritmos de recomendação baseados em pontuação
 */

import { MomentEntity } from "@/domain/moment/entities/moment.entity"
import { IMomentRepository } from "@/domain/moment/repositories/moment.repository"
import { User } from "@/domain/user/entities/user.entity"

export interface MomentRankingOptions {
    limit?: number
    offset?: number
    minScore?: number
    maxAgeHours?: number
    category?: 'trending' | 'popular' | 'recent' | 'hot'
    userId?: string // Para personalização baseada no usuário
}

export interface MomentRankingResult {
    moment: MomentEntity
    score: number
    ranking: number
    popularityDetails: {
        engagementScore: number
        timeDecayFactor: number
        isPopular: boolean
        metrics: {
            views: number
            completeViews: number
            likes: number
            comments: number
            shares: number
            reports: number
        }
        timeInfo: {
            hoursSincePublished: number
            publishedAt: Date
        }
    }
}

export interface TrendingAlgorithmConfig {
    // Configurações para algoritmo trending
    trendingWeight: {
        velocity: number      // Peso da velocidade de crescimento
        recency: number       // Peso da recência
        engagement: number    // Peso do engajamento
    }
    timeWindows: {
        velocity: number      // Janela de tempo para calcular velocidade (horas)
        trending: number      // Janela de tempo para trending (horas)
    }
}

export class MomentRankingService {
    private static readonly DEFAULT_CONFIG: TrendingAlgorithmConfig = {
        trendingWeight: {
            velocity: 0.4,    // 40% velocidade
            recency: 0.3,     // 30% recência
            engagement: 0.3   // 30% engajamento
        },
        timeWindows: {
            velocity: 2,      // Velocidade calculada nas últimas 2 horas
            trending: 24      // Trending calculado nas últimas 24 horas
        }
    }

    constructor(private readonly momentRepository: IMomentRepository) {}

    /**
     * Obtém ranking de momentos por popularidade
     */
    async getPopularMoments(options: MomentRankingOptions = {}): Promise<MomentRankingResult[]> {
        const {
            limit = 20,
            offset = 0,
            minScore = 10.0,
            maxAgeHours = 168 // 7 dias
        } = options

        // Buscar momentos publicados recentemente
        const moments = await this.momentRepository.findPublished({
            limit: limit * 2, // Buscar mais para filtrar
            offset,
            maxAgeHours
        })

        // Calcular pontuações e filtrar
        const scoredMoments = await Promise.all(
            moments.map(async (moment) => {
                const score = await moment.calculateSophisticatedScore()
                const popularityDetails = await moment.getPopularityDetails()
                
                return {
                    moment,
                    score,
                    popularityDetails
                }
            })
        )

        // Filtrar por pontuação mínima e ordenar
        const filteredAndSorted = scoredMoments
            .filter(item => item.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)

        // Adicionar ranking
        return filteredAndSorted.map((item, index) => ({
            moment: item.moment,
            score: item.score,
            ranking: index + 1,
            popularityDetails: item.popularityDetails
        }))
    }

    /**
     * Obtém momentos trending (crescimento rápido recente)
     */
    async getTrendingMoments(options: MomentRankingOptions = {}): Promise<MomentRankingResult[]> {
        const {
            limit = 20,
            offset = 0,
            maxAgeHours = 48 // 2 dias para trending
        } = options

        const config = MomentRankingService.DEFAULT_CONFIG

        // Buscar momentos recentes
        const moments = await this.momentRepository.findPublished({
            limit: limit * 3,
            offset,
            maxAgeHours
        })

        // Calcular scores trending
        const trendingMoments = await Promise.all(
            moments.map(async (moment) => {
                const trendingScore = await this.calculateTrendingScore(moment, config)
                const popularityDetails = await moment.getPopularityDetails()
                
                return {
                    moment,
                    score: trendingScore,
                    popularityDetails
                }
            })
        )

        // Ordenar por trending score
        const sorted = trendingMoments
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)

        return sorted.map((item, index) => ({
            moment: item.moment,
            score: item.score,
            ranking: index + 1,
            popularityDetails: item.popularityDetails
        }))
    }

    /**
     * Calcula score trending baseado em velocidade de crescimento
     */
    private async calculateTrendingScore(
        moment: MomentEntity, 
        config: TrendingAlgorithmConfig
    ): Promise<number> {
        const now = new Date()
        const publishedAt = moment.publishedAt || moment.createdAt
        
        // 1. Calcular velocidade de crescimento (engajamento nas últimas 2 horas)
        const velocityScore = await this.calculateGrowthVelocity(moment, config.timeWindows.velocity)
        
        // 2. Calcular fator de recência
        const recencyScore = this.calculateRecencyScore(publishedAt, config.timeWindows.trending)
        
        // 3. Calcular engajamento geral
        const engagementScore = await this.calculateEngagementVelocity(moment, config.timeWindows.trending)
        
        // 4. Combinar scores com pesos
        const trendingScore = 
            velocityScore * config.trendingWeight.velocity +
            recencyScore * config.trendingWeight.recency +
            engagementScore * config.trendingWeight.engagement
        
        return Math.max(0, trendingScore)
    }

    /**
     * Calcula velocidade de crescimento nas últimas horas
     */
    private async calculateGrowthVelocity(moment: MomentEntity, timeWindowHours: number): Promise<number> {
        const now = new Date()
        const windowStart = new Date(now.getTime() - (timeWindowHours * 60 * 60 * 1000))
        
        // Simular cálculo de crescimento (implementação real dependeria de histórico)
        // Por enquanto, usar métricas atuais como proxy
        const stats = await moment.getViewStatistics()
        const engagement = await moment.getEngagementMetrics()
        
        // Normalizar por tempo
        const timeNormalizedScore = (stats.totalViews + engagement.totalLikes + engagement.totalComments) / timeWindowHours
        
        return Math.min(timeNormalizedScore / 100, 1.0) // Normalizar para 0-1
    }

    /**
     * Calcula score de recência (mais recente = maior score)
     */
    private calculateRecencyScore(publishedAt: Date, timeWindowHours: number): number {
        const now = new Date()
        const hoursSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60)
        
        if (hoursSincePublished > timeWindowHours) {
            return 0
        }
        
        // Decaimento linear: 1.0 para 0 horas, 0.0 para timeWindowHours
        return Math.max(0, 1.0 - (hoursSincePublished / timeWindowHours))
    }

    /**
     * Calcula velocidade de engajamento
     */
    private async calculateEngagementVelocity(moment: MomentEntity, timeWindowHours: number): Promise<number> {
        const engagement = await moment.getEngagementMetrics()
        
        // Combinar diferentes tipos de engajamento com pesos
        const weightedEngagement = 
            engagement.totalLikes * 1.0 +
            engagement.totalComments * 2.0 +
            (engagement.totalShares || 0) * 3.0
        
        // Normalizar por tempo
        return Math.min(weightedEngagement / (timeWindowHours * 10), 1.0)
    }

    /**
     * Obtém momentos "hot" (alta atividade recente)
     */
    async getHotMoments(options: MomentRankingOptions = {}): Promise<MomentRankingResult[]> {
        const {
            limit = 20,
            offset = 0,
            maxAgeHours = 12 // 12 horas para "hot"
        } = options

        const moments = await this.momentRepository.findPublished({
            limit: limit * 2,
            offset,
            maxAgeHours
        })

        // Calcular scores "hot" (combinação de pontuação + recência)
        const hotMoments = await Promise.all(
            moments.map(async (moment) => {
                const baseScore = await moment.calculateSophisticatedScore()
                const recencyMultiplier = this.calculateRecencyMultiplier(moment.publishedAt || moment.createdAt)
                const hotScore = baseScore * recencyMultiplier
                
                const popularityDetails = await moment.getPopularityDetails()
                
                return {
                    moment,
                    score: hotScore,
                    popularityDetails
                }
            })
        )

        const sorted = hotMoments
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)

        return sorted.map((item, index) => ({
            moment: item.moment,
            score: item.score,
            ranking: index + 1,
            popularityDetails: item.popularityDetails
        }))
    }

    /**
     * Calcula multiplicador de recência para momentos "hot"
     */
    private calculateRecencyMultiplier(publishedAt: Date): number {
        const now = new Date()
        const hoursSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60)
        
        // Multiplicador decresce exponencialmente
        // 1.5x para 0-1 horas, 1.0x para 6 horas, 0.5x para 12 horas
        if (hoursSincePublished <= 1) return 1.5
        if (hoursSincePublished <= 6) return 1.0
        return Math.max(0.5, 1.0 - (hoursSincePublished - 6) * 0.083) // ~0.083 por hora após 6h
    }

    /**
     * Obtém ranking personalizado baseado no usuário
     */
    async getPersonalizedRanking(
        user: User, 
        options: MomentRankingOptions = {}
    ): Promise<MomentRankingResult[]> {
        // Implementação futura: combinar pontuação geral com preferências do usuário
        // Por enquanto, retornar ranking popular
        return this.getPopularMoments(options)
    }

    /**
     * Atualiza cache de pontuações (para implementação futura)
     */
    async refreshScoreCache(): Promise<void> {
        // Implementação futura: atualizar cache de pontuações em background
        console.log('[MomentRankingService] Cache refresh not implemented yet')
    }
}
