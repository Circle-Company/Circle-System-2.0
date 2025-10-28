"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_likes", {
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
        await queryInterface.addIndex("moment_likes", ["moment_id", "user_id"], {
            unique: true,
            name: "moment_likes_unique",
        })
        await queryInterface.addIndex("moment_likes", ["moment_id"], {
            name: "moment_likes_moment_id",
        })
        await queryInterface.addIndex("moment_likes", ["user_id"], {
            name: "moment_likes_user_id",
        })
        await queryInterface.addIndex("moment_likes", ["created_at"], {
            name: "moment_likes_created_at",
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_likes")
    },
}

