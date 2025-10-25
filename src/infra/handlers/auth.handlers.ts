import { SecurityInfo, SignInOutputDto, SignInputDto } from "@/domain/auth/auth.dtos"

/**
 * Auth HTTP Handlers - Handlers HTTP para autenticação
 *
 * @author Circle System Team
 * @version 1.0.0
 */
import { RefreshTokenUseCase } from "@/application/auth/refresh.token.use.case"
import { SignInUseCase } from "@/application/auth/signin.use.case"
import { SignUpUseCase } from "@/application/auth/signup.use.case"
import { z } from "zod"

export interface SignInRequest extends SignInputDto {}
export interface SignUpRequest extends SignInputDto {}
export interface RefreshTokenRequest {
    token: string
}

interface AuthResponse {
    success: boolean
    session?: SignInOutputDto
    securityInfo?: SecurityInfo
    error?: string
}

export class AuthHandlers {
    constructor(
        private readonly signInUseCase: SignInUseCase,
        private readonly signUpUseCase: SignUpUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
    ) {}

    /**
     * Handler para sign in
     */
    async signIn(request: SignInRequest): Promise<AuthResponse> {
        try {
            const session = await this.signInUseCase.execute(request)

            if (!session.user) {
                return {
                    success: false,
                    error: "Internal server error: user data not found",
                }
            }

            return {
                success: true,
                session: session,
                securityInfo: session.securityInfo,
            }
        } catch (error) {
            console.error("❌ Erro no signIn handler:", error)
            console.error("📍 Stack:", (error as any)?.stack)

            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
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
            const result = await this.signUpUseCase.execute(request)

            if (!result.user) {
                return {
                    success: false,
                    error: "Internal server error: user data not found",
                }
            }

            const sessionData: AuthResponse["session"] = {
                user: result.user,
                metrics: result.metrics,
                status: result.status,
                terms: result.terms,
                preferences: result.preferences,
                token: result.token,
                expiresIn: result.expiresIn,
            }

            return {
                success: true,
                session: sessionData,
                securityInfo: result.securityInfo,
            }
        } catch (error) {
            console.error("Error in signup handler:", error)
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
                message: "Logout successful",
            }
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }

    /**
     * Handler para refresh token
     */
    async refreshToken(request: RefreshTokenRequest): Promise<{
        success: boolean
        token?: string
        expiresIn?: number
        user?: {
            id: string
            username: string
            level: string
        }
        error?: string
    }> {
        try {
            const result = await this.refreshTokenUseCase.execute({
                token: request.token,
            })

            return {
                success: true,
                token: result.token,
                expiresIn: result.expiresIn,
                user: result.user,
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            }
        }
    }
}
