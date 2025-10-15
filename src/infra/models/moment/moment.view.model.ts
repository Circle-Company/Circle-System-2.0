import { generateId, logger } from "@/shared"
import { DataTypes, Model, Op, Sequelize } from "sequelize"

import databaseManager from "../../database"

interface MomentViewAttributes {
    id: bigint
    momentId: string
    viewerId: string
    viewTimestamp: Date
    viewDuration?: number
    viewSource?: string
    isComplete: boolean
    createdAt: Date
    updatedAt: Date
}

interface MomentViewCreationAttributes
    extends Omit<MomentViewAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: bigint
}

export default class MomentView
    extends Model<MomentViewAttributes, MomentViewCreationAttributes>
    implements MomentViewAttributes
{
    public id!: bigint
    public momentId!: string
    public viewerId!: string
    public viewTimestamp!: Date
    public viewDuration?: number
    public viewSource?: string
    public isComplete!: boolean
    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    static initialize(sequelize: Sequelize): void {
        MomentView.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => generateId(),
                },
                momentId: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    field: "moment_id",
                    comment: "ID do momento visualizado",
                },
                viewerId: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    field: "viewer_id",
                    comment: "ID do usuário que visualizou",
                },
                viewTimestamp: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: "view_timestamp",
                    defaultValue: DataTypes.NOW,
                    comment: "Timestamp da visualização",
                },
                viewDuration: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    field: "view_duration",
                    comment: "Duração da visualização em segundos",
                },
                viewSource: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                    field: "view_source",
                    comment: "Fonte da visualização (feed, search, profile, etc.)",
                },
                isComplete: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    field: "is_complete",
                    comment: "Se a visualização foi completa (80%+ do vídeo)",
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
                tableName: "moment_views",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        fields: ["moment_id"],
                    },
                    {
                        fields: ["viewer_id"],
                    },
                    {
                        fields: ["view_timestamp"],
                    },
                    {
                        fields: ["moment_id", "viewer_id"],
                    },
                    {
                        fields: ["is_complete"],
                    },
                ],
            },
        )
    }

    static associate(models: any): void {
        // Associação com Moment
        if (models.Moment) {
            MomentView.belongsTo(models.Moment, {
                foreignKey: "moment_id",
                as: "moment",
            })
        }
    }
}

// ===== SERVIÇO DE PERSISTÊNCIA =====
export class MomentViewPersistenceService {
    private model: typeof MomentView

    constructor() {
        const sequelize = databaseManager.getSequelize()
        this.model = sequelize.models.MomentView as typeof MomentView
    }

    /**
     * Salva uma visualização no banco de dados
     */
    async saveView(viewData: {
        momentId: string
        viewerId: string
        viewDuration?: number
        viewSource?: string
        isComplete: boolean
        ipAddress?: string
        userAgent?: string
        deviceType?: string
    }): Promise<MomentViewAttributes> {
        try {
            const view = await this.model.create({
                momentId: viewData.momentId,
                viewerId: viewData.viewerId,
                viewTimestamp: new Date(),
                viewDuration: viewData.viewDuration,
                viewSource: viewData.viewSource,
                isComplete: viewData.isComplete,
            })

            return view.toJSON() as MomentViewAttributes
        } catch (error) {
            console.error("Erro ao salvar visualização no banco:", error)
            throw error
        }
    }

    /**
     * Busca visualizações recentes de um momento
     */
    async getRecentViews(
        momentId: string,
        maxAgeInMinutes: number = 5,
    ): Promise<MomentViewAttributes[]> {
        try {
            const maxAge = new Date(Date.now() - maxAgeInMinutes * 60 * 1000)

            const views = await this.model.findAll({
                where: {
                    momentId,
                    viewTimestamp: {
                        [Op.gte]: maxAge,
                    },
                },
                order: [["viewTimestamp", "DESC"]],
                limit: 1000, // Limite para evitar queries muito grandes
            })

            return views.map((view) => view.toJSON() as MomentViewAttributes)
        } catch (error) {
            console.error("Erro ao buscar visualizações recentes:", error)
            return []
        }
    }

    /**
     * Verifica se um usuário visualizou um momento recentemente
     */
    async hasRecentView(
        momentId: string,
        viewerId: string,
        maxAgeInMinutes: number = 5,
    ): Promise<boolean> {
        try {
            const maxAge = new Date(Date.now() - maxAgeInMinutes * 60 * 1000)

            const view = await this.model.findOne({
                where: {
                    momentId,
                    viewerId,
                    viewTimestamp: {
                        [Op.gte]: maxAge,
                    },
                },
            })

            return !!view
        } catch (error) {
            console.error("Erro ao verificar visualização recente:", error)
            return false
        }
    }

    /**
     * Obtém estatísticas de visualizações de um momento
     */
    async getViewStatistics(
        momentId: string,
        maxAgeInMinutes: number = 60,
    ): Promise<{
        totalViews: number
        uniqueViews: number
        completeViews: number
        averageDuration: number
        viewsBySource: Record<string, number>
    }> {
        try {
            const maxAge = new Date(Date.now() - maxAgeInMinutes * 60 * 1000)

            const views = await this.model.findAll({
                where: {
                    momentId,
                    viewTimestamp: {
                        [Op.gte]: maxAge,
                    },
                },
            })

            const stats = {
                totalViews: views.length,
                uniqueViews: new Set(views.map((v) => v.viewerId)).size,
                completeViews: views.filter((v) => v.isComplete).length,
                averageDuration: 0,
                viewsBySource: {} as Record<string, number>,
                viewsByDevice: {} as Record<string, number>,
            }

            // Calcular duração média
            const viewsWithDuration = views.filter((v) => v.viewDuration && v.viewDuration > 0)
            if (viewsWithDuration.length > 0) {
                const totalDuration = viewsWithDuration.reduce(
                    (sum, v) => sum + (v.viewDuration || 0),
                    0,
                )
                stats.averageDuration = totalDuration / viewsWithDuration.length
            }

            // Contar por fonte
            views.forEach((view) => {
                const source = view.viewSource || "unknown"
                stats.viewsBySource[source] = (stats.viewsBySource[source] || 0) + 1
            })

            return stats
        } catch (error) {
            console.error("Erro ao obter estatísticas de visualizações:", error)
            return {
                totalViews: 0,
                uniqueViews: 0,
                completeViews: 0,
                averageDuration: 0,
                viewsBySource: {},
            }
        }
    }

    /**
     * Remove visualizações antigas (limpeza de dados)
     */
    async cleanupOldViews(olderThanDays: number = 30): Promise<number> {
        try {
            const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)

            const deletedCount = await this.model.destroy({
                where: {
                    viewTimestamp: {
                        [Op.lt]: cutoffDate,
                    },
                },
            })
            return deletedCount
        } catch (error) {
            logger.error("Erro ao limpar visualizações antigas:", error)
            return 0
        }
    }

    /**
     * Obtém visualizações de um usuário específico
     */
    async getUserViews(
        viewerId: string,
        limit: number = 100,
        offset: number = 0,
    ): Promise<MomentViewAttributes[]> {
        try {
            const views = await this.model.findAll({
                where: { viewerId },
                order: [["viewTimestamp", "DESC"]],
                limit,
                offset,
            })

            return views.map((view) => view.toJSON() as MomentViewAttributes)
        } catch (error) {
            console.error("Erro ao buscar visualizações do usuário:", error)
            return []
        }
    }
}
