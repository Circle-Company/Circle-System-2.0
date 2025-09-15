// Uma permissão pura, sem acoplamento
export interface Permission {
    id: number
    action: Action
    description?: string
}

// Interface para permissões de ação
export interface ActionPermission {
    id: number
    action: Action
    description?: string
    accessLevels: Level[]
}

// Regras de associação
export interface PermissionRule {
    accessLevel: Level[]
    permissions: Action[]
}

export enum Action {
    CREATE_IP_ADDRESS = "CREATE_IP_ADDRESS",
    READ_IP_ADDRESS = "READ_IP_ADDRESS",
    UPDATE_IP_ADDRESS = "UPDATE_IP_ADDRESS",
}

export enum Level {
    SUDO = "SUDO",
    ADMIN = "ADMIN",
    MODERATOR = "MODERATOR",
    USER = "USER",
}
