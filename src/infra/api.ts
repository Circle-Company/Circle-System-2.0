import { HttpRequest, HttpResponse } from "@/infra/http/http.type"
import { extractErrorInfo, generateId, isBaseError, logger } from "@/shared"
import { existsSync, mkdirSync } from "fs"

import { ENABLE_LOGGING } from "@/infra/database/environment"
import { HttpFactory } from "@/infra/http/http.factory"
import { join } from "path"

// Configuração da aplicação
const ENV_CONFIG = {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || "0.0.0.0",
    environment: process.env.NODE_ENV || "development",
}

// Configuração HTTP genérica
const httpConfig = {
    port: ENV_CONFIG.port,
    host: ENV_CONFIG.host,
    environment: ENV_CONFIG.environment,
    logging: false, // Desabilitar logging do Fastify para usar apenas nosso logger
    requestIdHeader: "x-request-id",
    requestIdLogLabel: "reqId",
    genReqId: () => `req-${Date.now()}-${generateId().slice(0, 9)}`,
}

// Instância da API usando abstração HTTP
export const api = HttpFactory.createForEnvironment(ENV_CONFIG.environment, httpConfig)

// Configurar pasta de uploads
const uploadsDir = join(process.cwd(), "uploads")
const videosDir = join(uploadsDir, "videos")
const thumbnailsDir = join(uploadsDir, "thumbnails")

// Criar diretórios se não existirem
if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
    logger.info(`📁 Diretório de uploads criado: ${uploadsDir}`)
}

if (!existsSync(videosDir)) {
    mkdirSync(videosDir, { recursive: true })
    logger.info(`📁 Diretório de vídeos criado: ${videosDir}`)
}

if (!existsSync(thumbnailsDir)) {
    mkdirSync(thumbnailsDir, { recursive: true })
    logger.info(`📁 Diretório de thumbnails criado: ${thumbnailsDir}`)
}

// Rate limiting - armazenamento de contadores
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Hook único onRequest para CORS, rate limiting e logging
api.addHook("onRequest", async (request: HttpRequest, response: HttpResponse) => {
    // 1. CORS
    const origin = request.headers.origin
    if (origin) {
        // Em desenvolvimento, permitir qualquer origin
        if (ENV_CONFIG.environment === "development" || ENV_CONFIG.environment === "test") {
            response.header("Access-Control-Allow-Origin", origin)
            response.header("Access-Control-Allow-Credentials", "true")
            response.header(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            )
            response.header(
                "Access-Control-Allow-Headers",
                "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID",
            )
        } else {
            // Em produção, definir origins permitidos
            const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || []

            if (allowedOrigins.includes(origin)) {
                response.header("Access-Control-Allow-Origin", origin)
                response.header("Access-Control-Allow-Credentials", "true")
                response.header(
                    "Access-Control-Allow-Methods",
                    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                )
                response.header(
                    "Access-Control-Allow-Headers",
                    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID",
                )
            } else {
                response.status(403).send({
                    error: "Not allowed by CORS",
                    message: "Origin not allowed",
                })
                return
            }
        }
    }

    // 2. Rate Limiting
    const clientId = request.headers["x-forwarded-for"] || request.ip || "unknown"
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minuto

    const clientData = requestCounts.get(clientId)

    if (!clientData || now > clientData.resetTime) {
        requestCounts.set(clientId, { count: 1, resetTime: now + windowMs })
    } else {
        clientData.count++

        if (clientData.count > 100) {
            response.status(429).send({
                error: "Too Many Requests",
                message: "Rate limit exceeded, retry later",
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
            })
            return
        }
    }

    // 3. Logging
    if (ENABLE_LOGGING) {
        logger.info("Incoming request", {
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            requestId: request.id,
        })
    }

    // 4. Validação básica de segurança
    const userAgent = request.headers["user-agent"]
    if (userAgent && userAgent.includes("sqlmap")) {
        logger.warn("Potential SQL injection attempt detected", {
            ip: request.ip,
            userAgent,
            url: request.url,
        })
        response.status(403).send({
            error: "Forbidden",
            message: "Access denied",
        })
        return
    }
})

// Hook para adicionar headers de segurança antes de enviar a resposta
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
api.setErrorHandler(async (error: any, request: HttpRequest, response: HttpResponse) => {
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
        response.status(error.toHttpResponse().statusCode).send({
            success: false,
            error: errorInfo,
        })
        return
    }

    // Erro de validação
    if (error.validation) {
        response.status(400).send({
            success: false,
            error: {
                message: "Validation error",
                details: error.validation,
                code: "VALIDATION_ERROR",
            },
        })
        return
    }

    // Erro genérico
    response.status(500).send({
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
    response.send({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: ENV_CONFIG.environment,
        version: process.env.npm_package_version || "1.0.0",
    })
})

// Endpoint para informações da API
api.get("/info", async (request: HttpRequest, response: HttpResponse) => {
    response.send({
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
            storage: "/storage",
        },
    })
})

// Configurar arquivos estáticos para uploads usando a instância do Fastify
const fastifyInstance = api.getFastifyInstance?.()

if (fastifyInstance) {
    // Configurar arquivos estáticos para uploads - um único registro com prefix /storage/
    fastifyInstance.register(require("@fastify/static"), {
        root: uploadsDir,
        prefix: "/storage/",
        decorateReply: false,
        schemaHide: true,
        setHeaders: (res: any, path: string) => {
            // Configurar headers apropriados para diferentes tipos de arquivo
            if (path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov")) {
                res.setHeader("Content-Type", "video/mp4")
                res.setHeader("Cache-Control", "public, max-age=86400") // 24 horas
                res.setHeader("Accept-Ranges", "bytes") // Suporte a range requests para streaming
            } else if (path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".png")) {
                res.setHeader("Content-Type", "image/jpeg")
                res.setHeader("Cache-Control", "public, max-age=86400") // 24 horas
            }
        },
    })
}

// Endpoint para listar arquivos disponíveis (apenas para desenvolvimento)
if (ENV_CONFIG.environment === "development") {
    api.get("/storage/list", async (request: HttpRequest, response: HttpResponse) => {
        const { readdirSync, statSync } = require("fs")

        try {
            const listFiles = (dir: string, basePath: string = ""): any[] => {
                const files = readdirSync(dir)
                return files.map((file) => {
                    const fullPath = join(dir, file)
                    const stat = statSync(fullPath)
                    const relativePath = join(basePath, file).replace(/\\/g, "/")

                    if (stat.isDirectory()) {
                        return {
                            name: file,
                            type: "directory",
                            path: relativePath,
                            children: listFiles(fullPath, relativePath),
                        }
                    } else {
                        return {
                            name: file,
                            type: "file",
                            path: relativePath,
                            size: stat.size,
                            url: `/storage/${relativePath}`,
                            modified: stat.mtime,
                        }
                    }
                })
            }

            const files = listFiles(uploadsDir)
            response.send({
                success: true,
                baseUrl: `http://localhost:${ENV_CONFIG.port}/storage/`,
                files: files,
            })
        } catch (error) {
            response.status(500).send({
                success: false,
                error: "Failed to list files",
                message: error instanceof Error ? error.message : String(error),
            })
        }
    })
}
