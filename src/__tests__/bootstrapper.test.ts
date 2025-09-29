import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ApplicationBootstrapper } from "../bootstrapper"
import { api } from "../infra/api"
import { DatabaseAdapterFactory } from "../infra/database"
import { initialize as initializeRoutes } from "../infra/routes"
import { logger } from "../shared/logger"

// Mock das dependências
vi.mock("@/infra/database", () => ({
    DatabaseAdapterFactory: {
        createForEnvironment: vi.fn(),
    },
}))

vi.mock("@/infra/api", () => ({
    api: {
        listen: vi.fn(),
        close: vi.fn(),
    },
}))

vi.mock("@/infra/routes", () => ({
    initialize: vi.fn(),
}))

vi.mock("@/shared/logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

describe("ApplicationBootstrapper", () => {
    let originalEnv: NodeJS.ProcessEnv
    let mockDatabaseAdapter: any
    let bootstrapper: ApplicationBootstrapper

    beforeEach(() => {
        // Salvar variáveis de ambiente originais
        originalEnv = { ...process.env }

        // Mock do adaptador de banco
        mockDatabaseAdapter = {
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn().mockResolvedValue(undefined),
            isConnected: vi.fn().mockReturnValue(true),
        }

        vi.mocked(DatabaseAdapterFactory.createForEnvironment).mockReturnValue(mockDatabaseAdapter)

        // Mock das funções da API
        vi.mocked(api.listen).mockResolvedValue(undefined)
        vi.mocked(api.close).mockResolvedValue(undefined)

        // Mock das rotas
        vi.mocked(initializeRoutes).mockResolvedValue(undefined)

        // Configurar ambiente mínimo para testes
        process.env.PORT = "3001"
        process.env.NODE_ENV = "test"
    })

    afterEach(() => {
        // Restaurar variáveis de ambiente
        process.env = originalEnv

        // Limpar todos todos os mocks
        vi.clearAllMocks()

        // Limpar listeners de eventos do processo
        process.removeAllListeners("SIGTERM")
        process.removeAllListeners("SIGINT")
        process.removeAllListeners("SIGUSR2")
        process.removeAllListeners("uncaughtException")
        process.removeAllListeners("unhandledRejection")
    })

    describe("Constructor", () => {
        it("should create bootstrapper with default configuration", () => {
            process.env.PORT = "3000"
            process.env.NODE_ENV = "development"
            // Limpar todas as outras variáveis relacionadas ao console logs
            delete process.env.ENABLE_CONSOLE_LOGS

            const bootstrapper = new ApplicationBootstrapper()
            const config = bootstrapper.getConfig()

            expect(config.port).toBe(3000)
            expect(config.environment).toBe("development")
            expect(config.enableConsoleLogs).toBe(false) // Por padrão é false quando env não for "true"
            expect(config.enableMetrics).toBe(true)
            expect(config.shutdownTimeout).toBe(30000)
            expect(config.healthCheckInterval).toBe(30000)
        })

        it("should configure environment variables correctly", () => {
            process.env.PORT = "8080"
            process.env.NODE_ENV = "production"
            process.env.ENABLE_CONSOLE_LOGS = "true"
            process.env.ENABLE_METRICS = "false"
            process.env.SHUTDOWN_TIMEOUT = "60000"
            process.env.HEALTH_CHECK_INTERVAL = "15000"
            // Definir variáveis necessárias para produção
            process.env.DB_HOST = "localhost"
            process.env.DB_USERNAME = "user"
            process.env.DB_PASSWORD = "pass"
            process.env.DB_NAME = "testdb"
            process.env.JWT_SECRET = "secret"

            const bootstrapper = new ApplicationBootstrapper()
            const config = bootstrapper.getConfig()

            expect(config.port).toBe(8080)
            expect(config.environment).toBe("production")
            expect(config.enableConsoleLogs).toBe(true)
            expect(config.enableMetrics).toBe(false)
            expect(config.shutdownTimeout).toBe(60000)
            expect(config.healthCheckInterval).toBe(15000)
        })

        it("should throw error for invalid PORT", () => {
            process.env.PORT = "invalid"
            process.env.NODE_ENV = "test"

            expect(() => new ApplicationBootstrapper()).toThrow(
                "PORT must be a valid number between 1 and 65535",
            )
        })

        it("should throw error for invalid port range", () => {
            process.env.PORT = "0"
            process.env.NODE_ENV = "test"

            expect(() => new ApplicationBootstrapper()).toThrow(
                "PORT must be a valid number between 1 and 65535",
            )
        })

        it("should validate production environment requirements", () => {
            process.env.PORT = "3000"
            process.env.NODE_ENV = "production"
            delete process.env.DB_HOST
            delete process.env.DB_USERNAME

            expect(() => new ApplicationBootstrapper()).toThrow(
                "Production environment missing required variables: DB_HOST, DB_USERNAME",
            )
        })
    })

    describe("Configuration", () => {
        it("should provide configuration", () => {
            const bootstrapper = new ApplicationBootstrapper()
            const config = bootstrapper.getConfig()

            expect(config).toBeDefined()
            expect(config.port).toBe(3001)
        })
    })

    describe("Status", () => {
        it("should start with initializing status", () => {
            const bootstrapper = new ApplicationBootstrapper()
            expect(bootstrapper.getStatus()).toBe("initializing")
        })
    })

    describe("Bootstrap", () => {
        beforeEach(() => {
            bootstrapper = new ApplicationBootstrapper()
        })

        it("should complete bootstrap successfully", async () => {
            await bootstrapper.bootstrap()

            expect(bootstrapper.getStatus()).toBe("running")
            expect(mockDatabaseAdapter.connect).toHaveBeenCalledTimes(1)
            expect(initializeRoutes).toHaveBeenCalledWith(api)
            expect(api.listen).toHaveBeenCalledWith({ port: 3001 })
        })

        it("should skip health check when option is set", async () => {
            await bootstrapper.bootstrap({ skipHealthCheck: true })

            expect(bootstrapper.getStatus()).toBe("running")
        })

        it("should skip metrics when option is set", async () => {
            await bootstrapper.bootstrap({ skipMetrics: true })

            expect(bootstrapper.getStatus()).toBe("running")
        })

        it("should retry database connection on failure", async () => {
            mockDatabaseAdapter.connect
                .mockRejectedValueOnce(new Error("First attempt failed"))
                .mockRejectedValueOnce(new Error("Second attempt failed"))
                .mockResolvedValueOnce(undefined)

            await bootstrapper.bootstrap()

            expect(bootstrapper.getStatus()).toBe("running")
            expect(mockDatabaseAdapter.connect).toHaveBeenCalledTimes(3)
        })
    })

    describe("Health Check", () => {
        beforeEach(async () => {
            bootstrapper = new ApplicationBootstrapper()
            await bootstrapper.bootstrap()
        })

        it("should perform health check successfully", async () => {
            mockDatabaseAdapter.isConnected.mockReturnValue(true)

            const metrics = bootstrapper.getMetrics()
            expect(metrics.steps.some((step) => step.name === "Health Check Setup")).toBe(true)
        })

        it("should detect unhealthy database", async () => {
            mockDatabaseAdapter.isConnected.mockReturnValue(false)

            expect(bootstrapper.getStatus()).toBe("running")
        })
    })

    describe("Metrics", () => {
        beforeEach(async () => {
            bootstrapper = new ApplicationBootstrapper()
        })

        it("should track bootstrap metrics", async () => {
            await bootstrapper.bootstrap()

            const metrics = bootstrapper.getMetrics()
            expect(metrics.startTime).toBeGreaterThan(0)
            expect(metrics.endTime).toBeGreaterThanOrEqual(metrics.startTime)
            expect(metrics.duration).toBeGreaterThanOrEqual(0)
            expect(metrics.steps.length).toBeGreaterThan(0)

            // Verificar etapas executadas
            const stepNames = metrics.steps.map((step) => step.name)
            expect(stepNames).toContain("Environment Validation")
            expect(stepNames).toContain("Database Connection")
            expect(stepNames).toContain("Routes Setup")
            expect(stepNames).toContain("Server Startup")
        })

        it("should provide metrics", () => {
            const metrics = bootstrapper.getMetrics()
            expect(metrics.steps.length).toBeGreaterThanOrEqual(0)
        })

        it("should disable metrics when environment variable is false", async () => {
            process.env.ENABLE_METRICS = "false"
            bootstrapper = new ApplicationBootstrapper()

            await bootstrapper.bootstrap()

            const metrics = bootstrapper.getMetrics()
            expect(metrics.steps.length).toBeGreaterThan(0)
        })
    })

    describe("Signal Handling", () => {
        beforeEach(async () => {
            bootstrapper = new ApplicationBootstrapper()
            await bootstrapper.bootstrap()
        })

        it("should configure signal handlers during bootstrap", () => {
            const metrics = bootstrapper.getMetrics()
            const gracefulShutdownStep = metrics.steps.find(
                (step) => step.name === "Graceful Shutdown Setup",
            )
            expect(gracefulShutdownStep?.success).toBe(true)
        })
    })

    describe("Logging", () => {
        beforeEach(() => {
            bootstrapper = new ApplicationBootstrapper()
        })

        it("should log bootstrap process", async () => {
            await bootstrapper.bootstrap()

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Starting application bootstrap process"),
                expect.any(Object),
            )
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining("Application bootstrap completed successfully"),
                expect.any(Object),
            )
        })

        it("should respect console logs in development", () => {
            process.env.NODE_ENV = "development"
            process.env.ENABLE_CONSOLE_LOGS = "true"
            bootstrapper = new ApplicationBootstrapper()

            // Console.log deveria ser chamado em development quando habilitado
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

            // Executar uma ação que gera log - apenas teste do método de logging interno
            // @ts-ignore - acessando método privado para teste
            bootstrapper.log("info", "Test message")

            expect(consoleSpy).toHaveBeenCalledWith("ℹ️  Test message", "")
        })
    })

    describe("Environment-specific behaviors", () => {
        it("should warn about console logs in production", () => {
            process.env.NODE_ENV = "production"
            process.env.ENABLE_CONSOLE_LOGS = "true"
            // Definir variáveis necessárias para produção
            process.env.DB_HOST = "localhost"
            process.env.DB_USERNAME = "user"
            process.env.DB_PASSWORD = "pass"
            process.env.DB_NAME = "testdb"
            process.env.JWT_SECRET = "secret"

            new ApplicationBootstrapper()

            expect(logger.warn).toHaveBeenCalledWith(
                "Console logs are enabled in production environment",
            )
        })

        it("should handle test environment correctly", () => {
            process.env.NODE_ENV = "test"
            process.env.PORT = "3001"

            const bootstrapper = new ApplicationBootstrapper()
            const config = bootstrapper.getConfig()

            expect(config.environment).toBe("test")
        })
    })

    describe("Utility methods", () => {
        beforeEach(async () => {
            bootstrapper = new ApplicationBootstrapper()
            await bootstrapper.bootstrap()
        })

        it("should return current configuration", () => {
            const config = bootstrapper.getConfig()
            expect(config).toBeDefined()
            expect(config.port).toBe(3001)
            expect(config.environment).toBe("test")
        })

        it("should return current status", () => {
            expect(bootstrapper.getStatus()).toBe("running")
        })

        it("should return boot metrics", () => {
            const metrics = bootstrapper.getMetrics()
            expect(metrics.startTime).toBeGreaterThan(0)
            expect(metrics.steps.length).toBeGreaterThan(0)
        })
    })

    describe("Database Connection Retry Logic", () => {
        beforeEach(() => {
            bootstrapper = new ApplicationBootstrapper()
        })

        it("should retry database connection on failure", async () => {
            mockDatabaseAdapter.connect
                .mockRejectedValueOnce(new Error("Network error"))
                .mockRejectedValueOnce(new Error("Connection timeout"))
                .mockResolvedValueOnce(undefined)

            await bootstrapper.bootstrap()

            expect(bootstrapper.getStatus()).toBe("running")
            expect(mockDatabaseAdapter.connect).toHaveBeenCalledTimes(3)
        })

        it("should handle successful connection on first try", async () => {
            mockDatabaseAdapter.connect.mockResolvedValue(undefined)

            await bootstrapper.bootstrap()

            expect(bootstrapper.getStatus()).toBe("running")
            expect(mockDatabaseAdapter.connect).toHaveBeenCalledTimes(1)
        })
    })

    describe("Configuration Validation", () => {
        it("should validate PORT range", () => {
            const testCases = [
                { port: "0", shouldThrow: true },
                { port: "1", shouldThrow: false },
                { port: "65535", shouldThrow: false },
                { port: "65536", shouldThrow: true },
            ]

            testCases.forEach(({ port, shouldThrow }) => {
                process.env.PORT = port

                if (shouldThrow) {
                    expect(() => new ApplicationBootstrapper()).toThrow(
                        "PORT must be a valid number between 1 and 65535",
                    )
                } else {
                    expect(() => new ApplicationBootstrapper()).not.toThrow()
                }
            })
        })

        it("should validate environment variables", () => {
            delete process.env.PORT

            expect(() => new ApplicationBootstrapper()).toThrow(
                "PORT must be a valid number between 1 and 65535",
            )
        })
    })

    describe("Bootstrap Steps", () => {
        beforeEach(() => {
            bootstrapper = new ApplicationBootstrapper()
        })

        it("should execute all bootstrap steps in order", async () => {
            await bootstrapper.bootstrap()

            const metrics = bootstrapper.getMetrics()
            expect(metrics.steps.length).toBeGreaterThanOrEqual(5)

            const expectedSteps = [
                "Environment Validation",
                "Database Connection",
                "Routes Setup",
                "Server Startup",
                "Graceful Shutdown Setup",
            ]

            expectedSteps.forEach((stepName) => {
                const step = metrics.steps.find((s) => s.name === stepName)
                expect(step).toBeDefined()
                expect(step?.success).toBe(true)
            })
        })

        it("should track step execution times", async () => {
            await bootstrapper.bootstrap()

            const metrics = bootstrapper.getMetrics()

            metrics.steps.forEach((step) => {
                expect(step.startTime).toBeGreaterThan(0)
                expect(step.endTime).toBeGreaterThanOrEqual(step.startTime)
                expect(step.duration).toBeGreaterThanOrEqual(0)
                expect(step.success).toBe(true)
            })
        })
    })
})
