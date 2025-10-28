"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("users", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            username: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: null,
            },
            search_match_term: {
                type: Sequelize.STRING(80),
                allowNull: false,
            },
            encrypted_password: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            old_encrypted_password: {
                type: Sequelize.STRING(100),
                allowNull: true,
                defaultValue: null,
            },
            description: {
                type: Sequelize.STRING(300),
                allowNull: true,
                defaultValue: null,
            },
            last_password_updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.NOW,
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

        // Índices serão criados automaticamente pelo Sequelize quando necessário
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("users")
    },
}
