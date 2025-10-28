"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_devices", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            context_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: "moment_contexts",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: "Tipo do dispositivo (mobile, tablet, desktop)",
            },
            os: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: "Sistema operacional",
            },
            os_version: {
                type: Sequelize.STRING(20),
                allowNull: false,
                comment: "Versão do sistema operacional",
            },
            model: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: "Modelo do dispositivo",
            },
            screen_resolution: {
                type: Sequelize.STRING(20),
                allowNull: false,
                comment: "Resolução da tela",
            },
            orientation: {
                type: Sequelize.STRING(20),
                allowNull: false,
                comment: "Orientação da tela",
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
        await queryInterface.addIndex("moment_devices", ["context_id"])
        await queryInterface.addIndex("moment_devices", ["type"])
        await queryInterface.addIndex("moment_devices", ["os"])
        await queryInterface.addIndex("moment_devices", ["model"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_devices")
    },
}
