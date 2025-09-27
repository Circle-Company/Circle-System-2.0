import { AuthorizationRule, Device, Level, Permission } from "./authorization.type"

/**
 * Regras de autorização centralizadas
 * Seguindo Clean Architecture - regras de negócio desacopladas
 */
export const AUTHORIZATION_RULES: AuthorizationRule[] = [
    // Gerenciamento de usuários - apenas admin e manager
    {
        permission: Permission.READ_USERS,
        allowedLevels: [Level.SUDO, Level.ADMIN],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Visualizar lista de usuários",
    },
    {
        permission: Permission.CREATE_USERS,
        allowedLevels: [Level.SUDO, Level.ADMIN],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Criar novos usuários",
    },
    {
        permission: Permission.UPDATE_USERS,
        allowedLevels: [Level.SUDO, Level.ADMIN],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Atualizar dados de usuários",
    },
    {
        permission: Permission.DELETE_USERS,
        allowedLevels: [Level.SUDO, Level.ADMIN],
        allowedDevices: [Device.WEB, Device.MOBILE], // Apenas mobile para segurança
        description: "Deletar usuários",
    },

    // Perfil próprio - todos os usuários autenticados
    {
        permission: Permission.READ_OWN_PROFILE,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Visualizar próprio perfil",
    },
    {
        permission: Permission.UPDATE_OWN_PROFILE,
        allowedLevels: [Level.SUDO, Level.ADMIN, Level.USER],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Atualizar próprio perfil",
    },

    // Sistema - apenas admin
    {
        permission: Permission.MANAGE_SYSTEM,
        allowedLevels: [Level.SUDO, Level.ADMIN],
        allowedDevices: [Device.WEB, Device.MOBILE], // Apenas desktop para segurança máxima
        description: "Gerenciar configurações do sistema",
    },

    // Analytics - admin e manager
    {
        permission: Permission.VIEW_ANALYTICS,
        allowedLevels: [Level.SUDO, Level.ADMIN],
        allowedDevices: [Device.WEB, Device.MOBILE],
        description: "Visualizar relatórios e analytics",
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
