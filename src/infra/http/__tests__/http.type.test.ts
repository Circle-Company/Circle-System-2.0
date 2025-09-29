import { AdapterType, HttpRequest, HttpResponse, RouteHandler, RouteOptions } from "../http.type"
import { describe, expect, it } from "vitest"

describe("HTTP Types", () => {
    describe("HttpRequest", () => {
        it("should have required properties", () => {
            const request: HttpRequest = {
                method: "GET",
                url: "/test",
                headers: { "content-type": "application/json" },
                body: null,
                params: {},
                query: {},
            }

            expect(request.method).toBe("GET")
            expect(request.url).toBe("/test")
            expect(request.headers).toEqual({ "content-type": "application/json" })
            expect(request.body).toBeNull()
            expect(request.params).toEqual({})
            expect(request.query).toEqual({})
        })

        it("should support optional properties", () => {
            const request: HttpRequest = {
                method: "POST",
                url: "/users",
                headers: { "content-type": "application/json" },
                body: { name: "John" },
                params: { id: "123" },
                query: { page: "1" },
                user: { id: "user-123", role: "admin" },
                ip: "192.168.1.1",
                id: "req-123",
            }

            expect(request.user).toEqual({ id: "user-123", role: "admin" })
            expect(request.ip).toBe("192.168.1.1")
            expect(request.id).toBe("req-123")
        })

        it("should handle different HTTP methods", () => {
            const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]

            methods.forEach((method) => {
                const request: HttpRequest = {
                    method,
                    url: "/test",
                    headers: {},
                    body: null,
                    params: {},
                    query: {},
                }

                expect(request.method).toBe(method)
            })
        })

        it("should handle different body types", () => {
            const stringBody: HttpRequest = {
                method: "POST",
                url: "/test",
                headers: {},
                body: "string body",
                params: {},
                query: {},
            }

            const objectBody: HttpRequest = {
                method: "POST",
                url: "/test",
                headers: {},
                body: { key: "value" },
                params: {},
                query: {},
            }

            const arrayBody: HttpRequest = {
                method: "POST",
                url: "/test",
                headers: {},
                body: [1, 2, 3],
                params: {},
                query: {},
            }

            expect(stringBody.body).toBe("string body")
            expect(objectBody.body).toEqual({ key: "value" })
            expect(arrayBody.body).toEqual([1, 2, 3])
        })
    })

    describe("HttpResponse", () => {
        it("should have required methods", () => {
            const response: HttpResponse = {
                status: (code: number) => response,
                send: (data: any) => {},
                header: (name: string, value: string) => response,
            }

            expect(typeof response.status).toBe("function")
            expect(typeof response.send).toBe("function")
            expect(typeof response.header).toBe("function")
        })

        it("should support optional properties", () => {
            const response: HttpResponse = {
                status: (code: number) => response,
                send: (data: any) => {},
                header: (name: string, value: string) => response,
                statusCode: 200,
                elapsedTime: 150,
            }

            expect(response.statusCode).toBe(200)
            expect(response.elapsedTime).toBe(150)
        })

        it("should chain methods correctly", () => {
            let statusCode = 0
            let sentData: any = null
            let headers: Record<string, string> = {}

            const response: HttpResponse = {
                status: (code: number) => {
                    statusCode = code
                    return response
                },
                send: (data: any) => {
                    sentData = data
                },
                header: (name: string, value: string) => {
                    headers[name] = value
                    return response
                },
            }

            response.status(201).header("content-type", "application/json").send({ id: 1 })

            expect(statusCode).toBe(201)
            expect(headers["content-type"]).toBe("application/json")
            expect(sentData).toEqual({ id: 1 })
        })
    })

    describe("RouteHandler", () => {
        it("should accept HttpRequest and HttpResponse", async () => {
            const handler: RouteHandler = async (request: HttpRequest, response: HttpResponse) => {
                expect(request.method).toBe("GET")
                expect(response.status).toBeDefined()
            }

            const mockRequest: HttpRequest = {
                method: "GET",
                url: "/test",
                headers: {},
                body: null,
                params: {},
                query: {},
            }

            const mockResponse: HttpResponse = {
                status: (code: number) => mockResponse,
                send: (data: any) => {},
                header: (name: string, value: string) => mockResponse,
            }

            await handler(mockRequest, mockResponse)
        })

        it("should support optional payload parameter", async () => {
            const handler: RouteHandler = async (
                request: HttpRequest,
                response: HttpResponse,
                payload?: any,
            ) => {
                expect(payload).toBe("test-payload")
            }

            const mockRequest: HttpRequest = {
                method: "GET",
                url: "/test",
                headers: {},
                body: null,
                params: {},
                query: {},
            }

            const mockResponse: HttpResponse = {
                status: (code: number) => mockResponse,
                send: (data: any) => {},
                header: (name: string, value: string) => mockResponse,
            }

            await handler(mockRequest, mockResponse, "test-payload")
        })

        it("should support synchronous handlers", () => {
            const handler: RouteHandler = (request: HttpRequest, response: HttpResponse) => {
                response.status(200).send({ message: "sync" })
            }

            expect(typeof handler).toBe("function")
        })

        it("should support handlers that return values", () => {
            const handler: RouteHandler = (request: HttpRequest, response: HttpResponse) => {
                return { message: "returned" }
            }

            expect(typeof handler).toBe("function")
        })
    })

    describe("RouteOptions", () => {
        it("should support preHandler array", () => {
            const preHandler1: RouteHandler = async (request, response) => {
                // Pre-handler 1
            }

            const preHandler2: RouteHandler = async (request, response) => {
                // Pre-handler 2
            }

            const options: RouteOptions = {
                preHandler: [preHandler1, preHandler2],
            }

            expect(options.preHandler).toHaveLength(2)
            expect(options.preHandler?.[0]).toBe(preHandler1)
            expect(options.preHandler?.[1]).toBe(preHandler2)
        })

        it("should support schema validation", () => {
            const options: RouteOptions = {
                schema: {
                    body: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            age: { type: "number" },
                        },
                        required: ["name"],
                    },
                },
            }

            expect(options.schema).toBeDefined()
            expect(options.schema?.body).toBeDefined()
            expect(options.schema?.body?.type).toBe("object")
        })

        it("should support both preHandler and schema", () => {
            const preHandler: RouteHandler = async (request, response) => {
                // Pre-handler
            }

            const options: RouteOptions = {
                preHandler: [preHandler],
                schema: {
                    params: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                        },
                    },
                },
            }

            expect(options.preHandler).toHaveLength(1)
            expect(options.schema).toBeDefined()
        })

        it("should be optional", () => {
            const options: RouteOptions = {}

            expect(options.preHandler).toBeUndefined()
            expect(options.schema).toBeUndefined()
        })
    })

    describe("AdapterType", () => {
        it("should support fastify type", () => {
            const type: AdapterType = "fastify"

            expect(type).toBe("fastify")
        })

        it("should support mock type", () => {
            const type: AdapterType = "mock"

            expect(type).toBe("mock")
        })

        it("should be a union type", () => {
            const types: AdapterType[] = ["fastify", "mock"]

            expect(types).toContain("fastify")
            expect(types).toContain("mock")
            expect(types).toHaveLength(2)
        })
    })

    describe("Type compatibility", () => {
        it("should be compatible with real implementations", () => {
            // Test that our types work with actual implementations
            const request: HttpRequest = {
                method: "GET",
                url: "/test",
                headers: { "content-type": "application/json" },
                body: null,
                params: { id: "123" },
                query: { page: "1" },
                user: { id: "user-123" },
                ip: "127.0.0.1",
                id: "req-123",
            }

            const response: HttpResponse = {
                status: (code: number) => response,
                send: (data: any) => {},
                header: (name: string, value: string) => response,
                statusCode: 200,
                elapsedTime: 100,
            }

            const handler: RouteHandler = async (req, res) => {
                res.status(200).send({ message: "Hello" })
            }

            const options: RouteOptions = {
                preHandler: [handler],
                schema: {
                    body: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                        },
                    },
                },
            }

            const adapterType: AdapterType = "fastify"

            // All should compile without errors
            expect(request).toBeDefined()
            expect(response).toBeDefined()
            expect(handler).toBeDefined()
            expect(options).toBeDefined()
            expect(adapterType).toBeDefined()
        })
    })
})

