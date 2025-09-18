import { api } from "@/infra/api"
import { routes as userRoutes } from "@/modules/users/user.routes"

async function initializeRoutes() {
    await api.register(userRoutes)
}

async function initializeServer() {
    if (!process.env.PORT) throw new Error("PORT is not defined")
    //await initializeDatabase()
    await initializeRoutes()
    await api.listen({ port: Number(process.env.PORT) })
}

initializeServer()
