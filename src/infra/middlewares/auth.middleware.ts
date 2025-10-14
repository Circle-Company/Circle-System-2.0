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
        try {
            // Decodificar e validar o JWT
            const payload = await jwtDecoder(token)
            const user = await this.userRepository.findById(payload.sub)

            if (!user) {
                console.error(`User not found with ID: ${payload.sub}`)
                throw new ValidationError({
                    message: "User not found",
                    code: ErrorCode.USER_NOT_FOUND,
                    action: "Verify if the user exists",
                    context: {
                        additionalData: {
                            userId: payload.sub,
                        },
                    },
                })
            }

            // Verificar se o usuário está bloqueado ou deletado pelo sistema
            if (user.status?.blocked || user.status?.deleted) {
                console.warn(`User ${user.id} is blocked or deleted`)
                throw new ValidationError({
                    message: "User blocked or deleted by system",
                    code: ErrorCode.OPERATION_NOT_ALLOWED,
                    action: "Contact support for more information",
                    context: {
                        additionalData: {
                            userId: payload.sub,
                            status: user.status,
                        },
                    },
                })
            }

            // Retornar dados do usuário autenticado
            // Usar level do JWT (que já foi validado e é mais confiável)
            // Normalizar para lowercase para compatibilidade com enums Level e Device
            const rawLevel = payload.level || user.status?.accessLevel || "user"
            const normalizedLevel = (rawLevel as string).toLowerCase()
            const normalizedDevice = (payload.device as string).toLowerCase()

            const authenticatedUser: AuthenticatedUser = {
                id: payload.sub, // Manter como string para compatibilidade
                device: normalizedDevice as unknown as Device,
                level: normalizedLevel as unknown as Level,
            }

            return authenticatedUser
        } catch (error) {
            console.error("Authentication service error:", error)
            throw error
        }
    }
}
export class AuthMiddleware {
    constructor(private authService: AuthService) {}

    async execute(request: HttpRequest, response: HttpResponse): Promise<void> {
        try {
            // Extrair token do header Authorization
            const authHeader = request.headers.authorization

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                response.status(401).send({
                    success: false,
                    message: "Authentication token required",
                    code: "AUTHENTICATION_REQUIRED",
                })
                return
            }

            const token = authHeader.substring(7) // Remove "Bearer "
            const authenticatedUser = await this.authService.authenticate(token)

            // Adicionar usuário ao request
            request.user = authenticatedUser
        } catch (error: any) {
            console.error("Authentication middleware error:", error.message)

            response.status(401).send({
                success: false,
                message: error.message || "Authentication failed",
                code: error.code || "AUTH_ERROR",
            })
            return
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
