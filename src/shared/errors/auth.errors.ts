import { BaseError, ErrorCode, ErrorType } from "./base"

export class InvalidCredentialsError extends BaseError {
    constructor(message?: string, additionalContext?: any) {
        super({
            message: message || "Credenciais inválidas",
            type: ErrorType.AUTHENTICATION,
            code: ErrorCode.INVALID_CREDENTIALS,
            action: "AUTHENTICATE_USER",
            context: { additionalData: additionalContext || {} },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 401
    }
}

export class TokenExpiredError extends BaseError {
    constructor(tokenId?: string) {
        super({
            message: "Authentication token has expired",
            type: ErrorType.AUTHENTICATION,
            code: ErrorCode.TOKEN_EXPIRED,
            action: "VALIDATE_TOKEN",
            context: { additionalData: { tokenId } },
            metadata: {
                severity: "low",
                retryable: false,
                logLevel: "info",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 401
    }
}

export class TokenInvalidError extends BaseError {
    constructor(reason?: string) {
        super({
            message: "Authentication token is invalid",
            type: ErrorType.AUTHENTICATION,
            code: ErrorCode.TOKEN_INVALID,
            action: "VALIDATE_TOKEN",
            context: { additionalData: { reason } },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 401
    }
}

export class AccessDeniedError extends BaseError {
    constructor(resource?: string, action?: string) {
        super({
            message: "Access denied to resource",
            type: ErrorType.AUTHENTICATION,
            code: ErrorCode.ACCESS_DENIED,
            action: "CHECK_ACCESS",
            context: { additionalData: { resource, action } },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 403
    }
}

export class UserInactiveError extends BaseError {
    constructor(userId: string) {
        super({
            message:
                "Sua conta está desativada. Entre em contato com o suporte para reativar sua conta.",
            type: ErrorType.AUTHENTICATION,
            code: ErrorCode.ACCESS_DENIED,
            action: "AUTHENTICATE_USER",
            context: { additionalData: { userId } },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 401
    }
}

export class AccountLockedError extends BaseError {
    constructor(userId: string, reason?: string) {
        super({
            message: `Account ${userId} is locked`,
            type: ErrorType.AUTHENTICATION,
            code: ErrorCode.ACCESS_DENIED,
            action: "AUTHENTICATE_USER",
            context: { additionalData: { userId, reason } },
            metadata: {
                severity: "high",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 423 // Locked
    }
}

export class TooManyAttemptsError extends BaseError {
    constructor(email: string, attempts: number) {
        super({
            message: `Too many authentication attempts for ${email}`,
            type: ErrorType.AUTHENTICATION,
            code: ErrorCode.ACCESS_DENIED,
            action: "AUTHENTICATE_USER",
            context: { additionalData: { email, attempts } },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 429 // Too Many Requests
    }
}

export class InvalidDeviceError extends BaseError {
    constructor(device: string) {
        super({
            message: `Invalid device type: ${device}`,
            type: ErrorType.VALIDATION,
            code: ErrorCode.INVALID_INPUT,
            action: "VALIDATE_DEVICE",
            context: { additionalData: { device } },
            metadata: {
                severity: "low",
                retryable: false,
                logLevel: "info",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 400
    }
}

export class SessionExpiredError extends BaseError {
    constructor(sessionId?: string) {
        super({
            message: "User session has expired",
            type: ErrorType.AUTHENTICATION,
            code: ErrorCode.TOKEN_EXPIRED,
            action: "VALIDATE_SESSION",
            context: { additionalData: { sessionId } },
            metadata: {
                severity: "low",
                retryable: false,
                logLevel: "info",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 401
    }
}

export class UserAlreadyExistsError extends BaseError {
    constructor(email: string) {
        super({
            message: `User with email ${email} already exists`,
            type: ErrorType.VALIDATION,
            code: ErrorCode.INVALID_INPUT,
            action: "CREATE_USER",
            context: { additionalData: { email } },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 409 // Conflict
    }
}

export class SecurityRiskError extends BaseError {
    constructor(reason: string, securityRisk: string) {
        super({
            message: `Security risk detected: ${reason}`,
            type: ErrorType.SECURITY,
            code: ErrorCode.SECURITY_VIOLATION,
            action: "SECURITY_CHECK",
            context: { additionalData: { reason, securityRisk } },
            metadata: {
                severity: "high",
                retryable: false,
                logLevel: "error",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 403 // Forbidden
    }
}

export class SuspiciousActivityError extends BaseError {
    constructor(reason: string, additionalData?: any) {
        super({
            message: `Suspicious activity detected: ${reason}`,
            type: ErrorType.SECURITY,
            code: ErrorCode.SECURITY_VIOLATION,
            action: "SECURITY_CHECK",
            context: { additionalData: { reason, ...additionalData } },
            metadata: {
                severity: "high",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 403 // Forbidden
    }
}
