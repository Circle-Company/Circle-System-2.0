require("dotenv").config()

import { ErrorCode, SystemError } from "@/errors"

import { Dialect } from "sequelize"
import { logger } from "@/logger"

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

// Verificar se todas as variáveis obrigatórias estão definidas
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

// Configurações base para todos os ambientes
const baseConfig = {
    define: {
        timestamps: true,
        underscored: true,
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
        host: process.env.DEVELOPMENT_DB_HOST!,
        username: process.env.DEVELOPMENT_DB_USERNAME!,
        password: process.env.DEVELOPMENT_DB_PASSWORD!,
        database: process.env.DEVELOPMENT_DB_NAME!,
        logging: process.env.ENABLE_LOGGING!
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
        host: process.env.DB_HOST!,
        username: process.env.DB_USERNAME!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
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
        username: process.env.DB_USERNAME || "test",
        password: process.env.DB_PASSWORD || "test",
        database: process.env.DB_NAME || "test_db",
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
