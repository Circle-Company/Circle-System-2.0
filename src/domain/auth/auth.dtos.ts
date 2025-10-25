import {
    UserPreferences,
    UserPublicProfile,
    UserStatus,
    UserTerm,
} from "@/domain/user/types/user.type"

import { Device } from "@/domain/authorization/authorization.type"
import { UserMetrics } from "../user/entities/user.metrics.entity"

export interface SignRequest {
    username: string
    password: string
    termsAccepted: boolean
    signType: string
    ipAddress: string
    machineId: string
    userAgent?: string
    timezone: string
    latitude: number
    longitude: number
}
export interface SecurityInfo {
    riskLevel: string
    status: string
    message: string
    additionalData?: any
}

export interface Metadata {
    device?: Device
    language?: string
    termsAccepted?: boolean
    ipAddress?: string
    userAgent?: string
    machineId?: string
    timezone?: string
    latitude?: number
    longitude?: number
}

export interface SignInputDto {
    username: string
    password: string
    metadata?: Metadata
}

export interface SignOutputDto {
    user: UserPublicProfile
    preferences: UserPreferences
    metrics: UserMetrics
    status: UserStatus
    terms: UserTerm
}

export interface SignUpInputDto extends SignInputDto {}
export interface SignInInputDto extends SignInputDto {}

export interface SignUpOutputDto extends SignOutputDto {
    token: string
    expiresIn: number
    securityInfo?: SecurityInfo
}
export interface SignInOutputDto extends SignOutputDto {
    token: string
    expiresIn: number
    securityInfo?: SecurityInfo
}
