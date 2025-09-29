"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_resolutions", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            content_id: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: "moment_contents",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            width: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: "Largura em pixels",
            },
            height: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: "Altura em pixels",
            },
            quality: {
                type: Sequelize.ENUM("low", "medium", "high"),
                allowNull: false,
                comment: "Qualidade da resolução",
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
        await queryInterface.addIndex("moment_resolutions", ["content_id"])
        await queryInterface.addIndex("moment_resolutions", ["width", "height"])
        await queryInterface.addIndex("moment_resolutions", ["quality"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_resolutions")
    },
}
