import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentReportAttributes {
    id: bigint
    momentId: bigint
    userId: bigint
    reason:
        | "spam"
        | "harassment"
        | "inappropriate_content"
        | "copyright"
        | "violence"
        | "hate_speech"
        | "false_information"
        | "self_harm"
        | "other"
    description: string | null
    status: "pending" | "reviewed" | "resolved" | "dismissed"
    reviewedBy: bigint | null
    reviewedAt: Date | null
    resolutionNote: string | null
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface MomentReportCreationAttributes
    extends Omit<MomentReportAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

export default class MomentReport
    extends Model<MomentReportAttributes, MomentReportCreationAttributes>
    implements MomentReportAttributes
{
    declare id: bigint
    declare momentId: bigint
    declare userId: bigint
    declare reason:
        | "spam"
        | "harassment"
        | "inappropriate_content"
        | "copyright"
        | "violence"
        | "hate_speech"
        | "false_information"
        | "self_harm"
        | "other"
    declare description: string | null
    declare status: "pending" | "reviewed" | "resolved" | "dismissed"
    declare reviewedBy: bigint | null
    declare reviewedAt: Date | null
    declare resolutionNote: string | null
    declare metadata: Record<string, any>
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentReport.init(
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
                reason: {
                    type: DataTypes.ENUM(
                        "spam",
                        "harassment",
                        "inappropriate_content",
                        "copyright",
                        "violence",
                        "hate_speech",
                        "false_information",
                        "self_harm",
                        "other",
                    ),
                    allowNull: false,
                },
                description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                status: {
                    type: DataTypes.ENUM("pending", "reviewed", "resolved", "dismissed"),
                    allowNull: false,
                    defaultValue: "pending",
                },
                reviewedBy: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                    field: "reviewed_by",
                    references: {
                        model: "users",
                        key: "id",
                    },
                },
                reviewedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "reviewed_at",
                },
                resolutionNote: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    field: "resolution_note",
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
                tableName: "moment_reports",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ["moment_id", "user_id"],
                        name: "moment_reports_unique",
                    },
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["user_id"],
                    },
                    {
                        fields: ["status"],
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
            MomentReport.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })

            // hasMany no Moment
            if (models.Moment.hasMany) {
                models.Moment.hasMany(MomentReport, {
                    foreignKey: "moment_id",
                    as: "reports",
                })
            }
        }

        // Associação com User (autor do report)
        if (models.User) {
            MomentReport.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
            })

            // Associação com User (moderador que revisou)
            MomentReport.belongsTo(models.User, {
                foreignKey: "reviewed_by",
                as: "reviewer",
            })
        }
    }
}

