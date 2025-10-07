import { DataTypes, Model, Sequelize } from "sequelize"

import SnowflakeId from "@/shared/id/snowflake"

const snowflake = SnowflakeId()

interface UserEmbeddingAttributes {
    id: bigint
    userId: bigint
    vector: string // JSON stringificado do EmbeddingVector
    dimension: number
    metadata: Record<string, any>
    created_at: Date
    updated_at: Date
}

interface UserEmbeddingCreationAttributes
    extends Omit<UserEmbeddingAttributes, "id" | "created_at" | "updated_at"> {
    id?: bigint
}

class UserEmbedding
    extends Model<UserEmbeddingAttributes, UserEmbeddingCreationAttributes>
    implements UserEmbeddingAttributes
{
    public id!: bigint
    public userId!: bigint
    public vector!: string
    public dimension!: number
    public metadata!: Record<string, any>

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        UserEmbedding.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
                },
                userId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "user_id",
                },
                vector: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    get() {
                        const rawValue = this.getDataValue("vector")
                        try {
                            if (!rawValue) return { values: [], dimension: 0 }
                            return JSON.parse(rawValue)
                        } catch (error) {
                            console.error(`Erro ao deserializar vetor: ${error}`)
                            return { values: [], dimension: 0 }
                        }
                    },
                    set(value: string | object) {
                        try {
                            // Se já for uma string, usar diretamente
                            if (typeof value === "string") {
                                this.setDataValue("vector", value)
                            }
                            // Se for um objeto ou array, serializar
                            else {
                                this.setDataValue("vector", JSON.stringify(value))
                            }
                        } catch (error) {
                            console.error(`Erro ao serializar vetor: ${error}`)
                            this.setDataValue(
                                "vector",
                                JSON.stringify({ values: [], dimension: 0 }),
                            )
                        }
                    },
                },
                dimension: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 128,
                },
                metadata: {
                    type: DataTypes.JSON,
                    defaultValue: "{}",
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
            },
            {
                sequelize,
                tableName: "swipe_user_embeddings",
                timestamps: false,
                underscored: true,
            },
        )
    }

    // Método para definir associações
    public static associate(models: any): void {
        // Associação com User
        if (models.User) {
            UserEmbedding.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "embedding_user",
                targetKey: "id",
            })
        }
    }
}

export default UserEmbedding
