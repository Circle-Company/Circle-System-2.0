"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_metrics", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            moment_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: "moments",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            // Métricas de visualização
            total_views: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            unique_views: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            repeat_views: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            completion_views: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            average_watch_time: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            average_completion_rate: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            bounce_rate: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            // Métricas de engajamento
            total_likes: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            total_comments: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            total_reports: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            like_rate: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            comment_rate: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            report_rate: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            // Métricas de cliques (campos utilizados no repositório)
            total_clicks: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            click_rate: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            // Métricas de performance
            load_time: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            buffer_time: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            error_rate: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            // Métricas de viralidade
            viral_score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            total_reach: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            // Métricas de qualidade
            content_quality_score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            // Metadados
            last_metrics_update: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            metrics_version: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: "1.0.0",
            },
            data_quality: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 100,
            },
            confidence_level: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 100,
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
        await queryInterface.addIndex("moment_metrics", ["moment_id"])
        await queryInterface.addIndex("moment_metrics", ["total_views"])
        await queryInterface.addIndex("moment_metrics", ["viral_score"])
        await queryInterface.addIndex("moment_metrics", ["last_metrics_update"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_metrics")
    },
}
