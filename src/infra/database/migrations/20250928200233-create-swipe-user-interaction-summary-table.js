"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_user_interaction_summary", {
            user_id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            total_interactions: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            last_interaction_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            interaction_counts: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: {},
                comment: "Contagem de cada tipo de interação",
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
        await queryInterface.addIndex("swipe_user_interaction_summary", ["total_interactions"])
        await queryInterface.addIndex("swipe_user_interaction_summary", ["last_interaction_date"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_user_interaction_summary")
    },
}
