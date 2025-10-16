/**
 * Tipos e interfaces para o sistema de API adapters
 */

/**
 * Interface para arquivos multipart
 */
export interface MultipartFile {
    file?: any // Stream do arquivo
    filename?: string
    encoding?: string
    mimetype?: string
    fieldname?: string
}

export interface HttpRequest {
    method: string
    url: string
    headers: Record<string, string>
    body: any
    params: Record<string, string>
    query: Record<string, string>
    user?: any // Para autenticação
    ip?: string // IP do cliente
    id?: string // ID da requisição
    files?: MultipartFile[] // Arquivos multipart (quando aplicável)
}

export interface HttpResponse {
    status(code: number): HttpResponse
    send(data: any): void
    header(name: string, value: string): HttpResponse
    statusCode?: number // Status code atual
    elapsedTime?: number // Tempo de resposta
}

export interface RouteHandler {
    (request: HttpRequest, response: HttpResponse, payload?: any): Promise<void> | void | any
}

export interface RouteOptions {
    preHandler?: RouteHandler[]
    schema?: any
}

export interface HttpAdapter {
    /**
     * Registrar rota GET
     */
    get(path: string, handler: RouteHandler, options?: RouteOptions): void

    /**
     * Registrar rota POST
     */
    post(path: string, handler: RouteHandler, options?: RouteOptions): void

    /**
     * Registrar rota PUT
     */
    put(path: string, handler: RouteHandler, options?: RouteOptions): void

    /**
     * Registrar rota DELETE
     */
    delete(path: string, handler: RouteHandler, options?: RouteOptions): void

    /**
     * Registrar rota PATCH
     */
    patch(path: string, handler: RouteHandler, options?: RouteOptions): void

    /**
     * Adicionar middleware global
     */
    addHook(event: string, handler: RouteHandler): void

    /**
     * Configurar error handler
     */
    setErrorHandler(
        handler: (error: any, request: HttpRequest, response: HttpResponse) => void,
    ): void

    /**
     * Iniciar servidor
     */
    listen(options: { port: number; host?: string }): Promise<void>

    /**
     * Fechar servidor
     */
    close(): Promise<void>

    /**
     * Obtém a instância nativa do framework (se disponível)
     * Útil para funcionalidades específicas do framework como plugins
     */
    getFastifyInstance?(): any

    /**
     * Registra um plugin específico do framework (se disponível)
     */
    registerPlugin?(plugin: any, options?: any): Promise<void>
}

export type AdapterType = "fastify" | "mock"
