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

/**
 * Erro de validação - para dados inválidos ou malformados
 */
export class ValidationError extends BaseError {
    constructor({
        message,
        code = ErrorCode.INVALID_INPUT,
        action,
        context = {},
        metadata = {
            severity: "low",
            retryable: false,
            logLevel: "warn",
        },
    }: {
        message: string
        code?: ErrorCode
        action: string
        context?: ErrorContext
        metadata?: Partial<ErrorMetadata>
    }) {
        super({
            message,
            type: ErrorType.VALIDATION,
            code,
            action,
            context,
            metadata,
        })
    }

    protected getHttpStatusCode(): number {
        return 400
    }
}

/**
 * Erro de negócio - para regras de negócio violadas
 */
export class BusinessError extends BaseError {
    constructor({
        message,
        code = ErrorCode.OPERATION_NOT_ALLOWED,
        action,
        context = {},
        metadata = {
            severity: "medium",
            retryable: false,
            logLevel: "warn",
        },
    }: {
        message: string
        code?: ErrorCode
        action: string
        context?: ErrorContext
        metadata?: Partial<ErrorMetadata>
    }) {
        super({
            message,
            type: ErrorType.BUSINESS,
            code,
            action,
            context,
            metadata,
        })
    }

    protected getHttpStatusCode(): number {
        return 422
    }
}

/**
 * Erro de sistema - para falhas internas do sistema
 */
export class SystemError extends BaseError {
    constructor({
        message,
        code = ErrorCode.INTERNAL_ERROR,
        action,
        context = {},
        metadata = {
            severity: "high",
            retryable: true,
            logLevel: "error",
            notifyAdmin: true,
        },
    }: {
        message: string
        code?: ErrorCode
        action: string
        context?: ErrorContext
        metadata?: Partial<ErrorMetadata>
    }) {
        super({
            message,
            type: ErrorType.SYSTEM,
            code,
            action,
            context,
            metadata,
        })
    }

    protected getHttpStatusCode(): number {
        return 500
    }
}

/**
 * Erro de autenticação - para problemas de autenticação
 */
export class AuthenticationError extends BaseError {
    constructor({
        message,
        code = ErrorCode.TOKEN_INVALID,
        action,
        context = {},
        metadata = {
            severity: "medium",
            retryable: false,
            logLevel: "warn",
        },
    }: {
        message: string
        code?: ErrorCode
        action: string
        context?: ErrorContext
        metadata?: Partial<ErrorMetadata>
    }) {
        super({
            message,
            type: ErrorType.AUTHENTICATION,
            code,
            action,
            context,
            metadata,
        })
    }

    protected getHttpStatusCode(): number {
        return 401
    }
}

/**
 * Erro de autorização - para problemas de permissão
 */
export class AuthorizationError extends BaseError {
    constructor({
        message,
        code = ErrorCode.INSUFFICIENT_PERMISSIONS,
        action,
        context = {},
        metadata = {
            severity: "medium",
            retryable: false,
            logLevel: "warn",
        },
    }: {
        message: string
        code?: ErrorCode
        action: string
        context?: ErrorContext
        metadata?: Partial<ErrorMetadata>
    }) {
        super({
            message,
            type: ErrorType.AUTHORIZATION,
            code,
            action,
            context,
            metadata,
        })
    }

    protected getHttpStatusCode(): number {
        return 403
    }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends BaseError {
    constructor({
        message,
        code = ErrorCode.USER_NOT_FOUND,
        action,
        context = {},
        metadata = {
            severity: "low",
            retryable: false,
            logLevel: "info",
        },
    }: {
        message: string
        code?: ErrorCode
        action: string
        context?: ErrorContext
        metadata?: Partial<ErrorMetadata>
    }) {
        super({
            message,
            type: ErrorType.NOT_FOUND,
            code,
            action,
            context,
            metadata,
        })
    }

    protected getHttpStatusCode(): number {
        return 404
    }
}

/**
 * Erro de conflito - para recursos que já existem ou estão em conflito
 */
export class ConflictError extends BaseError {
    constructor({
        message,
        code = ErrorCode.RESOURCE_EXISTS,
        action,
        context = {},
        metadata = {
            severity: "medium",
            retryable: false,
            logLevel: "warn",
        },
    }: {
        message: string
        code?: ErrorCode
        action: string
        context?: ErrorContext
        metadata?: Partial<ErrorMetadata>
    }) {
        super({
            message,
            type: ErrorType.CONFLICT,
            code,
            action,
            context,
            metadata,
        })
    }

    protected getHttpStatusCode(): number {
        return 409
    }
}

/**
 * Erro de serviço externo - para falhas em APIs externas
 */
export class ExternalServiceError extends BaseError {
    constructor({
        message,
        code = ErrorCode.EXTERNAL_API_ERROR,
        action,
        context = {},
        metadata = {
            severity: "high",
            retryable: true,
            logLevel: "error",
        },
    }: {
        message: string
        code?: ErrorCode
        action: string
        context?: ErrorContext
        metadata?: Partial<ErrorMetadata>
    }) {
        super({
            message,
            type: ErrorType.EXTERNAL_SERVICE,
            code,
            action,
            context,
            metadata,
        })
    }

    protected getHttpStatusCode(): number {
        return 502
    }
}

/**
 * Factory para criar erros de forma consistente
 */
export class ErrorFactory {
    /**
     * Cria um erro de validação
     */
    static validation(message: string, action: string, context?: ErrorContext): ValidationError {
        return new ValidationError({ message, action, context })
    }

    /**
     * Cria um erro de negócio
     */
    static business(message: string, action: string, context?: ErrorContext): BusinessError {
        return new BusinessError({ message, action, context })
    }

    /**
     * Cria um erro de sistema
     */
    static system(message: string, action: string, context?: ErrorContext): SystemError {
        return new SystemError({ message, action, context })
    }

    /**
     * Cria um erro de autenticação
     */
    static authentication(
        message: string,
        action: string,
        context?: ErrorContext,
    ): AuthenticationError {
        return new AuthenticationError({ message, action, context })
    }

    /**
     * Cria um erro de autorização
     */
    static authorization(
        message: string,
        action: string,
        context?: ErrorContext,
    ): AuthorizationError {
        return new AuthorizationError({ message, action, context })
    }

    /**
     * Cria um erro de não encontrado
     */
    static notFound(message: string, action: string, context?: ErrorContext): NotFoundError {
        return new NotFoundError({ message, action, context })
    }

    /**
     * Cria um erro de conflito
     */
    static conflict(message: string, action: string, context?: ErrorContext): ConflictError {
        return new ConflictError({ message, action, context })
    }

    /**
     * Cria um erro de serviço externo
     */
    static externalService(
        message: string,
        action: string,
        context?: ErrorContext,
    ): ExternalServiceError {
        return new ExternalServiceError({ message, action, context })
    }
}

/**
 * Utilitário para verificar se um erro é do tipo BaseError
 */
export function isBaseError(error: any): error is BaseError {
    return error instanceof BaseError
}

/**
 * Utilitário para extrair informações de erro de forma segura
 */
export function extractErrorInfo(error: any): {
    message: string
    type?: ErrorType
    code?: ErrorCode
    action?: string
    context?: ErrorContext
    metadata?: ErrorMetadata
    timestamp?: string
} {
    if (isBaseError(error)) {
        return {
            message: error.message,
            type: error.type,
            code: error.code,
            action: error.action,
            context: error.context,
            metadata: error.metadata,
            timestamp: error.timestamp,
        }
    }

    return {
        message: error?.message || "Unknown error occurred",
        timestamp: new Date().toISOString(),
    }
}
