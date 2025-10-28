"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_embeddings", {
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
            vector: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: "Vetor de embedding serializado",
            },
            dimension: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: "Dimensão do vetor",
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: {},
                comment: "Metadados do embedding",
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
        await queryInterface.addIndex("moment_embeddings", ["moment_id"])
        await queryInterface.addIndex("moment_embeddings", ["dimension"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_embeddings")
    },
}
