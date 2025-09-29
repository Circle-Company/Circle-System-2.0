import { Device, Level } from "@/domain/authorization"

import { HttpRequest } from "@/infra/http"

export interface AuthenticatedUser {
    id: string
    device: Device
    level: Level
}

export interface AuthenticatedRequest extends HttpRequest {
    user: AuthenticatedUser
}

export interface AuthorizationOptions {
    action: string
    requireAuth?: boolean
}
