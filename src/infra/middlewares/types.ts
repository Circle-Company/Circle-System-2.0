import { Device, Level } from "@/domain/authorization"

import { HttpRequest } from "@/infra/http"

export interface AuthenticatedUser {
    id: string
    device: Device
    level: Level
    timezone: number // Timezone offset em horas (ex: -3, 0, +5)
}

export interface AuthenticatedRequest extends HttpRequest {
    user: AuthenticatedUser
}

export interface AuthorizationOptions {
    action: string
    requireAuth?: boolean
}
