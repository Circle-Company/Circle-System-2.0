import { DatabaseAdapterFactory } from "../database/adapter"
import { HttpAdapter } from "../http/http.type"
import { Router as AuthRouter } from "./auth/auth.router"
import { Router as MomentCommentRouter } from "./moment/moment.comment.router"
import { Router as MomentMetricsRouter } from "./moment/moment.metrics.router"
import { Router as MomentRouter } from "./moment/moment.router"
import { Router as UserRouter } from "./user/user.router"

export async function initialize(httpAdapter: HttpAdapter) {
    const databaseAdapter = DatabaseAdapterFactory.createForEnvironment(
        process.env.NODE_ENV || "development",
    )
    await AuthRouter(httpAdapter, databaseAdapter)
    await UserRouter(httpAdapter, databaseAdapter)
    await MomentRouter(httpAdapter, databaseAdapter)
    await MomentCommentRouter(httpAdapter, databaseAdapter)
    await MomentMetricsRouter(httpAdapter, databaseAdapter)
}

export { AuthRouter, MomentCommentRouter, MomentMetricsRouter, MomentRouter, UserRouter }
