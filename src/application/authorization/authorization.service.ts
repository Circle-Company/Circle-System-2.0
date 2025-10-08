import {
    AuthorizationContext,
    AuthorizationResult,
    Device,
    Level,
    Permission,
    RouteConfig,
    getAuthorizationRule,
} from "@/domain/authorization"

/**
 * Mapa de rotas para configurações de autorização
 * Define qual permissão é necessária para cada endpoint
 */
const ROUTE_CONFIGS: RouteConfig[] = [
    // Rotas de Moments
    {
        path: "/moments",
        method: "POST",
        requiredPermission: Permission.CREATE_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.MOBILE],
    },
    {
        path: "/moments/:id",
        method: "GET",
        requiredPermission: Permission.VIEW_OWN_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
    },
    {
        path: "/moments/:id",
        method: "DELETE",
        requiredPermission: Permission.DELETE_OWN_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
    },
    {
        path: "/moments/:id/like",
        method: "POST",
        requiredPermission: Permission.LIKE_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
    },
    {
        path: "/moments/:id/comment",
        method: "POST",
        requiredPermission: Permission.COMMENT_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
    },
    {
        path: "/moments/:id/report",
        method: "POST",
        requiredPermission: Permission.REPORT_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
    },
]

/**
 * Busca configuração de rota por caminho e método
 */
function getRouteConfig(path: string, method: string): RouteConfig | null {
    // Normalizar método
    const normalizedMethod = method.toUpperCase()

    // Busca exata primeiro
    let config = ROUTE_CONFIGS.find(
        (r) => r.path === path && r.method.toUpperCase() === normalizedMethod,
    )

    if (config) return config

    // Busca com pattern matching para rotas com parâmetros (ex: /moments/:id)
    config = ROUTE_CONFIGS.find((r) => {
        const pattern = r.path.replace(/:[^/]+/g, "[^/]+")
        const regex = new RegExp(`^${pattern}$`)
        return regex.test(path) && r.method.toUpperCase() === normalizedMethod
    })

    return config || null
}

/**
 * Interface para serviço de autorização
 * Seguindo Clean Architecture - Application Layer
 */
export interface AuthorizationService {
    /**
     * Verifica se um usuário tem permissão para uma ação
     */
    checkPermission(context: AuthorizationContext, permission: Permission): AuthorizationResult

    /**
     * Verifica se um usuário pode acessar uma rota específica
     */
    checkRouteAccess(context: AuthorizationContext): AuthorizationResult

    /**
     * Verifica se um role tem uma permissão específica
     */
    checkRolePermission(level: Level, permission: Permission): boolean

    /**
     * Verifica se um dispositivo é permitido para uma permissão
     */
    checkDevicePermission(device: Device, level: Level, permission: Permission): boolean
}

/**
 * Implementação do serviço de autorização
 * Application Layer - contém toda a lógica de negócio para autorização
 */
export class AuthorizationServiceImpl implements AuthorizationService {
    checkPermission(context: AuthorizationContext, permission: Permission): AuthorizationResult {
        const rule = getAuthorizationRule(permission)

        if (!rule) {
            return {
                allowed: false,
                reason: "Permission not found",
                requiredPermission: permission,
            }
        }

        // Check role
        if (!rule.allowedLevels.includes(context.user.level)) {
            return {
                allowed: false,
                reason: "Insufficient access level",
                requiredPermission: permission,
                requiredLevels: rule.allowedLevels,
            }
        }

        // Check device
        if (!rule.allowedDevices.includes(context.user.device)) {
            return {
                allowed: false,
                reason: "Device not allowed",
                requiredPermission: permission,
                requiredLevels: rule.allowedLevels,
                requiredDevices: rule.allowedDevices,
            }
        }

        return {
            allowed: true,
        }
    }

    checkRouteAccess(context: AuthorizationContext): AuthorizationResult {
        const routeConfig = getRouteConfig(context.route.path, context.route.method)

        if (!routeConfig) {
            return {
                allowed: false,
                reason: "Route not found",
            }
        }

        return this.checkPermission(context, routeConfig.requiredPermission)
    }

    checkRolePermission(level: Level, permission: Permission): boolean {
        const rule = getAuthorizationRule(permission)
        return rule ? rule.allowedLevels.includes(level) : false
    }

    checkDevicePermission(device: Device, level: Level, permission: Permission): boolean {
        const rule = getAuthorizationRule(permission)
        if (!rule || !rule.allowedLevels.includes(level)) {
            return false
        }
        return rule.allowedDevices.includes(device)
    }
}
