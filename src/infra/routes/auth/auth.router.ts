import { signInSchema, signUpSchema } from "../../swagger/schemas/auth.schemas"

import { AuthFactory } from "@/infra/factories/auth.factory"
import { HttpAdapter } from "../../http/http.type"

export class AuthRouter {
    constructor(private api: HttpAdapter) {}

    /**
     * Schemas de validação para as rotas
     */
    private get schemas() {
        return {
            signInSchema,
            signUpSchema,
        }
    }

    /**
     * Registra todas as rotas de usuário
     */
    register(): void {
        this.registerSignIn()
        this.registerSignUp()
    }

    /**
     * POST /signin - Login
     */
    private registerSignIn(): void {
        const authController = AuthFactory.getAuthController()
        this.api.post("/signin", authController.signIn.bind(authController), {
            schema: {
                ...this.schemas.signInSchema,
                tags: ["Authentication"],
                summary: "Fazer login",
                description: "Autentica um usuário no sistema",
            },
        })
    }

    /**
     * POST /signup - Sign up
     */
    private registerSignUp(): void {
        const authController = AuthFactory.getAuthController()
        this.api.post("/signup", authController.signUp.bind(authController), {
            schema: {
                ...this.schemas.signUpSchema,
                tags: ["Authentication"],
                summary: "Criar conta",
                description: "Registra um novo usuário no sistema",
            },
        })
    }
}

/**
 * Função de compatibilidade para inicialização das rotas
 */
export async function Router(api: HttpAdapter): Promise<void> {
    const routes = new AuthRouter(api)
    routes.register()
}
