"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        // Adicionar campo status (diferente de moderation_status)
        await queryInterface.addColumn("moment_comments", "status", {
            type: Sequelize.ENUM(
                "active",
                "hidden",
                "deleted",
                "flagged",
                "under_review",
                "approved",
                "rejected",
            ),
            allowNull: false,
            defaultValue: "active",
        })

        // Adicionar campo visibility
        await queryInterface.addColumn("moment_comments", "visibility", {
            type: Sequelize.ENUM("public", "followers_only", "private", "hidden"),
            allowNull: false,
            defaultValue: "public",
        })

        // Adicionar campo category
        await queryInterface.addColumn("moment_comments", "category", {
            type: Sequelize.ENUM(
                // Categorias positivas
                "positive",
                "supportive",
                "constructive",
                "informative",
                "funny",
                "creative",
                // Categorias neutras
                "neutral",
                "question",
                "clarification",
                "off_topic",
                // Categorias negativas
                "negative",
                "spam",
                "harassment",
                "hate_speech",
                "inappropriate",
                "misleading",
                "trolling",
                "advertising",
                // Categorias técnicas
                "technical_issue",
                "feature_request",
                "bug_report",
            ),
            allowNull: false,
            defaultValue: "neutral",
        })

        // Adicionar campo severity
        await queryInterface.addColumn("moment_comments", "severity", {
            type: Sequelize.ENUM("low", "medium", "high", "critical"),
            allowNull: false,
            defaultValue: "low",
        })

        // Adicionar métricas
        await queryInterface.addColumn("moment_comments", "likes_count", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        })

        await queryInterface.addColumn("moment_comments", "replies_count", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        })

        await queryInterface.addColumn("moment_comments", "reports_count", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        })

        await queryInterface.addColumn("moment_comments", "views_count", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        })

        // Adicionar campos de moderação
        await queryInterface.addColumn("moment_comments", "moderation_flags", {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
        })

        await queryInterface.addColumn("moment_comments", "moderation_score", {
            type: Sequelize.FLOAT,
            allowNull: false,
            defaultValue: 0,
        })

        await queryInterface.addColumn("moment_comments", "is_moderated", {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        })

        await queryInterface.addColumn("moment_comments", "moderated_at", {
            type: Sequelize.DATE,
            allowNull: true,
        })

        await queryInterface.addColumn("moment_comments", "moderated_by", {
            type: Sequelize.STRING,
            allowNull: true,
        })

        // Adicionar metadados
        await queryInterface.addColumn("moment_comments", "mentions", {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: false,
            defaultValue: [],
        })

        await queryInterface.addColumn("moment_comments", "hashtags", {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: false,
            defaultValue: [],
        })

        await queryInterface.addColumn("moment_comments", "metadata", {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: {},
        })

        // Adicionar índices para melhor performance
        await queryInterface.addIndex("moment_comments", ["status"], {
            name: "moment_comments_status",
        })

        await queryInterface.addIndex("moment_comments", ["category"], {
            name: "moment_comments_category",
        })

        await queryInterface.addIndex("moment_comments", ["visibility"], {
            name: "moment_comments_visibility",
        })

        await queryInterface.addIndex("moment_comments", ["is_moderated"], {
            name: "moment_comments_is_moderated",
        })

        await queryInterface.addIndex("moment_comments", ["severity"], {
            name: "moment_comments_severity",
        })

        await queryInterface.addIndex("moment_comments", ["likes_count"], {
            name: "moment_comments_likes_count",
        })

        await queryInterface.addIndex("moment_comments", ["mentions"], {
            name: "moment_comments_mentions",
            using: "GIN",
        })

        await queryInterface.addIndex("moment_comments", ["hashtags"], {
            name: "moment_comments_hashtags",
            using: "GIN",
        })
    },

    async down(queryInterface, Sequelize) {
        // Remover índices
        await queryInterface.removeIndex("moment_comments", "moment_comments_hashtags")
        await queryInterface.removeIndex("moment_comments", "moment_comments_mentions")
        await queryInterface.removeIndex("moment_comments", "moment_comments_likes_count")
        await queryInterface.removeIndex("moment_comments", "moment_comments_severity")
        await queryInterface.removeIndex("moment_comments", "moment_comments_is_moderated")
        await queryInterface.removeIndex("moment_comments", "moment_comments_visibility")
        await queryInterface.removeIndex("moment_comments", "moment_comments_category")
        await queryInterface.removeIndex("moment_comments", "moment_comments_status")

        // Remover colunas
        await queryInterface.removeColumn("moment_comments", "metadata")
        await queryInterface.removeColumn("moment_comments", "hashtags")
        await queryInterface.removeColumn("moment_comments", "mentions")
        await queryInterface.removeColumn("moment_comments", "moderated_by")
        await queryInterface.removeColumn("moment_comments", "moderated_at")
        await queryInterface.removeColumn("moment_comments", "is_moderated")
        await queryInterface.removeColumn("moment_comments", "moderation_score")
        await queryInterface.removeColumn("moment_comments", "moderation_flags")
        await queryInterface.removeColumn("moment_comments", "views_count")
        await queryInterface.removeColumn("moment_comments", "reports_count")
        await queryInterface.removeColumn("moment_comments", "replies_count")
        await queryInterface.removeColumn("moment_comments", "likes_count")
        await queryInterface.removeColumn("moment_comments", "severity")
        await queryInterface.removeColumn("moment_comments", "category")
        await queryInterface.removeColumn("moment_comments", "visibility")
        await queryInterface.removeColumn("moment_comments", "status")
    },
}

