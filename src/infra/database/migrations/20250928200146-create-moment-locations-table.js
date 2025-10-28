"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_locations", {
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
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: false,
                comment: "Latitude em graus decimais",
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: false,
                comment: "Longitude em graus decimais",
            },
            accuracy: {
                type: Sequelize.FLOAT,
                allowNull: true,
                comment: "Precisão da localização em metros",
            },
            altitude: {
                type: Sequelize.FLOAT,
                allowNull: true,
                comment: "Altitude em metros",
            },
            heading: {
                type: Sequelize.FLOAT,
                allowNull: true,
                comment: "Direção em graus (0-360)",
            },
            speed: {
                type: Sequelize.FLOAT,
                allowNull: true,
                comment: "Velocidade em m/s",
            },
            address: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: "Endereço completo",
            },
            city: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: "Cidade",
            },
            country: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: "País",
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
        await queryInterface.addIndex("moment_locations", ["moment_id"])
        await queryInterface.addIndex("moment_locations", ["latitude", "longitude"])
        await queryInterface.addIndex("moment_locations", ["city"])
        await queryInterface.addIndex("moment_locations", ["country"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_locations")
    },
}
