import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentEmbeddingAttributes {
    id: string
    momentId: string
    vector: string
    dimension: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface MomentEmbeddingCreationAttributes
    extends Omit<MomentEmbeddingAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentEmbedding
    extends Model<MomentEmbeddingAttributes, MomentEmbeddingCreationAttributes>
    implements MomentEmbeddingAttributes
{
    declare id: string
    declare momentId: string
    declare vector: string
    declare dimension: number
    declare metadata: Record<string, any>
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentEmbedding.init(
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
                vector: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    comment: "Vetor de embedding serializado",
                },
                dimension: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    comment: "Dimensão do vetor",
                },
                metadata: {
                    type: DataTypes.JSON,
                    allowNull: false,
                    defaultValue: "{}",
                    comment: "Metadados do embedding",
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
                tableName: "moment_embeddings",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["dimension"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentEmbedding.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }
    }
}
