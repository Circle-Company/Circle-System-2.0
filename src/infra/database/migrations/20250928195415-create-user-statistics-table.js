"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_statistics", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            // Métricas de Engajamento
            total_likes_received: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_views_received: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_shares_received: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_comments_received: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            // Métricas de Conteúdo
            total_memories_created: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_moments_created: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            // Métricas de Interação
            total_likes_given: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_comments_given: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_shares_given: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_follows_given: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_reports_given: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            // Métricas de Rede Social
            total_followers: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_following: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            total_relations: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            // Métricas de Retenção
            days_active_last_30: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            days_active_last_7: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            last_active_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            current_streak_days: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            longest_streak_days: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            // Métricas de Tempo
            total_session_time_minutes: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            average_session_duration_minutes: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            total_time_spent_minutes: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            // Métricas de Qualidade
            engagement_rate: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            reach_rate: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            moments_quality_score: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            // Métricas de Crescimento
            moments_published_growth_rate_30d: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            memories_published_growth_rate_30d: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            follower_growth_rate_30d: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            engagement_growth_rate_30d: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            interactions_growth_rate_30d: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            // Métricas de Comportamento
            memories_per_day_average: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            moments_per_day_average: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            interactions_per_day_average: {
                type: Sequelize.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            peak_activity_hour: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            preferred_content_type: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            // Métricas de Segurança
            reports_received: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            violations_count: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            warnings_count: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            last_moderation_action: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            // Timestamps de Atualização
            last_metrics_update: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            last_engagement_calculation: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            last_retention_calculation: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        })

        // Índices
        await queryInterface.addIndex("user_statistics", ["user_id"])
        await queryInterface.addIndex("user_statistics", ["total_followers"])
        await queryInterface.addIndex("user_statistics", ["total_likes_received"])
        await queryInterface.addIndex("user_statistics", ["last_active_date"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_statistics")
    },
}
