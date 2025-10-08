/**
 * User Schemas - Schemas relacionados a usuários
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { CommonSchemas } from "./common.schemas"

// ===== USER ENTITY =====

export const UserSchema = {
    type: "object",
    properties: {
        id: {
            type: "string",
            description: "ID único do usuário",
            example: "1234567890",
        },
        username: {
            type: "string",
            minLength: 4,
            maxLength: 20,
            description: "Nome de usuário único",
            example: "johndoe",
        },
        email: {
            type: "string",
            format: "email",
            description: "Email do usuário",
            example: "john.doe@example.com",
            nullable: true,
        },
        displayName: {
            type: "string",
            maxLength: 50,
            description: "Nome de exibição",
            example: "John Doe",
            nullable: true,
        },
        bio: {
            type: "string",
            maxLength: 500,
            description: "Biografia do usuário",
            example: "Software developer and tech enthusiast",
            nullable: true,
        },
        avatar: {
            type: "string",
            format: "uri",
            description: "URL do avatar",
            example: "https://cdn.circle.com/avatars/johndoe.jpg",
            nullable: true,
        },
        coverImage: {
            type: "string",
            format: "uri",
            description: "URL da imagem de capa",
            example: "https://cdn.circle.com/covers/johndoe.jpg",
            nullable: true,
        },
        verified: {
            type: "boolean",
            description: "Indica se o usuário é verificado",
            example: false,
            default: false,
        },
        private: {
            type: "boolean",
            description: "Indica se a conta é privada",
            example: false,
            default: false,
        },
        stats: {
            type: "object",
            properties: {
                followers: {
                    type: "integer",
                    description: "Número de seguidores",
                    example: 1250,
                },
                following: {
                    type: "integer",
                    description: "Número de pessoas seguindo",
                    example: 350,
                },
                moments: {
                    type: "integer",
                    description: "Número de momentos publicados",
                    example: 42,
                },
                likes: {
                    type: "integer",
                    description: "Total de likes recebidos",
                    example: 5420,
                },
            },
        },
        createdAt: {
            type: "string",
            format: "date-time",
            description: "Data de criação da conta",
            example: "2025-01-15T10:30:00.000Z",
        },
        updatedAt: {
            type: "string",
            format: "date-time",
            description: "Data da última atualização",
            example: "2025-10-08T10:30:00.000Z",
        },
    },
    required: ["id", "username", "createdAt", "updatedAt"],
}

// ===== USER PROFILE =====

export const UserProfileSchema = {
    type: "object",
    properties: {
        ...UserSchema.properties,
        isFollowing: {
            type: "boolean",
            description: "Indica se o usuário autenticado segue este perfil",
            example: false,
        },
        isFollowedBy: {
            type: "boolean",
            description: "Indica se este perfil segue o usuário autenticado",
            example: false,
        },
        isBlocked: {
            type: "boolean",
            description: "Indica se o usuário foi bloqueado",
            example: false,
        },
    },
}

// ===== UPDATE USER =====

export const UpdateUserSchema = {
    type: "object",
    properties: {
        displayName: {
            type: "string",
            maxLength: 50,
            description: "Nome de exibição",
            example: "John Doe",
        },
        bio: {
            type: "string",
            maxLength: 500,
            description: "Biografia",
            example: "Updated bio",
        },
        email: {
            type: "string",
            format: "email",
            description: "Email",
            example: "newemail@example.com",
        },
        private: {
            type: "boolean",
            description: "Tornar conta privada",
            example: false,
        },
    },
}

// ===== USER SETTINGS =====

export const UserSettingsSchema = {
    type: "object",
    properties: {
        notifications: {
            type: "object",
            properties: {
                likes: {
                    type: "boolean",
                    description: "Notificações de likes",
                    example: true,
                },
                comments: {
                    type: "boolean",
                    description: "Notificações de comentários",
                    example: true,
                },
                follows: {
                    type: "boolean",
                    description: "Notificações de novos seguidores",
                    example: true,
                },
                mentions: {
                    type: "boolean",
                    description: "Notificações de menções",
                    example: true,
                },
            },
        },
        privacy: {
            type: "object",
            properties: {
                privateAccount: {
                    type: "boolean",
                    description: "Conta privada",
                    example: false,
                },
                showLocation: {
                    type: "boolean",
                    description: "Mostrar localização em momentos",
                    example: true,
                },
                allowComments: {
                    type: "boolean",
                    description: "Permitir comentários",
                    example: true,
                },
            },
        },
        language: {
            type: "string",
            enum: ["pt-BR", "en-US", "es-ES"],
            description: "Idioma preferido",
            example: "pt-BR",
        },
        timezone: {
            type: "string",
            description: "Timezone do usuário",
            example: "America/Sao_Paulo",
        },
    },
}

// ===== RESPONSES =====

export const UserResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
        },
        user: UserSchema,
        timestamp: {
            type: "string",
            format: "date-time",
            example: "2025-10-08T10:30:00.000Z",
        },
    },
    required: ["success", "user"],
}

export const UserListResponseSchema = {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
        },
        users: {
            type: "array",
            items: UserSchema,
        },
        pagination: CommonSchemas.PaginationMeta,
        timestamp: {
            type: "string",
            format: "date-time",
            example: "2025-10-08T10:30:00.000Z",
        },
    },
    required: ["success", "users", "pagination"],
}

// ===== SEARCH =====

export const SearchUsersQuerySchema = {
    type: "object",
    properties: {
        q: {
            type: "string",
            minLength: 1,
            description: "Termo de busca",
            example: "john",
        },
        verified: {
            type: "boolean",
            description: "Filtrar apenas verificados",
            example: false,
        },
        ...CommonSchemas.PaginationQuery.properties,
    },
}

// ===== EXPORT =====

export const UserSchemas = {
    User: UserSchema,
    UserProfile: UserProfileSchema,
    UpdateUser: UpdateUserSchema,
    UserSettings: UserSettingsSchema,
    UserResponse: UserResponseSchema,
    UserListResponse: UserListResponseSchema,
    SearchUsersQuery: SearchUsersQuerySchema,
}
