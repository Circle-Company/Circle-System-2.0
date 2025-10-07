import { Device, Level } from "@/domain/authorization"
import { HttpRequest, HttpResponse } from "@/infra/http"
import { ErrorCode, ValidationError, jwtDecoder } from "@/shared"

import { UserRepositoryInterface } from "@/domain/user/repositories/user.repository"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { UserRepositoryImpl } from "@/infra/repository.impl/user.repository.impl"
import { AuthenticatedUser } from "./types"

/**
 * Interface para o serviço de autenticação
 * Seguindo os princípios da Clean Architecture
 */
export interface AuthService {
    authenticate(token: string): Promise<AuthenticatedUser>
}

/**
 * Implementação do serviço de autenticação
 */
export class AuthServiceImpl implements AuthService {
    constructor(private userRepository: UserRepositoryInterface) {}

    async authenticate(token: string): Promise<AuthenticatedUser> {
        // Decodificar e validar o JWT
        const payload = await jwtDecoder(token)

        // Buscar usuário no banco de dados usando o ID como string
        const user = await this.userRepository.findById(payload.sub)

        if (!user) {
            throw new ValidationError({
                message: "Usuário não encontrado",
                code: ErrorCode.USER_NOT_FOUND,
                action: "Verifique se o usuário existe",
                context: {
                    additionalData: {
                        userId: payload.sub,
                    },
                },
            })
        }

        // Verificar se o usuário está bloqueado ou deletado pelo sistema
        if (user.status?.blocked || user.status?.deleted) {
            throw new ValidationError({
                message: "Usuário bloqueado ou deletado pelo sistema.",
                code: ErrorCode.OPERATION_NOT_ALLOWED,
                action: "Contate o suporte para mais informações.",
                context: {
                    additionalData: {
                        userId: payload.sub,
                        status: user.status,
                    },
                },
            })
        }

        // Retornar dados do usuário autenticado
        return {
            id: payload.sub, // Manter como string para compatibilidade
            device: payload.device as unknown as Device,
            level: user.status?.accessLevel as unknown as Level,
        }
    }
}
export class AuthMiddleware {
    constructor(private authService: AuthService) {}

    async execute(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            console.log("=== AUTH MIDDLEWARE DEBUG ===")
            console.log("URL:", request.url)
            console.log("Method:", request.method)
            console.log("Headers:", request.headers)
            console.log("Authorization header:", request.headers.authorization)

            // Extrair token do header Authorization
            const authHeader = request.headers.authorization
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                console.log("❌ No valid authorization header found")
                response.status(401).send({
                    success: false,
                    error: "Token de autenticação necessário",
                    code: "AUTHENTICATION_REQUIRED",
                    timestamp: new Date().toISOString(),
                })
                return
            }

            const token = authHeader.substring(7) // Remove "Bearer "
            console.log("✅ Token found, authenticating...")
            console.log("Token:", token.substring(0, 50) + "...")

            // Autenticar usuário usando o serviço
            const authenticatedUser = await this.authService.authenticate(token)
            console.log("✅ User authenticated:", authenticatedUser)

            // Adicionar usuário ao request
            request.user = authenticatedUser
        } catch (error: any) {
            console.log("❌ Authentication error:", error.message)
            console.log("Error details:", error)

            if (error instanceof ValidationError) {
                response.status(403).send({
                    success: false,
                    error: error.message,
                    code: error.code,
                    timestamp: new Date().toISOString(),
                })
            } else {
                response.status(401).send({
                    success: false,
                    error: "Erro de autenticação",
                    code: "AUTH_ERROR",
                    timestamp: new Date().toISOString(),
                })
            }
        }
    }
}

/**
 * Factory function para criar o middleware de autenticação
 */
export function createAuthMiddleware(databaseAdapter: DatabaseAdapter): AuthMiddleware {
    const userRepository: UserRepositoryInterface = new UserRepositoryImpl(databaseAdapter)
    const authService = new AuthServiceImpl(userRepository)
    return new AuthMiddleware(authService)
}

/**
 * Middleware de Autenticação - RouteHandler
 *
 * @deprecated Use createAuthMiddleware instead for better dependency injection
 */
export function authMiddleware(
    databaseAdapter: DatabaseAdapter,
): (request: HttpRequest, response: HttpResponse) => Promise<void> {
    return async (request: HttpRequest, response: HttpResponse): Promise<void> => {
        try {
            const authHeader = request.headers.authorization

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                response.status(401).send({
                    success: false,
                    error: "Token de autenticação necessário",
                    code: "AUTHENTICATION_REQUIRED",
                    timestamp: new Date().toISOString(),
                })
                return
            }

            const token = authHeader.substring(7) // Remove "Bearer "

            // Decodificar e validar o JWT
            const payload = await jwtDecoder(token)

            // Criar instância do repositório com o adapter
            const userRepository = new UserRepositoryImpl(databaseAdapter)

            // Buscar usuário no banco de dados usando o ID como string
            const user = await userRepository.findById(payload.sub)

            if (!user) {
                response.status(401).send({
                    success: false,
                    error: "Usuário não encontrado",
                    code: "USER_NOT_FOUND",
                    timestamp: new Date().toISOString(),
                })
                return
            }

            // Verificar se o usuário está bloqueado ou deletado pelo sistema
            if (user.status?.blocked || user.status?.deleted) {
                response.status(403).send({
                    success: false,
                    error: "Usuário bloqueado ou deletado pelo sistema",
                    code: "USER_BLOCKED",
                    timestamp: new Date().toISOString(),
                })
                return
            }

            // Adicionar usuário autenticado ao request
            const authenticatedUser: AuthenticatedUser = {
                id: payload.sub,
                device: payload.device as unknown as Device,
                level: user.status?.accessLevel as unknown as Level,
            }

            request.user = authenticatedUser
        } catch (error: any) {
            response.status(401).send({
                success: false,
                error: "Erro de autenticação",
                code: "AUTH_ERROR",
                timestamp: new Date().toISOString(),
            })
        }
    }
}
