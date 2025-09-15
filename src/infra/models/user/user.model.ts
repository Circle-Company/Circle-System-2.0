import { DataTypes, Model, Sequelize } from "sequelize"

import { generateID } from "../../id"
import { logger } from "@/logger"

export interface UserAttributes {
    id?: bigint
    username: string
    name?: string | null
    search_match_term: string
    encrypted_password: string
    old_encrypted_password?: string | null
    description?: string | null
    last_password_updated_at?: Date | string | null
}

export default class User extends Model<UserAttributes> implements UserAttributes {
    public readonly id!: bigint
    public username!: string
    public name?: string | null
    public search_match_term!: string
    public encrypted_password!: string
    public old_encrypted_password?: string | null
    public description?: string | null
    public last_password_updated_at!: Date | string | null
    static initialize(sequelize: Sequelize) {
        User.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => generateID(),
                },
                username: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                },
                name: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                    defaultValue: null,
                },
                search_match_term: {
                    type: DataTypes.STRING(80),
                    allowNull: false,
                },
                encrypted_password: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                },
                old_encrypted_password: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                    defaultValue: null,
                },
                description: {
                    type: DataTypes.STRING(300),
                    allowNull: true,
                    defaultValue: null,
                },
                last_password_updated_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: new Date(),
                },
            },
            {
                sequelize,
                modelName: "User",
                tableName: "users",
                timestamps: true,
                indexes: [
                    {
                        fields: ["search_match_term"],
                    },
                    {
                        fields: ["username"],
                    },
                ],
            },
        )

        // Removendo a criação automática do índice FULLTEXT
        // O índice será criado via migration
    }

    static async ensureFullTextIndex(sequelize: Sequelize) {
        try {
            // Verifica se os índices FULLTEXT já existem
            const [usernameIndex] = await sequelize.query(
                `SHOW INDEX FROM users WHERE Key_name = 'fulltext_index_username';`,
            )
            const [searchTermIndex] = await sequelize.query(
                `SHOW INDEX FROM users WHERE Key_name = 'fulltext_index_search_match_term';`,
            )

            // Cria índice FULLTEXT para username se não existir
            if ((usernameIndex as any[]).length === 0) {
                await this.createFullTextIndexWithRetry(
                    sequelize,
                    "username",
                    "fulltext_index_username",
                )
            }

            // Cria índice FULLTEXT para search_match_term se não existir
            if ((searchTermIndex as any[]).length === 0) {
                await this.createFullTextIndexWithRetry(
                    sequelize,
                    "search_match_term",
                    "fulltext_index_search_match_term",
                )
            }
        } catch (error) {
            logger.error("[User] Erro ao criar índices FULLTEXT:", error)
            // Não propaga o erro para não impedir a inicialização do modelo
        }
    }

    private static async createFullTextIndexWithRetry(
        sequelize: Sequelize,
        field: string,
        indexName: string,
    ) {
        let retries = 3
        while (retries > 0) {
            try {
                await sequelize.query(`CREATE FULLTEXT INDEX ${indexName} ON users (${field});`)
                logger.info(`[User] Índice FULLTEXT ${indexName} criado com sucesso`)
                break
            } catch (error: any) {
                if (error.original?.code === "ER_LOCK_DEADLOCK" && retries > 1) {
                    logger.info(
                        `[User] Deadlock detectado ao criar ${indexName}, tentando novamente...`,
                    )
                    retries--
                    await new Promise((resolve) => setTimeout(resolve, 1000)) // Espera 1 segundo
                    continue
                }
                throw error
            }
        }
    }

    static associate(models: any) {
        this.hasOne(models.ProfilePicture, {
            foreignKey: "user_id",
            as: "profile_pictures",
        })
        this.hasOne(models.Statistic, { foreignKey: "user_id", as: "statistics" })
        this.hasOne(models.UserMetadata, {
            foreignKey: "user_id",
            as: "user_metadatas",
        })
        this.hasOne(models.Contact, { foreignKey: "user_id", as: "contacts" })
        this.hasOne(models.Coordinate, {
            foreignKey: "user_id",
            as: "coordinates",
        })
        this.hasOne(models.Preference, {
            foreignKey: "user_id",
            as: "preferences",
        })
        this.hasMany(models.Block, {
            foreignKey: "user_id",
            as: "blocks",
        })
        this.hasOne(models.NotificationToken, {
            foreignKey: "user_id",
            as: "notification_tokens",
        })
        this.belongsToMany(models.User, {
            foreignKey: "user_id",
            as: "following",
            through: "Follow",
        })
        this.belongsToMany(models.User, {
            foreignKey: "followed_user_id",
            as: "followers",
            through: "Follow",
        })
        this.hasMany(models.Report, { foreignKey: "user_id", as: "reports" })
        this.hasMany(models.Memory, { foreignKey: "user_id", as: "memories" })
        this.hasMany(models.Relation, {
            foreignKey: "user_id",
            as: "relations",
            onDelete: "CASCADE",
            hooks: true,
        })
        this.hasMany(models.Notification, {
            foreignKey: "sender_user_id",
            as: "notifications_sent",
        })
        this.hasMany(models.Notification, {
            foreignKey: "receiver_user_id",
            as: "notifications_received",
        })
        this.hasMany(models.Like, { foreignKey: "user_id", as: "who_liked" })
        this.hasMany(models.View, { foreignKey: "user_id", as: "who_viewed" })
        this.hasMany(models.Share, { foreignKey: "user_id", as: "who_shared" })
        this.hasMany(models.Skip, { foreignKey: "user_id", as: "who_skipped" })
        this.hasMany(models.ProfileClick, {
            foreignKey: "user_id",
            as: "who_profile_clicked",
        })

        if (models.UserEmbedding) {
            this.hasOne(models.UserEmbedding, {
                foreignKey: "user_id",
                as: "user_embedding",
            })
        }

        if (models.UserInteractionHistory) {
            this.hasMany(models.UserInteractionHistory, {
                foreignKey: "user_id",
                as: "user_interaction_history",
            })
        }

        if (models.UserInteractionSummary) {
            this.hasOne(models.UserInteractionSummary, {
                foreignKey: "user_id",
                as: "user_interaction_summary",
            })
        }

        if (models.UserClusterRank) {
            this.hasMany(models.UserClusterRank, {
                foreignKey: "user_id",
                as: "user_cluster_ranks",
            })
        }

        if (models.InteractionEvent) {
            this.hasMany(models.InteractionEvent, {
                foreignKey: "user_id",
                as: "interaction_events",
            })
        }

        if (models.UserSubscription) {
            this.hasMany(models.UserSubscription, {
                foreignKey: "user_id",
                as: "subscriptions",
            })
        }

        if (models.SubscriptionValidationLog) {
            this.hasMany(models.SubscriptionValidationLog, {
                foreignKey: "user_id",
                as: "subscription_validation_logs",
            })
        }
    }
}
