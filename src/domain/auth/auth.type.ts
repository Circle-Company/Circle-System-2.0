export enum Device {
    WEB = "web",
    MOBILE = "mobile",
}

export enum AuthLogType {
    SIGNIN = "signin",
    SIGNUP = "signup",
    SIGNOUT = "signout",
}

export enum AuthLogStatus {
    SUCCESS = "success",
    FAILED = "failed",
    BLOCKED = "blocked",
}

export interface AuthLogContext {
    ip?: string
    userAgent?: string
    timestamp?: Date
}
