/**
 * Create User Use Case - Caso de uso para criação de usuário
 *
 * @author Circle Team
 * @version 1.0.0
 */

import { IUserRepository, User } from "@/domain/user"

import { CircleText } from "circle-text-library"

export interface CreateUserRequest {
    name: string
    username: string
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
    user?: User
    error?: string
}

export class CreateUserUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

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

            // Criar usuário usando o repositório
            const user = new User({
                username: request.username, // Usar email como username temporário
                name: request.name,
                searchMatchTerm: `${request.name} ${request.username}`,
                password: request.password,
                description: request.bio,
                profilePicture: request.profilePicture
                    ? {
                          tinyResolution: request.profilePicture,
                          fullhdResolution: request.profilePicture,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                      }
                    : undefined,
            })

            const savedUser = await this.userRepository.save(user)

            return {
                success: true,
                user: savedUser,
            }
        } catch (error: any) {
            console.error("Erro ao criar usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async validateRequest(
        request: CreateUserRequest,
    ): Promise<{ isValid: boolean; error?: string }> {
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

        // Validar username
        if (!request.username || !this.isValidUsername(request.username)) {
            return {
                isValid: false,
                error: "Username inválido",
            }
        }

        // Verificar se email já existe
        const usernameExists = await this.userRepository.existsByUsername(request.username)
        if (usernameExists) {
            return {
                isValid: false,
                error: "Username já está em uso",
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

    private isValidUsername(username: string): boolean {
        const circleTextLibrary = new CircleText()
        return circleTextLibrary.validate.username(username).isValid
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
