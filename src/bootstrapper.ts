import { api } from "@/infra/api"
import { DatabaseAdapterFactory } from "@/infra/database"
import { MomentFactory } from "@/infra/factories/moment.factory"
import { EmbeddingsWorker } from "@/infra/queue/embeddings.worker"
import { initialize as initializeRoutes } from "@/infra/routes"
import { setupSwagger } from "@/infra/swagger"
import { resetSwaggerRegistration } from "@/infra/swagger/swagger.config"
import { logger } from "@/shared/logger"
import fastifyStatic from "@fastify/static"
import path from "path"

/**
 * Configurações de ambiente da aplicação
 */
interface AppConfig {
    readonly port: number
    readonly environment: string
    readonly enableConsoleLogs: boolean
    readonly enableMetrics: boolean
    readonly shutdownTimeout: number
    readonly healthCheckInterval: number
}

/**
 * Status da aplicação
 */
enum AppStatus {
    INITIALIZING = "initializing",
    RUNNING = "running",
    SHUTTING_DOWN = "shutting_down",
    STOPPED = "stopped",
    ERROR = "error",
}

/**
 * Métricas de inicialização
 */
interface BootMetrics {
    startTime: number
    endTime?: number
    duration?: number
    steps: BootStep[]
}

/**
 * Etapa do processo de boot
 */
interface BootStep {
    name: string
    startTime: number
    endTime?: number
    duration?: number
    success: boolean
    error?: Error
}

/**
 * Opções de inicialização
 */
interface BootOptions {
    readonly skipHealthCheck?: boolean
    readonly skipMetrics?: boolean
    readonly timeout?: number
}

/**
 * Classe principal responsável pelo boot completo da aplicação
 * Implementa padrões profissionais de inicialização e shutdown graceful
 */
export class ApplicationBootstrapper {
    private readonly config: AppConfig
    private readonly databaseAdapter = DatabaseAdapterFactory.createForEnvironment(
        process.env.NODE_ENV || "development",
    )
    private status: AppStatus = AppStatus.INITIALIZING
    private metrics: BootMetrics | null
    private healthCheckInterval?: NodeJS.Timeout
    private shutdownTimeout?: NodeJS.Timeout
    private isShuttingDown = false
    private embeddingsWorker?: EmbeddingsWorker

    constructor() {
        this.config = this.loadConfiguration()
        this.metrics = this.initializeMetrics()
        this.validateConfiguration()
    }

    /**
     * Carrega e valida as configurações da aplicação
     */
    private loadConfiguration(): AppConfig {
        const port = Number(process.env.PORT)
        const environment = process.env.NODE_ENV || "development"
        const enableConsoleLogs = process.env.ENABLE_CONSOLE_LOGS === "true"
        const enableMetrics = process.env.ENABLE_METRICS !== "false"
        const shutdownTimeout = Number(process.env.SHUTDOWN_TIMEOUT) || 30000
        const healthCheckInterval = Number(process.env.HEALTH_CHECK_INTERVAL) || 30000

        if (!port || port < 1 || port > 65535) {
            throw new Error("PORT must be a valid number between 1 and 65535")
        }

        return {
            port,
            environment,
            enableConsoleLogs,
            enableMetrics,
            shutdownTimeout,
            healthCheckInterval,
        }
    }

    /**
     * Valida configurações críticas
     */
    private validateConfiguration(): void {
        const requiredEnvVars = ["PORT"]
        const missing = requiredEnvVars.filter((varName) => !process.env[varName])

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
        }

        // Validações específicas por ambiente
        if (this.config.environment === "production") {
            this.validateProductionConfig()
        }
    }

    /**
     * Validações específicas para produção
     */
    private validateProductionConfig(): void {
        const productionRequired = [
            "DB_HOST",
            "DB_USERNAME",
            "DB_PASSWORD",
            "DB_NAME",
            "JWT_SECRET",
        ]
        const missing = productionRequired.filter((varName) => !process.env[varName])

        if (missing.length > 0) {
            throw new Error(
                `Production environment missing required variables: ${missing.join(", ")}`,
            )
        }

        if (this.config.enableConsoleLogs) {
            logger.warn("Console logs are enabled in production environment")
        }
    }

    /**
     * Inicializa métricas de boot
     */
    private initializeMetrics(): BootMetrics | null {
        if (process.env.ENABLE_METRICS) {
            return {
                startTime: Date.now(),
                steps: [],
            }
        }
        return null
    }

    /**
     * Verifica se os logs de inicialização devem ser exibidos no console
     */
    private shouldLog(): boolean {
        // Respeita a variável ENABLE_CONSOLE_LOGS
        return this.config.enableConsoleLogs
    }

    /**
     * Sistema de logging profissional
     * Respeita as variáveis de ambiente ENABLE_LOGGER e ENABLE_CONSOLE_LOGS
     */
    private log(level: "info" | "warn" | "error", message: string, data?: any): void {
        const logData = {
            timestamp: new Date().toISOString(),
            environment: this.config.environment,
            status: this.status,
            ...data,
        }

        const enableLogger = process.env.ENABLE_LOGGER !== "false"
        const shouldLogToConsole = this.shouldLog()

        switch (level) {
            case "info":
                if (enableLogger) {
                    logger.info(message, logData)
                }
                if (shouldLogToConsole) {
                    console.log(`${message}`, data ? data : "")
                }
                break
            case "warn":
                if (enableLogger) {
                    logger.warn(message, logData)
                }
                if (shouldLogToConsole) {
                    console.warn(`⚠️ ${message}`, data ? data : "")
                }
                break
            case "error":
                if (enableLogger) {
                    logger.error(message, logData)
                }
                // Erros sempre são exibidos no console para garantir visibilidade
                console.error(`❌ ${message}`, data ? data : "")
                break
        }
    }

    /**
     * Executa uma etapa do boot com métricas
     */
    private async executeBootStep<T>(stepName: string, stepFunction: () => Promise<T>): Promise<T> {
        const step: BootStep = {
            name: stepName,
            startTime: Date.now(),
            success: false,
        }

        try {
            this.log("info", `🔄 Starting: ${stepName}`)
            const result = await stepFunction()

            step.endTime = Date.now()
            step.duration = step.endTime - step.startTime
            step.success = true

            this.log("info", `✅ Completed: ${stepName}`, {
                duration: `${step.duration}ms`,
            })

            return result
        } catch (error) {
            step.endTime = Date.now()
            step.duration = step.endTime - step.startTime
            step.error = error as Error

            this.log("error", `❌ Failed: ${stepName}`, {
                duration: `${step.duration}ms`,
                error: step.error.message,
            })

            throw error
        } finally {
            if (this.metrics) {
                this.metrics.steps.push(step)
            }
        }
    }

    /**
     * Executa o boot completo da aplicação
     */
    async bootstrap(options: BootOptions = {}): Promise<void> {
        try {
            this.log("info", "🚀 Starting application bootstrap process", {
                environment: this.config.environment,
                port: this.config.port,
                enableMetrics: this.config.enableMetrics,
            })

            // Etapas do boot
            await this.executeBootStep("Database Connection", () => this.connectDatabase())
            await this.executeBootStep("Multipart Configuration", () => this.configureMultipart())
            await this.executeBootStep("Static Files Setup", () => this.setupStaticFiles())
            await this.executeBootStep("Routes Setup", () => this.setupRoutes())
            await this.executeBootStep("Swagger Setup", () => this.setupSwagger())
            await this.executeBootStep("Server Startup", () => this.startServer())
            await this.executeBootStep("Embeddings Worker Startup", () =>
                this.startEmbeddingsWorker(),
            )
            await this.executeBootStep("Graceful Shutdown Setup", () =>
                this.setupGracefulShutdown(),
            )

            // Configurações opcionais
            if (!options.skipHealthCheck) {
                await this.executeBootStep("Health Check Setup", () => this.setupHealthCheck())
            }

            if (!options.skipMetrics && this.config.enableMetrics) {
                await this.executeBootStep("Metrics Setup", () => this.setupMetrics())
            }

            this.status = AppStatus.RUNNING
            this.finalizeBootMetrics()
            if (this.metrics) {
                this.log("info", "🎉 Application bootstrap completed successfully", {
                    totalDuration: `${this.metrics.duration}ms`,
                    stepsCompleted: this.metrics.steps.length,
                })
            }
        } catch (error) {
            this.status = AppStatus.ERROR
            this.log("error", "💥 Application bootstrap failed", {
                error: (error as Error).message,
                stepsCompleted: this.metrics?.steps.length,
            })

            await this.shutdown()
            throw error
        }
    }

    /**
     * Verifica configurações de multipart/form-data
     *
     * Nota: O suporte a multipart já é configurado automaticamente
     * durante a criação do adapter HTTP (veja http.factory.ts)
     */
    private async configureMultipart(): Promise<void> {
        this.log("info", "Multipart/form-data support enabled", {
            maxFileSize: "500MB",
            maxFiles: 10,
            maxFieldSize: "10MB",
        })
    }

    /**
     * Conecta ao banco de dados com retry
     */
    private async connectDatabase(): Promise<void> {
        const maxRetries = 3
        const retryDelay = 1000

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.databaseAdapter.connect()

                if (!this.databaseAdapter.isConnected()) {
                    throw new Error(
                        "Database connection established but adapter reports disconnected",
                    )
                }

                this.log("info", "Database connection established", { attempt })
                return
            } catch (error) {
                if (attempt === maxRetries) {
                    throw new Error(
                        `Failed to connect to database after ${maxRetries} attempts: ${
                            (error as Error).message
                        }`,
                    )
                }

                this.log("warn", `Database connection attempt ${attempt} failed, retrying...`, {
                    attempt,
                    error: (error as Error).message,
                })

                await this.delay(retryDelay * attempt)
            }
        }
    }

    /**
     * Configura servir arquivos estáticos (uploads)
     */
    private async setupStaticFiles(): Promise<void> {
        try {
            const fastifyInstance = (api as any).getFastifyInstance?.()

            if (!fastifyInstance) {
                throw new Error("Fastify instance not available")
            }

            // Registrar plugin para servir arquivos estáticos
            await fastifyInstance.register(fastifyStatic, {
                root: path.join(process.cwd(), "uploads"),
                prefix: "/uploads/",
                constraints: {},
            })

            this.log("info", "Static files configured", {
                root: path.join(process.cwd(), "uploads"),
                prefix: "/uploads/",
            })
        } catch (error) {
            this.log("error", "Failed to configure static files", {
                error: (error as Error).message,
            })
            throw error
        }
    }

    /**
     * Configura as rotas da aplicação
     */
    private async setupRoutes(): Promise<void> {
        this.log("info", "🚀 Iniciando configuração de rotas...")
        try {
            await initializeRoutes(api)
            this.log("info", "✅ Routes configured successfully")
        } catch (error) {
            this.log("error", "❌ Erro ao configurar rotas", { error: (error as Error).message })
            throw error
        }
    }

    /**
     * Configura o Swagger para documentação da API
     */
    private async setupSwagger(): Promise<void> {
        try {
            // Resetar flag para evitar decorador duplicado
            resetSwaggerRegistration()

            // Criar adapter estendido com suporte ao Fastify
            const swaggerAdapter = {
                ...api,
                registerPlugin: (api as any).registerPlugin?.bind(api),
                fastify: (api as any).getFastifyInstance?.(),
                log: {
                    info: (message: string, ...args: any[]) => this.log("info", message, args[0]),
                    error: (message: string, ...args: any[]) => this.log("error", message, args[0]),
                    debug: (message: string, ...args: any[]) => {
                        if (this.shouldLog()) {
                            console.log(`🐛 ${message}`, args[0] || "")
                        }
                    },
                },
            }

            await setupSwagger(swaggerAdapter, {
                enableAutoGeneration: true,
                customSchemas: {},
                customTags: [],
            })

            this.log("info", "Swagger documentation configured successfully", {
                docsUrl: `http://localhost:${this.config.port}/docs`,
            })
        } catch (error) {
            this.log("error", "Failed to configure Swagger", { error: (error as Error).message })
            throw error
        }
    }

    /**
     * Inicia o servidor HTTP
     */
    private async startServer(): Promise<void> {
        await api.listen({ port: this.config.port })

        this.log("info", "HTTP server started successfully", {
            port: this.config.port,
            environment: this.config.environment,
            url: `http://localhost:${this.config.port}`,
        })
    }

    /**
     * Inicia o worker de embeddings
     */
    private async startEmbeddingsWorker(): Promise<void> {
        try {
            const momentRepository = MomentFactory.createMomentRepository(this.databaseAdapter)
            this.embeddingsWorker = new EmbeddingsWorker(momentRepository)
            this.embeddingsWorker.start()

            this.log("info", "Embeddings worker started successfully", {
                scheduleTime: process.env.EMBEDDINGS_SCHEDULE_TIME || "01:00",
            })
        } catch (error) {
            this.log("error", "Failed to start embeddings worker", {
                error: (error as Error).message,
            })
            // Não throw error - worker é opcional
        }
    }

    /**
     * Configura graceful shutdown e tratamento de erros
     */
    private async setupGracefulShutdown(): Promise<void> {
        const signals = ["SIGTERM", "SIGINT", "SIGUSR2"]

        signals.forEach((signal) => {
            process.on(signal, async () => {
                this.log("info", `Received ${signal}, initiating graceful shutdown...`)
                await this.shutdown()
            })
        })

        process.on("uncaughtException", (error) => {
            this.log("error", "Uncaught Exception detected", { error: error.message })
            this.shutdown().then(() => process.exit(1))
        })

        process.on("unhandledRejection", (reason, promise) => {
            this.log("error", "Unhandled Rejection detected", {
                reason: reason instanceof Error ? reason.message : String(reason),
                promise: promise.toString(),
            })
            this.shutdown().then(() => process.exit(1))
        })
    }

    /**
     * Configura health check
     */
    private async setupHealthCheck(): Promise<void> {
        this.healthCheckInterval = setInterval(async () => {
            try {
                const isHealthy = await this.performHealthCheck()
                if (!isHealthy) {
                    this.log("warn", "Health check failed")
                }
            } catch (error) {
                this.log("error", "Health check error", { error: (error as Error).message })
            }
        }, this.config.healthCheckInterval)

        this.log("info", "Health check configured", {
            interval: `${this.config.healthCheckInterval}ms`,
        })
    }

    /**
     * Executa health check
     */
    private async performHealthCheck(): Promise<boolean> {
        try {
            // Verificar conexão com banco
            if (!this.databaseAdapter.isConnected()) {
                return false
            }

            // Verificar se o servidor está respondendo
            // Aqui você pode adicionar mais verificações específicas
            return true
        } catch {
            return false
        }
    }

    /**
     * Configura métricas
     */
    private async setupMetrics(): Promise<void> {
        // Aqui você pode integrar com sistemas de métricas como Prometheus, DataDog, etc.
        this.log("info", "Metrics collection configured")
    }

    /**
     * Finaliza métricas de boot
     */
    private finalizeBootMetrics(): void {
        if (this.metrics) {
            this.metrics.endTime = Date.now()
            this.metrics.duration = this.metrics.endTime - this.metrics.startTime

            if (this.config.enableMetrics) {
                this.log("info", "Boot metrics collected", {
                    totalDuration: `${this.metrics.duration}ms`,
                    stepsCount: this.metrics.steps.length,
                    averageStepDuration: `${Math.round(
                        this.metrics.duration / this.metrics.steps.length,
                    )}ms`,
                })
            }
        }
    }

    /**
     * Executa shutdown graceful da aplicação
     */
    async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            this.log("warn", "Shutdown already in progress")
            return
        }

        this.isShuttingDown = true
        this.status = AppStatus.SHUTTING_DOWN

        const shutdownStartTime = Date.now()

        try {
            this.log("info", "Starting graceful shutdown process")

            // Configurar timeout para shutdown
            this.shutdownTimeout = setTimeout(() => {
                this.log("error", "Shutdown timeout reached, forcing exit")
                process.exit(1)
            }, this.config.shutdownTimeout)

            // Parar health check
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval)
                this.log("info", "Health check stopped")
            }

            // Parar embeddings worker
            if (this.embeddingsWorker) {
                await this.embeddingsWorker.stop()
                this.log("info", "Embeddings worker stopped")
            }

            // Desconectar do banco
            await this.databaseAdapter.disconnect()
            this.log("info", "Database connection closed")

            // Fechar servidor HTTP
            await api.close()
            this.log("info", "HTTP server closed")

            // Limpar timeout
            if (this.shutdownTimeout) {
                clearTimeout(this.shutdownTimeout)
            }

            this.status = AppStatus.STOPPED
            const shutdownDuration = Date.now() - shutdownStartTime

            this.log("info", "Graceful shutdown completed", {
                duration: `${shutdownDuration}ms`,
            })

            process.exit(0)
        } catch (error) {
            this.status = AppStatus.ERROR
            this.log("error", "Error during shutdown", { error: (error as Error).message })
            process.exit(1)
        }
    }

    /**
     * Utilitário para delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    /**
     * Obtém status atual da aplicação
     */
    getStatus(): AppStatus {
        return this.status
    }

    /**
     * Obtém métricas de boot
     */
    getMetrics(): BootMetrics | null {
        return this.metrics ? { ...this.metrics } : null
    }

    /**
     * Obtém configuração da aplicação
     */
    getConfig(): AppConfig {
        return { ...this.config }
    }
}

// Exportar também como Boot para compatibilidade
export { ApplicationBootstrapper as Boot }
