import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentResolutionAttributes {
    id: string
    contentId: string
    width: number
    height: number
    quality: string
    createdAt: Date
    updatedAt: Date
}

interface MomentResolutionCreationAttributes
    extends Omit<MomentResolutionAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentResolution
    extends Model<MomentResolutionAttributes, MomentResolutionCreationAttributes>
    implements MomentResolutionAttributes
{
    declare id: string
    declare contentId: string
    declare width: number
    declare height: number
    declare quality: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentResolution.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                contentId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "content_id",
                },
                width: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    comment: "Largura em pixels",
                },
                height: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    comment: "Altura em pixels",
                },
                quality: {
                    type: DataTypes.ENUM("low", "medium", "high"),
                    allowNull: false,
                    comment: "Qualidade da resolução",
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
                tableName: "moment_resolutions",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["content_id"],
                    },
                    {
                        fields: ["width", "height"],
                    },
                    {
                        fields: ["quality"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com MomentContent
        if (models.MomentContent) {
            MomentResolution.belongsTo(models.MomentContent, {
                foreignKey: "content_id",
                as: "content",
            })
        }
    }
}
