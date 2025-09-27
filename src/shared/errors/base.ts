/**
 * Tipos de erro padronizados para o sistema
 */
export enum ErrorType {
    VALIDATION = "VALIDATION",
    BUSINESS = "BUSINESS",
    SYSTEM = "SYSTEM",
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
}

/**
 * Códigos de erro padronizados
 */
export enum ErrorCode {
    // Validação (1000-1999)
    INVALID_INPUT = "VAL_1001",
    MISSING_REQUIRED_FIELD = "VAL_1002",
    INVALID_FORMAT = "VAL_1003",
    INVALID_RANGE = "VAL_1004",

    // Negócio (2000-2999)
    USER_NOT_FOUND = "BUS_2001",
    INVALID_CREDENTIALS = "BUS_2002",
    RESOURCE_EXISTS = "BUS_2003",
    OPERATION_NOT_ALLOWED = "BUS_2004",

    // Sistema (3000-3999)
    DATABASE_ERROR = "SYS_3001",
    EXTERNAL_API_ERROR = "SYS_3002",
    CONFIGURATION_ERROR = "SYS_3003",
    INTERNAL_ERROR = "SYS_3004",

    // Autenticação (4000-4999)
    TOKEN_EXPIRED = "AUTH_4001",
    TOKEN_INVALID = "AUTH_4002",
    ACCESS_DENIED = "AUTH_4003",

    // Autorização (5000-5999)
    INSUFFICIENT_PERMISSIONS = "AUTHZ_5001",
    ROLE_NOT_FOUND = "AUTHZ_5002",
}

/**
 * Interface para contexto adicional do erro
 */
export interface ErrorContext {
    userId?: string
    requestId?: string
    timestamp?: string
    path?: string
    method?: string
    ip?: string
    userAgent?: string
    additionalData?: Record<string, any>
}

/**
 * Interface para metadados do erro
 */
export interface ErrorMetadata {
    severity: "low" | "medium" | "high" | "critical"
    retryable: boolean
    logLevel: "debug" | "info" | "warn" | "error"
    notifyAdmin?: boolean
}

/**
 * Classe base para todos os erros customizados do sistema
 */
export abstract class BaseError extends Error {
    public readonly type: ErrorType
    public readonly code: ErrorCode
    public readonly action: string
    public readonly context: ErrorContext
    public readonly metadata: ErrorMetadata
    public readonly timestamp: string

    constructor({
        message,
        type,
        code,
        action,
        context = {},
        metadata = {
            severity: "medium",
            retryable: false,
            logLevel: "error",
        },
    }: {
        message: string
        type: ErrorType
        code: ErrorCode
        action: string
        context?: ErrorContext
        metadata?: Partial<ErrorMetadata>
    }) {
        super(message)

        this.name = this.constructor.name
        this.type = type
        this.code = code
        this.action = action
        this.timestamp = new Date().toISOString()

        // Contexto com valores padrão
        this.context = {
            timestamp: this.timestamp,
            ...context,
        }

        // Metadados com valores padrão
        this.metadata = {
            severity: "medium",
            retryable: false,
            logLevel: "error",
            ...metadata,
        }

        // Garantir que o stack trace seja capturado corretamente
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor)
        }
    }

    /**
     * Converte o erro para um objeto serializável
     */
    toJSON(): Record<string, any> {
        return {
            name: this.name,
            message: this.message,
            type: this.type,
            code: this.code,
            action: this.action,
            context: this.context,
            metadata: this.metadata,
            timestamp: this.timestamp,
            stack: this.stack,
        }
    }

    /**
     * Converte o erro para formato de resposta HTTP
     */
    toHttpResponse(): {
        statusCode: number
        error: string
        message: string
        code: string
        action: string
        timestamp: string
        path?: string
    } {
        return {
            statusCode: this.getHttpStatusCode(),
            error: this.name,
            message: this.message,
            code: this.code,
            action: this.action,
            timestamp: this.timestamp,
            path: this.context.path,
        }
    }

    /**
     * Retorna o código de status HTTP apropriado
     */
    protected abstract getHttpStatusCode(): number
}
