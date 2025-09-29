"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_preferences", {
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
            app_language: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "pt",
            },
            app_timezone: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: -3,
            },
            disable_autoplay: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            disable_haptics: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            disable_translation: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            translation_language: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "pt",
            },
            disable_like_moment_push_notification: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            disable_new_memory_push_notification: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            disable_add_to_memory_push_notification: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            disable_follow_user_push_notification: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            disable_view_user_push_notification: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            disable_news_push_notification: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            disable_sugestions_push_notification: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            disable_around_you_push_notification: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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

        // Índices serão criados automaticamente pelo Sequelize quando necessário
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_preferences")
    },
}
