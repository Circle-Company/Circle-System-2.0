import { DatabaseAdapter, DatabaseAdapterFactory } from "@/infra/database/adapter"

import { SignInUseCase } from "@/application/auth"
import { AuthLogRepository } from "@/domain/auth"
import { UserRepository } from "@/domain/user"
import { AuthController } from "@/infra/controllers/auth.controller"

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
            const database = DatabaseAdapterFactory.createForEnvironment(
                process.env.NODE_ENV || "development",
            )
            const userRepository = new UserRepository(database)
            const authLogRepository = new AuthLogRepository(database)
            const signInUseCase = new SignInUseCase(userRepository, authLogRepository)
            this.authController = new AuthController()
        }
        return this.authController
    }
}
