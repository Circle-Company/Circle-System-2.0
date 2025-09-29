import { ClusterInfo, EmbeddingVector } from "@/core/swipe.engine/types"
import { DataTypes, Model, Sequelize } from "sequelize"

import { generateId } from "@/shared"

interface PostClusterAttributes {
    id: bigint
    name: string
    centroid: string // JSON stringificado do EmbeddingVector
    topics: string[] // Array de tópicos
    memberIds: string[] // Array de IDs de posts
    category: string // Categoria do cluster (ex: "entretenimento", "esportes", etc)
    tags: string[] // Tags associadas aos posts deste cluster
    size: number
    density: number
    avgEngagement: number // Média de engajamento dos posts neste cluster
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface PostClusterCreationAttributes
    extends Omit<PostClusterAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

class PostCluster
    extends Model<PostClusterAttributes, PostClusterCreationAttributes>
    implements PostClusterAttributes
{
    public id!: bigint
    public name!: string
    public centroid!: string
    public topics!: string[]
    public memberIds!: string[]
    public category!: string
    public tags!: string[]
    public size!: number
    public density!: number
    public avgEngagement!: number
    public metadata!: Record<string, any>

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Método para converter para o formato ClusterInfo
    public toClusterInfo(): ClusterInfo {
        const centroidData = JSON.parse(this.centroid) as EmbeddingVector
        return {
            id: this.id.toString(),
            name: this.name,
            centroid: centroidData.values,
            topics: this.topics,
            contentIds: this.memberIds,
            size: this.size,
            density: this.density,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        PostCluster.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                centroid: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    get() {
                        const rawValue = this.getDataValue("centroid")
                        return rawValue ? JSON.parse(rawValue) : null
                    },
                    set(value: EmbeddingVector) {
                        this.setDataValue("centroid", JSON.stringify(value))
                    },
                },
                topics: {
                    type: DataTypes.JSON,
                    defaultValue: "[]",
                },
                memberIds: {
                    type: DataTypes.JSON,
                    defaultValue: "[]",
                },
                category: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    defaultValue: "general",
                },
                tags: {
                    type: DataTypes.JSON,
                    defaultValue: "[]",
                },
                size: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0,
                },
                density: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0,
                },
                avgEngagement: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0,
                },
                metadata: {
                    type: DataTypes.JSON,
                    defaultValue: "{}",
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
            },
            {
                sequelize,
                tableName: "swipe_post_clusters",
                timestamps: true,
                underscored: true,
            },
        )
    }

    // Método para definir associações
    public static associate(models: any): void {
        // Associação com Moment através de PostClusterRank
        if (models.Moment) {
            PostCluster.belongsToMany(models.Moment, {
                through: models.PostClusterRank,
                foreignKey: "cluster_id",
                otherKey: "post_id",
                as: "posts",
            })
        }

        // Associação com PostClusterRank
        if (models.PostClusterRank) {
            PostCluster.hasMany(models.PostClusterRank, {
                foreignKey: "cluster_id",
                as: "postRanks",
            })
        }
    }
}

export default PostCluster
