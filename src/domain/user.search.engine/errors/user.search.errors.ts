/**
 * User Search Engine Errors
 *
 * Erros específicos do domínio de busca de usuários
 */

export enum UserSearchErrorCode {
    // Erros de validação
    INVALID_SEARCH_TERM = "INVALID_SEARCH_TERM",
    SEARCH_TERM_TOO_SHORT = "SEARCH_TERM_TOO_SHORT",
    SEARCH_TERM_TOO_LONG = "SEARCH_TERM_TOO_LONG",
    SEARCH_TERM_SUSPICIOUS = "SEARCH_TERM_SUSPICIOUS",
    INVALID_SEARCH_TYPE = "INVALID_SEARCH_TYPE",
    INVALID_PAGINATION = "INVALID_PAGINATION",
    INVALID_SORTING = "INVALID_SORTING",
    INVALID_FILTERS = "INVALID_FILTERS",

    // Erros de autorização
    PERMISSION_DENIED = "PERMISSION_DENIED",
    USER_NOT_AUTHORIZED = "USER_NOT_AUTHORIZED",
    ADMIN_ACCESS_REQUIRED = "ADMIN_ACCESS_REQUIRED",

    // Erros de rate limiting
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

    // Erros de recursos
    USER_NOT_FOUND = "USER_NOT_FOUND",
    SEARCH_RESULTS_EMPTY = "SEARCH_RESULTS_EMPTY",
    CACHE_UNAVAILABLE = "CACHE_UNAVAILABLE",
    DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE",

    // Erros de performance
    SEARCH_TIMEOUT = "SEARCH_TIMEOUT",
    QUERY_TOO_COMPLEX = "QUERY_TOO_COMPLEX",
    RESOURCE_EXHAUSTED = "RESOURCE_EXHAUSTED",

    // Erros de configuração
    INVALID_CONFIG = "INVALID_CONFIG",
    FEATURE_DISABLED = "FEATURE_DISABLED",
    ALGORITHM_NOT_FOUND = "ALGORITHM_NOT_FOUND",

    // Erros internos
    INTERNAL_ERROR = "INTERNAL_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export class UserSearchError extends Error {
    public readonly code: UserSearchErrorCode
    public readonly details?: Record<string, any>
    public readonly timestamp: Date
    public readonly queryId?: string

    constructor(
        code: UserSearchErrorCode,
        message: string,
        details?: Record<string, any>,
        queryId?: string,
    ) {
        super(message)
        this.name = "UserSearchError"
        this.code = code
        this.details = details
        this.timestamp = new Date()
        this.queryId = queryId

        // Mantém o stack trace correto
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UserSearchError)
        }
    }

    public toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
            queryId: this.queryId,
            stack: this.stack,
        }
    }
}

// Erros específicos de validação
export class InvalidSearchTermError extends UserSearchError {
    constructor(term: string, reason: string, queryId?: string) {
        super(
            UserSearchErrorCode.INVALID_SEARCH_TERM,
            `Search term inválido: ${reason}`,
            { term, reason },
            queryId,
        )
    }
}

export class SearchTermTooShortError extends UserSearchError {
    constructor(term: string, minLength: number, queryId?: string) {
        super(
            UserSearchErrorCode.SEARCH_TERM_TOO_SHORT,
            `Search term muito curto. Mínimo: ${minLength} caracteres`,
            { term, minLength, actualLength: term.length },
            queryId,
        )
    }
}

export class SearchTermTooLongError extends UserSearchError {
    constructor(term: string, maxLength: number, queryId?: string) {
        super(
            UserSearchErrorCode.SEARCH_TERM_TOO_LONG,
            `Search term muito longo. Máximo: ${maxLength} caracteres`,
            { term, maxLength, actualLength: term.length },
            queryId,
        )
    }
}

export class SuspiciousSearchTermError extends UserSearchError {
    constructor(term: string, suspiciousPatterns: string[], queryId?: string) {
        super(
            UserSearchErrorCode.SEARCH_TERM_SUSPICIOUS,
            `Search term contém padrões suspeitos`,
            { term, suspiciousPatterns },
            queryId,
        )
    }
}

// Erros de autorização
export class PermissionDeniedError extends UserSearchError {
    constructor(action: string, userId?: string, queryId?: string) {
        super(
            UserSearchErrorCode.PERMISSION_DENIED,
            `Permissão negada para ação: ${action}`,
            { action, userId },
            queryId,
        )
    }
}

export class UserNotAuthorizedError extends UserSearchError {
    constructor(userId: string, queryId?: string) {
        super(
            UserSearchErrorCode.USER_NOT_AUTHORIZED,
            `Usuário não autorizado: ${userId}`,
            { userId },
            queryId,
        )
    }
}

export class AdminAccessRequiredError extends UserSearchError {
    constructor(action: string, queryId?: string) {
        super(
            UserSearchErrorCode.ADMIN_ACCESS_REQUIRED,
            `Acesso administrativo necessário para: ${action}`,
            { action },
            queryId,
        )
    }
}

// Erros de rate limiting
export class RateLimitExceededError extends UserSearchError {
    constructor(
        limitType: "user" | "ip" | "global",
        limit: number,
        window: string,
        resetAt: Date,
        queryId?: string,
    ) {
        super(
            UserSearchErrorCode.RATE_LIMIT_EXCEEDED,
            `Rate limit excedido para ${limitType}. Limite: ${limit} por ${window}`,
            { limitType, limit, window, resetAt },
            queryId,
        )
    }
}

export class TooManyRequestsError extends UserSearchError {
    constructor(retryAfter?: number, queryId?: string) {
        super(
            UserSearchErrorCode.TOO_MANY_REQUESTS,
            `Muitas requisições. Tente novamente ${
                retryAfter ? `em ${retryAfter} segundos` : "mais tarde"
            }`,
            { retryAfter },
            queryId,
        )
    }
}

export class QuotaExceededError extends UserSearchError {
    constructor(quotaType: string, limit: number, queryId?: string) {
        super(
            UserSearchErrorCode.QUOTA_EXCEEDED,
            `Quota excedida para ${quotaType}. Limite: ${limit}`,
            { quotaType, limit },
            queryId,
        )
    }
}

// Erros de recursos
export class UserNotFoundError extends UserSearchError {
    constructor(userId: string, queryId?: string) {
        super(
            UserSearchErrorCode.USER_NOT_FOUND,
            `Usuário não encontrado: ${userId}`,
            { userId },
            queryId,
        )
    }
}

export class SearchResultsEmptyError extends UserSearchError {
    constructor(searchTerm: string, searchType?: string, queryId?: string) {
        super(
            UserSearchErrorCode.SEARCH_RESULTS_EMPTY,
            `Nenhum resultado encontrado para "${searchTerm}"${
                searchType ? ` (tipo: ${searchType})` : ""
            }`,
            { searchTerm, searchType },
            queryId,
        )
    }
}

export class CacheUnavailableError extends UserSearchError {
    constructor(operation: string, queryId?: string) {
        super(
            UserSearchErrorCode.CACHE_UNAVAILABLE,
            `Cache indisponível para operação: ${operation}`,
            { operation },
            queryId,
        )
    }
}

export class DatabaseUnavailableError extends UserSearchError {
    constructor(operation: string, queryId?: string) {
        super(
            UserSearchErrorCode.DATABASE_UNAVAILABLE,
            `Banco de dados indisponível para operação: ${operation}`,
            { operation },
            queryId,
        )
    }
}

// Erros de performance
export class SearchTimeoutError extends UserSearchError {
    constructor(timeoutMs: number, queryId?: string) {
        super(
            UserSearchErrorCode.SEARCH_TIMEOUT,
            `Busca expirou após ${timeoutMs}ms`,
            { timeoutMs },
            queryId,
        )
    }
}

export class QueryTooComplexError extends UserSearchError {
    constructor(complexity: string, queryId?: string) {
        super(
            UserSearchErrorCode.QUERY_TOO_COMPLEX,
            `Query muito complexa: ${complexity}`,
            { complexity },
            queryId,
        )
    }
}

export class ResourceExhaustedError extends UserSearchError {
    constructor(resource: string, queryId?: string) {
        super(
            UserSearchErrorCode.RESOURCE_EXHAUSTED,
            `Recurso esgotado: ${resource}`,
            { resource },
            queryId,
        )
    }
}

// Erros de configuração
export class InvalidConfigError extends UserSearchError {
    constructor(configKey: string, reason: string, queryId?: string) {
        super(
            UserSearchErrorCode.INVALID_CONFIG,
            `Configuração inválida para ${configKey}: ${reason}`,
            { configKey, reason },
            queryId,
        )
    }
}

export class FeatureDisabledError extends UserSearchError {
    constructor(feature: string, queryId?: string) {
        super(
            UserSearchErrorCode.FEATURE_DISABLED,
            `Funcionalidade desabilitada: ${feature}`,
            { feature },
            queryId,
        )
    }
}

export class AlgorithmNotFoundError extends UserSearchError {
    constructor(algorithm: string, queryId?: string) {
        super(
            UserSearchErrorCode.ALGORITHM_NOT_FOUND,
            `Algoritmo não encontrado: ${algorithm}`,
            { algorithm },
            queryId,
        )
    }
}

// Erros internos
export class InternalSearchError extends UserSearchError {
    constructor(operation: string, originalError?: Error, queryId?: string) {
        super(
            UserSearchErrorCode.INTERNAL_ERROR,
            `Erro interno na operação: ${operation}`,
            {
                operation,
                originalError: originalError?.message,
                originalStack: originalError?.stack,
            },
            queryId,
        )
    }
}

export class UnknownSearchError extends UserSearchError {
    constructor(operation: string, queryId?: string) {
        super(
            UserSearchErrorCode.UNKNOWN_ERROR,
            `Erro desconhecido na operação: ${operation}`,
            { operation },
            queryId,
        )
    }
}

export class ServiceUnavailableError extends UserSearchError {
    constructor(service: string, queryId?: string) {
        super(
            UserSearchErrorCode.SERVICE_UNAVAILABLE,
            `Serviço indisponível: ${service}`,
            { service },
            queryId,
        )
    }
}

// Factory para criar erros baseado em códigos
export class UserSearchErrorFactory {
    public static create(
        code: UserSearchErrorCode,
        message: string,
        details?: Record<string, any>,
        queryId?: string,
    ): UserSearchError {
        switch (code) {
            case UserSearchErrorCode.INVALID_SEARCH_TERM:
                return new InvalidSearchTermError(
                    details?.term || "",
                    details?.reason || "invalid",
                    queryId,
                )

            case UserSearchErrorCode.SEARCH_TERM_TOO_SHORT:
                return new SearchTermTooShortError(
                    details?.term || "",
                    details?.minLength || 1,
                    queryId,
                )

            case UserSearchErrorCode.SEARCH_TERM_TOO_LONG:
                return new SearchTermTooLongError(
                    details?.term || "",
                    details?.maxLength || 100,
                    queryId,
                )

            case UserSearchErrorCode.SEARCH_TERM_SUSPICIOUS:
                return new SuspiciousSearchTermError(
                    details?.term || "",
                    details?.suspiciousPatterns || [],
                    queryId,
                )

            case UserSearchErrorCode.PERMISSION_DENIED:
                return new PermissionDeniedError(
                    details?.action || "unknown",
                    details?.userId,
                    queryId,
                )

            case UserSearchErrorCode.USER_NOT_AUTHORIZED:
                return new UserNotAuthorizedError(details?.userId || "", queryId)

            case UserSearchErrorCode.ADMIN_ACCESS_REQUIRED:
                return new AdminAccessRequiredError(details?.action || "unknown", queryId)

            case UserSearchErrorCode.RATE_LIMIT_EXCEEDED:
                return new RateLimitExceededError(
                    details?.limitType || "user",
                    details?.limit || 0,
                    details?.window || "minute",
                    details?.resetAt || new Date(),
                    queryId,
                )

            case UserSearchErrorCode.TOO_MANY_REQUESTS:
                return new TooManyRequestsError(details?.retryAfter, queryId)

            case UserSearchErrorCode.QUOTA_EXCEEDED:
                return new QuotaExceededError(
                    details?.quotaType || "unknown",
                    details?.limit || 0,
                    queryId,
                )

            case UserSearchErrorCode.USER_NOT_FOUND:
                return new UserNotFoundError(details?.userId || "", queryId)

            case UserSearchErrorCode.SEARCH_RESULTS_EMPTY:
                return new SearchResultsEmptyError(
                    details?.searchTerm || "",
                    details?.searchType,
                    queryId,
                )

            case UserSearchErrorCode.CACHE_UNAVAILABLE:
                return new CacheUnavailableError(details?.operation || "unknown", queryId)

            case UserSearchErrorCode.DATABASE_UNAVAILABLE:
                return new DatabaseUnavailableError(details?.operation || "unknown", queryId)

            case UserSearchErrorCode.SEARCH_TIMEOUT:
                return new SearchTimeoutError(details?.timeoutMs || 0, queryId)

            case UserSearchErrorCode.QUERY_TOO_COMPLEX:
                return new QueryTooComplexError(details?.complexity || "unknown", queryId)

            case UserSearchErrorCode.RESOURCE_EXHAUSTED:
                return new ResourceExhaustedError(details?.resource || "unknown", queryId)

            case UserSearchErrorCode.INVALID_CONFIG:
                return new InvalidConfigError(
                    details?.configKey || "unknown",
                    details?.reason || "invalid",
                    queryId,
                )

            case UserSearchErrorCode.FEATURE_DISABLED:
                return new FeatureDisabledError(details?.feature || "unknown", queryId)

            case UserSearchErrorCode.ALGORITHM_NOT_FOUND:
                return new AlgorithmNotFoundError(details?.algorithm || "unknown", queryId)

            case UserSearchErrorCode.INTERNAL_ERROR:
                return new InternalSearchError(
                    details?.operation || "unknown",
                    details?.originalError,
                    queryId,
                )

            case UserSearchErrorCode.UNKNOWN_ERROR:
                return new UnknownSearchError(details?.operation || "unknown", queryId)

            case UserSearchErrorCode.SERVICE_UNAVAILABLE:
                return new ServiceUnavailableError(details?.service || "unknown", queryId)

            default:
                return new UserSearchError(code, message, details, queryId)
        }
    }
}
