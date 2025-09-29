import { beforeEach, describe, expect, it } from "vitest"
import { SearchContext, SearchQuery } from "../types"

import { LocationSearcher } from "../engines/location.searcher"

describe("LocationSearcher", () => {
    let locationSearcher: LocationSearcher
    let mockQuery: SearchQuery
    let mockContext: SearchContext

    beforeEach(() => {
        locationSearcher = new LocationSearcher()
        mockContext = {
            userId: "user123",
            userLocation: { latitude: -23.5505, longitude: -46.6333 },
        }
    })

    describe("search", () => {
        it("deve retornar array vazio quando não há filtros de localização", async () => {
            mockQuery = {
                term: "texto qualquer",
                filters: {},
            }

            const result = await locationSearcher.search(mockQuery, mockContext)
            expect(result).toEqual([])
        })

        it("deve buscar por localização válida", async () => {
            mockQuery = {
                term: "texto qualquer",
                filters: {
                    location: {
                        latitude: -23.5505,
                        longitude: -46.6333,
                        radius: 10,
                    },
                },
            }

            const result = await locationSearcher.search(mockQuery, mockContext)
            expect(result).toHaveLength(2)
            expect(result[0].distance).toBeDefined()
            expect(result[0].relevance.breakdown.proximity).toBeGreaterThan(0)
        })

        it("deve filtrar por raio", async () => {
            mockQuery = {
                term: "texto qualquer",
                filters: {
                    location: {
                        latitude: -23.5505,
                        longitude: -46.6333,
                        radius: 0.1, // Raio muito pequeno
                    },
                },
            }

            const result = await locationSearcher.search(mockQuery, mockContext)
            expect(result).toHaveLength(0) // Nenhum resultado dentro do raio
        })

        it("deve calcular distâncias corretamente", async () => {
            mockQuery = {
                term: "texto qualquer",
                filters: {
                    location: {
                        latitude: -23.5505,
                        longitude: -46.6333,
                        radius: 10,
                    },
                },
            }

            const result = await locationSearcher.search(mockQuery, mockContext)
            expect(result[0].distance).toBeGreaterThan(0)
            expect(result[0].distance).toBeLessThanOrEqual(10)
        })

        it("deve recalcular score geral", async () => {
            mockQuery = {
                term: "texto qualquer",
                filters: {
                    location: {
                        latitude: -23.5505,
                        longitude: -46.6333,
                        radius: 10,
                    },
                },
            }

            const result = await locationSearcher.search(mockQuery, mockContext)
            expect(result[0].relevance.score).toBeGreaterThan(0)
        })

        it("deve lançar erro para parâmetros de localização inválidos", async () => {
            mockQuery = {
                term: "texto qualquer",
                filters: {
                    location: {
                        latitude: 91, // Latitude inválida
                        longitude: -46.6333,
                        radius: 10,
                    },
                },
            }

            await expect(locationSearcher.search(mockQuery, mockContext)).rejects.toThrow(
                "Parâmetros de localização inválidos",
            )
        })
    })

    describe("isValidLocation", () => {
        it("deve validar localização correta", () => {
            const isValid = locationSearcher["isValidLocation"]({
                latitude: -23.5505,
                longitude: -46.6333,
                radius: 10,
            })
            expect(isValid).toBe(true)
        })

        it("deve rejeitar latitude inválida", () => {
            const isValid = locationSearcher["isValidLocation"]({
                latitude: 91,
                longitude: -46.6333,
                radius: 10,
            })
            expect(isValid).toBe(false)
        })

        it("deve rejeitar longitude inválida", () => {
            const isValid = locationSearcher["isValidLocation"]({
                latitude: -23.5505,
                longitude: 181,
                radius: 10,
            })
            expect(isValid).toBe(false)
        })

        it("deve rejeitar raio inválido", () => {
            const isValid = locationSearcher["isValidLocation"]({
                latitude: -23.5505,
                longitude: -46.6333,
                radius: 0,
            })
            expect(isValid).toBe(false)
        })

        it("deve rejeitar raio muito grande", () => {
            const isValid = locationSearcher["isValidLocation"]({
                latitude: -23.5505,
                longitude: -46.6333,
                radius: 101, // Maior que o limite
            })
            expect(isValid).toBe(false)
        })
    })

    describe("calculateDistance", () => {
        it("deve calcular distância corretamente", () => {
            // São Paulo para Rio de Janeiro
            const distance = locationSearcher["calculateDistance"](
                -23.5505,
                -46.6333,
                -22.9068,
                -43.1729,
            )
            expect(distance).toBeCloseTo(358, 0) // ~358km
        })

        it("deve retornar 0 para coordenadas iguais", () => {
            const distance = locationSearcher["calculateDistance"](
                -23.5505,
                -46.6333,
                -23.5505,
                -46.6333,
            )
            expect(distance).toBe(0)
        })

        it("deve calcular distância para pontos próximos", () => {
            const distance = locationSearcher["calculateDistance"](
                -23.5505,
                -46.6333,
                -23.5515,
                -46.6343,
            )
            expect(distance).toBeCloseTo(0.1, 1) // ~100m
        })
    })

    describe("toRadians", () => {
        it("deve converter graus para radianos corretamente", () => {
            const radians = locationSearcher["toRadians"](180)
            expect(radians).toBeCloseTo(Math.PI, 5)
        })

        it("deve converter 0 graus para 0 radianos", () => {
            const radians = locationSearcher["toRadians"](0)
            expect(radians).toBe(0)
        })

        it("deve converter 90 graus para π/2 radianos", () => {
            const radians = locationSearcher["toRadians"](90)
            expect(radians).toBeCloseTo(Math.PI / 2, 5)
        })
    })

    describe("calculateProximityRelevance", () => {
        const mockResult = {
            id: "moment1",
            title: "Momento",
            description: "Descrição",
            hashtags: ["local"],
            ownerId: "user1",
            ownerUsername: "user1",
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "PUBLISHED",
            visibility: "PUBLIC",
            location: { latitude: -23.5505, longitude: -46.6333, address: "São Paulo" },
            metrics: { views: 1000, likes: 50, comments: 25, shares: 10 },
            media: { type: "video", duration: 120, thumbnail: "thumb1.jpg" },
            relevance: {
                score: 0.8,
                breakdown: {
                    textual: 0.8,
                    engagement: 0.7,
                    recency: 0.9,
                    quality: 0.8,
                    proximity: 0.5,
                },
            },
        }

        it("deve calcular relevância máxima para pontos muito próximos", () => {
            const relevance = locationSearcher["calculateProximityRelevance"](
                mockResult,
                -23.5505,
                -46.6333,
                10,
            )
            expect(relevance).toBe(1.0)
        })

        it("deve calcular relevância alta para pontos próximos", () => {
            const relevance = locationSearcher["calculateProximityRelevance"](
                mockResult,
                -23.5605,
                -46.6433,
                10,
            )
            expect(relevance).toBe(0.8)
        })

        it("deve retornar 0 para momentos sem localização", () => {
            const resultWithoutLocation = { ...mockResult, location: undefined }
            const relevance = locationSearcher["calculateProximityRelevance"](
                resultWithoutLocation,
                -23.5505,
                -46.6333,
                10,
            )
            expect(relevance).toBe(0)
        })

        it("deve retornar 0 para pontos fora do raio", () => {
            const relevance = locationSearcher["calculateProximityRelevance"](
                mockResult,
                -24.5505,
                -47.6333,
                1, // Muito longe
            )
            expect(relevance).toBe(0)
        })
    })

    describe("calculateOverallScore", () => {
        it("deve calcular score geral corretamente", () => {
            const breakdown = {
                textual: 0.8,
                engagement: 0.7,
                recency: 0.9,
                quality: 0.8,
                proximity: 0.5,
            }

            const score = locationSearcher["calculateOverallScore"](breakdown)
            expect(score).toBeCloseTo(0.755, 3)
        })

        it("deve lidar com breakdown incompleto", () => {
            const breakdown = {
                textual: 0.8,
                proximity: 0.5,
            }

            const score = locationSearcher["calculateOverallScore"](breakdown)
            expect(score).toBeCloseTo(0.345, 3) // (0.8*0.4) + (0.5*0.05)
        })
    })

    describe("getMockLocationResults", () => {
        it("deve retornar resultados mockados", () => {
            const results = locationSearcher["getMockLocationResults"](-23.5505, -46.6333, 10)
            expect(results).toHaveLength(2)
            expect(results[0].location).toBeDefined()
        })

        it("deve ter resultados com localização próxima", () => {
            const results = locationSearcher["getMockLocationResults"](-23.5505, -46.6333, 10)
            expect(results[0].location?.latitude).toBeCloseTo(-23.5505, 2)
            expect(results[0].location?.longitude).toBeCloseTo(-46.6333, 2)
        })
    })
})
