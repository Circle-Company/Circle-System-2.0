// ===== MOMENT ERRORS =====

import { ErrorCode, SystemError } from "@/shared/errors"

export class MomentNotFoundError extends SystemError {
    constructor(momentId: string) {
        super({
            message: `Moment with ID ${momentId} not found`,
            code: ErrorCode.USER_NOT_FOUND,
            action: "Verify the moment ID and try again",
            context: {
                additionalData: {
                    momentId,
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

export class MomentAlreadyLikedError extends SystemError {
    constructor(momentId: string, userId: string) {
        super({
            message: `User ${userId} has already liked moment ${momentId}`,
            code: ErrorCode.RESOURCE_EXISTS,
            action: "User cannot like the same moment twice",
            context: {
                additionalData: {
                    momentId,
                    userId,
                },
            },
            metadata: {
                severity: "low",
                retryable: false,
                logLevel: "info",
                notifyAdmin: false,
            },
        })
    }
}

export class MomentNotLikedError extends SystemError {
    constructor(momentId: string, userId: string) {
        super({
            message: `User ${userId} has not liked moment ${momentId}`,
            code: ErrorCode.RESOURCE_EXISTS,
            action: "User cannot unlike a moment they haven't liked",
            context: {
                additionalData: {
                    momentId,
                    userId,
                },
            },
            metadata: {
                severity: "low",
                retryable: false,
                logLevel: "info",
                notifyAdmin: false,
            },
        })
    }
}

export class MomentAlreadyReportedError extends SystemError {
    constructor(momentId: string, userId: string) {
        super({
            message: `User ${userId} has already reported moment ${momentId}`,
            code: ErrorCode.RESOURCE_EXISTS,
            action: "User cannot report the same moment twice",
            context: {
                additionalData: {
                    momentId,
                    userId,
                },
            },
            metadata: {
                severity: "low",
                retryable: false,
                logLevel: "info",
                notifyAdmin: false,
            },
        })
    }
}

export class MomentNotPublishedError extends SystemError {
    constructor(momentId: string) {
        super({
            message: `Moment ${momentId} is not published`,
            code: ErrorCode.RESOURCE_EXISTS,
            action: "Only published moments can be interacted with",
            context: {
                additionalData: {
                    momentId,
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

export class MomentBlockedError extends SystemError {
    constructor(momentId: string) {
        super({
            message: `Moment ${momentId} is blocked`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "Blocked moments cannot be accessed",
            context: {
                additionalData: {
                    momentId,
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

export class MomentDeletedError extends SystemError {
    constructor(momentId: string) {
        super({
            message: `Moment ${momentId} is deleted`,
            code: ErrorCode.USER_NOT_FOUND,
            action: "Deleted moments cannot be accessed",
            context: {
                additionalData: {
                    momentId,
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

export class MomentNotOwnedError extends SystemError {
    constructor(momentId: string, userId: string) {
        super({
            message: `User ${userId} does not own moment ${momentId}`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "Only the moment owner can perform this action",
            context: {
                additionalData: {
                    momentId,
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

export class CommentNotFoundError extends SystemError {
    constructor(commentId: string) {
        super({
            message: `Comment with ID ${commentId} not found`,
            code: ErrorCode.USER_NOT_FOUND,
            action: "Verify the comment ID and try again",
            context: {
                additionalData: {
                    commentId,
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

export class CommentNotOwnedError extends SystemError {
    constructor(commentId: string, userId: string) {
        super({
            message: `User ${userId} does not own comment ${commentId}`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "Only the comment owner can perform this action",
            context: {
                additionalData: {
                    commentId,
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
