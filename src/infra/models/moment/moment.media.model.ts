import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentMediaAttributes {
    id: string
    momentId: string
    url: string
    storageProvider: string
    bucket: string
    key: string
    region: string
    createdAt: Date
    updatedAt: Date
}

interface MomentMediaCreationAttributes
    extends Omit<MomentMediaAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentMedia
    extends Model<MomentMediaAttributes, MomentMediaCreationAttributes>
    implements MomentMediaAttributes
{
    declare id: string
    declare momentId: string
    declare url: string
    declare storageProvider: string
    declare bucket: string
    declare key: string
    declare region: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentMedia.init(
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
                    comment: "URL única do vídeo",
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
                tableName: "moment_media",
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
            MomentMedia.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }
    }
}
