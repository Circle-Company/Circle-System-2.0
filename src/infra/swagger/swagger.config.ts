/**
 * Configuração do Swagger para documentação da API
 * Focada em documentação interna e desenvolvimento
 */

import { AllSchemas } from "@/infra/swagger/schemas"

// Flag global para controle de registro
let swaggerRegistered = false

// Cache de instâncias já registradas
let registeredInstances = new WeakSet()

// Função para resetar a flag (útil para testes)
export function resetSwaggerRegistration() {
    swaggerRegistered = false
    // Limpar cache de instâncias registradas
    // Note: WeakSet não tem método clear, então criamos uma nova instância
    // Isso é necessário para permitir re-registro em desenvolvimento
    registeredInstances = new WeakSet()

    // Log para debug
    console.log("Swagger registration reset")
}

/**
 * Configuração do Swagger para documentação automática da API
 * Mantém desacoplamento da Clean Architecture
 */

export interface SwaggerConfig {
    title: string
    description: string
    version: string
    license: {
        name: string
        url: string
    }
    servers: Array<{
        url: string
        description: string
    }>
    securitySchemes: Record<string, any>
    components: {
        schemas: Record<string, any>
        responses: Record<string, any>
        parameters: Record<string, any>
        examples: Record<string, any>
    }
}

export const swaggerConfig: SwaggerConfig = {
    title: "Circle System API",
    description:
        "API interna para sistema de vlog com arquitetura limpa. Sistema de momentos, usuários, autenticação e analytics.",
    version: "1.0.0",
    license: {
        name: "Internal Use Only",
        url: "",
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Desenvolvimento Local",
        },
    ],
    securitySchemes: {
        bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT Token",
        },
    },
    components: {
        schemas: {
            ...AllSchemas,
        },
        responses: {
            BadRequest: {
                description: "Dados inválidos",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
            Unauthorized: {
                description: "Não autenticado",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
            Forbidden: {
                description: "Acesso negado",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
            NotFound: {
                description: "Não encontrado",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
            InternalServerError: {
                description: "Erro interno",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
        },
        parameters: {
            PageParam: {
                name: "page",
                in: "query",
                description: "Página",
                required: false,
                schema: { type: "integer", minimum: 1, default: 1 },
            },
            LimitParam: {
                name: "limit",
                in: "query",
                description: "Limite",
                required: false,
                schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            },
            SortByParam: {
                name: "sortBy",
                in: "query",
                description: "Ordenar por",
                required: false,
                schema: {
                    type: "string",
                    enum: ["createdAt", "updatedAt", "likes"],
                    default: "createdAt",
                },
            },
            SortOrderParam: {
                name: "sortOrder",
                in: "query",
                description: "Ordem",
                required: false,
                schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
            },
            IdParam: {
                name: "id",
                in: "path",
                description: "ID",
                required: true,
                schema: { type: "string" },
            },
            UserIdParam: {
                name: "userId",
                in: "path",
                description: "ID do usuário",
                required: true,
                schema: { type: "string" },
            },
            MomentIdParam: {
                name: "momentId",
                in: "path",
                description: "ID do momento",
                required: true,
                schema: { type: "string" },
            },
        },
        examples: {},
    },
}

/**
 * Configuração do Swagger
 */
export const swaggerOptions = {
    openapi: {
        openapi: "3.0.0",
        info: {
            title: swaggerConfig.title,
            description: swaggerConfig.description,
            version: swaggerConfig.version,
            license: swaggerConfig.license,
        },
        servers: swaggerConfig.servers,
        components: {
            securitySchemes: swaggerConfig.securitySchemes,
            ...swaggerConfig.components,
        },
    },
    hideUntagged: false,
    exposeRoute: false,
}

/**
 * Configuração do Swagger UI
 */
export const swaggerUIConfig = {
    routePrefix: "/docs",
    uiConfig: {
        docExpansion: "list",
        deepLinking: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
    },
    staticCSP: {
        "default-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": ["'self'"],
        "img-src": ["'self'", "data:", "https:"],
    },
    transformStaticCSP: (header: string) => header,
    transformSpecification: (swaggerObject: any, request: any, reply: any) => {
        return swaggerObject
    },
    transformSpecificationClone: true,
}

/**
 * Registra o Swagger usando HTTP Adapter
 */
export async function registerSwagger(httpAdapter: any) {
    try {
        if (httpAdapter.registerPlugin && httpAdapter.fastify) {
            // Check if this instance has already been registered
            if (registeredInstances.has(httpAdapter.fastify)) {
                if (httpAdapter.log) {
                    httpAdapter.log.info(
                        "Swagger already registered for this Fastify instance, skipping registration",
                    )
                }
                return
            }

            // Check if the decorator already exists on Fastify
            if (httpAdapter.fastify.hasDecorator && httpAdapter.fastify.hasDecorator("swagger")) {
                if (httpAdapter.log) {
                    httpAdapter.log.info("Swagger decorator already exists, skipping registration")
                }
                return
            }

            // Additional check for swagger property
            if (httpAdapter.fastify.swagger) {
                if (httpAdapter.log) {
                    httpAdapter.log.info("Swagger property already exists, skipping registration")
                }
                return
            }

            // Check if already registered globally (less precise, but a fallback)
            if (swaggerRegistered) {
                if (httpAdapter.log) {
                    httpAdapter.log.info(
                        "Swagger already registered globally, skipping registration",
                    )
                }
                return
            }

            // Final check - if any swagger-related property exists, skip
            if (httpAdapter.fastify.swagger || httpAdapter.fastify.swaggerUi) {
                if (httpAdapter.log) {
                    httpAdapter.log.info("Swagger already configured, skipping registration")
                }
                return
            }

            // Register Swagger with try-catch for decorator duplication
            try {
                await httpAdapter.registerPlugin(require("@fastify/swagger"), swaggerOptions)
            } catch (error: any) {
                if (error.code === "FST_ERR_DEC_ALREADY_PRESENT") {
                    if (httpAdapter.log) {
                        httpAdapter.log.info(
                            "Swagger decorator already present, skipping registration",
                        )
                    }
                    // Continue execution instead of returning
                } else {
                    console.error("Swagger registration error:", error)
                    throw error
                }
            }

            // Register Swagger UI with try-catch for decorator duplication
            try {
                await httpAdapter.registerPlugin(require("@fastify/swagger-ui"), swaggerUIConfig)
            } catch (error: any) {
                if (error.code === "FST_ERR_DEC_ALREADY_PRESENT") {
                    if (httpAdapter.log) {
                        httpAdapter.log.info(
                            "Swagger UI decorator already present, skipping registration",
                        )
                    }
                    // Continue execution instead of returning
                } else {
                    throw error
                }
            }

            // Mark this instance as registered
            registeredInstances.add(httpAdapter.fastify)
            swaggerRegistered = true

            if (httpAdapter.log) {
                httpAdapter.log.info("Swagger documentation registered successfully")
            }
        } else {
            // Mock adapter - apenas log
            if (httpAdapter.log) {
                httpAdapter.log.info("Mock Swagger documentation registered successfully")
            }
        }
    } catch (error: any) {
        if (httpAdapter.log) {
            httpAdapter.log.error("Failed to register Swagger:", error)
        }
        throw error
    }
}
