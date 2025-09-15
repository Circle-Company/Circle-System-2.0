import { Action, ActionPermission, Level } from "./types"

export const actionsPermissions = [
    {
        id: 1,
        action: Action.CREATE_IP_ADDRESS,
        description: "Create IP Address for a client",
        accessLevels: [Level.ADMIN],
    },
    {
        id: 2,
        action: Action.READ_IP_ADDRESS,
        accessLevels: [Level.ADMIN, Level.MODERATOR, Level.USER],
    },
    {
        id: 3,
        action: Action.UPDATE_IP_ADDRESS,
        accessLevels: [Level.ADMIN],
    },
] as ActionPermission[]
