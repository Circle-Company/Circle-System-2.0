"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_processings", {
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
            status: {
                type: Sequelize.ENUM("pending", "processing", "completed", "failed"),
                allowNull: false,
                comment: "Status do processamento",
            },
            progress: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: "Progresso do processamento (0-100)",
            },
            error: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: "Mensagem de erro se houver",
            },
            started_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: "Data de início do processamento",
            },
            completed_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: "Data de conclusão do processamento",
            },
            estimated_completion: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: "Data estimada de conclusão",
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
        await queryInterface.addIndex("moment_processings", ["moment_id"])
        await queryInterface.addIndex("moment_processings", ["status"])
        await queryInterface.addIndex("moment_processings", ["started_at"])
        await queryInterface.addIndex("moment_processings", ["completed_at"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_processings")
    },
}
