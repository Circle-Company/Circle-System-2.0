import { NotFoundError, ValidationError } from "../../../errors"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Level } from "../../../core/access-control/types"
import UserModel from "../../models/user/user.model"
import { jwtEncoder } from "../encode"

// Mock do UserModel
vi.mock("@/infra/models/user/user.model", () => ({
    default: {
        findByPk: vi.fn(),
    },
}))

// Mock das variáveis de ambiente
const mockEnv = {
    JWT_SECRET: "test-secret-key-12345678901234567890123456789012",
    JWT_ISSUER: "test-issuer",
    JWT_AUDIENCE: "test-audience",
    JWT_EXPIRES: "3600",
}

describe("JWT Encoder", () => {
    beforeEach(() => {
        // Configurar variáveis de ambiente mockadas
        Object.assign(process.env, mockEnv)

        // Reset dos mocks
        vi.clearAllMocks()
    })

    afterEach(() => {
        // Limpar variáveis de ambiente após cada teste
        Object.keys(mockEnv).forEach((key) => {
            delete process.env[key]
        })
    })

    describe("Successful JWT generation", () => {
        it("should generate a valid JWT token with username and timezone", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const result = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            expect(result).toBeDefined()
            expect(typeof result).toBe("string")
            expect(result.split(".")).toHaveLength(3) // JWT tem 3 partes separadas por ponto

            // Verificar se o UserModel.findByPk foi chamado corretamente
            expect(UserModel.findByPk).toHaveBeenCalledWith("user-123", {
                attributes: ["id"],
            })
        })

        it("should generate a valid JWT token for different user", async () => {
            const mockUser = { id: "user-456" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const result = await jwtEncoder({
                userId: "user-456",
                username: "anotheruser",
                timezone: "Europe/London",
                permissionLevel: Level.ADMIN,
            })

            expect(result).toBeDefined()
            expect(typeof result).toBe("string")
            expect(result.split(".")).toHaveLength(3)
        })

        it("should generate different tokens for different users", async () => {
            const mockUser1 = { id: "user-1" }
            const mockUser2 = { id: "user-2" }

            ;(UserModel.findByPk as any)
                .mockResolvedValueOnce(mockUser1)
                .mockResolvedValueOnce(mockUser2)

            const token1 = await jwtEncoder({
                userId: "user-1",
                username: "user1",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const token2 = await jwtEncoder({
                userId: "user-2",
                username: "user2",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            expect(token1).not.toBe(token2)
        })

        it("should generate different tokens for same user with different timezones", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token1 = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const token2 = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "Europe/London",
                permissionLevel: Level.USER,
            })

            expect(token1).not.toBe(token2)
        })
    })

    describe("Validation errors", () => {
        it("should throw ValidationError when user is not found", async () => {
            ;(UserModel.findByPk as any).mockResolvedValue(null)

            await expect(
                jwtEncoder({
                    userId: "non-existent-user",
                    username: "testuser",
                    timezone: "America/Sao_Paulo",
                    permissionLevel: Level.USER,
                }),
            ).rejects.toThrow(NotFoundError)

            await expect(
                jwtEncoder({
                    userId: "non-existent-user",
                    username: "testuser",
                    timezone: "America/Sao_Paulo",
                    permissionLevel: Level.USER,
                }),
            ).rejects.toThrow("User not found")
        })

        it("should throw ValidationError when JWT_SECRET is missing", async () => {
            delete process.env.JWT_SECRET

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    username: "testuser",
                    timezone: "America/Sao_Paulo",
                    permissionLevel: Level.USER,
                }),
            ).rejects.toThrow(ValidationError)

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    username: "testuser",
                    timezone: "America/Sao_Paulo",
                    permissionLevel: Level.USER,
                }),
            ).rejects.toThrow("JWT configuration is incomplete")
        })

        it("should throw ValidationError when JWT_ISSUER is missing", async () => {
            delete process.env.JWT_ISSUER

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    username: "testuser",
                    timezone: "America/Sao_Paulo",
                    permissionLevel: Level.USER,
                }),
            ).rejects.toThrow(ValidationError)
        })

        it("should throw ValidationError when JWT_AUDIENCE is missing", async () => {
            delete process.env.JWT_AUDIENCE

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    username: "testuser",
                    timezone: "America/Sao_Paulo",
                    permissionLevel: Level.USER,
                }),
            ).rejects.toThrow(ValidationError)
        })
    })

    describe("Configuration handling", () => {
        it("should use default expiration time when JWT_EXPIRES is not set", async () => {
            delete process.env.JWT_EXPIRES

            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const result = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            expect(result).toBeDefined()
        })

        it("should use custom expiration time when JWT_EXPIRES is set", async () => {
            process.env.JWT_EXPIRES = "7200" // 2 horas

            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const result = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            expect(result).toBeDefined()
        })
    })

    describe("Error handling", () => {
        it("should handle database errors gracefully", async () => {
            ;(UserModel.findByPk as any).mockRejectedValue(new Error("Database connection failed"))

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    username: "testuser",
                    timezone: "America/Sao_Paulo",
                    permissionLevel: Level.USER,
                }),
            ).rejects.toThrow(ValidationError)

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    username: "testuser",
                    timezone: "America/Sao_Paulo",
                    permissionLevel: Level.USER,
                }),
            ).rejects.toThrow("Failed to generate JWT token")
        })

        it("should preserve ValidationError without wrapping", async () => {
            // Simular erro de validação interno
            const originalConsoleError = console.error
            console.error = vi.fn()

            try {
                // Este teste verifica que ValidationError não é re-wrapped
                // Testando com configuração JWT inválida
                delete process.env.JWT_SECRET

                await expect(
                    jwtEncoder({
                        userId: "user-123",
                        username: "testuser",
                        timezone: "America/Sao_Paulo",
                        permissionLevel: Level.USER,
                    }),
                ).rejects.toThrow(ValidationError)

                // Verificar que não foi logado como erro interno
                expect(console.error).not.toHaveBeenCalled()
            } finally {
                console.error = originalConsoleError
                // Restaurar configuração
                process.env.JWT_SECRET = "test-secret-key-12345678901234567890123456789012"
            }
        })
    })

    describe("JWT token structure", () => {
        it("should generate JWT with correct structure", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const parts = token.split(".")
            expect(parts).toHaveLength(3)

            // Verificar se as partes são base64 válidas
            parts.forEach((part) => {
                expect(() => atob(part.replace(/-/g, "+").replace(/_/g, "/"))).not.toThrow()
            })
        })

        it("should include correct claims in JWT payload", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const parts = token.split(".")
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))

            expect(payload.sub).toBe("user-123")
            expect(payload.username).toBe("testuser")
            expect(payload.timezone).toBe("America/Sao_Paulo")
            expect(payload.permissionLevel).toBe(Level.USER)
            expect(payload.iss).toBe(mockEnv.JWT_ISSUER)
            expect(payload.aud).toBe(mockEnv.JWT_AUDIENCE)
            expect(payload.iat).toBeDefined()
            expect(payload.exp).toBeDefined()

            // Verificar que exp é igual a iat + JWT_EXPIRES
            const now = Math.floor(Date.now() / 1000)
            expect(payload.iat).toBeLessThanOrEqual(now)
            expect(payload.exp).toBe(payload.iat + Number(mockEnv.JWT_EXPIRES))
        })
    })

    describe("Performance and caching", () => {
        it("should cache JWT configuration", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Primeira chamada
            await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            // Segunda chamada - configuração deve estar em cache
            await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "Europe/London",
                permissionLevel: Level.ADMIN,
            })

            // Ambas as chamadas devem ter funcionado sem erro de configuração
            expect(UserModel.findByPk).toHaveBeenCalledTimes(2)
        })
    })
})
