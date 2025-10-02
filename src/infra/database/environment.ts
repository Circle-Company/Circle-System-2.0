import { ErrorCode, SystemError, logger } from "@/shared"

import { config } from "dotenv"
import { Dialect } from "sequelize"

// Carregar variáveis de ambiente
config()

// Configurações padrão simplificadas
const defaultConfig = {
    DB_HOST: "localhost",
    DB_USERNAME: "root",
    DB_PASSWORD: "",
    DB_NAME: "test_access_controller_db",
    DB_SSL: "false",
    DB_TIMEOUT: "60000",
    TIMEZONE: "UTC",
    ENABLE_LOGGER: "true",
    DIALECT: "mysql",
    NODE_ENV: "development",
    PORT: "3000",
    ENABLE_LOGGING: "true",
}

// Aplicar configurações padrão se não estiverem definidas
Object.keys(defaultConfig).forEach((key) => {
    if (!process.env[key]) {
        process.env[key] = defaultConfig[key as keyof typeof defaultConfig]
    }
})

// Variáveis obrigatórias apenas para produção
const requiredEnvVars = [
    "DB_HOST",
    "DB_USERNAME",
    "DB_PASSWORD",
    "DB_NAME",
    "DB_SSL",
    "DB_TIMEOUT",
    "TIMEZONE",
    "ENABLE_LOGGER",
    "DIALECT",
]

// Verificar variáveis obrigatórias apenas em produção
if (process.env.NODE_ENV === "production") {
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])
    if (missingVars.length > 0) {
        const error = new SystemError({
            message: "Variáveis de ambiente obrigatórias não encontradas",
            code: ErrorCode.CONFIGURATION_ERROR,
            action: "Configure todas as variáveis de ambiente obrigatórias",
            context: {
                additionalData: {
                    missingVars,
                    requiredVars: requiredEnvVars,
                },
            },
            metadata: {
                severity: "critical",
                retryable: false,
                logLevel: "error",
                notifyAdmin: true,
            },
        })

        logger.error("Configuração de banco de dados falhou", { error: error.toJSON() })
        throw error
    }
}

// Configurações base para todos os ambientes
const baseConfig = {
    define: {
        timestamps: true,
        underscored: true, // Usar snake_case para timestamps (created_at, updated_at)
        paranoid: false,
        freezeTableName: true,
    },
    dialectOptions: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: process.env.DB_TIMEOUT!,
        timezone: process.env.TIMEZONE!,
    },
}

export const CONFIGS = {
    development: {
        ...baseConfig,
        dialect: (process.env.DIALECT || "mysql") as Dialect,
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USERNAME || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "test_access_controller_db",
        logging:
            process.env.ENABLE_LOGGING === "true"
                ? (sql: string, timing?: number) => {
                      logger.debug(`SQL Query executed`, { sql, timing: `${timing}ms` })
                  }
                : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    },

    production: {
        ...baseConfig,
        dialect: (process.env.DIALECT || "mysql") as Dialect,
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USERNAME || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "test_access_controller_db",
        logging: false,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000,
            evict: 1000,
        },
        dialectOptions: {
            ...baseConfig.dialectOptions,
            ssl:
                process.env.DB_SSL === "true"
                    ? {
                          require: true,
                          rejectUnauthorized: false,
                      }
                    : false,
        },
    },

    test: {
        ...baseConfig,
        dialect: (process.env.DIALECT || "mysql") as Dialect,
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USERNAME || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "test_access_controller_db",
        logging: false,
        pool: {
            max: 1,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    },
}

// Determinar ambiente atual
const currentEnv = (process.env.NODE_ENV as keyof typeof CONFIGS) || "development"

// Validar se o ambiente é suportado
if (!CONFIGS[currentEnv]) {
    const error = new SystemError({
        message: `Ambiente '${currentEnv}' não é suportado`,
        code: ErrorCode.CONFIGURATION_ERROR,
        action: "Use um ambiente suportado: development, production ou test",
        context: {
            additionalData: {
                currentEnv,
                availableEnvs: Object.keys(CONFIGS),
            },
        },
        metadata: {
            severity: "critical",
            retryable: false,
            logLevel: "error",
            notifyAdmin: true,
        },
    })

    logger.error("Configuração de ambiente falhou", { error: error.toJSON() })
    throw error
}

export const ENVIRONMENT = CONFIGS[currentEnv]
export const ENABLE_LOGGING = process.env.NODE_ENV === "development"
export const CURRENT_ENV = currentEnv

// Log de configuração (apenas em desenvolvimento)
if (process.env.NODE_ENV === "development") {
    logger.info("Configuração do banco de dados inicializada", {
        environment: currentEnv,
        host: ENVIRONMENT.host,
        database: ENVIRONMENT.database,
        username: ENVIRONMENT.username,
    })
}
