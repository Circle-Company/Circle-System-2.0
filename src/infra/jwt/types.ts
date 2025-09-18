import { JWTPayload } from "jose"
import { Level } from "@/core/access.control/types"

export interface JwtConfig {
    secret: string
    issuer: string
    audience: string
    expiresIn: number
}

export interface JwtPayload extends JWTPayload {
    sub: string
    username: string
    timezone: string
    permissionLevel: Level
}

export interface JwtEncoderParams {
    userId: string
    username: string
    timezone: string
    permissionLevel: Level
}

export interface JwtDecodeResult {
    payload: JwtPayload
    isValid: boolean
    error?: string
}

export interface JwtTokenInfo {
    userId: string | null
    username: string | null
    timezone: string | null
    permissionLevel: Level | null
    issuedAt: Date | null
    expiresAt: Date | null
    isExpired: boolean
    timeUntilExpiration: number
}
