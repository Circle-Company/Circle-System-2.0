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
import { ErrorCode, SystemError } from "@/shared/errors"
import { HttpAdapter, HttpRequest, HttpResponse } from "../../http/http.type"
import {
    MomentErrorSchemas,
    MomentParamSchemas,
    MomentRequestSchemas,
    MomentResponseSchemas,
} from "./moment.router.schemas"

import { Permission } from "@/domain/authorization"
import { MomentController } from "@/infra/controllers"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { MomentFactory } from "@/infra/factories/moment.factory"
import { AuthMiddleware } from "@/infra/middlewares"

/**
 * Handler functions para encapsular lógica de rotas
 */
class MomentRouteHandlers {
    constructor(private momentController: MomentController) {}

    /**
     * Wrapper para criação de momento
     */
    async createMoment(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            // Verificar se usuário está autenticado (deveria ter sido verificado pelo middleware)
            if (!request.user) {
                return response.status(401).send({
                    success: false,
                    error: "Usuário não autenticado",
                    code: "AUTHENTICATION_REQUIRED",
                    timestamp: new Date().toISOString(),
                })
            }

            // Verificar se já foi enviada uma resposta
            if (response.statusCode && response.statusCode !== 200) {
                return
            }

            // Extrair dados do body (JSON ou multipart)
            const body = request.body as any

            // Processar campos básicos
            const description = body.description
            const visibility = body.visibility || "public"
            const ageRestriction = body.ageRestriction === true || body.ageRestriction === "true"
            const contentWarning = body.contentWarning === true || body.contentWarning === "true"

            // Processar arrays (JSON ou string separada por vírgula)
            let hashtags: string[] = []
            if (body.hashtags) {
                if (Array.isArray(body.hashtags)) {
                    hashtags = body.hashtags
                } else if (typeof body.hashtags === "string") {
                    try {
                        hashtags = JSON.parse(body.hashtags)
                    } catch (e) {
                        hashtags = body.hashtags.split(",").map((tag: string) => tag.trim())
                    }
                }
            }

            let mentions: string[] = []
            if (body.mentions) {
                if (Array.isArray(body.mentions)) {
                    mentions = body.mentions
                } else if (typeof body.mentions === "string") {
                    try {
                        mentions = JSON.parse(body.mentions)
                    } catch (e) {
                        mentions = body.mentions.split(",").map((mention: string) => mention.trim())
                    }
                }
            }

            // Processar objetos JSON
            let location: { latitude: number; longitude: number } | undefined
            if (body.location) {
                try {
                    location =
                        typeof body.location === "string"
                            ? JSON.parse(body.location)
                            : body.location
                } catch (e) {
                    console.warn("Erro ao processar location:", e)
                }
            }

            let device: any | undefined
            if (body.device) {
                try {
                    device = typeof body.device === "string" ? JSON.parse(body.device) : body.device
                } catch (e) {
                    console.warn("Erro ao processar device:", e)
                }
            }

            // Processar metadados do vídeo
            let videoMetadata: any
            if (body.videoMetadata) {
                try {
                    videoMetadata =
                        typeof body.videoMetadata === "string"
                            ? JSON.parse(body.videoMetadata)
                            : body.videoMetadata
                } catch (e) {
                    console.warn("Erro ao processar videoMetadata:", e)
                    videoMetadata = {
                        filename: "video.mp4",
                        mimeType: "video/mp4",
                        size: 0,
                    }
                }
            } else {
                videoMetadata = {
                    filename: "video.mp4",
                    mimeType: "video/mp4",
                    size: 0,
                }
            }

            // Processar dados do vídeo (base64 ou buffer)
            let videoData: Buffer
            if (body.videoData) {
                if (typeof body.videoData === "string") {
                    // Se for string base64, converter para Buffer
                    if (body.videoData.startsWith("data:")) {
                        // Remover prefixo data:video/mp4;base64,
                        const base64Data = body.videoData.split(",")[1]
                        videoData = Buffer.from(base64Data, "base64")
                    } else {
                        // Assumir que é base64 puro
                        videoData = Buffer.from(body.videoData, "base64")
                    }
                } else if (Buffer.isBuffer(body.videoData)) {
                    videoData = body.videoData
                } else {
                    videoData = Buffer.from([])
                }
            } else {
                videoData = Buffer.from([])
            }

            // Validar dados obrigatórios
            if (!videoData || videoData.length === 0) {
                return response.status(400).send({
                    success: false,
                    error: "Dados do vídeo são obrigatórios",
                    timestamp: new Date().toISOString(),
                })
            }

            if (!videoMetadata.filename || !videoMetadata.mimeType) {
                return response.status(400).send({
                    success: false,
                    error: "Metadados do vídeo são obrigatórios",
                    timestamp: new Date().toISOString(),
                })
            }

            const result = await this.momentController.createMoment(
                {
                    videoData,
                    videoMetadata,
                    description,
                    hashtags,
                    mentions,
                    visibility,
                    ageRestriction,
                    contentWarning,
                    location,
                    device,
                },
                request.user?.id || "",
            )

            return response.status(201).send({
                success: true,
                moment: result,
                message: "Momento criado com sucesso",
                timestamp: new Date().toISOString(),
            })
        } catch (error: any) {
            // Verificar se já foi enviada uma resposta
            if (response.statusCode && response.statusCode !== 200) {
                return
            }

            console.error("Erro ao criar momento:", error)

            let errorMessage = "Erro ao criar momento"
            if (error instanceof Error) {
                errorMessage = error.message
            } else if (typeof error === "string") {
                errorMessage = error
            } else if (error && error.message) {
                errorMessage = error.message
            }

            return response.status(400).send({
                success: false,
                error: errorMessage,
                timestamp: new Date().toISOString(),
            })
        }
    }

    async getMomentsFromUser(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            // Verificar se usuário está autenticado (middleware deveria garantir isso)
            if (!request.user) {
                return response.status(401).send({
                    success: false,
                    error: "User not authenticated",
                    code: "AUTHENTICATION_REQUIRED",
                })
            }

            // Parse dos query params
            const limit = request.query.limit ? Number(request.query.limit) : 6
            const page = request.query.page ? Number(request.query.page) : 1
            const status = (request.query.status as string) || "published"

            const result = await this.momentController.getUserMoments(
                request.params.id,
                request.user.id,
                {
                    limit,
                    page,
                    sortBy: "createdAt",
                    status: status as any,
                },
            )

            return response.status(200).send({
                success: true,
                moments: result,
                pagination: {
                    page,
                    limit,
                    total: result.length,
                },
            })
        } catch (error: any) {
            response.status(400).send({
                success: false,
                error: error.message || "Erro ao obter momentos do usuário",
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
    private authMiddleware: AuthMiddleware

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
        console.log("📝 Registrando POST /moments...")
        this.api.post("/moments", this.handlers.createMoment.bind(this.handlers), {
            preHandler: [
                this.authMiddleware.execute.bind(this.authMiddleware),
                requirePermission(Permission.CREATE_MOMENT),
            ],
            schema: {
                tags: ["Moments"],
                summary: "Criar momento",
                description: "Cria um novo momento (vlog) com validação completa",
                response: {
                    201: MomentResponseSchemas.momentCreated,
                    400: MomentErrorSchemas.default,
                    401: MomentErrorSchemas.default,
                    403: MomentErrorSchemas.default,
                },
            },
        })

        // Obter momentos do usuário

        this.api.get("/users/:id/moments", this.handlers.getMomentsFromUser.bind(this.handlers), {
            preHandler: [
                this.authMiddleware.execute.bind(this.authMiddleware),
                requirePermission(Permission.READ_PROFILE_MOMENTS),
            ],
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
export async function Router(
    httpAdapter: HttpAdapter,
    databaseAdapter: DatabaseAdapter,
): Promise<void> {
    try {
        new MomentRouter(httpAdapter, databaseAdapter).register()
    } catch (error) {
        throw new SystemError({
            message: "Failed to initialize MomentRouter",
            code: ErrorCode.INTERNAL_ERROR,
            action: "Check the database configuration and try again",
            context: {
                additionalData: { originalError: error },
            },
        })
    }
}
