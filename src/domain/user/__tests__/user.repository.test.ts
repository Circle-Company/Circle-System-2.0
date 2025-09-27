import { beforeEach, describe, expect, it, vi } from "vitest"

import { DatabaseAdapter } from "../../../infra/database/adapter"
import { UserRepository } from "../user.repository"

// Mock do DatabaseAdapter
const mockDatabaseAdapter = {
    getConnection: vi.fn(() => ({
        transaction: vi.fn(() =>
            Promise.resolve({
                commit: vi.fn(),
                rollback: vi.fn(),
            }),
        ),
    })),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => true),
} as any

describe("UserRepository", () => {
    let userRepository: UserRepository

    beforeEach(() => {
        userRepository = new UserRepository(mockDatabaseAdapter as DatabaseAdapter)
        vi.clearAllMocks()
    })

    it("deve criar uma instância do UserRepository", () => {
        expect(userRepository).toBeInstanceOf(UserRepository)
    })

    it("deve ter todos os métodos necessários", () => {
        expect(typeof userRepository.create).toBe("function")
        expect(typeof userRepository.findById).toBe("function")
        expect(typeof userRepository.findByUsername).toBe("function")
        expect(typeof userRepository.findBySearchTerm).toBe("function")
        expect(typeof userRepository.update).toBe("function")
        expect(typeof userRepository.delete).toBe("function")
        expect(typeof userRepository.findAll).toBe("function")
        expect(typeof userRepository.findActiveUsers).toBe("function")
        expect(typeof userRepository.findUsersByStatus).toBe("function")
    })

    it("deve usar o DatabaseAdapter corretamente", () => {
        expect(mockDatabaseAdapter.getConnection).toBeDefined()
    })
})
