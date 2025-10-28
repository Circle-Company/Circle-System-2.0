import { generateId } from "@/shared"
import { DataTypes, Model, Sequelize } from "sequelize"

export interface UserBlockAttributes {
    id: bigint
    blockerId: bigint
    blockedId: bigint
    createdAt: Date
    updatedAt: Date
}

export interface UserBlockCreationAttributes
    extends Omit<UserBlockAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

export default class UserBlock
    extends Model<UserBlockAttributes, UserBlockCreationAttributes>
    implements UserBlockAttributes
{
    declare id: bigint
    declare blockerId: bigint
    declare blockedId: bigint

    declare createdAt: Date
    declare updatedAt: Date

    // Associações
    declare blocker?: any
    declare blocked?: any

    static initialize(sequelize: Sequelize): void {
        UserBlock.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                blockerId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "blocker_id",
                },
                blockedId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "blocked_id",
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
                tableName: "user_blocks",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ["blocker_id", "blocked_id"],
                        name: "user_blocks_unique",
                    },
                    { fields: ["blocker_id"], name: "user_blocks_blocker_id" },
                    { fields: ["blocked_id"], name: "user_blocks_blocked_id" },
                ],
            },
        )
    }

    static associate(models: any): void {
        if (models.User) {
            UserBlock.belongsTo(models.User, {
                foreignKey: "blocker_id",
                as: "blocker",
            })
            UserBlock.belongsTo(models.User, {
                foreignKey: "blocked_id",
                as: "blocked",
            })
        }
    }
}

