import { generateId, logger } from "@/shared"
import { DataTypes, Model, Sequelize } from "sequelize"

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
                    defaultValue: () => generateId(),
                },
                username: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                    unique: true,
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
                ],
            },
        )

        // Removendo a criação automática do índice FULLTEXT
        // O índice será criado via migration
    }

    static async ensureFullTextIndex(sequelize: Sequelize) {
        try {
            // Verifica se os índices FULLTEXT já existem
            const [searchTermIndex] = await sequelize.query(
                `SHOW INDEX FROM users WHERE Key_name = 'fulltext_index_search_match_term';`,
            )

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
        // Associações com modelos que realmente existem
        if (models.UserProfilePicture) {
            this.hasOne(models.UserProfilePicture, {
                foreignKey: "user_id",
                as: "profile_pictures",
            })
        }

        if (models.UserStatistics) {
            this.hasOne(models.UserStatistics, {
                foreignKey: "user_id",
                as: "statistics",
            })
        }

        if (models.UserMetadata) {
            this.hasOne(models.UserMetadata, {
                foreignKey: "user_id",
                as: "user_metadatas",
            })
        }

        if (models.UserPreferences) {
            this.hasOne(models.UserPreferences, {
                foreignKey: "user_id",
                as: "preferences",
            })
        }

        if (models.UserStatus) {
            this.hasOne(models.UserStatus, {
                foreignKey: "user_id",
                as: "status",
            })
        }

        if (models.UserTerm) {
            this.hasOne(models.UserTerm, {
                foreignKey: "user_id",
                as: "terms",
            })
        }

        if (models.Moment) {
            this.hasMany(models.Moment, {
                foreignKey: "owner_id",
                as: "moments",
            })
        }

        if (models.SignLog) {
            this.hasMany(models.SignLog, {
                foreignKey: "typed_username",
                as: "sign_logs",
                sourceKey: "username",
            })
        }

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

        // Associações removidas para modelos que não existem ainda
    }
}
