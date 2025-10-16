/**
 * Exemplo de uso do SwipeEngine
 *
 * Este arquivo demonstra como integrar o sistema de recomendações
 */

import {
    IClusterRepository,
    IInteractionRepository,
    IMomentEmbeddingRepository,
    IUserEmbeddingRepository,
} from "../core/repositories"
import {
    RecommendationEngine,
    RecommendationEngineConfig,
    createRecommendationEngine,
} from "../index"

// ============================================
// 1. IMPLEMENTAR REPOSITÓRIOS
// ============================================

/**
 * Exemplo de implementação de repositório
 * Na prática, estes repositórios fariam chamadas ao banco de dados
 */
class MockUserEmbeddingRepository implements IUserEmbeddingRepository {
    private embeddings = new Map()

    async findByUserId(userId: string) {
        return this.embeddings.get(userId) || null
    }

    async save(embedding: any) {
        this.embeddings.set(embedding.userId, embedding)
        return embedding
    }

    async findByUserIds(userIds: string[]) {
        return userIds.map((id) => this.embeddings.get(id)).filter(Boolean)
    }

    async findAll(limit: number, offset: number) {
        return Array.from(this.embeddings.values()).slice(offset, offset + limit)
    }

    async delete(userId: string) {
        return this.embeddings.delete(userId)
    }

    async count() {
        return this.embeddings.size
    }
}

// Implementações similares para outros repositórios...

// ============================================
// 2. CONFIGURAR O ENGINE
// ============================================

const config: RecommendationEngineConfig = {
    repositories: {
        userEmbedding: new MockUserEmbeddingRepository(),
        momentEmbedding: {} as IMomentEmbeddingRepository, // Usar implementação real
        cluster: {} as IClusterRepository, // Usar implementação real
        interaction: {} as IInteractionRepository, // Usar implementação real
    },
    params: {
        embedding: {
            timeWindows: {
                recentEmbeddingUpdate: 24 * 60 * 60 * 1000, // 24 horas
                interactionHistory: 30 * 24 * 60 * 60 * 1000, // 30 dias
            },
            dimensions: {
                embedding: 128,
                interactionHistory: 50,
                contentPreferences: 20,
                socialFeatures: 30,
            },
            weights: {
                content: {
                    text: 0.5,
                    tags: 0.3,
                    engagement: 0.2,
                },
                interactions: {
                    view: 0.1,
                    like: 0.3,
                    comment: 0.5,
                    share: 0.7,
                    save: 0.6,
                    default: 0.2,
                },
                update: {
                    default: 0.1,
                },
            },
            similarity: {
                defaultLimit: 10,
                minimumThreshold: 0.7,
            },
            batchProcessing: {
                size: 100,
            },
            normalization: {
                engagementLogBase: 10,
                engagementScaleFactor: 5,
            },
            decay: {
                interactionWeight: {
                    base: 24,
                    minimum: 0.1,
                },
            },
            feedback: {
                interactionStrengths: {
                    view: 0.1,
                    completion: 0.3,
                    like: 0.5,
                    comment: 0.4,
                    share: 0.8,
                    save: 0.6,
                    report: -0.8,
                    skip: -0.5,
                },
                learningRates: {
                    user: {
                        highPriority: 0.1,
                        normal: 0.05,
                    },
                    post: {
                        highPriority: 0.05,
                        normal: 0.02,
                        networkEffect: 0.005,
                    },
                },
                engagement: {
                    timeThresholds: {
                        short: 5,
                        medium: 30,
                        long: 60,
                    },
                    watchPercentages: {
                        low: 0.2,
                        high: 0.8,
                    },
                    timeMultipliers: {
                        short: 0.5,
                        long: 1.5,
                    },
                    watchMultipliers: {
                        low: 0.7,
                        high: 1.3,
                    },
                },
                networkEffects: {
                    similarPostsLimit: 5,
                    similarityThreshold: 0.8,
                },
                highPriorityInteractions: ["like", "share", "comment", "report"],
            },
            candidateSelector: {
                weights: {
                    clusterScore: 0.4,
                    recency: 0.3,
                    engagement: 0.2,
                    random: 0.1,
                },
                thresholds: {
                    minimumClusterScore: 0.2,
                    timeWindow: 24 * 7,
                    defaultLimit: 30,
                    bufferSize: 5,
                },
            },
        },
        ranking: {
            weights: {
                relevance: 0.4,
                engagement: 0.25,
                novelty: 0.15,
                diversity: 0.1,
                context: 0.1,
            },
            noveltyLevel: 0.3,
            diversityLevel: 0.4,
            decay: {
                interactionWeight: 24,
                minimum: 0.1,
            },
            defaultScores: {
                relevance: 0.5,
                engagement: 0.5,
                novelty: 0.5,
                diversity: 0.5,
                context: 0.5,
            },
            diversityWeights: {
                tags: 0.6,
                engagement: 0.4,
            },
            contextWeights: {
                peakHours: 0.3,
                lowEngagementHours: 0.1,
                normalHours: 0.2,
                weekend: 0.3,
                midWeek: 0.2,
                weekStartEnd: 0.25,
                sameLocation: 0.3,
                differentLocation: 0.1,
            },
            maxTags: 10,
        },
        clusterRanking: {} as any, // Adicionar configuração completa
        dbscan: {
            epsilon: 0.3,
            minPoints: 5,
            weights: {},
            distanceFunction: "cosine",
            randomSeed: 42,
            initMethod: "k-means++",
            threshold: 0.001,
        },
    },
}

// ============================================
// 3. CRIAR INSTÂNCIA DO ENGINE
// ============================================

const engine = createRecommendationEngine(config)

// ============================================
// 4. USAR O ENGINE
// ============================================

async function exemploDeUso() {
    // Obter recomendações para um usuário
    const recommendations = await engine.getRecommendations({
        userId: "user123",
        limit: 20,
        excludeMomentIds: ["moment1", "moment2"],
        context: {
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            location: "BR",
            device: "mobile",
        },
    })

    console.log("Recomendações:", recommendations)

    // Processar uma interação
    await engine.processInteraction("user123", "moment456", "like")

    // Nota: A criação de momentos e geração de embeddings deve ser feita
    // pela camada de aplicação usando a entidade Moment do domínio

    // Re-clusterizar todos os momentos (executar periodicamente)
    await engine.reclusterMoments()
}

// ============================================
// 5. INTEGRAÇÃO COM CONTROLLER
// ============================================

/**
 * Exemplo de integração em um controller HTTP
 */
export class RecommendationController {
    constructor(private engine: RecommendationEngine) {}

    async getFeed(userId: string, limit: number = 20) {
        try {
            const recommendations = await this.engine.getRecommendations({
                userId,
                limit,
                context: {
                    timeOfDay: new Date().getHours(),
                    dayOfWeek: new Date().getDay(),
                },
            })

            return {
                success: true,
                data: recommendations,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            }
        }
    }

    async recordInteraction(userId: string, momentId: string, type: string) {
        try {
            await this.engine.processInteraction(userId, momentId, type)

            return {
                success: true,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            }
        }
    }
}

// ============================================
// 6. JOB PERIÓDICO DE RE-CLUSTERIZAÇÃO
// ============================================

/**
 * Job para executar re-clusterização periodicamente
 * Executar diariamente ou semanalmente dependendo do volume
 */
export async function dailyReclusteringJob() {
    console.log("Iniciando job de re-clusterização...")

    try {
        await engine.reclusterMoments()
        console.log("Re-clusterização concluída com sucesso")
    } catch (error) {
        console.error("Erro na re-clusterização:", error)
    }
}

// Agendar para executar diariamente às 3h da manhã
// cron.schedule('0 3 * * *', dailyReclusteringJob)

export { exemploDeUso }
