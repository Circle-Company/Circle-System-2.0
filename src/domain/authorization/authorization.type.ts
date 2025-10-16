/**
 * Tipos de permissão para autorização
 */
export enum Permission {
    // Admin
    VIEW_MOMENT_METRICS = "view:complete_moment_metrics",
    VIEW_MOMENT_STATS = "view:complete_moment_stats",
    VIEW_MOMENT_CONTEXT = "view:moment_context",
    UPDATE_MOMENT_STATUS = "update:moment_status",
    UPDATE_MOMENT_PROCESSING = "update:moment_processing",

    READ_MOMENT = "read:moment",
    VIEW_OWN_MOMENT = "view:own_moment",
    CREATE_MOMENT = "create:own_moment",
    UPDATE_OWN_MOMENT = "update:own_moment",
    DELETE_OWN_MOMENT = "delete:own_moment",
    COMMENT_MOMENT = "comment:own_moment",
    REPORT_MOMENT = "report:own_moment",
    LIKE_MOMENT = "like:own_moment",

    READ_OWN_ACCOUNT = "read:own_account",
    UPDATE_OWN_ACCOUNT = "update:own_account",
    DELETE_OWN_ACCOUNT = "delete:own_account",
    READ_OWN_SETTINGS = "read:own_settings",
    UPDATE_OWN_PREFERENCES = "update:own_preferences",

    READ_PROFILE = "read:profile",
    READ_PROFILE_MOMENTS = "read:profile_moments",
}

/**
 * Tipos de dispositivo
 */
export enum Device {
    MOBILE = "MOBILE",
    WEB = "WEB",
}

/**
 * Levels do sistema - usando os mesmos valores do Level
 */
export enum Level {
    SUDO = "SUDO",
    ADMIN = "ADMIN",
    USER = "USER",
}

/**
 * Interface para regras de autorização
 */
export interface AuthorizationRule {
    permission: Permission
    allowedLevels: Level[]
    allowedDevices: Device[]
    description?: string
}

/**
 * Interface para configuração de rotas
 */
export interface RouteConfig {
    path: string
    method: string
    requiredPermission: Permission
    allowedLevels: Level[]
    allowedDevices: Device[]
    description?: string
}

/**
 * Interface para verificação de autorização
 */
export interface AuthorizationContext {
    user: {
        level: Level
        device: Device
    }
    route: {
        path: string
        method: string
    }
}

/**
 * Interface para resultado da verificação
 */
export interface AuthorizationResult {
    allowed: boolean
    reason?: string
    requiredPermission?: Permission
    requiredLevels?: Level[]
    requiredDevices?: Device[]
}
