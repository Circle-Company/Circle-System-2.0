/**
 * Módulo principal do Swagger
 * Integra configuração, schemas e gerador automático
 * Mantém desacoplamento da Clean Architecture
 */

import { registerSwagger, swaggerConfig } from "./swagger.config"

import { HttpAdapter } from "@/infra/http/http.type"
import { generateSwaggerDocs } from "./generator/swagger.generator"

// Interface estendida para Swagger
interface SwaggerHttpAdapter extends HttpAdapter {
    // Para compatibilidade com Fastify quando necessário
    registerPlugin?(plugin: any, options?: any): Promise<void>
    log?: {
        info(message: string, ...args: any[]): void
        error(message: string, ...args: any[]): void
        debug(message: string, ...args: any[]): void
    }
    // Para acesso direto ao Fastify quando disponível
    fastify?: any
}

// ===== EXPORTS =====

export {
    // Schemas
    AllSchemas,
} from "@/infra/swagger/schemas"

export {
    // Configuração
    swaggerConfig,
    swaggerOptions,
    swaggerUIConfig,
} from "./swagger.config"

export {
    extractSwaggerMetadata,
    SwaggerAdmin,
    SwaggerAuth,
    SwaggerBody,
    SwaggerDelete,
    SwaggerDeprecated,
    SwaggerError,
    SwaggerExample,
    SwaggerGet,
    SwaggerParam,
    SwaggerPatch,
    SwaggerPost,
    SwaggerPut,
    SwaggerQuery,
    // Decorators
    SwaggerRoute,
    SwaggerSchema,
    SwaggerSuccess,
    SwaggerTags,
} from "./decorators/swagger.decorators"

export {
    createAutoSwaggerGenerator,
    generateSwaggerDocs,
    // Gerador
    SwaggerGenerator,
} from "./generator/swagger.generator"

// ===== FUNÇÃO PRINCIPAL DE REGISTRO =====

/**
 * Registra o Swagger na aplicação usando HTTP Adapter
 * @param httpAdapter Instância do HTTP Adapter
 * @param options Opções de configuração (opcional)
 */
export async function setupSwagger(
    httpAdapter: SwaggerHttpAdapter,
    options?: {
        enableAutoGeneration?: boolean
        customSchemas?: Record<string, any>
        customTags?: Array<{ name: string; description: string }>
    },
) {
    try {
        // 1. Registrar Swagger básico
        await registerSwagger(httpAdapter)

        // 2. Se habilitado, gerar documentação automaticamente
        if (options?.enableAutoGeneration) {
            await generateSwaggerDocs(httpAdapter, {
                title: swaggerConfig.title,
                version: swaggerConfig.version,
                description: swaggerConfig.description,
                basePath: "/",
                tags: options.customTags || swaggerConfig.tags,
                securityDefinitions: swaggerConfig.securitySchemes,
                definitions: options.customSchemas || {},
            })
        }

        if (httpAdapter.log) {
            httpAdapter.log.info("Swagger setup completed successfully")
        }
    } catch (error: any) {
        if (httpAdapter.log) {
            httpAdapter.log.error("Failed to setup Swagger:", error)
        }
        throw error
    }
}

// ===== UTILITÁRIOS =====

/**
 * Cria uma configuração personalizada do Swagger
 */
export function createCustomSwaggerConfig(overrides: Partial<typeof swaggerConfig>) {
    return {
        ...swaggerConfig,
        ...overrides,
    }
}

/**
 * Adiciona schemas personalizados ao Swagger
 */
export function addCustomSchemas(schemas: Record<string, any>) {
    return {
        ...swaggerConfig,
        components: {
            ...swaggerConfig.components,
            schemas: {
                ...swaggerConfig.components.schemas,
                ...schemas,
            },
        },
    }
}

/**
 * Adiciona tags personalizadas ao Swagger
 */
export function addCustomTags(tags: Array<{ name: string; description: string }>) {
    return {
        ...swaggerConfig,
        tags: [...swaggerConfig.tags, ...tags],
    }
}

// ===== MIDDLEWARE DE DOCUMENTAÇÃO =====

/**
 * Middleware para adicionar informações de documentação às rotas
 */
export function swaggerDocumentationMiddleware() {
    return async function (httpAdapter: SwaggerHttpAdapter) {
        // Adicionar hook para documentar rotas automaticamente
        httpAdapter.addHook("onRoute", (routeOptions: any) => {
            // Aqui você pode adicionar lógica para documentar rotas automaticamente
            if (httpAdapter.log) {
                httpAdapter.log.debug(
                    `Documenting route: ${routeOptions.method} ${routeOptions.url}`,
                )
            }
        })
    }
}

// ===== VALIDAÇÃO DE SCHEMAS =====

/**
 * Valida se os schemas do Swagger estão corretos
 */
export function validateSwaggerSchemas(schemas: Record<string, any>): boolean {
    try {
        // Validação básica dos schemas
        Object.entries(schemas).forEach(([name, schema]) => {
            if (!schema || typeof schema !== "object") {
                throw new Error(`Invalid schema: ${name}`)
            }
        })
        return true
    } catch (error) {
        console.error("Schema validation failed:", error)
        return false
    }
}

// ===== EXPORT DEFAULT =====

export default {
    setupSwagger,
    createCustomSwaggerConfig,
    addCustomSchemas,
    addCustomTags,
    swaggerDocumentationMiddleware,
    validateSwaggerSchemas,
}
