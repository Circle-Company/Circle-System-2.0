"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_post_clusters", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            centroid: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: "Vetor centroid do cluster serializado em JSON",
            },
            topics: {
                type: Sequelize.JSON,
                defaultValue: [],
                comment: "Array de tópicos",
            },
            member_ids: {
                type: Sequelize.JSON,
                defaultValue: [],
                comment: "Array de IDs de posts",
            },
            category: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "general",
            },
            tags: {
                type: Sequelize.JSON,
                defaultValue: [],
                comment: "Tags associadas aos posts deste cluster",
            },
            size: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            density: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
            },
            avg_engagement: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
                comment: "Média de engajamento dos posts neste cluster",
            },
            metadata: {
                type: Sequelize.JSON,
                defaultValue: {},
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
        await queryInterface.addIndex("swipe_post_clusters", ["name"])
        await queryInterface.addIndex("swipe_post_clusters", ["category"])
        await queryInterface.addIndex("swipe_post_clusters", ["size"])
        await queryInterface.addIndex("swipe_post_clusters", ["density"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_post_clusters")
    },
}
