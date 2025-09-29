import { Device, Level } from "@/domain/authorization"
import { HttpRequest, HttpResponse } from "@/infra/http"
import { ErrorCode, ValidationError, jwtDecoder } from "@/shared"

import { UserRepository } from "@/domain/user"
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
    constructor(private userRepository: UserRepository) {}

    async authenticate(token: string): Promise<AuthenticatedUser> {
        // Decodificar e validar o JWT
        const payload = await jwtDecoder(token)

        // Buscar usuário no banco de dados
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
            id: payload.sub,
            device: payload.device as unknown as Device,
            level: user.status?.accessLevel as unknown as Level,
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
                    error: {
                        message: "Token de autenticação necessário",
                        code: "AUTHENTICATION_REQUIRED",
                        timestamp: new Date().toISOString(),
                    },
                })
                return
            }

            const token = authHeader.substring(7) // Remove "Bearer "

            // Autenticar usuário usando o serviço
            const authenticatedUser = await this.authService.authenticate(token)

            // Adicionar usuário ao request
            request.user = authenticatedUser
        } catch (error: any) {
            if (error instanceof ValidationError) {
                response.status(403).send({
                    success: false,
                    error: {
                        message: error.message,
                        code: error.code,
                        timestamp: new Date().toISOString(),
                    },
                })
            } else {
                response.status(401).send({
                    success: false,
                    error: {
                        message: "Erro de autenticação",
                        code: "AUTH_ERROR",
                        timestamp: new Date().toISOString(),
                    },
                })
            }
        }
    }
}

/**
 * Factory function para criar o middleware de autenticação
 */
export function createAuthMiddleware(userRepository: UserRepository): AuthMiddleware {
    const authService = new AuthServiceImpl(userRepository)
    return new AuthMiddleware(authService)
}

/**
 * Middleware de Autenticação - RouteHandler
 * 
 * @deprecated Use createAuthMiddleware instead for better dependency injection
 */
export function authMiddleware(
    userRepository: UserRepository
): (request: HttpRequest, response: HttpResponse) => Promise<void> {
    return async (request: HttpRequest, response: HttpResponse): Promise<void> => {
        try {
            const authHeader = request.headers.authorization

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                response.status(401).send({
                    success: false,
                    error: {
                        message: "Token de autenticação necessário",
                        code: "AUTHENTICATION_REQUIRED",
                        timestamp: new Date().toISOString(),
                    },
                })
                return
            }

            const token = authHeader.substring(7) // Remove "Bearer "
            
            // Decodificar e validar o JWT
            const payload = await jwtDecoder(token)
            
            // Buscar usuário no banco de dados
            const user = await userRepository.findById(payload.sub)

            if (!user) {
                response.status(401).send({
                    success: false,
                    error: {
                        message: "Usuário não encontrado",
                        code: "USER_NOT_FOUND",
                        timestamp: new Date().toISOString(),
                    },
                })
                return
            }

            // Verificar se o usuário está bloqueado ou deletado pelo sistema
            if (user.status?.blocked || user.status?.deleted) {
                response.status(403).send({
                    success: false,
                    error: {
                        message: "Usuário bloqueado ou deletado pelo sistema",
                        code: "USER_BLOCKED",
                        timestamp: new Date().toISOString(),
                    },
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
                error: {
                    message: "Erro de autenticação",
                    code: "AUTH_ERROR",
                    timestamp: new Date().toISOString(),
                },
            })
        }
    }
}
