import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentContentAttributes {
    id: string
    momentId: string
    duration: number
    size: number
    format: string
    hasAudio: boolean
    codec: string
    createdAt: Date
    updatedAt: Date
}

interface MomentContentCreationAttributes
    extends Omit<MomentContentAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentContent
    extends Model<MomentContentAttributes, MomentContentCreationAttributes>
    implements MomentContentAttributes
{
    public id!: string
    public momentId!: string
    public duration!: number
    public size!: number
    public format!: string
    public hasAudio!: boolean
    public codec!: string
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    static initialize(sequelize: Sequelize): void {
        MomentContent.init(
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
                duration: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: "Duração em segundos",
                },
                size: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    comment: "Tamanho em bytes",
                },
                format: {
                    type: DataTypes.STRING(10),
                    allowNull: false,
                    comment: "Formato do arquivo (mp4, webm, etc)",
                },
                hasAudio: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    field: "has_audio",
                },
                codec: {
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    comment: "Codec usado (h264, h265, vp9, etc)",
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
                tableName: "moment_contents",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["format"],
                    },
                    {
                        fields: ["codec"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentContent.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }

        // Associação com MomentResolution
        if (models.MomentResolution) {
            MomentContent.hasOne(models.MomentResolution, {
                foreignKey: "content_id",
                as: "resolution",
            })
        }
    }
}
