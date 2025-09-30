/**
 * Auth HTTP Handlers - Handlers HTTP para autenticação
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { SignInUseCase } from "@/application/auth/signin.use.case"
import { SignUpUseCase } from "@/application/auth/signup.use.case"
import { z } from "zod"

// Schemas de validação
const SignInRequestSchema = z.object({
    username: z.string().min(1, "Username é obrigatório"),
    password: z.string().min(1, "Senha é obrigatória"),
    termsAccepted: z.boolean().optional(),
    metadata: z
        .object({
            ipAddress: z.string().optional(),
            userAgent: z.string().optional(),
            machineId: z.string().optional(),
            timezone: z.string().optional(),
            latitude: z.number().optional(),
            longitude: z.number().optional(),
        })
        .optional(),
})

const SignUpRequestSchema = z.object({
    username: z.string().min(4, "Username deve ter pelo menos 4 caracteres"),
    password: z
        .string()
        .min(6, "Senha deve ter pelo menos 6 caracteres")
        .max(128, "Senha deve ter no máximo 128 caracteres"),
    termsAccepted: z.boolean().optional(),
    metadata: z
        .object({
            ipAddress: z.string().optional(),
            userAgent: z.string().optional(),
            machineId: z.string().optional(),
            timezone: z.string().optional(),
            latitude: z.number().optional(),
            longitude: z.number().optional(),
        })
        .optional(),
})

// Interfaces de Request
export interface SignInRequest {
    username: string
    password: string
    termsAccepted?: boolean
    metadata?: {
        ipAddress?: string
        userAgent?: string
        machineId?: string
        timezone?: string
        latitude?: number
        longitude?: number
    }
}

export interface SignUpRequest {
    username: string
    password: string
    termsAccepted?: boolean
    metadata?: {
        ipAddress?: string
        userAgent?: string
        machineId?: string
        timezone?: string
        latitude?: number
        longitude?: number
    }
}

// Interfaces de Response
export interface AuthResponse {
    success: boolean
    session?: {
        user: {
            id: string
            name: string
            description?: string
            username: string
            verified?: boolean
            profile_picture: {
                small_resolution: string
                tiny_resolution: string
            }
        }
        statistics: {
            total_followers_num: number
            total_likes_num: number
            total_views_num: number
        }
        account: {
            jwtToken: string
            jwtExpiration: string
            muted?: boolean
            unreadNotificationsCount: number
            last_login_at: Date
        }
        preferences: {
            timezone: number
            language: {
                appLanguage: string
                translationLanguage: string
            }
            content: {
                disableAutoplay: boolean
                disableHaptics: boolean
                disableTranslation: boolean
            }
            pushNotifications: {
                disableLikeMoment: boolean
                disableNewMemory: boolean
                disableAddToMemory: boolean
                disableFollowUser: boolean
                disableViewUser: boolean
            }
        }
    }
    securityInfo?: {
        riskLevel: string
        status: string
        message: string
        additionalData?: any
    }
    error?: string
}

export class AuthHandlers {
    constructor(
        private readonly signInUseCase: SignInUseCase,
        private readonly signUpUseCase: SignUpUseCase,
    ) {}

    /**
     * Handler para sign in
     */
    async signIn(request: SignInRequest): Promise<AuthResponse> {
        try {
            // Validação com Zod
            const validatedData = SignInRequestSchema.parse(request)

            const result = await this.signInUseCase.execute({
                username: validatedData.username,
                password: validatedData.password,
                device: "web" as any,
                securityData: {
                    ipAddress: validatedData.metadata?.ipAddress || "127.0.0.1",
                    userAgent: validatedData.metadata?.userAgent || "unknown",
                    machineId: validatedData.metadata?.machineId || "unknown",
                    timezone: validatedData.metadata?.timezone || "UTC",
                    latitude: validatedData.metadata?.latitude,
                    longitude: validatedData.metadata?.longitude,
                },
            })

            return {
                success: true,
                session: {
                    user: {
                        id: result.user.id,
                        name: result.user.name || "",
                        description: "",
                        username: result.user.username,
                        verified: false,
                        profile_picture: {
                            small_resolution: "",
                            tiny_resolution: "",
                        },
                    },
                    statistics: {
                        total_followers_num: 0,
                        total_likes_num: 0,
                        total_views_num: 0,
                    },
                    account: {
                        jwtToken: `Bearer ${result.token}`,
                        jwtExpiration: process.env.JWT_EXPIRES || "3600",
                        muted: false,
                        unreadNotificationsCount: 0,
                        last_login_at: result.user.lastLogin || new Date(),
                    },
                    preferences: {
                        timezone: -3,
                        language: {
                            appLanguage: "pt",
                            translationLanguage: "pt",
                        },
                        content: {
                            disableAutoplay: false,
                            disableHaptics: false,
                            disableTranslation: false,
                        },
                        pushNotifications: {
                            disableLikeMoment: false,
                            disableNewMemory: false,
                            disableAddToMemory: false,
                            disableFollowUser: false,
                            disableViewUser: false,
                        },
                    },
                },
                securityInfo: result.securityInfo,
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    error: `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                }
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    /**
     * Handler para sign up
     */
    async signUp(request: SignUpRequest): Promise<AuthResponse> {
        try {
            // Validação com Zod
            const validatedData = SignUpRequestSchema.parse(request)

            const result = await this.signUpUseCase.execute({
                username: validatedData.username,
                password: validatedData.password,
                device: "web" as any,
                termsAccepted: validatedData.termsAccepted,
                metadata: {
                    ipAddress: validatedData.metadata?.ipAddress || "127.0.0.1",
                    userAgent: validatedData.metadata?.userAgent || "unknown",
                    machineId: validatedData.metadata?.machineId || "unknown",
                    timezone: validatedData.metadata?.timezone || "UTC",
                    latitude: validatedData.metadata?.latitude || 0,
                    longitude: validatedData.metadata?.longitude || 0,
                },
            })

            return {
                success: true,
                session: {
                    user: {
                        id: result.user.id,
                        name: result.user.name || "",
                        description: "",
                        username: result.user.username,
                        verified: false,
                        profile_picture: {
                            small_resolution: "",
                            tiny_resolution: "",
                        },
                    },
                    statistics: {
                        total_followers_num: 0,
                        total_likes_num: 0,
                        total_views_num: 0,
                    },
                    account: {
                        jwtToken: `Bearer ${result.token}`,
                        jwtExpiration: process.env.JWT_EXPIRES || "3600",
                        muted: false,
                        unreadNotificationsCount: 0,
                        last_login_at: result.user.lastLogin || new Date(),
                    },
                    preferences: {
                        timezone: -3,
                        language: {
                            appLanguage: "pt",
                            translationLanguage: "pt",
                        },
                        content: {
                            disableAutoplay: false,
                            disableHaptics: false,
                            disableTranslation: false,
                        },
                        pushNotifications: {
                            disableLikeMoment: false,
                            disableNewMemory: false,
                            disableAddToMemory: false,
                            disableFollowUser: false,
                            disableViewUser: false,
                        },
                    },
                },
                securityInfo: result.securityInfo,
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    error: `Erro de validação: ${error.issues.map((e) => e.message).join(", ")}`,
                }
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    /**
     * Handler para logout
     */
    async logout(): Promise<{ success: boolean; message: string }> {
        try {
            // TODO: Implementar logout
            return {
                success: true,
                message: "Logout realizado com sucesso",
            }
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    /**
     * Handler para refresh token
     */
    async refreshToken(): Promise<{ success: boolean; token?: string; error?: string }> {
        try {
            // TODO: Implementar refresh token
            return {
                success: false,
                error: "Refresh token não implementado",
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }

    /**
     * Handler para verificar status da sessão
     */
    async checkSession(): Promise<{ success: boolean; valid?: boolean; error?: string }> {
        try {
            // TODO: Implementar verificação de sessão
            return {
                success: true,
                valid: true,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro interno do servidor",
            }
        }
    }
}
