import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

type CommentStatus = "active" | "hidden" | "deleted" | "flagged" | "under_review" | "approved" | "rejected"
type CommentVisibility = "public" | "followers_only" | "private" | "hidden"
type CommentCategory =
    | "positive"
    | "supportive"
    | "constructive"
    | "informative"
    | "funny"
    | "creative"
    | "neutral"
    | "question"
    | "clarification"
    | "off_topic"
    | "negative"
    | "spam"
    | "harassment"
    | "hate_speech"
    | "inappropriate"
    | "misleading"
    | "trolling"
    | "advertising"
    | "technical_issue"
    | "feature_request"
    | "bug_report"
type CommentSeverity = "low" | "medium" | "high" | "critical"
type CommentSentiment = "positive" | "negative" | "neutral"

interface MomentCommentAttributes {
    id: bigint
    momentId: bigint
    userId: bigint
    content: string
    parentId: bigint | null
    
    // Status e visibilidade
    status: CommentStatus
    visibility: CommentVisibility
    category: CommentCategory
    
    // Sentiment (mantido para compatibilidade)
    sentiment: CommentSentiment
    sentimentScore: number
    
    // Moderação
    moderationStatus: "pending" | "approved" | "rejected"
    moderationFlags: any[]
    severity: CommentSeverity
    moderationScore: number
    isModerated: boolean
    moderatedAt: Date | null
    moderatedBy: string | null
    
    // Métricas
    likesCount: number
    repliesCount: number
    reportsCount: number
    viewsCount: number
    
    // Metadados
    mentions: string[]
    hashtags: string[]
    metadata: Record<string, any>
    
    // Controle
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
    
    // Status e visibilidade
    declare status: CommentStatus
    declare visibility: CommentVisibility
    declare category: CommentCategory
    
    // Sentiment
    declare sentiment: CommentSentiment
    declare sentimentScore: number
    
    // Moderação
    declare moderationStatus: "pending" | "approved" | "rejected"
    declare moderationFlags: any[]
    declare severity: CommentSeverity
    declare moderationScore: number
    declare isModerated: boolean
    declare moderatedAt: Date | null
    declare moderatedBy: string | null
    
    // Métricas
    declare likesCount: number
    declare repliesCount: number
    declare reportsCount: number
    declare viewsCount: number
    
    // Metadados
    declare mentions: string[]
    declare hashtags: string[]
    declare metadata: Record<string, any>
    
    // Controle
    declare deleted: boolean
    declare deletedAt: Date | null
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

    /**
     * Método auxiliar para converter para entidade de domínio
     */
    toEntity(): any {
        return {
            id: String(this.id),
            momentId: String(this.momentId),
            userId: String(this.userId),
            parentCommentId: this.parentId ? String(this.parentId) : undefined,
            content: this.content,
            status: this.status,
            visibility: this.visibility,
            category: this.category,
            sentiment: this.sentiment,
            likesCount: this.likesCount,
            repliesCount: this.repliesCount,
            reportsCount: this.reportsCount,
            viewsCount: this.viewsCount,
            moderationFlags: this.moderationFlags,
            severity: this.severity,
            moderationScore: this.moderationScore,
            isModerated: this.isModerated,
            moderatedAt: this.moderatedAt,
            moderatedBy: this.moderatedBy,
            mentions: this.mentions,
            hashtags: this.hashtags,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
        }
    }

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
                
                // Status e visibilidade
                status: {
                    type: DataTypes.ENUM(
                        "active",
                        "hidden",
                        "deleted",
                        "flagged",
                        "under_review",
                        "approved",
                        "rejected",
                    ),
                    allowNull: false,
                    defaultValue: "active",
                },
                visibility: {
                    type: DataTypes.ENUM("public", "followers_only", "private", "hidden"),
                    allowNull: false,
                    defaultValue: "public",
                },
                category: {
                    type: DataTypes.ENUM(
                        "positive",
                        "supportive",
                        "constructive",
                        "informative",
                        "funny",
                        "creative",
                        "neutral",
                        "question",
                        "clarification",
                        "off_topic",
                        "negative",
                        "spam",
                        "harassment",
                        "hate_speech",
                        "inappropriate",
                        "misleading",
                        "trolling",
                        "advertising",
                        "technical_issue",
                        "feature_request",
                        "bug_report",
                    ),
                    allowNull: false,
                    defaultValue: "neutral",
                },
                
                // Sentiment (mantido para compatibilidade)
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
                
                // Moderação
                moderationStatus: {
                    type: DataTypes.ENUM("pending", "approved", "rejected"),
                    defaultValue: "pending",
                    field: "moderation_status",
                },
                moderationFlags: {
                    type: DataTypes.JSONB,
                    allowNull: false,
                    defaultValue: [],
                    field: "moderation_flags",
                },
                severity: {
                    type: DataTypes.ENUM("low", "medium", "high", "critical"),
                    allowNull: false,
                    defaultValue: "low",
                },
                moderationScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "moderation_score",
                },
                isModerated: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    field: "is_moderated",
                },
                moderatedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "moderated_at",
                },
                moderatedBy: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    field: "moderated_by",
                },
                
                // Métricas
                likesCount: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "likes_count",
                },
                repliesCount: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "replies_count",
                },
                reportsCount: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "reports_count",
                },
                viewsCount: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "views_count",
                },
                
                // Metadados
                mentions: {
                    type: DataTypes.ARRAY(DataTypes.STRING),
                    allowNull: false,
                    defaultValue: [],
                },
                hashtags: {
                    type: DataTypes.ARRAY(DataTypes.STRING),
                    allowNull: false,
                    defaultValue: [],
                },
                metadata: {
                    type: DataTypes.JSONB,
                    allowNull: false,
                    defaultValue: {},
                },
                
                // Controle
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
                    {
                        fields: ["status"],
                    },
                    {
                        fields: ["category"],
                    },
                    {
                        fields: ["visibility"],
                    },
                    {
                        fields: ["is_moderated"],
                    },
                    {
                        fields: ["severity"],
                    },
                    {
                        fields: ["likes_count"],
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
