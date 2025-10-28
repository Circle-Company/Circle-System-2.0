import { DataTypes, Model, Sequelize } from "sequelize"


interface UserInteractionHistoryAttributes {
    id: bigint
    userId: bigint
    momentId: bigint
    type: "view" | "like" | "comment" | "report" | "completion" | "share" | "save" | "skip"
    timestamp: Date
    metadata?: {
        duration?: number
        percentWatched?: number
        engagementTime?: number
        topics?: string[]
        [key: string]: any
    } | null
    createdAt: Date
    updatedAt: Date
}

interface UserInteractionHistoryCreationAttributes
    extends Omit<UserInteractionHistoryAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

class UserInteractionHistory
    extends Model<UserInteractionHistoryAttributes, UserInteractionHistoryCreationAttributes>
    implements UserInteractionHistoryAttributes
{
    declare id: bigint
    declare userId: bigint
    declare momentId: bigint
    declare type: "view" | "like" | "comment" | "report" | "completion" | "share" | "save" | "skip"
    declare timestamp: Date
    declare metadata: {
        duration?: number
        percentWatched?: number
        engagementTime?: number
        topics?: string[]
        [key: string]: any
    } | null
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        UserInteractionHistory.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                userId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "user_id",
                    references: {
                        model: "users",
                        key: "id",
                    },
                },
                momentId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "moment_id",
                    references: {
                        model: "moments",
                        key: "id",
                    },
                },
                type: {
                    type: DataTypes.ENUM(
                        "view",
                        "like",
                        "comment",
                        "report",
                        "completion",
                        "share",
                        "save",
                        "skip",
                    ),
                    allowNull: false,
                },
                timestamp: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                metadata: {
                    type: DataTypes.JSON,
                    allowNull: true,
                    defaultValue: null,
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: "created_at",
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: "updated_at",
                },
            },
            {
                sequelize,
                tableName: "user_interaction_history",
                timestamps: true,
                underscored: true,
            },
        )
    }

    // Método estático para definir associações
    public static associate(models: any): void {
        // Associação com User
        if (models.User) {
            UserInteractionHistory.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
                targetKey: "id",
            })

            // Adicionar hasMany no User
            if (models.User.hasMany) {
                models.User.hasMany(UserInteractionHistory, {
                    foreignKey: "user_id",
                    as: "interaction_history",
                })
            }
        }

        // Associação com Moment
        if (models.Moment) {
            UserInteractionHistory.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
                targetKey: "id",
            })
        }
    }
}

export default UserInteractionHistory

