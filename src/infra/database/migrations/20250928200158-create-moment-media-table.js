"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_media", {
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
            low_url: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: "URL da versão de baixa qualidade",
            },
            medium_url: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: "URL da versão de qualidade média",
            },
            high_url: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: "URL da versão de alta qualidade",
            },
            storage_provider: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: "Provedor de armazenamento (aws, gcp, etc)",
            },
            bucket: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: "Bucket de armazenamento",
            },
            key: {
                type: Sequelize.STRING(500),
                allowNull: false,
                comment: "Chave do arquivo no storage",
            },
            region: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: "Região do storage",
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
        await queryInterface.addIndex("moment_media", ["moment_id"])
        await queryInterface.addIndex("moment_media", ["storage_provider"])
        await queryInterface.addIndex("moment_media", ["bucket"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_media")
    },
}
