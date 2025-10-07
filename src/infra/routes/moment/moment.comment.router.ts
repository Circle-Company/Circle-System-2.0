import { HttpAdapter, HttpRequest, HttpResponse } from "../../http/http.type"

import { MomentFactory } from "@/infra/factories/moment.factory"

export class MomentCommentRouter {
    constructor(private api: HttpAdapter) {}

    /**
     * Registra todas as rotas de comentários de momentos
     */
    register(): void {
        this.registerCommentRoutes()
        this.registerCommentManagementRoutes()
    }

    /**
     * Rotas de comentários
     */
    private registerCommentRoutes(): void {
        // Criar comentário
        this.api.post(
            "/moments/:momentId/comments",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    const momentId = request.params?.momentId
                    const authorId = request.user?.id || ""
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

                    // TODO: Criar instância do controller quando disponível
                    // const commentController = MomentFactory.getCommentController()
                    // const result = await commentController.createComment(momentId, userId, body)

                    const commentController = MomentFactory.getMomentCommentController()

                    const result = await commentController.createComment(momentId, authorId, body)
                    if (!result) {
                        return response.status(500).send({
                            success: false,
                            error: "Erro ao criar comentário",
                        })
                    }

                    response.status(201).send({
                        success: true,
                        message: "Comentário criado com sucesso",
                        comment: {
                            id: result.id,
                            momentId,
                            authorId: authorId,
                            content: body.content,
                            parentCommentId: body.parentCommentId,
                            createdAt: new Date(),
                        },
                    })
                } catch (error) {
                    response.status(500).send({
                        success: false,
                        error: error instanceof Error ? error.message : "Erro interno do servidor",
                    })
                }
            },
            {
                schema: {
                    tags: ["Comments"],
                    summary: "Criar comentário",
                    description: "Cria um novo comentário em um momento",
                    params: {
                        type: "object",
                        properties: {
                            momentId: {
                                type: "string",
                                description: "ID do momento",
                            },
                        },
                        required: ["momentId"],
                    },
                    body: {
                        type: "object",
                        properties: {
                            content: {
                                type: "string",
                                description: "Conteúdo do comentário",
                                minLength: 1,
                                maxLength: 500,
                            },
                            parentCommentId: {
                                type: "string",
                                description: "ID do comentário pai (para respostas)",
                            },
                        },
                        required: ["content"],
                    },
                },
            },
        )

        // Listar comentários de um momento
        this.api.get(
            "/moments/:momentId/comments",
            async (request: HttpRequest, response: HttpResponse) => {
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

                    // TODO: Implementar busca real de comentários
                    response.status(200).send({
                        success: true,
                        comments: [],
                        pagination: {
                            page,
                            limit,
                            total: 0,
                            totalPages: 0,
                        },
                    })
                } catch (error) {
                    response.status(500).send({
                        success: false,
                        error: error instanceof Error ? error.message : "Erro interno do servidor",
                    })
                }
            },
            {
                schema: {
                    tags: ["Comments"],
                    summary: "Listar comentários",
                    description: "Lista comentários de um momento",
                    params: {
                        type: "object",
                        properties: {
                            momentId: {
                                type: "string",
                                description: "ID do momento",
                            },
                        },
                        required: ["momentId"],
                    },
                    querystring: {
                        type: "object",
                        properties: {
                            page: {
                                type: "integer",
                                minimum: 1,
                                default: 1,
                            },
                            limit: {
                                type: "integer",
                                minimum: 1,
                                maximum: 100,
                                default: 20,
                            },
                            includeReplies: {
                                type: "boolean",
                                default: false,
                            },
                            sortBy: {
                                type: "string",
                                enum: ["createdAt", "likesCount", "repliesCount"],
                                default: "createdAt",
                            },
                            sortOrder: {
                                type: "string",
                                enum: ["asc", "desc"],
                                default: "desc",
                            },
                        },
                    },
                },
            },
        )
    }

    /**
     * Rotas de gerenciamento de comentários
     */
    private registerCommentManagementRoutes(): void {
        // Editar comentário
        this.api.put(
            "/moments/:momentId/comments/:commentId",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    const momentId = request.params?.momentId
                    const commentId = request.params?.commentId
                    const userId = request.user?.id || ""
                    const body = request.body || {}

                    if (!momentId || !commentId) {
                        return response.status(400).send({
                            success: false,
                            error: "ID do momento e comentário são obrigatórios",
                        })
                    }

                    if (!body.content || body.content.trim().length === 0) {
                        return response.status(400).send({
                            success: false,
                            error: "Conteúdo do comentário é obrigatório",
                        })
                    }

                    // TODO: Implementar edição real de comentário
                    response.status(200).send({
                        success: true,
                        message: "Comentário editado com sucesso",
                        comment: {
                            id: commentId,
                            momentId,
                            authorId: userId,
                            content: body.content,
                            updatedAt: new Date(),
                        },
                    })
                } catch (error) {
                    response.status(500).send({
                        success: false,
                        error: error instanceof Error ? error.message : "Erro interno do servidor",
                    })
                }
            },
            {
                schema: {
                    tags: ["Comments"],
                    summary: "Editar comentário",
                    description: "Edita um comentário existente",
                    params: {
                        type: "object",
                        properties: {
                            momentId: {
                                type: "string",
                                description: "ID do momento",
                            },
                            commentId: {
                                type: "string",
                                description: "ID do comentário",
                            },
                        },
                        required: ["momentId", "commentId"],
                    },
                    body: {
                        type: "object",
                        properties: {
                            content: {
                                type: "string",
                                description: "Novo conteúdo do comentário",
                                minLength: 1,
                                maxLength: 500,
                            },
                        },
                        required: ["content"],
                    },
                },
            },
        )

        // Deletar comentário
        this.api.delete(
            "/moments/:momentId/comments/:commentId",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    const momentId = request.params?.momentId
                    const commentId = request.params?.commentId
                    const userId = request.user?.id || ""

                    if (!momentId || !commentId) {
                        return response.status(400).send({
                            success: false,
                            error: "ID do momento e comentário são obrigatórios",
                        })
                    }

                    // TODO: Implementar deleção real de comentário
                    response.status(200).send({
                        success: true,
                        message: "Comentário deletado com sucesso",
                        deletedAt: new Date(),
                    })
                } catch (error) {
                    response.status(500).send({
                        success: false,
                        error: error instanceof Error ? error.message : "Erro interno do servidor",
                    })
                }
            },
            {
                schema: {
                    tags: ["Comments"],
                    summary: "Deletar comentário",
                    description: "Deleta um comentário",
                    params: {
                        type: "object",
                        properties: {
                            momentId: {
                                type: "string",
                                description: "ID do momento",
                            },
                            commentId: {
                                type: "string",
                                description: "ID do comentário",
                            },
                        },
                        required: ["momentId", "commentId"],
                    },
                },
            },
        )

        // Listar momentos comentados por um usuário
        this.api.get(
            "/users/:userId/commented-moments",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    const userId = request.params?.userId
                    const queryParams = request.query || {}

                    if (!userId) {
                        return response.status(400).send({
                            success: false,
                            error: "ID do usuário é obrigatório",
                        })
                    }

                    const page = parseInt(queryParams.page as string) || 1
                    const limit = Math.min(parseInt(queryParams.limit as string) || 20, 100)

                    // TODO: Implementar busca real de momentos comentados
                    response.status(200).send({
                        success: true,
                        moments: [],
                        pagination: {
                            page,
                            limit,
                            total: 0,
                            totalPages: 0,
                        },
                    })
                } catch (error) {
                    response.status(500).send({
                        success: false,
                        error: error instanceof Error ? error.message : "Erro interno do servidor",
                    })
                }
            },
            {
                schema: {
                    tags: ["Comments"],
                    summary: "Listar momentos comentados",
                    description: "Lista momentos comentados por um usuário",
                    params: {
                        type: "object",
                        properties: {
                            userId: {
                                type: "string",
                                description: "ID do usuário",
                            },
                        },
                        required: ["userId"],
                    },
                    querystring: {
                        type: "object",
                        properties: {
                            page: {
                                type: "integer",
                                minimum: 1,
                                default: 1,
                            },
                            limit: {
                                type: "integer",
                                minimum: 1,
                                maximum: 100,
                                default: 20,
                            },
                            sortBy: {
                                type: "string",
                                enum: ["createdAt", "updatedAt"],
                                default: "createdAt",
                            },
                            sortOrder: {
                                type: "string",
                                enum: ["asc", "desc"],
                                default: "desc",
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
export async function Router(api: HttpAdapter): Promise<void> {
    const routes = new MomentCommentRouter(api)
    routes.register()
}
