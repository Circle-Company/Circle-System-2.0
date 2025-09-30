/**
 * Exportações do módulo de domínio de usuário
 *
 * Reorganizado seguindo o padrão de estrutura do momento:
 * - entities/ - Entidades de domínio
 * - types/ - Tipos e interfaces
 * - repositories/ - Interfaces e implementações de repositórios
 * - mappers/ - Mappers entre domínio e infraestrutura
 * - rules/ - Regras de negócio e validação);
 * - errors/ - Erros específicos do domínio
 */

// Entidades principais
export { User } from "./entities/user.entity"
export { UserMetrics } from "./entities/user.metrics.entity"

// Mappers
export { UserMapper } from "./mappers/user.mapper"

// Repositórios
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

// Tipos
export type {
    UserEmbedding,
    UserEntity,
    UserInterctionsSummary,
    UserPreferences,
    UserProfilePicture,
    UserProps,
    UserStatus,
    UserTerms,
} from "./types/user.type"

export { UserRole, UserStatusEnum } from "./types/user.type"

export type {
    ActivityMetrics,
    GrowthMetrics,
    MetricsUpdateInput,
    UserMetricsProps,
} from "./types/user.metrics.type"

// Regras
export {
    UserValidationRules,
    UserValidationRulesFactory,
    UserValidator,
} from "./rules/user.validation.rules"

// Erros
export {
    UserBlockedError,
    UserDeletedError,
    UserInactiveError,
    UserInsufficientPermissionsError,
    UserInvalidCredentialsError,
    UserMaxSessionsExceededError,
    UserMetricsNotFoundError,
    UserMetricsUpdateError,
    UserNotFoundError,
    UserPasswordExpiredError,
    UserPasswordSameAsOldError,
    UserPasswordTooWeakError,
    UserSessionExpiredError,
    UserUnverifiedError,
    UserUsernameAlreadyExistsError,
} from "./errors/user.errors"
