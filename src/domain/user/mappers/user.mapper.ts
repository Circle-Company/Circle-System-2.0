import { Level } from "../../authorization/authorization.type"
import { User as DomainUser } from "../entities/user.entity"
import { UserProps } from "../types/user.type"

// Interfaces para os modelos Sequelize
interface UserModelAttributes {
    id: bigint
    username: string
    name: string | null
    search_match_term: string
    encrypted_password: string
    old_encrypted_password: string | null
    description: string | null
    last_password_updated_at: Date | null
    createdAt: Date
    updatedAt: Date
}

interface UserStatusModelAttributes {
    user_id: bigint
    access_level: Level
    verified: boolean
    deleted: boolean
    blocked: boolean
    muted: boolean
    createdAt: Date
    updatedAt: Date
}

interface UserPreferencesModelAttributes {
    user_id: bigint
    app_language: string
    app_timezone: number
    disable_autoplay: boolean
    disable_haptics: boolean
    disable_translation: boolean
    translation_language: string
    disable_like_moment_push_notification: boolean
    disable_new_memory_push_notification: boolean
    disable_add_to_memory_push_notification: boolean
    disable_follow_user_push_notification: boolean
    disable_view_user_push_notification: boolean
    disable_news_push_notification: boolean
    disable_sugestions_push_notification: boolean
    disable_around_you_push_notification: boolean
    default_moment_visibility?: string
    createdAt: Date
    updatedAt: Date
}

interface UserStatisticsModelAttributes {
    user_id: bigint
    total_likes_received: number
    total_views_received: number
    total_shares_received: number
    total_comments_received: number
    total_memories_created: number
    total_moments_created: number
    total_likes_given: number
    total_comments_given: number
    total_shares_given: number
    total_follows_given: number
    total_reports_given: number
    total_followers: number
    total_following: number
    total_relations: number
    days_active_last_30: number
    days_active_last_7: number
    last_active_date: Date
    current_streak_days: number
    longest_streak_days: number
    engagement_rate: number
    reach_rate: number
    moments_published_growth_rate_30d: number
    memories_published_growth_rate_30d: number
    follower_growth_rate_30d: number
    engagement_growth_rate_30d: number
    interactions_growth_rate_30d: number
    memories_per_day_average: number
    moments_per_day_average: number
    reports_received: number
    violations_count: number
    last_metrics_update: Date
    createdAt: Date
    updatedAt: Date
}

interface UserTermsModelAttributes {
    user_id: bigint
    terms_and_conditions_agreed: boolean
    terms_and_conditions_agreed_version: string
    terms_and_conditions_agreed_at: Date
    createdAt: Date
    updatedAt: Date
}

interface UserEmbeddingModelAttributes {
    userId: string
    vector: string
    dimension: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface UserInteractionSummaryModelAttributes {
    userId: bigint
    totalInteractions: number
    lastInteractionDate: Date | null
    interactionCounts: Record<string, number>
    createdAt: Date
    updatedAt: Date
}

// Interface para o modelo completo com relacionamentos
interface CompleteUserModel {
    id: bigint
    username: string
    name: string | null
    search_match_term: string
    encrypted_password: string
    old_encrypted_password: string | null
    description: string | null
    last_password_updated_at: Date | null
    createdAt: Date
    updatedAt: Date
    user_status?: UserStatusModelAttributes
    preferences?: UserPreferencesModelAttributes
    statistics?: UserStatisticsModelAttributes
    user_terms?: UserTermsModelAttributes
    user_embedding?: UserEmbeddingModelAttributes
    user_interaction_summary?: UserInteractionSummaryModelAttributes
}

export class UserMapper {
    /**
     * Converte modelo Sequelize completo para entidade de domínio
     */
    static toDomain(sequelizeUser: CompleteUserModel): DomainUser {
        const userData: UserProps = {
            id: sequelizeUser.id.toString(),
            username: sequelizeUser.username,
            name: sequelizeUser.name,
            searchMatchTerm: sequelizeUser.search_match_term,
            password: sequelizeUser.encrypted_password,
            oldPassword: sequelizeUser.old_encrypted_password,
            description: sequelizeUser.description,
            lastPasswordUpdatedAt: sequelizeUser.last_password_updated_at,
            createdAt: sequelizeUser.createdAt,
            updatedAt: sequelizeUser.updatedAt,
        }

        // Mapear dados relacionados se existirem
        if (sequelizeUser.user_status) {
            userData.status = {
                accessLevel: sequelizeUser.user_status.access_level,
                verified: sequelizeUser.user_status.verified,
                deleted: sequelizeUser.user_status.deleted,
                blocked: sequelizeUser.user_status.blocked,
                muted: sequelizeUser.user_status.muted,
                createdAt: sequelizeUser.user_status.createdAt,
                updatedAt: sequelizeUser.user_status.updatedAt,
            }
        }

        if (sequelizeUser.preferences) {
            userData.preferences = {
                appLanguage: sequelizeUser.preferences.app_language,
                appTimezone: sequelizeUser.preferences.app_timezone,
                disableAutoplay: sequelizeUser.preferences.disable_autoplay,
                disableHaptics: sequelizeUser.preferences.disable_haptics,
                disableTranslation: sequelizeUser.preferences.disable_translation,
                translationLanguage: sequelizeUser.preferences.translation_language,
                disableLikeMomentPushNotification:
                    sequelizeUser.preferences.disable_like_moment_push_notification,
                disableNewMemoryPushNotification:
                    sequelizeUser.preferences.disable_new_memory_push_notification,
                disableAddToMemoryPushNotification:
                    sequelizeUser.preferences.disable_add_to_memory_push_notification,
                disableFollowUserPushNotification:
                    sequelizeUser.preferences.disable_follow_user_push_notification,
                disableViewUserPushNotification:
                    sequelizeUser.preferences.disable_view_user_push_notification,
                disableNewsPushNotification:
                    sequelizeUser.preferences.disable_news_push_notification,
                disableSugestionsPushNotification:
                    sequelizeUser.preferences.disable_sugestions_push_notification,
                disableAroundYouPushNotification:
                    sequelizeUser.preferences.disable_around_you_push_notification,
                defaultMomentVisibility: sequelizeUser.preferences.default_moment_visibility as 'public' | 'followers_only' | 'private',
                createdAt: sequelizeUser.preferences.createdAt,
                updatedAt: sequelizeUser.preferences.updatedAt,
            }
        }

        if (sequelizeUser.statistics) {
            userData.metrics = {
                totalLikesReceived: sequelizeUser.statistics.total_likes_received,
                totalViewsReceived: sequelizeUser.statistics.total_views_received,
                totalSharesReceived: sequelizeUser.statistics.total_shares_received,
                totalCommentsReceived: sequelizeUser.statistics.total_comments_received,
                totalMemoriesCreated: sequelizeUser.statistics.total_memories_created,
                totalMomentsCreated: sequelizeUser.statistics.total_moments_created,
                totalLikesGiven: sequelizeUser.statistics.total_likes_given,
                totalCommentsGiven: sequelizeUser.statistics.total_comments_given,
                totalSharesGiven: sequelizeUser.statistics.total_shares_given,
                totalFollowsGiven: sequelizeUser.statistics.total_follows_given,
                totalReportsGiven: sequelizeUser.statistics.total_reports_given,
                totalFollowers: sequelizeUser.statistics.total_followers,
                totalFollowing: sequelizeUser.statistics.total_following,
                totalRelations: sequelizeUser.statistics.total_relations,
                // Removido: daysActiveLast30, daysActiveLast7, lastActiveDate, currentStreakDays, longestStreakDays
                // Essas propriedades não existem na interface UserMetrics
                engagementRate: sequelizeUser.statistics.engagement_rate,
                reachRate: sequelizeUser.statistics.reach_rate,
                momentsPublishedGrowthRate30d:
                    sequelizeUser.statistics.moments_published_growth_rate_30d,
                memoriesPublishedGrowthRate30d:
                    sequelizeUser.statistics.memories_published_growth_rate_30d,
                followerGrowthRate30d: sequelizeUser.statistics.follower_growth_rate_30d,
                engagementGrowthRate30d: sequelizeUser.statistics.engagement_growth_rate_30d,
                interactionsGrowthRate30d: sequelizeUser.statistics.interactions_growth_rate_30d,
                memoriesPerDayAverage: sequelizeUser.statistics.memories_per_day_average,
                momentsPerDayAverage: sequelizeUser.statistics.moments_per_day_average,
                reportsReceived: sequelizeUser.statistics.reports_received,
                violationsCount: sequelizeUser.statistics.violations_count,
                lastMetricsUpdate: sequelizeUser.statistics.last_metrics_update,
                createdAt: sequelizeUser.statistics.createdAt,
                updatedAt: sequelizeUser.statistics.updatedAt,
            }
        }

        if (sequelizeUser.user_terms) {
            userData.terms = {
                termsAndConditionsAgreed: sequelizeUser.user_terms.terms_and_conditions_agreed,
                termsAndConditionsAgreedVersion:
                    sequelizeUser.user_terms.terms_and_conditions_agreed_version,
                termsAndConditionsAgreedAt: sequelizeUser.user_terms.terms_and_conditions_agreed_at,
                createdAt: sequelizeUser.user_terms.createdAt,
                updatedAt: sequelizeUser.user_terms.updatedAt,
            }
        }

        if (sequelizeUser.user_embedding) {
            userData.embedding = {
                vector: sequelizeUser.user_embedding.vector,
                dimension: sequelizeUser.user_embedding.dimension,
                metadata: sequelizeUser.user_embedding.metadata,
                createdAt: sequelizeUser.user_embedding.createdAt,
                updatedAt: sequelizeUser.user_embedding.updatedAt,
            }
        }

        if (sequelizeUser.user_interaction_summary) {
            userData.interctionsSummary = {
                totalInteractions: sequelizeUser.user_interaction_summary.totalInteractions,
                lastInteractionDate: sequelizeUser.user_interaction_summary.lastInteractionDate,
                interactionCounts: sequelizeUser.user_interaction_summary.interactionCounts,
                createdAt: sequelizeUser.user_interaction_summary.createdAt,
                updatedAt: sequelizeUser.user_interaction_summary.updatedAt,
            }
        }

        return new DomainUser(userData)
    }

    /**
     * Converte entidade de domínio para atributos do modelo User principal
     */
    static toUserModelAttributes(domainUser: DomainUser): UserModelAttributes {
        const userData = domainUser.toJSON()

        return {
            id: BigInt(userData.id!),
            username: userData.username,
            name: userData.name || null,
            search_match_term: userData.searchMatchTerm,
            encrypted_password: userData.password,
            old_encrypted_password: userData.oldPassword || null,
            description: userData.description || null,
            last_password_updated_at: userData.lastPasswordUpdatedAt || null,
            createdAt: userData.createdAt!,
            updatedAt: userData.updatedAt!,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo UserStatus
     */
    static toUserStatusAttributes(
        domainUser: DomainUser,
    ): Omit<UserStatusModelAttributes, "createdAt" | "updatedAt"> | null {
        const userData = domainUser.toJSON()

        if (!userData.status) return null

        return {
            user_id: BigInt(userData.id!),
            access_level: userData.status.accessLevel,
            verified: userData.status.verified,
            deleted: userData.status.deleted,
            blocked: userData.status.blocked,
            muted: userData.status.muted,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo UserPreferences
     */
    static toUserPreferencesAttributes(
        domainUser: DomainUser,
    ): Omit<UserPreferencesModelAttributes, "createdAt" | "updatedAt"> | null {
        const userData = domainUser.toJSON()

        if (!userData.preferences) return null

        return {
            user_id: BigInt(userData.id!),
            app_language: userData.preferences.appLanguage,
            app_timezone: userData.preferences.appTimezone,
            disable_autoplay: userData.preferences.disableAutoplay,
            disable_haptics: userData.preferences.disableHaptics,
            disable_translation: userData.preferences.disableTranslation,
            translation_language: userData.preferences.translationLanguage,
            disable_like_moment_push_notification:
                userData.preferences.disableLikeMomentPushNotification,
            disable_new_memory_push_notification:
                userData.preferences.disableNewMemoryPushNotification,
            disable_add_to_memory_push_notification:
                userData.preferences.disableAddToMemoryPushNotification,
            disable_follow_user_push_notification:
                userData.preferences.disableFollowUserPushNotification,
            disable_view_user_push_notification:
                userData.preferences.disableViewUserPushNotification,
            disable_news_push_notification: userData.preferences.disableNewsPushNotification,
            disable_sugestions_push_notification:
                userData.preferences.disableSugestionsPushNotification,
            disable_around_you_push_notification:
                userData.preferences.disableAroundYouPushNotification,
            default_moment_visibility: userData.preferences.defaultMomentVisibility,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo UserStatistics
     */
    static toUserStatisticsAttributes(
        domainUser: DomainUser,
    ): Omit<UserStatisticsModelAttributes, "createdAt" | "updatedAt"> | null {
        const userData = domainUser.toJSON()

        if (!userData.metrics) return null

        return {
            user_id: BigInt(userData.id!),
            total_likes_received: userData.metrics.totalLikesReceived,
            total_views_received: userData.metrics.totalViewsReceived,
            total_shares_received: userData.metrics.totalSharesReceived,
            total_comments_received: userData.metrics.totalCommentsReceived,
            total_memories_created: userData.metrics.totalMemoriesCreated,
            total_moments_created: userData.metrics.totalMomentsCreated,
            total_likes_given: userData.metrics.totalLikesGiven,
            total_comments_given: userData.metrics.totalCommentsGiven,
            total_shares_given: userData.metrics.totalSharesGiven,
            total_follows_given: userData.metrics.totalFollowsGiven,
            total_reports_given: userData.metrics.totalReportsGiven,
            total_followers: userData.metrics.totalFollowers,
            total_following: userData.metrics.totalFollowing,
            total_relations: userData.metrics.totalRelations,
            days_active_last_30: 0, // Valor padrão
            days_active_last_7: 0, // Valor padrão
            last_active_date: new Date(), // Valor padrão
            current_streak_days: 0, // Valor padrão
            longest_streak_days: 0, // Valor padrão
            engagement_rate: userData.metrics.engagementRate,
            reach_rate: userData.metrics.reachRate,
            moments_published_growth_rate_30d: userData.metrics.momentsPublishedGrowthRate30d,
            memories_published_growth_rate_30d: userData.metrics.memoriesPublishedGrowthRate30d,
            follower_growth_rate_30d: userData.metrics.followerGrowthRate30d,
            engagement_growth_rate_30d: userData.metrics.engagementGrowthRate30d,
            interactions_growth_rate_30d: userData.metrics.interactionsGrowthRate30d,
            memories_per_day_average: userData.metrics.memoriesPerDayAverage,
            moments_per_day_average: userData.metrics.momentsPerDayAverage,
            reports_received: userData.metrics.reportsReceived,
            violations_count: userData.metrics.violationsCount,
            last_metrics_update: userData.metrics.lastMetricsUpdate,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo UserTerms
     */
    static toUserTermsAttributes(
        domainUser: DomainUser,
    ): Omit<UserTermsModelAttributes, "createdAt" | "updatedAt"> | null {
        const userData = domainUser.toJSON()

        if (!userData.terms) return null

        return {
            user_id: BigInt(userData.id!),
            terms_and_conditions_agreed: userData.terms.termsAndConditionsAgreed,
            terms_and_conditions_agreed_version: userData.terms.termsAndConditionsAgreedVersion,
            terms_and_conditions_agreed_at: userData.terms.termsAndConditionsAgreedAt,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo UserEmbedding
     */
    static toUserEmbeddingAttributes(
        domainUser: DomainUser,
    ): Omit<UserEmbeddingModelAttributes, "createdAt" | "updatedAt"> | null {
        const userData = domainUser.toJSON()

        if (!userData.embedding) return null

        return {
            userId: userData.id!,
            vector: userData.embedding.vector,
            dimension: userData.embedding.dimension,
            metadata: userData.embedding.metadata,
        }
    }

    /**
     * Converte entidade de domínio para atributos do modelo UserInteractionSummary
     */
    static toUserInteractionSummaryAttributes(
        domainUser: DomainUser,
    ): Omit<UserInteractionSummaryModelAttributes, "createdAt" | "updatedAt"> | null {
        const userData = domainUser.toJSON()

        if (!userData.interctionsSummary) return null

        return {
            userId: BigInt(userData.id!),
            totalInteractions: userData.interctionsSummary.totalInteractions,
            lastInteractionDate: userData.interctionsSummary.lastInteractionDate,
            interactionCounts: userData.interctionsSummary.interactionCounts,
        }
    }

    /**
     * Converte múltiplos modelos Sequelize para array de entidades de domínio
     */
    static toDomainArray(sequelizeUsers: CompleteUserModel[]): DomainUser[] {
        return sequelizeUsers.map((user) => this.toDomain(user))
    }
}
