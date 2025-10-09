/**
 * Common Schemas - Schemas reutilizáveis para toda a API
 *
 * Define estruturas comuns que são usadas em múltiplos endpoints
 *
 * @author Circle System Team
 * @version 1.0.0
 */

// ===== RESPONSE WRAPPERS =====

export const SuccessResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            description: "Indica se a operação foi bem-sucedida",
            example: true,
        },
        message: {
            type: "string",
            description: "Mensagem descritiva do resultado",
            example: "Operação realizada com sucesso",
        },
        timestamp: {
            type: "string",
            format: "date-time",
            description: "Timestamp da resposta",
            example: "2025-10-08T10:30:00.000Z",
        },
    },
    required: ["success"],
}

export const ErrorResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            description: "Sempre false para erros",
            example: false,
            default: false,
        },
        error: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    description: "Mensagem de erro legível",
                    example: "Recurso não encontrado",
                },
                code: {
                    type: "string",
                    description: "Código de erro para identificação programática",
                    example: "RESOURCE_NOT_FOUND",
                },
                details: {
                    type: "object",
                    description: "Detalhes adicionais sobre o erro",
                    additionalProperties: true,
                },
                timestamp: {
                    type: "string",
                    format: "date-time",
                    description: "Timestamp do erro",
                    example: "2025-10-08T10:30:00.000Z",
                },
                path: {
                    type: "string",
                    description: "Caminho da requisição que gerou o erro",
                    example: "/api/moments/123",
                },
            },
            required: ["message", "code"],
        },
    },
    required: ["success", "error"],
}

export const ValidationErrorSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: false,
            default: false,
        },
        error: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    example: "Dados de entrada inválidos",
                },
                code: {
                    type: "string",
                    example: "VALIDATION_ERROR",
                },
                validationErrors: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            field: {
                                type: "string",
                                description: "Campo que falhou na validação",
                                example: "email",
                            },
                            message: {
                                type: "string",
                                description: "Mensagem de erro da validação",
                                example: "Email inválido",
                            },
                            value: {
                                type: "string",
                                description: "Valor que foi rejeitado",
                                example: "invalid-email",
                            },
                        },
                    },
                    description: "Lista de erros de validação",
                },
            },
        },
    },
}

// ===== PAGINATION =====

export const PaginationQuerySchema = {
    type: "object",
    properties: {
        page: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Número da página (começando em 1)",
            example: 1,
        },
        limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20,
            description: "Quantidade de itens por página",
            example: 20,
        },
        sortBy: {
            type: "string",
            description: "Campo para ordenação",
            example: "createdAt",
        },
        sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
            description: "Direção da ordenação",
            example: "desc",
        },
    },
}

export const PaginationMetaSchema = {
    type: "object",
    properties: {
        currentPage: {
            type: "integer",
            description: "Página atual",
            example: 1,
        },
        totalPages: {
            type: "integer",
            description: "Total de páginas",
            example: 10,
        },
        totalItems: {
            type: "integer",
            description: "Total de itens",
            example: 200,
        },
        itemsPerPage: {
            type: "integer",
            description: "Itens por página",
            example: 20,
        },
        hasNextPage: {
            type: "boolean",
            description: "Indica se há próxima página",
            example: true,
        },
        hasPreviousPage: {
            type: "boolean",
            description: "Indica se há página anterior",
            example: false,
        },
    },
    required: ["currentPage", "totalPages", "totalItems", "itemsPerPage"],
}

export const PaginatedResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
        },
        data: {
            type: "array",
            items: {
                type: "object",
            },
            description: "Array de resultados",
        },
        pagination: PaginationMetaSchema,
        timestamp: {
            type: "string",
            format: "date-time",
            example: "2025-10-08T10:30:00.000Z",
        },
    },
    required: ["success", "data", "pagination"],
}

// ===== COMMON ENTITIES =====

export const UserBasicSchema = {
    type: "object",
    properties: {
        id: {
            type: "string",
            description: "ID único do usuário",
            example: "1234567890",
        },
        username: {
            type: "string",
            description: "Nome de usuário",
            example: "johndoe",
        },
        avatar: {
            type: "string",
            format: "uri",
            description: "URL do avatar do usuário",
            example: "https://cdn.circle.com/avatars/johndoe.jpg",
            nullable: true,
        },
        verified: {
            type: "boolean",
            description: "Indica se o usuário é verificado",
            example: false,
            default: false,
        },
    },
    required: ["id", "username"],
}

export const LocationSchema = {
    type: "object",
    properties: {
        latitude: {
            type: "number",
            minimum: -90,
            maximum: 90,
            description: "Latitude",
            example: -23.5505,
        },
        longitude: {
            type: "number",
            minimum: -180,
            maximum: 180,
            description: "Longitude",
            example: -46.6333,
        },
        city: {
            type: "string",
            description: "Cidade",
            example: "São Paulo",
            nullable: true,
        },
        country: {
            type: "string",
            description: "País",
            example: "Brasil",
            nullable: true,
        },
    },
    required: ["latitude", "longitude"],
}

export const TimestampsSchema = {
    type: "object",
    properties: {
        createdAt: {
            type: "string",
            format: "date-time",
            description: "Data de criação",
            example: "2025-10-08T10:30:00.000Z",
        },
        updatedAt: {
            type: "string",
            format: "date-time",
            description: "Data da última atualização",
            example: "2025-10-08T10:30:00.000Z",
        },
        deletedAt: {
            type: "string",
            format: "date-time",
            description: "Data de exclusão (se aplicável)",
            example: null,
            nullable: true,
        },
    },
    required: ["createdAt", "updatedAt"],
}

// ===== ID PARAMETERS =====

export const IdParamSchema = {
    type: "object",
    properties: {
        id: {
            type: "string",
            description: "ID único do recurso",
            example: "1234567890",
        },
    },
    required: ["id"],
}

export const UserIdParamSchema = {
    type: "object",
    properties: {
        userId: {
            type: "string",
            description: "ID único do usuário",
            example: "1234567890",
        },
    },
    required: ["userId"],
}

export const MomentIdParamSchema = {
    type: "object",
    properties: {
        momentId: {
            type: "string",
            description: "ID único do momento",
            example: "1234567890",
        },
    },
    required: ["momentId"],
}

// ===== HEADERS =====

export const AuthHeadersSchema = {
    type: "object",
    properties: {
        authorization: {
            type: "string",
            description: "Token de autenticação Bearer",
            example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
    },
    required: ["authorization"],
}

export const DeviceHeadersSchema = {
    type: "object",
    properties: {
        "user-agent": {
            type: "string",
            description: "User agent do cliente",
            example: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        },
        "x-device": {
            type: "string",
            enum: ["mobile", "tablet", "desktop", "web"],
            description: "Tipo de dispositivo",
            example: "mobile",
        },
        "x-machine-id": {
            type: "string",
            description: "ID único da máquina/dispositivo",
            example: "abc123def456",
        },
        "x-timezone": {
            type: "string",
            description: "Timezone do cliente",
            example: "America/Sao_Paulo",
        },
    },
}

// ===== STATUS CODES =====

export const HTTP_RESPONSES = {
    200: {
        description: "Sucesso",
        content: {
            "application/json": {
                schema: SuccessResponseSchema,
            },
        },
    },
    201: {
        description: "Recurso criado com sucesso",
        content: {
            "application/json": {
                schema: SuccessResponseSchema,
            },
        },
    },
    204: {
        description: "Sucesso sem conteúdo",
    },
    400: {
        description: "Requisição inválida - Dados de entrada incorretos",
        content: {
            "application/json": {
                schema: ValidationErrorSchema,
            },
        },
    },
    401: {
        description: "Não autenticado - Token ausente ou inválido",
        content: {
            "application/json": {
                schema: ErrorResponseSchema,
            },
        },
    },
    403: {
        description: "Acesso negado - Permissões insuficientes",
        content: {
            "application/json": {
                schema: ErrorResponseSchema,
            },
        },
    },
    404: {
        description: "Recurso não encontrado",
        content: {
            "application/json": {
                schema: ErrorResponseSchema,
            },
        },
    },
    409: {
        description: "Conflito - Recurso já existe",
        content: {
            "application/json": {
                schema: ErrorResponseSchema,
            },
        },
    },
    422: {
        description: "Entidade não processável - Validação de negócio falhou",
        content: {
            "application/json": {
                schema: ValidationErrorSchema,
            },
        },
    },
    429: {
        description: "Muitas requisições - Rate limit excedido",
        content: {
            "application/json": {
                schema: ErrorResponseSchema,
            },
        },
    },
    500: {
        description: "Erro interno do servidor",
        content: {
            "application/json": {
                schema: ErrorResponseSchema,
            },
        },
    },
    503: {
        description: "Serviço indisponível",
        content: {
            "application/json": {
                schema: ErrorResponseSchema,
            },
        },
    },
}

// ===== EXPORT ALL =====

export const CommonSchemas = {
    SuccessResponse: SuccessResponseSchema,
    ErrorResponse: ErrorResponseSchema,
    ValidationError: ValidationErrorSchema,
    PaginationQuery: PaginationQuerySchema,
    PaginationMeta: PaginationMetaSchema,
    PaginatedResponse: PaginatedResponseSchema,
    UserBasic: UserBasicSchema,
    Location: LocationSchema,
    Timestamps: TimestampsSchema,
    IdParam: IdParamSchema,
    UserIdParam: UserIdParamSchema,
    MomentIdParam: MomentIdParamSchema,
    AuthHeaders: AuthHeadersSchema,
    DeviceHeaders: DeviceHeadersSchema,
}

