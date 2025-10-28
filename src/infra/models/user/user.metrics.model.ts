import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface UserMetricsAttributes {
    id?: bigint
    user_id: bigint

    // Métricas de Engajamento
    total_likes_received?: number
    total_views_received?: number
    total_shares_received?: number
    total_comments_received?: number
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
    follower_growth_rate_30d?: number
    engagement_growth_rate_30d?: number
    interactions_growth_rate_30d?: number

    // Métricas de Comportamento
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

export default class UserMetrics extends Model<UserMetricsAttributes> implements UserMetricsAttributes {
    declare readonly id: bigint
    declare user_id: bigint

    // Métricas de Engajamento
    declare total_likes_received?: number
    declare total_views_received?: number
    declare total_shares_received?: number
    declare total_comments_received?: number
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
    declare follower_growth_rate_30d?: number
    declare engagement_growth_rate_30d?: number
    declare interactions_growth_rate_30d?: number

    // Métricas de Comportamento
    declare moments_per_day_average?: number
    declare interactions_per_day_average?: number
    declare peak_activity_hour?: number
    declare preferred_content_type?: string

    // Métricas de Segurança
    declare reports_received?: number
    declare violations_count?: number
    declare warnings_count?: number
    declare last_moderation_action?: Date

    // Timestamps de Atualização
    declare last_metrics_update?: Date
    declare last_engagement_calculation?: Date
    declare last_retention_calculation?: Date

    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize) {
        UserMetrics.init(
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
                total_likes_received: DataTypes.INTEGER,
                total_views_received: DataTypes.INTEGER,
                total_shares_received: DataTypes.INTEGER,
                total_comments_received: DataTypes.INTEGER,
                total_moments_created: DataTypes.INTEGER,
                total_likes_given: DataTypes.INTEGER,
                total_comments_given: DataTypes.INTEGER,
                total_shares_given: DataTypes.INTEGER,
                total_follows_given: DataTypes.INTEGER,
                total_reports_given: DataTypes.INTEGER,
                total_followers: DataTypes.INTEGER,
                total_following: DataTypes.INTEGER,
                total_relations: DataTypes.INTEGER,
                days_active_last_30: DataTypes.INTEGER,
                days_active_last_7: DataTypes.INTEGER,
                last_active_date: DataTypes.DATE,
                current_streak_days: DataTypes.INTEGER,
                longest_streak_days: DataTypes.INTEGER,
                total_session_time_minutes: DataTypes.INTEGER,
                average_session_duration_minutes: DataTypes.FLOAT,
                total_time_spent_minutes: DataTypes.INTEGER,
                engagement_rate: DataTypes.FLOAT,
                reach_rate: DataTypes.FLOAT,
                moments_quality_score: DataTypes.FLOAT,
                moments_published_growth_rate_30d: DataTypes.FLOAT,
                follower_growth_rate_30d: DataTypes.FLOAT,
                engagement_growth_rate_30d: DataTypes.FLOAT,
                interactions_growth_rate_30d: DataTypes.FLOAT,
                moments_per_day_average: DataTypes.FLOAT,
                interactions_per_day_average: DataTypes.FLOAT,
                peak_activity_hour: DataTypes.INTEGER,
                preferred_content_type: DataTypes.STRING,
                reports_received: DataTypes.INTEGER,
                violations_count: DataTypes.INTEGER,
                warnings_count: DataTypes.INTEGER,
                last_moderation_action: DataTypes.DATE,
                last_metrics_update: DataTypes.DATE,
                last_engagement_calculation: DataTypes.DATE,
                last_retention_calculation: DataTypes.DATE,
            },
            {
                sequelize,
                modelName: "UserMetrics",
                tableName: "user_metrics",
                timestamps: true,
                createdAt: "created_at",
                updatedAt: "updated_at",
            },
        )
    }

    static associate(models: any) {
        if (models.User) {
            this.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "metrics",
            })
        }
    }
}

