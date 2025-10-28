import { DataTypes, Model, Sequelize } from "sequelize"

import { Level } from "@/domain/authorization/authorization.type"
import { generateId } from "@/shared"

interface UserStatisticsAttributes {
    id?: bigint
    user_id: bigint

    // Métricas de Engajamento
    total_likes_received?: number
    total_views_received?: number
    total_shares_received?: number
    total_comments_received?: number

    // Métricas de Conteúdo
    total_memories_created?: number
    total_moments_created?: number

    // Métricas de Interação
    total_likes_given?: number
    total_comments_given?: number
    total_shares_given?: number
    total_follows_given?: number
    total_reports_given?: number

    // Métricas de Rede Social
    total_followers?: number
    total_following?: number
    total_relations?: number

    // Métricas de Retenção
    days_active_last_30?: number
    days_active_last_7?: number
    last_active_date?: Date
    current_streak_days?: number
    longest_streak_days?: number

    // Métricas de Tempo
    total_session_time_minutes?: number
    average_session_duration_minutes?: number
    total_time_spent_minutes?: number

    // Métricas de Qualidade
    engagement_rate?: number
    reach_rate?: number
    moments_quality_score?: number

    // Métricas de Crescimento
    moments_published_growth_rate_30d?: number
    memories_published_growth_rate_30d?: number
    follower_growth_rate_30d?: number
    engagement_growth_rate_30d?: number
    interactions_growth_rate_30d?: number

    // Métricas de Comportamento
    memories_per_day_average?: number
    moments_per_day_average?: number
    interactions_per_day_average?: number
    peak_activity_hour?: number
    preferred_content_type?: string

    // Métricas de Segurança
    reports_received?: number
    violations_count?: number
    warnings_count?: number
    last_moderation_action?: Date

    // Timestamps de Atualização
    last_metrics_update?: Date
    last_engagement_calculation?: Date
    last_retention_calculation?: Date
}

export default class UserStatistics
    extends Model<UserStatisticsAttributes>
    implements UserStatisticsAttributes
{
    declare readonly id: bigint
    declare user_id: bigint
    declare access_level?: Level
    declare verified?: boolean
    declare deleted?: boolean
    declare blocked?: boolean
    declare muted?: boolean

    // Métricas de Engajamento
    declare total_likes_received?: number
    declare total_views_received?: number
    declare total_shares_received?: number
    declare total_comments_received?: number

    // Métricas de Conteúdo
    declare total_memories_created?: number
    declare total_moments_created?: number

    // Métricas de Interação
    declare total_likes_given?: number
    declare total_comments_given?: number
    declare total_shares_given?: number
    declare total_follows_given?: number
    declare total_reports_given?: number

    // Métricas de Rede Social
    declare total_followers?: number
    declare total_following?: number
    declare total_relations?: number

    // Métricas de Retenção
    declare days_active_last_30?: number
    declare days_active_last_7?: number
    declare last_active_date?: Date
    declare current_streak_days?: number
    declare longest_streak_days?: number

    // Métricas de Tempo
    declare total_session_time_minutes?: number
    declare average_session_duration_minutes?: number
    declare total_time_spent_minutes?: number

    // Métricas de Qualidade
    declare engagement_rate?: number
    declare reach_rate?: number
    declare moments_quality_score?: number

    // Métricas de Crescimento
    declare moments_published_growth_rate_30d?: number
    declare memories_published_growth_rate_30d?: number
    declare follower_growth_rate_30d?: number
    declare engagement_growth_rate_30d?: number
    declare interactions_growth_rate_30d?: number

    // Métricas de Comportamento
    declare memories_per_day_average?: number
    declare moments_per_day_average?: number
    declare interactions_per_day_average?: number
    declare peak_activity_hour?: number
    declare preferred_content_type?: string

    // Timestamps de Atualização
    declare last_metrics_update?: Date
    declare last_engagement_calculation?: Date
    declare last_retention_calculation?: Date
    static initialize(sequelize: Sequelize) {
        UserStatistics.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },

                // Métricas de Engajamento
                total_likes_received: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de likes recebidos pelo usuário",
                },
                total_views_received: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de visualizações recebidas pelo usuário",
                },
                total_shares_received: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de compartilhamentos recebidos pelo usuário",
                },
                total_comments_received: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de comentários recebidos pelo usuário",
                },
                // Métricas de Conteúdo
                total_memories_created: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de memórias criadas pelo usuário",
                },
                total_moments_created: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de momentos criados pelo usuário",
                },

                // Métricas de Interação
                total_likes_given: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de likes dados pelo usuário",
                },
                total_comments_given: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de comentários dados pelo usuário",
                },
                total_shares_given: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de compartilhamentos dados pelo usuário",
                },
                total_follows_given: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de seguidores dados pelo usuário",
                },
                total_reports_given: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de reports dados pelo usuário",
                },

                // Métricas de Rede Social
                total_followers: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de seguidores do usuário",
                },
                total_following: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de pessoas que o usuário segue",
                },
                total_relations: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Total de relações do usuário",
                },

                // Métricas de Retenção
                days_active_last_30: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Dias ativos nos últimos 30 dias",
                },
                days_active_last_7: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Dias ativos nos últimos 7 dias",
                },
                last_active_date: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    comment: "Data da última atividade do usuário",
                },
                current_streak_days: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Sequência atual de dias ativos",
                },
                longest_streak_days: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Maior sequência de dias ativos",
                },

                // Métricas de Tempo
                total_session_time_minutes: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Tempo total de sessão em minutos",
                },
                average_session_duration_minutes: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Duração média de sessão em minutos",
                },
                total_time_spent_minutes: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Tempo total gasto na plataforma em minutos",
                },

                // Métricas de Qualidade
                engagement_rate: {
                    type: DataTypes.DECIMAL(5, 4),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Taxa de engajamento (0-1)",
                },
                reach_rate: {
                    type: DataTypes.DECIMAL(5, 4),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Taxa de alcance (0-1)",
                },
                moments_quality_score: {
                    type: DataTypes.DECIMAL(5, 4),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Score de qualidade dos momentos (0-1)",
                },

                // Métricas de Crescimento
                moments_published_growth_rate_30d: {
                    type: DataTypes.DECIMAL(5, 4),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Taxa de crescimento de momentos publicados nos últimos 30 dias",
                },
                memories_published_growth_rate_30d: {
                    type: DataTypes.DECIMAL(5, 4),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Taxa de crescimento de memórias publicadas nos últimos 30 dias",
                },
                follower_growth_rate_30d: {
                    type: DataTypes.DECIMAL(5, 4),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Taxa de crescimento de seguidores nos últimos 30 dias",
                },
                engagement_growth_rate_30d: {
                    type: DataTypes.DECIMAL(5, 4),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Taxa de crescimento de engajamento nos últimos 30 dias",
                },
                interactions_growth_rate_30d: {
                    type: DataTypes.DECIMAL(5, 4),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Taxa de crescimento de interações nos últimos 30 dias",
                },

                // Métricas de Comportamento
                memories_per_day_average: {
                    type: DataTypes.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Média de memórias por dia",
                },
                moments_per_day_average: {
                    type: DataTypes.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Média de momentos por dia",
                },
                interactions_per_day_average: {
                    type: DataTypes.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Média de interações por dia",
                },
                peak_activity_hour: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    comment: "Hora de pico de atividade (0-23)",
                },
                preferred_content_type: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                    comment: "Tipo de conteúdo preferido pelo usuário",
                },

                // Timestamps de Atualização
                last_metrics_update: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    comment: "Data da última atualização das métricas",
                },
                last_engagement_calculation: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    comment: "Data do último cálculo de engajamento",
                },
                last_retention_calculation: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    comment: "Data do último cálculo de retenção",
                },
            },
            {
                sequelize,
                modelName: "UserStatistics",
                tableName: "user_statistics",
                timestamps: true,
                createdAt: "created_at",
                updatedAt: "updated_at",
            },
        )

        // Removendo a criação automática do índice FULLTEXT
        // O índice será criado via migration
    }

    static associate(models: any) {
        if (models.User) {
            this.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
            })
        }
    }

    /**
     * Calcula a taxa de engajamento do usuário
     * @returns Taxa de engajamento (0-1)
     */
    calculateEngagementRate(): number {
        const totalInteractions =
            (this.total_likes_received || 0) +
            (this.total_comments_received || 0) +
            (this.total_shares_received || 0)

        const totalContent = (this.total_memories_created || 0) + (this.total_moments_created || 0)

        if (totalContent === 0) return 0
        return Math.min(1, totalInteractions / (totalContent * (this.total_followers || 1)))
    }

    /**
     * Calcula a taxa de alcance do usuário
     * @returns Taxa de alcance (0-1)
     */
    calculateReachRate(): number {
        const totalReach = (this.total_views_received || 0) + (this.total_shares_received || 0)

        const totalContent = (this.total_memories_created || 0) + (this.total_moments_created || 0)

        if (totalContent === 0) return 0
        return Math.min(1, totalReach / (totalContent * (this.total_followers || 1)))
    }

    /**
     * Calcula o coeficiente viral do usuário
     * @returns Coeficiente viral (0-1)
     */
    calculateViralCoefficient(): number {
        const shares = this.total_shares_received || 0
        const views = this.total_views_received || 0

        if (views === 0) return 0
        return Math.min(1, shares / views)
    }

    /**
     * Calcula o score de qualidade dos momentos
     * @returns Score de qualidade (0-1)
     */
    calculateMomentsQualityScore(): number {
        const engagementRate = this.calculateEngagementRate()
        const reachRate = this.calculateReachRate()
        const viralCoeff = this.calculateViralCoefficient()

        // Peso: engajamento 40%, alcance 35%, viral 25%
        return engagementRate * 0.4 + reachRate * 0.35 + viralCoeff * 0.25
    }

    /**
     * Atualiza métricas de engajamento
     * @param likesReceived Likes recebidos
     * @param viewsReceived Visualizações recebidas
     * @param sharesReceived Compartilhamentos recebidos
     * @param commentsReceived Comentários recebidos
     * @param savesReceived Salvamentos recebidos
     */
    async updateEngagementMetrics(
        likesReceived: number = 0,
        viewsReceived: number = 0,
        sharesReceived: number = 0,
        commentsReceived: number = 0,
    ): Promise<void> {
        await this.update({
            total_likes_received: (this.total_likes_received || 0) + likesReceived,
            total_views_received: (this.total_views_received || 0) + viewsReceived,
            total_shares_received: (this.total_shares_received || 0) + sharesReceived,
            total_comments_received: (this.total_comments_received || 0) + commentsReceived,
            engagement_rate: this.calculateEngagementRate(),
            reach_rate: this.calculateReachRate(),
            moments_quality_score: this.calculateMomentsQualityScore(),
            last_engagement_calculation: new Date(),
            last_metrics_update: new Date(),
        })
    }

    /**
     * Atualiza métricas de conteúdo criado
     * @param memoriesCreated Memórias criadas
     * @param momentsCreated Momentos criados
     */
    async updateContentMetrics(
        memoriesCreated: number = 0,
        momentsCreated: number = 0,
    ): Promise<void> {
        await this.update({
            total_memories_created: (this.total_memories_created || 0) + memoriesCreated,
            total_moments_created: (this.total_moments_created || 0) + momentsCreated,
            moments_quality_score: this.calculateMomentsQualityScore(),
            last_metrics_update: new Date(),
        })
    }

    /**
     * Atualiza métricas de rede social
     * @param followersChange Mudança no número de seguidores
     * @param followingChange Mudança no número de seguindo
     */
    async updateSocialMetrics(
        followersChange: number = 0,
        followingChange: number = 0,
    ): Promise<void> {
        await this.update({
            total_followers: Math.max(0, (this.total_followers || 0) + followersChange),
            total_following: Math.max(0, (this.total_following || 0) + followingChange),
            last_metrics_update: new Date(),
        })
    }

    /**
     * Atualiza métricas de atividade e retenção
     * @param sessionTimeMinutes Tempo de sessão em minutos
     */
    async updateActivityMetrics(sessionTimeMinutes: number = 0): Promise<void> {
        const now = new Date()
        const lastActive = this.last_active_date ? new Date(this.last_active_date) : null

        // Calcular dias ativos
        const daysActive30 = this.calculateDaysActive(30)
        const daysActive7 = this.calculateDaysActive(7)

        // Atualizar streak
        const currentStreak = this.calculateCurrentStreak()

        await this.update({
            total_session_time_minutes: (this.total_session_time_minutes || 0) + sessionTimeMinutes,
            total_time_spent_minutes: (this.total_time_spent_minutes || 0) + sessionTimeMinutes,
            days_active_last_30: daysActive30,
            days_active_last_7: daysActive7,
            last_active_date: now,
            current_streak_days: currentStreak,
            longest_streak_days: Math.max(this.longest_streak_days || 0, currentStreak),
            last_retention_calculation: new Date(),
            last_metrics_update: new Date(),
        })
    }

    /**
     * Calcula dias ativos em um período específico
     * @param days Número de dias para calcular
     * @returns Número de dias ativos
     */
    private calculateDaysActive(days: number): number {
        // Implementação simplificada - em produção seria baseada em logs de atividade
        const lastActive = this.last_active_date ? new Date(this.last_active_date) : new Date()
        const daysSinceLastActive = Math.floor(
            (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
        )

        if (daysSinceLastActive <= days) {
            return Math.max(1, days - daysSinceLastActive)
        }
        return 0
    }

    /**
     * Calcula a sequência atual de dias ativos
     * @returns Número de dias na sequência atual
     */
    private calculateCurrentStreak(): number {
        const lastActive = this.last_active_date ? new Date(this.last_active_date) : new Date()
        const daysSinceLastActive = Math.floor(
            (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
        )

        if (daysSinceLastActive <= 1) {
            return (this.current_streak_days || 0) + 1
        }
        return 0
    }

    /**
     * Retorna um resumo das métricas principais
     * @returns Objeto com métricas principais
     */
    getMetricsSummary(): {
        engagement: {
            rate: number
            totalLikes: number
            totalViews: number
            totalShares: number
        }
        content: {
            totalMemories: number
            totalMoments: number
            qualityScore: number
        }
        social: {
            followers: number
            following: number
            viralCoeff: number
        }
        retention: {
            daysActive30: number
            daysActive7: number
            currentStreak: number
            longestStreak: number
        }
    } {
        return {
            engagement: {
                rate: this.calculateEngagementRate(),
                totalLikes: this.total_likes_received || 0,
                totalViews: this.total_views_received || 0,
                totalShares: this.total_shares_received || 0,
            },
            content: {
                totalMemories: this.total_memories_created || 0,
                totalMoments: this.total_moments_created || 0,
                qualityScore: this.calculateMomentsQualityScore(),
            },
            social: {
                followers: this.total_followers || 0,
                following: this.total_following || 0,
                viralCoeff: this.calculateViralCoefficient(),
            },
            retention: {
                daysActive30: this.days_active_last_30 || 0,
                daysActive7: this.days_active_last_7 || 0,
                currentStreak: this.current_streak_days || 0,
                longestStreak: this.longest_streak_days || 0,
            },
        }
    }
}
