"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_statuses", {
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
            current: {
                type: Sequelize.ENUM("published", "archived", "deleted", "blocked", "under_review"),
                allowNull: false,
                comment: "Status atual do momento",
            },
            previous_status: {
                type: Sequelize.ENUM("published", "archived", "deleted", "blocked", "under_review"),
                allowNull: true,
                comment: "Status anterior do momento",
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: "Motivo da mudança de status",
            },
            changed_by: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: "ID do usuário ou sistema que mudou o status",
            },
            changed_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
                comment: "Data da mudança de status",
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
        await queryInterface.addIndex("moment_statuses", ["moment_id"])
        await queryInterface.addIndex("moment_statuses", ["current"])
        await queryInterface.addIndex("moment_statuses", ["changed_at"])
        await queryInterface.addIndex("moment_statuses", ["changed_by"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_statuses")
    },
}
