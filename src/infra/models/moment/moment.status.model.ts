import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentStatusAttributes {
    id: string
    momentId: string
    current: string
    previousStatus: string | null
    reason: string | null
    changedBy: string | null
    changedAt: Date
    createdAt: Date
    updatedAt: Date
}

interface MomentStatusCreationAttributes
    extends Omit<MomentStatusAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentStatus
    extends Model<MomentStatusAttributes, MomentStatusCreationAttributes>
    implements MomentStatusAttributes
{
    public id!: string
    public momentId!: string
    public current!: string
    public previousStatus!: string | null
    public reason!: string | null
    public changedBy!: string | null
    public changedAt!: Date
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    static initialize(sequelize: Sequelize): void {
        MomentStatus.init(
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
                current: {
                    type: DataTypes.ENUM(
                        "published",
                        "archived",
                        "deleted",
                        "blocked",
                        "under_review",
                    ),
                    allowNull: false,
                    comment: "Status atual do momento",
                },
                previousStatus: {
                    type: DataTypes.ENUM(
                        "published",
                        "archived",
                        "deleted",
                        "blocked",
                        "under_review",
                    ),
                    allowNull: true,
                    field: "previous_status",
                    comment: "Status anterior do momento",
                },
                reason: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    comment: "Motivo da mudança de status",
                },
                changedBy: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    field: "changed_by",
                    comment: "ID do usuário ou sistema que mudou o status",
                },
                changedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: "changed_at",
                    comment: "Data da mudança de status",
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
                tableName: "moment_statuses",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["current"],
                    },
                    {
                        fields: ["changed_at"],
                    },
                    {
                        fields: ["changed_by"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentStatus.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }
    }
}
