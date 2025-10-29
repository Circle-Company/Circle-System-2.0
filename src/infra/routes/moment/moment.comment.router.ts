/**
 * Moment Comment Router - Gerenciador de rotas para operações relacionadas a comentários de momentos
 *
 * Features:
 * - CRUD de comentários
 * - Respostas aninhadas (nested comments)
 * - Moderação de conteúdo
 * - Middleware de autorização integrado
 * - Schemas de validação completos
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { createAuthMiddleware } from "@/infra/middlewares"
import { ErrorCode, SystemError } from "@/shared/errors"
import { HttpAdapter, HttpRequest, HttpResponse } from "../../http/http.type"

import { MomentCommentController } from "@/infra/controllers/moment/moment.comment.controller"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { MomentFactory } from "@/infra/factories/moment.factory"
import { AuthMiddleware } from "@/infra/middlewares"

/**
 * Handler functions para encapsular lógica de rotas de comentários
 */
class MomentCommentRouteHandlers {
    constructor(private commentController: MomentCommentController) {}

    /**
     * Wrapper para criação de comentário
     */
    async createComment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            // Verificar se usuário está autenticado (deveria ter sido verificado pelo middleware)
            if (!request.user) {
                return response.status(401).send({
                    success: false,
                    error: "Usuário não autenticado",
                    code: "AUTHENTICATION_REQUIRED",
                })
            }

            const momentId = request.params?.momentId
            const body = request.body || {}

            if (!momentId) {
                return response.status(400).send({
                    success: false,
                    error: "ID do momento é obrigatório",
                })
            }

            if (!body.content || body.content.trim().length === 0) {
                return response.status(400).send({
                    success: false,
                    error: "Conteúdo do comentário é obrigatório",
                })
            }

            const result = await this.commentController.createComment(momentId, request.user, body)

            response.status(201).send({
                success: true,
                message: "Comentário criado com sucesso",
                comment: result,
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao criar comentário",
            })
        }
    }

    /**
     * Wrapper para listar comentários
     */
    async getComments(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const momentId = request.params?.momentId
            const queryParams = request.query || {}

            if (!momentId) {
                return response.status(400).send({
                    success: false,
                    error: "ID do momento é obrigatório",
                })
            }

            const page = parseInt(queryParams.page as string) || 1
            const limit = Math.min(parseInt(queryParams.limit as string) || 20, 100)
            const includeReplies = queryParams.includeReplies === "true"
            const sortBy = (queryParams.sortBy as string) || "createdAt"
            const sortOrder = (queryParams.sortOrder as string) || "desc"

            const result = await this.commentController.getMomentComments(momentId, request.user, {
                page,
                limit,
                includeReplies,
                sortBy: sortBy as any,
                sortOrder: sortOrder as any,
            })

            response.status(200).send(result)
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao buscar comentários",
            })
        }
    }

    /**
     * Wrapper para deletar comentário
     */
    async deleteComment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            if (!request.user) {
                return response.status(401).send({
                    success: false,
                    error: "Usuário não autenticado",
                    code: "AUTHENTICATION_REQUIRED",
                })
            }

            const momentId = request.params?.momentId
            const commentId = request.params?.commentId

            if (!momentId || !commentId) {
                return response.status(400).send({
                    success: false,
                    error: "ID do momento e comentário são obrigatórios",
                })
            }

            await this.commentController.deleteComment(momentId, commentId, request.user)

            response.status(200).send({
                success: true,
                message: "Comentário deletado com sucesso",
                deletedAt: new Date().toISOString(),
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao deletar comentário",
            })
        }
    }
}

/**
 * Gerenciador principal das rotas de comentários de momentos
 */
export class MomentCommentRouter {
    private handlers: MomentCommentRouteHandlers
    private authMiddleware: AuthMiddleware

    constructor(private api: HttpAdapter, private databaseAdapter: DatabaseAdapter) {
        const controller = MomentFactory.getMomentCommentController()
        this.handlers = new MomentCommentRouteHandlers(controller)
        this.authMiddleware = createAuthMiddleware(databaseAdapter)
    }

    /**
     * Registra todas as rotas de comentários
     */
    register(): void {
        this.registerCommentRoutes()
        this.registerManagementRoutes()
    }

    /**
     * Registra rotas de comentários principais
     */
    private registerCommentRoutes(): void {
        // Criar comentário
        console.log("💬 Registrando POST /moments/:momentId/comments...")
        this.api.post(
            "/moments/:momentId/comments",
            this.handlers.createComment.bind(this.handlers),
            {
                preHandler: [this.authMiddleware.execute.bind(this.authMiddleware)],
            },
        )

        // Listar comentários
        console.log("💬 Registrando GET /moments/:momentId/comments...")
        this.api.get("/moments/:momentId/comments", this.handlers.getComments.bind(this.handlers))
    }

    /**
     * Registra rotas de gerenciamento
     */
    private registerManagementRoutes(): void {
        // Deletar comentário
        console.log("💬 Registrando DELETE /moments/:momentId/comments/:commentId...")
        this.api.delete(
            "/moments/:momentId/comments/:commentId",
            this.handlers.deleteComment.bind(this.handlers),
            {
                preHandler: [this.authMiddleware.execute.bind(this.authMiddleware)],
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
        new MomentCommentRouter(httpAdapter, databaseAdapter).register()
    } catch (error) {
        throw new SystemError({
            message: "Failed to initialize MomentCommentRouter",
            code: ErrorCode.INTERNAL_ERROR,
            action: "Check the database configuration and try again",
            context: {
                additionalData: { originalError: error },
            },
        })
    }
}
