"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_statuses", {
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
            access_level: {
                type: Sequelize.ENUM("SUDO", "ADMIN", "MODERATOR", "USER"),
                allowNull: true,
                defaultValue: "USER",
            },
            verified: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            deleted: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            blocked: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            muted: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false,
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
        await queryInterface.addIndex("user_statuses", ["user_id"])
        await queryInterface.addIndex("user_statuses", ["access_level"])
        await queryInterface.addIndex("user_statuses", ["verified"])
        await queryInterface.addIndex("user_statuses", ["deleted"])
        await queryInterface.addIndex("user_statuses", ["blocked"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_statuses")
    },
}
