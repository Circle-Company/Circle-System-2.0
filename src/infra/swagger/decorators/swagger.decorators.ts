/**
 * Decorators do Swagger para documentação automática
 * Mantém desacoplamento da Clean Architecture
 */

import { FastifyInstance } from "fastify"

// ===== TIPOS DE DECORATORS =====

export interface SwaggerRouteOptions {
    tags?: string[]
    summary?: string
    description?: string
    operationId?: string
    deprecated?: boolean
    security?: Array<Record<string, string[]>>
    requestBody?: {
        required?: boolean
        content?: Record<string, any>
    }
    parameters?: Array<{
        name: string
        in: "query" | "path" | "header" | "cookie"
        required?: boolean
        schema?: any
        description?: string
        example?: any
    }>
    responses?: Record<
        string,
        {
            description: string
            content?: Record<string, any>
        }
    >
    callbacks?: Record<string, any>
    externalDocs?: {
        description: string
        url: string
    }
}

export interface SwaggerSchemaOptions {
    name: string
    schema: any
    description?: string
}

// ===== DECORATORS DE ROTA =====

/**
 * Decorator para documentar rotas do Swagger
 */
export function SwaggerRoute(options: SwaggerRouteOptions) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // Armazenar metadados do Swagger na classe
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        target.constructor._swaggerRoutes[propertyKey] = options

        return descriptor
    }
}

/**
 * Decorator para documentar schemas do Swagger
 */
export function SwaggerSchema(options: SwaggerSchemaOptions) {
    return function (target: any) {
        // Armazenar metadados do schema na classe
        target._swaggerSchema = options

        return target
    }
}

// ===== DECORATORS ESPECÍFICOS POR OPERAÇÃO =====

/**
 * Decorator para operações GET
 */
export function SwaggerGet(options: Omit<SwaggerRouteOptions, "requestBody">) {
    return SwaggerRoute({
        ...options,
        tags: options.tags || ["default"],
    })
}

/**
 * Decorator para operações POST
 */
export function SwaggerPost(options: SwaggerRouteOptions) {
    return SwaggerRoute({
        ...options,
        tags: options.tags || ["default"],
    })
}

/**
 * Decorator para operações PUT
 */
export function SwaggerPut(options: SwaggerRouteOptions) {
    return SwaggerRoute({
        ...options,
        tags: options.tags || ["default"],
    })
}

/**
 * Decorator para operações DELETE
 */
export function SwaggerDelete(options: Omit<SwaggerRouteOptions, "requestBody">) {
    return SwaggerRoute({
        ...options,
        tags: options.tags || ["default"],
    })
}

/**
 * Decorator para operações PATCH
 */
export function SwaggerPatch(options: SwaggerRouteOptions) {
    return SwaggerRoute({
        ...options,
        tags: options.tags || ["default"],
    })
}

// ===== DECORATORS DE AUTENTICAÇÃO =====

/**
 * Decorator para rotas que requerem autenticação
 */
export function SwaggerAuth(roles?: string[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // Adicionar segurança JWT
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey]) {
            target.constructor._swaggerRoutes[propertyKey] = {}
        }

        target.constructor._swaggerRoutes[propertyKey].security = [{ bearerAuth: [] }]

        if (roles && roles.length > 0) {
            target.constructor._swaggerRoutes[propertyKey].description = `${
                target.constructor._swaggerRoutes[propertyKey].description || ""
            }\n\n**Permissões necessárias:** ${roles.join(", ")}`
        }

        return descriptor
    }
}

/**
 * Decorator para rotas administrativas
 */
export function SwaggerAdmin() {
    return SwaggerAuth(["admin", "moderator"])
}

// ===== DECORATORS DE VALIDAÇÃO =====

/**
 * Decorator para documentar parâmetros de query
 */
export function SwaggerQuery(
    name: string,
    schema: any,
    options: {
        required?: boolean
        description?: string
        example?: any
    } = {},
) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey]) {
            target.constructor._swaggerRoutes[propertyKey] = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey].parameters) {
            target.constructor._swaggerRoutes[propertyKey].parameters = []
        }

        target.constructor._swaggerRoutes[propertyKey].parameters.push({
            name,
            in: "query",
            required: options.required || false,
            schema,
            description: options.description,
            example: options.example,
        })

        return descriptor
    }
}

/**
 * Decorator para documentar parâmetros de path
 */
export function SwaggerParam(
    name: string,
    schema: any,
    options: {
        description?: string
        example?: any
    } = {},
) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey]) {
            target.constructor._swaggerRoutes[propertyKey] = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey].parameters) {
            target.constructor._swaggerRoutes[propertyKey].parameters = []
        }

        target.constructor._swaggerRoutes[propertyKey].parameters.push({
            name,
            in: "path",
            required: true,
            schema,
            description: options.description,
            example: options.example,
        })

        return descriptor
    }
}

/**
 * Decorator para documentar request body
 */
export function SwaggerBody(
    schema: any,
    options: {
        required?: boolean
        description?: string
    } = {},
) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey]) {
            target.constructor._swaggerRoutes[propertyKey] = {}
        }

        target.constructor._swaggerRoutes[propertyKey].requestBody = {
            required: options.required || false,
            content: {
                "application/json": {
                    schema,
                },
            },
        }

        if (options.description) {
            target.constructor._swaggerRoutes[propertyKey].description = `${
                target.constructor._swaggerRoutes[propertyKey].description || ""
            }\n\n**Request Body:** ${options.description}`
        }

        return descriptor
    }
}

// ===== DECORATORS DE RESPOSTA =====

/**
 * Decorator para documentar respostas de sucesso
 */
export function SwaggerSuccess(statusCode: number, schema: any, description?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey]) {
            target.constructor._swaggerRoutes[propertyKey] = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey].responses) {
            target.constructor._swaggerRoutes[propertyKey].responses = {}
        }

        target.constructor._swaggerRoutes[propertyKey].responses[statusCode] = {
            description: description || "Sucesso",
            content: {
                "application/json": {
                    schema,
                },
            },
        }

        return descriptor
    }
}

/**
 * Decorator para documentar respostas de erro
 */
export function SwaggerError(statusCode: number, description?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey]) {
            target.constructor._swaggerRoutes[propertyKey] = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey].responses) {
            target.constructor._swaggerRoutes[propertyKey].responses = {}
        }

        target.constructor._swaggerRoutes[propertyKey].responses[statusCode] = {
            description: description || "Erro",
            content: {
                "application/json": {
                    schema: {
                        $ref: "#/components/schemas/Error",
                    },
                },
            },
        }

        return descriptor
    }
}

// ===== DECORATORS DE TAGS =====

/**
 * Decorator para definir tags do Swagger
 */
export function SwaggerTags(...tags: string[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey]) {
            target.constructor._swaggerRoutes[propertyKey] = {}
        }

        target.constructor._swaggerRoutes[propertyKey].tags = tags

        return descriptor
    }
}

// ===== DECORATORS DE DEPRECATION =====

/**
 * Decorator para marcar rotas como deprecated
 */
export function SwaggerDeprecated(reason?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey]) {
            target.constructor._swaggerRoutes[propertyKey] = {}
        }

        target.constructor._swaggerRoutes[propertyKey].deprecated = true

        if (reason) {
            target.constructor._swaggerRoutes[propertyKey].description = `${
                target.constructor._swaggerRoutes[propertyKey].description || ""
            }\n\n**⚠️ DEPRECATED:** ${reason}`
        }

        return descriptor
    }
}

// ===== UTILITÁRIOS =====

/**
 * Função para extrair metadados do Swagger de uma classe
 */
export function extractSwaggerMetadata(target: any): {
    routes: Record<string, SwaggerRouteOptions>
    schemas: SwaggerSchemaOptions[]
} {
    const routes = target._swaggerRoutes || {}
    const schemas = target._swaggerSchema ? [target._swaggerSchema] : []

    return { routes, schemas }
}

/**
 * Função para registrar rotas do Swagger no Fastify
 */
export function registerSwaggerRoutes(
    fastify: FastifyInstance,
    controller: any,
    basePath: string = "",
) {
    const { routes } = extractSwaggerMetadata(controller.constructor)

    Object.entries(routes).forEach(([methodName, options]) => {
        // Aqui você pode registrar as rotas com os metadados do Swagger
        // Isso seria feito automaticamente pelo sistema de rotas
        fastify.log.info(`Registered Swagger route: ${methodName}`, options as any)
    })
}

// ===== DECORATORS DE EXEMPLO =====

/**
 * Decorator para adicionar exemplos de uso
 */
export function SwaggerExample(example: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target.constructor._swaggerRoutes) {
            target.constructor._swaggerRoutes = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey]) {
            target.constructor._swaggerRoutes[propertyKey] = {}
        }

        if (!target.constructor._swaggerRoutes[propertyKey].responses) {
            target.constructor._swaggerRoutes[propertyKey].responses = {}
        }

        // Adicionar exemplo à resposta 200 se existir
        if (target.constructor._swaggerRoutes[propertyKey].responses[200]) {
            target.constructor._swaggerRoutes[propertyKey].responses[200].content = {
                "application/json": {
                    schema: target.constructor._swaggerRoutes[propertyKey].responses[200].content?.[
                        "application/json"
                    ]?.schema,
                    example,
                },
            }
        }

        return descriptor
    }
}
