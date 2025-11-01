/**
 * Create User Use Case - Caso de uso para criação de usuário
 *
 * @author Circle Team
 * @version 1.0.0
 */

import { IUserRepository, User } from "@/domain/user"

import { textLib } from "@/shared"

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

            // Criar usuário usando o método estático que encripta a senha automaticamente
            const user = await User.create({
                                    username: request.username,
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
            return {
                success: false,
                error: error.message || "Internal server error",
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
                error: "Name must be at least 2 characters",
            }
        }

        if (request.name.length > 100) {
            return {
                isValid: false,
                error: "Name must be less than 100 characters",
            }
        }

        // Validar username
        if (!request.username || !this.isValidUsername(request.username)) {
            return {
                isValid: false,
                error: "Username is invalid",
            }
        }

        // Verificar se email já existe
        const usernameExists = await this.userRepository.existsByUsername(request.username)
        if (usernameExists) {
            return {
                isValid: false,
                error: "Username is already in use",
            }
        }

        // Validar senha
        if (!request.password || request.password.length < 6) {
            return {
                isValid: false,
                    error: "Password must be at least 6 characters",
            }
        }

        if (request.password.length > 128) {
            return {
                isValid: false,
                error: "Password must be less than 128 characters",
            }
        }

        // Validar bio se fornecida
        if (request.bio && request.bio.length > 500) {
            return {
                isValid: false,
                error: "Bio must be less than 500 characters",
            }
        }

        // Validar URL da foto de perfil se fornecida
        if (request.profilePicture && !this.isValidUrl(request.profilePicture)) {
            return {
                isValid: false,
                error: "Profile picture URL is invalid",
            }
        }

        return { isValid: true }
    }

    private isValidUsername(username: string): boolean {
        return textLib.validator.username(username).isValid
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
