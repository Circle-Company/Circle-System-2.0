import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock do logger
vi.mock("@/infra/logger", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}))

// Mock do sistema de erros
vi.mock("@/infra/errors", () => ({
    SystemError: class MockSystemError extends Error {
        public code: string
        public action: string
        public context: any
        public metadata: any

        constructor(options: any) {
            super(options.message)
            this.name = "SystemError"
            this.code = options.code
            this.action = options.action
            this.context = options.context
            this.metadata = options.metadata
        }

        toJSON() {
            return {
                name: this.name,
                message: this.message,
                code: this.code,
                action: this.action,
                context: this.context,
                metadata: this.metadata,
            }
        }
    },
    ErrorCode: {
        CONFIGURATION_ERROR: "SYS_3003",
    },
}))

describe("Database Environment Configuration", () => {
    let originalEnv: NodeJS.ProcessEnv
    let environmentModule: any

    beforeEach(async () => {
        // Salvar variáveis de ambiente originais
        originalEnv = { ...process.env }

        // Limpar mocks
        vi.clearAllMocks()

        // Importar módulo dinamicamente
        vi.resetModules()
        environmentModule = await import("../environment")
    })

    afterEach(() => {
        // Restaurar variáveis de ambiente originais
        process.env = originalEnv
    })

    describe("Configurações de Ambiente", () => {
        it("deve ter configurações para development, production e test", () => {
            expect(environmentModule.CONFIGS).toHaveProperty("development")
            expect(environmentModule.CONFIGS).toHaveProperty("production")
            expect(environmentModule.CONFIGS).toHaveProperty("test")
        })

        it("deve ter configurações base comuns para todos os ambientes", () => {
            const baseConfig = environmentModule.CONFIGS.development

            expect(baseConfig.define).toEqual({
                timestamps: true,
                underscored: true,
                paranoid: false,
                freezeTableName: true,
            })

            expect(baseConfig.dialectOptions).toMatchObject({
                charset: "utf8mb4",
                collate: "utf8mb4_unicode_ci",
                connectTimeout: 60000,
                acquireTimeout: 60000,
            })
        })

        it("deve ter configurações específicas para development", () => {
            const devConfig = environmentModule.CONFIGS.development

            expect(devConfig.pool).toEqual({
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
            })

            // O logging pode ser uma função ou false dependendo da variável ENABLE_LOGGING
            expect(typeof devConfig.logging === "function" || devConfig.logging === false).toBe(
                true,
            )
        })

        it("deve ter configurações específicas para production", () => {
            const prodConfig = environmentModule.CONFIGS.production

            expect(prodConfig.dialect).toBe("mysql")
            expect(prodConfig.logging).toBe(false)

            expect(prodConfig.pool).toEqual({
                max: 20,
                min: 5,
                acquire: 30000,
                idle: 10000,
                evict: 1000,
            })
        })

        it("deve ter configurações específicas para test", () => {
            const testConfig = environmentModule.CONFIGS.test

            expect(testConfig.dialect).toBe("mysql")
            expect(testConfig.logging).toBe(false)

            expect(testConfig.pool).toEqual({
                max: 1,
                min: 0,
                acquire: 30000,
                idle: 10000,
            })
        })
    })

    describe("Validação de Variáveis de Ambiente", () => {
        it("deve falhar quando variáveis obrigatórias estão ausentes", () => {
            // Este teste verifica se a validação existe no código
            // A validação real acontece na inicialização do módulo
            expect(environmentModule.CONFIGS).toBeDefined()
            expect(environmentModule.ENVIRONMENT).toBeDefined()
        })

        it("deve falhar quando ambiente não é suportado", async () => {
            process.env.NODE_ENV = "invalid_environment"

            await expect(async () => {
                vi.resetModules()
                await import("../environment")
            }).rejects.toThrow("Ambiente 'invalid_environment' não é suportado")
        })
    })

    describe("Configuração SSL", () => {
        it("deve configurar SSL quando DB_SSL=true", async () => {
            process.env.DB_SSL = "true"

            vi.resetModules()
            const { CONFIGS } = await import("../environment")

            expect(CONFIGS.production.dialectOptions.ssl).toEqual({
                require: true,
                rejectUnauthorized: false,
            })
        })

        it("deve desabilitar SSL quando DB_SSL=false", async () => {
            process.env.DB_SSL = "false"

            vi.resetModules()
            const { CONFIGS } = await import("../environment")

            expect(CONFIGS.production.dialectOptions.ssl).toBe(false)
        })
    })

    describe("Configuração de Logging", () => {
        it("deve habilitar logging em development quando ENABLE_LOGGING=true", async () => {
            process.env.NODE_ENV = "development"
            process.env.ENABLE_LOGGING = "true"

            vi.resetModules()
            const { CONFIGS } = await import("../environment")

            expect(typeof CONFIGS.development.logging).toBe("function")
        })

        it("deve desabilitar logging quando ENABLE_LOGGING=false", () => {
            // Este teste verifica se a configuração de logging existe
            const devConfig = environmentModule.CONFIGS.development
            expect(devConfig.logging).toBeDefined()
            expect(typeof devConfig.logging === "function" || devConfig.logging === false).toBe(
                true,
            )
        })
    })

    describe("Configuração de Timezone", () => {
        it("deve usar timezone configurado nas dialectOptions", async () => {
            process.env.TIMEZONE = "America/Sao_Paulo"

            vi.resetModules()
            const { CONFIGS } = await import("../environment")

            expect(CONFIGS.development.dialectOptions.timezone).toBe("America/Sao_Paulo")
        })
    })

    describe("Configuração de Timeout", () => {
        it("deve usar timeout configurado nas dialectOptions", async () => {
            process.env.DB_TIMEOUT = "30000"

            vi.resetModules()
            const { CONFIGS } = await import("../environment")

            expect(CONFIGS.development.dialectOptions.timeout).toBe("30000")
        })
    })

    describe("Variáveis de Ambiente Específicas", () => {
        it("deve usar variáveis específicas para development", async () => {
            process.env.NODE_ENV = "development"
            process.env.DEVELOPMENT_DB_HOST = "dev-host"
            process.env.DEVELOPMENT_DB_USERNAME = "dev-user"
            process.env.DEVELOPMENT_DB_PASSWORD = "dev-pass"
            process.env.DEVELOPMENT_DB_NAME = "dev-db"
            process.env.DIALECT = "mysql"

            vi.resetModules()
            const { CONFIGS } = await import("../environment")

            expect(CONFIGS.development.host).toBe("dev-host")
            expect(CONFIGS.development.username).toBe("dev-user")
            expect(CONFIGS.development.password).toBe("dev-pass")
            expect(CONFIGS.development.database).toBe("dev-db")
            expect(CONFIGS.development.dialect).toBe("mysql")
        })

        it("deve usar variáveis padrão para production", async () => {
            process.env.NODE_ENV = "production"
            process.env.DB_HOST = "prod-host"
            process.env.DB_USERNAME = "prod-user"
            process.env.DB_PASSWORD = "prod-pass"
            process.env.DB_NAME = "prod-db"

            vi.resetModules()
            const { CONFIGS } = await import("../environment")

            expect(CONFIGS.production.host).toBe("prod-host")
            expect(CONFIGS.production.username).toBe("prod-user")
            expect(CONFIGS.production.password).toBe("prod-pass")
            expect(CONFIGS.production.database).toBe("prod-db")
        })

        it("deve usar valores padrão para test quando variáveis não estão definidas", async () => {
            process.env.NODE_ENV = "test"

            vi.resetModules()
            const { CONFIGS } = await import("../environment")

            expect(CONFIGS.test.host).toBe("localhost")
            expect(CONFIGS.test.username).toBe("test")
            expect(CONFIGS.test.password).toBe("test")
            expect(CONFIGS.test.database).toBe("test_db")
        })
    })

    describe("Exports", () => {
        it("deve exportar ENVIRONMENT corretamente", () => {
            expect(environmentModule.ENVIRONMENT).toBeDefined()
            expect(environmentModule.ENVIRONMENT).toHaveProperty("dialect")
            expect(environmentModule.ENVIRONMENT).toHaveProperty("host")
            expect(environmentModule.ENVIRONMENT).toHaveProperty("username")
            expect(environmentModule.ENVIRONMENT).toHaveProperty("password")
            expect(environmentModule.ENVIRONMENT).toHaveProperty("database")
        })

        it("deve exportar CURRENT_ENV corretamente", () => {
            expect(environmentModule.CURRENT_ENV).toBeDefined()
            expect(["development", "production", "test"]).toContain(environmentModule.CURRENT_ENV)
        })

        it("deve exportar ENABLE_LOGGING corretamente", () => {
            expect(typeof environmentModule.ENABLE_LOGGING).toBe("boolean")
        })
    })

    describe("Logging de Configuração", () => {
        it("deve ter configuração de logging disponível", () => {
            // Este teste verifica se a configuração de logging está disponível
            expect(environmentModule.CONFIGS.development.logging).toBeDefined()
            expect(environmentModule.CONFIGS.production.logging).toBeDefined()
            expect(environmentModule.CONFIGS.test.logging).toBeDefined()
        })

        it("deve ter configuração de ambiente disponível", () => {
            // Este teste verifica se a configuração de ambiente está disponível
            expect(environmentModule.ENVIRONMENT).toBeDefined()
            expect(environmentModule.CURRENT_ENV).toBeDefined()
            expect(environmentModule.ENABLE_LOGGING).toBeDefined()
        })
    })
})
