/**
 * Get User Metrics Use Case - Caso de uso para obter métricas do usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity } from "@/domain/user"

import { UserService } from "../services/user.service"

export interface GetUserMetricsRequest {
    userId: string
    requestingUserId: string // Para verificar permissões
    period?: "daily" | "weekly" | "monthly" | "yearly" | "all"
    includeAnalysis?: boolean
}

export interface UserMetricsData {
    userId: string
    activity: {
        loginCount: number
        profileViews: number
        profileEdits: number
        lastActiveAt?: Date
        averageSessionDuration: number
        totalSessions: number
    }
    social: {
        followersCount: number
        followingCount: number
        blockedCount: number
        totalInteractions: number
        socialScore: number
    }
    content: {
        momentsCreated: number
        totalLikes: number
        totalComments: number
        totalShares: number
        contentScore: number
    }
    engagement: {
        engagementScore: number
        retentionRate: number
        growthRate: number
        activityLevel: "low" | "medium" | "high"
    }
    behavior: {
        preferredDevices: string[]
        peakActivityHours: number[]
        averageSessionDuration: number
        sessionFrequency: number
    }
    performance: {
        viralScore: number
        influenceScore: number
        reachScore: number
        trendingScore: number
    }
    subscription?: {
        isActive: boolean
        plan: string
        startDate?: Date
        endDate?: Date
        upgrades: number
        downgrades: number
    }
    timeline: Array<{
        date: string
        activity: number
        engagement: number
        followers: number
    }>
}

export interface GetUserMetricsResponse {
    success: boolean
    metrics?: UserMetricsData
    analysis?: any
    error?: string
}

export class GetUserMetricsUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: GetUserMetricsRequest): Promise<GetUserMetricsResponse> {
        try {
            // Verificar permissões
            const canAccess = await this.canAccessMetrics(request.userId, request.requestingUserId)
            if (!canAccess) {
                return {
                    success: false,
                    error: "Acesso negado às métricas do usuário",
                }
            }

            // Buscar métricas do usuário
            let metricsData
            if (request.includeAnalysis) {
                const result = await this.userService.getMetricsWithAnalysis?.(request.userId)
                if (result) {
                    metricsData = result.metrics
                    return {
                        success: true,
                        metrics: this.formatMetricsData(metricsData),
                        analysis: result.analysis,
                    }
                }
            } else {
                metricsData = await this.userService.getMetrics?.(request.userId)
                if (metricsData) {
                    return {
                        success: true,
                        metrics: this.formatMetricsData(metricsData),
                    }
                }
            }

            // Se não encontrou métricas, criar dados básicos
            const user = await this.userService.getUserById(request.userId)
            if (!user) {
                return {
                    success: false,
                    error: "Usuário não encontrado",
                }
            }

            const basicMetrics = await this.createBasicMetrics(user)
            return {
                success: true,
                metrics: basicMetrics,
            }
        } catch (error: any) {
            console.error("Erro ao obter métricas do usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async canAccessMetrics(userId: string, requestingUserId: string): Promise<boolean> {
        // Apenas o próprio usuário pode ver suas métricas
        if (userId === requestingUserId) {
            return true
        }

        // Verificar se o usuário solicitante é admin
        const requestingUser = await this.userService.getUserById(requestingUserId)
        if (!requestingUser) {
            return false
        }

        // Apenas admins podem ver métricas de outros usuários
        return requestingUser.role === "admin" || requestingUser.role === "super_admin"
    }

    private formatMetricsData(metrics: any): UserMetricsData {
        return {
            userId: metrics.userId,
            activity: {
                loginCount: metrics.activity?.loginCount || 0,
                profileViews: metrics.activity?.profileViews || 0,
                profileEdits: metrics.activity?.profileEdits || 0,
                lastActiveAt: metrics.activity?.lastActiveAt,
                averageSessionDuration: metrics.activity?.averageSessionDuration || 0,
                totalSessions: metrics.activity?.totalSessions || 0,
            },
            social: {
                followersCount: metrics.social?.followersCount || 0,
                followingCount: metrics.social?.followingCount || 0,
                blockedCount: metrics.social?.blockedCount || 0,
                totalInteractions: metrics.social?.totalInteractions || 0,
                socialScore: metrics.social?.socialScore || 0,
            },
            content: {
                momentsCreated: metrics.content?.momentsCreated || 0,
                totalLikes: metrics.content?.totalLikes || 0,
                totalComments: metrics.content?.totalComments || 0,
                totalShares: metrics.content?.totalShares || 0,
                contentScore: metrics.content?.contentScore || 0,
            },
            engagement: {
                engagementScore: metrics.engagement?.engagementScore || 0,
                retentionRate: metrics.engagement?.retentionRate || 0,
                growthRate: metrics.engagement?.growthRate || 0,
                activityLevel: metrics.engagement?.activityLevel || "low",
            },
            behavior: {
                preferredDevices: metrics.behavior?.preferredDevices || [],
                peakActivityHours: metrics.behavior?.peakActivityHours || [],
                averageSessionDuration: metrics.behavior?.averageSessionDuration || 0,
                sessionFrequency: metrics.behavior?.sessionFrequency || 0,
            },
            performance: {
                viralScore: metrics.performance?.viralScore || 0,
                influenceScore: metrics.performance?.influenceScore || 0,
                reachScore: metrics.performance?.reachScore || 0,
                trendingScore: metrics.performance?.trendingScore || 0,
            },
            subscription: metrics.subscription
                ? {
                      isActive: metrics.subscription.isActive || false,
                      plan: metrics.subscription.plan || "free",
                      startDate: metrics.subscription.startDate,
                      endDate: metrics.subscription.endDate,
                      upgrades: metrics.subscription.upgrades || 0,
                      downgrades: metrics.subscription.downgrades || 0,
                  }
                : undefined,
            timeline: metrics.timeline || [],
        }
    }

    private async createBasicMetrics(user: UserEntity): Promise<UserMetricsData> {
        return {
            userId: user.id,
            activity: {
                loginCount: 0,
                profileViews: 0,
                profileEdits: 0,
                lastActiveAt: user.updatedAt,
                averageSessionDuration: 0,
                totalSessions: 0,
            },
            social: {
                followersCount: user.statistics?.followersCount || 0,
                followingCount: user.statistics?.followingCount || 0,
                blockedCount: 0,
                totalInteractions: 0,
                socialScore: 0,
            },
            content: {
                momentsCreated: user.statistics?.momentsCount || 0,
                totalLikes: user.statistics?.totalLikes || 0,
                totalComments: user.statistics?.totalComments || 0,
                totalShares: user.statistics?.totalShares || 0,
                contentScore: 0,
            },
            engagement: {
                engagementScore: 0,
                retentionRate: 0,
                growthRate: 0,
                activityLevel: "low",
            },
            behavior: {
                preferredDevices: [],
                peakActivityHours: [],
                averageSessionDuration: 0,
                sessionFrequency: 0,
            },
            performance: {
                viralScore: 0,
                influenceScore: 0,
                reachScore: 0,
                trendingScore: 0,
            },
            subscription: user.subscription
                ? {
                      isActive: user.subscription.isActive || false,
                      plan: user.subscription.plan || "free",
                      startDate: user.subscription.startDate,
                      endDate: user.subscription.endDate,
                      upgrades: 0,
                      downgrades: 0,
                  }
                : undefined,
            timeline: [],
        }
    }
}
