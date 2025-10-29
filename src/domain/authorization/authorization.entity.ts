import { AuthorizationRule, Device, Level, Permission } from "./authorization.type"

/**
 * Regras de autorização centralizadas
 * Seguindo Clean Architecture - regras de negócio desacopladas
 */
export const AUTHORIZATION_RULES: AuthorizationRule[] = [
    // Gerenciamento de usuários - apenas admin e manager

    // Momentos - usuários autenticados
    {
        permission: Permission.CREATE_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.MOBILE],
        description: "Criar momento",
    },
    {
        permission: Permission.READ_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Visualizar momento",
    },
    {
        permission: Permission.VIEW_OWN_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Visualizar próprio momento",
    },
    {
        permission: Permission.DELETE_OWN_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Deletar próprio momento",
    },
    {
        permission: Permission.LIKE_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Curtir momento",
    },
    {
        permission: Permission.COMMENT_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Comentar momento",
    },
    {
        permission: Permission.REPORT_MOMENT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Reportar momento",
    },

    // Conta própria - usuários autenticados
    {
        permission: Permission.READ_OWN_ACCOUNT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Ler própria conta",
    },
    {
        permission: Permission.UPDATE_OWN_ACCOUNT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Atualizar própria conta",
    },
    {
        permission: Permission.DELETE_OWN_ACCOUNT,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB],
        description: "Deletar própria conta",
    },
    {
        permission: Permission.READ_OWN_SETTINGS,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Ler próprias configurações",
    },
    {
        permission: Permission.UPDATE_OWN_PREFERENCES,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.MOBILE],
        description: "Atualizar próprias preferências",
    },

    // Perfil público - usuários autenticados
    {
        permission: Permission.READ_PROFILE,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Ler perfil público",
    },
    {
        permission: Permission.READ_PROFILE_MOMENTS,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Ler momentos do perfil público",
    },
]

/**
 * Função utilitária para buscar regra por permissão
 */
export function getAuthorizationRule(permission: Permission): AuthorizationRule | undefined {
    return AUTHORIZATION_RULES.find((rule) => rule.permission === permission)
}

/**
 * Função utilitária para obter permissões por role
 */
export function getPermissionsByLevel(level: Level): Permission[] {
    return AUTHORIZATION_RULES.filter((rule) => rule.allowedLevels.includes(level)).map(
        (rule) => rule.permission,
    )
}

/**
 * Função utilitária para obter dispositivos permitidos por role e permissão
 */
export function getAllowedDevices(level: Level, permission: Permission): Device[] {
    const rule = getAuthorizationRule(permission)
    if (!rule || !rule.allowedLevels.includes(level)) {
        return []
    }
    return rule.allowedDevices
}
