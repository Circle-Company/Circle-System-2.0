import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface MomentMetricsAttributes {
    id: string
    momentId: string
    // Métricas de visualização
    totalViews: number
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
    commentRate: number
    reportRate: number

    // Métricas de performance
    loadTime: number
    bufferTime: number
    errorRate: number
    qualitySwitches: number

    // Métricas de viralidade
    viralScore: number
    trendingScore: number
    reachScore: number
    influenceScore: number
    growthRate: number
    totalReach: number

    // Métricas de qualidade do conteúdo
    contentQualityScore: number
    audioQualityScore: number
    videoQualityScore: number
    faceDetectionRate: number

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
    public commentRate!: number
    public reportRate!: number
    public loadTime!: number
    public bufferTime!: number
    public errorRate!: number
    public qualitySwitches!: number
    public viralScore!: number
    public trendingScore!: number
    public reachScore!: number
    public influenceScore!: number
    public growthRate!: number
    public totalReach!: number
    public contentQualityScore!: number
    public audioQualityScore!: number
    public videoQualityScore!: number
    public faceDetectionRate!: number
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
                qualitySwitches: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    field: "quality_switches",
                },
                // Métricas de viralidade
                viralScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "viral_score",
                },
                trendingScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "trending_score",
                },
                reachScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "reach_score",
                },
                influenceScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "influence_score",
                },
                growthRate: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "growth_rate",
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
                audioQualityScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "audio_quality_score",
                },
                videoQualityScore: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "video_quality_score",
                },
                faceDetectionRate: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                    field: "face_detection_rate",
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
                        fields: ["trending_score"],
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
