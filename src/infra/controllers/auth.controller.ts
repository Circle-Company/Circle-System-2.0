/**
 * Auth Controller - Controlador de autenticação refatorado
 *
 * @author Circle System Team
 * @version 2.0.0
 */
import { SignRequest } from "@/domain/auth"
import { AuthHandlers } from "@/infra/http/handlers/auth.handlers"

interface SignInRequest extends SignRequest {}
interface SignUpRequest extends SignRequest {}
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
    async refreshToken() {
        return await this.authHandlers.refreshToken()
    }
}
