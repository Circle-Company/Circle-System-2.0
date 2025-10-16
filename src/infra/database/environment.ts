import { ErrorCode, SystemError, logger } from "@/shared"

import { config } from "dotenv"
import { Dialect } from "sequelize"

// Carregar variáveis de ambiente
config()

// Variáveis obrigatórias apenas para produção
const requiredEnvVars = [
    "DB_HOST",
    "DB_PORT",
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
        timestamps: false, // Desabilitar timestamps automáticos
        underscored: false, // Não usar snake_case para evitar conflitos
        paranoid: false,
        freezeTableName: true,
    },
    dialectOptions: {
        connectTimeout: 60000,
        // Opções específicas do PostgreSQL
    },
}

export const CONFIGS = {
    development: {
        dialect: (process.env.DIALECT || "postgres") as Dialect,
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USERNAME || "admin",
        password: process.env.DB_PASSWORD || "admin",
        database: process.env.DB_NAME || "circle_db",
        port: parseInt(process.env.DB_PORT || "5422"),
        logging:
            process.env.ENABLE_LOGGING === "true"
                ? (sql: string, timing?: number) => {
                      logger.debug(`SQL Query executed`, { sql, timing: `${timing}ms` })
                  }
                : false,
        pool: {
            max: 5, // Máximo de conexões simultâneas
            min: 0, // Mínimo de conexões
            acquire: 30000, // Timeout para adquirir conexão
            idle: 10000, // Tempo antes de liberar conexão inativa
            evict: 1000, // Intervalo para verificar conexões ociosas
            handleDisconnects: true, // Recriar conexões perdidas
        },
    },

    production: {
        dialect: (process.env.DIALECT || "postgres") as Dialect,
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USERNAME || "admin",
        password: process.env.DB_PASSWORD || "admin",
        database: process.env.DB_NAME || "circle_db",
        port: parseInt(process.env.DB_PORT || "5422"),
        logging: false,
        pool: {
            max: 20, // Máximo de conexões para produção
            min: 2, // Manter pelo menos 2 conexões abertas
            acquire: 30000, // Timeout para adquirir conexão
            idle: 10000, // Tempo antes de liberar conexão inativa
            evict: 1000, // Intervalo para verificar conexões ociosas
            handleDisconnects: true, // Recriar conexões perdidas
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
        dialect: (process.env.DIALECT || "postgres") as Dialect,
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USERNAME || "admin",
        password: process.env.DB_PASSWORD || "admin",
        database: process.env.DB_NAME || "circle_db_test",
        port: parseInt(process.env.DB_PORT || "5422"),
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
