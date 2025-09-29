import { User, UserRepositoryInterface } from "@/domain/user"

import { Level } from "@/domain/authorization/types"

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
    constructor(private readonly userRepository: UserRepositoryInterface) {}

    /**
     * Cria um novo usuário
     */
    async createUser(request: CreateUserRequest): Promise<UserResponse> {
        try {
            const user = await User.create({
                username: request.username,
                name: request.name,
                searchMatchTerm: request.searchMatchTerm,
                password: request.password,
                description: request.description,
                status: request.status
                    ? {
                          accessLevel: request.status.accessLevel,
                          verified: request.status.verified || false,
                          deleted: request.status.deleted || false,
                          blocked: request.status.blocked || false,
                          muted: request.status.muted || false,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                      }
                    : undefined,
                preferences: request.preferences
                    ? {
                          appLanguage: request.preferences.appLanguage || "pt",
                          appTimezone: request.preferences.appTimezone || -3,
                          disableAutoplay: request.preferences.disableAutoplay || false,
                          disableHaptics: request.preferences.disableHaptics || false,
                          disableTranslation: request.preferences.disableTranslation || false,
                          translationLanguage: request.preferences.translationLanguage || "pt",
                          disableLikeMomentPushNotification:
                              request.preferences.disableLikeMomentPushNotification || false,
                          disableNewMemoryPushNotification:
                              request.preferences.disableNewMemoryPushNotification || false,
                          disableAddToMemoryPushNotification:
                              request.preferences.disableAddToMemoryPushNotification || false,
                          disableFollowUserPushNotification:
                              request.preferences.disableFollowUserPushNotification || false,
                          disableViewUserPushNotification:
                              request.preferences.disableViewUserPushNotification || false,
                          disableNewsPushNotification:
                              request.preferences.disableNewsPushNotification || false,
                          disableSugestionsPushNotification:
                              request.preferences.disableSugestionsPushNotification || false,
                          disableAroundYouPushNotification:
                              request.preferences.disableAroundYouPushNotification || false,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                      }
                    : undefined,
                terms: request.terms
                    ? {
                          termsAndConditionsAgreed: request.terms.termsAndConditionsAgreed,
                          termsAndConditionsAgreedVersion:
                              request.terms.termsAndConditionsAgreedVersion,
                          termsAndConditionsAgreedAt: request.terms.termsAndConditionsAgreedAt,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                      }
                    : undefined,
            })

            const savedUser = await this.userRepository.create(user)
            return this.mapToResponse(savedUser)
        } catch (error) {
            throw new Error(
                `Erro ao criar usuário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

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
     * Busca usuários por termo de busca
     */
    async searchUsers(searchTerm: string): Promise<UserResponse[]> {
        try {
            const users = await this.userRepository.findBySearchTerm(searchTerm)
            return users.map((user) => this.mapToResponse(user))
        } catch (error) {
            throw new Error(
                `Erro ao buscar usuários: ${
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
            await this.userRepository.delete(id)
        } catch (error) {
            throw new Error(
                `Erro ao deletar usuário: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Lista todos os usuários
     */
    async getAllUsers(limit: number = 50, offset: number = 0): Promise<UserResponse[]> {
        try {
            const users = await this.userRepository.findAll(limit, offset)
            return users.map((user) => this.mapToResponse(user))
        } catch (error) {
            throw new Error(
                `Erro ao listar usuários: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Lista usuários ativos
     */
    async getActiveUsers(limit: number = 50, offset: number = 0): Promise<UserResponse[]> {
        try {
            const users = await this.userRepository.findActiveUsers(limit, offset)
            return users.map((user) => this.mapToResponse(user))
        } catch (error) {
            throw new Error(
                `Erro ao listar usuários ativos: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            )
        }
    }

    /**
     * Lista usuários por status
     */
    async getUsersByStatus(status: string): Promise<UserResponse[]> {
        try {
            const users = await this.userRepository.findUsersByStatus(status)
            return users.map((user) => this.mapToResponse(user))
        } catch (error) {
            throw new Error(
                `Erro ao listar usuários por status: ${
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
            id: userData.id,
            username: userData.username,
            name: userData.name,
            searchMatchTerm: userData.searchMatchTerm,
            description: userData.description,
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
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
        }
    }
}
