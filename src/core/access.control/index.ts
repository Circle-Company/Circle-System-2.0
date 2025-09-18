import { ActionPermission, Level } from "./types"
import { ErrorCode, NotFoundError } from "@/errors"

import UserStatusModel from "../../infra/models/user/user.status.model"
import { actionsPermissions } from "./actions.permissions"

export class AccessControl {
    private actionsPermissions: ActionPermission[] = actionsPermissions

    private async getUserAccessLevel(userId: string): Promise<Level> {
        const userStatus = await UserStatusModel.findByPk(userId)

        if (!userStatus || !userStatus.access_level) {
            throw new NotFoundError({
                message: "User not found",
                code: ErrorCode.USER_NOT_FOUND,
                action: "Verify if the user ID is correct and user exists",
                context: {
                    userId,
                    additionalData: {
                        searchedUserId: userId,
                    },
                },
            })
        }
        return userStatus.access_level
        // Pesquisa no banco de dados as permissoes do usuário e retorna o role
    }

    public async authorize({
        userId,
        action,
    }: {
        userId: string
        action: string
    }): Promise<boolean> {
        const userRole = await this.getUserAccessLevel(userId)
        const actionPermission = this.actionsPermissions.find(
            (actionPermission) =>
                actionPermission.action === action &&
                actionPermission.accessLevels.includes(userRole),
        )
        return actionPermission !== undefined
    }
}
