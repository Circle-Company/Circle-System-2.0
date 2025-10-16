// ===== REGRAS DE VISUALIZAÇÃO DE MOMENT =====
export interface MomentViewabilityRules {
    // Regras de status
    status: {
        allowUnderReview: boolean // Se permite visualizar momentos em revisão (apenas para o autor)
        allowBlocked: boolean // Se permite visualizar momentos bloqueados
        allowDeleted: boolean // Se permite visualizar momentos deletados
        allowArchived: boolean // Se permite visualizar momentos arquivados
    }

    // Regras de visibilidade
    visibility: {
        allowPublic: boolean // Permite visualizar momentos públicos
        allowUnlisted: boolean // Permite visualizar momentos unlisted
        allowFollowersOnly: boolean // Permite visualizar momentos apenas para seguidores
        allowPrivate: boolean // Permite visualizar momentos privados
        requireFollowingForFollowersOnly: boolean // Se requer seguir para ver FOLLOWERS_ONLY
        allowAllowedUsersForPrivate: boolean // Se permite usuários específicos para PRIVATE
    }

    // Regras de conteúdo
    content: {
        allowAgeRestricted: boolean // Se permite conteúdo com restrição de idade
        allowContentWarning: boolean // Se permite conteúdo com aviso
        requireAgeVerification: boolean // Se requer verificação de idade
        allowSensitiveContent: boolean // Se permite conteúdo sensível
    }

    // Regras de usuário
    user: {
        requireActiveUser: boolean // Se requer usuário ativo para visualizar
        requireVerifiedUser: boolean // Se requer usuário verificado
        allowBlockedUsers: boolean // Se permite usuários bloqueados visualizarem
        requireFollowingPermission: boolean // Se requer permissão de seguir
    }

    // Regras de autor
    author: {
        requireActiveAuthor: boolean // Se requer autor ativo
        requireVerifiedAuthor: boolean // Se requer autor verificado
        allowBlockedAuthors: boolean // Se permite autores bloqueados
        allowSuspendedAuthors: boolean // Se permite autores suspensos
    }

    // Regras de qualidade
    quality: {
        minimumQualityScore: number // Score mínimo de qualidade para visualização
        allowLowQuality: boolean // Se permite conteúdo de baixa qualidade
        requireModerationApproval: boolean // Se requer aprovação de moderação
    }

    // Regras de timing
    timing: {
        allowFutureMoments: boolean // Se permite momentos com data futura
        allowOldMoments: boolean // Se permite momentos muito antigos
        maximumAgeInDays: number // Idade máxima em dias para visualização
        allowScheduledMoments: boolean // Se permite momentos agendados
    }
}

// ===== REGRAS PADRÃO DE VISUALIZAÇÃO =====
export const DEFAULT_VIEWABILITY_RULES: MomentViewabilityRules = {
    status: {
        allowUnderReview: true, // Apenas para o autor
        allowBlocked: false,
        allowDeleted: false,
        allowArchived: true,
    },
    visibility: {
        allowPublic: true,
        allowUnlisted: true,
        allowFollowersOnly: true,
        allowPrivate: true,
        requireFollowingForFollowersOnly: true,
        allowAllowedUsersForPrivate: true,
    },
    content: {
        allowAgeRestricted: true,
        allowContentWarning: true,
        requireAgeVerification: false, // Implementar verificação de idade
        allowSensitiveContent: true,
    },
    user: {
        requireActiveUser: true,
        requireVerifiedUser: false,
        allowBlockedUsers: false,
        requireFollowingPermission: false,
    },
    author: {
        requireActiveAuthor: true,
        requireVerifiedAuthor: false,
        allowBlockedAuthors: false,
        allowSuspendedAuthors: false,
    },
    quality: {
        minimumQualityScore: 30,
        allowLowQuality: true,
        requireModerationApproval: false,
    },
    timing: {
        allowFutureMoments: false,
        allowOldMoments: true,
        maximumAgeInDays: 365, // 1 ano
        allowScheduledMoments: true,
    },
}

// ===== REGRAS RESTRITIVAS (PARA CONTEÚDO SENSÍVEL) =====
export const RESTRICTIVE_VIEWABILITY_RULES: MomentViewabilityRules = {
    status: {
        allowUnderReview: false,
        allowBlocked: false,
        allowDeleted: false,
        allowArchived: false,
    },
    visibility: {
        allowPublic: true,
        allowUnlisted: false,
        allowFollowersOnly: false,
        allowPrivate: false,
        requireFollowingForFollowersOnly: true,
        allowAllowedUsersForPrivate: false,
    },
    content: {
        allowAgeRestricted: false,
        allowContentWarning: false,
        requireAgeVerification: true,
        allowSensitiveContent: false,
    },
    user: {
        requireActiveUser: true,
        requireVerifiedUser: true,
        allowBlockedUsers: false,
        requireFollowingPermission: true,
    },
    author: {
        requireActiveAuthor: true,
        requireVerifiedAuthor: true,
        allowBlockedAuthors: false,
        allowSuspendedAuthors: false,
    },
    quality: {
        minimumQualityScore: 70,
        allowLowQuality: false,
        requireModerationApproval: true,
    },
    timing: {
        allowFutureMoments: false,
        allowOldMoments: false,
        maximumAgeInDays: 30, // Apenas 30 dias
        allowScheduledMoments: false,
    },
}

// ===== REGRAS PERMISSIVAS (PARA DESENVOLVIMENTO/TESTE) =====
export const PERMISSIVE_VIEWABILITY_RULES: MomentViewabilityRules = {
    status: {
        allowUnderReview: true,
        allowBlocked: true,
        allowDeleted: true,
        allowArchived: true,
    },
    visibility: {
        allowPublic: true,
        allowUnlisted: true,
        allowFollowersOnly: true,
        allowPrivate: true,
        requireFollowingForFollowersOnly: false,
        allowAllowedUsersForPrivate: true,
    },
    content: {
        allowAgeRestricted: true,
        allowContentWarning: true,
        requireAgeVerification: false,
        allowSensitiveContent: true,
    },
    user: {
        requireActiveUser: false,
        requireVerifiedUser: false,
        allowBlockedUsers: true,
        requireFollowingPermission: false,
    },
    author: {
        requireActiveAuthor: false,
        requireVerifiedAuthor: false,
        allowBlockedAuthors: true,
        allowSuspendedAuthors: true,
    },
    quality: {
        minimumQualityScore: 0,
        allowLowQuality: true,
        requireModerationApproval: false,
    },
    timing: {
        allowFutureMoments: true,
        allowOldMoments: true,
        maximumAgeInDays: 9999, // Quase ilimitado
        allowScheduledMoments: true,
    },
}

// ===== ENUM PARA MOTIVOS DE VISUALIZAÇÃO =====
export enum ViewabilityReasonEnum {
    // Sucesso
    VIEWABLE = "VIEWABLE",
    PUBLIC_VISIBLE = "PUBLIC_VISIBLE",
    UNLISTED_VISIBLE = "UNLISTED_VISIBLE",
    OWNER_VISIBLE = "OWNER_VISIBLE",
    FOLLOWER_VISIBLE = "FOLLOWER_VISIBLE",
    ALLOWED_USER_VISIBLE = "ALLOWED_USER_VISIBLE",
    CONTENT_WARNING = "CONTENT_WARNING",
    NO_RESTRICTIONS = "NO_RESTRICTIONS",
    PERMISSIONS_OK = "PERMISSIONS_OK",

    // Erros de parâmetros
    INVALID_PARAMETERS = "INVALID_PARAMETERS",
    SYSTEM_ERROR = "SYSTEM_ERROR",

    // Erros de status
    MOMENT_NOT_ACTIVE = "MOMENT_NOT_ACTIVE",
    MOMENT_BLOCKED = "MOMENT_BLOCKED",
    MOMENT_UNDER_REVIEW = "MOMENT_UNDER_REVIEW",
    MOMENT_DELETED = "MOMENT_DELETED",
    MOMENT_ARCHIVED = "MOMENT_ARCHIVED",

    // Erros de visibilidade
    FOLLOWERS_ONLY_RESTRICTED = "FOLLOWERS_ONLY_RESTRICTED",
    PRIVATE_RESTRICTED = "PRIVATE_RESTRICTED",
    UNKNOWN_VISIBILITY = "UNKNOWN_VISIBILITY",

    // Erros de conteúdo
    AGE_RESTRICTED = "AGE_RESTRICTED",
    CONTENT_TOO_SENSITIVE = "CONTENT_TOO_SENSITIVE",
    QUALITY_TOO_LOW = "QUALITY_TOO_LOW",

    // Erros de usuário
    USER_INACTIVE = "USER_INACTIVE",
    USER_NOT_VERIFIED = "USER_NOT_VERIFIED",
    USER_BLOCKED = "USER_BLOCKED",
    USER_BLOCKED_FROM_MOMENT = "USER_BLOCKED_FROM_MOMENT",
    USER_CANNOT_VIEW_MOMENTS = "USER_CANNOT_VIEW_MOMENTS",

    // Erros de autor
    OWNER_INACTIVE = "OWNER_INACTIVE",
    OWNER_NOT_VERIFIED = "OWNER_NOT_VERIFIED",
    OWNER_BLOCKED = "OWNER_BLOCKED",
    OWNER_SUSPENDED = "OWNER_SUSPENDED",

    // Erros de timing
    MOMENT_TOO_OLD = "MOMENT_TOO_OLD",
    MOMENT_IN_FUTURE = "MOMENT_IN_FUTURE",
    MOMENT_NOT_SCHEDULED = "MOMENT_NOT_SCHEDULED",
}
