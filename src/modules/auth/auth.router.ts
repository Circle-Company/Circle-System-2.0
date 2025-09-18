import { SignInRequestBody, SignInRequestHeaders } from "./types/auth.router.types"

import { AuthController } from "./auth.controller"
import { FastifyInstance } from "fastify"

export async function authRouter(fastify: FastifyInstance) {
    const authController = new AuthController()

    fastify.post("/signin", async (request, response) => {
        try {
            const headers = request.headers as unknown as SignInRequestHeaders
            const body = request.body as SignInRequestBody

            const data = await authController.signIn({ ...body, ...headers })
            return response.status(200).send(data)
        } catch (error) {
            return response.status(500).send({
                success: false,
                message: "Failed to sign in",
                timestamp: new Date().toISOString(),
                path: request.url,
                error:
                    process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
            })
        }
    })
}
