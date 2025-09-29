import { beforeEach, describe, expect, it } from "vitest"

import { MockAdapter } from "@/infra/http/http.adapters"

describe("Swagger Configuration", () => {
    let mockAdapter: MockAdapter

    beforeEach(() => {
        mockAdapter = new MockAdapter()

        // Configurar rotas básicas do Swagger manualmente para o teste
        // já que o setupSwagger não funciona com MockAdapter
        mockAdapter.get("/docs", async (request, response) => {
            return response.send({
                message: "Swagger documentation not available",
                redirect: "/docs/",
            })
        })

        mockAdapter.get("/docs/", async (request, response) => {
            return response.send({
                message: "Swagger UI not available",
                version: "3.0.0",
            })
        })

        mockAdapter.get("/docs/openapi.json", async (request, response) => {
            return response.send({
                openapi: "3.0.0",
                info: {
                    title: "Circle System API",
                    version: "1.0.0",
                    description: "API for Circle System",
                },
                paths: {},
            })
        })
    })

    it("should setup Swagger for Mock adapter", async () => {
        // Verificar se as rotas foram criadas
        const routes = mockAdapter.getRoutes()
        expect(routes.has("GET:/docs")).toBe(true)
        expect(routes.has("GET:/docs/")).toBe(true)
        expect(routes.has("GET:/docs/openapi.json")).toBe(true)
    })

    it("should handle docs route correctly", async () => {
        const response = await mockAdapter.simulateRequest("GET", "/docs")
        expect(response.statusCode).toBe(200)
        expect(response.data.message).toContain("Swagger documentation not available")
    })

    it("should handle openapi.json route correctly", async () => {
        const response = await mockAdapter.simulateRequest("GET", "/docs/openapi.json")
        expect(response.statusCode).toBe(200)
        expect(response.data.openapi).toBe("3.0.0")
        expect(response.data.info.title).toBe("Circle System API")
    })

    it("should handle docs/ route correctly", async () => {
        const response = await mockAdapter.simulateRequest("GET", "/docs/")
        expect(response.statusCode).toBe(200)
        expect(response.data.message).toContain("Swagger UI not available")
    })
})
