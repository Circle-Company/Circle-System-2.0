import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentLikeAttributes {
    id: bigint
    momentId: bigint
    userId: bigint
    createdAt: Date
    updatedAt: Date
}

interface MomentLikeCreationAttributes extends Omit<MomentLikeAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

export default class MomentLike
    extends Model<MomentLikeAttributes, MomentLikeCreationAttributes>
    implements MomentLikeAttributes
{
    declare id: bigint
    declare momentId: bigint
    declare userId: bigint
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentLike.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
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
                userId: {
                    type: DataTypes.BIGINT,
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
                tableName: "moment_likes",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ["moment_id", "user_id"],
                        name: "moment_likes_unique",
                    },
                    {
                        fields: ["moment_id"],
                        name: "moment_likes_moment_id",
                    },
                    {
                        fields: ["user_id"],
                        name: "moment_likes_user_id",
                    },
                    {
                        fields: ["created_at"],
                        name: "moment_likes_created_at",
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentLike.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }

        // Associação com User
        if (models.User) {
            MomentLike.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
            })
        }
    }
}
