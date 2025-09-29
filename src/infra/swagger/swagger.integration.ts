// ===== SWAGGER INTEGRATION =====

import { FastifyInstance } from "fastify"
import { swaggerConfig } from "./swagger.config"

export async function registerSwagger(fastify: FastifyInstance) {
    // Register Swagger
    await fastify.register(require("@fastify/swagger"), swaggerConfig.swagger)

    // Register Swagger UI
    await fastify.register(require("@fastify/swagger-ui"), swaggerConfig.swaggerUi)

    // Add route for Swagger documentation
    fastify.get("/docs", async (request, reply) => {
        return reply.redirect("/docs/")
    })

    fastify.log.info("Swagger documentation registered at /docs")
}
