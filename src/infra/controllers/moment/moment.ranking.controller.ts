/**
 * Moment Ranking Controller
 * Controller para endpoints de ranking e pontuação de momentos
 */

import { MomentRankingService, MomentRankingOptions } from "@/application/moment/services/moment.ranking.service"
import { HttpRequest, HttpResponse } from "@/infra/http/http.type"

export class MomentRankingController {
    constructor(private readonly rankingService: MomentRankingService) {}

    /**
     * GET /moments/ranking/popular
     * Obtém momentos mais populares
     */
    async getPopularMoments(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const options: MomentRankingOptions = {
                limit: request.query.limit ? parseInt(request.query.limit as string) : 20,
                offset: request.query.offset ? parseInt(request.query.offset as string) : 0,
                minScore: request.query.minScore ? parseFloat(request.query.minScore as string) : 10.0,
                maxAgeHours: request.query.maxAgeHours ? parseInt(request.query.maxAgeHours as string) : 168,
            }

            const results = await this.rankingService.getPopularMoments(options)

            return response.status(200).send({
                success: true,
                data: {
                    moments: results.map(item => ({
                        id: item.moment.id,
                        description: item.moment.description,
                        author: {
                            id: item.moment.author.id,
                            username: item.moment.author.username,
                        },
                        score: Math.round(item.score * 100) / 100,
                        ranking: item.ranking,
                        popularityDetails: item.popularityDetails,
                        publishedAt: item.moment.publishedAt,
                        createdAt: item.moment.createdAt,
                    })),
                    pagination: {
                        limit: options.limit,
                        offset: options.offset,
                        total: results.length,
                    },
                    algorithm: {
                        type: 'popular',
                        description: 'Sistema de pontuação sofisticado com engajamento e decaimento temporal',
                        factors: [
                            'Visualizações e visualizações completas',
                            'Likes, comentários e shares',
                            'Penalização por reports',
                            'Decaimento exponencial por tempo (meia-vida: 24h)'
                        ]
                    }
                }
            })
        } catch (error) {
            console.error('[MomentRankingController] Erro ao buscar momentos populares:', error)
            return response.status(500).send({
                success: false,
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            })
        }
    }

    /**
     * GET /moments/ranking/trending
     * Obtém momentos trending (crescimento rápido)
     */
    async getTrendingMoments(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const options: MomentRankingOptions = {
                limit: request.query.limit ? parseInt(request.query.limit as string) : 20,
                offset: request.query.offset ? parseInt(request.query.offset as string) : 0,
                maxAgeHours: request.query.maxAgeHours ? parseInt(request.query.maxAgeHours as string) : 48,
            }

            const results = await this.rankingService.getTrendingMoments(options)

            return response.status(200).send({
                success: true,
                data: {
                    moments: results.map(item => ({
                        id: item.moment.id,
                        description: item.moment.description,
                        author: {
                            id: item.moment.author.id,
                            username: item.moment.author.username,
                        },
                        score: Math.round(item.score * 100) / 100,
                        ranking: item.ranking,
                        popularityDetails: item.popularityDetails,
                        publishedAt: item.moment.publishedAt,
                        createdAt: item.moment.createdAt,
                    })),
                    pagination: {
                        limit: options.limit,
                        offset: options.offset,
                        total: results.length,
                    },
                    algorithm: {
                        type: 'trending',
                        description: 'Algoritmo de trending baseado em velocidade de crescimento',
                        factors: [
                            'Velocidade de crescimento (40%)',
                            'Recência (30%)',
                            'Engajamento (30%)',
                            'Janela temporal: 2h para velocidade, 24h para trending'
                        ]
                    }
                }
            })
        } catch (error) {
            console.error('[MomentRankingController] Erro ao buscar momentos trending:', error)
            return response.status(500).send({
                success: false,
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            })
        }
    }

    /**
     * GET /moments/ranking/hot
     * Obtém momentos "hot" (alta atividade recente)
     */
    async getHotMoments(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const options: MomentRankingOptions = {
                limit: request.query.limit ? parseInt(request.query.limit as string) : 20,
                offset: request.query.offset ? parseInt(request.query.offset as string) : 0,
                maxAgeHours: request.query.maxAgeHours ? parseInt(request.query.maxAgeHours as string) : 12,
            }

            const results = await this.rankingService.getHotMoments(options)

            return response.status(200).send({
                success: true,
                data: {
                    moments: results.map(item => ({
                        id: item.moment.id,
                        description: item.moment.description,
                        author: {
                            id: item.moment.author.id,
                            username: item.moment.author.username,
                        },
                        score: Math.round(item.score * 100) / 100,
                        ranking: item.ranking,
                        popularityDetails: item.popularityDetails,
                        publishedAt: item.moment.publishedAt,
                        createdAt: item.moment.createdAt,
                    })),
                    pagination: {
                        limit: options.limit,
                        offset: options.offset,
                        total: results.length,
                    },
                    algorithm: {
                        type: 'hot',
                        description: 'Momentos com alta atividade nas últimas horas',
                        factors: [
                            'Pontuação sofisticada base',
                            'Multiplicador de recência',
                            'Janela temporal: 12 horas',
                            'Peso maior para conteúdo muito recente'
                        ]
                    }
                }
            })
        } catch (error) {
            console.error('[MomentRankingController] Erro ao buscar momentos hot:', error)
            return response.status(500).send({
                success: false,
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            })
        }
    }

    /**
     * GET /moments/:id/scoring
     * Obtém detalhes da pontuação de um momento específico
     */
    async getMomentScoring(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const momentId = request.params.id
            
            // Buscar momento
            // TODO: Implementar busca por ID no ranking service
            
            return response.status(200).send({
                success: true,
                data: {
                    message: 'Endpoint em desenvolvimento',
                    momentId,
                    note: 'Implementar busca por ID e cálculo de pontuação individual'
                }
            })
        } catch (error) {
            console.error('[MomentRankingController] Erro ao obter pontuação do momento:', error)
            return response.status(500).send({
                success: false,
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            })
        }
    }
}
