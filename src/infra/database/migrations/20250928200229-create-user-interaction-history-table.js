"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_interaction_history", {
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
            type: {
                type: Sequelize.ENUM(
                    "view",
                    "like",
                    "comment",
                    "report",
                    "completion",
                    "share",
                    "save",
                    "skip",
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
                allowNull: true,
                defaultValue: null,
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
        await queryInterface.addIndex("user_interaction_history", ["user_id"])
        await queryInterface.addIndex("user_interaction_history", ["moment_id"])
        await queryInterface.addIndex("user_interaction_history", ["type"])
        await queryInterface.addIndex("user_interaction_history", ["timestamp"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_interaction_history")
    },
}
