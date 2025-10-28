"use strict"

export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            "moment_views",
            {
                id: {
                    type: Sequelize.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                moment_id: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                    comment: "ID do momento visualizado",
                },
                viewer_id: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                    comment: "ID do usuário que visualizou",
                },
                view_timestamp: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.NOW,
                    comment: "Timestamp da visualização",
                },
                view_duration: {
                    type: Sequelize.FLOAT,
                    allowNull: true,
                    comment: "Duração da visualização em segundos",
                },
                view_source: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    comment: "Fonte da visualização (feed, search, profile, etc.)",
                },
                is_complete: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    comment: "Se a visualização foi completa (80%+ do vídeo)",
                },
                device_type: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                    comment: "Tipo do dispositivo (mobile, desktop, tablet)",
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
            },
            {
                comment: "Tabela para armazenar visualizações de momentos",
            },
        )

        // Criar índices para melhor performance
        await queryInterface.addIndex("moment_views", {
            fields: ["moment_id"],
            name: "idx_moment_views_moment_id",
        })

        await queryInterface.addIndex("moment_views", {
            fields: ["viewer_id"],
            name: "idx_moment_views_viewer_id",
        })

        await queryInterface.addIndex("moment_views", {
            fields: ["view_timestamp"],
            name: "idx_moment_views_timestamp",
        })

        await queryInterface.addIndex("moment_views", {
            fields: ["moment_id", "viewer_id"],
            name: "idx_moment_views_moment_viewer",
        })

        await queryInterface.addIndex("moment_views", {
            fields: ["is_complete"],
            name: "idx_moment_views_complete",
        })

        // Índice composto para consultas de estatísticas
        await queryInterface.addIndex("moment_views", {
            fields: ["moment_id", "view_timestamp", "is_complete"],
            name: "idx_moment_views_stats",
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_views")
    },
}
