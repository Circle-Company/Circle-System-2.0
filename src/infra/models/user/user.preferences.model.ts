import { DataTypes, Model, Sequelize } from "sequelize"

import { generateID } from "../../id"

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
    public readonly id!: bigint
    public user_id!: bigint
    public app_language?: string
    public app_timezone?: number
    public disable_autoplay?: boolean
    public disable_haptics?: boolean
    public disable_translation?: boolean
    public translation_language?: string
    public disable_like_moment_push_notification?: boolean
    public disable_new_memory_push_notification?: boolean
    public disable_add_to_memory_push_notification?: boolean
    public disable_follow_user_push_notification?: boolean
    public disable_view_user_push_notification?: boolean
    public disable_news_push_notification?: boolean
    public disable_sugestions_push_notification?: boolean
    public disable_around_you_push_notification?: boolean
    static initialize(sequelize: Sequelize) {
        UserPreferences.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => generateID(),
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
                modelName: "UserPreference",
                tableName: "user_preferences",
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
