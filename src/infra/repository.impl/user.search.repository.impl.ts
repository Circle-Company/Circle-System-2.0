import {
    UserSearchError,
    UserSearchErrorCode,
} from "@/domain/user.search.engine/errors/user.search.errors"
import {
    UserSearchRepositoryBase,
    UserSearchRepositoryInterface,
} from "@/domain/user.search.engine/repositories/user.search.repository"
import {
    RelationshipStatus,
    SearchCriteria,
    SearchOptions,
    SearchResult,
} from "@/domain/user.search.engine/types"
import { Op, Sequelize } from "sequelize"

import { DatabaseAdapter } from "@/infra/database/adapter"
import UserEmbeddingModel from "@/infra/models/swipe.engine/user.embedding.model"
import UserInteractionSummaryModel from "@/infra/models/swipe.engine/user.interaction.summary.model"
import BlockModel from "@/infra/models/user/block-model"
import FollowModel from "@/infra/models/user/follow-model"
import RelationModel from "@/infra/models/user/relation-model"
import CoordinateModel from "@/infra/models/user/user.coordinate.model"
import UserModel from "@/infra/models/user/user.model"
import UserPreferencesModel from "@/infra/models/user/user.preferences.model"
import ProfilePictureModel from "@/infra/models/user/user.profile.picture.model"
// Models
import { UserSearchResult as UserSearchResultEntity } from "@/domain/user.search.engine/entities/user.search.result.entity"
import UserStatisticsModel from "@/infra/models/user/user.statistics.model"
import UserStatusModel from "@/infra/models/user/user.status.model"

/**
 * User Search Repository Implementation
 *
 * Implementação concreta do repositório de busca de usuários usando Sequelize
 */
export class UserSearchRepositoryImpl
    extends UserSearchRepositoryBase
    implements UserSearchRepositoryInterface
{
    constructor(private readonly database: DatabaseAdapter, config: any) {
        super(config)
    }

    async search(criteria: SearchCriteria): Promise<SearchResult> {
        const startTime = Date.now()

        try {
            // Validação de critérios
            const validation = await this.validateSearchCriteria(criteria)
            if (!validation.isValid) {
                throw new UserSearchError(
                    UserSearchErrorCode.VALIDATION_ERROR,
                    "Critérios de busca inválidos",
                    { errors: validation.errors },
                )
            }

            // Executa busca baseada no tipo
            let users: UserSearchResultEntity[] = []

            switch (criteria.searchType) {
                case "related":
                    users = await this.searchRelated(criteria.searchTerm, criteria.searcherUserId, {
                        limit: criteria.pagination.limit,
                        offset: criteria.pagination.offset,
                        sortBy: criteria.sorting.field,
                        sortDirection: criteria.sorting.direction,
                    })
                    break

                case "unknown":
                    users = await this.searchUnknown(criteria.searchTerm, criteria.searcherUserId, {
                        limit: criteria.pagination.limit,
                        offset: criteria.pagination.offset,
                        sortBy: criteria.sorting.field,
                        sortDirection: criteria.sorting.direction,
                    })
                    break

                case "verified":
                    users = await this.searchVerified(
                        criteria.searchTerm,
                        criteria.searcherUserId,
                        {
                            limit: criteria.pagination.limit,
                            offset: criteria.pagination.offset,
                            sortBy: criteria.sorting.field,
                            sortDirection: criteria.sorting.direction,
                        },
                    )
                    break

                case "nearby":
                    users = await this.searchNearby(
                        criteria.searchTerm,
                        criteria.searcherUserId,
                        0, // latitude - deve ser obtida do usuário
                        0, // longitude - deve ser obtida do usuário
                        criteria.filters.maxDistance || 50,
                        {
                            limit: criteria.pagination.limit,
                            offset: criteria.pagination.offset,
                            sortBy: criteria.sorting.field,
                            sortDirection: criteria.sorting.direction,
                        },
                    )
                    break

                default:
                    users = await this.searchAll(criteria)
            }

            // Aplica filtros adicionais
            users = this.applyFilters(users, criteria.filters)

            // Calcula total para paginação
            const total = await this.countSearchResults(criteria)

            // Converte para SearchResult
            const result: SearchResult = {
                users: users.map((user) => user.toJSON()),
                pagination: {
                    total,
                    limit: criteria.pagination.limit,
                    offset: criteria.pagination.offset,
                    hasNext: criteria.pagination.offset + criteria.pagination.limit < total,
                    hasPrevious: criteria.pagination.offset > 0,
                    totalPages: Math.ceil(total / criteria.pagination.limit),
                    currentPage:
                        Math.floor(criteria.pagination.offset / criteria.pagination.limit) + 1,
                },
                searchMetadata: {
                    queryId: `search_${Date.now()}`,
                    searchTerm: criteria.searchTerm,
                    searchType: criteria.searchType,
                    totalResults: total,
                    searchDuration: Date.now() - startTime,
                    cacheHit: false,
                    timestamp: new Date(),
                    searcherUserId: criteria.searcherUserId,
                },
                performance: {
                    totalDuration: Date.now() - startTime,
                    searchDuration: Date.now() - startTime,
                    rankingDuration: 0,
                    cacheDuration: 0,
                    databaseQueries: 1,
                    memoryUsage: process.memoryUsage().heapUsed,
                    cacheHits: 0,
                    cacheMisses: 1,
                },
            }

            return result
        } catch (error) {
            throw new UserSearchError(
                UserSearchErrorCode.DATABASE_ERROR,
                "Erro ao executar busca",
                { originalError: error instanceof Error ? error.message : String(error) },
            )
        }
    }

    async searchRelated(
        searchTerm: string,
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResultEntity[]> {
        try {
            // Busca usuários relacionados através da tabela de relações
            const relations = await RelationModel.findAll({
                where: {
                    user_id: searcherUserId,
                    weight: { [Op.gte]: 0.1 }, // Peso mínimo para relacionamento
                },
                include: [
                    {
                        model: UserModel,
                        as: "related_user",
                        where: {
                            username: { [Op.like]: `%${searchTerm}%` },
                        },
                        include: this.getUserIncludes(),
                    },
                ],
                limit: options?.limit || 20,
                offset: options?.offset || 0,
                order: [["weight", "DESC"]],
            })

            return this.mapRelationsToSearchResults(relations, searcherUserId)
        } catch (error) {
            throw new UserSearchError(
                UserSearchErrorCode.DATABASE_ERROR,
                "Erro ao buscar usuários relacionados",
                { originalError: error instanceof Error ? error.message : String(error) },
            )
        }
    }

    async searchUnknown(
        searchTerm: string,
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResultEntity[]> {
        try {
            // Busca usuários que não têm relação com o usuário pesquisador
            const users = await UserModel.findAll({
                where: {
                    username: { [Op.like]: `%${searchTerm}%` },
                    id: { [Op.ne]: searcherUserId },
                    [Op.not]: {
                        id: {
                            [Op.in]: Sequelize.literal(`(
                                SELECT related_user_id 
                                FROM relations 
                                WHERE user_id = '${searcherUserId}'
                            )`),
                        },
                    },
                },
                include: this.getUserIncludes(),
                limit: options?.limit || 20,
                offset: options?.offset || 0,
                order: this.getOrderClause(options),
            })

            return this.mapUsersToSearchResults(users, searcherUserId)
        } catch (error) {
            throw new UserSearchError(
                UserSearchErrorCode.DATABASE_ERROR,
                "Erro ao buscar usuários desconhecidos",
                { originalError: error instanceof Error ? error.message : String(error) },
            )
        }
    }

    async searchVerified(
        searchTerm: string,
        searcherUserId: string,
        options?: SearchOptions,
    ): Promise<UserSearchResultEntity[]> {
        try {
            const users = await UserModel.findAll({
                where: {
                    username: { [Op.like]: `%${searchTerm}%` },
                    id: { [Op.ne]: searcherUserId },
                },
                include: [
                    ...this.getUserIncludes(),
                    {
                        model: UserStatusModel,
                        as: "status",
                        where: { verified: true },
                        required: true,
                    },
                ],
                limit: options?.limit || 20,
                offset: options?.offset || 0,
                order: this.getOrderClause(options),
            })

            return this.mapUsersToSearchResults(users, searcherUserId)
        } catch (error) {
            throw new UserSearchError(
                UserSearchErrorCode.DATABASE_ERROR,
                "Erro ao buscar usuários verificados",
                { originalError: error instanceof Error ? error.message : String(error) },
            )
        }
    }

    async searchNearby(
        searchTerm: string,
        searcherUserId: string,
        latitude: number,
        longitude: number,
        radiusKm: number,
        options?: SearchOptions,
    ): Promise<UserSearchResultEntity[]> {
        try {
            // Primeiro, obtém a localização do usuário pesquisador
            const searcherLocation = await CoordinateModel.findOne({
                where: { user_id: searcherUserId },
            })

            if (!searcherLocation) {
                throw new UserSearchError(
                    UserSearchErrorCode.USER_NOT_FOUND,
                    "Localização do usuário pesquisador não encontrada",
                )
            }

            // Busca usuários próximos usando função de distância
            const users = await UserModel.findAll({
                where: {
                    username: { [Op.like]: `%${searchTerm}%` },
                    id: { [Op.ne]: searcherUserId },
                },
                include: [
                    ...this.getUserIncludes(),
                    {
                        model: CoordinateModel,
                        as: "coordinates",
                        where: Sequelize.literal(`
                            ST_Distance_Sphere(
                                POINT(${searcherLocation.longitude}, ${searcherLocation.latitude}),
                                POINT(longitude, latitude)
                            ) <= ${radiusKm * 1000}
                        `),
                        required: true,
                    },
                ],
                limit: options?.limit || 20,
                offset: options?.offset || 0,
                order: [
                    Sequelize.literal(`
                        ST_Distance_Sphere(
                            POINT(${searcherLocation.longitude}, ${searcherLocation.latitude}),
                            POINT(coordinates.longitude, coordinates.latitude)
                        )
                    `),
                ],
            })

            return this.mapUsersToSearchResults(users, searcherUserId, searcherLocation)
        } catch (error) {
            throw new UserSearchError(
                UserSearchErrorCode.DATABASE_ERROR,
                "Erro ao buscar usuários próximos",
                { originalError: error instanceof Error ? error.message : String(error) },
            )
        }
    }

    async calculateRelevanceScore(
        userId: string,
        searchTerm: string,
        searcherUserId: string,
    ): Promise<number> {
        try {
            const user = await UserModel.findByPk(userId, {
                include: this.getUserIncludes(),
            })

            if (!user) {
                return 0
            }

            // Implementação básica de cálculo de relevância
            let score = 0

            // Correspondência no username
            if (user.username.toLowerCase().includes(searchTerm.toLowerCase())) {
                score += 50
            }

            // Correspondência no nome
            if (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                score += 30
            }

            // Correspondência na descrição
            if (
                user.description &&
                user.description.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
                score += 20
            }

            return Math.min(100, score)
        } catch (error) {
            console.error("Erro ao calcular score de relevância:", error)
            return 0
        }
    }

    async rankResults(
        results: UserSearchResultEntity[],
        criteria: SearchCriteria,
    ): Promise<UserSearchResultEntity[]> {
        // Ordena por score de busca (já calculado na entidade)
        return results.sort((a, b) => b.searchScore - a.searchScore)
    }

    async getRankingFactors(
        userId: string,
        searchTerm: string,
        searcherUserId: string,
    ): Promise<string[]> {
        const factors: string[] = []

        try {
            const user = await UserModel.findByPk(userId, {
                include: this.getUserIncludes(),
            })

            if (!user) {
                return factors
            }

            // Fatores de relevância
            if (user.username.toLowerCase().includes(searchTerm.toLowerCase())) {
                factors.push("username_match")
            }

            if (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                factors.push("name_match")
            }

            // Fatores sociais
            const relationship = await this.getRelationshipStatus(userId, searcherUserId)
            if (relationship.youFollow) factors.push("you_follow")
            if (relationship.followsYou) factors.push("follows_you")
            if (relationship.mutualConnections > 0) factors.push("mutual_connections")

            // Fatores de qualidade
            const status = (user as any).status
            if (status?.verified) factors.push("verified")

            const stats = (user as any).statistics
            if (stats?.total_followers > 1000) factors.push("high_followers")
            if (stats?.engagement_rate > 0.05) factors.push("high_engagement")
        } catch (error) {
            console.error("Erro ao obter fatores de ranking:", error)
        }

        return factors
    }

    async getRelationshipStatus(
        userId: string,
        searcherUserId: string,
    ): Promise<RelationshipStatus> {
        try {
            const [follow, block, mutualConnections] = await Promise.all([
                FollowModel.findOne({
                    where: {
                        user_id: searcherUserId,
                        followed_user_id: userId,
                    },
                }),
                BlockModel.findOne({
                    where: {
                        user_id: searcherUserId,
                        blocked_user_id: userId,
                    },
                }),
                this.getMutualConnections(userId, searcherUserId),
            ])

            return {
                youFollow: !!follow,
                followsYou: false, // Seria necessário verificar o contrário
                isBlocked: !!block,
                isMuted: false, // Seria necessário verificar na tabela de mute
                relationshipStrength: mutualConnections.length > 0 ? 0.5 : 0,
                mutualConnections: mutualConnections.length,
            }
        } catch (error) {
            console.error("Erro ao obter status de relacionamento:", error)
            return {
                youFollow: false,
                followsYou: false,
                isBlocked: false,
                isMuted: false,
                relationshipStrength: 0,
                mutualConnections: 0,
            }
        }
    }

    async getRelationshipStrength(userId: string, searcherUserId: string): Promise<number> {
        const status = await this.getRelationshipStatus(userId, searcherUserId)
        return status.relationshipStrength
    }

    async getMutualConnections(userId: string, searcherUserId: string): Promise<string[]> {
        try {
            // Implementação básica - seria necessário query mais complexa
            return []
        } catch (error) {
            console.error("Erro ao obter conexões mútuas:", error)
            return []
        }
    }

    async calculateDistance(userId: string, searcherUserId: string): Promise<number | null> {
        try {
            const [user1Location, user2Location] = await Promise.all([
                CoordinateModel.findOne({ where: { user_id: userId } }),
                CoordinateModel.findOne({ where: { user_id: searcherUserId } }),
            ])

            if (!user1Location || !user2Location) {
                return null
            }

            // Cálculo básico de distância (seria melhor usar Haversine)
            const lat1 = user1Location.latitude
            const lon1 = user1Location.longitude
            const lat2 = user2Location.latitude
            const lon2 = user2Location.longitude

            const R = 6371 // Raio da Terra em km
            const dLat = ((lat2 - lat1) * Math.PI) / 180
            const dLon = ((lon2 - lon1) * Math.PI) / 180
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((lat1 * Math.PI) / 180) *
                    Math.cos((lat2 * Math.PI) / 180) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distance = R * c

            return distance
        } catch (error) {
            console.error("Erro ao calcular distância:", error)
            return null
        }
    }

    async getUsersInArea(
        latitude: number,
        longitude: number,
        radiusKm: number,
        options?: SearchOptions,
    ): Promise<UserSearchResultEntity[]> {
        try {
            const users = await UserModel.findAll({
                include: [
                    ...this.getUserIncludes(),
                    {
                        model: CoordinateModel,
                        as: "coordinates",
                        where: Sequelize.literal(`
                            ST_Distance_Sphere(
                                POINT(${longitude}, ${latitude}),
                                POINT(longitude, latitude)
                            ) <= ${radiusKm * 1000}
                        `),
                        required: true,
                    },
                ],
                limit: options?.limit || 50,
                offset: options?.offset || 0,
            })

            return this.mapUsersToSearchResults(users, "system")
        } catch (error) {
            throw new UserSearchError(
                UserSearchErrorCode.DATABASE_ERROR,
                "Erro ao buscar usuários na área",
                { originalError: error instanceof Error ? error.message : String(error) },
            )
        }
    }

    // Métodos auxiliares privados

    private async searchAll(criteria: SearchCriteria): Promise<UserSearchResultEntity[]> {
        try {
            const users = await UserModel.findAll({
                where: {
                    username: { [Op.like]: `%${criteria.searchTerm}%` },
                    id: { [Op.ne]: criteria.searcherUserId },
                },
                include: this.getUserIncludes(),
                limit: criteria.pagination.limit,
                offset: criteria.pagination.offset,
                order: this.getOrderClause({
                    sortBy: criteria.sorting.field,
                    sortDirection: criteria.sorting.direction,
                }),
            })

            return this.mapUsersToSearchResults(users, criteria.searcherUserId)
        } catch (error) {
            throw new UserSearchError(
                UserSearchErrorCode.DATABASE_ERROR,
                "Erro ao buscar todos os usuários",
                { originalError: error instanceof Error ? error.message : String(error) },
            )
        }
    }

    private getUserIncludes() {
        return [
            {
                model: UserStatusModel,
                as: "status",
                required: false,
            },
            {
                model: UserStatisticsModel,
                as: "statistics",
                required: false,
            },
            {
                model: UserPreferencesModel,
                as: "preferences",
                required: false,
            },
            {
                model: UserEmbeddingModel,
                as: "user_embedding",
                required: false,
            },
            {
                model: UserInteractionSummaryModel,
                as: "user_interaction_summary",
                required: false,
            },
            {
                model: ProfilePictureModel,
                as: "profile_pictures",
                required: false,
            },
            {
                model: CoordinateModel,
                as: "coordinates",
                required: false,
            },
        ]
    }

    private getOrderClause(options?: SearchOptions) {
        if (!options?.sortBy) {
            return [["username", "ASC"]]
        }

        const direction = options.sortDirection || "ASC"

        switch (options.sortBy) {
            case "followers":
                return [
                    [
                        { model: UserStatisticsModel, as: "statistics" },
                        "total_followers",
                        direction,
                    ],
                ]
            case "engagement":
                return [
                    [
                        { model: UserStatisticsModel, as: "statistics" },
                        "engagement_rate",
                        direction,
                    ],
                ]
            case "created_at":
                return [["createdAt", direction]]
            case "relevance":
            default:
                return [["username", "ASC"]]
        }
    }

    private mapUsersToSearchResults(
        users: any[],
        searcherUserId: string,
        searcherLocation?: any,
    ): UserSearchResultEntity[] {
        return users.map((user) => {
            const status = user.status
            const stats = user.statistics
            const profilePicture = user.profile_pictures?.[0]
            const coordinates = user.coordinates

            // Calcula distância se houver localização do pesquisador
            let distance: number | null = null
            if (searcherLocation && coordinates) {
                distance = this.calculateHaversineDistance(
                    searcherLocation.latitude,
                    searcherLocation.longitude,
                    coordinates.latitude,
                    coordinates.longitude,
                )
            }

            return UserSearchResultEntity.create({
                userId: user.id.toString(),
                username: user.username,
                name: user.name,
                description: user.description,
                isVerified: status?.verified || false,
                isActive: !status?.blocked && !status?.deleted,
                reputationScore: this.calculateReputationScore(stats),
                engagementRate: stats?.engagement_rate || 0,
                followersCount: stats?.total_followers || 0,
                followingCount: stats?.total_following || 0,
                contentCount: stats?.total_moments_created || 0,
                profilePictureUrl: profilePicture?.tiny_resolution || null,
                distance,
                relationshipStatus: {
                    youFollow: false, // Seria necessário verificar
                    followsYou: false, // Seria necessário verificar
                    isBlocked: status?.blocked || false,
                    isMuted: status?.muted || false,
                },
                searchScore: 0, // Seria calculado pelo serviço de ranking
                searchMetadata: {
                    searchTerm: "",
                    searchType: "unknown",
                    searchTimestamp: new Date(),
                    rankingFactors: [],
                },
            })
        })
    }

    private mapRelationsToSearchResults(
        relations: any[],
        searcherUserId: string,
    ): UserSearchResultEntity[] {
        return relations.map((relation) => {
            const user = relation.related_user
            const status = user.status
            const stats = user.statistics
            const profilePicture = user.profile_pictures?.[0]

            return UserSearchResultEntity.create({
                userId: user.id.toString(),
                username: user.username,
                name: user.name,
                description: user.description,
                isVerified: status?.verified || false,
                isActive: !status?.blocked && !status?.deleted,
                reputationScore: this.calculateReputationScore(stats),
                engagementRate: stats?.engagement_rate || 0,
                followersCount: stats?.total_followers || 0,
                followingCount: stats?.total_following || 0,
                contentCount: stats?.total_moments_created || 0,
                profilePictureUrl: profilePicture?.tiny_resolution || null,
                relationshipStatus: {
                    youFollow: false,
                    followsYou: false,
                    isBlocked: status?.blocked || false,
                    isMuted: status?.muted || false,
                },
                searchScore: relation.weight * 100, // Usa o peso da relação como score
                searchMetadata: {
                    searchTerm: "",
                    searchType: "related",
                    searchTimestamp: new Date(),
                    rankingFactors: ["relationship_weight"],
                },
            })
        })
    }

    private applyFilters(users: UserSearchResultEntity[], filters: any): UserSearchResultEntity[] {
        return users.filter((user) => {
            // Filtro de verificação
            if (filters.includeVerified === false && user.isVerified) return false
            if (filters.includeUnverified === false && !user.isVerified) return false

            // Filtro de seguidores
            if (filters.minFollowers && user.followersCount < filters.minFollowers) return false
            if (filters.maxFollowers && user.followersCount > filters.maxFollowers) return false

            // Filtro de engajamento
            if (filters.minEngagementRate && user.engagementRate < filters.minEngagementRate)
                return false
            if (filters.maxEngagementRate && user.engagementRate > filters.maxEngagementRate)
                return false

            // Filtro de distância
            if (filters.maxDistance && user.distance && user.distance > filters.maxDistance)
                return false

            // Filtro de usuários excluídos
            if (filters.excludeUserIds?.includes(user.userId)) return false

            return true
        })
    }

    private async countSearchResults(criteria: SearchCriteria): Promise<number> {
        try {
            return await UserModel.count({
                where: {
                    username: { [Op.like]: `%${criteria.searchTerm}%` },
                    id: { [Op.ne]: criteria.searcherUserId },
                },
                include:
                    criteria.searchType === "verified"
                        ? [
                              {
                                  model: UserStatusModel,
                                  as: "status",
                                  where: { verified: true },
                                  required: true,
                              },
                          ]
                        : [],
            })
        } catch (error) {
            console.error("Erro ao contar resultados:", error)
            return 0
        }
    }

    private calculateReputationScore(stats: any): number {
        if (!stats) return 0

        const engagementScore = Math.min(stats.engagement_rate * 100, 50)
        const followersScore = Math.min(Math.log10(stats.total_followers + 1) * 10, 30)
        const contentScore = Math.min(Math.log10(stats.total_moments_created + 1) * 5, 20)

        return Math.min(100, engagementScore + followersScore + contentScore)
    }

    private calculateHaversineDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
    ): number {
        const R = 6371 // Raio da Terra em km
        const dLat = ((lat2 - lat1) * Math.PI) / 180
        const dLon = ((lon2 - lon1) * Math.PI) / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }
}
