import { Router as AuthRouter } from "./auth/auth.router"
import { DatabaseAdapterFactory } from "../database/adapter"
import { HttpAdapter } from "../http/http.type"
import { Router as MomentCommentRouter } from "./moment/moment.comment.router"
import { Router as MomentRouter } from "./moment/moment.router"
import { SwipeEngine } from "@/core/swipe.engine"
import { Router as UserRouter } from "./user/user.router"

export async function initialize(httpAdapter: HttpAdapter) {
    const databaseAdapter = DatabaseAdapterFactory.createForEnvironment(
        process.env.NODE_ENV || "development",
    )
    const swipeEngine = new SwipeEngine()
    
    await AuthRouter(httpAdapter, databaseAdapter)
    await UserRouter(httpAdapter, databaseAdapter)
    await MomentRouter(httpAdapter, swipeEngine, databaseAdapter)
    await MomentCommentRouter(httpAdapter, databaseAdapter)
}

export { AuthRouter, MomentCommentRouter, MomentRouter, UserRouter }
