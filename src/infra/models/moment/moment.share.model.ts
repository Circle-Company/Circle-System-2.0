import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentShareAttributes {
    id: bigint
    momentId: bigint
    userId: bigint
    platform: string | null
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface MomentShareCreationAttributes
    extends Omit<MomentShareAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

export default class MomentShare
    extends Model<MomentShareAttributes, MomentShareCreationAttributes>
    implements MomentShareAttributes
{
    declare id: bigint
    declare momentId: bigint
    declare userId: bigint
    declare platform: string | null
    declare metadata: Record<string, any>
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentShare.init(
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
                platform: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                metadata: {
                    type: DataTypes.JSON,
                    defaultValue: {},
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
                tableName: "moment_shares",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["user_id"],
                    },
                    {
                        fields: ["created_at"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentShare.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }

        // Associação com User
        if (models.User) {
            MomentShare.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
            })
        }
    }
}

