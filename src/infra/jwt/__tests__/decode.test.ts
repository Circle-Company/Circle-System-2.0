import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { decodeTokenPayload, isTokenValid, jwtDecoder } from "../decode"

import { Level } from "../../../core/access-control/types"
import UserModel from "../../models/user/user.model"
import { ValidationError } from "../../../errors"

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

describe("JWT Decoder", () => {
    beforeEach(() => {
        // Configurar variáveis de ambiente mockadas
        Object.assign(process.env, mockEnv)

        // Reset dos mocks
        vi.clearAllMocks()

        // Mock do UserModel para testes que usam jwtEncoder
        const mockUser = { id: "user-123" }
        ;(UserModel.findByPk as any).mockResolvedValue(mockUser)
    })

    afterEach(() => {
        // Limpar variáveis de ambiente após cada teste
        Object.keys(mockEnv).forEach((key) => {
            delete process.env[key]
        })
    })

    describe("Successful JWT decoding", () => {
        it("should decode a valid JWT token", async () => {
            // Criar um token válido usando a função de encode
            const { jwtEncoder } = await import("../encode")

            const token = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const result = await jwtDecoder(token)

            expect(result.isValid).toBe(true)
            expect(result.payload.sub).toBe("user-123")
            expect(result.payload.username).toBe("testuser")
            expect(result.payload.timezone).toBe("America/Sao_Paulo")
            expect(result.payload.permissionLevel).toBe(Level.USER)
            expect(result.payload.iss).toBe(mockEnv.JWT_ISSUER)
            expect(result.payload.aud).toBe(mockEnv.JWT_AUDIENCE)
            expect(result.payload.iat).toBeDefined()
            expect(result.payload.exp).toBeDefined()
        })

        it("should decode different permission levels", async () => {
            const { jwtEncoder } = await import("../encode")

            const token = await jwtEncoder({
                userId: "user-456",
                username: "adminuser",
                timezone: "Europe/London",
                permissionLevel: Level.ADMIN,
            })

            const result = await jwtDecoder(token)

            expect(result.isValid).toBe(true)
            expect(result.payload.permissionLevel).toBe(Level.ADMIN)
        })
    })

    describe("Invalid token handling", () => {
        it("should handle invalid token format", async () => {
            const result = await jwtDecoder("invalid.token")

            expect(result.isValid).toBe(false)
            expect(result.error).toContain("Invalid token format")
        })

        it("should handle malformed token", async () => {
            const result = await jwtDecoder("not.a.jwt.token")

            expect(result.isValid).toBe(false)
            expect(result.error).toContain("Invalid token format")
        })

        it("should handle empty token", async () => {
            const result = await jwtDecoder("")

            expect(result.isValid).toBe(false)
            expect(result.error).toContain("Token is required")
        })

        it("should handle null token", async () => {
            const result = await jwtDecoder(null as any)

            expect(result.isValid).toBe(false)
            expect(result.error).toContain("Token is required")
        })

        it("should handle token with missing required fields", async () => {
            // Criar um token com payload incompleto
            const incompletePayload = {
                sub: "user-123",
                // username missing
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            }

            const { SignJWT } = await import("jose")
            const secret = new TextEncoder().encode(mockEnv.JWT_SECRET)

            const token = await new SignJWT(incompletePayload)
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("1h")
                .setIssuer(mockEnv.JWT_ISSUER)
                .setAudience(mockEnv.JWT_AUDIENCE)
                .sign(secret)

            const result = await jwtDecoder(token)

            expect(result.isValid).toBe(false)
            expect(result.error).toContain("Missing required fields")
        })

        it("should handle token with invalid permission level", async () => {
            // Criar um token com permission level inválido
            const invalidPayload = {
                sub: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: "INVALID_LEVEL",
            }

            const { SignJWT } = await import("jose")
            const secret = new TextEncoder().encode(mockEnv.JWT_SECRET)

            const token = await new SignJWT(invalidPayload)
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("1h")
                .setIssuer(mockEnv.JWT_ISSUER)
                .setAudience(mockEnv.JWT_AUDIENCE)
                .sign(secret)

            const result = await jwtDecoder(token)

            expect(result.isValid).toBe(false)
            expect(result.error).toContain("Invalid permission level")
        })
    })

    describe("Configuration errors", () => {
        it("should throw ValidationError when JWT_SECRET is missing", async () => {
            delete process.env.JWT_SECRET

            await expect(jwtDecoder("any.token")).rejects.toThrow(ValidationError)
            await expect(jwtDecoder("any.token")).rejects.toThrow("JWT configuration is incomplete")
        })

        it("should throw ValidationError when JWT_ISSUER is missing", async () => {
            delete process.env.JWT_ISSUER

            await expect(jwtDecoder("any.token")).rejects.toThrow(ValidationError)
        })

        it("should throw ValidationError when JWT_AUDIENCE is missing", async () => {
            delete process.env.JWT_AUDIENCE

            await expect(jwtDecoder("any.token")).rejects.toThrow(ValidationError)
        })
    })

    describe("Utility functions", () => {
        it("should validate token with isTokenValid", async () => {
            const { jwtEncoder } = await import("../encode")

            const validToken = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const isValid = await isTokenValid(validToken)
            expect(isValid).toBe(true)

            const isInvalid = await isTokenValid("invalid.token")
            expect(isInvalid).toBe(false)
        })

        it("should decode payload without validation", async () => {
            const { jwtEncoder } = await import("../encode")

            const token = await jwtEncoder({
                userId: "user-123",
                username: "testuser",
                timezone: "America/Sao_Paulo",
                permissionLevel: Level.USER,
            })

            const payload = decodeTokenPayload(token)

            expect(payload).toBeDefined()
            expect(payload?.sub).toBe("user-123")
            expect(payload?.username).toBe("testuser")
            expect(payload?.timezone).toBe("America/Sao_Paulo")
            expect(payload?.permissionLevel).toBe(Level.USER)
        })

        it("should return null for invalid token in decodeTokenPayload", async () => {
            const payload = decodeTokenPayload("invalid.token")
            expect(payload).toBeNull()

            const payload2 = decodeTokenPayload("")
            expect(payload2).toBeNull()

            const payload3 = decodeTokenPayload("not.a.jwt")
            expect(payload3).toBeNull()
        })
    })

    describe("Error handling", () => {
        it("should handle internal errors gracefully", async () => {
            // Simular erro interno
            const originalConsoleError = console.error
            console.error = vi.fn()

            try {
                // Este teste verifica que erros internos são tratados
                const result = await jwtDecoder("malformed.token")

                expect(result.isValid).toBe(false)
                expect(result.error).toBeDefined()
            } finally {
                console.error = originalConsoleError
            }
        })
    })
})
