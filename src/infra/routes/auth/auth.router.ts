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
        this.api.post(
            "/signin",
            async (request, reply) => {
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
                        const value =
                            request.headers[nameLower] || request.headers[`x-${nameLower}`]
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
                        longitude: getHeader("longitude")
                            ? Number(getHeader("longitude"))
                            : undefined,
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
                                  typeof result.error === "string"
                                      ? result.error
                                      : "An error occurred",
                          }

                    const statusCode = result.success ? 200 : 400
                    return reply.status(statusCode).send(response)
                } catch (error: any) {
                    console.error("❌ Signin router error:", error)

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
            },
            {
                schema: {
                    tags: ["Authentication"],
                    summary: "Autenticar usuário (Login)",
                    description: `
Autentica um usuário no sistema e retorna um token JWT para acesso às rotas protegidas.

**Processo:**
1. Valida credenciais do usuário
2. Verifica aceitação dos termos de uso
3. Gera token JWT de acesso
4. Registra log de autenticação
5. Retorna dados do usuário e token

**Metadata:**
- Suporta múltiplos dispositivos
- Registra localização (opcional)
- Rastreia IP e User-Agent
                    `.trim(),
                    body: {
                        type: "object",
                        required: ["username", "password"],
                        properties: {
                            username: {
                                type: "string",
                                minLength: 4,
                                maxLength: 20,
                                description: "Nome de usuário",
                                example: "johndoe",
                            },
                            password: {
                                type: "string",
                                minLength: 4,
                                maxLength: 128,
                                description: "Senha do usuário",
                                example: "senha123",
                            },
                            latitude: {
                                type: "number",
                                minimum: -90,
                                maximum: 90,
                                description: "Latitude da localização (opcional)",
                                example: -23.5505,
                            },
                            longitude: {
                                type: "number",
                                minimum: -180,
                                maximum: 180,
                                description: "Longitude da localização (opcional)",
                                example: -46.6333,
                            },
                            termsAccepted: {
                                type: "boolean",
                                description: "Confirmação de aceitação dos termos",
                                example: true,
                            },
                        },
                    },
                    headers: {
                        type: "object",
                        properties: {
                            "x-device": {
                                type: "string",
                                enum: ["mobile", "tablet", "desktop", "web"],
                                description: "Tipo de dispositivo",
                                example: "mobile",
                            },
                            "x-machine-id": {
                                type: "string",
                                description: "ID único do dispositivo",
                                example: "abc123def456",
                            },
                            "x-timezone": {
                                type: "string",
                                description: "Timezone do usuário",
                                example: "America/Sao_Paulo",
                            },
                        },
                    },
                    response: {
                        200: {
                            description: "Login realizado com sucesso",
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                session: {
                                    type: "object",
                                    properties: {
                                        user: { type: "object" },
                                        metrics: { type: "object" },
                                        status: { type: "object" },
                                        terms: { type: "object" },
                                        preferences: { type: "object" },
                                        token: { type: "string" },
                                        expiresIn: { type: "number" },
                                    },
                                },
                                securityInfo: { type: "object" },
                            },
                        },
                        400: {
                            description: "Erro na requisição",
                            type: "object",
                            additionalProperties: true,
                            properties: {
                                success: { type: "boolean", example: false },
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        )
    }

    /**
     * POST /signup - Sign up
     */
    private registerSignUp(): void {
        const authController = AuthFactory.getAuthController()
        this.api.post(
            "/signup",
            async (request, reply) => {
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
                        const value =
                            request.headers[nameLower] || request.headers[`x-${nameLower}`]
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
                    console.error("❌ Signup router error:", error)

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
            },
            {
                schema: {
                    tags: ["Authentication"],
                    summary: "Criar nova conta (Registro)",
                    description: `
Registra um novo usuário no sistema.

**Processo:**
1. Valida dados de entrada
2. Verifica disponibilidade do username
3. Criptografa senha
4. Cria conta do usuário
5. Gera token JWT automático
6. Retorna dados do usuário criado

**Requisitos:**
- Username único (4-20 caracteres)
- Senha forte (mínimo 6 caracteres)
- Aceitação dos termos de uso
                    `.trim(),
                    body: {
                        type: "object",
                        required: ["username", "password"],
                        properties: {
                            username: {
                                type: "string",
                                minLength: 4,
                                maxLength: 20,
                                pattern: "^[a-zA-Z0-9_]+$",
                                description: "Nome de usuário único (letras, números e underscore)",
                                example: "newuser123",
                            },
                            password: {
                                type: "string",
                                minLength: 6,
                                maxLength: 128,
                                description: "Senha (mínimo 6 caracteres)",
                                example: "senhaSegura123",
                            },
                            latitude: {
                                type: "number",
                                minimum: -90,
                                maximum: 90,
                                description: "Latitude da localização (opcional)",
                                example: -23.5505,
                            },
                            longitude: {
                                type: "number",
                                minimum: -180,
                                maximum: 180,
                                description: "Longitude da localização (opcional)",
                                example: -46.6333,
                            },
                        },
                    },
                    headers: {
                        type: "object",
                        required: ["x-terms-accepted"],
                        properties: {
                            "x-terms-accepted": {
                                type: "string",
                                enum: ["true", "1", "True"],
                                description: "Aceitação dos termos de uso (obrigatório)",
                                example: "true",
                            },
                            "x-device": {
                                type: "string",
                                enum: ["mobile", "tablet", "desktop", "web"],
                                description: "Tipo de dispositivo",
                                example: "mobile",
                            },
                            "x-machine-id": {
                                type: "string",
                                description: "ID único do dispositivo",
                                example: "abc123def456",
                            },
                            "x-timezone": {
                                type: "string",
                                description: "Timezone do usuário",
                                example: "America/Sao_Paulo",
                            },
                        },
                    },
                },
            },
        )
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
