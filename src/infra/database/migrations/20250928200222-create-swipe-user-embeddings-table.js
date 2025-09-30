"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_user_embeddings", {
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
            vector: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: "Vetor de embedding do usuário serializado em JSON",
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
        await queryInterface.addIndex("swipe_user_embeddings", ["user_id"])
        await queryInterface.addIndex("swipe_user_embeddings", ["dimension"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_user_embeddings")
    },
}
