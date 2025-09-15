import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify"
import { extractErrorInfo, isBaseError } from "@/errors"

import { ENABLE_LOGGING } from "@/infra/database/environment"
import cors from "@fastify/cors"
import { logger } from "@/logger"
import rateLimit from "@fastify/rate-limit"

const ENV_CONFIG = {
    NODE_ENV: process.env.NODE_ENV || "development",
    BODY_LIMIT: process.env.BODY_LIMIT ? Number(process.env.BODY_LIMIT) : 1048576,
    MAX_PARAM_LENGTH: process.env.MAX_PARAM_LENGTH ? Number(process.env.MAX_PARAM_LENGTH) : 200,
    CONNECTION_TIMEOUT: process.env.CONNECTION_TIMEOUT
        ? Number(process.env.CONNECTION_TIMEOUT)
        : 30000,
    KEEP_ALIVE_TIMEOUT: process.env.KEEP_ALIVE_TIMEOUT
        ? Number(process.env.KEEP_ALIVE_TIMEOUT)
        : 5000,
    CORS_ORIGIN: process.env.CORS_ORIGIN?.split(",") || [],
    RATE_LIMIT_MAX: process.env.RATE_LIMIT ? Number(process.env.RATE_LIMIT) : 1000,
    RATE_LIMIT_TIME_WINDOW: process.env.RATE_LIMIT_TIME_WINDOW
        ? Number(process.env.RATE_LIMIT_TIME_WINDOW)
        : 60000,
    CACHE_MAX_AGE: 300,
    TRUST_PROXY: process.env.NODE_ENV === "production",
} as const

// Configuração profissional do Fastify usando apenas propriedades válidas do FastifyServerOptions
const fastifyConfig: FastifyServerOptions = {
    // Configuração de logging
    logger: ENABLE_LOGGING
        ? {
              level: ENV_CONFIG.NODE_ENV === "development" ? "debug" : "info",
          }
        : false,

    bodyLimit: ENV_CONFIG.BODY_LIMIT,
    maxParamLength: ENV_CONFIG.MAX_PARAM_LENGTH,
    connectionTimeout: ENV_CONFIG.CONNECTION_TIMEOUT,
    keepAliveTimeout: ENV_CONFIG.KEEP_ALIVE_TIMEOUT,
    trustProxy: ENV_CONFIG.TRUST_PROXY,

    schemaErrorFormatter: (err) => {
        return new Error(`Validation failed: ${err.map((e) => e.message).join(", ")}`)
    },

    // Configurações de request/response
    requestIdHeader: "x-request-id",
    requestIdLogLabel: "reqId",
    serializerOpts: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            headers: req.headers,
            remoteAddress: req.ip,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
}

// Instância da API
export const api: FastifyInstance = Fastify(fastifyConfig)

// Registrar plugins de funcionalidades extras
async function registerPlugins() {
    try {
        // Plugin CORS - sempre permitir em desenvolvimento e teste
        await api.register(cors, {
            origin: (origin, callback) => {
                // Em desenvolvimento e teste, permitir qualquer origem
                if (ENV_CONFIG.NODE_ENV !== "production") {
                    return callback(null, true)
                }

                // Em produção, verificar origens permitidas
                if (origin && ENV_CONFIG.CORS_ORIGIN.includes(origin)) {
                    return callback(null, true)
                }

                return callback(new Error("Not allowed by CORS"), false)
            },
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        })

        // Plugin Rate Limit
        await api.register(rateLimit, {
            max: ENV_CONFIG.RATE_LIMIT_MAX,
            timeWindow: ENV_CONFIG.RATE_LIMIT_TIME_WINDOW,
            errorResponseBuilder: (request, context) => ({
                statusCode: 429,
                error: "Too Many Requests",
                message: `Rate limit exceeded, retry in ${Math.round(
                    Number(context.after),
                )} seconds`,
            }),
        })

        logger.info("Plugins CORS e Rate Limit registrados com sucesso")
    } catch (error) {
        logger.error("Erro ao registrar plugins", error)
        throw error
    }
}

// Registrar plugins automaticamente
registerPlugins().catch((error) => {
    logger.error("Falha ao registrar plugins", error)
    process.exit(1)
})

// Hook para adicionar headers de segurança
api.addHook("onSend", async (request, reply, payload) => {
    // Headers de segurança
    reply.header("X-Content-Type-Options", "nosniff")
    reply.header("X-Frame-Options", "DENY")
    reply.header("X-XSS-Protection", "1; mode=block")
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin")

    // Header de cache para APIs
    if (request.method === "GET") {
        reply.header("Cache-Control", `public, max-age=${ENV_CONFIG.CACHE_MAX_AGE}`)
    } else {
        reply.header("Cache-Control", "no-cache, no-store, must-revalidate")
    }

    return payload
})

// Hook para logging de requests e validações de segurança
api.addHook("onRequest", async (request, reply) => {
    logger.debug(`Request iniciado: ${request.method} ${request.url}`, {
        ip: request.ip,
        userAgent: request.headers["user-agent"],
        requestId: request.id,
    })

    const userAgent = request.headers["user-agent"]
    if (!userAgent || userAgent.length < 10) {
        logger.warn("Request sem User-Agent ou muito curto", {
            ip: request.ip,
            url: request.url,
            userAgent,
        })
    }

    // Verificar tamanho do body se for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
        const contentLength = request.headers["content-length"]
        if (contentLength && parseInt(contentLength) > ENV_CONFIG.BODY_LIMIT) {
            reply.status(413).send({
                statusCode: 413,
                error: "Payload Too Large",
                message: "Request body exceeds maximum allowed size",
                timestamp: new Date().toISOString(),
                path: request.url,
            })
            return
        }
    }
})

// Hook para logging de responses
api.addHook("onResponse", async (request, reply) => {
    logger.info(`Request finalizado: ${request.method} ${request.url}`, {
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
        requestId: request.id,
    })
})

// Error handler personalizado e profissional
api.setErrorHandler((error: any, request, reply) => {
    const errorInfo = extractErrorInfo(error)

    let statusCode = 500
    let responseBody: any

    if (isBaseError(error)) {
        // Usar o método toHttpResponse para erros customizados
        responseBody = error.toHttpResponse()
        statusCode = responseBody.statusCode

        // Log estruturado baseado na severidade
        const logLevel = error.metadata.logLevel
        const logData = {
            error: errorInfo,
            request: {
                method: request.method,
                url: request.url,
                ip: request.ip,
                userAgent: request.headers["user-agent"],
                requestId: request.id,
            },
            context: error.context,
            metadata: error.metadata,
        }

        // Log baseado na severidade do erro
        switch (logLevel) {
            case "debug":
                logger.debug(`[${request.method}] ${request.url} - ${statusCode}`, logData)
                break
            case "info":
                logger.info(`[${request.method}] ${request.url} - ${statusCode}`, logData)
                break
            case "warn":
                logger.warn(`[${request.method}] ${request.url} - ${statusCode}`, logData)
                break
            case "error":
            default:
                logger.error(`[${request.method}] ${request.url} - ${statusCode}`, logData)
                break
        }

        // Notificar administradores se necessário
        if (error.metadata.notifyAdmin) {
            logger.error("ADMIN NOTIFICATION REQUIRED", {
                error: errorInfo,
                severity: error.metadata.severity,
                request: logData.request,
            })
        }
    } else {
        // Tratamento para erros não customizados
        statusCode = error.statusCode || 500

        // Log de erro padrão
        logger.error(`[${request.method}] ${request.url} - ${statusCode}`, {
            error: errorInfo,
            stack: error.stack,
            request: {
                method: request.method,
                url: request.url,
                ip: request.ip,
                userAgent: request.headers["user-agent"],
                requestId: request.id,
            },
        })

        // Resposta padrão para erros não customizados
        responseBody = {
            statusCode,
            error: error.name || "Internal Server Error",
            message: ENV_CONFIG.NODE_ENV === "production" ? "Something went wrong" : error.message,
            timestamp: new Date().toISOString(),
            path: request.url,
        }
    }

    // Enviar resposta
    reply.status(statusCode).send(responseBody)
})

// Health check endpoint
api.get("/health", async () => {
    const memoryUsage = process.memoryUsage()

    return {
        serviceStatus: "healthy",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        deploymentEnvironment: ENV_CONFIG.NODE_ENV,
        applicationVersion: process.env.npm_package_version,
        memoryUsage: {
            heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
        systemMetrics: {
            cpuLoadAverage: process.platform !== "win32" ? require("os").loadavg()[0] : null,
        },
        runtimeInfo: {
            nodeVersion: process.version,
            operatingSystem: process.platform,
        },
    }
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`)
    try {
        await api.close()
        logger.info("Fastify server closed successfully")
        process.exit(0)
    } catch (error) {
        logger.error("Error during shutdown", error)
        process.exit(1)
    }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))
