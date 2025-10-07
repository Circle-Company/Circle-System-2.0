import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared/id"

interface UserTermAttributes {
    id?: bigint
    user_id: bigint
    terms_and_conditions_agreed: boolean
    terms_and_conditions_agreed_version: string | null
    terms_and_conditions_agreed_at: Date | string | null
}

export default class UserTerm extends Model<UserTermAttributes> implements UserTermAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public terms_and_conditions_agreed!: boolean
    public terms_and_conditions_agreed_version!: string | null
    public terms_and_conditions_agreed_at!: Date | string | null
    static initialize(sequelize: Sequelize) {
        UserTerm.init(
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
                terms_and_conditions_agreed: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                terms_and_conditions_agreed_version: {
                    type: DataTypes.STRING(10),
                    allowNull: false,
                },
                terms_and_conditions_agreed_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: new Date(),
                },
            },
            {
                sequelize,
                modelName: "UserTerm",
                tableName: "user_terms",
                timestamps: true,
            },
        )

        // Removendo a criação automática do índice FULLTEXT
        // O índice será criado via migration
    }

    static associate(models: any) {
        if (models.User) {
            this.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
            })
        }
    }
}
