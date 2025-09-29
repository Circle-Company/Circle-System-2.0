"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_interaction_events", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            entity_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            entity_type: {
                type: Sequelize.ENUM("user", "post"),
                allowNull: false,
            },
            type: {
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
                ),
                allowNull: false,
            },
            timestamp: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            metadata: {
                type: Sequelize.JSON,
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
        await queryInterface.addIndex("swipe_interaction_events", ["user_id"])
        await queryInterface.addIndex("swipe_interaction_events", ["entity_id", "entity_type"])
        await queryInterface.addIndex("swipe_interaction_events", ["timestamp"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_interaction_events")
    },
}
