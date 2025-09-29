import { AuthorizationContext, Device, Level, Permission } from "@/domain/authorization"
import { HttpRequest, HttpResponse } from "../http/http.type"

import { AuthenticatedUser } from "./types"
import { AuthorizationServiceImpl } from "@/application/authorization"

/**
 * Middleware de Autorização - RouteHandler
 * Verifica se o usuário autenticado tem permissão para acessar a rota
 */
export function requirePermission(permission: Permission) {
    return (request: HttpRequest, response: HttpResponse): Promise<void> => {
        return new Promise((resolve) => {
            const user = request.user as AuthenticatedUser

            if (!user) {
                response.status(401).send({
                    success: false,
                    message: "Usuário não autenticado",
                    code: "AUTHENTICATION_REQUIRED",
                })
                resolve()
                return
            }

            // Criar contexto de autorização
            const context: AuthorizationContext = {
                user: {
                    level: user.level as unknown as Level,
                    device: (request.headers.device as Device) || Device.WEB,
                },
                route: {
                    path: request.url,
                    method: request.method,
                },
            }

            const authService = new AuthorizationServiceImpl()
            const result = authService.checkPermission(context, permission)

            if (!result.allowed) {
                response.status(403).send({
                    success: false,
                    message: `Acesso negado: ${result.reason}`,
                    code: "INSUFFICIENT_PERMISSION",
                    context: {
                        requiredPermission: permission,
                        userLevel: user.level,
                        userDevice: context.user.device,
                        reason: result.reason,
                        requiredLevels: result.requiredLevels,
                        requiredDevices: result.requiredDevices,
                    },
                })
                resolve()
                return
            }

            resolve()
        })
    }
}

/**
 * Middleware de Autorização - RouteHandler
 * Verifica se o usuário tem um dos roles permitidos
 */
export function requireRole(allowedLevels: Level[]) {
    return (request: HttpRequest, response: HttpResponse): Promise<void> => {
        return new Promise((resolve) => {
            const user = request.user as AuthenticatedUser

            if (!user) {
                response.status(401).send({
                    success: false,
                    message: "Usuário não autenticado",
                    code: "AUTHENTICATION_REQUIRED",
                })
                resolve()
                return
            }

            if (!allowedLevels.includes(user.level as unknown as Level)) {
                response.status(403).send({
                    success: false,
                    message: "Acesso negado - nivel de acesso insuficiente",
                    code: "INSUFFICIENT_LEVEL",
                    context: {
                        allowedLevels,
                        userLevel: user.level,
                    },
                })
                resolve()
                return
            }

            resolve()
        })
    }
}
