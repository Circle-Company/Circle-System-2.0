"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_shares", {
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
            platform: {
                type: Sequelize.STRING(50),
                allowNull: true,
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
        await queryInterface.addIndex("moment_shares", ["moment_id"], {
            name: "moment_shares_moment_id",
        })
        await queryInterface.addIndex("moment_shares", ["user_id"], {
            name: "moment_shares_user_id",
        })
        await queryInterface.addIndex("moment_shares", ["created_at"], {
            name: "moment_shares_created_at",
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_shares")
    },
}

