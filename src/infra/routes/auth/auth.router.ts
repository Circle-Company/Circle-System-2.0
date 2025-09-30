/**
 * Auth Router - Roteador de autenticação refatorado
 *
 * @author Circle System Team
 * @version 2.0.0
 */

import { signInSchema, signUpSchema } from "../../swagger/schemas/auth.schemas"

import { AuthFactory } from "@/infra/factories/auth.factory"
import { HttpAdapter } from "../../http/http.type"

export class AuthRouter {
    constructor(private api: HttpAdapter) {}

    /**
     * Schemas de validação para as rotas
     */
    private get schemas() {
        return {
            signInSchema,
            signUpSchema,
        }
    }

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
            async (request) => {
                // Extrair metadata dos headers (tenta com e sem prefixo x-)
                const getHeader = (name: string): string | undefined => {
                    const nameLower = name.toLowerCase()
                    // Tenta sem prefixo primeiro, depois com prefixo x-
                    const value = request.headers[nameLower] || request.headers[`x-${nameLower}`]
                    return Array.isArray(value) ? value[0] : value
                }

                const metadata = {
                    ipAddress: getHeader("forwarded-for") || "127.0.0.1",
                    userAgent: getHeader("user-agent") || "unknown",
                    machineId: getHeader("machine-id") || "unknown",
                    timezone: getHeader("timezone") || "UTC",
                    latitude: (request.body as any)?.latitude,
                    longitude: (request.body as any)?.longitude,
                }

                return await authController.signIn({
                    username: (request.body as any).username,
                    password: (request.body as any).password,
                    metadata,
                } as any)
            },
            {
                schema: {
                    ...this.schemas.signInSchema,
                    tags: ["Authentication"],
                    summary: "Fazer login",
                    description: "Autentica um usuário no sistema",
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
            async (request) => {
                // Extrair metadata dos headers (tenta com e sem prefixo x-)
                const getHeader = (name: string): string | undefined => {
                    const nameLower = name.toLowerCase()
                    // Tenta sem prefixo primeiro, depois com prefixo x-
                    const value = request.headers[nameLower] || request.headers[`x-${nameLower}`]
                    return Array.isArray(value) ? value[0] : value
                }

                const metadata = {
                    ipAddress: getHeader("forwarded-for") || "127.0.0.1",
                    userAgent: getHeader("user-agent") || "unknown",
                    machineId: getHeader("machine-id") || "unknown",
                    timezone: getHeader("timezone") || "UTC",
                    latitude: (request.body as any)?.latitude,
                    longitude: (request.body as any)?.longitude,
                }

                // Extrair termsAccepted APENAS do header (não aceita do body)
                const termsAcceptedHeader = getHeader("terms-accepted")
                const termsAccepted =
                    termsAcceptedHeader === "true" ||
                    termsAcceptedHeader === "1" ||
                    termsAcceptedHeader === "True"

                return await authController.signUp({
                    username: (request.body as any).username,
                    password: (request.body as any).password,
                    termsAccepted,
                    metadata,
                } as any)
            },
            {
                schema: {
                    ...this.schemas.signUpSchema,
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
        const authController = AuthFactory.getAuthController()
        this.api.get(
            "/check-session",
            async () => {
                return await authController.checkSession()
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
