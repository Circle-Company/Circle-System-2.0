"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_metadatas", {
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
            device_type: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            device_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            device_id: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            device_token: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            os_version: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            screen_resolution_width: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            screen_resolution_height: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            os_language: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            total_device_memory: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            has_notch: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
            unique_id: {
                type: Sequelize.STRING,
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
        await queryInterface.addIndex("user_metadatas", ["user_id"])
        await queryInterface.addIndex("user_metadatas", ["device_type"])
        await queryInterface.addIndex("user_metadatas", ["device_id"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_metadatas")
    },
}
