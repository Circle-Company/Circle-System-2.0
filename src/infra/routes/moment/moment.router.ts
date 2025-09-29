/**
 * Moment Router - Gerenciador de rotas para operações relacionadas a momentos
 *
 * Features:
 * - CRUD completo de momentos
 * - Ações de usuário (like, comment, report)
 * - Listagem e busca avançada
 * - Middleware de autorização integrado
 * - Schemas de validação completos
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { createAuthMiddleware, requirePermission } from "@/infra/middlewares"
import { HttpAdapter, HttpRequest, HttpResponse } from "../../http/http.type"
import {
    MomentErrorSchemas,
    MomentParamSchemas,
    MomentRequestSchemas,
    MomentResponseSchemas,
} from "./moment.router.schemas"

import { Permission } from "@/domain/authorization"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { MomentFactory } from "@/infra/factories/moment.factory"

/**
 * Handler functions para encapsular lógica de rotas
 */
class MomentRouteHandlers {
    constructor(private momentController: any) {}

    /**
     * Wrapper para criação de momento
     */
    async createMoment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const result = await this.momentController.createMoment(
                request.body as any,
                request.user?.id || "",
            )

            response.status(201).send({
                success: true,
                moment: result,
                message: "Momento criado com sucesso",
                timestamp: new Date().toISOString(),
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao criar momento",
                timestamp: new Date().toISOString(),
            })
        }
    }

    /**
     * Wrapper para obter momento específico
     */
    async getMoment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const result = await this.momentController.getMoment(
                request.params.id,
                request.user?.id,
            )

            if (!result) {
                response.status(404).send({
                    success: false,
                    error: "Momento não encontrado",
                })
                return
            }

            response.status(200).send({
                success: true,
                moment: result,
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao obter momento",
            })
        }
    }

    /**
     * Wrapper para deletar momento
     */
    async deleteMoment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            await this.momentController.deleteMoment(request.params.id, request.user?.id || "")

            response.status(200).send({
                success: true,
                message: "Momento deletado com sucesso",
                deletedAt: new Date().toISOString(),
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao deletar momento",
            })
        }
    }

    /**
     * Wrapper para curtir momento
     */
    async likeMoment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            await this.momentController.likeMoment(request.params.id, request.user?.id || "")

            response.status(200).send({
                success: true,
                message: "Momento curtido com sucesso",
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao curtir momento",
            })
        }
    }

    /**
     * Wrapper para descurtir momento
     */
    async unlikeMoment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            await this.momentController.unlikeMoment(request.params.id, request.user?.id || "")

            response.status(200).send({
                success: true,
                message: "Curtida removida com sucesso",
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao remover curtida",
            })
        }
    }

    /**
     * Wrapper para comentar momento
     */
    async commentMoment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const result = await this.momentController.commentMoment(
                request.params.id,
                request.user?.id || "",
                request.body as any,
            )

            response.status(201).send({
                success: true,
                comment: result,
                message: "Comentário criado com sucesso",
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao comentar momento",
            })
        }
    }

    /**
     * Wrapper para reportar momento
     */
    async reportMoment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const result = await this.momentController.reportMoment(
                request.params.id,
                request.user?.id || "",
                request.body as any,
            )

            response.status(201).send({
                success: true,
                report: result,
                message: "Report enviado com sucesso",
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao reportar momento",
            })
        }
    }

    /**
     * Wrapper para publicar momento
     */
    async publishMoment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            const result = await this.momentController.publishMoment(
                request.params.id,
                request.user?.id || "",
            )

            response.status(200).send({
                success: true,
                message: "Momento publicado com sucesso",
                moment: result,
                publishedAt: new Date().toISOString(),
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao publicar momento",
            })
        }
    }
}

/**
 * Gerenciador principal das rotas de momentos
 */
export class MomentRouter {
    private handlers: MomentRouteHandlers
    private authMiddleware: any

    constructor(private api: HttpAdapter, private databaseAdapter: DatabaseAdapter) {
        const controller = MomentFactory.getMomentController()
        this.handlers = new MomentRouteHandlers(controller)
        this.authMiddleware = createAuthMiddleware(databaseAdapter)
    }

    /**
     * Registra todas as rotas de momento
     */
    register(): void {
        this.registerCRUDRoutes()
        this.registerActionRoutes()
    }

    /**
     * Registra rotas CRUD básicas
     */
    private registerCRUDRoutes(): void {
        // Criar momento
        this.api.post("/moments", this.handlers.createMoment.bind(this.handlers), {
            preHandler: [
                this.authMiddleware.execute.bind(this.authMiddleware),
                requirePermission(Permission.CREATE_MOMENT),
            ],
            schema: {
                tags: ["Moments"],
                summary: "Criar momento",
                description: "Cria um novo momento (vlog) com validação completa",
                body: MomentRequestSchemas.create,
                response: {
                    201: MomentResponseSchemas.momentCreated,
                    400: MomentErrorSchemas.default,
                    401: MomentErrorSchemas.default,
                    403: MomentErrorSchemas.default,
                },
            },
        })

        // Obter momento
        this.api.get("/moments/:id", this.handlers.getMoment.bind(this.handlers), {
            preHandler: [this.authMiddleware.execute.bind(this.authMiddleware)],
            schema: {
                tags: ["Moments"],
                summary: "Obter momento",
                description: "Busca um momento específico por ID com verificação de acesso",
                params: MomentParamSchemas.momentId,
                response: {
                    200: MomentResponseSchemas.moment,
                    404: MomentErrorSchemas.default,
                    401: MomentErrorSchemas.default,
                    403: MomentErrorSchemas.default,
                },
            },
        })

        // Deletar momento
        this.api.delete("/moments/:id", this.handlers.deleteMoment.bind(this.handlers), {
            preHandler: [
                this.authMiddleware.execute.bind(this.authMiddleware),
                requirePermission(Permission.DELETE_OWN_MOMENT),
            ],
            schema: {
                tags: ["Moments"],
                summary: "Deletar momento",
                description: "Remove um momento do sistema com verificação de propriedade",
                params: MomentParamSchemas.momentId,
                response: {
                    200: MomentResponseSchemas.momentDeleted,
                    404: MomentErrorSchemas.default,
                    401: MomentErrorSchemas.default,
                    403: MomentErrorSchemas.default,
                },
            },
        })
    }

    /**
     * Registra rotas de ações (like, comment, etc)
     */
    private registerActionRoutes(): void {
        // Curtir momento
        this.api.post("/moments/:id/like", this.handlers.likeMoment.bind(this.handlers), {
            preHandler: [
                this.authMiddleware.execute.bind(this.authMiddleware),
                requirePermission(Permission.LIKE_MOMENT),
            ],
            schema: {
                tags: ["Moments"],
                summary: "Curtir momento",
                description: "Adiciona uma curtida ao momento",
                params: MomentParamSchemas.momentId,
                response: {
                    200: MomentResponseSchemas.success,
                    404: MomentErrorSchemas.default,
                    401: MomentErrorSchemas.default,
                    403: MomentErrorSchemas.default,
                },
            },
        })

        // Descurtir momento
        this.api.delete("/moments/:id/like", this.handlers.unlikeMoment.bind(this.handlers), {
            preHandler: [this.authMiddleware.execute.bind(this.authMiddleware)],
            schema: {
                tags: ["Moments"],
                summary: "Descurtir momento",
                description: "Remove a curtida do momento",
                params: MomentParamSchemas.momentId,
                response: {
                    200: MomentResponseSchemas.success,
                    404: MomentErrorSchemas.default,
                    401: MomentErrorSchemas.default,
                },
            },
        })

        // Comentar momento
        this.api.post("/moments/:id/comment", this.handlers.commentMoment.bind(this.handlers), {
            preHandler: [
                this.authMiddleware.execute.bind(this.authMiddleware),
                requirePermission(Permission.COMMENT_MOMENT),
            ],
            schema: {
                tags: ["Moments"],
                summary: "Comentar momento",
                description: "Adiciona um comentário ao momento",
                params: MomentParamSchemas.momentId,
                body: MomentRequestSchemas.comment,
                response: {
                    201: MomentResponseSchemas.commentCreated,
                    400: MomentErrorSchemas.default,
                    401: MomentErrorSchemas.default,
                    403: MomentErrorSchemas.default,
                    404: MomentErrorSchemas.default,
                },
            },
        })

        // Reportar momento
        this.api.post("/moments/:id/report", this.handlers.reportMoment.bind(this.handlers), {
            preHandler: [
                this.authMiddleware.execute.bind(this.authMiddleware),
                requirePermission(Permission.REPORT_MOMENT),
            ],
            schema: {
                tags: ["Moments"],
                summary: "Reportar momento",
                description: "Reporta um momento por conteúdo inadequado",
                params: MomentParamSchemas.momentId,
                body: MomentRequestSchemas.report,
                response: {
                    201: MomentResponseSchemas.reportCreated,
                    400: MomentErrorSchemas.default,
                    401: MomentErrorSchemas.default,
                },
            },
        })

        // Publicar momento
        this.api.post("/moments/:id/publish", this.handlers.publishMoment.bind(this.handlers), {
            preHandler: [this.authMiddleware.execute.bind(this.authMiddleware)],
            schema: {
                tags: ["Moments"],
                summary: "Publicar momento",
                description: "Publica um momento que estava em rascunho",
                params: MomentParamSchemas.momentId,
                response: {
                    200: MomentResponseSchemas.momentPublished,
                    404: MomentErrorSchemas.default,
                    401: MomentErrorSchemas.default,
                    403: MomentErrorSchemas.default,
                },
            },
        })
    }
}

/**
 * Função de compatibilidade para inicialização das rotas
 */
export async function Router(api: HttpAdapter): Promise<void> {
    const { DatabaseAdapterFactory } = await import("@/infra/database/adapter")
    const databaseAdapter = DatabaseAdapterFactory.createForEnvironment(
        process.env.NODE_ENV || "development",
    )
    const routes = new MomentRouter(api, databaseAdapter)
    routes.register()
}
