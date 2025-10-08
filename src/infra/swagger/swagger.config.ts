/**
 * Configuração do Swagger para documentação da API
 * Documentação profissional e robusta com organização por domínios
 *
 * @author Circle System Team
 * @version 2.0.0
 */

import { AllSchemas } from "@/infra/swagger/schemas"
import { SWAGGER_CUSTOM_CSS } from "./swagger.theme"
import { API_TAGS, TAG_ORDER } from "./tags.config"

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
    contact: {
        name: string
        email: string
        url: string
    }
    license: {
        name: string
        url: string
    }
    servers: Array<{
        url: string
        description: string
    }>
    tags: Array<{
        name: string
        description: string
    }>
    externalDocs?: {
        description: string
        url: string
    }
    securitySchemes: Record<string, any>
    components: {
        schemas: Record<string, any>
        responses: Record<string, any>
        parameters: Record<string, any>
        examples: Record<string, any>
        securitySchemes: Record<string, any>
    }
}

export const swaggerConfig: SwaggerConfig = {
    title: "Circle System API",
    description: `
# Circle System - API de Rede Social de Vídeos

API RESTful completa para plataforma de compartilhamento de vídeos curtos (vlogs/momentos).

## 🎯 Arquitetura

Desenvolvida seguindo os princípios de **Clean Architecture**, garantindo:
- Separação clara de responsabilidades
- Alta testabilidade
- Independência de frameworks
- Facilidade de manutenção

## 🚀 Principais Features

### Autenticação e Autorização
- Sistema JWT com refresh tokens
- RBAC (Role-Based Access Control)
- Permissões granulares
- Multi-dispositivo

### Gestão de Conteúdo
- Upload e processamento de vídeos
- Sistema de hashtags e menções
- Controles de visibilidade
- Geolocalização
- Moderação automática

### Interações Sociais
- Likes e reações
- Sistema de comentários
- Compartilhamentos
- Seguir/Seguidores

### Analytics
- Métricas de engajamento
- Análise de audiência
- Performance de conteúdo
- Relatórios personalizados

## 📝 Convenções

### Autenticação
Todas as rotas que requerem autenticação necessitam do header:
\`\`\`
Authorization: Bearer <JWT_TOKEN>
\`\`\`

### Formato de Respostas
Todas as respostas seguem o padrão:
\`\`\`json
{
  "success": true|false,
  "data": {...},
  "error": {...},
  "timestamp": "2025-10-08T10:30:00.000Z"
}
\`\`\`

### Paginação
Endpoints com listagem suportam paginação:
- \`page\`: Número da página (padrão: 1)
- \`limit\`: Itens por página (padrão: 20, máximo: 100)
- \`sortBy\`: Campo para ordenação
- \`sortOrder\`: Direção (asc/desc)

### Códigos de Status HTTP
- \`200\`: Sucesso
- \`201\`: Recurso criado
- \`400\`: Requisição inválida
- \`401\`: Não autenticado
- \`403\`: Acesso negado
- \`404\`: Não encontrado
- \`422\`: Validação de negócio falhou
- \`429\`: Rate limit excedido
- \`500\`: Erro interno

## 🔒 Segurança

- Todas as senhas são criptografadas com bcrypt
- Tokens JWT com expiração configurável
- Rate limiting automático
- Validação de entrada em todas as rotas
- Sistema de moderação de conteúdo

## 📚 Documentação Adicional

Para mais informações, consulte a documentação completa em nosso repositório.
    `.trim(),
    version: "2.0.0",
    contact: {
        name: "Circle System Team",
        email: "dev@circle.com",
        url: "https://circle.com",
    },
    license: {
        name: "Proprietary - Internal Use Only",
        url: "",
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "🔧 Ambiente de Desenvolvimento Local",
        },
        {
            url: "https://dev-api.circle.com",
            description: "🧪 Ambiente de Desenvolvimento",
        },
        {
            url: "https://staging-api.circle.com",
            description: "🎭 Ambiente de Staging",
        },
        {
            url: "https://api.circle.com",
            description: "🚀 Ambiente de Produção",
        },
    ],
    tags: API_TAGS,
    externalDocs: {
        description: "Documentação Completa do Sistema",
        url: "https://docs.circle.com",
    },
    securitySchemes: {
        bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: `
**Autenticação JWT**

Para acessar rotas protegidas, você precisa incluir um token JWT válido no header Authorization.

**Como obter um token:**
1. Faça login através do endpoint \`POST /signin\`
2. Use o token retornado no campo \`token\` da resposta
3. Inclua o token em todas as requisições subsequentes

**Formato do header:**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Expiração:**
- Access Token: 24 horas
- Refresh Token: 30 dias

**Renovação:**
Use o endpoint \`POST /refresh-token\` para obter um novo token antes que expire.
            `.trim(),
        },
    },
    components: {
        schemas: {
            ...AllSchemas,
        },
        responses: {
            Success: {
                description: "✅ Operação realizada com sucesso",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/SuccessResponse" },
                    },
                },
            },
            Created: {
                description: "✅ Recurso criado com sucesso",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/SuccessResponse" },
                    },
                },
            },
            BadRequest: {
                description: "❌ Requisição inválida - Dados de entrada incorretos",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ValidationError" },
                        examples: {
                            validationError: {
                                summary: "Erro de validação",
                                value: {
                                    success: false,
                                    error: {
                                        message: "Dados de entrada inválidos",
                                        code: "VALIDATION_ERROR",
                                        validationErrors: [
                                            {
                                                field: "username",
                                                message:
                                                    "Username deve ter entre 4 e 20 caracteres",
                                                value: "ab",
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            Unauthorized: {
                description: "🔒 Não autenticado - Token ausente ou inválido",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        examples: {
                            missingToken: {
                                summary: "Token ausente",
                                value: {
                                    success: false,
                                    error: {
                                        message: "Token de autenticação não fornecido",
                                        code: "AUTHENTICATION_REQUIRED",
                                    },
                                },
                            },
                            invalidToken: {
                                summary: "Token inválido",
                                value: {
                                    success: false,
                                    error: {
                                        message: "Token inválido ou expirado",
                                        code: "INVALID_TOKEN",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            Forbidden: {
                description: "⛔ Acesso negado - Permissões insuficientes",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        examples: {
                            insufficientPermissions: {
                                summary: "Permissões insuficientes",
                                value: {
                                    success: false,
                                    error: {
                                        message: "Você não tem permissão para realizar esta ação",
                                        code: "INSUFFICIENT_PERMISSIONS",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            NotFound: {
                description: "🔍 Recurso não encontrado",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        examples: {
                            notFound: {
                                summary: "Recurso não encontrado",
                                value: {
                                    success: false,
                                    error: {
                                        message: "Recurso solicitado não foi encontrado",
                                        code: "RESOURCE_NOT_FOUND",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            Conflict: {
                description: "⚠️ Conflito - Recurso já existe",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        examples: {
                            duplicate: {
                                summary: "Recurso duplicado",
                                value: {
                                    success: false,
                                    error: {
                                        message: "Username já está em uso",
                                        code: "DUPLICATE_RESOURCE",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            UnprocessableEntity: {
                description: "❌ Entidade não processável - Validação de negócio falhou",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ValidationError" },
                    },
                },
            },
            TooManyRequests: {
                description: "🚦 Muitas requisições - Rate limit excedido",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        examples: {
                            rateLimit: {
                                summary: "Rate limit excedido",
                                value: {
                                    success: false,
                                    error: {
                                        message:
                                            "Muitas requisições. Tente novamente em alguns minutos.",
                                        code: "RATE_LIMIT_EXCEEDED",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            InternalServerError: {
                description: "💥 Erro interno do servidor",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        examples: {
                            internalError: {
                                summary: "Erro interno",
                                value: {
                                    success: false,
                                    error: {
                                        message:
                                            "Ocorreu um erro interno. Tente novamente mais tarde.",
                                        code: "INTERNAL_ERROR",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        parameters: {
            PageParam: {
                name: "page",
                in: "query",
                description: "Número da página para paginação",
                required: false,
                schema: { type: "integer", minimum: 1, default: 1 },
                example: 1,
            },
            LimitParam: {
                name: "limit",
                in: "query",
                description: "Quantidade de itens por página",
                required: false,
                schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
                example: 20,
            },
            SortByParam: {
                name: "sortBy",
                in: "query",
                description: "Campo para ordenação dos resultados",
                required: false,
                schema: {
                    type: "string",
                    enum: ["createdAt", "updatedAt", "likes", "views"],
                    default: "createdAt",
                },
                example: "createdAt",
            },
            SortOrderParam: {
                name: "sortOrder",
                in: "query",
                description: "Direção da ordenação",
                required: false,
                schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
                example: "desc",
            },
            IdParam: {
                name: "id",
                in: "path",
                description: "ID único do recurso",
                required: true,
                schema: { type: "string" },
                example: "1234567890",
            },
            UserIdParam: {
                name: "userId",
                in: "path",
                description: "ID único do usuário",
                required: true,
                schema: { type: "string" },
                example: "1234567890",
            },
            MomentIdParam: {
                name: "momentId",
                in: "path",
                description: "ID único do momento",
                required: true,
                schema: { type: "string" },
                example: "1234567890",
            },
        },
        examples: {},
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
}

/**
 * Configuração do Swagger Options
 */
export const swaggerOptions = {
    openapi: {
        openapi: "3.0.3",
        info: {
            title: swaggerConfig.title,
            description: swaggerConfig.description,
            version: swaggerConfig.version,
            contact: swaggerConfig.contact,
            license: swaggerConfig.license,
            termsOfService: "https://circle.com/terms",
        },
        servers: swaggerConfig.servers,
        tags: swaggerConfig.tags,
        externalDocs: swaggerConfig.externalDocs,
        components: {
            securitySchemes: swaggerConfig.components.securitySchemes,
            schemas: swaggerConfig.components.schemas,
            responses: swaggerConfig.components.responses,
            parameters: swaggerConfig.components.parameters,
            examples: swaggerConfig.components.examples,
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    hideUntagged: true, // Esconder rotas sem tags
    exposeRoute: false,
    stripBasePath: true,
    transform: ({ schema, url }: any) => {
        // Ordenar tags conforme TAG_ORDER
        if (schema.tags) {
            schema.tags.sort((a: any, b: any) => {
                const aIndex = TAG_ORDER.indexOf(a.name)
                const bIndex = TAG_ORDER.indexOf(b.name)
                if (aIndex === -1) return 1
                if (bIndex === -1) return -1
                return aIndex - bIndex
            })
        }
        return { schema, url }
    },
}

/**
 * Configuração do Swagger UI - Interface profissional e customizada
 */
export const swaggerUIConfig = {
    routePrefix: "/docs",
    theme: {
        customCss: SWAGGER_CUSTOM_CSS,
    },
    uiConfig: {
        // ===== EXIBIÇÃO =====
        docExpansion: "list", // 'list' | 'full' | 'none'
        deepLinking: true,
        displayOperationId: false,
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        defaultModelRendering: "model", // 'model' | 'example'

        // ===== FUNCIONALIDADES =====
        displayRequestDuration: true,
        filter: true, // Habilita busca
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,

        // ===== CONFIGURAÇÕES DE REQUEST =====
        persistAuthorization: true, // Persiste autorização entre reloads
        syntaxHighlight: {
            activate: true,
            theme: "monokai", // 'agate' | 'arta' | 'monokai' | 'nord' | 'obsidian' | 'tomorrow-night'
        },

        // ===== ORDEM E ORGANIZAÇÃO =====
        tagsSorter: (a: string, b: string) => {
            const aIndex = TAG_ORDER.indexOf(a)
            const bIndex = TAG_ORDER.indexOf(b)
            if (aIndex === -1) return 1
            if (bIndex === -1) return -1
            return aIndex - bIndex
        },
        operationsSorter: "alpha", // 'alpha' | 'method'

        // ===== VALIDAÇÃO =====
        validatorUrl: null, // Desabilita validação externa

        // ===== CUSTOMIZAÇÃO VISUAL =====
        layout: "BaseLayout",
    },
    uiHooks: {
        onComplete: () => {
            console.log("✅ Swagger UI carregado com sucesso")
        },
    },
    staticCSP: {
        "default-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:", "http:"],
        "font-src": ["'self'", "data:"],
    },
    transformStaticCSP: (header: string) => header,
    transformSpecification: (swaggerObject: any, request: any, reply: any) => {
        // Adicionar informações dinâmicas baseadas no ambiente
        const host = request.headers.host || "localhost:3000"
        const protocol = request.headers["x-forwarded-proto"] || "http"

        // Atualizar servidor baseado no host atual
        swaggerObject.servers = [
            {
                url: `${protocol}://${host}`,
                description: `🌐 Servidor Atual (${host})`,
            },
            ...swaggerConfig.servers,
        ]

        return swaggerObject
    },
    transformSpecificationClone: true,
    logo: {
        type: "image/png",
        content: Buffer.from(""), // Adicionar logo se disponível
        href: "https://circle.com",
        target: "_blank",
        altText: "Circle System",
    },
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
