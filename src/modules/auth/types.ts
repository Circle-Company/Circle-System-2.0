import { SignLogAttributes, SignType } from "@/infra/models/auth/sign.logs.model"

import { UserAttributes } from "@/infra/models/user/user.model"

export interface SignData {
    logs: SignLogAttributes
    user: UserAttributes
}

export interface SignRequest {
    username: string
    password: string
    signType: SignType
    ipAddress: string
    machineId?: string
    latitude?: number
    longitude?: number
    timezone?: string
    termsAccepted: boolean
    userAgent?: string
}
