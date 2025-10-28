"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_terms", {
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
            terms_and_conditions_agreed: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
            terms_and_conditions_agreed_version: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            terms_and_conditions_agreed_at: {
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

        // Índices
        await queryInterface.addIndex("user_terms", ["user_id"])
        await queryInterface.addIndex("user_terms", ["terms_and_conditions_agreed"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_terms")
    },
}
