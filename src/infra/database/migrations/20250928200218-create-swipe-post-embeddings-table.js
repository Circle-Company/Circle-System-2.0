"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_post_embeddings", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            post_id: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: "moments",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            vector: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: "Vetor de embedding serializado em JSON",
            },
            dimension: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 128,
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
        await queryInterface.addIndex("swipe_post_embeddings", ["post_id"])
        await queryInterface.addIndex("swipe_post_embeddings", ["dimension"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_post_embeddings")
    },
}
