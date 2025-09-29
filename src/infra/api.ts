import { extractErrorInfo, isBaseError } from "@/shared/errors"
import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify"
import { HttpRequest, HttpResponse } from "./http/http.type"

import { ENABLE_LOGGING } from "@/infra/database/environment"
import { logger } from "@/shared/logger"
import { HttpFactory } from "./http/http.factory"

// Configuração da aplicação
const ENV_CONFIG = {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || "0.0.0.0",
    environment: process.env.NODE_ENV || "development",
}

// Configuração do Fastify (apenas para produção)
const fastifyConfig: FastifyServerOptions = {
    logger: ENABLE_LOGGING
        ? {
              level: "info",
          }
        : false,
    disableRequestLogging: !ENABLE_LOGGING,
    requestIdHeader: "x-request-id",
    requestIdLogLabel: "reqId",
    genReqId: () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    schemaErrorFormatter: (errors, dataVar) => {
        return new Error(
            `Validation failed for ${dataVar}: ${errors.map((e) => e.message).join(", ")}`,
        )
    },
    ajv: {
        customOptions: {
            strict: false,
            removeAdditional: false,
            useDefaults: true,
            coerceTypes: true,
        },
    },
}

// Instância do Fastify (apenas para produção)
const fastifyInstance: FastifyInstance =
    ENV_CONFIG.environment === "test" ? (null as any) : Fastify(fastifyConfig)

// Instância da API usando adapter HTTP genérico
export const api = HttpFactory.createForEnvironment(ENV_CONFIG.environment, fastifyInstance)

// Adicionar referência ao Fastify para compatibilidade com Swagger
if (fastifyInstance && api) {
    const apiWithSwagger = api as any
    apiWithSwagger.fastify = fastifyInstance
    apiWithSwagger.registerPlugin = (plugin: any, options: any) =>
        fastifyInstance.register(plugin, options)
    apiWithSwagger.log = fastifyInstance.log
}

// Configurar middleware de segurança e CORS
function configureSecurityMiddleware() {
    // Middleware de CORS
    api.addHook("onRequest", async (request: HttpRequest, response: HttpResponse) => {
        const origin = request.headers.origin

        // Permitir requests sem origin (mobile apps, Postman, etc.)
        if (!origin) return

        // Em desenvolvimento, permitir qualquer origin
        if (ENV_CONFIG.environment === "development" || ENV_CONFIG.environment === "test") {
            response.header("Access-Control-Allow-Origin", origin)
            response.header("Access-Control-Allow-Credentials", "true")
            return
        }

        // Em produção, definir origins permitidos
        const allowedOrigins = ["https://yourdomain.com", "https://www.yourdomain.com"]

        if (allowedOrigins.includes(origin)) {
            response.header("Access-Control-Allow-Origin", origin)
            response.header("Access-Control-Allow-Credentials", "true")
        } else {
            response.status(403).send({
                error: "Not allowed by CORS",
                message: "Origin not allowed",
            })
            return
        }

        // Headers CORS
        response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        response.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID",
        )
    })

    // Middleware de Rate Limiting (simplificado)
    const requestCounts = new Map<string, { count: number; resetTime: number }>()

    api.addHook("onRequest", async (request: HttpRequest, response: HttpResponse) => {
        const clientId = request.headers["x-forwarded-for"] || request.ip || "unknown"
        const now = Date.now()
        const windowMs = 60 * 1000 // 1 minuto

        const clientData = requestCounts.get(clientId)

        if (!clientData || now > clientData.resetTime) {
            requestCounts.set(clientId, { count: 1, resetTime: now + windowMs })
        } else {
            clientData.count++

            if (clientData.count > 100) {
                // máximo 100 requests por minuto
                response.status(429).send({
                    error: "Too Many Requests",
                    message: "Rate limit exceeded, retry later",
                    retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
                })
                return
            }
        }
    })

    logger.info("Middleware de segurança configurado com sucesso")
}

// Hook para adicionar headers de segurança
api.addHook("onSend", async (request: HttpRequest, response: HttpResponse, payload: any) => {
    // Headers de segurança
    response.header("X-Content-Type-Options", "nosniff")
    response.header("X-Frame-Options", "DENY")
    response.header("X-XSS-Protection", "1; mode=block")
    response.header("Referrer-Policy", "strict-origin-when-cross-origin")
    response.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

    // CSP básico
    response.header(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';",
    )

    // Headers de cache baseados no método HTTP
    if (request.method === "GET") {
        response.header("Cache-Control", "public, max-age=300")
    } else {
        response.header("Cache-Control", "no-cache, no-store, must-revalidate")
    }

    return payload
})

// Hook para logging de requests e validações de segurança
api.addHook("onRequest", async (request: HttpRequest, response: HttpResponse) => {
    // Log da requisição
    if (ENABLE_LOGGING) {
        logger.info("Incoming request", {
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            requestId: request.id,
        })
    }

    // Validação básica de segurança
    const userAgent = request.headers["user-agent"]
    if (userAgent && userAgent.includes("sqlmap")) {
        logger.warn("Potential SQL injection attempt detected", {
            ip: request.ip,
            userAgent,
            url: request.url,
        })
        return response.status(403).send({
            error: "Forbidden",
            message: "Access denied",
        })
    }
})

// Hook para logging de responses
api.addHook("onResponse", async (request: HttpRequest, response: HttpResponse) => {
    if (ENABLE_LOGGING) {
        logger.info("Response sent", {
            method: request.method,
            url: request.url,
            statusCode: response.statusCode,
            responseTime: response.elapsedTime,
            requestId: request.id,
        })
    }
})

// Error handler personalizado e profissional
api.setErrorHandler((error: any, request: HttpRequest, response: HttpResponse) => {
    // Log do erro
    logger.error("Request error", {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        requestId: request.id,
        ip: request.ip,
    })

    // Se for um erro customizado do sistema
    if (isBaseError(error)) {
        const errorInfo = extractErrorInfo(error)
        return response.status(error.toHttpResponse().statusCode).send({
            success: false,
            error: errorInfo,
        })
    }

    // Erro de validação
    if (error.validation) {
        return response.status(400).send({
            success: false,
            error: {
                message: "Validation error",
                details: error.validation,
                code: "VALIDATION_ERROR",
            },
        })
    }

    // Erro genérico
    return response.status(500).send({
        success: false,
        error: {
            message: "Internal server error",
            code: "INTERNAL_ERROR",
            timestamp: new Date().toISOString(),
        },
    })
})

// Health check endpoint
api.get("/health", async (request: HttpRequest, response: HttpResponse) => {
    return response.send({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: ENV_CONFIG.environment,
        version: process.env.npm_package_version || "1.0.0",
    })
})

// Endpoint para informações da API
api.get("/info", async (request: HttpRequest, response: HttpResponse) => {
    return response.send({
        name: "Circle System API",
        version: "1.0.0",
        description: "API robusta para sistema de vlog com arquitetura limpa",
        documentation: "/docs",
        health: "/health",
        environment: ENV_CONFIG.environment,
        endpoints: {
            health: "/health",
            docs: "/docs",
            info: "/info",
        },
    })
})

// Configurar middleware de segurança
configureSecurityMiddleware()

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`)
    try {
        await api.close()
        logger.info("HTTP server closed successfully")
        process.exit(0)
    } catch (error) {
        logger.error("Error during shutdown", error)
        process.exit(1)
    }
}

// Capturar sinais de shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// Capturar erros não tratados
process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception", error)
    process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection", { reason, promise })
    process.exit(1)
})
