/**
 * Bull Queue Configuration
 * Configuração centralizada para filas Redis usando Bull
 */

import Redis from "ioredis"

export interface BullConfig {
    redis: {
        host: string
        port: number
        password?: string
        db?: number
        maxRetriesPerRequest: number | null
    }
    defaultJobOptions: {
        attempts: number
        backoff: {
            type: string
            delay: number
        }
        removeOnComplete: boolean | number
        removeOnFail: boolean | number
    }
}

/**
 * Configuração padrão do Bull
 */
export const bullConfig: BullConfig = {
    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || "0"),
        maxRetriesPerRequest: null, // Bull gerencia retries
    },
    defaultJobOptions: {
        attempts: 3, // 3 tentativas
        backoff: {
            type: "exponential",
            delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: 100, // Manter últimos 100 jobs completos
        removeOnFail: 500, // Manter últimos 500 jobs falhados
    },
}

/**
 * Cria cliente Redis para Bull
 */
export function createRedisClient(): Redis {
    const client = new Redis({
        host: bullConfig.redis.host,
        port: bullConfig.redis.port,
        password: bullConfig.redis.password,
        db: bullConfig.redis.db,
        maxRetriesPerRequest: bullConfig.redis.maxRetriesPerRequest,
        enableReadyCheck: false,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000)
            return delay
        },
    })

    client.on("error", (error) => {
        console.error("[Redis] ❌ Erro de conexão:", error)
    })

    client.on("connect", () => {
        console.log("[Redis] ✅ Conectado com sucesso")
    })

    return client
}

/**
 * Testa conexão Redis
 */
export async function testRedisConnection(): Promise<boolean> {
    try {
        const client = createRedisClient()
        await client.ping()
        await client.quit()
        console.log("[Redis] ✅ Teste de conexão bem-sucedido")
        return true
    } catch (error) {
        console.error("[Redis] ❌ Falha no teste de conexão:", error)
        return false
    }
}
