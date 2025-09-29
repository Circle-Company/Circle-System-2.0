/**
 * User Repository Tests
 * 
 * Testes completos para o repositório de usuários com todas as novas funcionalidades
 */

import { describe, it, expect, beforeEach, vi, Mock } from "vitest"
import { Op } from "sequelize"
import { Level } from "@/domain/authorization"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { UserRepository, UserRepositoryInterface } from "../user.repository"
import { User } from "../../entities/user.entity"
import { UserMapper } from "../../mappers/user.mapper"
import UserModel from "@/infra/models/user/user.model"
import UserStatusModel from "@/infra/models/user/user.status.model"
import UserPreferencesModel from "@/infra/models/user/user.preferences.model"
import UserStatisticsModel from "@/infra/models/user/user.statistics.model"
import UserTermsModel from "@/infra/models/user/user.terms.model"
import UserEmbeddingModel from "@/infra/models/swipe.engine/user.embedding.model"
import UserInteractionSummaryModel from "@/infra/models/swipe.engine/user.interaction.summary.model"

// Mock do DatabaseAdapter
const mockDatabaseAdapter = {
    getConnection: vi.fn(),
} as unknown as DatabaseAdapter

// Mock do Sequelize
const mockSequelize = {
    transaction: vi.fn(),
}

const mockTransaction = {
    commit: vi.fn(),
    rollback: vi.fn(),
}

// Mock dos modelos Sequelize (agora referenciados diretamente)

// Mock dos modelos
vi.mock("@/infra/models/user/user.model", () => ({
    default: {
        create: vi.fn(),
        findByPk: vi.fn(),
        findOne: vi.fn(),
        findAll: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        upsert: vi.fn(),
    },
}))

vi.mock("@/infra/models/user/user.status.model", () => ({
    default: {
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
    },
}))

vi.mock("@/infra/models/user/user.preferences.model", () => ({
    default: {
        create: vi.fn(),
        upsert: vi.fn(),
    },
}))

vi.mock("@/infra/models/user/user.statistics.model", () => ({
    default: {
        create: vi.fn(),
        upsert: vi.fn(),
    },
}))

vi.mock("@/infra/models/user/user.terms.model", () => ({
    default: {
        create: vi.fn(),
        upsert: vi.fn(),
    },
}))

vi.mock("@/infra/models/swipe.engine/user.embedding.model", () => ({
    default: {
        create: vi.fn(),
        upsert: vi.fn(),
    },
}))

vi.mock("@/infra/models/swipe.engine/user.interaction.summary.model", () => ({
    default: {
        create: vi.fn(),
        upsert: vi.fn(),
    },
}))

// Mock do UserMapper
vi.mock("../../mappers/user.mapper", () => ({
    UserMapper: {
        toDomain: vi.fn(),
        toDomainArray: vi.fn(),
        toUserModelAttributes: vi.fn(),
        toUserStatusAttributes: vi.fn(),
        toUserPreferencesAttributes: vi.fn(),
        toUserStatisticsAttributes: vi.fn(),
        toUserTermsAttributes: vi.fn(),
        toUserEmbeddingAttributes: vi.fn(),
        toUserInteractionSummaryAttributes: vi.fn(),
    },
}))

describe("UserRepository", () => {
    let repository: UserRepositoryInterface
    let mockUser: User

    beforeEach(() => {
        vi.clearAllMocks()
        
        // Setup mocks
        mockDatabaseAdapter.getConnection = vi.fn().mockReturnValue(mockSequelize)
        mockSequelize.transaction = vi.fn().mockResolvedValue(mockTransaction)
        
        // Reset all mocks
        vi.mocked(UserModel.create).mockClear()
        vi.mocked(UserModel.findByPk).mockClear()
        vi.mocked(UserModel.findOne).mockClear()
        vi.mocked(UserModel.findAll).mockClear()
        vi.mocked(UserModel.update).mockClear()
        vi.mocked(UserModel.count).mockClear()
        
        vi.mocked(UserStatusModel.create).mockClear()
        vi.mocked(UserStatusModel.update).mockClear()
        vi.mocked(UserStatusModel.upsert).mockClear()
        
        vi.mocked(UserPreferencesModel.create).mockClear()
        vi.mocked(UserPreferencesModel.upsert).mockClear()
        
        vi.mocked(UserStatisticsModel.create).mockClear()
        vi.mocked(UserStatisticsModel.upsert).mockClear()
        
        vi.mocked(UserTermsModel.create).mockClear()
        vi.mocked(UserTermsModel.upsert).mockClear()
        
        vi.mocked(UserEmbeddingModel.create).mockClear()
        vi.mocked(UserEmbeddingModel.upsert).mockClear()
        
        vi.mocked(UserInteractionSummaryModel.create).mockClear()
        vi.mocked(UserInteractionSummaryModel.upsert).mockClear()
        
        repository = new UserRepository(mockDatabaseAdapter)
        
        // Mock user data
        mockUser = {
            id: "123456789",
            username: "test_user",
            name: "Test User",
            searchMatchTerm: "test user",
            password: "hashed_password",
            oldPassword: null,
            description: "Test user description",
            lastPasswordUpdatedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: vi.fn().mockReturnValue(true),
            getActivityStats: vi.fn().mockReturnValue({ activityLevel: "medium" }),
            getReputationScore: vi.fn().mockReturnValue(75),
            toJSON: vi.fn().mockReturnValue({
                id: "123456789",
                username: "test_user",
                name: "Test User",
                searchMatchTerm: "test user",
                password: "hashed_password",
                oldPassword: null,
                description: "Test user description",
                lastPasswordUpdatedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
        } as unknown as User
    })

    describe("Operações Básicas", () => {
        it("deve criar um usuário com sucesso", async () => {
            // Arrange
            const userData = mockUser.toJSON()
            UserMapper.toUserModelAttributes = vi.fn().mockReturnValue({
                id: BigInt(userData.id!),
                username: userData.username,
                name: userData.name,
                search_match_term: userData.searchMatchTerm,
                encrypted_password: userData.password,
                old_encrypted_password: userData.oldPassword,
                description: userData.description,
                last_password_updated_at: userData.lastPasswordUpdatedAt,
                createdAt: userData.createdAt!,
                updatedAt: userData.updatedAt!,
            })

            UserMapper.toUserStatusAttributes = vi.fn().mockReturnValue({
                user_id: BigInt(userData.id!),
                access_level: Level.USER,
                verified: true,
                deleted: false,
                blocked: false,
                muted: false,
            })

            UserMapper.toUserPreferencesAttributes = vi.fn().mockReturnValue({
                user_id: BigInt(userData.id!),
                app_language: "pt",
                app_timezone: -3,
                disable_autoplay: false,
                disable_haptics: false,
                disable_translation: false,
                translation_language: "pt",
                disable_like_moment_push_notification: false,
                disable_new_memory_push_notification: false,
                disable_add_to_memory_push_notification: false,
                disable_follow_user_push_notification: false,
                disable_view_user_push_notification: false,
                disable_news_push_notification: false,
                disable_sugestions_push_notification: false,
                disable_around_you_push_notification: false,
                default_moment_visibility: "public",
            })

            UserMapper.toUserStatisticsAttributes = vi.fn().mockReturnValue({
                user_id: BigInt(userData.id!),
                total_likes_received: 0,
                total_views_received: 0,
                total_shares_received: 0,
                total_comments_received: 0,
                total_memories_created: 0,
                total_moments_created: 0,
                total_likes_given: 0,
                total_comments_given: 0,
                total_shares_given: 0,
                total_follows_given: 0,
                total_reports_given: 0,
                total_followers: 0,
                total_following: 0,
                total_relations: 0,
                days_active_last_30: 0,
                days_active_last_7: 0,
                last_active_date: new Date(),
                current_streak_days: 0,
                longest_streak_days: 0,
                engagement_rate: 0,
                reach_rate: 0,
                moments_published_growth_rate_30d: 0,
                memories_published_growth_rate_30d: 0,
                follower_growth_rate_30d: 0,
                engagement_growth_rate_30d: 0,
                interactions_growth_rate_30d: 0,
                memories_per_day_average: 0,
                moments_per_day_average: 0,
                reports_received: 0,
                violations_count: 0,
                last_metrics_update: new Date(),
            })

            UserMapper.toUserTermsAttributes = vi.fn().mockReturnValue({
                user_id: BigInt(userData.id!),
                terms_and_conditions_agreed: true,
                terms_and_conditions_agreed_version: "1.0",
                terms_and_conditions_agreed_at: new Date(),
            })

            UserMapper.toUserEmbeddingAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserInteractionSummaryAttributes = vi.fn().mockReturnValue(null)

            vi.mocked(UserModel.create).mockResolvedValue({})
            vi.mocked(UserStatusModel.create).mockResolvedValue({})
            vi.mocked(UserPreferencesModel.create).mockResolvedValue({})
            vi.mocked(UserStatisticsModel.create).mockResolvedValue({})
            vi.mocked(UserTermsModel.create).mockResolvedValue({})

            // Act
            const result = await repository.create(mockUser)

            // Assert
            expect(result).toBe(mockUser)
            expect(mockSequelize.transaction).toHaveBeenCalled()
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(vi.mocked(UserModel).create).toHaveBeenCalled()
            expect(vi.mocked(UserStatusModel).create).toHaveBeenCalled()
            expect(vi.mocked(UserPreferencesModel).create).toHaveBeenCalled()
            expect(vi.mocked(UserStatisticsModel).create).toHaveBeenCalled()
            expect(vi.mocked(UserTermsModel).create).toHaveBeenCalled()
        })

        it("deve encontrar usuário por ID", async () => {
            // Arrange
            const userId = "123456789"
            const mockSequelizeUser = {
                id: BigInt(userId),
                username: "test_user",
                name: "Test User",
                search_match_term: "test user",
                encrypted_password: "hashed_password",
                old_encrypted_password: null,
                description: "Test user description",
                last_password_updated_at: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                user_status: {
                    user_id: BigInt(userId),
                    access_level: Level.USER,
                    verified: true,
                    deleted: false,
                    blocked: false,
                    muted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            }

            vi.mocked(UserModel.findByPk).mockResolvedValue(mockSequelizeUser)
            UserMapper.toDomain.mockReturnValue(mockUser)

            // Act
            const result = await repository.findById(userId)

            // Assert
            expect(result).toBe(mockUser)
            expect(UserModel.findByPk).toHaveBeenCalledWith(BigInt(userId), expect.any(Object))
            expect(UserMapper.toDomain).toHaveBeenCalledWith(mockSequelizeUser)
        })

        it("deve encontrar usuário por username", async () => {
            // Arrange
            const username = "test_user"
            const mockSequelizeUser = {
                id: BigInt("123456789"),
                username,
                name: "Test User",
                search_match_term: "test user",
                encrypted_password: "hashed_password",
                old_encrypted_password: null,
                description: "Test user description",
                last_password_updated_at: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            vi.mocked(UserModel).findOne.mockResolvedValue(mockSequelizeUser)
            UserMapper.toDomain.mockReturnValue(mockUser)

            // Act
            const result = await repository.findByUsername(username)

            // Assert
            expect(result).toBe(mockUser)
            expect(vi.mocked(UserModel).findOne).toHaveBeenCalledWith({
                where: { username },
                include: expect.any(Array),
            })
            expect(UserMapper.toDomain).toHaveBeenCalledWith(mockSequelizeUser)
        })

        it("deve retornar null quando usuário não encontrado", async () => {
            // Arrange
            vi.mocked(UserModel).findByPk.mockResolvedValue(null)

            // Act
            const result = await repository.findById("999999999")

            // Assert
            expect(result).toBeNull()
        })

        it("deve verificar se usuário existe", async () => {
            // Arrange
            vi.mocked(UserModel).count.mockResolvedValue(1)

            // Act
            const result = await repository.exists("123456789")

            // Assert
            expect(result).toBe(true)
            expect(vi.mocked(UserModel).count).toHaveBeenCalledWith({
                where: { id: BigInt("123456789") },
            })
        })

        it("deve verificar se username existe", async () => {
            // Arrange
            vi.mocked(UserModel).count.mockResolvedValue(0)

            // Act
            const result = await repository.existsByUsername("nonexistent")

            // Assert
            expect(result).toBe(false)
            expect(vi.mocked(UserModel).count).toHaveBeenCalledWith({
                where: { username: "nonexistent" },
            })
        })
    })

    describe("Operações de Busca Avançada", () => {
        it("deve encontrar usuários ativos", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findActiveUsers()

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatusModel,
                            where: {
                                deleted: false,
                                blocked: false,
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })

        it("deve encontrar usuários verificados", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findVerifiedUsers()

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatusModel,
                            where: {
                                verified: true,
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })

        it("deve encontrar usuários por status", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersByStatus(Level.ADMIN)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatusModel,
                            where: {
                                access_level: Level.ADMIN,
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })
    })

    describe("Operações de Análise de Comportamento", () => {
        it("deve encontrar usuários por nível de atividade", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersByActivityLevel("medium")

            // Assert
            expect(result).toEqual(mockUsers)
            expect(mockUser.getActivityStats).toHaveBeenCalled()
        })

        it("deve encontrar usuários por score de reputação", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersByReputationScore(70, 80)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(mockUser.getReputationScore).toHaveBeenCalled()
        })

        it("deve encontrar usuários por data de criação", async () => {
            // Arrange
            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-12-31")
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersByCreationDate(startDate, endDate)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        createdAt: {
                            [Op.between]: [startDate, endDate],
                        },
                    },
                })
            )
        })

        it("deve encontrar novos usuários", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findNewUsers(7)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        createdAt: {
                            [Op.gte]: expect.any(Date),
                        },
                    },
                })
            )
        })

        it("deve encontrar usuários inativos", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findInactiveUsers(30)

            // Assert
            expect(result).toEqual([]) // Filtro retorna array vazio para usuários ativos
            expect(mockUser.updatedAt).toBeDefined()
        })
    })

    describe("Operações de Métricas", () => {
        it("deve encontrar usuários por taxa de engajamento", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersByEngagementRate(0.05, 0.15)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatisticsModel,
                            where: {
                                engagement_rate: {
                                    [Op.between]: [0.05, 0.15],
                                },
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })

        it("deve encontrar usuários por número de seguidores", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersByFollowersCount(1000, 5000)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatisticsModel,
                            where: {
                                total_followers: {
                                    [Op.between]: [1000, 5000],
                                },
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })

        it("deve encontrar top performers", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findTopPerformers(10)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: [
                        [{ model: UserStatisticsModel, as: "statistics" }, "engagement_rate", "DESC"],
                        [{ model: UserStatisticsModel, as: "statistics" }, "total_followers", "DESC"],
                    ],
                })
            )
        })

        it("deve encontrar influencers", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findInfluencers(1000, 0.05)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatisticsModel,
                            where: {
                                total_followers: { [Op.gte]: 1000 },
                                engagement_rate: { [Op.gte]: 0.05 },
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })
    })

    describe("Operações de Embeddings", () => {
        it("deve encontrar usuários com embeddings", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersWithEmbeddings()

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserEmbeddingModel,
                            where: {
                                embedding_vector: { [Op.ne]: null },
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })

        it("deve encontrar usuários sem embeddings", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersWithoutEmbeddings()

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserEmbeddingModel,
                            where: {
                                embedding_vector: { [Op.is]: null },
                            },
                            required: false,
                        }),
                    ]),
                })
            )
        })

        it("deve encontrar usuários por hashtags preferidas", async () => {
            // Arrange
            const hashtags = ["tech", "programming"]
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersByPreferredHashtags(hashtags)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserEmbeddingModel,
                            where: {
                                preferred_hashtags: {
                                    [Op.overlap]: hashtags,
                                },
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })
    })

    describe("Operações de Moderação", () => {
        it("deve encontrar usuários com problemas de moderação", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersWithModerationIssues()

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatisticsModel,
                            where: {
                                [Op.or]: [
                                    { violations_count: { [Op.gt]: 0 } },
                                    { reports_received: { [Op.gt]: 0 } },
                                ],
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })

        it("deve encontrar usuários por número de violações", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersByViolationsCount(1, 5)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatisticsModel,
                            where: {
                                violations_count: {
                                    [Op.between]: [1, 5],
                                },
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })

        it("deve encontrar usuários por número de reports", async () => {
            // Arrange
            const mockUsers = [mockUser]
            vi.mocked(UserModel).findAll.mockResolvedValue([{}])
            UserMapper.toDomainArray.mockReturnValue(mockUsers)

            // Act
            const result = await repository.findUsersByReportsCount(2, 10)

            // Assert
            expect(result).toEqual(mockUsers)
            expect(vi.mocked(UserModel).findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatisticsModel,
                            where: {
                                reports_received: {
                                    [Op.between]: [2, 10],
                                },
                            },
                            required: true,
                        }),
                    ]),
                })
            )
        })
    })

    describe("Operações de Contagem", () => {
        it("deve contar usuários", async () => {
            // Arrange
            vi.mocked(UserModel).count.mockResolvedValue(100)

            // Act
            const result = await repository.countUsers()

            // Assert
            expect(result).toBe(100)
            expect(vi.mocked(UserModel).count).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.any(Array),
                    distinct: true,
                })
            )
        })

        it("deve contar usuários ativos", async () => {
            // Arrange
            vi.mocked(UserModel).count.mockResolvedValue(75)

            // Act
            const result = await repository.countActiveUsers()

            // Assert
            expect(result).toBe(75)
            expect(vi.mocked(UserModel).count).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatusModel,
                            where: {
                                deleted: false,
                                blocked: false,
                            },
                            required: true,
                        }),
                    ]),
                    distinct: true,
                })
            )
        })

        it("deve contar usuários verificados", async () => {
            // Arrange
            vi.mocked(UserModel).count.mockResolvedValue(50)

            // Act
            const result = await repository.countVerifiedUsers()

            // Assert
            expect(result).toBe(50)
            expect(vi.mocked(UserModel).count).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatusModel,
                            where: {
                                verified: true,
                            },
                            required: true,
                        }),
                    ]),
                    distinct: true,
                })
            )
        })

        it("deve contar usuários por status", async () => {
            // Arrange
            vi.mocked(UserModel).count.mockResolvedValue(5)

            // Act
            const result = await repository.countUsersByStatus(Level.ADMIN)

            // Assert
            expect(result).toBe(5)
            expect(vi.mocked(UserModel).count).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({
                            model: UserStatusModel,
                            where: {
                                access_level: Level.ADMIN,
                            },
                            required: true,
                        }),
                    ]),
                    distinct: true,
                })
            )
        })
    })

    describe("Operações de Estatísticas", () => {
        it("deve obter estatísticas de usuários", async () => {
            // Arrange
            vi.mocked(UserModel).count
                .mockResolvedValueOnce(100) // totalUsers
                .mockResolvedValueOnce(75)  // activeUsers
                .mockResolvedValueOnce(50)  // verifiedUsers
                .mockResolvedValueOnce(5)   // blockedUsers
                .mockResolvedValueOnce(2)   // deletedUsers
                .mockResolvedValueOnce(1)   // mutedUsers
                .mockResolvedValueOnce(10)  // newUsersLast7Days
                .mockResolvedValueOnce(25)  // newUsersLast30Days

            // Act
            const result = await repository.getUsersStatistics()

            // Assert
            expect(result).toEqual({
                totalUsers: 100,
                activeUsers: 75,
                verifiedUsers: 50,
                blockedUsers: 5,
                deletedUsers: 2,
                mutedUsers: 1,
                newUsersLast7Days: 10,
                newUsersLast30Days: 25,
                inactiveUsersLast30Days: 0,
                usersWithEmbeddings: 0,
                usersWithModerationIssues: 0,
                averageReputationScore: 0,
                averageEngagementRate: 0,
                averageFollowers: 0,
                topPerformers: 0,
                influencers: 0,
            })
        })

        it("deve obter distribuição de atividade", async () => {
            // Arrange
            const expectedDistribution = { low: 0, medium: 0, high: 0 }

            // Act
            const result = await repository.getActivityDistribution()

            // Assert
            expect(result).toEqual(expectedDistribution)
        })

        it("deve obter distribuição de reputação", async () => {
            // Arrange
            const expectedDistribution = {
                excellent: 0,
                good: 0,
                average: 0,
                poor: 0,
                veryPoor: 0,
            }

            // Act
            const result = await repository.getReputationDistribution()

            // Assert
            expect(result).toEqual(expectedDistribution)
        })

        it("deve obter distribuição de engajamento", async () => {
            // Arrange
            const expectedDistribution = {
                veryHigh: 0,
                high: 0,
                medium: 0,
                low: 0,
                veryLow: 0,
            }

            // Act
            const result = await repository.getEngagementDistribution()

            // Assert
            expect(result).toEqual(expectedDistribution)
        })
    })

    describe("Operações em Lote", () => {
        it("deve criar múltiplos usuários", async () => {
            // Arrange
            const users = [mockUser, mockUser]
            const userData = mockUser.toJSON()

            UserMapper.toUserModelAttributes = vi.fn().mockReturnValue({
                id: BigInt(userData.id!),
                username: userData.username,
                name: userData.name,
                search_match_term: userData.searchMatchTerm,
                encrypted_password: userData.password,
                old_encrypted_password: userData.oldPassword,
                description: userData.description,
                last_password_updated_at: userData.lastPasswordUpdatedAt,
                createdAt: userData.createdAt!,
                updatedAt: userData.updatedAt!,
            })

            UserMapper.toUserStatusAttributes = vi.fn().mockReturnValue({
                user_id: BigInt(userData.id!),
                access_level: Level.USER,
                verified: true,
                deleted: false,
                blocked: false,
                muted: false,
            })

            UserMapper.toUserPreferencesAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserStatisticsAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserTermsAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserEmbeddingAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserInteractionSummaryAttributes = vi.fn().mockReturnValue(null)

            vi.mocked(UserModel).create.mockResolvedValue({})
            vi.mocked(UserStatusModel).create.mockResolvedValue({})

            // Act
            const result = await repository.createMany(users)

            // Assert
            expect(result).toEqual(users)
            expect(mockSequelize.transaction).toHaveBeenCalled()
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(vi.mocked(UserModel).create).toHaveBeenCalledTimes(2)
            expect(vi.mocked(UserStatusModel).create).toHaveBeenCalledTimes(2)
        })

        it("deve atualizar múltiplos usuários", async () => {
            // Arrange
            const users = [mockUser, mockUser]
            const userData = mockUser.toJSON()

            UserMapper.toUserModelAttributes = vi.fn().mockReturnValue({
                id: BigInt(userData.id!),
                username: userData.username,
                name: userData.name,
                search_match_term: userData.searchMatchTerm,
                encrypted_password: userData.password,
                old_encrypted_password: userData.oldPassword,
                description: userData.description,
                last_password_updated_at: userData.lastPasswordUpdatedAt,
                createdAt: userData.createdAt!,
                updatedAt: userData.updatedAt!,
            })

            UserMapper.toUserStatusAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserPreferencesAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserStatisticsAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserTermsAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserEmbeddingAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserInteractionSummaryAttributes = vi.fn().mockReturnValue(null)

            vi.mocked(UserModel).update.mockResolvedValue({})

            // Act
            const result = await repository.updateMany(users)

            // Assert
            expect(result).toEqual(users)
            expect(mockSequelize.transaction).toHaveBeenCalled()
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(vi.mocked(UserModel).update).toHaveBeenCalledTimes(2)
        })

        it("deve deletar múltiplos usuários", async () => {
            // Arrange
            const ids = ["123456789", "987654321"]

            // Act
            await repository.deleteMany(ids)

            // Assert
            expect(mockSequelize.transaction).toHaveBeenCalled()
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(vi.mocked(UserStatusModel).update).toHaveBeenCalledWith(
                {
                    deleted: true,
                },
                {
                    where: {
                        user_id: {
                            [Op.in]: [BigInt("123456789"), BigInt("987654321")],
                        },
                    },
                    transaction: mockTransaction,
                }
            )
        })

        it("deve atualizar status em lote", async () => {
            // Arrange
            const ids = ["123456789", "987654321"]
            const status = { verified: true, blocked: false }

            // Act
            await repository.bulkUpdateStatus(ids, status)

            // Assert
            expect(mockSequelize.transaction).toHaveBeenCalled()
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(vi.mocked(UserStatusModel).update).toHaveBeenCalledWith(
                status,
                {
                    where: {
                        user_id: {
                            [Op.in]: [BigInt("123456789"), BigInt("987654321")],
                        },
                    },
                    transaction: mockTransaction,
                }
            )
        })
    })

    describe("Tratamento de Erros", () => {
        it("deve fazer rollback em caso de erro na criação", async () => {
            // Arrange
            const userData = mockUser.toJSON()
            UserMapper.toUserModelAttributes = vi.fn().mockReturnValue({
                id: BigInt(userData.id!),
                username: userData.username,
                name: userData.name,
                search_match_term: userData.searchMatchTerm,
                encrypted_password: userData.password,
                old_encrypted_password: userData.oldPassword,
                description: userData.description,
                last_password_updated_at: userData.lastPasswordUpdatedAt,
                createdAt: userData.createdAt!,
                updatedAt: userData.updatedAt!,
            })

            UserMapper.toUserStatusAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserPreferencesAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserStatisticsAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserTermsAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserEmbeddingAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserInteractionSummaryAttributes = vi.fn().mockReturnValue(null)

            vi.mocked(UserModel).create.mockRejectedValue(new Error("Database error"))

            // Act & Assert
            await expect(repository.create(mockUser)).rejects.toThrow("Database error")
            expect(mockTransaction.rollback).toHaveBeenCalled()
            expect(mockTransaction.commit).not.toHaveBeenCalled()
        })

        it("deve fazer rollback em caso de erro na atualização", async () => {
            // Arrange
            const userData = mockUser.toJSON()
            UserMapper.toUserModelAttributes = vi.fn().mockReturnValue({
                id: BigInt(userData.id!),
                username: userData.username,
                name: userData.name,
                search_match_term: userData.searchMatchTerm,
                encrypted_password: userData.password,
                old_encrypted_password: userData.oldPassword,
                description: userData.description,
                last_password_updated_at: userData.lastPasswordUpdatedAt,
                createdAt: userData.createdAt!,
                updatedAt: userData.updatedAt!,
            })

            UserMapper.toUserStatusAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserPreferencesAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserStatisticsAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserTermsAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserEmbeddingAttributes = vi.fn().mockReturnValue(null)
            UserMapper.toUserInteractionSummaryAttributes = vi.fn().mockReturnValue(null)

            vi.mocked(UserModel).update.mockRejectedValue(new Error("Database error"))

            // Act & Assert
            await expect(repository.update(mockUser)).rejects.toThrow("Database error")
            expect(mockTransaction.rollback).toHaveBeenCalled()
            expect(mockTransaction.commit).not.toHaveBeenCalled()
        })

        it("deve fazer rollback em caso de erro na deleção", async () => {
            // Arrange
            vi.mocked(UserStatusModel).update.mockRejectedValue(new Error("Database error"))

            // Act & Assert
            await expect(repository.delete("123456789")).rejects.toThrow("Database error")
            expect(mockTransaction.rollback).toHaveBeenCalled()
            expect(mockTransaction.commit).not.toHaveBeenCalled()
        })
    })
})
