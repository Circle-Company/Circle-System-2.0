/**
 * Auth Controller - Controlador de autenticação refatorado
 *
 * @author Circle System Team
 * @version 2.0.0
 */

import {
    AuthHandlers,
    RefreshTokenRequest,
    SignInRequest,
    SignUpRequest,
} from "@/infra/handlers/auth.handlers"

export class AuthController {
    constructor(private readonly authHandlers: AuthHandlers) {}

    /**
     * Realiza sign in do usuário
     */
    async signIn(signData: SignInRequest) {
        return await this.authHandlers.signIn(signData)
    }

    /**
     * Realiza sign up do usuário
     */
    async signUp(signData: SignUpRequest) {
        return await this.authHandlers.signUp(signData)
    }

    /**
     * Realiza logout do usuário
     */
    async logout() {
        return await this.authHandlers.logout()
    }

    /**
     * Renova o token de acesso
     */
    async refreshToken(request: RefreshTokenRequest) {
        return await this.authHandlers.refreshToken(request)
    }
}
