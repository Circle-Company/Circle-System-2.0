"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("sign_logs", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            typed_username: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            sign_type: {
                type: Sequelize.ENUM("signin", "signup"),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM("approved", "suspicious", "rejected"),
                allowNull: false,
            },
            security_risk: {
                type: Sequelize.ENUM("low", "medium", "high", "critical"),
                allowNull: false,
                defaultValue: "low",
            },
            ip_address: {
                type: Sequelize.STRING(45), // Suporta IPv4 e IPv6
                allowNull: false,
            },
            user_agent: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            machine_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true,
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true,
            },
            timezone: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            session_duration: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: "Duração da sessão em segundos",
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
        await queryInterface.dropTable("sign_logs")
    },
}
