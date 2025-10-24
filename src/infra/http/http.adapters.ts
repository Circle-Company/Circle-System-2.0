import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { HttpAdapter, HttpRequest, HttpResponse, RouteHandler, RouteOptions } from "./http.type"

/**
 * Interface genérica para adapters
 * Permite converter middlewares de diferentes frameworks para RouteHandler
 */
export interface Adapter {
    adapt(externalMiddleware: any): RouteHandler
}

/**
 * Classe base abstrata para adapters
 * Implementa a lógica comum de conversão
 */
export abstract class BaseAdapter implements Adapter {
    abstract adapt(externalMiddleware: any): RouteHandler

    protected abstract convertRequest(request: HttpRequest): any
    protected abstract convertResponse(response: HttpResponse): any
}

/**
 * Interface genérica para adapters HTTP
 * Define o contrato que todos os adapters HTTP devem implementar
 */
export interface HttpAdapterInterface extends HttpAdapter {
    /**
     * Método para obter informações sobre o adapter
     */
    getAdapterInfo(): {
        name: string
        version: string
        framework: string
    }
}

/**
 * Classe base abstrata para adapters HTTP
 * Implementa lógica comum de conversão de requests/responses
 */
export abstract class BaseHttpAdapter implements HttpAdapterInterface {
    abstract get(path: string, handler: RouteHandler, options?: RouteOptions): void
    abstract post(path: string, handler: RouteHandler, options?: RouteOptions): void
    abstract put(path: string, handler: RouteHandler, options?: RouteOptions): void
    abstract delete(path: string, handler: RouteHandler, options?: RouteOptions): void
    abstract patch(path: string, handler: RouteHandler, options?: RouteOptions): void
    abstract addHook(event: string, handler: RouteHandler): void
    abstract setErrorHandler(
        handler: (error: any, request: HttpRequest, response: HttpResponse) => void,
    ): void
    abstract listen(options: { port: number; host?: string }): Promise<void>
    abstract close(): Promise<void>

    abstract getAdapterInfo(): {
        name: string
        version: string
        framework: string
    }

    /**
     * Converte request externo para HttpRequest interno
     */
    protected abstract convertRequest(externalRequest: any): HttpRequest

    /**
     * Converte response externo para HttpResponse interno
     */
    protected abstract convertResponse(externalResponse: any): HttpResponse
}

/**
 * Adapter para Fastify
 */
export class FastifyAdapter implements HttpAdapter {
    constructor(private fastify: FastifyInstance) {}

    /**
     * Expõe a instância do Fastify para acesso direto quando necessário
     * Útil para plugins específicos do Fastify como Swagger
     */
    getFastifyInstance(): FastifyInstance {
        return this.fastify
    }

    /**
     * Registra um plugin do Fastify
     */
    async registerPlugin(plugin: any, options?: any): Promise<void> {
        await this.fastify.register(plugin, options)
    }

    get(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.fastify.get(path, {
            preHandler: this.convertPreHandlers(options?.preHandler),
            schema: options?.schema,
            handler: this.convertHandler(handler),
        })
    }

    post(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.fastify.post(path, {
            preHandler: this.convertPreHandlers(options?.preHandler),
            schema: options?.schema,
            handler: this.convertHandler(handler),
        })
    }

    put(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.fastify.put(path, {
            preHandler: this.convertPreHandlers(options?.preHandler),
            schema: options?.schema,
            handler: this.convertHandler(handler),
        })
    }

    delete(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.fastify.delete(path, {
            preHandler: this.convertPreHandlers(options?.preHandler),
            schema: options?.schema,
            handler: this.convertHandler(handler),
        })
    }

    patch(path: string, handler: RouteHandler, options?: RouteOptions): void {
        this.fastify.patch(path, {
            preHandler: this.convertPreHandlers(options?.preHandler),
            schema: options?.schema,
            handler: this.convertHandler(handler),
        })
    }

    addHook(event: string, handler: RouteHandler): void {
        this.fastify.addHook(event as any, async (request: FastifyRequest, reply: FastifyReply) => {
            const httpRequest = this.convertRequest(request)
            const httpResponse = this.convertResponse(reply)
            await handler(httpRequest, httpResponse)
        })
    }

    setErrorHandler(
        handler: (error: any, request: HttpRequest, response: HttpResponse) => void,
    ): void {
        this.fastify.setErrorHandler(
            async (error: any, request: FastifyRequest, reply: FastifyReply) => {
                const httpRequest = this.convertRequest(request)
                const httpResponse = this.convertResponse(reply)
                handler(error, httpRequest, httpResponse)
            },
        )
    }

    async listen(options: { port: number; host?: string }): Promise<void> {
        await this.fastify.listen(options)
    }

    async close(): Promise<void> {
        await this.fastify.close()
    }

    private convertRequest(request: FastifyRequest): HttpRequest {
        const headers: Record<string, string> = {}
        for (const [key, value] of Object.entries(request.headers)) {
            headers[key.toLowerCase()] = Array.isArray(value) ? value[0] : value || ""
        }

        // Processar body multipart/form-data se presente
        let body = request.body
        try {
            if (
                body &&
                typeof body === "object" &&
                headers["content-type"]?.includes("multipart/form-data")
            ) {
                body = this.processMultipartBody(body)
            }
        } catch (error) {
            console.error("Error processing multipart body:", error)
            // Em caso de erro, usar body original
            body = request.body
        }

        return {
            method: request.method,
            url: request.url,
            headers,
            body,
            params: request.params as Record<string, string>,
            query: request.query as Record<string, string>,
            user: (request as any).user,
            ip: request.ip,
            id: request.id,
        }
    }

    /**
     * Processa body de multipart/form-data
     * Converte estruturas do @fastify/multipart para valores simples
     */
    private processMultipartBody(body: any): any {
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return body
        }

        const processedBody: any = {}

        for (const [key, value] of Object.entries(body)) {
            // Verificar se é um campo multipart com propriedade 'value'
            if (value && typeof value === "object" && "value" in value && !("file" in value)) {
                processedBody[key] = (value as any).value
            } else {
                // Manter o valor original (arquivos, strings, números, etc)
                processedBody[key] = value
            }
        }

        return processedBody
    }

    private convertResponse(reply: FastifyReply): HttpResponse {
        const response: HttpResponse = {
            status: (code: number) => {
                reply.status(code)
                return response
            },
            send: (data: any) => {
                reply.send(data)
            },
            header: (name: string, value: string) => {
                reply.header(name, value)
                return response
            },
            statusCode: reply.statusCode,
            elapsedTime: reply.elapsedTime,
        }
        return response
    }

    private convertHandler(handler: RouteHandler) {
        return async (request: FastifyRequest, reply: FastifyReply) => {
            const httpRequest = this.convertRequest(request)
            const httpResponse = this.convertResponse(reply)
            const result = await handler(httpRequest, httpResponse)

            // Se o handler retornar algo, enviar como resposta
            if (result !== undefined && result !== null && !reply.sent) {
                return result
            }
        }
    }

    private convertPreHandlers(preHandlers?: RouteHandler[]) {
        if (!preHandlers) return undefined

        return preHandlers.map((handler) => {
            return async (request: FastifyRequest, reply: FastifyReply) => {
                // Se já enviou resposta, não fazer nada
                if (reply.sent) return

                const httpRequest = this.convertRequest(request)
                const httpResponse = this.convertResponse(reply)

                await handler(httpRequest, httpResponse)

                // ✅ CRÍTICO: Copiar user de volta para o request original do Fastify
                if (httpRequest.user) {
                    ;(request as any).user = httpRequest.user
                }
            }
        })
    }
}

/**
 * Mock adapter para testes
 */
export class MockAdapter implements HttpAdapter {
    private routes: Map<string, { method: string; handler: RouteHandler; options?: RouteOptions }> =
        new Map()
    private hooks: Map<string, RouteHandler[]> = new Map()
    private errorHandler?: (error: any, request: HttpRequest, response: HttpResponse) => void
    private isListening = false

    /**
     * Mock para getFastifyInstance - retorna null em modo de teste
     */
    getFastifyInstance(): any {
        return null
    }

    /**
     * Mock para registerPlugin - não faz nada em modo de teste
     */
    async registerPlugin(plugin: any, options?: any): Promise<void> {
        // Mock - não registra plugins em modo de teste
        return Promise.resolve()
    }

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
        this.isListening = true
    }

    async close(): Promise<void> {
        this.isListening = false
    }

    // Métodos para testes
    getRoutes(): Map<string, { method: string; handler: RouteHandler; options?: RouteOptions }> {
        return this.routes
    }

    getHooks(): Map<string, RouteHandler[]> {
        return this.hooks
    }

    getErrorHandler():
        | ((error: any, request: HttpRequest, response: HttpResponse) => void)
        | undefined {
        return this.errorHandler
    }

    isServerListening(): boolean {
        return this.isListening
    }

    // Simular request para testes
    async simulateRequest(
        method: string,
        path: string,
        requestData: Partial<HttpRequest> = {},
    ): Promise<any> {
        const routeKey = `${method}:${path}`
        const route = this.routes.get(routeKey)

        if (!route) {
            throw new Error(`Route ${method} ${path} not found`)
        }

        const mockRequest: HttpRequest = {
            method,
            url: path,
            headers: {},
            body: null,
            params: {},
            query: {},
            ...requestData,
        }

        const mockResponseData = {
            statusCode: 200,
            data: null,
            headers: {} as Record<string, string>,
        }

        const mockResponse: HttpResponse = {
            status(code: number) {
                mockResponseData.statusCode = code
                return mockResponse
            },
            send(data: any) {
                mockResponseData.data = data
            },
            header(name: string, value: string) {
                mockResponseData.headers[name] = value
                return mockResponse
            },
        }

        if (route.options?.preHandler) {
            for (const preHandler of route.options.preHandler) {
                await preHandler(mockRequest, mockResponse)
            }
        }

        await route.handler(mockRequest, mockResponse)

        return {
            statusCode: mockResponseData.statusCode,
            data: mockResponseData.data,
            headers: mockResponseData.headers,
        }
    }

    // Método inject para compatibilidade com testes do Fastify
    async inject(options: {
        method: string
        url: string
        headers?: Record<string, string>
        payload?: any
    }): Promise<{
        statusCode: number
        json(): any
        headers: Record<string, string>
        rawPayload: Buffer
    }> {
        try {
            const mockRequest: HttpRequest = {
                method: options.method,
                url: options.url,
                headers: options.headers || {},
                body: options.payload || null,
                params: {},
                query: {},
                ip: "127.0.0.1",
                id: `req-${Date.now()}`,
            }

            const mockResponseData = {
                statusCode: 200,
                data: null,
                headers: {} as Record<string, string>,
                rawPayload: null as Buffer | null,
            }

            const mockResponse: HttpResponse = {
                status(code: number) {
                    mockResponseData.statusCode = code
                    return mockResponse
                },
                send(data: any) {
                    mockResponseData.data = data
                    // Se for um Buffer, armazenar também em rawPayload
                    if (Buffer.isBuffer(data)) {
                        mockResponseData.rawPayload = data
                    }
                },
                header(name: string, value: string) {
                    mockResponseData.headers[name.toLowerCase()] = value
                    return mockResponse
                },
                statusCode: mockResponseData.statusCode,
                elapsedTime: 0,
            }

            // Executar hooks onRequest
            const onRequestHooks = this.hooks.get("onRequest") || []
            for (const hook of onRequestHooks) {
                await hook(mockRequest, mockResponse)
            }

            // Verificar se é uma requisição para arquivo estático
            if (options.url.startsWith("/storage/")) {
                const filePath = options.url.replace("/storage/", "")
                const fullPath = require("path").join(process.cwd(), "uploads", filePath)

                // Verificar se o arquivo existe
                if (require("fs").existsSync(fullPath)) {
                    const fs = require("fs")
                    const fileStats = fs.statSync(fullPath)
                    const fileContent = fs.readFileSync(fullPath)

                    // Configurar headers apropriados
                    if (filePath.includes("videos/") || filePath.endsWith(".mp4")) {
                        mockResponse.header("content-type", "video/mp4")
                    } else if (
                        filePath.includes("thumbnails/") ||
                        filePath.endsWith(".jpg") ||
                        filePath.endsWith(".jpeg")
                    ) {
                        mockResponse.header("content-type", "image/jpeg")
                    }
                    mockResponse.header("content-length", String(fileStats.size))
                    mockResponse.status(200)
                    mockResponse.send(fileContent)

                    // Executar hooks onSend
                    const onSendHooks = this.hooks.get("onSend") || []
                    for (const hook of onSendHooks) {
                        await hook(mockRequest, mockResponse, fileContent)
                    }

                    return {
                        statusCode: mockResponseData.statusCode,
                        json: () => mockResponseData.data,
                        headers: mockResponseData.headers,
                        rawPayload: fileContent,
                    }
                } else {
                    // Arquivo não encontrado
                    mockResponse.status(404)
                    mockResponse.send({
                        statusCode: 404,
                        error: "Not Found",
                        message: `File not found: ${options.url}`,
                        timestamp: new Date().toISOString(),
                        path: options.url,
                    })

                    return {
                        statusCode: 404,
                        json: () => mockResponseData.data,
                        headers: mockResponseData.headers,
                        rawPayload: Buffer.from(""),
                    }
                }
            }

            // Buscar e executar a rota
            const routeKey = `${options.method}:${options.url}`
            const route = this.routes.get(routeKey)

            if (!route) {
                // Se a rota não existir, retornar 404 diretamente
                mockResponse.status(404)
                mockResponse.send({
                    statusCode: 404,
                    error: "Not Found",
                    message: `Route ${options.method} ${options.url} not found`,
                    timestamp: new Date().toISOString(),
                    path: options.url,
                })
            } else {
                // Executar preHandlers se existirem
                if (route.options?.preHandler) {
                    for (const preHandler of route.options.preHandler) {
                        await preHandler(mockRequest, mockResponse)
                    }
                }

                // Executar handler da rota
                await route.handler(mockRequest, mockResponse)
            }

            // Executar hooks onSend
            const onSendHooks = this.hooks.get("onSend") || []
            for (const hook of onSendHooks) {
                await hook(mockRequest, mockResponse, mockResponseData.data)
            }

            return {
                statusCode: mockResponseData.statusCode,
                json: () => mockResponseData.data,
                headers: mockResponseData.headers,
                rawPayload: mockResponseData.rawPayload || Buffer.from(""),
            }
        } catch (error) {
            // Se a rota não existir, retornar 404
            if (error instanceof Error && error.message.includes("not found")) {
                return {
                    statusCode: 404,
                    json: () => ({
                        statusCode: 404,
                        error: "Not Found",
                        message: `Route ${options.method} ${options.url} not found`,
                        timestamp: new Date().toISOString(),
                        path: options.url,
                    }),
                    headers: {},
                    rawPayload: Buffer.from(""),
                }
            }
            throw error
        }
    }
}

/**
 * Adapter para converter middlewares do Fastify para RouteHandler
 */
export class FastifyRouteHandlerAdapter {
    /**
     * Converte middleware do Fastify para RouteHandler
     */
    static adapt(
        fastifyMiddleware: (request: FastifyRequest, reply: FastifyReply) => Promise<void>,
    ): RouteHandler {
        return async (request: HttpRequest, response: HttpResponse) => {
            const fastifyRequest = this.convertToFastifyRequest(request)
            const fastifyReply = this.convertToFastifyReply(response)
            await fastifyMiddleware(fastifyRequest, fastifyReply)
        }
    }

    /**
     * Converte HttpRequest para FastifyRequest (mock)
     */
    private static convertToFastifyRequest(request: HttpRequest): FastifyRequest {
        const fastifyHeaders: any = {}
        for (const [key, value] of Object.entries(request.headers)) {
            fastifyHeaders[key] = value
            fastifyHeaders[key.toLowerCase()] = value
        }

        return {
            method: request.method,
            url: request.url,
            headers: fastifyHeaders,
            body: request.body,
            params: request.params,
            query: request.query,
            user: request.user,
            id: request.id || `req-${Date.now()}`,
            ip: request.ip || "127.0.0.1",
            raw: {} as any,
            log: console as any,
            server: {} as any,
            hostname: "localhost",
            protocol: "http",
            is: () => false,
            socket: {} as any,
            connection: {} as any,
            context: {} as any,
        } as unknown as FastifyRequest
    }

    /**
     * Converte HttpResponse para FastifyReply (mock)
     */
    private static convertToFastifyReply(response: HttpResponse): FastifyReply {
        let statusCode = 200
        let sent = false

        return {
            status: (code: number) => {
                statusCode = code
                response.status(code)
                return this.convertToFastifyReply(response)
            },
            send: (data: any) => {
                if (!sent) {
                    sent = true
                    response.status(statusCode)
                    response.send(data)
                }
            },
            header: (name: string, value: string) => {
                response.header(name, value)
                return this.convertToFastifyReply(response)
            },
            statusCode,
            sent,
            raw: {} as any,
            log: console as any,
            server: {} as any,
            request: {} as any,
            context: {} as any,
            hijacked: false,
        } as unknown as FastifyReply
    }
}
