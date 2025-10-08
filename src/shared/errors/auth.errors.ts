import { BaseError, ErrorCode, ErrorType } from "./base"

export class InvalidCredentialsError extends BaseError {
    constructor(message?: string, additionalContext?: any) {
        super({
            message: message || "Invalid credentials",
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
        return 401 // Unauthorized
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
        return 401 // Unauthorized
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
        return 401 // Unauthorized
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
        return 403 // Forbidden
    }
}

export class UserInactiveError extends BaseError {
    constructor(userId: string) {
        super({
            message:
                "Your account has been deactivated. Contact support to reactivate your account.",
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
        return 401 // Unauthorized
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
    constructor(username: string, attempts: number) {
        super({
            message: `Too many authentication attempts for @${username}`,
            type: ErrorType.AUTHENTICATION,
            code: ErrorCode.ACCESS_DENIED,
            action: "AUTHENTICATE_USER",
            context: { additionalData: { username, attempts } },
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
        return 400 // Bad Request
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
        return 401 // Unauthorized
    }
}

export class UserAlreadyExistsError extends BaseError {
    constructor(username: string) {
        super({
            message: `User with username @${username} already exists`,
            type: ErrorType.VALIDATION,
            code: ErrorCode.INVALID_INPUT,
            action: "CREATE_USER",
            context: { additionalData: { username } },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 401 // Unauthorized
    }
}

export class SecurityRiskError extends BaseError {
    constructor(reason: string, securityRisk: string) {
        super({
            message: `Security risk detected: ${reason}`,
            type: ErrorType.AUTHORIZATION,
            code: ErrorCode.ACCESS_DENIED,
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
            type: ErrorType.AUTHORIZATION,
            code: ErrorCode.ACCESS_DENIED,
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

/**
 * Erro lançado quando usuário tenta fazer login sem aceitar os termos de uso
 */
export class TermsNotAcceptedError extends BaseError {
    constructor() {
        super({
            message: "Terms of use must be accepted to proceed",
            type: ErrorType.VALIDATION,
            code: ErrorCode.INVALID_INPUT,
            action: "AUTHENTICATE_USER",
            context: {
                additionalData: {
                    field: "termsAccepted",
                    required: true,
                },
            },
            metadata: {
                severity: "low",
                retryable: true,
                logLevel: "info",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 400 // Bad Request
    }
}

/**
 * Erro lançado quando o IP address é inválido ou não fornecido
 */
export class InvalidIpAddressError extends BaseError {
    constructor(ipAddress?: string) {
        super({
            message: ipAddress ? `Invalid IP address: ${ipAddress}` : "IP address is required",
            type: ErrorType.VALIDATION,
            code: ErrorCode.INVALID_INPUT,
            action: "VALIDATE_IP_ADDRESS",
            context: {
                additionalData: {
                    ipAddress,
                    field: "ipAddress",
                    required: true,
                },
            },
            metadata: {
                severity: "low",
                retryable: false,
                logLevel: "info",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 400 // Bad Request
    }
}
