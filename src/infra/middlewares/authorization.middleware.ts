import { AuthorizationContext, Device, Level, Permission } from "@/domain/authorization"
import { HttpRequest, HttpResponse } from "../http/http.type"

import { AuthorizationServiceImpl } from "@/application/authorization"
import { AuthenticatedUser } from "./types"

/**
 * Middleware de Autorização - RouteHandler
 * Verifica se o usuário autenticado tem permissão para acessar a rota
 */
export function requirePermission(permission: Permission) {
    return async (request: HttpRequest, response: HttpResponse): Promise<void> => {
        try {
            const user = request.user as AuthenticatedUser

            if (!user) {
                console.error("❌ Authorization failed: User not authenticated")
                response.status(401).send({
                    success: false,
                    message: "User not authenticated",
                    code: "AUTHENTICATION_REQUIRED",
                })
                return
            }

            // Normalizar level para lowercase (compatibilidade com enum Level)
            const normalizedLevel = (user.level as string).toLowerCase() as Level

            // Criar contexto de autorização
            const context: AuthorizationContext = {
                user: {
                    level: normalizedLevel,
                    device: user.device as unknown as Device,
                },
                route: {
                    path: request.url,
                    method: request.method,
                },
            }

            const authService = new AuthorizationServiceImpl()
            const result = authService.checkPermission(context, permission)

            if (!result.allowed) {
                console.error(`❌ Authorization failed: ${result.reason}`, {
                    permission,
                    userLevel: normalizedLevel,
                    userDevice: user.device,
                    requiredLevels: result.requiredLevels,
                    requiredDevices: result.requiredDevices,
                })
                response.status(403).send({
                    success: false,
                    message: `Access denied: ${result.reason}`,
                    code: "INSUFFICIENT_PERMISSION",
                    context: {
                        requiredPermission: permission,
                        userLevel: normalizedLevel,
                        requiredLevels: result.requiredLevels,
                        requiredDevices: result.requiredDevices,
                    },
                })
                return
            }
        } catch (error: any) {
            console.error("Authorization middleware error:", error.message)
            response.status(500).send({
                success: false,
                message: "Internal authorization error",
                code: "AUTHORIZATION_ERROR",
            })
            return
        }
    }
}

/**
 * Middleware de Autorização - RouteHandler
 * Verifica se o usuário tem um dos roles permitidos
 */
export function requireRole(allowedLevels: Level[]) {
    return async (request: HttpRequest, response: HttpResponse): Promise<void> => {
        try {
            const user = request.user as AuthenticatedUser

            if (!user) {
                console.error("❌ Authorization failed: User not authenticated")
                response.status(401).send({
                    success: false,
                    message: "User not authenticated",
                    code: "AUTHENTICATION_REQUIRED",
                })
                return
            }

            // Normalizar level para lowercase (compatibilidade com enum Level)
            const normalizedLevel = (user.level as string).toLowerCase() as Level

            if (!allowedLevels.includes(normalizedLevel)) {
                console.error(`❌ Authorization failed: Insufficient level`, {
                    allowedLevels,
                    userLevel: normalizedLevel,
                })
                response.status(403).send({
                    success: false,
                    message: "Access denied - insufficient access level",
                    code: "INSUFFICIENT_LEVEL",
                    context: {
                        allowedLevels,
                        userLevel: normalizedLevel,
                    },
                })
                return
            }
        } catch (error: any) {
            console.error("Role authorization middleware error:", error.message)
            response.status(500).send({
                success: false,
                message: "Internal authorization error",
                code: "AUTHORIZATION_ERROR",
            })
            return
        }
    }
}
