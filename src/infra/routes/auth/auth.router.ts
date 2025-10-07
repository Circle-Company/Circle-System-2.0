/**
 * Auth Router - Roteador de autenticação refatorado
 *
 * @author Circle System Team
 * @version 2.0.0
 */

import { AuthFactory } from "@/infra/factories/auth.factory"
import { HttpAdapter } from "../../http/http.type"

export class AuthRouter {
    constructor(private api: HttpAdapter) {}
    /**
     * Registra todas as rotas de autenticação
     */
    register(): void {
        this.registerSignIn()
        this.registerSignUp()
        this.registerLogout()
        this.registerRefreshToken()
        this.registerCheckSession()
    }

    /**
     * POST /signin - Login
     */
    private registerSignIn(): void {
        const authController = AuthFactory.getAuthController()
        this.api.post(
            "/signin",
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
                        ipAddress: getHeader("forwarded-for") || "127.0.0.1",
                        userAgent: getHeader("user-agent") || "unknown",
                        machineId: getHeader("machine-id") || "unknown",
                        timezone: getHeader("timezone") || "UTC",
                        latitude: body.latitude ? Number(body.latitude) : undefined,
                        longitude: body.longitude ? Number(body.longitude) : undefined,
                    }

                    console.log(
                        "Router signin - chamando authController.signIn com:",
                        body.username,
                    )
                    const result = await authController.signIn({
                        username: body.username,
                        password: body.password,
                        metadata,
                    } as any)
                    console.log("Router signin - resultado:", result.success)
                    console.log("Router signin - error:", result.error)
                    console.log(
                        "Router signin - session completo:",
                        JSON.stringify(result.session, null, 2),
                    )

                    if (result.success) {
                        return reply.status(200).send(result)
                    } else {
                        return reply.status(400).send(result)
                    }
                } catch (error: any) {
                    console.error("Erro no signin:", error)
                    return reply.status(400).send({
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    })
                }
            },
            {
                schema: {
                    tags: ["Authentication"],
                    summary: "Fazer login",
                    description: "Autentica um usuário no sistema",
                    response: {
                        400: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
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
                        ipAddress: getHeader("forwarded-for") || "127.0.0.1",
                        userAgent: getHeader("user-agent") || "unknown",
                        machineId: getHeader("machine-id") || "unknown",
                        timezone: getHeader("timezone") || "UTC",
                        latitude: body.latitude ? Number(body.latitude) : undefined,
                        longitude: body.longitude ? Number(body.longitude) : undefined,
                    }

                    // Extrair termsAccepted APENAS do header (não aceita do body)
                    const termsAcceptedHeader = getHeader("terms-accepted")
                    console.log("termsAcceptedHeader:", termsAcceptedHeader)
                    const termsAccepted =
                        termsAcceptedHeader === "true" ||
                        termsAcceptedHeader === "1" ||
                        termsAcceptedHeader === "True"

                    console.log("Router signup - chamando authController.signUp")
                    const result = await authController.signUp({
                        username: body.username,
                        password: body.password,
                        termsAccepted,
                        metadata,
                    } as any)
                    console.log("Router signup - resultado:", result.success)
                    console.log("Router signup - session:", result.session ? "TEM" : "VAZIO")
                    console.log("Router signup - error:", result.error)
                    console.log(
                        "Router signup - session completo:",
                        JSON.stringify(result.session, null, 2),
                    )

                    if (result.success) {
                        console.log(
                            "Router signup - ENVIANDO RESULTADO:",
                            JSON.stringify(result, null, 2),
                        )
                        return reply.status(200).send(result)
                    } else {
                        return reply.status(400).send(result)
                    }
                } catch (error: any) {
                    console.error("Erro no signup:", error)
                    console.error("Stack trace:", error.stack)
                    return reply.status(400).send({
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    })
                }
            },
            {
                schema: {
                    tags: ["Authentication"],
                    summary: "Criar conta",
                    description: "Registra um novo usuário no sistema",
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
                    summary: "Fazer logout",
                    description: "Encerra a sessão do usuário",
                    response: {
                        200: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
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
        const authController = AuthFactory.getAuthController()
        this.api.post(
            "/refresh-token",
            async () => {
                return await authController.refreshToken()
            },
            {
                schema: {
                    tags: ["Authentication"],
                    summary: "Renovar token",
                    description: "Renova o token de acesso do usuário",
                    response: {
                        200: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                token: { type: "string" },
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        )
    }

    /**
     * GET /check-session - Verificar sessão
     */
    private registerCheckSession(): void {
        this.api.get(
            "/check-session",
            async (request, reply) => {
                try {
                    // Verificar se o token está presente nos headers
                    const token = request.headers.authorization

                    if (!token) {
                        return reply.status(401).send({
                            success: false,
                            valid: false,
                            error: "Token não fornecido",
                        })
                    }

                    // Aqui você pode implementar a lógica de verificação do token
                    // Por enquanto, retornamos uma resposta básica
                    return reply.status(200).send({
                        success: true,
                        valid: true,
                        message: "Sessão válida",
                    })
                } catch (error: any) {
                    return reply.status(401).send({
                        success: false,
                        valid: false,
                        error: error instanceof Error ? error.message : "Erro ao verificar sessão",
                    })
                }
            },
            {
                schema: {
                    tags: ["Authentication"],
                    summary: "Verificar sessão",
                    description: "Verifica se a sessão do usuário está válida",
                    response: {
                        200: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                valid: { type: "boolean" },
                                message: { type: "string" },
                            },
                        },
                        401: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                valid: { type: "boolean" },
                                error: { type: "string" },
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
export async function Router(api: HttpAdapter): Promise<void> {
    const routes = new AuthRouter(api)
    routes.register()
}
