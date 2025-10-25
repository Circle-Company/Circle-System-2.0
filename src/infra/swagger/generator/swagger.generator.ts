// ===== SWAGGER GENERATOR =====

import { HttpAdapter, HttpRequest, HttpResponse } from "@/infra/http/http.type"

import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import { swaggerConfig } from "../swagger.config"

// Interface estendida para Swagger
interface SwaggerHttpAdapter extends HttpAdapter {
    registerPlugin?(plugin: any, options?: any): Promise<void>
    log?: {
        info(message: string, ...args: any[]): void
        error(message: string, ...args: any[]): void
        debug(message: string, ...args: any[]): void
    }
    fastify?: any
}

export class SwaggerGenerator {
    private httpAdapter: SwaggerHttpAdapter

    constructor(httpAdapter: SwaggerHttpAdapter) {
        this.httpAdapter = httpAdapter
    }

    async generateDocumentation(): Promise<void> {
        try {
            // Para Fastify, usar plugins
            if (this.httpAdapter.fastify && this.httpAdapter.registerPlugin) {
                // Check if Swagger is already registered
                if (
                    this.httpAdapter.fastify.hasDecorator &&
                    this.httpAdapter.fastify.hasDecorator("swagger")
                ) {
                    if (this.httpAdapter.log) {
                        this.httpAdapter.log.info("Swagger already registered, skipping generation")
                    }
                    return
                }

                // Register Swagger
                await this.httpAdapter.registerPlugin(fastifySwagger, {
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
                    exposeRoute: true,
                })

                // Register Swagger UI
                await this.httpAdapter.registerPlugin(fastifySwaggerUi, {
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
                    staticCSP: true,
                    transformSpecificationClone: true,
                })

                // Add route for Swagger documentation
                this.httpAdapter.get(
                    "/docs",
                    async (request: HttpRequest, response: HttpResponse) => {
                        response.status(302)
                        response.header("Location", "/docs/")
                        return response.send("")
                    },
                )
            } else {
                // Para outros adapters, criar rotas básicas
                this.httpAdapter.get(
                    "/docs",
                    async (request: HttpRequest, response: HttpResponse) => {
                        response.status(200).send({
                            message: "Swagger documentation not available in this environment",
                            info: {
                                title: swaggerConfig.title,
                                version: swaggerConfig.version,
                                description: swaggerConfig.description,
                            },
                        })
                    },
                )

                this.httpAdapter.get(
                    "/docs/openapi.json",
                    async (request: HttpRequest, response: HttpResponse) => {
                        response.status(200).send({
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
                        })
                    },
                )
            }

            if (this.httpAdapter.log) {
                this.httpAdapter.log.info("Swagger documentation generated successfully")
            }
        } catch (error) {
            if (this.httpAdapter.log) {
                this.httpAdapter.log.error("Failed to generate Swagger documentation:", error)
            }
            throw error
        }
    }

    async getOpenAPISpec(): Promise<any> {
        try {
            if (this.httpAdapter.fastify && this.httpAdapter.fastify.swagger) {
                return this.httpAdapter.fastify.swagger()
            } else {
                // Retornar spec estático para outros adapters
                return {
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
                }
            }
        } catch (error) {
            if (this.httpAdapter.log) {
                this.httpAdapter.log.error("Failed to get OpenAPI spec:", error)
            }
            throw error
        }
    }
}

/**
 * Função utilitária para gerar documentação Swagger
 */
export async function generateSwaggerDocs(
    httpAdapter: SwaggerHttpAdapter,
    options?: {
        title?: string
        version?: string
        description?: string
        basePath?: string
        tags?: Array<{ name: string; description: string }>
        securityDefinitions?: Record<string, any>
        definitions?: Record<string, any>
    },
): Promise<void> {
    const generator = new SwaggerGenerator(httpAdapter)
    await generator.generateDocumentation()
}

/**
 * Função utilitária para criar gerador automático
 */
export function createAutoSwaggerGenerator(httpAdapter: SwaggerHttpAdapter): SwaggerGenerator {
    return new SwaggerGenerator(httpAdapter)
}
