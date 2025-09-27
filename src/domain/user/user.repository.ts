import { DatabaseAdapter } from "@/infra/database/adapter"
import { Op } from "sequelize"
import { User } from "./user.entity"
import UserEmbeddingModel from "@/infra/models/swipe.engine/user.embedding.model"
import UserInteractionSummaryModel from "@/infra/models/swipe.engine/user.interaction.summary.model"
import { UserMapper } from "./user.mapper"
import UserModel from "@/infra/models/user/user.model"
import UserPreferencesModel from "@/infra/models/user/user.preferences.model"
import UserStatisticsModel from "@/infra/models/user/user.statistics.model"
import UserStatusModel from "@/infra/models/user/user.status.model"
import UserTermsModel from "@/infra/models/user/user.terms.model"

export interface UserRepositoryInterface {
    create(user: User): Promise<User>
    findById(id: string): Promise<User | null>
    findByUsername(username: string): Promise<User | null>
    findBySearchTerm(searchTerm: string): Promise<User[]>
    update(user: User): Promise<User>
    delete(id: string): Promise<void>
    findAll(limit?: number, offset?: number): Promise<User[]>
    findActiveUsers(limit?: number, offset?: number): Promise<User[]>
    findUsersByStatus(status: string): Promise<User[]>
}

export class UserRepository implements UserRepositoryInterface {
    constructor(private readonly database: DatabaseAdapter) {}

    async create(user: User): Promise<User> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            const userData = user.toJSON()

            if (!userData.id) {
                throw new Error("ID do usuário é obrigatório")
            }

            // Criar usuário principal usando o mapper
            const userAttributes = UserMapper.toUserModelAttributes(user)
            await UserModel.create(userAttributes, { transaction })

            // Criar registros relacionados usando o mapper
            const statusAttributes = UserMapper.toUserStatusAttributes(user)
            if (statusAttributes) {
                await UserStatusModel.create(statusAttributes, { transaction })
            }

            const preferencesAttributes = UserMapper.toUserPreferencesAttributes(user)
            if (preferencesAttributes) {
                await UserPreferencesModel.create(preferencesAttributes, { transaction })
            }

            const statisticsAttributes = UserMapper.toUserStatisticsAttributes(user)
            if (statisticsAttributes) {
                await UserStatisticsModel.create(statisticsAttributes, { transaction })
            }

            const termsAttributes = UserMapper.toUserTermsAttributes(user)
            if (termsAttributes) {
                await UserTermsModel.create(termsAttributes, { transaction })
            }

            const embeddingAttributes = UserMapper.toUserEmbeddingAttributes(user)
            if (embeddingAttributes) {
                await UserEmbeddingModel.create(embeddingAttributes, { transaction })
            }

            const interactionSummaryAttributes = UserMapper.toUserInteractionSummaryAttributes(user)
            if (interactionSummaryAttributes) {
                await UserInteractionSummaryModel.create(interactionSummaryAttributes, {
                    transaction,
                })
            }

            await transaction.commit()
            return user
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async findById(id: string): Promise<User | null> {
        const user = await UserModel.findByPk(BigInt(id), {
            include: [
                {
                    model: UserStatusModel,
                    as: "user_status",
                    required: false,
                },
                {
                    model: UserPreferencesModel,
                    as: "preferences",
                    required: false,
                },
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    required: false,
                },
                {
                    model: UserTermsModel,
                    as: "user_terms",
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
            ],
        })

        if (!user) return null

        return UserMapper.toDomain(user as any)
    }

    async findByUsername(username: string): Promise<User | null> {
        const user = await UserModel.findOne({
            where: { username },
            include: [
                {
                    model: UserStatusModel,
                    as: "user_status",
                    required: false,
                },
                {
                    model: UserPreferencesModel,
                    as: "preferences",
                    required: false,
                },
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    required: false,
                },
                {
                    model: UserTermsModel,
                    as: "user_terms",
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
            ],
        })

        if (!user) return null

        return UserMapper.toDomain(user as any)
    }

    async findBySearchTerm(searchTerm: string): Promise<User[]> {
        const users = await UserModel.findAll({
            where: {
                search_match_term: {
                    [Op.like]: `%${searchTerm}%`,
                },
            },
            include: [
                {
                    model: UserStatusModel,
                    as: "user_status",
                    required: false,
                },
                {
                    model: UserPreferencesModel,
                    as: "preferences",
                    required: false,
                },
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    required: false,
                },
                {
                    model: UserTermsModel,
                    as: "user_terms",
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
            ],
            limit: 50,
        })

        return UserMapper.toDomainArray(users as any)
    }

    async update(user: User): Promise<User> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            const userData = user.toJSON()

            if (!userData.id) {
                throw new Error("ID do usuário é obrigatório")
            }

            // Atualizar usuário principal usando o mapper
            const userAttributes = UserMapper.toUserModelAttributes(user)
            await UserModel.update(userAttributes, {
                where: { id: BigInt(userData.id) },
                transaction,
            })

            // Atualizar registros relacionados usando o mapper
            const statusAttributes = UserMapper.toUserStatusAttributes(user)
            if (statusAttributes) {
                await UserStatusModel.upsert(statusAttributes, { transaction })
            }

            const preferencesAttributes = UserMapper.toUserPreferencesAttributes(user)
            if (preferencesAttributes) {
                await UserPreferencesModel.upsert(preferencesAttributes, { transaction })
            }

            const statisticsAttributes = UserMapper.toUserStatisticsAttributes(user)
            if (statisticsAttributes) {
                await UserStatisticsModel.upsert(statisticsAttributes, { transaction })
            }

            const termsAttributes = UserMapper.toUserTermsAttributes(user)
            if (termsAttributes) {
                await UserTermsModel.upsert(termsAttributes, { transaction })
            }

            const embeddingAttributes = UserMapper.toUserEmbeddingAttributes(user)
            if (embeddingAttributes) {
                await UserEmbeddingModel.upsert(embeddingAttributes, { transaction })
            }

            const interactionSummaryAttributes = UserMapper.toUserInteractionSummaryAttributes(user)
            if (interactionSummaryAttributes) {
                await UserInteractionSummaryModel.upsert(interactionSummaryAttributes, {
                    transaction,
                })
            }

            await transaction.commit()
            return user
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async delete(id: string): Promise<void> {
        const sequelize = this.database.getConnection()
        const transaction = await sequelize.transaction()

        try {
            // Soft delete - marcar como deletado no status
            await UserStatusModel.update(
                {
                    deleted: true,
                },
                {
                    where: { user_id: BigInt(id) },
                    transaction,
                },
            )

            await transaction.commit()
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
        const users = await UserModel.findAll({
            include: [
                {
                    model: UserStatusModel,
                    as: "user_status",
                    required: false,
                },
                {
                    model: UserPreferencesModel,
                    as: "preferences",
                    required: false,
                },
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    required: false,
                },
                {
                    model: UserTermsModel,
                    as: "user_terms",
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
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findActiveUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
        const users = await UserModel.findAll({
            include: [
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        deleted: false,
                        blocked: false,
                    },
                    required: true,
                },
                {
                    model: UserPreferencesModel,
                    as: "preferences",
                    required: false,
                },
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    required: false,
                },
                {
                    model: UserTermsModel,
                    as: "user_terms",
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
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        })

        return UserMapper.toDomainArray(users as any)
    }

    async findUsersByStatus(status: string): Promise<User[]> {
        const users = await UserModel.findAll({
            include: [
                {
                    model: UserStatusModel,
                    as: "user_status",
                    where: {
                        access_level: status,
                    },
                    required: true,
                },
                {
                    model: UserPreferencesModel,
                    as: "preferences",
                    required: false,
                },
                {
                    model: UserStatisticsModel,
                    as: "statistics",
                    required: false,
                },
                {
                    model: UserTermsModel,
                    as: "user_terms",
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
            ],
            order: [["createdAt", "DESC"]],
        })

        return UserMapper.toDomainArray(users as any)
    }
}
