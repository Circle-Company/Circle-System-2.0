export * from "./entities/user.entity"
export * from "./entities/user.metrics.entity"
export * from "./types/user.type"
export * from "./user.errors"
export * from "./user.mapper"
export * from "./user.rules"

export type { IUserEmbeddingRepository } from "./repositories/user.embedding.repository"
export type {
    UserInteraction as DomainUserInteraction,
    IInteractionRepository,
    InteractionType as UserInteractionType,
} from "./repositories/user.interaction.repository"
export type {
    IUserMetricsRepository,
    UserMetricsAnalysis,
    UserMetricsAnalysisService,
    UserMetricsFilters,
    UserMetricsSearchOptions,
    UserMetricsSortOptions,
    UserMetricsStats,
} from "./repositories/user.metrics.repository"
export { IUserRepository, UserRepository } from "./repositories/user.repository"

export type {
    UserEmbedding,
    UserEntity,
    UserInterctionsSummary,
    UserPreferences,
    UserProfilePicture,
    UserProps,
    UserPublicProfile,
    UserStatus,
    UserTerm,
} from "./types/user.type"

export type {
    ActivityMetrics,
    GrowthMetrics,
    MetricsUpdateInput,
    UserMetricsProps,
} from "./types/user.metrics.type"
