/**
 * Exportações do módulo de rotas de momentos
 */

export { Router as CommentRouter, MomentCommentRouter } from "./moment.comment.router"
export { MomentRouter, Router } from "./moment.router"
export * from "./moment.router.schemas"

/**
 * Inicialização padrão das rotas de momentos
 */
export async function initializeMomentRoutes(httpAdapter: any): Promise<void> {
    const { Router } = await import("./moment.router")
    await Router(httpAdapter)
}

/**
 * Inicialização das rotas de comentários de momentos
 */
export async function initializeMomentCommentRoutes(httpAdapter: any): Promise<void> {
    const { Router } = await import("./moment.comment.router")
    await Router(httpAdapter)
}
