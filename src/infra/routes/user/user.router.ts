/**
 * User Router - Roteador de usuários
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { Permission } from "@/domain/authorization"
import { UserController } from "@/infra/controllers/user.controller"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { UserFactory } from "@/infra/factories/user.factory"
import { createAuthMiddleware, requirePermission } from "@/infra/middlewares"
import { ErrorCode, SystemError } from "@/shared/errors"
import { HttpAdapter, HttpRequest, HttpResponse } from "../../http/http.type"

export class UserRouter {
    private authMiddleware: any
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
                    console.log("=== GET ACCOUNT HANDLER ===")
                    console.log("User authenticated:", !!request.user)
                    console.log("User data:", request.user)

                    // Verificar autenticação
                    if (!request.user) {
                        console.error("❌ User not authenticated in handler")
                        return response.status(401).send({
                            success: false,
                            error: "Usuário não autenticado",
                            code: "AUTHENTICATION_REQUIRED",
                            timestamp: new Date().toISOString(),
                        })
                    }

                    // Buscar dados completos do usuário
                    const userId = request.user.id
                    const userData = await this.userController.getUserById(userId)

                    if (!userData) {
                        return response.status(404).send({
                            success: false,
                            error: "Usuário não encontrado",
                            code: "USER_NOT_FOUND",
                            timestamp: new Date().toISOString(),
                        })
                    }

                    response.status(200).send({
                        success: true,
                        user: userData,
                        timestamp: new Date().toISOString(),
                    })
                } catch (error) {
                    console.error("Error in getAccount:", error)
                    response.status(500).send({
                        success: false,
                        error: error instanceof Error ? error.message : "Erro interno do servidor",
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
                schema: {
                    tags: ["Account"],
                    summary: "Get user account data",
                    description: "Returns the authenticated user's account data",
                    response: {
                        200: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                user: { type: "object" },
                                timestamp: { type: "string" },
                            },
                        },
                        401: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                error: { type: "string" },
                                code: { type: "string" },
                            },
                        },
                    },
                },
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
