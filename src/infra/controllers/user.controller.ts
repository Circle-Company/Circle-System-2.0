import { IUserRepository, User } from "@/domain/user"

import { Level } from "@/domain/authorization"

export interface CreateUserRequest {
    username: string
    name?: string
    searchMatchTerm: string
    password: string
    description?: string
    status?: {
        accessLevel: Level
        verified?: boolean
        deleted?: boolean
        blocked?: boolean
        muted?: boolean
    }
    preferences?: {
        appLanguage?: string
        appTimezone?: number
        disableAutoplay?: boolean
        disableHaptics?: boolean
        disableTranslation?: boolean
        translationLanguage?: string
        disableLikeMomentPushNotification?: boolean
        disableNewMemoryPushNotification?: boolean
        disableAddToMemoryPushNotification?: boolean
        disableFollowUserPushNotification?: boolean
        disableViewUserPushNotification?: boolean
        disableNewsPushNotification?: boolean
        disableSugestionsPushNotification?: boolean
        disableAroundYouPushNotification?: boolean
    }
    terms?: {
        termsAndConditionsAgreed: boolean
        termsAndConditionsAgreedVersion: string
        termsAndConditionsAgreedAt: Date
    }
}

export interface UpdateUserRequest {
    id: string
    username?: string
    name?: string
    searchMatchTerm?: string
    password?: string
    description?: string
    status?: {
        accessLevel?: Level
        verified?: boolean
        deleted?: boolean
        blocked?: boolean
        muted?: boolean
    }
    preferences?: {
        appLanguage?: string
        appTimezone?: number
        disableAutoplay?: boolean
        disableHaptics?: boolean
        disableTranslation?: boolean
        translationLanguage?: string
        disableLikeMomentPushNotification?: boolean
        disableNewMemoryPushNotification?: boolean
        disableAddToMemoryPushNotification?: boolean
        disableFollowUserPushNotification?: boolean
        disableViewUserPushNotification?: boolean
        disableNewsPushNotification?: boolean
        disableSugestionsPushNotification?: boolean
        disableAroundYouPushNotification?: boolean
    }
    terms?: {
        termsAndConditionsAgreed?: boolean
        termsAndConditionsAgreedVersion?: string
        termsAndConditionsAgreedAt?: Date
    }
}

export interface UserResponse {
    id: string
    username: string
    name: string | null
    searchMatchTerm: string
    description: string | null
    status?: {
        accessLevel: Level
        verified: boolean
        deleted: boolean
        blocked: boolean
        muted: boolean
    }
    preferences?: {
        appLanguage: string
        appTimezone: number
        disableAutoplay: boolean
        disableHaptics: boolean
        disableTranslation: boolean
        translationLanguage: string
        disableLikeMomentPushNotification: boolean
        disableNewMemoryPushNotification: boolean
        disableAddToMemoryPushNotification: boolean
        disableFollowUserPushNotification: boolean
        disableViewUserPushNotification: boolean
        disableNewsPushNotification: boolean
        disableSugestionsPushNotification: boolean
        disableAroundYouPushNotification: boolean
    }
    terms?: {
        termsAndConditionsAgreed: boolean
        termsAndConditionsAgreedVersion: string
        termsAndConditionsAgreedAt: Date
    }
    createdAt: Date
    updatedAt: Date
}

export class UserController {
    constructor(private readonly userRepository: IUserRepository) {}

    /**
     * Busca usuário por ID
     */
    async getUserById(id: string): Promise<UserResponse | null> {
        try {
            const user = await this.userRepository.findById(id)
            return user ? this.mapToResponse(user) : null
        } catch (error) {
            throw new Error(
                `Erro ao buscar usuário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Busca usuário por username
     */
    async getUserByUsername(username: string): Promise<UserResponse | null> {
        try {
            const user = await this.userRepository.findByUsername(username)
            return user ? this.mapToResponse(user) : null
        } catch (error) {
            throw new Error(
                `Erro ao buscar usuário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Atualiza um usuário
     */
    async updateUser(request: UpdateUserRequest): Promise<UserResponse> {
        try {
            const existingUser = await this.userRepository.findById(request.id)
            if (!existingUser) {
                throw new Error("Usuário não encontrado")
            }

            // Atualizar propriedades se fornecidas
            if (request.username) {
                existingUser.updateUsername(request.username)
            }
            if (request.name !== undefined) {
                existingUser.updateName(request.name)
            }
            if (request.searchMatchTerm) {
                existingUser.updateSearchMatchTerm(request.searchMatchTerm)
            }
            if (request.password) {
                existingUser.updatePassword(request.password)
            }
            if (request.description !== undefined) {
                existingUser.updateDescription(request.description)
            }

            // Atualizar status se fornecido
            if (request.status && existingUser.status) {
                existingUser.updateStatus({
                    ...existingUser.status,
                    accessLevel: request.status.accessLevel || existingUser.status.accessLevel,
                    verified:
                        request.status.verified !== undefined
                            ? request.status.verified
                            : existingUser.status.verified,
                    deleted:
                        request.status.deleted !== undefined
                            ? request.status.deleted
                            : existingUser.status.deleted,
                    blocked:
                        request.status.blocked !== undefined
                            ? request.status.blocked
                            : existingUser.status.blocked,
                    muted:
                        request.status.muted !== undefined
                            ? request.status.muted
                            : existingUser.status.muted,
                    createdAt: existingUser.status.createdAt,
                    updatedAt: new Date(),
                })
            }

            // Atualizar preferências se fornecidas
            if (request.preferences && existingUser.preferences) {
                existingUser.updatePreferences({
                    ...existingUser.preferences,
                    appLanguage:
                        request.preferences.appLanguage || existingUser.preferences.appLanguage,
                    appTimezone:
                        request.preferences.appTimezone !== undefined
                            ? request.preferences.appTimezone
                            : existingUser.preferences.appTimezone,
                    disableAutoplay:
                        request.preferences.disableAutoplay !== undefined
                            ? request.preferences.disableAutoplay
                            : existingUser.preferences.disableAutoplay,
                    disableHaptics:
                        request.preferences.disableHaptics !== undefined
                            ? request.preferences.disableHaptics
                            : existingUser.preferences.disableHaptics,
                    disableTranslation:
                        request.preferences.disableTranslation !== undefined
                            ? request.preferences.disableTranslation
                            : existingUser.preferences.disableTranslation,
                    translationLanguage:
                        request.preferences.translationLanguage ||
                        existingUser.preferences.translationLanguage,
                    disableLikeMomentPushNotification:
                        request.preferences.disableLikeMomentPushNotification !== undefined
                            ? request.preferences.disableLikeMomentPushNotification
                            : existingUser.preferences.disableLikeMomentPushNotification,
                    disableNewMemoryPushNotification:
                        request.preferences.disableNewMemoryPushNotification !== undefined
                            ? request.preferences.disableNewMemoryPushNotification
                            : existingUser.preferences.disableNewMemoryPushNotification,
                    disableAddToMemoryPushNotification:
                        request.preferences.disableAddToMemoryPushNotification !== undefined
                            ? request.preferences.disableAddToMemoryPushNotification
                            : existingUser.preferences.disableAddToMemoryPushNotification,
                    disableFollowUserPushNotification:
                        request.preferences.disableFollowUserPushNotification !== undefined
                            ? request.preferences.disableFollowUserPushNotification
                            : existingUser.preferences.disableFollowUserPushNotification,
                    disableViewUserPushNotification:
                        request.preferences.disableViewUserPushNotification !== undefined
                            ? request.preferences.disableViewUserPushNotification
                            : existingUser.preferences.disableViewUserPushNotification,
                    disableNewsPushNotification:
                        request.preferences.disableNewsPushNotification !== undefined
                            ? request.preferences.disableNewsPushNotification
                            : existingUser.preferences.disableNewsPushNotification,
                    disableSugestionsPushNotification:
                        request.preferences.disableSugestionsPushNotification !== undefined
                            ? request.preferences.disableSugestionsPushNotification
                            : existingUser.preferences.disableSugestionsPushNotification,
                    disableAroundYouPushNotification:
                        request.preferences.disableAroundYouPushNotification !== undefined
                            ? request.preferences.disableAroundYouPushNotification
                            : existingUser.preferences.disableAroundYouPushNotification,
                    createdAt: existingUser.preferences.createdAt,
                    updatedAt: new Date(),
                })
            }

            // Atualizar termos se fornecidos
            if (request.terms && existingUser.terms) {
                existingUser.updateTerms({
                    ...existingUser.terms,
                    termsAndConditionsAgreed:
                        request.terms.termsAndConditionsAgreed !== undefined
                            ? request.terms.termsAndConditionsAgreed
                            : existingUser.terms.termsAndConditionsAgreed,
                    termsAndConditionsAgreedVersion:
                        request.terms.termsAndConditionsAgreedVersion ||
                        existingUser.terms.termsAndConditionsAgreedVersion,
                    termsAndConditionsAgreedAt:
                        request.terms.termsAndConditionsAgreedAt ||
                        existingUser.terms.termsAndConditionsAgreedAt,
                    createdAt: existingUser.terms.createdAt,
                    updatedAt: new Date(),
                })
            }

            const updatedUser = await this.userRepository.update(existingUser)
            return this.mapToResponse(updatedUser)
        } catch (error) {
            throw new Error(
                `Erro ao atualizar usuário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Deleta um usuário (soft delete)
     */
    async deleteUser(id: string): Promise<void> {
        try {
            const user = await this.userRepository.findById(id)
            if (!user) {
                throw new Error("Usuário não encontrado")
            }
            // Soft delete via update do status
            if (user.status) {
                user.updateStatus({
                    ...user.status,
                    deleted: true,
                    updatedAt: new Date(),
                })
                await this.userRepository.update(user)
            }
        } catch (error) {
            throw new Error(
                `Erro ao deletar usuário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Mapeia entidade User para UserResponse
     */
    private mapToResponse(user: User): UserResponse {
        const userData = user.toJSON()

        return {
            id: userData.id || "",
            username: userData.username || "",
            name: userData.name || null,
            searchMatchTerm: userData.searchMatchTerm || "",
            description: userData.description || null,
            status: userData.status
                ? {
                      accessLevel: userData.status.accessLevel,
                      verified: userData.status.verified,
                      deleted: userData.status.deleted,
                      blocked: userData.status.blocked,
                      muted: userData.status.muted,
                  }
                : undefined,
            preferences: userData.preferences
                ? {
                      appLanguage: userData.preferences.appLanguage,
                      appTimezone: userData.preferences.appTimezone,
                      disableAutoplay: userData.preferences.disableAutoplay,
                      disableHaptics: userData.preferences.disableHaptics,
                      disableTranslation: userData.preferences.disableTranslation,
                      translationLanguage: userData.preferences.translationLanguage,
                      disableLikeMomentPushNotification:
                          userData.preferences.disableLikeMomentPushNotification,
                      disableNewMemoryPushNotification:
                          userData.preferences.disableNewMemoryPushNotification,
                      disableAddToMemoryPushNotification:
                          userData.preferences.disableAddToMemoryPushNotification,
                      disableFollowUserPushNotification:
                          userData.preferences.disableFollowUserPushNotification,
                      disableViewUserPushNotification:
                          userData.preferences.disableViewUserPushNotification,
                      disableNewsPushNotification: userData.preferences.disableNewsPushNotification,
                      disableSugestionsPushNotification:
                          userData.preferences.disableSugestionsPushNotification,
                      disableAroundYouPushNotification:
                          userData.preferences.disableAroundYouPushNotification,
                  }
                : undefined,
            terms: userData.terms
                ? {
                      termsAndConditionsAgreed: userData.terms.termsAndConditionsAgreed,
                      termsAndConditionsAgreedVersion:
                          userData.terms.termsAndConditionsAgreedVersion,
                      termsAndConditionsAgreedAt: userData.terms.termsAndConditionsAgreedAt,
                  }
                : undefined,
            createdAt: userData.createdAt || new Date(),
            updatedAt: userData.updatedAt || new Date(),
        }
    }
}
