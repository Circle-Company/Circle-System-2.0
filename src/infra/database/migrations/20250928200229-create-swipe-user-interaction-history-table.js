"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_user_interaction_history", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true,
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
            entity_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
            },
            interaction_type: {
                type: Sequelize.ENUM(
                    "short_view",
                    "long_view",
                    "like",
                    "dislike",
                    "share",
                    "comment",
                    "like_comment",
                    "show_less_often",
                    "report",
                    "save",
                    "click",
                ),
                allowNull: false,
            },
            interaction_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: {},
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
        await queryInterface.addIndex("swipe_user_interaction_history", ["user_id"])
        await queryInterface.addIndex("swipe_user_interaction_history", ["entity_id"])
        await queryInterface.addIndex("swipe_user_interaction_history", ["interaction_type"])
        await queryInterface.addIndex("swipe_user_interaction_history", ["interaction_date"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_user_interaction_history")
    },
}
