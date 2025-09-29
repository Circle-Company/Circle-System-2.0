import { HttpAdapter, HttpRequest, HttpResponse } from "../../http/http.type"

import { MomentFactory } from "@/infra/factories/moment.factory"

export class MomentMetricsRouter {
    constructor(private api: HttpAdapter) {}

    /**
     * Registra todas as rotas de métricas de moment
     */
    register(): void {
        this.registerMomentMetrics()
        this.registerUserMetrics()
    }

    /**
     * Moment metrics
     */
    private registerMomentMetrics(): void {
        const momentMetricsController = MomentFactory.getMomentMetricsController()

        this.api.get(
            "/moments/:id/metrics",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    const momentId = request.params?.id
                    const userId = request.user?.id || ""
                    const queryParams = request.query || {}

                    const result = await momentMetricsController.getMomentMetrics(
                        momentId,
                        userId,
                        queryParams,
                    )

                    response.status(200).send(result)
                } catch (error) {
                    response
                        .status(
                            error instanceof Error && error.message.includes("Não autorizado")
                                ? 401
                                : 500,
                        )
                        .send({
                            error:
                                error instanceof Error ? error.message : "Erro interno do servidor",
                        })
                }
            },
            {
                schema: {
                    tags: ["Moment Metrics"],
                    summary: "Obter métricas do momento",
                    description: "Retorna métricas detalhadas de um momento específico",
                },
            },
        )

        this.api.get(
            "/moments/analytics",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    const userId = request.user?.id || ""
                    const queryParams = request.query || {}

                    const result = await momentMetricsController.getMomentsAnalytics(
                        userId,
                        queryParams,
                    )

                    response.status(200).send(result)
                } catch (error) {
                    response
                        .status(
                            error instanceof Error && error.message.includes("Não autorizado")
                                ? 401
                                : 500,
                        )
                        .send({
                            error:
                                error instanceof Error ? error.message : "Erro interno do servidor",
                        })
                }
            },
            {
                schema: {
                    tags: ["Analytics"],
                    summary: "Obter analytics dos momentos",
                    description: "Retorna analytics gerais dos momentos do usuário",
                },
            },
        )
    }

    /**
     * Owner metrics
     */
    private registerUserMetrics(): void {
        const momentMetricsController = MomentFactory.getMomentMetricsController()

        this.api.get(
            "/users/:userId/moments/analytics",
            async (request: HttpRequest, response: HttpResponse) => {
                try {
                    const userId = request.params?.userId || ""
                    const queryParams = request.query || {}

                    const result = await momentMetricsController.getMomentsAnalytics(
                        userId,
                        queryParams,
                    )

                    response.status(200).send(result)
                } catch (error) {
                    response
                        .status(
                            error instanceof Error && error.message.includes("Não autorizado")
                                ? 401
                                : 500,
                        )
                        .send({
                            error:
                                error instanceof Error ? error.message : "Erro interno do servidor",
                        })
                }
            },
        )
    }
}

/**
 * Função de compatibilidade para inicialização das rotas
 */
export async function Router(api: HttpAdapter): Promise<void> {
    const routes = new MomentMetricsRouter(api)
    routes.register()
}
