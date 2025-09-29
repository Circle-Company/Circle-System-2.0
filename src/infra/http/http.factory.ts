import { AdapterType, HttpAdapter } from "./http.type"
import { FastifyAdapter, MockAdapter } from "./http.adapters"

/**
 * Factory para criar adapters de API
 */
export class HttpFactory {
    /**
     * Cria um adapter Fastify
     */
    static createFastifyAdapter(fastifyInstance: any): HttpAdapter {
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
    static create(type: AdapterType, fastifyInstance?: any): HttpAdapter {
        switch (type) {
            case "fastify":
                if (!fastifyInstance) {
                    throw new Error("Fastify instance is required for fastify adapter")
                }
                return this.createFastifyAdapter(fastifyInstance)
            case "mock":
                return this.createMockAdapter()
            default:
                throw new Error(`Unknown adapter type: ${type}`)
        }
    }

    /**
     * Cria adapter baseado no ambiente
     */
    static createForEnvironment(environment: string, fastifyInstance?: any): HttpAdapter {
        return environment === "test"
            ? this.createMockAdapter()
            : this.createFastifyAdapter(fastifyInstance)
    }
}

/**
 * Funções utilitárias para criação rápida de adapters
 */
export const createHttp = {
    /**
     * Cria Http para produção (Fastify)
     */
    production: (fastifyInstance: any) => HttpFactory.create("fastify", fastifyInstance),

    /**
     * Cria Http para testes (Mock)
     */
    test: () => HttpFactory.create("mock"),

    /**
     * Cria Http baseada no ambiente
     */
    forEnvironment: (env: string, fastifyInstance?: any) => {
        return env === "test"
            ? HttpFactory.create("mock")
            : HttpFactory.create("fastify", fastifyInstance)
    },
}
