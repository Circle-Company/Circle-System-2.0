import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentContextAttributes {
    id: string
    momentId: string
    createdAt: Date
    updatedAt: Date
}

interface MomentContextCreationAttributes
    extends Omit<MomentContextAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentContext
    extends Model<MomentContextAttributes, MomentContextCreationAttributes>
    implements MomentContextAttributes
{
    public id!: string
    public momentId!: string
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    static initialize(sequelize: Sequelize): void {
        MomentContext.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                momentId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "moment_id",
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
                tableName: "moment_contexts",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentContext.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }

        // Associação com MomentDevice
        if (models.MomentDevice) {
            MomentContext.hasOne(models.MomentDevice, {
                foreignKey: "context_id",
                as: "device",
            })
        }
    }
}
