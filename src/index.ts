import { ApplicationBootstrapper } from "@/bootstrapper"

/**
 * Ponto de entrada principal da aplicação
 */
async function main(): Promise<void> {
    try {
        const application = new ApplicationBootstrapper()

        // Configurações opcionais de boot
        const bootOptions = {
            skipHealthCheck: process.env.SKIP_HEALTH_CHECK === "true",
            skipMetrics: process.env.SKIP_METRICS === "true",
            timeout: process.env.BOOT_TIMEOUT ? Number(process.env.BOOT_TIMEOUT) : undefined,
        }

        await application.bootstrap(bootOptions)

        // Log de sucesso
        console.log("🎉 Application started successfully!")
    } catch (error) {
        console.error("💥 Failed to start application:", error)
        process.exit(1)
    }
}

// Executar aplicação
main()
