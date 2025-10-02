import {
    AuthorizationContext,
    AuthorizationResult,
    Device,
    Level,
    Permission,
    getAuthorizationRule,

} from "@/domain/authorization"
import { RouteConfig } from "@/domain/authorization/authorization.type"
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
                reason: "Permissão não encontrada",
                requiredPermission: permission,
            }
        }

        // Verificar role
        if (!rule.allowedLevels.includes(context.user.level)) {
            return {
                allowed: false,
                reason: "Level insuficiente",
                requiredPermission: permission,
                requiredLevels: rule.allowedLevels,
            }
        }

        // Verificar dispositivo
        if (!rule.allowedDevices.includes(context.user.device)) {
            return {
                allowed: false,
                reason: "Dispositivo não permitido",
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
                reason: "Rota não encontrada",
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
