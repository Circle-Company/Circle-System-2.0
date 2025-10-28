export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_blocks", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            blocker_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            blocked_id: {
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
        await queryInterface.addIndex("user_blocks", ["blocker_id", "blocked_id"], {
            unique: true,
            name: "user_blocks_unique",
        })

        // Índice para buscar bloqueios de um usuário
        await queryInterface.addIndex("user_blocks", ["blocker_id"], {
            name: "user_blocks_blocker_id",
        })

        // Índice para buscar quem bloqueou um usuário
        await queryInterface.addIndex("user_blocks", ["blocked_id"], {
            name: "user_blocks_blocked_id",
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_blocks")
    },
}

