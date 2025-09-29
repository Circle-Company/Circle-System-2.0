/**
 * Create User Use Case - Caso de uso para criação de usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity } from "@/domain/user"
import { UserService } from "../services/user.service"

export interface CreateUserRequest {
    name: string
    email: string
    password: string
    profilePicture?: string
    bio?: string
    preferences?: {
        language?: string
        notifications?: {
            email?: boolean
            push?: boolean
            marketing?: boolean
        }
        privacy?: {
            profileVisibility?: "public" | "private" | "friends"
            showEmail?: boolean
            showLocation?: boolean
        }
        content?: {
            autoPlay?: boolean
            quality?: "low" | "medium" | "high"
            captions?: boolean
        }
    }
    metadata?: Record<string, any>
}

export interface CreateUserResponse {
    success: boolean
    user?: UserEntity
    error?: string
}

export class CreateUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
        try {
            // Validar dados de entrada
            const validationResult = await this.validateRequest(request)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Criar usuário usando o serviço
            const user = await this.userService.createUser({
                name: request.name,
                email: request.email,
                password: request.password,
                profilePicture: request.profilePicture,
                bio: request.bio,
                preferences: request.preferences,
                metadata: request.metadata,
            })

            return {
                success: true,
                user,
            }
        } catch (error: any) {
            console.error("Erro ao criar usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(request: CreateUserRequest): Promise<{ isValid: boolean; error?: string }> {
        // Validar nome
        if (!request.name || request.name.trim().length < 2) {
            return {
                isValid: false,
                error: "Nome deve ter pelo menos 2 caracteres",
            }
        }

        if (request.name.length > 100) {
            return {
                isValid: false,
                error: "Nome deve ter no máximo 100 caracteres",
            }
        }

        // Validar email
        if (!request.email || !this.isValidEmail(request.email)) {
            return {
                isValid: false,
                error: "Email inválido",
            }
        }

        // Verificar se email já existe
        const emailExists = await this.userService.emailExists(request.email)
        if (emailExists) {
            return {
                isValid: false,
                error: "Email já está em uso",
            }
        }

        // Validar senha
        if (!request.password || request.password.length < 6) {
            return {
                isValid: false,
                error: "Senha deve ter pelo menos 6 caracteres",
            }
        }

        if (request.password.length > 128) {
            return {
                isValid: false,
                error: "Senha deve ter no máximo 128 caracteres",
            }
        }

        // Validar bio se fornecida
        if (request.bio && request.bio.length > 500) {
            return {
                isValid: false,
                error: "Bio deve ter no máximo 500 caracteres",
            }
        }

        // Validar URL da foto de perfil se fornecida
        if (request.profilePicture && !this.isValidUrl(request.profilePicture)) {
            return {
                isValid: false,
                error: "URL da foto de perfil inválida",
            }
        }

        return { isValid: true }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }
}
