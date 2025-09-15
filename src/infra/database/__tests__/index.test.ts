import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock do logger
vi.mock("@/infra/logger", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}))

// Mock do environment
vi.mock("../environment", () => ({
    ENVIRONMENT: {
        dialect: "postgres",
        host: "localhost",
        username: "test",
        password: "test",
        database: "test_db",
        logging: false,
        pool: {
            max: 1,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
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
        DATABASE_ERROR: "SYS_3001",
    },
}))

// Mock do User model
const mockUserModel = {
    initialize: vi.fn(),
    associate: vi.fn(),
    ensureFullTextIndex: vi.fn().mockResolvedValue(undefined),
}

vi.mock("@/infra/models/user.model", () => ({
    default: mockUserModel,
}))

// Mock do Sequelize
const mockSequelize = {
    authenticate: vi.fn(),
    models: {},
    sync: vi.fn().mockResolvedValue(undefined),
}

vi.mock("sequelize", () => ({
    Sequelize: vi.fn().mockImplementation(() => mockSequelize),
}))

describe("Database Index", () => {
    let originalEnv: NodeJS.ProcessEnv
    let indexModule: any

    beforeEach(async () => {
        // Salvar variáveis de ambiente originais
        originalEnv = { ...process.env }

        // Limpar mocks
        vi.clearAllMocks()

        // Configurar ambiente padrão
        process.env.NODE_ENV = "test"

        // Importar módulo dinamicamente
        vi.resetModules()
        indexModule = await import("../index")
    })

    afterEach(() => {
        // Restaurar variáveis de ambiente originais
        process.env = originalEnv
    })

    describe("Inicialização do Sequelize", () => {
        it("deve criar instância do Sequelize com configuração correta", async () => {
            vi.resetModules()
            const { Sequelize } = require("sequelize")

            await import("../index")

            expect(Sequelize).toHaveBeenCalledWith({
                dialect: "postgres",
                host: "localhost",
                username: "test",
                password: "test",
                database: "test_db",
                logging: false,
                pool: {
                    max: 1,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
            })
        })
    })

    describe("Função initializeDatabase", () => {
        it("deve inicializar banco de dados com sucesso", async () => {
            const { logger } = require("@/infra/logger")

            await indexModule.initializeDatabase()

            // Verificar autenticação
            expect(mockSequelize.authenticate).toHaveBeenCalled()

            // Verificar logs de sucesso
            expect(logger.info).toHaveBeenCalledWith(
                "Conexão com o banco de dados estabelecida com sucesso",
            )
            expect(logger.info).toHaveBeenCalledWith("Inicializando modelos")
            expect(logger.info).toHaveBeenCalledWith("Configurando associações")
            expect(logger.info).toHaveBeenCalledWith("Configurando índices especiais")
            expect(logger.info).toHaveBeenCalledWith(
                "Todos os modelos foram inicializados com sucesso!",
            )

            // Verificar inicialização dos modelos
            expect(mockUserModel.initialize).toHaveBeenCalledWith(mockSequelize)
            expect(mockUserModel.associate).toHaveBeenCalledWith(mockSequelize.models)
            expect(mockUserModel.ensureFullTextIndex).toHaveBeenCalledWith(mockSequelize)
        })

        it("deve sincronizar modelos apenas em development", async () => {
            process.env.NODE_ENV = "development"

            const { logger } = require("@/infra/logger")

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await initializeDatabase()

            expect(logger.info).toHaveBeenCalledWith("Sincronizando modelos com o banco")
            expect(mockSequelize.sync).toHaveBeenCalledWith({ alter: true })
        })

        it("não deve sincronizar modelos em production", async () => {
            process.env.NODE_ENV = "production"

            const { logger } = require("@/infra/logger")

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await initializeDatabase()

            expect(logger.info).not.toHaveBeenCalledWith("Sincronizando modelos com o banco")
            expect(mockSequelize.sync).not.toHaveBeenCalled()
        })

        it("não deve sincronizar modelos em test", async () => {
            process.env.NODE_ENV = "test"

            const { logger } = require("@/infra/logger")

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await initializeDatabase()

            expect(logger.info).not.toHaveBeenCalledWith("Sincronizando modelos com o banco")
            expect(mockSequelize.sync).not.toHaveBeenCalled()
        })

        it("deve tratar erro de autenticação", async () => {
            const { logger } = require("@/infra/logger")
            const authError = new Error("Connection failed")
            mockSequelize.authenticate.mockRejectedValue(authError)

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await expect(initializeDatabase()).rejects.toThrow(
                "Falha na inicialização do banco de dados",
            )

            expect(logger.error).toHaveBeenCalledWith(
                "Erro ao inicializar banco de dados",
                expect.objectContaining({
                    error: expect.objectContaining({
                        name: "SystemError",
                        message: "Falha na inicialização do banco de dados",
                        code: "SYS_3001",
                    }),
                    originalError: authError,
                }),
            )
        })

        it("deve tratar erro de inicialização de modelo", async () => {
            const { logger } = require("@/infra/logger")
            const initError = new Error("Model initialization failed")
            mockUserModel.initialize.mockImplementation(() => {
                throw initError
            })

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await expect(initializeDatabase()).rejects.toThrow("Model initialization failed")

            expect(logger.error).toHaveBeenCalledWith("Erro ao inicializar banco de dados", {
                error: initError,
            })
        })

        it("deve tratar erro de associação de modelo", async () => {
            const { logger } = require("@/infra/logger")
            const associateError = new Error("Association failed")
            mockUserModel.associate.mockImplementation(() => {
                throw associateError
            })

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await expect(initializeDatabase()).rejects.toThrow("Association failed")

            expect(logger.error).toHaveBeenCalledWith("Erro ao inicializar banco de dados", {
                error: associateError,
            })
        })

        it("deve tratar erro de configuração de índice", async () => {
            const { logger } = require("@/infra/logger")
            const indexError = new Error("Index configuration failed")
            mockUserModel.ensureFullTextIndex.mockRejectedValue(indexError)

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await expect(initializeDatabase()).rejects.toThrow("Index configuration failed")

            expect(logger.error).toHaveBeenCalledWith("Erro ao inicializar banco de dados", {
                error: indexError,
            })
        })

        it("deve tratar erro de sincronização", async () => {
            process.env.NODE_ENV = "development"
            const { logger } = require("@/infra/logger")
            const syncError = new Error("Sync failed")
            mockSequelize.sync.mockRejectedValue(syncError)

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await expect(initializeDatabase()).rejects.toThrow("Sync failed")

            expect(logger.error).toHaveBeenCalledWith("Erro ao inicializar banco de dados", {
                error: syncError,
            })
        })
    })

    describe("Modelos sem métodos opcionais", () => {
        it("deve funcionar com modelo sem método initialize", async () => {
            const modelWithoutInit = {
                associate: vi.fn(),
                ensureFullTextIndex: vi.fn().mockResolvedValue(undefined),
            }

            vi.doMock("@/infra/models/user.model", () => ({
                default: modelWithoutInit,
            }))

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await initializeDatabase()

            expect(modelWithoutInit.associate).toHaveBeenCalled()
            expect(modelWithoutInit.ensureFullTextIndex).toHaveBeenCalled()
        })

        it("deve funcionar com modelo sem método associate", async () => {
            const modelWithoutAssociate = {
                initialize: vi.fn(),
                ensureFullTextIndex: vi.fn().mockResolvedValue(undefined),
            }

            vi.doMock("@/infra/models/user.model", () => ({
                default: modelWithoutAssociate,
            }))

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await initializeDatabase()

            expect(modelWithoutAssociate.initialize).toHaveBeenCalled()
            expect(modelWithoutAssociate.ensureFullTextIndex).toHaveBeenCalled()
        })

        it("deve funcionar com modelo sem método ensureFullTextIndex", async () => {
            const modelWithoutIndex = {
                initialize: vi.fn(),
                associate: vi.fn(),
            }

            vi.doMock("@/infra/models/user.model", () => ({
                default: modelWithoutIndex,
            }))

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await initializeDatabase()

            expect(modelWithoutIndex.initialize).toHaveBeenCalled()
            expect(modelWithoutIndex.associate).toHaveBeenCalled()
        })
    })

    describe("Exports", () => {
        it("deve exportar sequelize como connection", () => {
            expect(indexModule.connection).toBe(mockSequelize)
        })

        it("deve exportar initializeDatabase", () => {
            expect(typeof indexModule.initializeDatabase).toBe("function")
        })

        it("deve exportar sequelize como default", () => {
            expect(indexModule.default).toBe(mockSequelize)
        })
    })

    describe("Integração com Sistema de Erros", () => {
        it("deve usar o novo sistema de erros para falhas de conexão", async () => {
            const { SystemError } = require("@/infra/errors")
            const connectionError = new Error("Database connection failed")
            mockSequelize.authenticate.mockRejectedValue(connectionError)

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await expect(initializeDatabase()).rejects.toThrow("Database connection failed")
        })

        it("deve logar erros com contexto estruturado", async () => {
            const { logger } = require("@/infra/logger")
            const error = new Error("Test error")
            mockSequelize.authenticate.mockRejectedValue(error)

            vi.resetModules()
            const { initializeDatabase } = await import("../index")

            await expect(initializeDatabase()).rejects.toThrow("Test error")

            expect(logger.error).toHaveBeenCalledWith("Erro ao inicializar banco de dados", {
                error,
            })
        })
    })
})
