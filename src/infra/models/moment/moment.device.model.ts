import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentDeviceAttributes {
    id: string
    contextId: string
    type: string
    os: string
    osVersion: string
    model: string
    screenResolution: string
    orientation: string
    createdAt: Date
    updatedAt: Date
}

interface MomentDeviceCreationAttributes
    extends Omit<MomentDeviceAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentDevice
    extends Model<MomentDeviceAttributes, MomentDeviceCreationAttributes>
    implements MomentDeviceAttributes
{
    declare id: string
    declare contextId: string
    declare type: string
    declare os: string
    declare osVersion: string
    declare model: string
    declare screenResolution: string
    declare orientation: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentDevice.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                contextId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "context_id",
                },
                type: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    comment: "Tipo do dispositivo (mobile, tablet, desktop)",
                },
                os: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    comment: "Sistema operacional",
                },
                osVersion: {
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    field: "os_version",
                    comment: "Versão do sistema operacional",
                },
                model: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    comment: "Modelo do dispositivo",
                },
                screenResolution: {
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    field: "screen_resolution",
                    comment: "Resolução da tela",
                },
                orientation: {
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    comment: "Orientação da tela",
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
                tableName: "moment_devices",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["context_id"],
                    },
                    {
                        fields: ["type"],
                    },
                    {
                        fields: ["os"],
                    },
                    {
                        fields: ["model"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com MomentContext
        if (models.MomentContext) {
            MomentDevice.belongsTo(models.MomentContext, {
                foreignKey: "context_id",
                as: "context",
            })
        }
    }
}
