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

export class MomentInteractionBlockedError extends SystemError {
    constructor(momentId: string, userId: string, reason: string) {
        super({
            message: `User ${userId} cannot interact with moment ${momentId}: ${reason}`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "User interaction is blocked due to user status or relationship restrictions",
            context: {
                additionalData: {
                    momentId,
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

export class MomentOwnerInactiveError extends SystemError {
    constructor(momentId: string, ownerId: string) {
        super({
            message: `Owner ${ownerId} of moment ${momentId} is inactive (blocked/deleted)`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "Cannot interact with moments from inactive users",
            context: {
                additionalData: {
                    momentId,
                    ownerId,
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

export class MomentUserBlockedError extends SystemError {
    constructor(momentId: string, userId: string, ownerId: string) {
        super({
            message: `User ${userId} is blocked by moment owner ${ownerId} (moment ${momentId})`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "User cannot interact with moments from users who have blocked them",
            context: {
                additionalData: {
                    momentId,
                    userId,
                    ownerId,
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

export class MomentVisibilityRestrictedError extends SystemError {
    constructor(momentId: string, userId: string, visibilityLevel: string) {
        super({
            message: `User ${userId} cannot access moment ${momentId} due to visibility restriction (${visibilityLevel})`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "User does not have permission to view this moment due to its visibility settings",
            context: {
                additionalData: {
                    momentId,
                    userId,
                    visibilityLevel,
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

export class MomentUserNotFollowingError extends SystemError {
    constructor(momentId: string, userId: string, ownerId: string) {
        super({
            message: `User ${userId} is not following moment owner ${ownerId} (moment ${momentId})`,
            code: ErrorCode.INSUFFICIENT_PERMISSIONS,
            action: "User must follow the moment owner to interact with followers-only moments",
            context: {
                additionalData: {
                    momentId,
                    userId,
                    ownerId,
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
