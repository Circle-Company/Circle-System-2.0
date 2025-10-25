import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentProcessingStepAttributes {
    id: string
    processingId: string
    name: string
    status: string
    progress: number
    startedAt: Date | null
    completedAt: Date | null
    error: string | null
    createdAt: Date
    updatedAt: Date
}

interface MomentProcessingStepCreationAttributes
    extends Omit<MomentProcessingStepAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentProcessingStep
    extends Model<MomentProcessingStepAttributes, MomentProcessingStepCreationAttributes>
    implements MomentProcessingStepAttributes
{
    declare id: string
    declare processingId: string
    declare name: string
    declare status: string
    declare progress: number
    declare startedAt: Date | null
    declare completedAt: Date | null
    declare error: string | null
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentProcessingStep.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                processingId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "processing_id",
                },
                name: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    comment: "Nome do passo de processamento",
                },
                status: {
                    type: DataTypes.ENUM("pending", "processing", "completed", "failed"),
                    allowNull: false,
                    comment: "Status do passo",
                },
                progress: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: "Progresso do passo (0-100)",
                },
                startedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "started_at",
                    comment: "Data de início do passo",
                },
                completedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "completed_at",
                    comment: "Data de conclusão do passo",
                },
                error: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    comment: "Mensagem de erro se houver",
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
                tableName: "moment_processing_steps",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["processing_id"],
                    },
                    {
                        fields: ["status"],
                    },
                    {
                        fields: ["name"],
                    },
                    {
                        fields: ["started_at"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com MomentProcessing
        if (models.MomentProcessing) {
            MomentProcessingStep.belongsTo(models.MomentProcessing, {
                foreignKey: "processing_id",
                as: "processing",
            })
        }
    }
}
