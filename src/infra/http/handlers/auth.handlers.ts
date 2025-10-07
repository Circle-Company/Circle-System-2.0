/**
 * Auth HTTP Handlers - Handlers HTTP para autenticação
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { circleTextLibrary, parseTimezone } from "@/shared"

import { SignInUseCase } from "@/application/auth/signin.use.case"
import { SignUpUseCase } from "@/application/auth/signup.use.case"
import { Device } from "@/domain/auth"
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
            const result = await this.signInUseCase.execute({
                username: request.username,
                password: request.password,
                device: Device.MOBILE,
                securityData: {
                    ipAddress: request.metadata?.ipAddress || "127.0.0.1",
                    userAgent: request.metadata?.userAgent || "unknown",
                    machineId: request.metadata?.machineId || "unknown",
                    timezone: request.metadata?.timezone || "UTC",
                    latitude: request.metadata?.latitude,
                    longitude: request.metadata?.longitude,
                },
            })

            if (!result.user) {
                console.error("Handler signin - result.user é undefined!")
                return {
                    success: false,
                    error: "Erro interno: dados do usuário não encontrados",
                }
            }

            const sessionData: AuthResponse["session"] = {
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
                    jwtExpiration: result.expiresIn.toString(),
                    muted: false,
                    unreadNotificationsCount: 0,
                    last_login_at: circleTextLibrary.transform.timezone.UTCToLocal(
                        result.user.lastLogin || new Date(),
                    ),
                },
                preferences: {
                    timezone: parseTimezone(request.metadata?.timezone || "UTC"),
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
            }

            return {
                success: true,
                session: sessionData,
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
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }

    /**
     * Handler para sign up
     */
    async signUp(request: SignUpRequest): Promise<AuthResponse> {
        try {
            const result = await this.signUpUseCase.execute({
                username: request.username,
                password: request.password,
                device: Device.MOBILE,
                termsAccepted: request.termsAccepted,
                appTimezone: request.metadata?.timezone || "UTC",
                metadata: {
                    ipAddress: request.metadata?.ipAddress || "127.0.0.1",
                    userAgent: request.metadata?.userAgent || "unknown",
                    machineId: request.metadata?.machineId || "unknown",
                    timezone: request.metadata?.timezone || "UTC",
                    latitude: request.metadata?.latitude || 0,
                    longitude: request.metadata?.longitude || 0,
                },
            })

            if (!result.user) {
                return {
                    success: false,
                    error: "Erro interno: dados do usuário não encontrados",
                }
            }

            const sessionData: AuthResponse["session"] = {
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
                    jwtExpiration: result.expiresIn.toString(),
                    muted: false,
                    unreadNotificationsCount: 0,
                    last_login_at:
                        circleTextLibrary.transform.timezone.result.user.lastLogin || new Date(),
                },
                preferences: {
                    timezone: parseTimezone(request.metadata?.timezone),
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
            }

            return {
                success: true,
                session: sessionData,
            }
        } catch (error) {
            console.error("Erro no signup handler:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
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
}
