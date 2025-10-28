"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_reports", {
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
            reason: {
                type: Sequelize.ENUM(
                    "spam",
                    "harassment",
                    "inappropriate_content",
                    "copyright",
                    "violence",
                    "hate_speech",
                    "false_information",
                    "self_harm",
                    "other",
                ),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM("pending", "reviewed", "resolved", "dismissed"),
                allowNull: false,
                defaultValue: "pending",
            },
            reviewed_by: {
                type: Sequelize.BIGINT,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
            },
            reviewed_at: {
                type: Sequelize.DATE,
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
        await queryInterface.addIndex("moment_reports", ["moment_id", "user_id"], {
            unique: true,
            name: "moment_reports_unique",
        })
        await queryInterface.addIndex("moment_reports", ["moment_id"], {
            name: "moment_reports_moment_id",
        })
        await queryInterface.addIndex("moment_reports", ["user_id"], {
            name: "moment_reports_user_id",
        })
        await queryInterface.addIndex("moment_reports", ["status"], {
            name: "moment_reports_status",
        })
        await queryInterface.addIndex("moment_reports", ["created_at"], {
            name: "moment_reports_created_at",
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_reports")
    },
}

