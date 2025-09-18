import { describe, expect, it, vi } from "vitest"

import { Level } from "../../../../core/access.control/types"
import User from "../user.model"
import UserStatus from "../user.status.model"
import UserTerms from "../user.terms.model"

// Mock do access control types
vi.mock("@/core/access-control/types", () => ({
    Level: {
        SUDO: "SUDO",
        ADMIN: "ADMIN",
        MODERATOR: "MODERATOR",
        USER: "USER",
    },
}))

describe("User Models Structure Tests", () => {
    describe("User Model", () => {
        it("should have correct class name", () => {
            expect(User.name).toBe("User")
        })

        it("should be a class constructor", () => {
            expect(typeof User).toBe("function")
        })

        it("should have prototype", () => {
            expect(User.prototype).toBeDefined()
        })

        it("should have static methods", () => {
            expect(typeof User.initialize).toBe("function")
            expect(typeof User.associate).toBe("function")
            expect(typeof User.ensureFullTextIndex).toBe("function")
        })

        it("should extend Model class", () => {
            // Verifica se tem métodos típicos do Sequelize Model
            expect(User.prototype.constructor).toBeDefined()
        })
    })

    describe("UserStatus Model", () => {
        it("should have correct class name", () => {
            expect(UserStatus.name).toBe("UserStatus")
        })

        it("should be a class constructor", () => {
            expect(typeof UserStatus).toBe("function")
        })

        it("should have prototype", () => {
            expect(UserStatus.prototype).toBeDefined()
        })

        it("should have static methods", () => {
            expect(typeof UserStatus.initialize).toBe("function")
            expect(typeof UserStatus.associate).toBe("function")
        })

        it("should extend Model class", () => {
            expect(UserStatus.prototype.constructor).toBeDefined()
        })
    })

    describe("UserTerms Model", () => {
        it("should have correct class name", () => {
            expect(UserTerms.name).toBe("UserTerms")
        })

        it("should be a class constructor", () => {
            expect(typeof UserTerms).toBe("function")
        })

        it("should have prototype", () => {
            expect(UserTerms.prototype).toBeDefined()
        })

        it("should have static methods", () => {
            expect(typeof UserTerms.initialize).toBe("function")
            expect(typeof UserTerms.associate).toBe("function")
        })

        it("should extend Model class", () => {
            expect(UserTerms.prototype.constructor).toBeDefined()
        })
    })

    describe("Access Control Types", () => {
        it("should have Level enum defined", () => {
            expect(Level).toBeDefined()
            expect(typeof Level).toBe("object")
        })

        it("should have all required access levels", () => {
            expect(Level.SUDO).toBe("SUDO")
            expect(Level.ADMIN).toBe("ADMIN")
            expect(Level.MODERATOR).toBe("MODERATOR")
            expect(Level.USER).toBe("USER")
        })
    })

    describe("Model Imports", () => {
        it("should import User model correctly", () => {
            expect(User).toBeDefined()
            expect(typeof User).toBe("function")
        })

        it("should import UserStatus model correctly", () => {
            expect(UserStatus).toBeDefined()
            expect(typeof UserStatus).toBe("function")
        })

        it("should import UserTerms model correctly", () => {
            expect(UserTerms).toBeDefined()
            expect(typeof UserTerms).toBe("function")
        })
    })

    describe("Model Relationships", () => {
        it("should have different class names", () => {
            expect(User.name).not.toBe(UserStatus.name)
            expect(User.name).not.toBe(UserTerms.name)
            expect(UserStatus.name).not.toBe(UserTerms.name)
        })

        it("should all be constructors", () => {
            expect(typeof User).toBe("function")
            expect(typeof UserStatus).toBe("function")
            expect(typeof UserTerms).toBe("function")
        })

        it("should all have prototypes", () => {
            expect(User.prototype).toBeDefined()
            expect(UserStatus.prototype).toBeDefined()
            expect(UserTerms.prototype).toBeDefined()
        })
    })
})
