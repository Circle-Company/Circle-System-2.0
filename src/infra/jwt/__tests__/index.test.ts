import { Jwt, jwt } from "../index"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Level } from "../../../core/access.control/types"
import { NotFoundError } from "../../../errors"
import UserModel from "../../models/user/user.model"

// Mock do UserModel
vi.mock("@/infra/models/user/user.model", () => ({
    default: {
        findByPk: vi.fn(),
    },
}))

// Mock do access control types
vi.mock("@/core/access.control/types", () => ({
    Level: {
        SUDO: "SUDO",
        ADMIN: "ADMIN",
        MODERATOR: "MODERATOR",
        USER: "USER",
    },
}))

// Mock das variáveis de ambiente
const mockEnv = {
    JWT_SECRET: "test-secret-key-12345678901234567890123456789012",
    JWT_ISSUER: "test-issuer",
    JWT_AUDIENCE: "test-audience",
    JWT_EXPIRES: "3600",
}

describe("Jwt Class", () => {
    let jwtInstance: Jwt

    beforeEach(() => {
        // Configurar variáveis de ambiente mockadas
        Object.assign(process.env, mockEnv)

        // Reset dos mocks
        vi.clearAllMocks()

        // Criar nova instância da classe
        jwtInstance = new Jwt()
    })

    afterEach(() => {
        // Limpar variáveis de ambiente após cada teste
        Object.keys(mockEnv).forEach((key) => {
            delete process.env[key]
        })
    })

    describe("encode method", () => {
        it("should generate a valid JWT token", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtInstance.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
            expect(token.split(".")).toHaveLength(3)
        })

        it("should throw NotFoundError when user is not found", async () => {
            ;(UserModel.findByPk as any).mockResolvedValue(null)

            await expect(
                jwtInstance.encode({
                    userId: "non-existent-user",
                    username: "testuser",
                    timezone: "America/Sao_Paulo",
                    permissionLevel: Level.USER,
                }),
            ).rejects.toThrow(NotFoundError)
        })
    })

    describe("decode method", () => {
        it("should decode a valid JWT token", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Primeiro gerar um token
            const token = await jwtInstance.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            // Depois decodificar
            const result = await jwtInstance.decode(token)

            expect(result.isValid).toBe(true)
            expect(result.payload.sub).toBe("user-123")
            expect(result.payload.username).toBe("testuser")
            expect(result.payload.timezone).toBe("America/Sao_Paulo")
            expect(result.payload.permissionLevel).toBe(Level.USER)
        })

        it("should handle invalid token", async () => {
            const result = await jwtInstance.decode("invalid.token")

            expect(result.isValid).toBe(false)
            expect(result.error).toBeDefined()
        })
    })

    describe("isValid method", () => {
        it("should return true for valid token", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtInstance.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const isValid = await jwtInstance.isValid(token)
            expect(isValid).toBe(true)
        })

        it("should return false for invalid token", async () => {
            const isValid = await jwtInstance.isValid("invalid.token")
            expect(isValid).toBe(false)
        })
    })

    describe("decodePayload method", () => {
        it("should decode payload without validation", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtInstance.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const payload = jwtInstance.decodePayload(token)

            expect(payload).toBeDefined()
            expect(payload?.sub).toBe("user-123")
            expect(payload?.username).toBe("testuser")
            expect(payload?.timezone).toBe("America/Sao_Paulo")
            expect(payload?.permissionLevel).toBe(Level.USER)
        })

        it("should return null for invalid token", async () => {
            const payload = jwtInstance.decodePayload("invalid.token")
            expect(payload).toBeNull()
        })
    })

    describe("isExpired method", () => {
        it("should return false for valid token", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtInstance.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const isExpired = jwtInstance.isExpired(token)
            expect(isExpired).toBe(false)
        })

        it("should return true for invalid token", async () => {
            const isExpired = jwtInstance.isExpired("invalid.token")
            expect(isExpired).toBe(true)
        })
    })

    describe("getTimeUntilExpiration method", () => {
        it("should return positive time for valid token", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtInstance.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const timeLeft = jwtInstance.getTimeUntilExpiration(token)
            expect(timeLeft).toBeGreaterThan(0)
            expect(timeLeft).toBeLessThanOrEqual(3600) // JWT_EXPIRES
        })

        it("should return 0 for invalid token", async () => {
            const timeLeft = jwtInstance.getTimeUntilExpiration("invalid.token")
            expect(timeLeft).toBe(0)
        })
    })

    describe("isNearExpiration method", () => {
        it("should return false for token with plenty of time left", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtInstance.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const isNearExpiration = jwtInstance.isNearExpiration(token, 60) // 1 minute threshold
            expect(isNearExpiration).toBe(false)
        })

        it("should return true for token near expiration", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtInstance.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            // Usar um threshold muito alto para simular token próximo da expiração
            const isNearExpiration = jwtInstance.isNearExpiration(token, 7200) // 2 hours threshold
            expect(isNearExpiration).toBe(true)
        })
    })

    describe("getTokenInfo method", () => {
        it("should return complete token information", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtInstance.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const info = jwtInstance.getTokenInfo(token)

            expect(info.userId).toBe("user-123")
            expect(info.username).toBe("testuser")
            expect(info.timezone).toBe("America/Sao_Paulo")
            expect(info.permissionLevel).toBe("USER")
            expect(info.issuedAt).toBeInstanceOf(Date)
            expect(info.expiresAt).toBeInstanceOf(Date)
            expect(info.isExpired).toBe(false)
            expect(info.timeUntilExpiration).toBeGreaterThan(0)
        })

        it("should return null values for invalid token", async () => {
            const info = jwtInstance.getTokenInfo("invalid.token")

            expect(info.userId).toBeNull()
            expect(info.username).toBeNull()
            expect(info.timezone).toBeNull()
            expect(info.permissionLevel).toBeNull()
            expect(info.issuedAt).toBeNull()
            expect(info.expiresAt).toBeNull()
            expect(info.isExpired).toBe(true)
            expect(info.timeUntilExpiration).toBe(0)
        })
    })

    describe("Default instance", () => {
        it("should work with default jwt instance", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwt.encode({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const result = await jwt.decode(token)
            expect(result.isValid).toBe(true)
        })
    })
})
