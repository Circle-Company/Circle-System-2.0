/**
 * Schemas específicos para as rotas do moment router
 * Este arquivo centraliza os schemas de request/response para melhor organização
 */

import {
    CommentSchema,
    CreateMomentSchema,
    ListMomentsQuerySchema,
    MomentErrorSchema,
    MomentResponseSchema,
    ReportSchema,
    SearchMomentsQuerySchema,
    UpdateMomentSchema,
} from "@/infra/swagger/schemas/moment.schemas"

// ===== RESPONSE SCHEMAS =====

export const SuccessResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
            description: "Indica se a operação foi bem-sucedida",
        },
        message: {
            type: "string",
            description: "Mensagem de confirmação",
        },
        timestamp: {
            type: "string",
            format: "date-time",
            description: "Timestamp da operação",
        },
    },
    required: ["success"],
}

export const MomentCreatedResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
        },
        moment: MomentResponseSchema,
        message: {
            type: "string",
            example: "Momento criado com sucesso",
        },
        timestamp: {
            type: "string",
            format: "date-time",
        },
    },
    required: ["success", "moment"],
}

export const MomentDeletedResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
        },
        message: {
            type: "string",
            example: "Momento deletado com sucesso",
        },
        deletedAt: {
            type: "string",
            format: "date-time",
            description: "Timestamp da exclusão",
        },
    },
    required: ["success", "message"],
}

export const CommentCreatedResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
        },
        comment: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "ID único do comentário",
                    example: "987654321",
                },
                content: {
                    type: "string",
                    description: "Conteúdo do comentário",
                    example: "Muito bom o vlog!",
                },
                userId: {
                    type: "string",
                    description: "ID do autor do comentário",
                    example: "123456789",
                },
                momentId: {
                    type: "string",
                    description: "ID do momento comentado",
                    example: "123456789",
                },
                createdAt: {
                    type: "string",
                    format: "date-time",
                },
                updatedAt: {
                    type: "string",
                    format: "date-time",
                },
            },
        },
        message: {
            type: "string",
            example: "Comentário criado com sucesso",
        },
    },
    required: ["success", "comment"],
}

export const ReportCreatedResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
        },
        report: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "ID único do report",
                },
                reason: {
                    type: "string",
                    description: "Motivo do report",
                },
                description: {
                    type: "string",
                    description: "Descrição adicional",
                },
                reporterId: {
                    type: "string",
                    description: "ID do usuário que reportou",
                },
                momentId: {
                    type: "string",
                    description: "ID do momento reportado",
                },
                createdAt: {
                    type: "string",
                    format: "date-time",
                },
            },
        },
        message: {
            type: "string",
            example: "Report enviado com sucesso",
        },
    },
    required: ["success", "report"],
}

export const MomentPublishedResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
        },
        message: {
            type: "string",
            example: "Momento publicado com sucesso",
        },
        moment: MomentResponseSchema,
        publishedAt: {
            type: "string",
            format: "date-time",
        },
    },
    required: ["success", "message", "publishedAt"],
}

export const MomentListResponseSchema = {
    type: "object",
    properties: {
        moments: {
            type: "array",
            items: MomentResponseSchema,
        },
        pagination: {
            type: "object",
            properties: {
                page: {
                    type: "integer",
                    example: 1,
                    description: "Página atual",
                },
                limit: {
                    type: "integer",
                    example: 20,
                    description: "Itens por página",
                },
                total: {
                    type: "integer",
                    example: 100,
                    description: "Total de itens",
                },
                totalPages: {
                    type: "integer",
                    example: 5,
                    description: "Total de páginas",
                },
                hasNext: {
                    type: "boolean",
                    example: true,
                    description: "Se há próxima página",
                },
                hasPrev: {
                    type: "boolean",
                    example: false,
                    description: "Se há página anterior",
                },
            },
            required: ["page", "limit", "total", "totalPages", "hasNext", "hasPrev"],
        },
        metadata: {
            type: "object",
            properties: {
                processedAt: {
                    type: "string",
                    format: "date-time",
                    description: "Timestamp do processamento",
                },
                duration: {
                    type: "number",
                    example: 150.5,
                    description: "Duração da consulta em ms",
                },
            },
        },
    },
    required: ["moments", "pagination"],
}

export const MomentSearchResponseSchema = {
    type: "object",
    properties: {
        moments: {
            type: "array",
            items: MomentResponseSchema,
        },
        searchTerm: {
            type: "string",
            example: "tecnologia",
            description: "Termo pesquisado",
        },
        searchType: {
            type: "string",
            example: "all",
            description: "Tipo de busca realizada",
        },
        totalResults: {
            type: "integer",
            example: 15,
            description: "Total de resultados encontrados",
        },
        pagination: {
            type: "object",
            properties: {
                page: {
                    type: "integer",
                    example: 1,
                },
                limit: {
                    type: "integer",
                    example: 20,
                },
                total: {
                    type: "integer",
                    example: 15,
                },
                totalPages: {
                    type: "integer",
                    example: 1,
                },
                hasNext: {
                    type: "boolean",
                    example: false,
                },
                hasPrev: {
                    type: "boolean",
                    example: false,
                },
            },
            required: ["page", "limit", "total", "totalPages", "hasNext", "hasPrev"],
        },
        searchMetadata: {
            type: "object",
            properties: {
                filtersApplied: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    example: ["hashtags", "mentions"],
                },
                processingTime: {
                    type: "number",
                    example: 50.2,
                    description: "Tempo de processamento da busca em ms",
                },
                searchQuality: {
                    type: "string",
                    enum: ["excellent", "good", "fair", "poor"],
                    example: "good",
                    description: "Qualidade dos resultados da busca",
                },
            },
        },
    },
    required: ["moments", "searchTerm", "searchType", "totalResults", "pagination"],
}

// ===== PARAM SCHEMAS =====

export const MomentIdParamSchema = {
    type: "object",
    properties: {
        id: {
            type: "string",
            pattern: "^[0-9]+$",
            description: "ID único do momento",
            example: "123456789",
            minLength: 1,
        },
    },
    required: ["id"],
}

export const UserIdParamSchema = {
    type: "object",
    properties: {
        userId: {
            type: "string",
            pattern: "^[0-9]+$",
            description: "ID único do usuário",
            example: "123456789",
            minLength: 1,
        },
    },
    required: ["userId"],
}

export const CommentIdParamSchema = {
    type: "object",
    properties: {
        id: {
            type: "string",
            pattern: "^[0-9]+$",
            description: "ID único do momento",
            example: "123456789",
        },
        commentId: {
            type: "string",
            pattern: "^[0-9]+$",
            description: "ID único do comentário",
            example: "987654321",
        },
    },
    required: ["id", "commentId"],
}

// ===== INPUT SCHEMAS (re-exported for convenience) =====

export const MomentRequestSchemas = {
    create: CreateMomentSchema,
    update: UpdateMomentSchema,
    comment: CommentSchema,
    report: ReportSchema,
    search: SearchMomentsQuerySchema,
    list: ListMomentsQuerySchema,
}

export const MomentResponseSchemas = {
    moment: MomentResponseSchema,
    momentList: MomentListResponseSchema,
    momentCreated: MomentCreatedResponseSchema,
    momentDeleted: MomentDeletedResponseSchema,
    commentCreated: CommentCreatedResponseSchema,
    reportCreated: ReportCreatedResponseSchema,
    momentPublished: MomentPublishedResponseSchema,
    momentSearch: MomentSearchResponseSchema,
    success: SuccessResponseSchema,
}

export const MomentParamSchemas = {
    momentId: MomentIdParamSchema,
    userId: UserIdParamSchema,
    commentId: CommentIdParamSchema,
}

export const MomentErrorSchemas = {
    default: MomentErrorSchema,
}
