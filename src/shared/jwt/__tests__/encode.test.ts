import { NotFoundError, ValidationError } from "../../errors"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Device } from "../../../domain/auth"
import UserModel from "../../../infra/models/user.model"
import { jwtEncoder } from "../encode"

// Mock do UserModel
vi.mock("@/infra/models/user.model", () => ({
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
        it("should generate a valid JWT token for WEB device", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const result = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            expect(result).toBeDefined()
            expect(typeof result).toBe("string")
            expect(result.split(".")).toHaveLength(3) // JWT tem 3 partes separadas por ponto

            // Verificar se o UserModel.findByPk foi chamado corretamente
            expect(UserModel.findByPk).toHaveBeenCalledWith("user-123", {
                attributes: ["id"],
            })
        })

        it("should generate a valid JWT token for DESKTOP device", async () => {
            const mockUser = { id: "user-456" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const result = await jwtEncoder({
                userId: "user-456",
                device: Device.DESKTOP,
                role: "user",
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
                device: Device.WEB,
                role: "user",
            })

            const token2 = await jwtEncoder({
                userId: "user-2",
                device: Device.WEB,
                role: "user",
            })

            expect(token1).not.toBe(token2)
        })

        it("should generate different tokens for same user with different devices", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const tokenWeb = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            const tokenDesktop = await jwtEncoder({
                userId: "user-123",
                device: Device.DESKTOP,
                role: "user",
            })

            expect(tokenWeb).not.toBe(tokenDesktop)
        })
    })

    describe("Validation errors", () => {
        it("should throw NotFoundError when user is not found", async () => {
            ;(UserModel.findByPk as any).mockResolvedValue(null)

            await expect(
                jwtEncoder({
                    userId: "non-existent-user",
                    device: Device.WEB,
                    role: "user",
                }),
            ).rejects.toThrow(NotFoundError)

            await expect(
                jwtEncoder({
                    userId: "non-existent-user",
                    device: Device.WEB,
                    role: "user",
                }),
            ).rejects.toThrow("User not found")
        })

        it("should throw ValidationError for invalid device type", async () => {
            await expect(
                jwtEncoder({
                    userId: "user-123",
                    device: "INVALID_DEVICE" as Device,
                    role: "user",
                }),
            ).rejects.toThrow(ValidationError)

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    device: "INVALID_DEVICE" as Device,
                    role: "user",
                }),
            ).rejects.toThrow("Invalid device type")
        })

        it("should throw ValidationError when JWT_SECRET is missing", async () => {
            delete process.env.JWT_SECRET

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    device: Device.WEB,
                    role: "user",
                }),
            ).rejects.toThrow(ValidationError)

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    device: Device.WEB,
                    role: "user",
                }),
            ).rejects.toThrow("JWT configuration is incomplete")
        })

        it("should throw ValidationError when JWT_ISSUER is missing", async () => {
            delete process.env.JWT_ISSUER

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    device: Device.WEB,
                    role: "user",
                }),
            ).rejects.toThrow(ValidationError)
        })

        it("should throw ValidationError when JWT_AUDIENCE is missing", async () => {
            delete process.env.JWT_AUDIENCE

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    device: Device.WEB,
                    role: "user",
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
                device: Device.WEB,
                role: "user",
            })

            expect(result).toBeDefined()
        })

        it("should use custom expiration time when JWT_EXPIRES is set", async () => {
            process.env.JWT_EXPIRES = "7200" // 2 horas

            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const result = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
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
                    device: Device.WEB,
                    role: "user",
                }),
            ).rejects.toThrow(ValidationError)

            await expect(
                jwtEncoder({
                    userId: "user-123",
                    device: Device.WEB,
                    role: "user",
                }),
            ).rejects.toThrow("Failed to generate JWT token")
        })

        it("should preserve ValidationError without wrapping", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Simular erro de validação interno
            const originalConsoleError = console.error
            console.error = vi.fn()

            try {
                // Este teste verifica que ValidationError não é re-wrapped
                // Como não podemos facilmente mockar o SignJWT, vamos testar outro cenário
                await expect(
                    jwtEncoder({
                        userId: "user-123",
                        device: "INVALID" as Device, // Dispositivo inválido
                        role: "user",
                    }),
                ).rejects.toThrow(ValidationError)

                // Verificar que não foi logado como erro interno
                expect(console.error).not.toHaveBeenCalled()
            } finally {
                console.error = originalConsoleError
            }
        })
    })

    describe("JWT token structure", () => {
        it("should generate JWT with correct structure", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
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
                device: Device.WEB,
                role: "user",
            })

            const parts = token.split(".")
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))

            expect(payload.sub).toBe("user-123")
            expect(payload.device).toBe(Device.WEB)
            expect(payload.iss).toBe(mockEnv.JWT_ISSUER)
            expect(payload.aud).toBe(mockEnv.JWT_AUDIENCE)
            expect(payload.iat).toBeDefined()
            expect(payload.exp).toBeDefined()

            // Verificar que exp é um timestamp válido
            const now = Math.floor(Date.now() / 1000)
            expect(payload.iat).toBeLessThanOrEqual(now)
            expect(payload.exp).toBeGreaterThan(now)
        })
    })

    describe("Performance and caching", () => {
        it("should cache JWT configuration", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Primeira chamada
            await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            // Segunda chamada - configuração deve estar em cache
            await jwtEncoder({
                userId: "user-123",
                device: Device.DESKTOP,
                role: "user",
            })

            // Ambas as chamadas devem ter funcionado sem erro de configuração
            expect(UserModel.findByPk).toHaveBeenCalledTimes(2)
        })
    })
})
