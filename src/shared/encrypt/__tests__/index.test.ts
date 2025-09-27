import { describe, expect, it } from "vitest"

import { Encrypt } from "../index"

describe("Encrypt Index", () => {
    it("should export Encrypt class", () => {
        expect(Encrypt).toBeDefined()
        expect(typeof Encrypt).toBe("function")
    })

    it("should create Encrypt instance from exported class", () => {
        const encrypt = new Encrypt("test-password")
        expect(encrypt).toBeInstanceOf(Encrypt)
    })

    it("should be able to use all exported functionality", async () => {
        const password = "test-password"
        const encrypt = new Encrypt(password)

        // Test that we can call the methods
        expect(typeof encrypt.hashStr).toBe("function")
        expect(typeof encrypt.compare).toBe("function")

        // Test that methods return promises
        const hashPromise = encrypt.hashStr()
        expect(hashPromise).toBeInstanceOf(Promise)

        const comparePromise = encrypt.compare({
            value: "test",
            encryptedValue: "hash",
        })
        expect(comparePromise).toBeInstanceOf(Promise)
    })

    it("should have correct method signatures", () => {
        const encrypt = new Encrypt("test")

        // Test hashStr method signature
        expect(encrypt.hashStr).toBeDefined()
        expect(typeof encrypt.hashStr).toBe("function")

        // Test compare method signature
        expect(encrypt.compare).toBeDefined()
        expect(typeof encrypt.compare).toBe("function")
    })

    it("should accept string parameter in constructor", () => {
        const password = "test-password-123"
        const encrypt = new Encrypt(password)

        expect(encrypt).toBeInstanceOf(Encrypt)
    })
})
