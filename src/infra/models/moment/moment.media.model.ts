import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentMediaAttributes {
    id: string
    momentId: string
    lowUrl: string | null
    mediumUrl: string | null
    highUrl: string | null
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
    public id!: string
    public momentId!: string
    public lowUrl!: string | null
    public mediumUrl!: string | null
    public highUrl!: string | null
    public storageProvider!: string
    public bucket!: string
    public key!: string
    public region!: string
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

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
                lowUrl: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    field: "low_url",
                    comment: "URL da versão de baixa qualidade",
                },
                mediumUrl: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    field: "medium_url",
                    comment: "URL da versão de qualidade média",
                },
                highUrl: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    field: "high_url",
                    comment: "URL da versão de alta qualidade",
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
