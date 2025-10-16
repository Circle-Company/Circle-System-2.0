"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Verificar se as colunas já existem
        const tableDescription = await queryInterface.describeTable("swipe_user_embeddings")

        if (!tableDescription.created_at) {
            await queryInterface.addColumn("swipe_user_embeddings", "created_at", {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            })
        }

        if (!tableDescription.updated_at) {
            await queryInterface.addColumn("swipe_user_embeddings", "updated_at", {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            })
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("swipe_user_embeddings", "created_at")
        await queryInterface.removeColumn("swipe_user_embeddings", "updated_at")
    },
}
