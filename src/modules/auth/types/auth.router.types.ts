import { SignType } from "@/infra/models/auth/sign.logs.model"

export interface SignInRequestBody {
    username: string
    password: string
    signType: SignType
    ipAddress: string
    machineId: string
    latitude: number
    longitude: number
    timezone: string
    termsAccepted: boolean
    userAgent: string
}
export interface SignInRequestHeaders {
    ipAddress: string
    machineId: string
    timezone: string
    userAgent: string
}

export interface SignInRequest extends SignInRequestBody, SignInRequestHeaders {}
