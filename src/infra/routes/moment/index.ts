/**
 * Exportações do módulo de rotas de momentos
 */

export { MomentRouter, Router } from "./moment.router"
export * from "./moment.router.schemas"

/**
 * Inicialização padrão das rotas de momentos
 */
export async function initializeMomentRoutes(httpAdapter: any): Promise<void> {
    const { Router } = await import("./moment.router")
    await Router(httpAdapter)
}
