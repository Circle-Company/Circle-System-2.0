import { FastifyAdapter, MockAdapter } from "./http.adapters"
import { AdapterType, HttpAdapter } from "./http.type"
import Fastify from "fastify"
import multipart from "@fastify/multipart"

/**
 * Configuração HTTP genérica
 */
export interface HttpConfig {
    port: number
    host: string
    environment: string
    logging: boolean
    requestIdHeader?: string
    requestIdLogLabel?: string
    genReqId?: () => string
}

/**
 * Factory para criar adapters de API
 */
export class HttpFactory {
    /**
     * Cria um adapter Fastify
     */
    static createFastifyAdapter(config: HttpConfig | any): HttpAdapter {
        // Se for uma instância do Fastify, usar diretamente
        if (config && typeof config.listen === "function") {
            return new FastifyAdapter(config)
        }

        // Se for configuração, criar instância do Fastify internamente
        const fastifyInstance = Fastify({
            logger: config.logging ? { level: "info" } : false,
            disableRequestLogging: !config.logging,
            requestIdHeader: config.requestIdHeader || "x-request-id",
            requestIdLogLabel: config.requestIdLogLabel || "reqId",
            genReqId:
                config.genReqId ||
                (() => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
            schemaErrorFormatter: (errors: any[], dataVar: string) => {
                return new Error(
                    `Validation failed for ${dataVar}: ${errors.map((e) => e.message).join(", ")}`,
                )
            },
            ajv: {
                customOptions: {
                    strict: false,
                    removeAdditional: false,
                    useDefaults: true,
                    coerceTypes: false,
                },
            },
            bodyLimit: 500 * 1024 * 1024, // 500MB para body size (vídeos grandes)
        })

        // Registrar plugin multipart para processar form-data
        fastifyInstance.register(multipart, {
            limits: {
                fileSize: 500 * 1024 * 1024, // 500MB para arquivos de vídeo
                files: 10,
                fieldSize: 10 * 1024 * 1024, // 10MB para campos de texto
                headerPairs: 2000, // Mais headers para multipart
            },
            attachFieldsToBody: true,
            sharedSchemaId: "MultipartFileType",
        })

        return new FastifyAdapter(fastifyInstance)
    }

    /**
     * Cria um adapter Mock para testes
     */
    static createMockAdapter(): HttpAdapter {
        return new MockAdapter()
    }

    /**
     * Cria adapter baseado no tipo especificado
     */
    static create(type: AdapterType, config?: HttpConfig | any): HttpAdapter {
        switch (type) {
            case "fastify":
                return this.createFastifyAdapter(config || {})
            case "mock":
                return this.createMockAdapter()
            default:
                throw new Error(`Unknown adapter type: ${type}`)
        }
    }

    /**
     * Cria adapter baseado no ambiente
     */
    static createForEnvironment(environment: string, config?: HttpConfig | any): HttpAdapter {
        return environment === "test"
            ? this.createMockAdapter()
            : this.createFastifyAdapter(config || {})
    }
}

/**
 * Funções utilitárias para criação rápida de adapters
 */
export const createHttp = {
    /**
     * Cria Http para produção (Fastify)
     */
    production: (config: HttpConfig | any) => HttpFactory.create("fastify", config),

    /**
     * Cria Http para testes (Mock)
     */
    test: () => HttpFactory.create("mock"),

    /**
     * Cria Http baseada no ambiente
     */
    forEnvironment: (env: string, config?: HttpConfig | any) => {
        return env === "test" ? HttpFactory.create("mock") : HttpFactory.create("fastify", config)
    },
}
