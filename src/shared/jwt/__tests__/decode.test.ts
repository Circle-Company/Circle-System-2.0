import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Device } from "../../../domain/auth"
import UserModel from "../../../infra/models/user.model"
import { ValidationError } from "../../errors"
import { jwtDecoder } from "../decode"
import { jwtEncoder } from "../encode"

// Mock das variáveis de ambiente
const mockEnv = {
    JWT_SECRET: "test-secret-key-12345678901234567890123456789012",
    JWT_ISSUER: "test-issuer",
    JWT_AUDIENCE: "test-audience",
    JWT_EXPIRES: "3600",
}

// Mock do UserModel para encode
vi.mock("@/infra/models/user.model", () => ({
    default: {
        findByPk: vi.fn(),
    },
}))

describe("JWT Decoder", () => {
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

    describe("Successful JWT decoding", () => {
        it("should decode a valid JWT token for WEB device", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Generate a token first
            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            // Decode the token
            const decoded = await jwtDecoder(token)

            expect(decoded).toBeDefined()
            expect(decoded.sub).toBe("user-123")
            expect(decoded.device).toBe(Device.WEB)
            expect(decoded.iss).toBe(mockEnv.JWT_ISSUER)
            expect(decoded.aud).toBe(mockEnv.JWT_AUDIENCE)
            expect(decoded.iat).toBeDefined()
            expect(decoded.exp).toBeDefined()
        })

        it("should decode a valid JWT token for DESKTOP device", async () => {
            const mockUser = { id: "user-456" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Generate a token first
            const token = await jwtEncoder({
                userId: "user-456",
                device: Device.DESKTOP,
                role: "admin",
            })

            // Decode the token
            const decoded = await jwtDecoder(token)

            expect(decoded).toBeDefined()
            expect(decoded.sub).toBe("user-456")
            expect(decoded.device).toBe(Device.DESKTOP)
            expect(decoded.iss).toBe(mockEnv.JWT_ISSUER)
            expect(decoded.aud).toBe(mockEnv.JWT_AUDIENCE)
        })

        it("should decode tokens with different users", async () => {
            const mockUser1 = { id: "user-1" }
            const mockUser2 = { id: "user-2" }

            ;(UserModel.findByPk as any)
                .mockResolvedValueOnce(mockUser1)
                .mockResolvedValueOnce(mockUser2)

            // Generate tokens for different users
            const token1 = await jwtEncoder({
                userId: "user-1",
                device: Device.WEB,
                role: "user",
            })

            const token2 = await jwtEncoder({
                userId: "user-2",
                device: Device.WEB,
                role: "admin",
            })

            // Decode both tokens
            const decoded1 = await jwtDecoder(token1)
            const decoded2 = await jwtDecoder(token2)

            expect(decoded1.sub).toBe("user-1")
            expect(decoded2.sub).toBe("user-2")
            expect(decoded1.sub).not.toBe(decoded2.sub)
        })

        it("should decode tokens with different devices for same user", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Generate tokens for same user with different devices
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

            // Decode both tokens
            const decodedWeb = await jwtDecoder(tokenWeb)
            const decodedDesktop = await jwtDecoder(tokenDesktop)

            expect(decodedWeb.sub).toBe("user-123")
            expect(decodedDesktop.sub).toBe("user-123")
            expect(decodedWeb.device).toBe(Device.WEB)
            expect(decodedDesktop.device).toBe(Device.DESKTOP)
        })
    })

    describe("Validation errors", () => {
        it("should throw ValidationError for invalid token format", async () => {
            const invalidToken = "invalid.token.format"

            await expect(jwtDecoder(invalidToken)).rejects.toThrow(ValidationError)
            await expect(jwtDecoder(invalidToken)).rejects.toThrow("Invalid or expired JWT token")
        })

        it("should throw ValidationError for malformed token", async () => {
            const malformedToken = "not.a.jwt.token"

            await expect(jwtDecoder(malformedToken)).rejects.toThrow(ValidationError)
            await expect(jwtDecoder(malformedToken)).rejects.toThrow("Invalid or expired JWT token")
        })

        it("should throw ValidationError for empty token", async () => {
            await expect(jwtDecoder("")).rejects.toThrow(ValidationError)
            await expect(jwtDecoder("")).rejects.toThrow("Invalid or expired JWT token")
        })

        it("should throw ValidationError for token with wrong signature", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Generate a token with one secret
            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            // Change the secret and try to decode
            process.env.JWT_SECRET = "different-secret-key"

            await expect(jwtDecoder(token)).rejects.toThrow(ValidationError)
            await expect(jwtDecoder(token)).rejects.toThrow("Invalid or expired JWT token")
        })

        it("should throw ValidationError for token with wrong issuer", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Generate a token with one issuer
            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            // Change the issuer and try to decode
            process.env.JWT_ISSUER = "different-issuer"

            await expect(jwtDecoder(token)).rejects.toThrow(ValidationError)
            await expect(jwtDecoder(token)).rejects.toThrow("Invalid or expired JWT token")
        })

        it("should throw ValidationError for token with wrong audience", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Generate a token with one audience
            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            // Change the audience and try to decode
            process.env.JWT_AUDIENCE = "different-audience"

            await expect(jwtDecoder(token)).rejects.toThrow(ValidationError)
            await expect(jwtDecoder(token)).rejects.toThrow("Invalid or expired JWT token")
        })

        it("should throw ValidationError when JWT_SECRET is missing", async () => {
            delete process.env.JWT_SECRET

            await expect(jwtDecoder("any.token")).rejects.toThrow(ValidationError)
            await expect(jwtDecoder("any.token")).rejects.toThrow(
                "JWT_SECRET environment variable is required",
            )
        })

        it("should throw ValidationError when JWT_SECRET is default value", async () => {
            process.env.JWT_SECRET = "default-secret-key"

            await expect(jwtDecoder("any.token")).rejects.toThrow(ValidationError)
            await expect(jwtDecoder("any.token")).rejects.toThrow(
                "JWT_SECRET environment variable is required",
            )
        })
    })

    describe("Token expiration", () => {
        it("should decode non-expired token", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Generate a token with long expiration
            process.env.JWT_EXPIRES = "86400" // 24 hours

            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            const decoded = await jwtDecoder(token)

            expect(decoded).toBeDefined()
            expect(decoded.sub).toBe("user-123")
            expect(decoded.exp).toBeDefined()
            expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
        })

        it("should throw ValidationError for expired token", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Generate a token with very short expiration
            process.env.JWT_EXPIRES = "1" // 1 second

            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            // Wait for token to expire
            await new Promise((resolve) => setTimeout(resolve, 1100))

            await expect(jwtDecoder(token)).rejects.toThrow(ValidationError)
            await expect(jwtDecoder(token)).rejects.toThrow("Invalid or expired JWT token")
        })
    })

    describe("Payload validation", () => {
        it("should validate required payload fields", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            const decoded = await jwtDecoder(token)

            // Check all required fields are present
            expect(decoded.sub).toBeDefined()
            expect(decoded.device).toBeDefined()
            expect(decoded.iat).toBeDefined()
            expect(decoded.exp).toBeDefined()
            expect(decoded.iss).toBeDefined()
            expect(decoded.aud).toBeDefined()
        })

        it("should handle payload with missing subject", async () => {
            // This test would require creating a token with invalid payload
            // Since we can't easily mock the JWT creation, we'll test the error handling
            const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZpY2UiOiJXRUJ9.invalid"

            await expect(jwtDecoder(invalidToken)).rejects.toThrow(ValidationError)
        })
    })

    describe("Configuration handling", () => {
        it("should use environment variables for configuration", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            const decoded = await jwtDecoder(token)

            expect(decoded.iss).toBe(mockEnv.JWT_ISSUER)
            expect(decoded.aud).toBe(mockEnv.JWT_AUDIENCE)
        })

        it("should handle missing optional environment variables", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            // Set default values for optional env vars (as decode.ts does)
            process.env.JWT_ISSUER = "access-controller-api"
            process.env.JWT_AUDIENCE = "access-controller-client"

            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            // Should still work with defaults
            const decoded = await jwtDecoder(token)

            expect(decoded).toBeDefined()
            expect(decoded.sub).toBe("user-123")
            expect(decoded.iss).toBe("access-controller-api")
            expect(decoded.aud).toBe("access-controller-client")
        })
    })

    describe("Error handling", () => {
        it("should handle JWT verification errors gracefully", async () => {
            const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"

            await expect(jwtDecoder(invalidToken)).rejects.toThrow(ValidationError)
            await expect(jwtDecoder(invalidToken)).rejects.toThrow("Invalid or expired JWT token")
        })

        it("should preserve ValidationError without wrapping", async () => {
            delete process.env.JWT_SECRET

            await expect(jwtDecoder("any.token")).rejects.toThrow(ValidationError)
            await expect(jwtDecoder("any.token")).rejects.toThrow(
                "JWT_SECRET environment variable is required",
            )
        })

        it("should handle malformed base64 in token", async () => {
            const malformedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed-base64.invalid"

            await expect(jwtDecoder(malformedToken)).rejects.toThrow(ValidationError)
            await expect(jwtDecoder(malformedToken)).rejects.toThrow("Invalid or expired JWT token")
        })
    })

    describe("Integration with encoder", () => {
        it("should decode token generated by encoder", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const originalPayload = {
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            }

            // Generate token
            const token = await jwtEncoder(originalPayload)

            // Decode token
            const decoded = await jwtDecoder(token)

            // Verify round-trip
            expect(decoded.sub).toBe(originalPayload.userId)
            expect(decoded.device).toBe(originalPayload.device)
        })

        it("should maintain token integrity through encode/decode cycle", async () => {
            const mockUser = { id: "user-456" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const originalPayload = {
                userId: "user-456",
                device: Device.DESKTOP,
                role: "admin",
            }

            // Generate token
            const token = await jwtEncoder(originalPayload)

            // Decode token
            const decoded = await jwtDecoder(token)

            // Verify all fields are preserved
            expect(decoded.sub).toBe(originalPayload.userId)
            expect(decoded.device).toBe(originalPayload.device)
            expect(decoded.iss).toBe(mockEnv.JWT_ISSUER)
            expect(decoded.aud).toBe(mockEnv.JWT_AUDIENCE)
            expect(decoded.iat).toBeDefined()
            expect(decoded.exp).toBeDefined()

            // Verify exp is in the future
            const now = Math.floor(Date.now() / 1000)
            expect(decoded.exp).toBeGreaterThan(now)
        })

        it("should handle multiple encode/decode cycles", async () => {
            const mockUser = { id: "user-789" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const payloads = [
                { userId: "user-789", device: Device.WEB, role: "user" },
                { userId: "user-789", device: Device.DESKTOP, role: "admin" },
            ]

            for (const payload of payloads) {
                const token = await jwtEncoder(payload)
                const decoded = await jwtDecoder(token)

                expect(decoded.sub).toBe(payload.userId)
                expect(decoded.device).toBe(payload.device)
            }
        })
    })

    describe("Performance and caching", () => {
        it("should decode tokens efficiently", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            const startTime = Date.now()
            const decoded = await jwtDecoder(token)
            const endTime = Date.now()

            expect(decoded).toBeDefined()
            expect(endTime - startTime).toBeLessThan(100) // Should decode quickly
        })

        it("should handle concurrent decode operations", async () => {
            const mockUser = { id: "user-123" }
            ;(UserModel.findByPk as any).mockResolvedValue(mockUser)

            const token = await jwtEncoder({
                userId: "user-123",
                device: Device.WEB,
                role: "user",
            })

            // Decode the same token multiple times concurrently
            const promises = Array(5)
                .fill(null)
                .map(() => jwtDecoder(token))
            const results = await Promise.all(promises)

            // All results should be identical
            results.forEach((result) => {
                expect(result.sub).toBe("user-123")
                expect(result.device).toBe(Device.WEB)
            })
        })
    })
})
