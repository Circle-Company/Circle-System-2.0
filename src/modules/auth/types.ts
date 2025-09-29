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

export interface SignInRequest {
    username: string
    password: string
}

export interface SignUpRequest {
    username: string
    password: string
}

export interface AuthRequestHeaders {
    device: string
    ipAddress: string
    machineId: string
    userAgent?: string
    timezone: string
    latitude: number
    longitude: number
}
