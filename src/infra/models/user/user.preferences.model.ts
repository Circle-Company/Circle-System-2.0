import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface UserPreferencesAttributes {
    id?: bigint
    user_id: bigint
    app_language?: string
    app_timezone?: number
    disable_autoplay?: boolean
    disable_haptics?: boolean
    disable_translation?: boolean
    translation_language?: string
    disable_like_moment_push_notification?: boolean
    disable_new_memory_push_notification?: boolean
    disable_add_to_memory_push_notification?: boolean
    disable_follow_user_push_notification?: boolean
    disable_view_user_push_notification?: boolean
    disable_news_push_notification?: boolean
    disable_sugestions_push_notification?: boolean
    disable_around_you_push_notification?: boolean
}

export default class UserPreferences
    extends Model<UserPreferencesAttributes>
    implements UserPreferencesAttributes
{
    declare readonly id: bigint
    declare user_id: bigint
    declare app_language: string
    declare app_timezone: number
    declare disable_autoplay: boolean
    declare disable_haptics: boolean
    declare disable_translation: boolean
    declare translation_language: string
    declare disable_like_moment_push_notification: boolean
    declare disable_new_memory_push_notification: boolean
    declare disable_add_to_memory_push_notification: boolean
    declare disable_follow_user_push_notification: boolean
    declare disable_view_user_push_notification: boolean
    declare disable_news_push_notification: boolean
    declare disable_sugestions_push_notification: boolean
    declare disable_around_you_push_notification: boolean
    static initialize(sequelize: Sequelize) {
        UserPreferences.init(
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
                app_language: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    defaultValue: "pt",
                },
                app_timezone: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: -3,
                },
                disable_autoplay: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_haptics: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_translation: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                translation_language: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    defaultValue: "pt",
                },
                disable_like_moment_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_new_memory_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_add_to_memory_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_follow_user_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_view_user_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_news_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_sugestions_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disable_around_you_push_notification: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
            },
            {
                sequelize,
                modelName: "UserPreferences",
                tableName: "user_preferences",
                timestamps: true,
                createdAt: "created_at",
                updatedAt: "updated_at",
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
