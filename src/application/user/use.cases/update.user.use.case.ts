/**
 * Update User Use Case - Caso de uso para atualização de usuário
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { IUserRepository, UserEntity, UserPreferences } from "@/domain/user"
import { UserService } from "../services/user.service"

export interface UpdateUserRequest {
    userId: string
    requestingUserId: string // Quem está fazendo a atualização
    updates: {
        name?: string
        bio?: string
        profilePicture?: string
        preferences?: Partial<UserPreferences>
        metadata?: Record<string, any>
    }
}

export interface UpdateUserResponse {
    success: boolean
    user?: UserEntity
    error?: string
}

export class UpdateUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userService: UserService,
    ) {}

    async execute(request: UpdateUserRequest): Promise<UpdateUserResponse> {
        try {
            // Verificar se o usuário pode atualizar o perfil
            const canUpdate = await this.canUpdateUser(request.userId, request.requestingUserId)
            if (!canUpdate) {
                return {
                    success: false,
                    error: "Acesso negado para atualizar este usuário",
                }
            }

            // Validar dados de atualização
            const validationResult = await this.validateUpdates(request.updates)
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                }
            }

            // Atualizar usuário
            const updatedUser = await this.userService.updateUser(request.userId, request.updates)
            if (!updatedUser) {
                return {
                    success: false,
                    error: "Usuário não encontrado",
                }
            }

            return {
                success: true,
                user: updatedUser,
            }
        } catch (error: any) {
            console.error("Erro ao atualizar usuário:", error)
            return {
                success: false,
                error: error.message || "Erro interno do servidor",
            }
        }
    }

    private async canUpdateUser(userId: string, requestingUserId: string): Promise<boolean> {
        // Apenas o próprio usuário pode atualizar seu perfil
        return userId === requestingUserId
    }

    private async validateUpdates(updates: UpdateUserRequest["updates"]): Promise<{ isValid: boolean; error?: string }> {
        // Validar nome se fornecido
        if (updates.name !== undefined) {
            if (!updates.name || updates.name.trim().length < 2) {
                return {
                    isValid: false,
                    error: "Nome deve ter pelo menos 2 caracteres",
                }
            }

            if (updates.name.length > 100) {
                return {
                    isValid: false,
                    error: "Nome deve ter no máximo 100 caracteres",
                }
            }
        }

        // Validar bio se fornecida
        if (updates.bio !== undefined && updates.bio.length > 500) {
            return {
                isValid: false,
                error: "Bio deve ter no máximo 500 caracteres",
            }
        }

        // Validar URL da foto de perfil se fornecida
        if (updates.profilePicture && !this.isValidUrl(updates.profilePicture)) {
            return {
                isValid: false,
                error: "URL da foto de perfil inválida",
            }
        }

        // Validar preferências se fornecidas
        if (updates.preferences) {
            const preferencesValidation = this.validatePreferences(updates.preferences)
            if (!preferencesValidation.isValid) {
                return preferencesValidation
            }
        }

        return { isValid: true }
    }

    private validatePreferences(preferences: Partial<UserPreferences>): { isValid: boolean; error?: string } {
        // Validar configurações de notificação
        if (preferences.notifications) {
            if (typeof preferences.notifications.email !== "boolean" &&
                preferences.notifications.email !== undefined) {
                return {
                    isValid: false,
                    error: "Configuração de email deve ser um booleano",
                }
            }

            if (typeof preferences.notifications.push !== "boolean" &&
                preferences.notifications.push !== undefined) {
                return {
                    isValid: false,
                    error: "Configuração de push deve ser um booleano",
                }
            }

            if (typeof preferences.notifications.marketing !== "boolean" &&
                preferences.notifications.marketing !== undefined) {
                return {
                    isValid: false,
                    error: "Configuração de marketing deve ser um booleano",
                }
            }
        }

        // Validar configurações de privacidade
        if (preferences.privacy) {
            if (preferences.privacy.profileVisibility &&
                !["public", "private", "friends"].includes(preferences.privacy.profileVisibility)) {
                return {
                    isValid: false,
                    error: "Visibilidade do perfil deve ser 'public', 'private' ou 'friends'",
                }
            }

            if (typeof preferences.privacy.showEmail !== "boolean" &&
                preferences.privacy.showEmail !== undefined) {
                return {
                    isValid: false,
                    error: "Configuração de mostrar email deve ser um booleano",
                }
            }

            if (typeof preferences.privacy.showLocation !== "boolean" &&
                preferences.privacy.showLocation !== undefined) {
                return {
                    isValid: false,
                    error: "Configuração de mostrar localização deve ser um booleano",
                }
            }
        }

        // Validar configurações de conteúdo
        if (preferences.content) {
            if (typeof preferences.content.autoPlay !== "boolean" &&
                preferences.content.autoPlay !== undefined) {
                return {
                    isValid: false,
                    error: "Configuração de auto play deve ser um booleano",
                }
            }

            if (preferences.content.quality &&
                !["low", "medium", "high"].includes(preferences.content.quality)) {
                return {
                    isValid: false,
                    error: "Qualidade deve ser 'low', 'medium' ou 'high'",
                }
            }

            if (typeof preferences.content.captions !== "boolean" &&
                preferences.content.captions !== undefined) {
                return {
                    isValid: false,
                    error: "Configuração de legendas deve ser um booleano",
                }
            }
        }

        // Validar idioma
        if (preferences.language && preferences.language.length !== 2) {
            return {
                isValid: false,
                error: "Código de idioma deve ter 2 caracteres (ex: 'pt', 'en')",
            }
        }

        return { isValid: true }
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
