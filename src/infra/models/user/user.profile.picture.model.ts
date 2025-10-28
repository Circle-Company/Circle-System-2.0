import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface ProfilePictureAttributes {
    id?: bigint
    user_id: bigint
    fullhd_resolution?: string | null
    tiny_resolution?: string | null
}

export default class ProfilePicture
    extends Model<ProfilePictureAttributes>
    implements ProfilePictureAttributes
{
    declare readonly id: bigint
    declare user_id: bigint
    declare fullhd_resolution: string | null
    declare tiny_resolution: string | null

    static initialize(sequelize: Sequelize) {
        ProfilePicture.init(
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
                fullhd_resolution: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                tiny_resolution: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
            },
            {
                sequelize,
                tableName: "profile_pictures",
                modelName: "UserProfilePicture",
                timestamps: true,
            },
        )
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
