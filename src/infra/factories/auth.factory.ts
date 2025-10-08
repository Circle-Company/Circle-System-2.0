import { SignInUseCase, SignUpUseCase } from "@/application/auth"
import { ProcessSignRequest } from "@/application/auth/process.sign.request"
import { DatabaseAdapter, DatabaseAdapterFactory } from "@/infra/database/adapter"

import { AuthLogRepository } from "@/domain/auth"
import { UserRepository } from "@/domain/user"
import { AuthController } from "@/infra/controllers/auth.controller"
import { AuthHandlers } from "@/infra/http/handlers/auth.handlers"

/**
 * Factory para criar instâncias do controller de autenticação
 */
export class AuthFactory {
    private static authController: AuthController | null = null

    static createAuthLogRepository(database: DatabaseAdapter): AuthLogRepository {
        return new AuthLogRepository(database)
    }

    static getAuthController(): AuthController {
        if (!this.authController) {
            console.log("Criando AuthController...")
            const database = DatabaseAdapterFactory.createForEnvironment(
                process.env.NODE_ENV || "development",
            )
            const userRepository = new UserRepository(database)
            const authLogRepository = new AuthLogRepository(database)

            // ✅ Criar ProcessSignRequest para processamento de segurança
            const processSignRequest = new ProcessSignRequest()

            // ✅ Passar processSignRequest para os use cases
            const signInUseCase = new SignInUseCase(
                userRepository,
                authLogRepository,
                processSignRequest,
            )
            const signUpUseCase = new SignUpUseCase(
                userRepository,
                authLogRepository,
                processSignRequest,
            )

            const authHandlers = new AuthHandlers(signInUseCase, signUpUseCase)
            this.authController = new AuthController(authHandlers)
            console.log("AuthController criado com sucesso")
        } else {
            console.log("AuthController já existe, reutilizando")
        }
        return this.authController
    }
}
