import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentCommentAttributes {
    id: bigint
    momentId: bigint
    userId: bigint
    content: string
    parentId: bigint | null
    sentiment: "positive" | "negative" | "neutral"
    sentimentScore: number
    moderationStatus: "pending" | "approved" | "rejected"
    deleted: boolean
    deletedAt: Date | null
    createdAt: Date
    updatedAt: Date
}

interface MomentCommentCreationAttributes
    extends Omit<MomentCommentAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

export default class MomentComment
    extends Model<MomentCommentAttributes, MomentCommentCreationAttributes>
    implements MomentCommentAttributes
{
    declare id: bigint
    declare momentId: bigint
    declare userId: bigint
    declare content: string
    declare parentId: bigint | null
    declare sentiment: "positive" | "negative" | "neutral"
    declare sentimentScore: number
    declare moderationStatus: "pending" | "approved" | "rejected"
    declare deleted: boolean
    declare deletedAt: Date | null
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    static initialize(sequelize: Sequelize): void {
        MomentComment.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                momentId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "moment_id",
                    references: {
                        model: "moments",
                        key: "id",
                    },
                },
                userId: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    field: "user_id",
                    references: {
                        model: "users",
                        key: "id",
                    },
                },
                content: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                parentId: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                    field: "parent_id",
                    references: {
                        model: "moment_comments",
                        key: "id",
                    },
                },
                sentiment: {
                    type: DataTypes.ENUM("positive", "negative", "neutral"),
                    allowNull: false,
                    defaultValue: "neutral",
                },
                sentimentScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "sentiment_score",
                },
                moderationStatus: {
                    type: DataTypes.ENUM("pending", "approved", "rejected"),
                    defaultValue: "pending",
                    field: "moderation_status",
                },
                deleted: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                },
                deletedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "deleted_at",
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
                tableName: "moment_comments",
                modelName: "MomentComment",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["moment_id", "deleted", "created_at"],
                    },
                    {
                        fields: ["user_id"],
                    },
                    {
                        fields: ["parent_id"],
                    },
                    {
                        fields: ["parent_id", "deleted"],
                    },
                    {
                        fields: ["created_at"],
                    },
                    {
                        fields: ["moderation_status"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentComment.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }

        // Associação com User
        if (models.User) {
            MomentComment.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
            })
        }

        // Self-reference para comentários aninhados
        if (models.MomentComment) {
            MomentComment.belongsTo(models.MomentComment, {
                foreignKey: "parent_id",
                as: "parent",
            })

            MomentComment.hasMany(models.MomentComment, {
                foreignKey: "parent_id",
                as: "replies",
            })
        }
    }
}

