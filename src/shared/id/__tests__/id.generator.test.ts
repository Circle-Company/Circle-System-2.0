import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { IDGenerator, createIDGenerator, generateId } from "../index"

describe("IDGenerator - Classe Principal", () => {
    beforeEach(() => {
        IDGenerator.reset()
    })

    afterEach(() => {
        IDGenerator.reset()
    })

    describe("Uso Básico", () => {
        it("should generate unique IDs", () => {
            const generator = IDGenerator.getInstance()
            const ids = new Set<string>()

            // Gerar 100 IDs únicos
            for (let i = 0; i < 100; i++) {
                const id = generator.generate()
                ids.add(id)
            }

            expect(ids.size).toBe(100)
        })

        it("should generate string IDs", () => {
            const generator = IDGenerator.getInstance()
            const id = generator.generate()

            expect(typeof id).toBe("string")
            expect(id.length).toBeGreaterThan(0)
        })

        it("should return same instance (singleton)", () => {
            const instance1 = IDGenerator.getInstance()
            const instance2 = IDGenerator.getInstance()

            expect(instance1).toBe(instance2)
        })
    })

    describe("Função Utilitária", () => {
        it("should generate ID using generateId function", () => {
            const id = generateId()

            expect(typeof id).toBe("string")
            expect(id.length).toBeGreaterThan(0)
        })

        it("should generate unique IDs with generateId function", () => {
            const ids = new Set<string>()

            for (let i = 0; i < 50; i++) {
                ids.add(generateId())
            }

            expect(ids.size).toBe(50)
        })
    })

    describe("Criação de Instâncias", () => {
        it("should create instances with createIDGenerator", () => {
            const generator1 = createIDGenerator(1)
            const generator2 = createIDGenerator(2)

            const id1 = generator1.generate()
            const id2 = generator2.generate()

            expect(typeof id1).toBe("string")
            expect(typeof id2).toBe("string")
            expect(id1.length).toBeGreaterThan(0)
            expect(id2.length).toBeGreaterThan(0)
        })
    })

    describe("Reset e Limpeza", () => {
        it("should reset singleton instance", () => {
            const instance1 = IDGenerator.getInstance()
            IDGenerator.reset()
            const instance2 = IDGenerator.getInstance()

            expect(instance1).not.toBe(instance2)
        })

        it("should work after reset", () => {
            const generator1 = IDGenerator.getInstance()
            const id1 = generator1.generate()

            IDGenerator.reset()

            const generator2 = IDGenerator.getInstance()
            const id2 = generator2.generate()

            expect(typeof id1).toBe("string")
            expect(typeof id2).toBe("string")
            expect(id1.length).toBeGreaterThan(0)
            expect(id2.length).toBeGreaterThan(0)
        })
    })

    describe("Performance Básica", () => {
        it("should generate IDs quickly", () => {
            const generator = IDGenerator.getInstance()
            const start = performance.now()

            for (let i = 0; i < 1000; i++) {
                generator.generate()
            }

            const end = performance.now()
            const duration = end - start

            expect(duration).toBeLessThan(100) // Deve completar em menos de 100ms
        })
    })
})
