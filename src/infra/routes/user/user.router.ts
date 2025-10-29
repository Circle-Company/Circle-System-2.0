/**
 * User Router - Roteador de usuários
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { HttpAdapter, HttpRequest, HttpResponse } from "@/infra/http/http.type"
import { AuthMiddleware, createAuthMiddleware, requirePermission } from "@/infra/middlewares"
import { ErrorCode, SystemError } from "@/shared/errors"

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
        this.registerFollowRoutes()
        this.registerBlockRoutes()
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
        ),

        // GET /account/blocks
        this.api.get(
            "/account/blocks",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    if (!request.user) {
                        return response.status(401).send({
                            success: false,
                            error: "User not authenticated",
                            code: "AUTHENTICATION_REQUIRED",
                        })
                    }

                    const blocks = await this.userController.getBlocks(request.user.id)
                    if (!blocks) {
                        return response.status(404).send({
                            success: false,
                            error: "Blocks not found",
                            code: "BLOCKS_NOT_FOUND",
                        })
                    }
                    return response.status(200).send({
                        success: true,
                        blocks: blocks.blocks,
                    })
                } catch (error) {
                    console.error("Error getting blocks:", error)
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
                    
                    // Se usuário não encontrado, retorna 404
                    if (error instanceof Error && error.message.includes("not found")) {
                        return response.status(404).send({
                            success: false,
                            error: error.message,
                        })
                    }
                    
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

    private registerFollowRoutes(): void {
        // POST /users/:id/follow - Seguir um usuário
        this.api.post(
            "/users/:id/follow",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    if (!request.user) {
                        return response.status(401).send({
                            success: false,
                            error: "User not authenticated",
                            code: "AUTHENTICATION_REQUIRED",
                        })
                    }

                    const targetUserId = request.params.id
                    const result = await this.userController.followUser(request.user.id, targetUserId)

                    return response.status(result.success ? 200 : 400).send(result)
                } catch (error) {
                    console.error("Error following user:", error)
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

        // DELETE /users/:id/follow - Deixar de seguir um usuário
        this.api.delete(
            "/users/:id/follow",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    if (!request.user) {
                        return response.status(401).send({
                            success: false,
                            error: "User not authenticated",
                            code: "AUTHENTICATION_REQUIRED",
                        })
                    }

                    const targetUserId = request.params.id
                    const result = await this.userController.unfollowUser(request.user.id, targetUserId)

                    return response.status(result.success ? 200 : 400).send(result)
                } catch (error) {
                    console.error("Error unfollowing user:", error)
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

    private registerBlockRoutes(): void {
        // POST /users/:id/block - Bloquear um usuário
        this.api.post(
            "/users/:id/block",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    if (!request.user) {
                        return response.status(401).send({
                            success: false,
                            error: "User not authenticated",
                            code: "AUTHENTICATION_REQUIRED",
                        })
                    }

                    const targetUserId = request.params.id
                    const result = await this.userController.blockUser(request.user.id, targetUserId)

                    return response.status(result.success ? 200 : 400).send(result)
                } catch (error) {
                    console.error("Error blocking user:", error)
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

        // DELETE /users/:id/block - Desbloquear um usuário
        this.api.delete(
            "/users/:id/block",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    if (!request.user) {
                        return response.status(401).send({
                            success: false,
                            error: "User not authenticated",
                            code: "AUTHENTICATION_REQUIRED",
                        })
                    }

                    const targetUserId = request.params.id
                    const result = await this.userController.unlockUser(request.user.id, targetUserId)

                    return response.status(result.success ? 200 : 400).send(result)
                } catch (error) {
                    console.error("Error unblocking user:", error)
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
