import { describe, expect, it } from "vitest"
import {
    calculateDistance,
    calculatePolygonArea,
    findNearestCoordinate,
    isValidCoordinate,
    type Coordinate,
} from "../coordinate.distance"

describe("coordinate.distance", () => {
    describe("calculateDistance", () => {
        it("deve calcular a distância entre duas coordenadas em km", () => {
            const from: Coordinate = { latitude: -23.5505, longitude: -46.6333 } // São Paulo
            const to: Coordinate = { latitude: -22.9068, longitude: -43.1729 } // Rio de Janeiro

            const distance = calculateDistance(from, to)

            // Distância aproximada entre São Paulo e Rio de Janeiro
            expect(distance).toBeCloseTo(360.75, 1)
        })

        it("deve calcular a distância em milhas", () => {
            const from: Coordinate = { latitude: -23.5505, longitude: -46.6333 }
            const to: Coordinate = { latitude: -22.9068, longitude: -43.1729 }

            const distance = calculateDistance(from, to, { unit: "miles" })

            expect(distance).toBeCloseTo(224.16, 1)
        })

        it("deve calcular a distância em metros", () => {
            const from: Coordinate = { latitude: -23.5505, longitude: -46.6333 }
            const to: Coordinate = { latitude: -22.9068, longitude: -43.1729 }

            const distance = calculateDistance(from, to, { unit: "meters" })

            expect(distance).toBeCloseTo(360748.82, 1)
        })

        it("deve calcular distância entre pontos próximos", () => {
            const from: Coordinate = { latitude: -23.5505, longitude: -46.6333 }
            const to: Coordinate = { latitude: -23.5515, longitude: -46.6343 }

            const distance = calculateDistance(from, to, { unit: "meters" })

            expect(distance).toBeCloseTo(150.85, 1)
        })

        it("deve calcular distância entre pontos no mesmo local", () => {
            const coordinate: Coordinate = { latitude: -23.5505, longitude: -46.6333 }

            const distance = calculateDistance(coordinate, coordinate)

            expect(distance).toBe(0)
        })

        it("deve calcular distância entre pontos antípodas", () => {
            const from: Coordinate = { latitude: 0, longitude: 0 }
            const to: Coordinate = { latitude: 0, longitude: 180 }

            const distance = calculateDistance(from, to)

            // Metade da circunferência da Terra
            expect(distance).toBeCloseTo(20015, 0)
        })

        it("deve usar raio da Terra customizado", () => {
            const from: Coordinate = { latitude: 0, longitude: 0 }
            const to: Coordinate = { latitude: 0, longitude: 1 }

            const distanceStandard = calculateDistance(from, to)
            const distanceCustom = calculateDistance(from, to, { earthRadius: 1000 })

            expect(distanceCustom).toBeCloseTo(distanceStandard / 6.371, 2)
        })

        it("deve lançar erro para coordenadas inválidas", () => {
            const valid: Coordinate = { latitude: -23.5505, longitude: -46.6333 }
            const invalidLat: Coordinate = { latitude: 91, longitude: -46.6333 }
            const invalidLon: Coordinate = { latitude: -23.5505, longitude: 181 }
            const invalidType: any = { latitude: "invalid", longitude: -46.6333 }
            const invalidNaN: Coordinate = { latitude: NaN, longitude: -46.6333 }

            expect(() => calculateDistance(valid, invalidLat)).toThrow("Coordenadas inválidas")
            expect(() => calculateDistance(valid, invalidLon)).toThrow("Coordenadas inválidas")
            expect(() => calculateDistance(valid, invalidType)).toThrow("Coordenadas inválidas")
            expect(() => calculateDistance(valid, invalidNaN)).toThrow("Coordenadas inválidas")
        })
    })

    describe("isValidCoordinate", () => {
        it("deve validar coordenadas corretas", () => {
            const validCoords: Coordinate[] = [
                { latitude: 0, longitude: 0 },
                { latitude: 90, longitude: 180 },
                { latitude: -90, longitude: -180 },
                { latitude: 45.5, longitude: -123.7 },
            ]

            validCoords.forEach((coord) => {
                expect(isValidCoordinate(coord)).toBe(true)
            })
        })

        it("deve rejeitar coordenadas inválidas", () => {
            const invalidCoords: any[] = [
                { latitude: 91, longitude: 0 },
                { latitude: -91, longitude: 0 },
                { latitude: 0, longitude: 181 },
                { latitude: 0, longitude: -181 },
                { latitude: "invalid", longitude: 0 },
                { latitude: 0, longitude: "invalid" },
                { latitude: NaN, longitude: 0 },
                { latitude: 0, longitude: NaN },
                { latitude: Infinity, longitude: 0 },
                { latitude: 0, longitude: Infinity },
                null,
                undefined,
                {},
            ]

            invalidCoords.forEach((coord) => {
                expect(isValidCoordinate(coord)).toBe(false)
            })
        })
    })

    describe("findNearestCoordinate", () => {
        it("deve encontrar a coordenada mais próxima", () => {
            const origin: Coordinate = { latitude: -23.5505, longitude: -46.6333 }
            const coordinates: Coordinate[] = [
                { latitude: -22.9068, longitude: -43.1729 }, // Rio de Janeiro (mais longe)
                { latitude: -23.5475, longitude: -46.6361 }, // São Paulo (mais próximo)
                { latitude: -25.4244, longitude: -49.2654 }, // Curitiba
            ]

            const result = findNearestCoordinate(origin, coordinates)

            expect(result).not.toBeNull()
            expect(result!.coordinate).toEqual(coordinates[1])
            expect(result!.index).toBe(1)
            expect(result!.distance).toBeCloseTo(0.44, 1)
        })

        it("deve retornar null para array vazio", () => {
            const origin: Coordinate = { latitude: -23.5505, longitude: -46.6333 }
            const coordinates: Coordinate[] = []

            const result = findNearestCoordinate(origin, coordinates)

            expect(result).toBeNull()
        })

        it("deve funcionar com uma única coordenada", () => {
            const origin: Coordinate = { latitude: -23.5505, longitude: -46.6333 }
            const coordinates: Coordinate[] = [{ latitude: -22.9068, longitude: -43.1729 }]

            const result = findNearestCoordinate(origin, coordinates)

            expect(result).not.toBeNull()
            expect(result!.coordinate).toEqual(coordinates[0])
            expect(result!.index).toBe(0)
        })

        it("deve usar opções de cálculo customizadas", () => {
            const origin: Coordinate = { latitude: -23.5505, longitude: -46.6333 }
            const coordinates: Coordinate[] = [{ latitude: -23.5475, longitude: -46.6361 }]

            const resultKm = findNearestCoordinate(origin, coordinates, { unit: "km" })
            const resultMiles = findNearestCoordinate(origin, coordinates, { unit: "miles" })

            expect(resultKm!.distance).toBeCloseTo(resultMiles!.distance * 1.609, 1)
        })
    })

    describe("calculatePolygonArea", () => {
        it("deve calcular a área de um triângulo", () => {
            const triangle: Coordinate[] = [
                { latitude: 0, longitude: 0 },
                { latitude: 1, longitude: 0 },
                { latitude: 0, longitude: 1 },
            ]

            const area = calculatePolygonArea(triangle)

            expect(area).toBeGreaterThan(0)
            expect(typeof area).toBe("number")
        })

        it("deve calcular a área de um quadrado", () => {
            const square: Coordinate[] = [
                { latitude: 0, longitude: 0 },
                { latitude: 1, longitude: 0 },
                { latitude: 1, longitude: 1 },
                { latitude: 0, longitude: 1 },
            ]

            const area = calculatePolygonArea(square)

            expect(area).toBeGreaterThan(0)
            expect(typeof area).toBe("number")
        })

        it("deve fechar automaticamente o polígono se necessário", () => {
            const openPolygon: Coordinate[] = [
                { latitude: 0, longitude: 0 },
                { latitude: 1, longitude: 0 },
                { latitude: 1, longitude: 1 },
                { latitude: 0, longitude: 1 },
                // Não fechado explicitamente
            ]

            const closedPolygon: Coordinate[] = [
                { latitude: 0, longitude: 0 },
                { latitude: 1, longitude: 0 },
                { latitude: 1, longitude: 1 },
                { latitude: 0, longitude: 1 },
                { latitude: 0, longitude: 0 }, // Fechado explicitamente
            ]

            const areaOpen = calculatePolygonArea(openPolygon)
            const areaClosed = calculatePolygonArea(closedPolygon)

            expect(areaOpen).toBeCloseTo(areaClosed, 2)
        })

        it("deve lançar erro para polígono com menos de 3 pontos", () => {
            const invalidPolygons: Coordinate[][] = [
                [],
                [{ latitude: 0, longitude: 0 }],
                [
                    { latitude: 0, longitude: 0 },
                    { latitude: 1, longitude: 0 },
                ],
            ]

            invalidPolygons.forEach((polygon) => {
                expect(() => calculatePolygonArea(polygon)).toThrow(
                    "Um polígono deve ter pelo menos 3 coordenadas",
                )
            })
        })

        it("deve usar opções de cálculo customizadas", () => {
            const triangle: Coordinate[] = [
                { latitude: 0, longitude: 0 },
                { latitude: 1, longitude: 0 },
                { latitude: 0, longitude: 1 },
            ]

            const areaKm = calculatePolygonArea(triangle, { unit: "km" })
            const areaMiles = calculatePolygonArea(triangle, { unit: "miles" })

            expect(areaKm).toBeGreaterThan(0)
            expect(areaMiles).toBeGreaterThan(0)
            expect(areaMiles).toBeLessThan(areaKm)
        })
    })

    describe("Casos de uso reais", () => {
        it("deve calcular distâncias entre cidades brasileiras", () => {
            const saoPaulo: Coordinate = { latitude: -23.5505, longitude: -46.6333 }
            const rioDeJaneiro: Coordinate = { latitude: -22.9068, longitude: -43.1729 }
            const brasilia: Coordinate = { latitude: -15.7801, longitude: -47.9292 }
            const salvador: Coordinate = { latitude: -12.9714, longitude: -38.5014 }

            const spToRio = calculateDistance(saoPaulo, rioDeJaneiro)
            const spToBrasilia = calculateDistance(saoPaulo, brasilia)
            const spToSalvador = calculateDistance(saoPaulo, salvador)

            expect(spToRio).toBeCloseTo(360.75, 1)
            expect(spToBrasilia).toBeCloseTo(874.6, 1)
            expect(spToSalvador).toBeCloseTo(1455.41, 1)
        })

        it("deve encontrar a cidade mais próxima", () => {
            const origem: Coordinate = { latitude: -23.5505, longitude: -46.6333 } // São Paulo
            const cidades: Coordinate[] = [
                { latitude: -22.9068, longitude: -43.1729 }, // Rio de Janeiro
                { latitude: -15.7801, longitude: -47.9292 }, // Brasília
                { latitude: -12.9714, longitude: -38.5014 }, // Salvador
                { latitude: -25.4244, longitude: -49.2654 }, // Curitiba
            ]

            const resultado = findNearestCoordinate(origem, cidades)

            expect(resultado).not.toBeNull()
            expect(resultado!.coordinate).toEqual(cidades[3]) // Curitiba (mais próxima)
            expect(resultado!.distance).toBeCloseTo(338.15, 1)
        })

        it("deve calcular área de uma região específica", () => {
            // Área muito pequena próxima ao centro de São Paulo
            const areaPequena: Coordinate[] = [
                { latitude: -23.5505, longitude: -46.6333 },
                { latitude: -23.5506, longitude: -46.6333 },
                { latitude: -23.5506, longitude: -46.6332 },
                { latitude: -23.5505, longitude: -46.6332 },
            ]

            const area = calculatePolygonArea(areaPequena, { unit: "meters" })

            expect(area).toBeGreaterThan(0)
            expect(area).toBeLessThan(10000) // Área pequena em metros quadrados
        })
    })
})
