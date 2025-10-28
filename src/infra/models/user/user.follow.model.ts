import { generateId } from "@/shared"
import { DataTypes, Model, Sequelize } from "sequelize"

export interface UserFollowAttributes {
    id: bigint
    followerId: bigint
    followingId: bigint
    createdAt: Date
    updatedAt: Date
}

export interface UserFollowCreationAttributes
    extends Omit<UserFollowAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

export default class UserFollow
    extends Model<UserFollowAttributes, UserFollowCreationAttributes>
    implements UserFollowAttributes
{
    declare id: bigint
    declare followerId: bigint
    declare followingId: bigint
    declare createdAt: Date
    declare updatedAt: Date

    // Associações
    declare follower?: any
    declare following?: any

    static initialize(sequelize: Sequelize): void {
        UserFollow.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                followerId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "follower_id",
                },
                followingId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "following_id",
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: "created_at",
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: "updated_at",
                },
            },
            {
                sequelize,
                tableName: "user_follows",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ["follower_id", "following_id"],
                        name: "user_follows_unique",
                    },
                    { fields: ["following_id"], name: "user_follows_following_id" },
                    { fields: ["follower_id"], name: "user_follows_follower_id" },
                ],
            },
        )
    }

    static associate(models: any): void {
        if (models.User) {
            UserFollow.belongsTo(models.User, {
                foreignKey: "follower_id",
                as: "follower",
            })
            UserFollow.belongsTo(models.User, {
                foreignKey: "following_id",
                as: "following",
            })
        }
    }
}

