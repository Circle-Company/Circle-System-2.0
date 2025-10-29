export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_follows", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            follower_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            following_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: "users",
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

        // Índice único para evitar duplicatas
        await queryInterface.addIndex("user_follows", ["follower_id", "following_id"], {
            unique: true,
            name: "user_follows_unique",
        })

        // Índice para buscar seguidores de um usuário
        await queryInterface.addIndex("user_follows", ["following_id"], {
            name: "user_follows_following_id",
        })

        // Índice para buscar quem um usuário está seguindo
        await queryInterface.addIndex("user_follows", ["follower_id"], {
            name: "user_follows_follower_id",
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_follows")
    },
}

