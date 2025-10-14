/**
 * Testes para configuração Bull/Redis
 */

import { describe, expect, it } from "vitest"
import { bullConfig, createRedisClient, testRedisConnection } from "../bull.config"

describe("Bull Configuration", () => {
    describe("bullConfig", () => {
        it("deve ter configuração válida", () => {
            expect(bullConfig).toBeDefined()
            expect(bullConfig.redis).toBeDefined()
            expect(bullConfig.redis.host).toBe("localhost")
            expect(bullConfig.redis.port).toBe(6379)
            expect(bullConfig.defaultJobOptions).toBeDefined()
            expect(bullConfig.defaultJobOptions.attempts).toBe(3)
        })

        it("deve ter opções de retry configuradas", () => {
            expect(bullConfig.defaultJobOptions.backoff).toBeDefined()
            expect(bullConfig.defaultJobOptions.backoff.type).toBe("exponential")
            expect(bullConfig.defaultJobOptions.backoff.delay).toBe(5000)
        })

        it("deve ter opções de limpeza configuradas", () => {
            expect(bullConfig.defaultJobOptions.removeOnComplete).toBeDefined()
            expect(bullConfig.defaultJobOptions.removeOnFail).toBeDefined()
        })
    })

    describe("createRedisClient", () => {
        it("deve criar cliente Redis", () => {
            const client = createRedisClient()
            expect(client).toBeDefined()
            expect(client.status).toBeDefined()
            client.disconnect()
        })

        it("deve usar configurações do bullConfig", () => {
            const client = createRedisClient()
            expect(client.options.host).toBe(bullConfig.redis.host)
            expect(client.options.port).toBe(bullConfig.redis.port)
            client.disconnect()
        })
    })

    describe("testRedisConnection", () => {
        it("deve testar conexão Redis com sucesso", async () => {
            const result = await testRedisConnection()
            expect(result).toBe(true)
        }, 10000) // Timeout de 10s

        it("deve retornar true se Redis está disponível", async () => {
            // Este teste valida que a função detecta Redis disponível
            const result = await testRedisConnection()
            // Como Redis está rodando localmente, deve retornar true
            expect(result).toBe(true)
        }, 10000)
    })
})
