/**
 * User Router - Roteador de usuários
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { AuthMiddleware, createAuthMiddleware, requirePermission } from "@/infra/middlewares"
import { ErrorCode, SystemError } from "@/shared/errors"
import { HttpAdapter, HttpRequest, HttpResponse } from "../../http/http.type"

import { Permission } from "@/domain/authorization"
import { UserController } from "@/infra/controllers/user.controller"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { UserFactory } from "@/infra/factories/user.factory"

export class UserRouter {
    private authMiddleware: AuthMiddleware
    private userController: UserController

    constructor(private api: HttpAdapter, private databaseAdapter: DatabaseAdapter) {
        this.authMiddleware = createAuthMiddleware(databaseAdapter)
        this.userController = UserFactory.createUserControllerWithDeps(databaseAdapter)
    }

    /**
     * Registra todas as rotas de usuário
     */
    register(): void {
        this.registerAccountRoutes()
        this.registerProfileRoutes()
    }

    /**
     * Rotas do usuário autenticado (/account)
     */
    private registerAccountRoutes(): void {
        // GET /account - Obter dados do usuário autenticado
        this.api.get(
            "/account",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    // Verificar autenticação
                    if (!request.user) {
                        return response.status(401).send({
                            success: false,
                            error: "User not authenticated",
                            code: "AUTHENTICATION_REQUIRED",
                        })
                    }

                    const userData = await this.userController.getAccount(request.user.id)

                    if (!userData) {
                        return response.status(404).send({
                            success: false,
                            error: "User not found",
                            code: "USER_NOT_FOUND",
                        })
                    }

                    response.status(200).send({
                        success: true,
                        account: userData,
                    })
                } catch (error) {
                    response.status(500).send({
                        success: false,
                        error: error instanceof Error ? error.message : "Internal server error",
                        code: "INTERNAL_ERROR",
                        timestamp: new Date().toISOString(),
                    })
                }
            },
            {
                preHandler: [
                    this.authMiddleware.execute.bind(this.authMiddleware),
                    requirePermission(Permission.READ_OWN_ACCOUNT),
                ],
            },
        )
    }

    private registerProfileRoutes(): void {
        // GET /users/:id - Obter perfil público do usuário
        this.api.get(
            "/users/:id",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    // Verificar se usuário está autenticado (middleware deveria garantir isso)
                    if (!request.user) {
                        return response.status(401).send({
                            success: false,
                            error: "User not authenticated",
                            code: "AUTHENTICATION_REQUIRED",
                        })
                    }

                    const responseData = await this.userController.getPublicProfile(
                        request.params.id,
                        request.user.id,
                    )
                    return response.status(200).send({
                        success: true,
                        profile: responseData,
                    })
                } catch (error) {
                    console.error("Error getting user profile:", error)
                    return response.status(500).send({
                        success: false,
                        error: error instanceof Error ? error.message : "Internal server error",
                        code: "INTERNAL_ERROR",
                    })
                }
            },
            {
                preHandler: [
                    this.authMiddleware.execute.bind(this.authMiddleware),
                    requirePermission(Permission.READ_PROFILE),
                ],
            },
        )
    }
}

/**
 * Função de compatibilidade para inicialização das rotas
 */
export async function Router(
    httpAdapter: HttpAdapter,
    databaseAdapter: DatabaseAdapter,
): Promise<void> {
    try {
        new UserRouter(httpAdapter, databaseAdapter).register()
    } catch (error) {
        throw new SystemError({
            message: "Failed to initialize UserRouter",
            code: ErrorCode.INTERNAL_ERROR,
            action: "Check the database configuration and try again",
            context: {
                additionalData: { originalError: error },
            },
        })
    }
}
