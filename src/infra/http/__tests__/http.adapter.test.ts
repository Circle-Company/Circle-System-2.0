import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    BaseAdapter,
    BaseHttpAdapter,
    FastifyAdapter,
    FastifyRouteHandlerAdapter,
    MockAdapter,
} from "../http.adapters"
import { HttpRequest, HttpResponse, RouteHandler, RouteOptions } from "../http.type"

// Mock do Fastify
const mockFastifyInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    addHook: vi.fn(),
    setErrorHandler: vi.fn(),
    listen: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
}

// Mock implementation for testing BaseAdapter
class TestAdapter extends BaseAdapter {
    adapt(externalMiddleware: any): RouteHandler {
        return async (request: HttpRequest, response: HttpResponse) => {
            const convertedRequest = this.convertRequest(request)
            const convertedResponse = this.convertResponse(response)
            await externalMiddleware(convertedRequest, convertedResponse)
        }
    }

    protected convertRequest(request: HttpRequest): any {
        return {
            ...request,
            converted: true,
        }
    }

    protected convertResponse(response: HttpResponse): any {
        return {
            ...response,
            converted: true,
        }
    }
}

// Mock implementation for testing BaseHttpAdapter
class TestHttpAdapter extends BaseHttpAdapter {
    private routes: Map<string, { method: string; handler: RouteHandler; options?: RouteOptions }> =
        new Map()
    private hooks: Map<string, RouteHandler[]> = new Map()
    private errorHandler?: (error: any, request: HttpRequest, response: HttpResponse) => void

    get(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.routes.set(`GET:${path}`, { method: "GET", handler, options })
    }

    post(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.routes.set(`POST:${path}`, { method: "POST", handler, options })
    }

    put(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.routes.set(`PUT:${path}`, { method: "PUT", handler, options })
    }

    delete(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.routes.set(`DELETE:${path}`, { method: "DELETE", handler, options })
    }

    patch(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.routes.set(`PATCH:${path}`, { method: "PATCH", handler, options })
    }

    addHook(event: string, handler: RouteHandler): void {
        if (!this.hooks.has(event)) {
            this.hooks.set(event, [])
        }
        this.hooks.get(event)!.push(handler)
    }

    setErrorHandler(
        handler: (error: any, request: HttpRequest, response: HttpResponse) => void,
    ): void {
        this.errorHandler = handler
    }

    async listen(options: { port: number; host?: string }): Promise<void> {
        // Mock implementation
    }

    async close(): Promise<void> {
        // Mock implementation
    }

    getAdapterInfo() {
        return {
            name: "TestAdapter",
            version: "1.0.0",
            framework: "test",
        }
    }

    protected convertRequest(externalRequest: any): HttpRequest {
        return externalRequest
    }

    protected convertResponse(externalResponse: any): HttpResponse {
        return externalResponse
    }

    // Test helpers
    getRoutes() {
        return this.routes
    }

    getHooks() {
        return this.hooks
    }

    getErrorHandler() {
        return this.errorHandler
    }
}

describe("HTTP Adapters", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("BaseAdapter", () => {
        let adapter: TestAdapter
        let mockHttpRequest: HttpRequest
        let mockHttpResponse: HttpResponse
        let mockExternalMiddleware: any

        beforeEach(() => {
            adapter = new TestAdapter()

            mockHttpRequest = {
                method: "GET",
                url: "/test",
                headers: { "content-type": "application/json" },
                body: null,
                params: {},
                query: {},
            }

            mockHttpResponse = {
                status: vi.fn().mockReturnThis(),
                send: vi.fn(),
                header: vi.fn().mockReturnThis(),
            }

            mockExternalMiddleware = vi.fn().mockResolvedValue(undefined)
        })

        it("should implement Adapter interface", () => {
            expect(typeof adapter.adapt).toBe("function")
        })

        it("should adapt external middleware to RouteHandler", () => {
            const routeHandler = adapter.adapt(mockExternalMiddleware)

            expect(typeof routeHandler).toBe("function")
        })

        it("should execute adapted middleware with converted request/response", async () => {
            const routeHandler = adapter.adapt(mockExternalMiddleware)

            await routeHandler(mockHttpRequest, mockHttpResponse)

            expect(mockExternalMiddleware).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: "GET",
                    url: "/test",
                    headers: { "content-type": "application/json" },
                    body: null,
                    params: {},
                    query: {},
                    converted: true,
                }),
                expect.objectContaining({
                    status: expect.any(Function),
                    send: expect.any(Function),
                    header: expect.any(Function),
                    converted: true,
                }),
            )
        })

        it("should handle middleware errors", async () => {
            const error = new Error("Middleware error")
            mockExternalMiddleware.mockRejectedValue(error)

            const routeHandler = adapter.adapt(mockExternalMiddleware)

            await expect(routeHandler(mockHttpRequest, mockHttpResponse)).rejects.toThrow(
                "Middleware error",
            )
        })
    })

    describe("BaseHttpAdapter", () => {
        let adapter: TestHttpAdapter

        beforeEach(() => {
            adapter = new TestHttpAdapter()
        })

        it("should implement HttpAdapterInterface", () => {
            expect(typeof adapter.get).toBe("function")
            expect(typeof adapter.post).toBe("function")
            expect(typeof adapter.put).toBe("function")
            expect(typeof adapter.delete).toBe("function")
            expect(typeof adapter.patch).toBe("function")
            expect(typeof adapter.addHook).toBe("function")
            expect(typeof adapter.setErrorHandler).toBe("function")
            expect(typeof adapter.listen).toBe("function")
            expect(typeof adapter.close).toBe("function")
            expect(typeof adapter.getAdapterInfo).toBe("function")
        })

        it("should register GET routes", () => {
            const handler: RouteHandler = async (request, response) => {
                response.status(200).send({ message: "GET" })
            }

            adapter.get("/test", handler)

            const routes = adapter.getRoutes()
            expect(routes.has("GET:/test")).toBe(true)
            expect(routes.get("GET:/test")?.handler).toBe(handler)
        })

        it("should register POST routes", () => {
            const handler: RouteHandler = async (request, response) => {
                response.status(201).send({ message: "POST" })
            }

            adapter.post("/test", handler)

            const routes = adapter.getRoutes()
            expect(routes.has("POST:/test")).toBe(true)
            expect(routes.get("POST:/test")?.handler).toBe(handler)
        })

        it("should register routes with options", () => {
            const handler: RouteHandler = async (request, response) => {
                response.status(200).send({ message: "With options" })
            }

            const preHandler: RouteHandler = async (request, response) => {
                // Pre-handler logic
            }

            const options: RouteOptions = {
                preHandler: [preHandler],
                schema: {
                    body: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                        },
                    },
                },
            }

            adapter.post("/test", handler, options)

            const routes = adapter.getRoutes()
            const route = routes.get("POST:/test")
            expect(route?.options).toBe(options)
            expect(route?.options?.preHandler).toContain(preHandler)
            expect(route?.options?.schema).toBe(options.schema)
        })

        it("should add hooks", () => {
            const hook: RouteHandler = async (request, response) => {
                // Hook logic
            }

            adapter.addHook("onRequest", hook)

            const hooks = adapter.getHooks()
            expect(hooks.has("onRequest")).toBe(true)
            expect(hooks.get("onRequest")).toContain(hook)
        })

        it("should set error handler", () => {
            const errorHandler = (error: any, request: HttpRequest, response: HttpResponse) => {
                response.status(500).send({ error: error.message })
            }

            adapter.setErrorHandler(errorHandler)

            expect(adapter.getErrorHandler()).toBe(errorHandler)
        })

        it("should provide adapter info", () => {
            const info = adapter.getAdapterInfo()

            expect(info).toEqual({
                name: "TestAdapter",
                version: "1.0.0",
                framework: "test",
            })
        })
    })

    describe("FastifyAdapter", () => {
        let adapter: FastifyAdapter

        beforeEach(() => {
            adapter = new FastifyAdapter(mockFastifyInstance as any)
        })

        it("should register GET routes", () => {
            const handler: RouteHandler = async (request, response) => {
                response.status(200).send({ message: "GET" })
            }

            adapter.get("/test", handler)

            expect(mockFastifyInstance.get).toHaveBeenCalledWith("/test", {
                preHandler: undefined,
                schema: undefined,
                handler: expect.any(Function),
            })
        })

        it("should register POST routes", () => {
            const handler: RouteHandler = async (request, response) => {
                response.status(201).send({ message: "POST" })
            }

            adapter.post("/test", handler)

            expect(mockFastifyInstance.post).toHaveBeenCalledWith("/test", {
                preHandler: undefined,
                schema: undefined,
                handler: expect.any(Function),
            })
        })

        it("should register routes with options", () => {
            const handler: RouteHandler = async (request, response) => {
                response.status(200).send({ message: "With options" })
            }

            const preHandler: RouteHandler = async (request, response) => {
                // Pre-handler logic
            }

            const options = {
                preHandler: [preHandler],
                schema: {
                    body: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                        },
                    },
                },
            }

            adapter.post("/test", handler, options)

            expect(mockFastifyInstance.post).toHaveBeenCalledWith("/test", {
                preHandler: expect.any(Array),
                schema: options.schema,
                handler: expect.any(Function),
            })
        })

        it("should add hooks", () => {
            const hook: RouteHandler = async (request, response) => {
                // Hook logic
            }

            adapter.addHook("onRequest", hook)

            expect(mockFastifyInstance.addHook).toHaveBeenCalledWith(
                "onRequest",
                expect.any(Function),
            )
        })

        it("should set error handler", () => {
            const errorHandler = (error: any, request: HttpRequest, response: HttpResponse) => {
                response.status(500).send({ error: error.message })
            }

            adapter.setErrorHandler(errorHandler)

            expect(mockFastifyInstance.setErrorHandler).toHaveBeenCalledWith(expect.any(Function))
        })

        it("should listen on specified port", async () => {
            await adapter.listen({ port: 3000 })

            expect(mockFastifyInstance.listen).toHaveBeenCalledWith({ port: 3000 })
        })

        it("should close server", async () => {
            await adapter.close()

            expect(mockFastifyInstance.close).toHaveBeenCalled()
        })
    })

    describe("MockAdapter", () => {
        let adapter: MockAdapter

        beforeEach(() => {
            adapter = new MockAdapter()
        })

        it("should register GET routes", () => {
            const handler: RouteHandler = async (request, response) => {
                response.status(200).send({ message: "GET" })
            }

            adapter.get("/test", handler)

            const routes = adapter.getRoutes()
            expect(routes.has("GET:/test")).toBe(true)
            expect(routes.get("GET:/test")?.handler).toBe(handler)
        })

        it("should register POST routes", () => {
            const handler: RouteHandler = async (request, response) => {
                response.status(201).send({ message: "POST" })
            }

            adapter.post("/test", handler)

            const routes = adapter.getRoutes()
            expect(routes.has("POST:/test")).toBe(true)
            expect(routes.get("POST:/test")?.handler).toBe(handler)
        })

        it("should track listening state", async () => {
            expect(adapter.isServerListening()).toBe(false)

            await adapter.listen({ port: 3000 })

            expect(adapter.isServerListening()).toBe(true)

            await adapter.close()

            expect(adapter.isServerListening()).toBe(false)
        })

        it("should simulate requests", async () => {
            const handler: RouteHandler = async (request, response) => {
                response.status(200).send({ message: "Hello", method: request.method })
            }

            adapter.get("/test", handler)

            const response = await adapter.simulateRequest("GET", "/test")

            expect(response.statusCode).toBe(200)
            expect(response.data).toEqual({ message: "Hello", method: "GET" })
        })

        it("should simulate requests with preHandlers", async () => {
            const preHandler: RouteHandler = async (request, response) => {
                response.header("x-custom", "test")
            }

            const handler: RouteHandler = async (request, response) => {
                response.status(200).send({ message: "Hello" })
            }

            adapter.get("/test", handler, { preHandler: [preHandler] })

            const response = await adapter.simulateRequest("GET", "/test")

            expect(response.statusCode).toBe(200)
            expect(response.data).toEqual({ message: "Hello" })
            expect(response.headers["x-custom"]).toBe("test")
        })

        it("should throw error for non-existent route", async () => {
            await expect(adapter.simulateRequest("GET", "/nonexistent")).rejects.toThrow(
                "Route GET /nonexistent not found",
            )
        })
    })

    describe("FastifyRouteHandlerAdapter", () => {
        let mockHttpRequest: HttpRequest
        let mockHttpResponse: HttpResponse
        let mockFastifyMiddleware: any

        beforeEach(() => {
            mockHttpRequest = {
                method: "GET",
                url: "/test",
                headers: {
                    "content-type": "application/json",
                    authorization: "Bearer token123",
                },
                body: { name: "Test" },
                params: { id: "123" },
                query: { page: "1" },
                user: { id: "user-123" },
            }

            mockHttpResponse = {
                status: vi.fn().mockReturnThis(),
                send: vi.fn(),
                header: vi.fn().mockReturnThis(),
            }

            mockFastifyMiddleware = vi.fn().mockResolvedValue(undefined)
        })

        it("should adapt Fastify middleware to RouteHandler", () => {
            const routeHandler = FastifyRouteHandlerAdapter.adapt(mockFastifyMiddleware)

            expect(typeof routeHandler).toBe("function")
        })

        it("should execute adapted middleware", async () => {
            const routeHandler = FastifyRouteHandlerAdapter.adapt(mockFastifyMiddleware)

            await routeHandler(mockHttpRequest, mockHttpResponse)

            expect(mockFastifyMiddleware).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: "GET",
                    url: "/test",
                    headers: expect.objectContaining({
                        "content-type": "application/json",
                        authorization: "Bearer token123",
                    }),
                    body: { name: "Test" },
                    params: { id: "123" },
                    query: { page: "1" },
                    user: { id: "user-123" },
                }),
                expect.objectContaining({
                    status: expect.any(Function),
                    send: expect.any(Function),
                    header: expect.any(Function),
                }),
            )
        })

        it("should preserve headers case-insensitive", async () => {
            const routeHandler = FastifyRouteHandlerAdapter.adapt(mockFastifyMiddleware)

            await routeHandler(mockHttpRequest, mockHttpResponse)

            const fastifyRequest = mockFastifyMiddleware.mock.calls[0][0]

            expect(fastifyRequest.headers["content-type"]).toBe("application/json")
            expect(fastifyRequest.headers["authorization"]).toBe("Bearer token123")
        })

        it("should handle response methods correctly", async () => {
            const routeHandler = FastifyRouteHandlerAdapter.adapt(mockFastifyMiddleware)

            await routeHandler(mockHttpRequest, mockHttpResponse)

            const fastifyReply = mockFastifyMiddleware.mock.calls[0][1]

            // Test status method
            fastifyReply.status(201)
            expect(mockHttpResponse.status).toHaveBeenCalledWith(201)

            // Test send method
            fastifyReply.send({ message: "Hello" })
            expect(mockHttpResponse.send).toHaveBeenCalledWith({ message: "Hello" })

            // Test header method
            fastifyReply.header("x-custom", "value")
            expect(mockHttpResponse.header).toHaveBeenCalledWith("x-custom", "value")
        })

        it("should handle middleware errors", async () => {
            const error = new Error("Middleware error")
            mockFastifyMiddleware.mockRejectedValue(error)

            const routeHandler = FastifyRouteHandlerAdapter.adapt(mockFastifyMiddleware)

            await expect(routeHandler(mockHttpRequest, mockHttpResponse)).rejects.toThrow(
                "Middleware error",
            )
        })

        it("should include Fastify-specific properties", async () => {
            const routeHandler = FastifyRouteHandlerAdapter.adapt(mockFastifyMiddleware)

            await routeHandler(mockHttpRequest, mockHttpResponse)

            const fastifyRequest = mockFastifyMiddleware.mock.calls[0][0]

            expect(fastifyRequest.id).toMatch(/^req-\d+$/)
            expect(fastifyRequest.ip).toBe("127.0.0.1")
            expect(fastifyRequest.hostname).toBe("localhost")
            expect(fastifyRequest.protocol).toBe("http")
        })

        it("should include Fastify reply properties", async () => {
            const routeHandler = FastifyRouteHandlerAdapter.adapt(mockFastifyMiddleware)

            await routeHandler(mockHttpRequest, mockHttpResponse)

            const fastifyReply = mockFastifyMiddleware.mock.calls[0][1]

            expect(fastifyReply.statusCode).toBe(200)
            expect(fastifyReply.sent).toBe(false)
            expect(fastifyReply.hijacked).toBe(false)
        })

        it("should handle empty headers", async () => {
            const requestWithEmptyHeaders: HttpRequest = {
                ...mockHttpRequest,
                headers: {},
            }

            const routeHandler = FastifyRouteHandlerAdapter.adapt(mockFastifyMiddleware)

            await routeHandler(requestWithEmptyHeaders, mockHttpResponse)

            const fastifyRequest = mockFastifyMiddleware.mock.calls[0][0]
            expect(fastifyRequest.headers).toEqual({})
        })

        it("should handle null body", async () => {
            const requestWithNullBody: HttpRequest = {
                ...mockHttpRequest,
                body: null,
            }

            const routeHandler = FastifyRouteHandlerAdapter.adapt(mockFastifyMiddleware)

            await routeHandler(requestWithNullBody, mockHttpResponse)

            const fastifyRequest = mockFastifyMiddleware.mock.calls[0][0]
            expect(fastifyRequest.body).toBeNull()
        })
    })
})
