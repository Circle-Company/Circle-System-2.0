"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moments", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            owner_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false,
                defaultValue: "",
            },
            hashtags: {
                type: Sequelize.JSON,
                defaultValue: [],
            },
            mentions: {
                type: Sequelize.JSON,
                defaultValue: [],
            },
            published_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            archived_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
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
        await queryInterface.addIndex("moments", ["owner_id"])
        await queryInterface.addIndex("moments", ["published_at"])
        await queryInterface.addIndex("moments", ["created_at"])
        await queryInterface.addIndex("moments", ["deleted_at"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moments")
    },
}
