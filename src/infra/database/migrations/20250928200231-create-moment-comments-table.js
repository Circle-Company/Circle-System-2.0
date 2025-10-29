"use strict"

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("moment_comments", {
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
            content: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            rich_content: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            reply_id: {
                type: Sequelize.BIGINT,
                allowNull: true,
                references: {
                    model: "moment_comments",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },

            visibility: {
                type: Sequelize.ENUM("public", "followers_only"),
                allowNull: false,
                defaultValue: "public",
            },

            // Sentiment
            sentiment: {
                type: Sequelize.ENUM("positive", "negative", "neutral"),
                allowNull: false,
                defaultValue: "neutral",
            },
            sentiment_score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },

            // Moderação
            moderation_status: {
                type: Sequelize.ENUM("pending", "approved", "rejected"),
                defaultValue: "pending",
            },
            moderation_flags: {
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: [],
            },
            severity: {
                type: Sequelize.ENUM("low", "medium", "high", "critical"),
                allowNull: false,
                defaultValue: "low",
            },
            moderation_score: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            is_moderated: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            moderated_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            moderated_by: {
                type: Sequelize.STRING,
                allowNull: true,
            },

            // Métricas
            likes_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            replies_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            reports_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            views_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            // Metadados
            metadata: {
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: {},
            },

            // Controle
            deleted: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
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

        // Índices básicos
        await queryInterface.addIndex("moment_comments", ["moment_id"], {
            name: "moment_comments_moment_id",
        })
        await queryInterface.addIndex("moment_comments", ["moment_id", "deleted", "created_at"], {
            name: "moment_comments_moment_deleted_created",
        })
        await queryInterface.addIndex("moment_comments", ["user_id"], {
            name: "moment_comments_user_id",
        })
        await queryInterface.addIndex("moment_comments", ["reply_id"], {
            name: "moment_comments_reply_id",
        })
        await queryInterface.addIndex("moment_comments", ["reply_id", "deleted"], {
            name: "moment_comments_reply_deleted",
        })
        await queryInterface.addIndex("moment_comments", ["created_at"], {
            name: "moment_comments_created_at",
        })
        await queryInterface.addIndex("moment_comments", ["moderation_status"], {
            name: "moment_comments_moderation_status",
        })

        // Índices adicionais para novos campos
        await queryInterface.addIndex("moment_comments", ["visibility"], {
            name: "moment_comments_visibility",
        })
        await queryInterface.addIndex("moment_comments", ["is_moderated"], {
            name: "moment_comments_is_moderated",
        })
        await queryInterface.addIndex("moment_comments", ["severity"], {
            name: "moment_comments_severity",
        })
        await queryInterface.addIndex("moment_comments", ["likes_count"], {
            name: "moment_comments_likes_count",
        })

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("moment_comments")
    },
}
