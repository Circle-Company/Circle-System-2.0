"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_processing_steps", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            processing_id: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: "moment_processings",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: "Nome do passo de processamento",
            },
            status: {
                type: Sequelize.ENUM("pending", "processing", "completed", "failed"),
                allowNull: false,
                comment: "Status do passo",
            },
            progress: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: "Progresso do passo (0-100)",
            },
            started_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: "Data de início do passo",
            },
            completed_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: "Data de conclusão do passo",
            },
            error: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: "Mensagem de erro se houver",
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
        await queryInterface.addIndex("moment_processing_steps", ["processing_id"])
        await queryInterface.addIndex("moment_processing_steps", ["status"])
        await queryInterface.addIndex("moment_processing_steps", ["name"])
        await queryInterface.addIndex("moment_processing_steps", ["started_at"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_processing_steps")
    },
}
