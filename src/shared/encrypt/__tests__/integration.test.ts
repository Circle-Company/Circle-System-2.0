import { describe, expect, it } from "vitest"

import { Encrypt } from "../string"

describe("Encrypt Integration Tests", () => {
    describe("Real bcryptjs integration", () => {
        it("should hash and verify password correctly", async () => {
            const password = "test-password-123"
            const encrypt = new Encrypt(password)

            // Hash the password
            const hashedPassword = await encrypt.hashStr()

            // Verify the password matches the hash
            const isValid = await encrypt.compare({
                value: password,
                encryptedValue: hashedPassword,
            })

            expect(isValid).toBe(true)
            expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/)
        })

        it("should reject incorrect password", async () => {
            const originalPassword = "original-password"
            const wrongPassword = "wrong-password"
            const encrypt = new Encrypt(originalPassword)

            // Hash the original password
            const hashedPassword = await encrypt.hashStr()

            // Try to verify with wrong password
            const isValid = await encrypt.compare({
                value: wrongPassword,
                encryptedValue: hashedPassword,
            })

            expect(isValid).toBe(false)
        })

        it("should generate different hashes for same password", async () => {
            const password = "same-password"
            const encrypt1 = new Encrypt(password)
            const encrypt2 = new Encrypt(password)

            // Generate two hashes for the same password
            const hash1 = await encrypt1.hashStr()
            const hash2 = await encrypt2.hashStr()

            // Hashes should be different (due to random salt)
            expect(hash1).not.toBe(hash2)

            // But both should verify correctly
            const isValid1 = await encrypt1.compare({
                value: password,
                encryptedValue: hash1,
            })

            const isValid2 = await encrypt2.compare({
                value: password,
                encryptedValue: hash2,
            })

            expect(isValid1).toBe(true)
            expect(isValid2).toBe(true)
        })

        it("should handle special characters correctly", async () => {
            const password = "P@ssw0rd!#$%^&*()_+-=[]{}|;':\",./<>?"
            const encrypt = new Encrypt(password)

            const hashedPassword = await encrypt.hashStr()
            const isValid = await encrypt.compare({
                value: password,
                encryptedValue: hashedPassword,
            })

            expect(isValid).toBe(true)
            expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/)
        })

        it("should handle unicode characters correctly", async () => {
            const password = "senha123çãoçãéíóú"
            const encrypt = new Encrypt(password)

            const hashedPassword = await encrypt.hashStr()
            const isValid = await encrypt.compare({
                value: password,
                encryptedValue: hashedPassword,
            })

            expect(isValid).toBe(true)
            expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/)
        })

        it("should handle empty password", async () => {
            const password = ""
            const encrypt = new Encrypt(password)

            const hashedPassword = await encrypt.hashStr()
            const isValid = await encrypt.compare({
                value: password,
                encryptedValue: hashedPassword,
            })

            expect(isValid).toBe(true)
            expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/)
        })

        it("should handle very long password", async () => {
            const password = "a".repeat(1000)
            const encrypt = new Encrypt(password)

            const hashedPassword = await encrypt.hashStr()
            const isValid = await encrypt.compare({
                value: password,
                encryptedValue: hashedPassword,
            })

            expect(isValid).toBe(true)
            expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/)
        })

        it("should handle password with newlines and tabs", async () => {
            const password = "password\nwith\ttabs\r\nand\rnewlines"
            const encrypt = new Encrypt(password)

            const hashedPassword = await encrypt.hashStr()
            const isValid = await encrypt.compare({
                value: password,
                encryptedValue: hashedPassword,
            })

            expect(isValid).toBe(true)
            expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/)
        })

        it("should verify password against different hash format", async () => {
            const password = "test-password"
            const encrypt = new Encrypt(password)

            // Create a hash
            const hashedPassword = await encrypt.hashStr()

            // Verify that the hash format is correct
            expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/)

            // Extract the salt rounds from the hash
            const saltRounds = parseInt(hashedPassword.split("$")[2])
            expect(saltRounds).toBe(10)
        })

        it("should handle multiple concurrent hash operations", async () => {
            const passwords = ["password1", "password2", "password3", "password4", "password5"]

            const encrypts = passwords.map((pwd) => new Encrypt(pwd))

            // Hash all passwords concurrently
            const hashes = await Promise.all(encrypts.map((encrypt) => encrypt.hashStr()))

            // All hashes should be different
            const uniqueHashes = new Set(hashes)
            expect(uniqueHashes.size).toBe(hashes.length)

            // All hashes should be valid bcrypt format
            hashes.forEach((hash) => {
                expect(hash).toMatch(/^\$2[aby]\$\d+\$/)
            })

            // Verify all passwords against their hashes
            const verifications = await Promise.all(
                passwords.map((password, index) =>
                    encrypts[index].compare({
                        value: password,
                        encryptedValue: hashes[index],
                    }),
                ),
            )

            // All verifications should be true
            verifications.forEach((isValid) => {
                expect(isValid).toBe(true)
            })
        })

        it("should handle multiple concurrent compare operations", async () => {
            const password = "test-password"
            const encrypt = new Encrypt(password)

            // Create multiple hashes for the same password
            const hashes = await Promise.all([
                encrypt.hashStr(),
                encrypt.hashStr(),
                encrypt.hashStr(),
            ])

            // All hashes should be different
            const uniqueHashes = new Set(hashes)
            expect(uniqueHashes.size).toBe(hashes.length)

            // Compare all hashes concurrently
            const verifications = await Promise.all(
                hashes.map((hash) =>
                    encrypt.compare({
                        value: password,
                        encryptedValue: hash,
                    }),
                ),
            )

            // All verifications should be true
            verifications.forEach((isValid) => {
                expect(isValid).toBe(true)
            })
        })
    })

    describe("Performance and security", () => {
        it("should use consistent salt rounds", async () => {
            const password = "test-password"
            const encrypt = new Encrypt(password)

            const hash = await encrypt.hashStr()

            // Extract salt rounds from hash
            const saltRounds = parseInt(hash.split("$")[2])
            expect(saltRounds).toBe(10)
        })

        it("should generate secure hashes", async () => {
            const password = "test-password"
            const encrypt = new Encrypt(password)

            const hash = await encrypt.hashStr()

            // Hash should be at least 60 characters (bcrypt standard)
            expect(hash.length).toBeGreaterThanOrEqual(60)

            // Hash should start with $2a$, $2b$, or $2y$
            expect(hash).toMatch(/^\$2[aby]\$/)
        })

        it("should be resistant to timing attacks", async () => {
            const correctPassword = "correct-password"
            const wrongPassword = "wrong-password"
            const encrypt = new Encrypt(correctPassword)

            const hash = await encrypt.hashStr()

            // Both comparisons should take similar time
            const startCorrect = Date.now()
            await encrypt.compare({
                value: correctPassword,
                encryptedValue: hash,
            })
            const timeCorrect = Date.now() - startCorrect

            const startWrong = Date.now()
            await encrypt.compare({
                value: wrongPassword,
                encryptedValue: hash,
            })
            const timeWrong = Date.now() - startWrong

            // Times should be similar (within 100ms tolerance)
            expect(Math.abs(timeCorrect - timeWrong)).toBeLessThan(100)
        })
    })
})
