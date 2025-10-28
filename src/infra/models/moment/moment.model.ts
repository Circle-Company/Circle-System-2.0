import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentAttributes {
    id: bigint
    ownerId: bigint | null
    description: string
    hashtags: string[]
    mentions: string[]
    createdAt: Date
    updatedAt: Date
    publishedAt: Date | null
    archivedAt: Date | null
    deletedAt: Date | null
}

interface MomentCreationAttributes
    extends Omit<MomentAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

export default class Moment
    extends Model<MomentAttributes, MomentCreationAttributes>
    implements MomentAttributes
{
    declare id: bigint
    declare ownerId: bigint | null
    declare description: string
    declare hashtags: string[]
    declare mentions: string[]
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
    declare publishedAt: Date | null
    declare archivedAt: Date | null
    declare deletedAt: Date | null

    static initialize(sequelize: Sequelize): void {
        Moment.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                ownerId: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                    field: "owner_id",
                },
                description: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    defaultValue: "",
                },
                hashtags: {
                    type: DataTypes.JSON,
                    defaultValue: "[]",
                },
                mentions: {
                    type: DataTypes.JSON,
                    defaultValue: "[]",
                },
                publishedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "published_at",
                },
                archivedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "archived_at",
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
                tableName: "moments",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["owner_id"],
                    },
                    {
                        fields: ["published_at"],
                    },
                    {
                        fields: ["created_at"],
                    },
                    {
                        fields: ["deleted_at"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com User
        if (models.User) {
            Moment.belongsTo(models.User, {
                foreignKey: "owner_id",
                as: "owner",
                targetKey: "id",
            })
        }

        // Associações com modelos relacionados
        if (models.MomentContent) {
            Moment.hasOne(models.MomentContent, {
                foreignKey: "moment_id",
                as: "content",
            })
        }

        if (models.MomentStatus) {
            Moment.hasOne(models.MomentStatus, {
                foreignKey: "moment_id",
                as: "status",
            })
        }

        if (models.MomentVisibility) {
            Moment.hasOne(models.MomentVisibility, {
                foreignKey: "moment_id",
                as: "visibility",
            })
        }

        if (models.MomentMetrics) {
            Moment.hasOne(models.MomentMetrics, {
                foreignKey: "moment_id",
                as: "metrics",
            })
        }

        if (models.MomentContext) {
            Moment.hasOne(models.MomentContext, {
                foreignKey: "moment_id",
                as: "context",
            })
        }

        if (models.MomentProcessing) {
            Moment.hasOne(models.MomentProcessing, {
                foreignKey: "moment_id",
                as: "processing",
            })
        }

        if (models.MomentEmbedding) {
            Moment.hasOne(models.MomentEmbedding, {
                foreignKey: "moment_id",
                as: "embedding",
            })
        }

        if (models.MomentMedia) {
            Moment.hasOne(models.MomentMedia, {
                foreignKey: "moment_id",
                as: "media",
            })
        }

        if (models.MomentThumbnail) {
            Moment.hasOne(models.MomentThumbnail, {
                foreignKey: "moment_id",
                as: "thumbnail",
            })
        }

        if (models.MomentLocation) {
            Moment.hasOne(models.MomentLocation, {
                foreignKey: "moment_id",
                as: "location",
            })
        }

        // Associações com interações de moment
        if (models.MomentLike) {
            Moment.hasMany(models.MomentLike, {
                foreignKey: "moment_id",
                as: "likes",
            })
        }

        if (models.MomentComment) {
            Moment.hasMany(models.MomentComment, {
                foreignKey: "moment_id",
                as: "comments",
            })
        }

        if (models.MomentShare) {
            Moment.hasMany(models.MomentShare, {
                foreignKey: "moment_id",
                as: "shares",
            })
        }

        if (models.MomentReport) {
            Moment.hasMany(models.MomentReport, {
                foreignKey: "moment_id",
                as: "reports",
            })
        }

        // Associações com swipe engine
        if (models.PostEmbedding) {
            Moment.hasOne(models.PostEmbedding, {
                foreignKey: "post_id",
                as: "post_embedding",
            })
        }

        if (models.PostClusterRank) {
            Moment.hasMany(models.PostClusterRank, {
                foreignKey: "post_id",
                as: "cluster_ranks",
            })
        }

        if (models.InteractionEvent) {
            Moment.hasMany(models.InteractionEvent, {
                foreignKey: "entity_id",
                as: "interaction_events",
                scope: {
                    entityType: "post",
                },
            })
        }
    }
}
