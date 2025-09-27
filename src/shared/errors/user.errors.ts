import { BaseError, ErrorCode, ErrorType } from "./base"

export class UserNotFoundError extends BaseError {
    constructor(userId: string) {
        super({
            message: `User with ID ${userId} not found`,
            type: ErrorType.NOT_FOUND,
            code: ErrorCode.USER_NOT_FOUND,
            action: "FIND_USER",
            context: { additionalData: { userId } },
            metadata: {
                severity: "low",
                retryable: false,
                logLevel: "warn",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 404
    }
}

export class EmailAlreadyExistsError extends BaseError {
    constructor(email: string) {
        super({
            message: `Email ${email} is already in use`,
            type: ErrorType.CONFLICT,
            code: ErrorCode.RESOURCE_EXISTS,
            action: "CREATE_USER",
            context: { additionalData: { email } },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "info",
            },
        })
    }

    protected getHttpStatusCode(): number {
        return 409
    }
}

export class InvalidUserDataError extends BaseError {
    constructor(field: string, message: string) {
        super({
            message: `Invalid data for ${field}: ${message}`,
            type: ErrorType.VALIDATION,
            code: ErrorCode.INVALID_INPUT,
            action: "VALIDATE_USER_DATA",
            context: { additionalData: { field, message } },
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

export class UserPermissionError extends BaseError {
    constructor(action: string, userId: string) {
        super({
            message: `User ${userId} does not have permission for ${action}`,
            type: ErrorType.AUTHORIZATION,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "CHECK_USER_PERMISSION",
            context: { additionalData: { action, userId } },
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
