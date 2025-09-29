"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_thumbnails", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            moment_id: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: "moments",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            url: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: "URL do thumbnail",
            },
            width: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: "Largura do thumbnail em pixels",
            },
            height: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: "Altura do thumbnail em pixels",
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
        await queryInterface.addIndex("moment_thumbnails", ["moment_id"])
        await queryInterface.addIndex("moment_thumbnails", ["storage_provider"])
        await queryInterface.addIndex("moment_thumbnails", ["bucket"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_thumbnails")
    },
}
