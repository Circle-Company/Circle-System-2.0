import { HttpAdapter } from "../http/http.type"
import { Router as AuthRouter } from "./auth/auth.router"
import { Router as MomentMetricsRouter } from "./moment/moment.metrics.router"
import { Router as MomentRouter } from "./moment/moment.router"

export async function initialize(api: HttpAdapter) {
    await AuthRouter(api)
    await MomentRouter(api)
    await MomentMetricsRouter(api)
}

export { AuthRouter, MomentMetricsRouter, MomentRouter }
