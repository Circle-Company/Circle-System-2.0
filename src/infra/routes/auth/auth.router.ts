/**
 * Auth Router - Roteador de autenticação refatorado
 *
 * @author Circle System Team
 * @version 2.0.0
 */

import { ErrorCode, SystemError } from "@/shared/errors"

import { AuthController } from "@/infra/controllers/auth.controller"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { AuthFactory } from "@/infra/factories/auth.factory"
import { HttpAdapter } from "../../http/http.type"

export class AuthRouter {
    authController: AuthController
    constructor(private api: HttpAdapter, private databaseAdapter: DatabaseAdapter) {
        this.authController = AuthFactory.getAuthController()
    }
    /**
     * Registra todas as rotas de autenticação
     */
    register(): void {
        this.registerSignIn()
        this.registerSignUp()
        this.registerLogout()
        this.registerRefreshToken()
    }

    /**
     * POST /signin - Login
     */
    private registerSignIn(): void {
        this.api.post("/signin", async (request, reply) => {
            try {
                console.log("Router signin - chamando authController.signIn")
                // Validar se o body é um objeto
                if (!request.body || typeof request.body !== "object") {
                    return reply.status(400).send({
                        success: false,
                        error: "Body deve ser um objeto JSON válido",
                    })
                }

                const body = request.body as any

                // Validar campos obrigatórios
                if (!body.username || typeof body.username !== "string") {
                    return reply.status(400).send({
                        success: false,
                        error: "Username é obrigatório e deve ser uma string",
                    })
                }

                if (!body.password || typeof body.password !== "string") {
                    return reply.status(400).send({
                        success: false,
                        error: "Password é obrigatório e deve ser uma string",
                    })
                }

                // Extrair metadata dos headers (tenta com e sem prefixo x-)
                const getHeader = (name: string): string | undefined => {
                    const nameLower = name.toLowerCase()
                    // Tenta sem prefixo primeiro, depois com prefixo x-
                    const value = request.headers[nameLower] || request.headers[`x-${nameLower}`]
                    return Array.isArray(value) ? value[0] : value
                }

                const metadata = {
                    language: getHeader("language") || "en",
                    termsAccepted:
                        getHeader("terms-accepted") === "true" ||
                        getHeader("terms-accepted") === "1",
                    device: getHeader("device") || "WEB",
                    ipAddress: getHeader("forwarded-for") || "127.0.0.1",
                    userAgent: getHeader("user-agent") || "unknown",
                    machineId: getHeader("machine-id") || getHeader("machineid") || "unknown",
                    timezone: getHeader("timezone") || "UTC",
                    latitude: getHeader("latitude") ? Number(getHeader("latitude")) : undefined,
                    longitude: getHeader("longitude") ? Number(getHeader("longitude")) : undefined,
                }

                const result = await this.authController.signIn({
                    username: body.username,
                    password: body.password,
                    metadata,
                } as any)

                // Criar novo objeto com error como string
                const response = result.success
                    ? result
                    : {
                          success: false,
                          error:
                              typeof result.error === "string" ? result.error : "An error occurred",
                      }

                const statusCode = result.success ? 200 : 400
                return reply.status(statusCode).send(response)
            } catch (error: any) {
                // Tratar erros de validação do Fastify
                if (error.validation) {
                    const validationErrors = error.validation.map((v: any) => v.message).join(", ")
                    return reply.status(400).send({
                        success: false,
                        error: `Validation error: ${validationErrors}`,
                    })
                }

                const errorMessage = error instanceof Error ? error.message : "Unknown error"

                return reply.status(400).send({
                    success: false,
                    error: errorMessage,
                })
            }
        })
    }

    /**
     * POST /signup - Sign up
     */
    private registerSignUp(): void {
        const authController = AuthFactory.getAuthController()
        this.api.post("/signup", async (request, reply) => {
            try {
                // Validar se o body é um objeto
                if (!request.body || typeof request.body !== "object") {
                    return reply.status(400).send({
                        success: false,
                        error: "Body deve ser um objeto JSON válido",
                    })
                }

                const body = request.body as any

                // Validar campos obrigatórios
                if (!body.username || typeof body.username !== "string") {
                    return reply.status(400).send({
                        success: false,
                        error: "Username is required and must be a string",
                    })
                }

                if (!body.password || typeof body.password !== "string") {
                    return reply.status(400).send({
                        success: false,
                        error: "Password is required and must be a string",
                    })
                }

                // Extrair metadata dos headers (tenta com e sem prefixo x-)
                const getHeader = (name: string): string | undefined => {
                    const nameLower = name.toLowerCase()
                    // Tenta sem prefixo primeiro, depois com prefixo x-
                    const value = request.headers[nameLower] || request.headers[`x-${nameLower}`]
                    return Array.isArray(value) ? value[0] : value
                }

                // Extrair termsAccepted do body ou header
                const termsAcceptedHeader = getHeader("terms-accepted")
                const termsAccepted =
                    body.metadata?.termsAccepted === true ||
                    termsAcceptedHeader === "true" ||
                    termsAcceptedHeader === "1" ||
                    termsAcceptedHeader === "True"

                // Extrair device do body ou header
                const deviceHeader = getHeader("device")
                const device = body.metadata?.device || deviceHeader || "WEB"

                const metadata = {
                    device: device,
                    termsAccepted: termsAccepted,
                    ipAddress: getHeader("forwarded-for") || "127.0.0.1",
                    userAgent: getHeader("user-agent") || "unknown",
                    machineId: getHeader("machine-id") || getHeader("machineid") || "unknown",
                    timezone: getHeader("timezone") || body.metadata?.timezone || "UTC",
                    language: getHeader("language") || body.metadata?.language || "en",
                    latitude: body.latitude ? Number(body.latitude) : undefined,
                    longitude: body.longitude ? Number(body.longitude) : undefined,
                }

                const result = await authController.signUp({
                    username: body.username,
                    password: body.password,
                    metadata,
                } as any)

                const statusCode = result.success ? 200 : 400
                return reply.status(statusCode).send(result)
            } catch (error: any) {
                // Tratar erros de validação do Fastify
                if (error.validation) {
                    const validationErrors = error.validation.map((v: any) => v.message).join(", ")
                    return reply.status(400).send({
                        success: false,
                        error: `Validation error: ${validationErrors}`,
                    })
                }

                const errorMessage = error instanceof Error ? error.message : "Unknown error"

                return reply.status(400).send({
                    success: false,
                    error: errorMessage,
                })
            }
        })
    }

    /**
     * POST /logout - Logout
     */
    private registerLogout(): void {
        const authController = AuthFactory.getAuthController()
        this.api.post(
            "/logout",
            async () => {
                return await authController.logout()
            },
            {
                schema: {
                    tags: ["Authentication"],
                    summary: "Encerrar sessão (Logout)",
                    description: `
Encerra a sessão do usuário e invalida o token atual.

**Processo:**
1. Invalida token JWT atual
2. Remove sessão ativa
3. Registra log de logout

**Nota:** Após logout, o token não será mais aceito em requisições futuras.
                    `.trim(),
                    security: [{ bearerAuth: [] }],
                    response: {
                        200: {
                            description: "Logout realizado com sucesso",
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                message: {
                                    type: "string",
                                    example: "Logout realizado com sucesso",
                                },
                                timestamp: {
                                    type: "string",
                                    format: "date-time",
                                    example: "2025-10-08T10:30:00.000Z",
                                },
                            },
                        },
                        401: {
                            description: "Unauthorized",
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: false },
                                error: { type: "string" },
                                code: { type: "string" },
                            },
                        },
                    },
                },
            },
        )
    }

    /**
     * POST /refresh-token - Refresh token
     */
    private registerRefreshToken(): void {
        this.api.post(
            "/refresh-token",
            async () => {
                return await this.authController.refreshToken()
            },
            {
                schema: {
                    tags: ["Authentication"],
                    summary: "Renovar token de acesso",
                    description: `
Renova o token JWT de acesso antes que expire.

**Processo:**
1. Valida token atual (mesmo expirado)
2. Verifica identidade do usuário
3. Gera novo token JWT
4. Retorna novo token

**Uso:**
- Chame este endpoint antes que o token expire (24h)
- Evita necessidade de novo login
- Mantém sessão ativa do usuário

**Nota:** Refresh tokens são válidos por 30 dias.
                    `.trim(),
                    security: [{ bearerAuth: [] }],
                    response: {
                        200: {
                            description: "Token renovado com sucesso",
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                token: {
                                    type: "string",
                                    description: "Novo token JWT de acesso",
                                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                },
                                expiresIn: {
                                    type: "integer",
                                    description: "Tempo de expiração em segundos",
                                    example: 86400,
                                },
                                timestamp: {
                                    type: "string",
                                    format: "date-time",
                                    example: "2025-10-08T10:30:00.000Z",
                                },
                            },
                        },
                        401: {
                            description: "Token inválido ou refresh token expirado",
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: false },
                                error: {
                                    type: "string",
                                    example: "Refresh token expirado. Faça login novamente.",
                                },
                            },
                        },
                    },
                },
            },
        )
    }
}
/**
 * Função de compatibilidade para inicialização das rotas
 */
export async function Router(
    httpAdapter: HttpAdapter,
    databaseAdapter: DatabaseAdapter,
): Promise<void> {
    try {
        new AuthRouter(httpAdapter, databaseAdapter).register()
    } catch (error) {
        throw new SystemError({
            message: "Failed to initialize AuthRouter",
            code: ErrorCode.INTERNAL_ERROR,
            action: "Check the database configuration and try again",
            context: {
                additionalData: { originalError: error },
            },
        })
    }
}
