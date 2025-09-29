import { FastifyAdapter, MockAdapter } from "../http.adapters"
import { HttpFactory, createHttp } from "../http.factory"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock do Fastify
const mockFastifyInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    addHook: vi.fn(),
    setErrorHandler: vi.fn(),
    listen: vi.fn(),
    close: vi.fn(),
}

describe("HTTP Factory", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("HttpFactory", () => {
        it("should create FastifyAdapter", () => {
            const adapter = HttpFactory.createFastifyAdapter(mockFastifyInstance as any)

            expect(adapter).toBeInstanceOf(FastifyAdapter)
        })

        it("should create MockAdapter", () => {
            const adapter = HttpFactory.createMockAdapter()

            expect(adapter).toBeInstanceOf(MockAdapter)
        })

        it("should create adapter by type - fastify", () => {
            const adapter = HttpFactory.create("fastify", mockFastifyInstance as any)

            expect(adapter).toBeInstanceOf(FastifyAdapter)
        })

        it("should create adapter by type - mock", () => {
            const adapter = HttpFactory.create("mock")

            expect(adapter).toBeInstanceOf(MockAdapter)
        })

        it("should throw error for unknown adapter type", () => {
            expect(() => {
                HttpFactory.create("unknown" as any)
            }).toThrow("Unknown adapter type: unknown")
        })

        it("should throw error when fastify instance is not provided", () => {
            expect(() => {
                HttpFactory.create("fastify")
            }).toThrow("Fastify instance is required for fastify adapter")
        })

        it("should create adapter for test environment", () => {
            const adapter = HttpFactory.createForEnvironment("test")

            expect(adapter).toBeInstanceOf(MockAdapter)
        })

        it("should create adapter for production environment", () => {
            const adapter = HttpFactory.createForEnvironment(
                "production",
                mockFastifyInstance as any,
            )

            expect(adapter).toBeInstanceOf(FastifyAdapter)
        })

        it("should create adapter for development environment", () => {
            const adapter = HttpFactory.createForEnvironment(
                "development",
                mockFastifyInstance as any,
            )

            expect(adapter).toBeInstanceOf(FastifyAdapter)
        })
    })

    describe("createHttp utilities", () => {
        it("should create production adapter", () => {
            const adapter = createHttp.production(mockFastifyInstance as any)

            expect(adapter).toBeInstanceOf(FastifyAdapter)
        })

        it("should create test adapter", () => {
            const adapter = createHttp.test()

            expect(adapter).toBeInstanceOf(MockAdapter)
        })

        it("should create adapter for test environment", () => {
            const adapter = createHttp.forEnvironment("test")

            expect(adapter).toBeInstanceOf(MockAdapter)
        })

        it("should create adapter for production environment", () => {
            const adapter = createHttp.forEnvironment("production", mockFastifyInstance as any)

            expect(adapter).toBeInstanceOf(FastifyAdapter)
        })

        it("should create adapter for development environment", () => {
            const adapter = createHttp.forEnvironment("development", mockFastifyInstance as any)

            expect(adapter).toBeInstanceOf(FastifyAdapter)
        })
    })

    describe("Adapter functionality", () => {
        it("should register routes on FastifyAdapter", () => {
            const adapter = HttpFactory.createFastifyAdapter(mockFastifyInstance as any)
            const handler = async (request: any, response: any) => {
                response.status(200).send({ message: "Hello" })
            }

            adapter.get("/test", handler)

            expect(mockFastifyInstance.get).toHaveBeenCalledWith("/test", {
                preHandler: undefined,
                schema: undefined,
                handler: expect.any(Function),
            })
        })

        it("should register routes on MockAdapter", () => {
            const adapter = HttpFactory.createMockAdapter()
            const handler = async (request: any, response: any) => {
                response.status(200).send({ message: "Hello" })
            }

            adapter.get("/test", handler)

            // MockAdapter stores routes internally
            const routes = (adapter as MockAdapter).getRoutes()
            expect(routes.has("GET:/test")).toBe(true)
        })

        it("should handle hooks on FastifyAdapter", () => {
            const adapter = HttpFactory.createFastifyAdapter(mockFastifyInstance as any)
            const hook = async (request: any, response: any) => {
                // Hook logic
            }

            adapter.addHook("onRequest", hook)

            expect(mockFastifyInstance.addHook).toHaveBeenCalledWith(
                "onRequest",
                expect.any(Function),
            )
        })

        it("should handle error handler on FastifyAdapter", () => {
            const adapter = HttpFactory.createFastifyAdapter(mockFastifyInstance as any)
            const errorHandler = (error: any, request: any, response: any) => {
                response.status(500).send({ error: error.message })
            }

            adapter.setErrorHandler(errorHandler)

            expect(mockFastifyInstance.setErrorHandler).toHaveBeenCalledWith(expect.any(Function))
        })

        it("should handle listen on FastifyAdapter", async () => {
            const adapter = HttpFactory.createFastifyAdapter(mockFastifyInstance as any)

            await adapter.listen({ port: 3000 })

            expect(mockFastifyInstance.listen).toHaveBeenCalledWith({ port: 3000 })
        })

        it("should handle close on FastifyAdapter", async () => {
            const adapter = HttpFactory.createFastifyAdapter(mockFastifyInstance as any)

            await adapter.close()

            expect(mockFastifyInstance.close).toHaveBeenCalled()
        })

        it("should handle hooks on MockAdapter", () => {
            const adapter = HttpFactory.createMockAdapter()
            const hook = async (request: any, response: any) => {
                // Hook logic
            }

            adapter.addHook("onRequest", hook)

            const hooks = (adapter as MockAdapter).getHooks()
            expect(hooks.has("onRequest")).toBe(true)
            expect(hooks.get("onRequest")).toContain(hook)
        })

        it("should handle error handler on MockAdapter", () => {
            const adapter = HttpFactory.createMockAdapter()
            const errorHandler = (error: any, request: any, response: any) => {
                response.status(500).send({ error: error.message })
            }

            adapter.setErrorHandler(errorHandler)

            expect((adapter as MockAdapter).getErrorHandler()).toBe(errorHandler)
        })

        it("should handle listen on MockAdapter", async () => {
            const adapter = HttpFactory.createMockAdapter()

            expect((adapter as MockAdapter).isServerListening()).toBe(false)

            await adapter.listen({ port: 3000 })

            expect((adapter as MockAdapter).isServerListening()).toBe(true)
        })

        it("should handle close on MockAdapter", async () => {
            const adapter = HttpFactory.createMockAdapter()

            await adapter.listen({ port: 3000 })
            expect((adapter as MockAdapter).isServerListening()).toBe(true)

            await adapter.close()

            expect((adapter as MockAdapter).isServerListening()).toBe(false)
        })
    })

    describe("Factory edge cases", () => {
        it("should handle multiple adapter creations", () => {
            const adapter1 = HttpFactory.createMockAdapter()
            const adapter2 = HttpFactory.createMockAdapter()

            expect(adapter1).toBeInstanceOf(MockAdapter)
            expect(adapter2).toBeInstanceOf(MockAdapter)
            expect(adapter1).not.toBe(adapter2) // Different instances
        })

        it("should handle fastify adapter with different instances", () => {
            const mockFastify1 = { ...mockFastifyInstance }
            const mockFastify2 = { ...mockFastifyInstance }

            const adapter1 = HttpFactory.createFastifyAdapter(mockFastify1 as any)
            const adapter2 = HttpFactory.createFastifyAdapter(mockFastify2 as any)

            expect(adapter1).toBeInstanceOf(FastifyAdapter)
            expect(adapter2).toBeInstanceOf(FastifyAdapter)
            expect(adapter1).not.toBe(adapter2) // Different instances
        })

        it("should handle createHttp with different environments", () => {
            const testAdapter = createHttp.forEnvironment("test")
            const prodAdapter = createHttp.forEnvironment("production", mockFastifyInstance as any)
            const devAdapter = createHttp.forEnvironment("development", mockFastifyInstance as any)

            expect(testAdapter).toBeInstanceOf(MockAdapter)
            expect(prodAdapter).toBeInstanceOf(FastifyAdapter)
            expect(devAdapter).toBeInstanceOf(FastifyAdapter)
        })

        it("should handle createHttp production without fastify instance", () => {
            expect(() => {
                createHttp.production(undefined as any)
            }).toThrow("Fastify instance is required for fastify adapter")
        })

        it("should handle createHttp forEnvironment without fastify instance for non-test", () => {
            expect(() => {
                createHttp.forEnvironment("production")
            }).toThrow("Fastify instance is required for fastify adapter")
        })
    })
})
