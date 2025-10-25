import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentThumbnailAttributes {
    id: string
    momentId: string
    url: string
    width: number
    height: number
    storageProvider: string
    bucket: string
    key: string
    region: string
    createdAt: Date
    updatedAt: Date
}

interface MomentThumbnailCreationAttributes
    extends Omit<MomentThumbnailAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentThumbnail
    extends Model<MomentThumbnailAttributes, MomentThumbnailCreationAttributes>
    implements MomentThumbnailAttributes
{
    declare id: string
    declare momentId: string
    declare url: string
    declare width: number
    declare height: number
    declare storageProvider: string
    declare bucket: string
    declare key: string
    declare region: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentThumbnail.init(
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
                url: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    comment: "URL do thumbnail",
                },
                width: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    comment: "Largura do thumbnail em pixels",
                },
                height: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    comment: "Altura do thumbnail em pixels",
                },
                storageProvider: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    field: "storage_provider",
                    comment: "Provedor de armazenamento (aws, gcp, etc)",
                },
                bucket: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    comment: "Bucket de armazenamento",
                },
                key: {
                    type: DataTypes.STRING(500),
                    allowNull: false,
                    comment: "Chave do arquivo no storage",
                },
                region: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    comment: "Região do storage",
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
                tableName: "moment_thumbnails",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["storage_provider"],
                    },
                    {
                        fields: ["bucket"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentThumbnail.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }
    }
}
