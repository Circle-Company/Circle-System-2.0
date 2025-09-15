/**

import { beforeEach, describe, expect, it, vi } from "vitest"
import { AccessControl } from ".."
import { Action, Device, Role } from "../types"

describe("Sistema de Controle de Acesso", () => {
    let accessControl: AccessControl
    let mockGetUserRole: any

    beforeEach(() => {
        accessControl = new AccessControl()

        // Mock da função privada getUserRole
        mockGetUserRole = vi.fn()
        vi.spyOn(accessControl as any, "getUserRole").mockImplementation(mockGetUserRole)
    })

    it("deve autorizar usuário ADMIN para CREATE_IP_ADDRESS e negar MANAGER", () => {
        // Arrange
        const testUser = {
            id: 1828385454,
            devices: [Device.DESKTOP],
        }

        // Mock: ADMIN tem permissão para CREATE_IP_ADDRESS
        mockGetUserRole.mockReturnValue(Role.ADMIN)

        // Act & Assert - ADMIN deve ter permissão
        const adminPermission = accessControl.authorize({
            user: testUser,
            action: Action.CREATE_IP_ADDRESS,
        })
        expect(adminPermission).toBe(true)
        expect(mockGetUserRole).toHaveBeenCalledWith(testUserId)

        // Mock: MANAGER não tem permissão para CREATE_IP_ADDRESS
        mockGetUserRole.mockReturnValue(Role.MANAGER)

        // Act & Assert - MANAGER não deve ter permissão
        const managerPermission = accessControl.authorize({
            userId: testUserId,
            action: Action.CREATE_IP_ADDRESS,
        })
        expect(managerPermission).toBe(false)

        // Verifica se a função foi chamada corretamente
        expect(mockGetUserRole).toHaveBeenCalledTimes(2)
        expect(mockGetUserRole).toHaveBeenNthCalledWith(1, testUserId)
        expect(mockGetUserRole).toHaveBeenNthCalledWith(2, testUserId)
    })
})
*/
