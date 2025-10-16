/**
 * Testes das funções de normalização (New Swipe Engine)
 */

import { describe, expect, it } from "vitest"
import {
    cosineSimilarity,
    combineVectors,
    normalizeL2,
    normalizeMinMax,
    normalizeZScore,
} from "../utils/normalization"

describe("Normalization Utils (New Swipe Engine)", () => {
    describe("normalizeL2", () => {
        it("deve normalizar para magnitude 1", () => {
            const vector = [3, 4, 0]
            const normalized = normalizeL2(vector)

            const magnitude = Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0))

            expect(magnitude).toBeCloseTo(1, 5)
        })

        it("deve lidar com vetor zero", () => {
            const vector = [0, 0, 0]
            const normalized = normalizeL2(vector)

            expect(normalized).toEqual([0, 0, 0])
        })
    })

    describe("combineVectors", () => {
        it("deve combinar com pesos", () => {
            const v1 = [1, 0, 0]
            const v2 = [0, 1, 0]
            const weights = [0.6, 0.4]

            const combined = combineVectors([v1, v2], weights)

            expect(combined[0]).toBeCloseTo(0.6, 5)
            expect(combined[1]).toBeCloseTo(0.4, 5)
        })

        it("deve normalizar pesos automaticamente", () => {
            const v1 = [1, 0]
            const v2 = [0, 1]
            const weights = [2, 3] // Soma = 5

            const combined = combineVectors([v1, v2], weights)

            expect(combined[0]).toBeCloseTo(0.4, 5)
            expect(combined[1]).toBeCloseTo(0.6, 5)
        })
    })

    describe("cosineSimilarity", () => {
        it("deve retornar 1 para vetores idênticos", () => {
            const v1 = [1, 2, 3]
            const v2 = [1, 2, 3]

            expect(cosineSimilarity(v1, v2)).toBeCloseTo(1, 5)
        })

        it("deve retornar 0 para vetores ortogonais", () => {
            const v1 = [1, 0, 0]
            const v2 = [0, 1, 0]

            expect(cosineSimilarity(v1, v2)).toBeCloseTo(0, 5)
        })

        it("deve retornar -1 para vetores opostos", () => {
            const v1 = [1, 2, 3]
            const v2 = [-1, -2, -3]

            expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1, 5)
        })
    })
})

