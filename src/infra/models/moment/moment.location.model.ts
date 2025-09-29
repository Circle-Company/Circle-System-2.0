import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentLocationAttributes {
    id: string
    momentId: string
    latitude: number
    longitude: number
    accuracy?: number | null
    altitude?: number | null
    heading?: number | null
    speed?: number | null
    address?: string | null
    city?: string | null
    country?: string | null
    createdAt: Date
    updatedAt: Date
}

interface MomentLocationCreationAttributes
    extends Omit<MomentLocationAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentLocation
    extends Model<MomentLocationAttributes, MomentLocationCreationAttributes>
    implements MomentLocationAttributes
{
    public id!: string
    public momentId!: string
    public latitude!: number
    public longitude!: number
    public accuracy?: number | null
    public altitude?: number | null
    public heading?: number | null
    public speed?: number | null
    public address?: string | null
    public city?: string | null
    public country?: string | null
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    static initialize(sequelize: Sequelize): void {
        MomentLocation.init(
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
                latitude: {
                    type: DataTypes.DECIMAL(10, 8),
                    allowNull: false,
                    comment: "Latitude em graus decimais",
                },
                longitude: {
                    type: DataTypes.DECIMAL(11, 8),
                    allowNull: false,
                    comment: "Longitude em graus decimais",
                },
                accuracy: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                    comment: "Precisão da localização em metros",
                },
                altitude: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                    comment: "Altitude em metros",
                },
                heading: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                    comment: "Direção em graus (0-360)",
                },
                speed: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                    comment: "Velocidade em m/s",
                },
                address: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    comment: "Endereço completo",
                },
                city: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                    comment: "Cidade",
                },
                country: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                    comment: "País",
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
                tableName: "moment_locations",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["latitude", "longitude"],
                    },
                    {
                        fields: ["city"],
                    },
                    {
                        fields: ["country"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentLocation.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }
    }
}
