import { DataTypes, Model, Sequelize } from "sequelize"

interface LikeAttributes {
    id: string
    momentId: string
    userId: string
    createdAt: Date
    updatedAt: Date
}

interface LikeCreationAttributes extends Omit<LikeAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class Like
    extends Model<LikeAttributes, LikeCreationAttributes>
    implements LikeAttributes
{
    public readonly id!: string
    public momentId!: string
    public userId!: string
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    static initialize(sequelize: Sequelize): void {
        Like.init(
            {
                id: {
                    type: DataTypes.STRING,
                    primaryKey: true,
                    allowNull: false,
                    field: "id",
                },
                momentId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "moment_id",
                    references: {
                        model: "moments",
                        key: "id",
                    },
                },
                userId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "user_id",
                    references: {
                        model: "users",
                        key: "id",
                    },
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
                tableName: "likes",
                timestamps: true,
                createdAt: "created_at",
                updatedAt: "updated_at",
                indexes: [
                    {
                        unique: true,
                        fields: ["moment_id", "user_id"],
                        name: "likes_moment_user_unique",
                    },
                    {
                        fields: ["moment_id"],
                        name: "likes_moment_id_idx",
                    },
                    {
                        fields: ["user_id"],
                        name: "likes_user_id_idx",
                    },
                    {
                        fields: ["created_at"],
                        name: "likes_created_at_idx",
                    },
                ],
            },
        )
    }

    static associate(models: any) {
        if (models.Moment) {
            this.belongsTo(models.Moment, {
                foreignKey: "momentId",
                as: "moment",
            })
        }

        if (models.User) {
            this.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
            })
        }
    }
}
