import { DataTypes, Model, Sequelize } from "sequelize"

import { Level } from "@/domain/authorization/authorization.type"
import { generateId } from "@/shared"

interface UserStatusAttributes {
    id?: bigint
    user_id: bigint
    access_level?: Level
    verified?: boolean
    deleted?: boolean
    blocked?: boolean
    muted?: boolean
}

export default class UserStatus
    extends Model<UserStatusAttributes>
    implements UserStatusAttributes
{
    public readonly id!: bigint
    public user_id!: bigint
    public access_level?: Level
    public verified?: boolean
    public deleted?: boolean
    public blocked?: boolean
    public muted?: boolean
    static initialize(sequelize: Sequelize) {
        UserStatus.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                access_level: {
                    type: DataTypes.ENUM(...Object.values(Level)),
                    allowNull: false,
                    defaultValue: Level.USER,
                },
                verified: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                deleted: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                blocked: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                muted: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
            },
            {
                sequelize,
                modelName: "UserStatus",
                tableName: "user_statuses",
                timestamps: true,
            },
        )

        // Removendo a criação automática do índice FULLTEXT
        // O índice será criado via migration
    }

    static associate(models: any) {
        this.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "users",
        })
    }
}
