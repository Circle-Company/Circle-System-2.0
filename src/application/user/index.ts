// ===== USER APPLICATION EXPORTS =====

// Services
export * from "./services/user.metrics.service"
export * from "./services/user.service"

// Use Cases
export * from "./use.cases"

// Use Cases Administrativos
export * from "./use.cases/admin"

// Tipos e Interfaces
export type {
    GrowthMetrics,
    MetricsUpdateInput,
    UserMetricsEvent,
    UserMetricsServiceConfig,
} from "./services/user.metrics.service"

export type { CreateUserInput, CreateUserOutput } from "./use.cases/create.user.use.case"

export type { GetUserInput, GetUserOutput } from "./use.cases/get.user.profile.use.case"

export type { UpdateUserInput, UpdateUserOutput } from "./use.cases/update.user.use.case"

export type { DeleteUserInput, DeleteUserOutput } from "./use.cases/delete.user.use.case"

export type { FollowUserInput, FollowUserOutput } from "./use.cases/follow.user.use.case"

export type { UnfollowUserInput, UnfollowUserOutput } from "./use.cases/unfollow.user.use.case"

export type { BlockUserInput, BlockUserOutput } from "./use.cases/block.user.use.case"

export type { UnblockUserInput, UnblockUserOutput } from "./use.cases/unblock.user.use.case"

export type {
    GetUserFollowersInput,
    GetUserFollowersOutput,
} from "./use.cases/get.user.followers.use.case"

export type {
    GetUserFollowingInput,
    GetUserFollowingOutput,
} from "./use.cases/get.user.following.use.case"

export type { SearchUsersInput, SearchUsersOutput } from "./use.cases/search.users.use.case"

export type {
    GetUserMetricsInput,
    GetUserMetricsOutput,
} from "./use.cases/get.user.metrics.use.case"

export type {
    AdminBlockUserInput,
    AdminBlockUserOutput,
} from "./use.cases/admin/block.user.use.case"

export type {
    AdminUnblockUserInput,
    AdminUnblockUserOutput,
} from "./use.cases/admin/unblock.user.use.case"

export type {
    AdminDeleteUserInput,
    AdminDeleteUserOutput,
} from "./use.cases/admin/delete.user.use.case"

export type {
    AdminListUsersInput,
    AdminListUsersOutput,
} from "./use.cases/admin/list.users.use.case"
