"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_contexts", {
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
        await queryInterface.addIndex("moment_contexts", ["moment_id"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_contexts")
    },
}
