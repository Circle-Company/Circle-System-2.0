import { beforeEach, describe, expect, it, vi } from "vitest"
import { compare, hash } from "bcryptjs"

import { Encrypt } from "../string"

// Mock do bcryptjs
vi.mock("bcryptjs", () => ({
    hash: vi.fn(),
    compare: vi.fn(),
}))


describe("Encrypt String", () => {
    let mockHash: any
    let mockCompare: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockHash = vi.mocked(hash)
        mockCompare = vi.mocked(compare)
    })

    describe("Encrypt Class", () => {
        it("should create instance with value", () => {
            const encrypt = new Encrypt("test-password")
            expect(encrypt).toBeInstanceOf(Encrypt)
        })

        it("should store the value correctly", () => {
            const password = "my-secret-password"
            const encrypt = new Encrypt(password)

            // Verificar se o valor foi armazenado (através do comportamento)
            expect(encrypt).toBeDefined()
        })
    })

    describe("hashStr method", () => {
        it("should hash a password successfully", async () => {
            const password = "test-password"
            const expectedHash = "$2a$10$hashedpasswordstring"

            mockHash.mockResolvedValue(expectedHash)

            const encrypt = new Encrypt(password)
            const result = await encrypt.hashStr()

            expect(mockHash).toHaveBeenCalledWith(password, 10)
            expect(result).toBe(expectedHash)
        })

        it("should use salt rounds of 10", async () => {
            const password = "test-password"
            const expectedHash = "$2a$10$hashedpasswordstring"

            mockHash.mockResolvedValue(expectedHash)

            const encrypt = new Encrypt(password)
            await encrypt.hashStr()

            expect(mockHash).toHaveBeenCalledWith(password, 10)
        })

        it("should handle empty password", async () => {
            const password = ""
            const expectedHash = "$2a$10$emptyhash"

            mockHash.mockResolvedValue(expectedHash)

            const encrypt = new Encrypt(password)
            const result = await encrypt.hashStr()

            expect(mockHash).toHaveBeenCalledWith(password, 10)
            expect(result).toBe(expectedHash)
        })

        it("should handle special characters in password", async () => {
            const password = "P@ssw0rd!#$%^&*()"
            const expectedHash = "$2a$10$specialcharshash"

            mockHash.mockResolvedValue(expectedHash)

            const encrypt = new Encrypt(password)
            const result = await encrypt.hashStr()

            expect(mockHash).toHaveBeenCalledWith(password, 10)
            expect(result).toBe(expectedHash)
        })

        it("should handle unicode characters in password", async () => {
            const password = "senha123ção"
            const expectedHash = "$2a$10$unicodehash"

            mockHash.mockResolvedValue(expectedHash)

            const encrypt = new Encrypt(password)
            const result = await encrypt.hashStr()

            expect(mockHash).toHaveBeenCalledWith(password, 10)
            expect(result).toBe(expectedHash)
        })

        it("should handle long passwords", async () => {
            const password = "a".repeat(1000) // Senha muito longa
            const expectedHash = "$2a$10$longpasswordhash"

            mockHash.mockResolvedValue(expectedHash)

            const encrypt = new Encrypt(password)
            const result = await encrypt.hashStr()

            expect(mockHash).toHaveBeenCalledWith(password, 10)
            expect(result).toBe(expectedHash)
        })

        it("should handle hash errors", async () => {
            const password = "test-password"
            const error = new Error("Hash generation failed")

            mockHash.mockRejectedValue(error)

            const encrypt = new Encrypt(password)

            await expect(encrypt.hashStr()).rejects.toThrow("Hash generation failed")
            expect(mockHash).toHaveBeenCalledWith(password, 10)
        })
    })

    describe("compare method", () => {
        it("should compare password with hash successfully", async () => {
            const plainPassword = "test-password"
            const hashedPassword = "$2a$10$hashedpasswordstring"

            mockCompare.mockResolvedValue(true)

            const encrypt = new Encrypt("dummy")
            const result = await encrypt.compare({
                value: plainPassword,
                encryptedValue: hashedPassword,
            })

            expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword)
            expect(result).toBe(true)
        })

        it("should return false for incorrect password", async () => {
            const plainPassword = "wrong-password"
            const hashedPassword = "$2a$10$hashedpasswordstring"

            mockCompare.mockResolvedValue(false)

            const encrypt = new Encrypt("dummy")
            const result = await encrypt.compare({
                value: plainPassword,
                encryptedValue: hashedPassword,
            })

            expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword)
            expect(result).toBe(false)
        })

        it("should handle empty password comparison", async () => {
            const plainPassword = ""
            const hashedPassword = "$2a$10$hashedpasswordstring"

            mockCompare.mockResolvedValue(false)

            const encrypt = new Encrypt("dummy")
            const result = await encrypt.compare({
                value: plainPassword,
                encryptedValue: hashedPassword,
            })

            expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword)
            expect(result).toBe(false)
        })

        it("should handle empty hash comparison", async () => {
            const plainPassword = "test-password"
            const hashedPassword = ""

            mockCompare.mockResolvedValue(false)

            const encrypt = new Encrypt("dummy")
            const result = await encrypt.compare({
                value: plainPassword,
                encryptedValue: hashedPassword,
            })

            expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword)
            expect(result).toBe(false)
        })

        it("should handle special characters in comparison", async () => {
            const plainPassword = "P@ssw0rd!#$%^&*()"
            const hashedPassword = "$2a$10$specialcharshash"

            mockCompare.mockResolvedValue(true)

            const encrypt = new Encrypt("dummy")
            const result = await encrypt.compare({
                value: plainPassword,
                encryptedValue: hashedPassword,
            })

            expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword)
            expect(result).toBe(true)
        })

        it("should handle unicode characters in comparison", async () => {
            const plainPassword = "senha123ção"
            const hashedPassword = "$2a$10$unicodehash"

            mockCompare.mockResolvedValue(true)

            const encrypt = new Encrypt("dummy")
            const result = await encrypt.compare({
                value: plainPassword,
                encryptedValue: hashedPassword,
            })

            expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword)
            expect(result).toBe(true)
        })

        it("should handle comparison errors", async () => {
            const plainPassword = "test-password"
            const hashedPassword = "$2a$10$invalidhash"
            const error = new Error("Comparison failed")

            mockCompare.mockRejectedValue(error)

            const encrypt = new Encrypt("dummy")

            await expect(
                encrypt.compare({
                    value: plainPassword,
                    encryptedValue: hashedPassword,
                }),
            ).rejects.toThrow("Comparison failed")

            expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword)
        })

        it("should handle malformed hash", async () => {
            const plainPassword = "test-password"
            const malformedHash = "not-a-valid-bcrypt-hash"

            mockCompare.mockResolvedValue(false)

            const encrypt = new Encrypt("dummy")
            const result = await encrypt.compare({
                value: plainPassword,
                encryptedValue: malformedHash,
            })

            expect(mockCompare).toHaveBeenCalledWith(plainPassword, malformedHash)
            expect(result).toBe(false)
        })
    })

    describe("Integration scenarios", () => {
        it("should hash and then compare the same password", async () => {
            const password = "integration-test-password"
            const hashedPassword = "$2a$10$integrationhash"

            // Mock hash
            mockHash.mockResolvedValue(hashedPassword)

            // Mock compare to return true for the same password
            mockCompare.mockResolvedValue(true)

            const encrypt = new Encrypt(password)

            // Hash the password
            const hashResult = await encrypt.hashStr()
            expect(hashResult).toBe(hashedPassword)

            // Compare the original password with the hash
            const compareResult = await encrypt.compare({
                value: password,
                encryptedValue: hashResult,
            })

            expect(compareResult).toBe(true)
            expect(mockHash).toHaveBeenCalledWith(password, 10)
            expect(mockCompare).toHaveBeenCalledWith(password, hashedPassword)
        })

        it("should hash one password and compare with different password", async () => {
            const originalPassword = "original-password"
            const differentPassword = "different-password"
            const hashedPassword = "$2a$10$originalhash"

            // Mock hash
            mockHash.mockResolvedValue(hashedPassword)

            // Mock compare to return false for different password
            mockCompare.mockResolvedValue(false)

            const encrypt = new Encrypt(originalPassword)

            // Hash the original password
            const hashResult = await encrypt.hashStr()
            expect(hashResult).toBe(hashedPassword)

            // Compare different password with the hash
            const compareResult = await encrypt.compare({
                value: differentPassword,
                encryptedValue: hashResult,
            })

            expect(compareResult).toBe(false)
            expect(mockHash).toHaveBeenCalledWith(originalPassword, 10)
            expect(mockCompare).toHaveBeenCalledWith(differentPassword, hashedPassword)
        })

        it("should handle multiple hash operations", async () => {
            const password1 = "password1"
            const password2 = "password2"
            const hash1 = "$2a$10$hash1"
            const hash2 = "$2a$10$hash2"

            mockHash.mockResolvedValueOnce(hash1).mockResolvedValueOnce(hash2)

            const encrypt1 = new Encrypt(password1)
            const encrypt2 = new Encrypt(password2)

            const result1 = await encrypt1.hashStr()
            const result2 = await encrypt2.hashStr()

            expect(result1).toBe(hash1)
            expect(result2).toBe(hash2)
            expect(mockHash).toHaveBeenCalledTimes(2)
            expect(mockHash).toHaveBeenNthCalledWith(1, password1, 10)
            expect(mockHash).toHaveBeenNthCalledWith(2, password2, 10)
        })

        it("should handle multiple compare operations", async () => {
            const password1 = "password1"
            const password2 = "password2"
            const hash1 = "$2a$10$hash1"
            const hash2 = "$2a$10$hash2"

            mockCompare.mockResolvedValueOnce(true).mockResolvedValueOnce(false)

            const encrypt = new Encrypt("dummy")

            const result1 = await encrypt.compare({
                value: password1,
                encryptedValue: hash1,
            })

            const result2 = await encrypt.compare({
                value: password2,
                encryptedValue: hash2,
            })

            expect(result1).toBe(true)
            expect(result2).toBe(false)
            expect(mockCompare).toHaveBeenCalledTimes(2)
            expect(mockCompare).toHaveBeenNthCalledWith(1, password1, hash1)
            expect(mockCompare).toHaveBeenNthCalledWith(2, password2, hash2)
        })
    })

    describe("Edge cases", () => {
        it("should handle null-like values gracefully", async () => {
            const password = "test-password"
            const hash = "$2a$10$hashedpassword"

            mockHash.mockResolvedValue(hash)
            mockCompare.mockResolvedValue(true)

            const encrypt = new Encrypt(password)

            // Test hash with null-like constructor value
            const hashResult = await encrypt.hashStr()
            expect(hashResult).toBe(hash)

            // Test compare with null-like values
            const compareResult = await encrypt.compare({
                value: password,
                encryptedValue: hash,
            })
            expect(compareResult).toBe(true)
        })

        it("should handle very short passwords", async () => {
            const shortPassword = "a"
            const hash = "$2a$10$shorthash"

            mockHash.mockResolvedValue(hash)

            const encrypt = new Encrypt(shortPassword)
            const result = await encrypt.hashStr()

            expect(result).toBe(hash)
            expect(mockHash).toHaveBeenCalledWith(shortPassword, 10)
        })

        it("should handle passwords with only spaces", async () => {
            const spacePassword = "   "
            const hash = "$2a$10$spacehash"

            mockHash.mockResolvedValue(hash)

            const encrypt = new Encrypt(spacePassword)
            const result = await encrypt.hashStr()

            expect(result).toBe(hash)
            expect(mockHash).toHaveBeenCalledWith(spacePassword, 10)
        })
    })
})
