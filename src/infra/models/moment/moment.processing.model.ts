import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentProcessingAttributes {
    id: string
    momentId: string
    status: string
    progress: number
    error: string | null
    startedAt: Date | null
    completedAt: Date | null
    estimatedCompletion: Date | null
    createdAt: Date
    updatedAt: Date
}

interface MomentProcessingCreationAttributes
    extends Omit<MomentProcessingAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentProcessing
    extends Model<MomentProcessingAttributes, MomentProcessingCreationAttributes>
    implements MomentProcessingAttributes
{
    public id!: string
    public momentId!: string
    public status!: string
    public progress!: number
    public error!: string | null
    public startedAt!: Date | null
    public completedAt!: Date | null
    public estimatedCompletion!: Date | null
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    static initialize(sequelize: Sequelize): void {
        MomentProcessing.init(
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
                status: {
                    type: DataTypes.ENUM("pending", "processing", "completed", "failed"),
                    allowNull: false,
                    comment: "Status do processamento",
                },
                progress: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Progresso do processamento (0-100)",
                },
                error: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    comment: "Mensagem de erro se houver",
                },
                startedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "started_at",
                    comment: "Data de início do processamento",
                },
                completedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "completed_at",
                    comment: "Data de conclusão do processamento",
                },
                estimatedCompletion: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "estimated_completion",
                    comment: "Data estimada de conclusão",
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
                tableName: "moment_processings",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["status"],
                    },
                    {
                        fields: ["started_at"],
                    },
                    {
                        fields: ["completed_at"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentProcessing.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }

        // Associação com MomentProcessingStep
        if (models.MomentProcessingStep) {
            MomentProcessing.hasMany(models.MomentProcessingStep, {
                foreignKey: "processing_id",
                as: "steps",
            })
        }
    }
}
