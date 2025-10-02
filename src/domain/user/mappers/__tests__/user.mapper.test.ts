import { beforeEach, describe, expect, it } from "vitest"

import { Level } from "../../../authorization/authorization.type"
import { User } from "../../entities/user.entity"
import { UserMetrics } from "../../entities/user.metrics.entity"
import { UserProps } from "../../types/user.type"
import { UserMapper } from "../user.mapper"

describe("UserMapper", () => {
    let validUserProps: UserProps
    let mockSequelizeUser: any

    beforeEach(() => {
        validUserProps = {
            id: "123456789",
            username: "joao_silva",
            name: "João Silva",
            searchMatchTerm: "joao silva",
            password: "hashed_password_123",
            oldPassword: "old_hashed_password",
            description: "Desenvolvedor Full Stack",
            lastPasswordUpdatedAt: new Date("2023-01-01"),
            createdAt: new Date("2023-01-01"),
            updatedAt: new Date("2023-01-02"),
        }

        mockSequelizeUser = {
            id: BigInt("123456789"),
            username: "joao_silva",
            name: "João Silva",
            search_match_term: "joao silva",
            encrypted_password: "hashed_password_123",
            old_encrypted_password: "old_hashed_password",
            description: "Desenvolvedor Full Stack",
            last_password_updated_at: new Date("2023-01-01"),
            createdAt: new Date("2023-01-01"),
            updatedAt: new Date("2023-01-02"),
        }
    })

    describe("toDomain", () => {
        it("deve converter modelo Sequelize para entidade de domínio", () => {
            const domainUser = UserMapper.toDomain(mockSequelizeUser)

            expect(domainUser).toBeInstanceOf(User)
            expect(domainUser.id).toBe("123456789")
            expect(domainUser.username).toBe("joao_silva")
            expect(domainUser.name).toBe("João Silva")
            expect(domainUser.searchMatchTerm).toBe("joao silva")
            expect(domainUser.password).toBe("hashed_password_123")
            expect(domainUser.oldPassword).toBe("old_hashed_password")
            expect(domainUser.description).toBe("Desenvolvedor Full Stack")
            expect(domainUser.lastPasswordUpdatedAt).toEqual(new Date("2023-01-01"))
            expect(domainUser.createdAt).toEqual(new Date("2023-01-01"))
            expect(domainUser.updatedAt).toEqual(new Date("2023-01-02"))
        })

        it("deve converter modelo Sequelize com dados relacionados", () => {
            const sequelizeUserWithRelations = {
                ...mockSequelizeUser,
                status: {
                    access_level: Level.USER,
                    verified: true,
                    deleted: false,
                    blocked: false,
                    muted: false,
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
                preferences: {
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
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
                statistics: {
                    user_id: BigInt("123456789"),
                    total_likes_received: 100,
                    total_views_received: 500,
                    total_shares_received: 50,
                    total_comments_received: 25,
                    total_memories_created: 10,
                    total_moments_created: 5,
                    total_likes_given: 200,
                    total_comments_given: 30,
                    total_shares_given: 15,
                    total_follows_given: 20,
                    total_reports_given: 2,
                    total_followers: 150,
                    total_following: 100,
                    total_relations: 250,
                    days_active_last_30: 25,
                    days_active_last_7: 6,
                    last_active_date: new Date("2023-01-01"),
                    current_streak_days: 5,
                    longest_streak_days: 10,
                    engagement_rate: 0.15,
                    reach_rate: 0.8,
                    moments_published_growth_rate_30d: 0.1,
                    memories_published_growth_rate_30d: 0.2,
                    follower_growth_rate_30d: 0.05,
                    engagement_growth_rate_30d: 0.1,
                    interactions_growth_rate_30d: 0.12,
                    memories_per_day_average: 0.5,
                    moments_per_day_average: 0.2,
                    reports_received: 1,
                    violations_count: 0,
                    last_metrics_update: new Date("2023-01-01"),
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
                user_terms: {
                    terms_and_conditions_agreed: true,
                    terms_and_conditions_agreed_version: "1.0",
                    terms_and_conditions_agreed_at: new Date("2023-01-01"),
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
                user_embedding: {
                    userId: "123456789",
                    vector: "serialized_vector",
                    dimension: 128,
                    metadata: { source: "test" },
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
                user_interaction_summary: {
                    userId: BigInt("123456789"),
                    totalInteractions: 1000,
                    lastInteractionDate: new Date("2023-01-01"),
                    interactionCounts: { like: 500, comment: 300, share: 200 },
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
            }

            const domainUser = UserMapper.toDomain(sequelizeUserWithRelations)

            expect(domainUser.status).toEqual({
                accessLevel: Level.USER,
                verified: true,
                deleted: false,
                blocked: false,
                muted: false,
                createdAt: new Date("2023-01-01"),
                updatedAt: new Date("2023-01-02"),
            })

            expect(domainUser.preferences).toEqual({
                appLanguage: "pt",
                appTimezone: -3,
                disableAutoplay: false,
                disableHaptics: false,
                disableTranslation: false,
                translationLanguage: "pt",
                disableLikeMomentPushNotification: false,
                disableNewMemoryPushNotification: false,
                disableAddToMemoryPushNotification: false,
                disableFollowUserPushNotification: false,
                disableViewUserPushNotification: false,
                disableNewsPushNotification: false,
                disableSugestionsPushNotification: false,
                disableAroundYouPushNotification: false,
                createdAt: new Date("2023-01-01"),
                updatedAt: new Date("2023-01-02"),
            })

            expect(domainUser.metrics).toBeInstanceOf(UserMetrics)
            expect(domainUser.metrics?.userId).toBe("123456789")
            expect(domainUser.metrics?.totalLikesReceived).toBe(100)
            expect(domainUser.metrics?.totalViewsReceived).toBe(500)
            expect(domainUser.metrics?.totalSharesReceived).toBe(50)
            expect(domainUser.metrics?.totalCommentsReceived).toBe(25)
            expect(domainUser.metrics?.totalMemoriesCreated).toBe(10)
            expect(domainUser.metrics?.totalMomentsCreated).toBe(5)
            expect(domainUser.metrics?.totalLikesGiven).toBe(200)
            expect(domainUser.metrics?.totalCommentsGiven).toBe(30)
            expect(domainUser.metrics?.totalSharesGiven).toBe(15)
            expect(domainUser.metrics?.totalFollowsGiven).toBe(20)
            expect(domainUser.metrics?.totalReportsGiven).toBe(2)
            expect(domainUser.metrics?.totalFollowers).toBe(150)
            expect(domainUser.metrics?.totalFollowing).toBe(100)
            expect(domainUser.metrics?.totalRelations).toBe(250)
            expect(domainUser.metrics?.engagementRate).toBe(0.15)
            expect(domainUser.metrics?.reachRate).toBe(0.8)
            expect(domainUser.metrics?.momentsPublishedGrowthRate30d).toBe(0.1)
            expect(domainUser.metrics?.memoriesPublishedGrowthRate30d).toBe(0.2)
            expect(domainUser.metrics?.followerGrowthRate30d).toBe(0.05)
            expect(domainUser.metrics?.engagementGrowthRate30d).toBe(0.1)
            expect(domainUser.metrics?.interactionsGrowthRate30d).toBe(0.12)
            expect(domainUser.metrics?.memoriesPerDayAverage).toBe(0.5)
            expect(domainUser.metrics?.momentsPerDayAverage).toBe(0.2)
            expect(domainUser.metrics?.reportsReceived).toBe(1)
            expect(domainUser.metrics?.violationsCount).toBe(0)
            expect(domainUser.metrics?.lastMetricsUpdate).toEqual(new Date("2023-01-01"))
            expect(domainUser.metrics?.createdAt).toEqual(new Date("2023-01-01"))
            expect(domainUser.metrics?.updatedAt).toEqual(new Date("2023-01-02"))

            expect(domainUser.terms).toEqual({
                termsAndConditionsAgreed: true,
                termsAndConditionsAgreedVersion: "1.0",
                termsAndConditionsAgreedAt: new Date("2023-01-01"),
                createdAt: new Date("2023-01-01"),
                updatedAt: new Date("2023-01-02"),
            })

            expect(domainUser.embedding).toEqual({
                vector: "serialized_vector",
                dimension: 128,
                metadata: { source: "test" },
                createdAt: new Date("2023-01-01"),
                updatedAt: new Date("2023-01-02"),
            })

            expect(domainUser.interctionsSummary).toEqual({
                totalInteractions: 1000,
                lastInteractionDate: new Date("2023-01-01"),
                interactionCounts: { like: 500, comment: 300, share: 200 },
                createdAt: new Date("2023-01-01"),
                updatedAt: new Date("2023-01-02"),
            })
        })
    })

    describe("toUserModelAttributes", () => {
        it("deve converter entidade de domínio para atributos do modelo User", () => {
            const user = new User(validUserProps)
            const attributes = UserMapper.toUserModelAttributes(user)

            expect(attributes).toEqual({
                id: BigInt("123456789"),
                username: "joao_silva",
                name: "João Silva",
                search_match_term: "joao silva",
                encrypted_password: "hashed_password_123",
                old_encrypted_password: "old_hashed_password",
                description: "Desenvolvedor Full Stack",
                last_password_updated_at: new Date("2023-01-01"),
                createdAt: new Date("2023-01-01"),
                updatedAt: new Date("2023-01-02"),
            })
        })

        it("deve converter valores null corretamente", () => {
            const userPropsWithNulls = {
                ...validUserProps,
                name: null,
                oldPassword: null,
                description: null,
                lastPasswordUpdatedAt: null,
            }
            const user = new User(userPropsWithNulls)
            const attributes = UserMapper.toUserModelAttributes(user)

            expect(attributes.name).toBeNull()
            expect(attributes.old_encrypted_password).toBeNull()
            expect(attributes.description).toBeNull()
            expect(attributes.last_password_updated_at).toBeNull()
        })
    })

    describe("toUserStatusAttributes", () => {
        it("deve converter entidade de domínio para atributos do modelo UserStatus", () => {
            const userPropsWithStatus = {
                ...validUserProps,
                status: {
                    accessLevel: Level.USER,
                    verified: true,
                    deleted: false,
                    blocked: false,
                    muted: false,
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
            }
            const user = new User(userPropsWithStatus)
            const attributes = UserMapper.toUserStatusAttributes(user)

            expect(attributes).toEqual({
                user_id: BigInt("123456789"),
                access_level: Level.USER,
                verified: true,
                deleted: false,
                blocked: false,
                muted: false,
            })
        })

        it("deve retornar null se status não existir", () => {
            const user = new User(validUserProps)
            const attributes = UserMapper.toUserStatusAttributes(user)

            expect(attributes).toBeNull()
        })
    })

    describe("toUserPreferencesAttributes", () => {
        it("deve converter entidade de domínio para atributos do modelo UserPreferences", () => {
            const userPropsWithPreferences = {
                ...validUserProps,
                preferences: {
                    appLanguage: "pt",
                    appTimezone: -3,
                    disableAutoplay: false,
                    disableHaptics: false,
                    disableTranslation: false,
                    translationLanguage: "pt",
                    disableLikeMomentPushNotification: false,
                    disableNewMemoryPushNotification: false,
                    disableAddToMemoryPushNotification: false,
                    disableFollowUserPushNotification: false,
                    disableViewUserPushNotification: false,
                    disableNewsPushNotification: false,
                    disableSugestionsPushNotification: false,
                    disableAroundYouPushNotification: false,
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
            }
            const user = new User(userPropsWithPreferences)
            const attributes = UserMapper.toUserPreferencesAttributes(user)

            expect(attributes).toEqual({
                user_id: BigInt("123456789"),
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
            })
        })

        it("deve retornar null se preferences não existir", () => {
            const user = new User(validUserProps)
            const attributes = UserMapper.toUserPreferencesAttributes(user)

            expect(attributes).toBeNull()
        })
    })

    describe("toUserStatisticsAttributes", () => {
        it("deve converter entidade de domínio para atributos do modelo UserStatistics", () => {
            const userPropsWithMetrics = {
                ...validUserProps,
                metrics: {
                    totalLikesReceived: 100,
                    totalViewsReceived: 500,
                    totalSharesReceived: 50,
                    totalCommentsReceived: 25,
                    totalMemoriesCreated: 10,
                    totalMomentsCreated: 5,
                    totalLikesGiven: 200,
                    totalCommentsGiven: 30,
                    totalSharesGiven: 15,
                    totalFollowsGiven: 20,
                    totalReportsGiven: 2,
                    totalFollowers: 150,
                    totalFollowing: 100,
                    totalRelations: 250,
                    daysActiveLast30: 25,
                    daysActiveLast7: 6,
                    lastActiveDate: new Date("2023-01-01"),
                    currentStreakDays: 5,
                    longestStreakDays: 10,
                    engagementRate: 0.15,
                    reachRate: 0.8,
                    momentsPublishedGrowthRate30d: 0.1,
                    memoriesPublishedGrowthRate30d: 0.2,
                    followerGrowthRate30d: 0.05,
                    engagementGrowthRate30d: 0.1,
                    interactionsGrowthRate30d: 0.12,
                    memoriesPerDayAverage: 0.5,
                    momentsPerDayAverage: 0.2,
                    reportsReceived: 1,
                    violationsCount: 0,
                    lastMetricsUpdate: new Date("2023-01-01"),
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
            }
            const user = new User(userPropsWithMetrics)
            const attributes = UserMapper.toUserStatisticsAttributes(user)

            expect(attributes).toEqual({
                user_id: BigInt("123456789"),
                total_likes_received: 100,
                total_views_received: 500,
                total_shares_received: 50,
                total_comments_received: 25,
                total_memories_created: 10,
                total_moments_created: 5,
                total_likes_given: 200,
                total_comments_given: 30,
                total_shares_given: 15,
                total_follows_given: 20,
                total_reports_given: 2,
                total_followers: 150,
                total_following: 100,
                total_relations: 250,
                days_active_last_30: 0,
                days_active_last_7: 0,
                last_active_date: expect.any(Date),
                current_streak_days: 0,
                longest_streak_days: 0,
                engagement_rate: 0.15,
                reach_rate: 0.8,
                moments_published_growth_rate_30d: 0.1,
                memories_published_growth_rate_30d: 0.2,
                follower_growth_rate_30d: 0.05,
                engagement_growth_rate_30d: 0.1,
                interactions_growth_rate_30d: 0.12,
                memories_per_day_average: 0.5,
                moments_per_day_average: 0.2,
                reports_received: 1,
                violations_count: 0,
                last_metrics_update: new Date("2023-01-01"),
            })
        })

        it("deve retornar null se metrics não existir", () => {
            const user = new User(validUserProps)
            const attributes = UserMapper.toUserStatisticsAttributes(user)

            expect(attributes).toBeNull()
        })
    })

    describe("toUserTermsAttributes", () => {
        it("deve converter entidade de domínio para atributos do modelo UserTerms", () => {
            const userPropsWithTerms = {
                ...validUserProps,
                terms: {
                    termsAndConditionsAgreed: true,
                    termsAndConditionsAgreedVersion: "1.0",
                    termsAndConditionsAgreedAt: new Date("2023-01-01"),
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
            }
            const user = new User(userPropsWithTerms)
            const attributes = UserMapper.toUserTermsAttributes(user)

            expect(attributes).toEqual({
                user_id: BigInt("123456789"),
                terms_and_conditions_agreed: true,
                terms_and_conditions_agreed_version: "1.0",
                terms_and_conditions_agreed_at: new Date("2023-01-01"),
            })
        })

        it("deve retornar null se terms não existir", () => {
            const user = new User(validUserProps)
            const attributes = UserMapper.toUserTermsAttributes(user)

            expect(attributes).toBeNull()
        })
    })

    describe("toUserEmbeddingAttributes", () => {
        it("deve converter entidade de domínio para atributos do modelo UserEmbedding", () => {
            const userPropsWithEmbedding = {
                ...validUserProps,
                embedding: {
                    vector: "serialized_vector",
                    dimension: 128,
                    metadata: { source: "test" },
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
            }
            const user = new User(userPropsWithEmbedding)
            const attributes = UserMapper.toUserEmbeddingAttributes(user)

            expect(attributes).toEqual({
                userId: BigInt("123456789"),
                vector: "serialized_vector",
                dimension: 128,
                metadata: { source: "test" },
            })
        })

        it("deve retornar null se embedding não existir", () => {
            const user = new User(validUserProps)
            const attributes = UserMapper.toUserEmbeddingAttributes(user)

            expect(attributes).toBeNull()
        })
    })

    describe("toUserInteractionSummaryAttributes", () => {
        it("deve converter entidade de domínio para atributos do modelo UserInteractionSummary", () => {
            const userPropsWithSummary = {
                ...validUserProps,
                interctionsSummary: {
                    totalInteractions: 1000,
                    lastInteractionDate: new Date("2023-01-01"),
                    interactionCounts: { like: 500, comment: 300, share: 200 },
                    createdAt: new Date("2023-01-01"),
                    updatedAt: new Date("2023-01-02"),
                },
            }
            const user = new User(userPropsWithSummary)
            const attributes = UserMapper.toUserInteractionSummaryAttributes(user)

            expect(attributes).toEqual({
                userId: BigInt("123456789"),
                totalInteractions: 1000,
                lastInteractionDate: new Date("2023-01-01"),
                interactionCounts: { like: 500, comment: 300, share: 200 },
            })
        })

        it("deve retornar null se interctionsSummary não existir", () => {
            const user = new User(validUserProps)
            const attributes = UserMapper.toUserInteractionSummaryAttributes(user)

            expect(attributes).toBeNull()
        })
    })

    describe("toDomainArray", () => {
        it("deve converter array de modelos Sequelize para array de entidades de domínio", () => {
            const sequelizeUsers = [
                mockSequelizeUser,
                { ...mockSequelizeUser, id: BigInt("987654321"), username: "maria_santos" },
            ]
            const domainUsers = UserMapper.toDomainArray(sequelizeUsers)

            expect(domainUsers).toHaveLength(2)
            expect(domainUsers[0]).toBeInstanceOf(User)
            expect(domainUsers[1]).toBeInstanceOf(User)
            expect(domainUsers[0].id).toBe("123456789")
            expect(domainUsers[1].id).toBe("987654321")
            expect(domainUsers[0].username).toBe("joao_silva")
            expect(domainUsers[1].username).toBe("maria_santos")
        })

        it("deve retornar array vazio se array de entrada for vazio", () => {
            const domainUsers = UserMapper.toDomainArray([])

            expect(domainUsers).toHaveLength(0)
        })
    })
})
