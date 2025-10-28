export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_interaction_summary", {
            user_id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            total_interactions: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            last_interaction_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            interaction_counts: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: "{}",
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

        // Índice para performance
        await queryInterface.addIndex("user_interaction_summary", ["user_id"], {
            name: "user_interaction_summary_user_id",
        })

        await queryInterface.addIndex("user_interaction_summary", ["last_interaction_date"], {
            name: "user_interaction_summary_last_interaction_date",
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_interaction_summary")
    },
}

