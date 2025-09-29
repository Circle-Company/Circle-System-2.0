/**
 * User Domain Errors
 *
 * Custom error classes for user domain operations
 */

import { ErrorCode, SystemError } from "../../../shared/errors"

export class UserNotFoundError extends SystemError {
    constructor(userId: string) {
        super({
            message: `Usuário com ID '${userId}' não foi encontrado no sistema`,
            code: ErrorCode.USER_NOT_FOUND,
            action: "Verifique o ID do usuário e tente novamente",
            context: {
                additionalData: {
                    userId,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserUsernameAlreadyExistsError extends SystemError {
    constructor(username: string) {
        super({
            message: `O nome de usuário '${username}' já está sendo usado por outro usuário`,
            code: ErrorCode.RESOURCE_EXISTS,
            action: "Escolha um nome de usuário diferente",
            context: {
                additionalData: {
                    username,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserInvalidCredentialsError extends SystemError {
    constructor(username: string) {
        super({
            message: `As credenciais fornecidas para o usuário '${username}' são inválidas`,
            code: ErrorCode.INVALID_CREDENTIALS,
            action: "Verifique suas credenciais e tente novamente",
            context: {
                additionalData: {
                    username,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserBlockedError extends SystemError {
    constructor(userId: string) {
        super({
            message: `O usuário com ID '${userId}' está bloqueado`,
            code: ErrorCode.OPERATION_NOT_ALLOWED,
            action: "Entre em contato com o suporte para mais informações",
            context: {
                additionalData: {
                    userId,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserDeletedError extends SystemError {
    constructor(userId: string) {
        super({
            message: `O usuário com ID '${userId}' foi deletado`,
            code: ErrorCode.USER_NOT_FOUND,
            action: "Este usuário não pode mais ser acessado",
            context: {
                additionalData: {
                    userId,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserInactiveError extends SystemError {
    constructor(userId: string) {
        super({
            message: `O usuário com ID '${userId}' está inativo`,
            code: ErrorCode.OPERATION_NOT_ALLOWED,
            action: "Ative sua conta para continuar",
            context: {
                additionalData: {
                    userId,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserUnverifiedError extends SystemError {
    constructor(userId: string) {
        super({
            message: `O usuário com ID '${userId}' não foi verificado`,
            code: ErrorCode.OPERATION_NOT_ALLOWED,
            action: "Verifique sua conta para continuar",
            context: {
                additionalData: {
                    userId,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserInsufficientPermissionsError extends SystemError {
    constructor(userId: string, requiredLevel: string) {
        super({
            message: `O usuário com ID '${userId}' não possui o nível de acesso necessário (${requiredLevel})`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "Entre em contato com um administrador",
            context: {
                additionalData: {
                    userId,
                    requiredLevel,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserPasswordTooWeakError extends SystemError {
    constructor(reason: string) {
        super({
            message: `A senha fornecida não atende aos critérios de segurança: ${reason}`,
            code: ErrorCode.INVALID_INPUT,
            action: "Escolha uma senha mais forte",
            context: {
                additionalData: {
                    reason,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserPasswordExpiredError extends SystemError {
    constructor(userId: string) {
        super({
            message: `A senha do usuário com ID '${userId}' expirou e precisa ser alterada`,
            code: ErrorCode.TOKEN_EXPIRED,
            action: "Altere sua senha para continuar",
            context: {
                additionalData: {
                    userId,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserPasswordSameAsOldError extends SystemError {
    constructor(userId: string) {
        super({
            message: `A nova senha do usuário com ID '${userId}' deve ser diferente da senha atual`,
            code: ErrorCode.INVALID_INPUT,
            action: "Escolha uma senha diferente da atual",
            context: {
                additionalData: {
                    userId,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserMetricsNotFoundError extends SystemError {
    constructor(userId: string) {
        super({
            message: `Nenhuma métrica encontrada para o usuário com ID '${userId}'`,
            code: ErrorCode.USER_NOT_FOUND,
            action: "Verifique se o usuário possui métricas registradas",
            context: {
                additionalData: {
                    userId,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserMetricsUpdateError extends SystemError {
    constructor(userId: string, reason: string) {
        super({
            message: `Falha ao atualizar as métricas do usuário com ID '${userId}': ${reason}`,
            code: ErrorCode.DATABASE_ERROR,
            action: "Tente novamente ou entre em contato com o suporte",
            context: {
                additionalData: {
                    userId,
                    reason,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserSessionExpiredError extends SystemError {
    constructor(userId: string) {
        super({
            message: `A sessão do usuário com ID '${userId}' expirou. Faça login novamente`,
            code: ErrorCode.TOKEN_EXPIRED,
            action: "Faça login novamente para continuar",
            context: {
                additionalData: {
                    userId,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}

export class UserMaxSessionsExceededError extends SystemError {
    constructor(userId: string, maxSessions: number) {
        super({
            message: `O usuário com ID '${userId}' excedeu o limite máximo de sessões simultâneas (${maxSessions})`,
            code: ErrorCode.OPERATION_NOT_ALLOWED,
            action: "Encerre outras sessões antes de fazer login",
            context: {
                additionalData: {
                    userId,
                    maxSessions,
                },
            },
            metadata: {
                severity: "medium",
                retryable: false,
                logLevel: "warn",
                notifyAdmin: false,
            },
        })
    }
}
