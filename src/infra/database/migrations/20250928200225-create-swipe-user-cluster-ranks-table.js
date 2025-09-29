"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("swipe_user_cluster_ranks", {
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
            cluster_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: "swipe_post_clusters",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            similarity: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            interaction_score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            match_score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            last_interaction_date: {
                type: Sequelize.DATE,
                allowNull: false,
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

        // Índices únicos e compostos
        await queryInterface.addIndex("swipe_user_cluster_ranks", ["user_id", "cluster_id"], {
            unique: true,
        })
        await queryInterface.addIndex("swipe_user_cluster_ranks", ["score"])
        await queryInterface.addIndex("swipe_user_cluster_ranks", [
            "cluster_id",
            "is_active",
            "score",
        ])
        await queryInterface.addIndex("swipe_user_cluster_ranks", ["last_interaction_date"])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("swipe_user_cluster_ranks")
    },
}
