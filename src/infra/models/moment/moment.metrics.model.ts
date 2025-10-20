import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentMetricsAttributes {
    id: string
    momentId: string
    // Métricas de visualização
    totalViews: number
    totalClicks: number
    uniqueViews: number
    repeatViews: number
    completionViews: number
    averageWatchTime: number
    averageCompletionRate: number
    bounceRate: number

    // Métricas de engajamento
    totalLikes: number
    totalComments: number
    totalReports: number
    likeRate: number
    clickRate: number
    commentRate: number
    reportRate: number

    // Métricas de performance
    loadTime: number
    bufferTime: number
    errorRate: number

    // Métricas de viralidade
    viralScore: number
    totalReach: number

    // Métricas de qualidade do conteúdo
    contentQualityScore: number

    // Metadados
    lastMetricsUpdate: Date
    metricsVersion: string
    dataQuality: number
    confidenceLevel: number
    createdAt: Date
    updatedAt: Date
}

interface MomentMetricsCreationAttributes
    extends Omit<MomentMetricsAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

export default class MomentMetrics
    extends Model<MomentMetricsAttributes, MomentMetricsCreationAttributes>
    implements MomentMetricsAttributes
{
    public id!: string
    public momentId!: string
    public totalViews!: number
    public totalClicks!: number
    public uniqueViews!: number
    public repeatViews!: number
    public completionViews!: number
    public averageWatchTime!: number
    public averageCompletionRate!: number
    public bounceRate!: number
    public totalLikes!: number
    public totalComments!: number
    public totalReports!: number
    public likeRate!: number
    public clickRate!: number
    public commentRate!: number
    public reportRate!: number
    public loadTime!: number
    public bufferTime!: number
    public errorRate!: number
    public viralScore!: number
    public totalReach!: number
    public contentQualityScore!: number
    public lastMetricsUpdate!: Date
    public metricsVersion!: string
    public dataQuality!: number
    public confidenceLevel!: number
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    static initialize(sequelize: Sequelize): void {
        MomentMetrics.init(
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
                // Métricas de visualização
                totalViews: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "total_views",
                },
                totalClicks: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "total_clicks",
                },
                uniqueViews: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "unique_views",
                },
                repeatViews: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "repeat_views",
                },
                completionViews: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "completion_views",
                },
                averageWatchTime: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "average_watch_time",
                },
                averageCompletionRate: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "average_completion_rate",
                },
                bounceRate: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "bounce_rate",
                },
                // Métricas de engajamento
                totalLikes: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "total_likes",
                },
                totalComments: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "total_comments",
                },
                totalReports: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "total_reports",
                },
                likeRate: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "like_rate",
                },
                clickRate: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "click_rate",
                },
                commentRate: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "comment_rate",
                },
                reportRate: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "report_rate",
                },
                // Métricas de performance
                loadTime: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "load_time",
                },
                bufferTime: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "buffer_time",
                },
                errorRate: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "error_rate",
                },
                // Métricas de viralidade
                viralScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "viral_score",
                },
                totalReach: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "total_reach",
                },
                // Métricas de qualidade
                contentQualityScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "content_quality_score",
                },
                // Metadados
                lastMetricsUpdate: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: "last_metrics_update",
                },
                metricsVersion: {
                    type: DataTypes.STRING(10),
                    allowNull: false,
                    defaultValue: "1.0.0",
                    field: "metrics_version",
                },
                dataQuality: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 100,
                    field: "data_quality",
                },
                confidenceLevel: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 100,
                    field: "confidence_level",
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
                tableName: "moment_metrics",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["total_views"],
                    },
                    {
                        fields: ["viral_score"],
                    },
                    {
                        fields: ["last_metrics_update"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentMetrics.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }
    }
}
