/**
 * Interface para representar uma coordenada geográfica
 */
export interface Coordinate {
    latitude: number
    longitude: number
}

/**
 * Interface para opções de cálculo de distância
 */
export interface DistanceOptions {
    unit?: "km" | "miles" | "meters"
    earthRadius?: number // Raio da Terra em km (padrão: 6371)
}

/**
 * Calcula a distância entre duas coordenadas geográficas usando a fórmula de Haversine
 *
 * @param from - Coordenada de origem
 * @param to - Coordenada de destino
 * @param options - Opções de cálculo (unidade, raio da Terra)
 * @returns Distância entre as coordenadas na unidade especificada
 */
export function calculateDistance(
    from: Coordinate,
    to: Coordinate,
    options: DistanceOptions = {},
): number {
    const {
        unit = "km",
        earthRadius = 6371, // Raio médio da Terra em km
    } = options

    // Validação dos parâmetros
    if (!isValidCoordinate(from) || !isValidCoordinate(to)) {
        throw new Error(
            "Coordenadas inválidas. Latitude deve estar entre -90 e 90, longitude entre -180 e 180.",
        )
    }

    // Converter graus para radianos
    const lat1Rad = toRadians(from.latitude)
    const lon1Rad = toRadians(from.longitude)
    const lat2Rad = toRadians(to.latitude)
    const lon2Rad = toRadians(to.longitude)

    // Diferenças
    const deltaLat = lat2Rad - lat1Rad
    const deltaLon = lon2Rad - lon1Rad

    // Fórmula de Haversine
    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    let distance = earthRadius * c

    // Converter para a unidade desejada
    switch (unit) {
        case "miles":
            distance *= 0.621371 // km para milhas
            break
        case "meters":
            distance *= 1000 // km para metros
            break
        case "km":
        default:
            // Já está em km
            break
    }

    return Math.round(distance * 100) / 100 // Arredondar para 2 casas decimais
}

/**
 * Verifica se uma coordenada é válida
 *
 * @param coordinate - Coordenada para validar
 * @returns true se a coordenada é válida, false caso contrário
 */
export function isValidCoordinate(coordinate: Coordinate): boolean {
    return (
        coordinate !== null &&
        coordinate !== undefined &&
        typeof coordinate.latitude === "number" &&
        typeof coordinate.longitude === "number" &&
        !isNaN(coordinate.latitude) &&
        !isNaN(coordinate.longitude) &&
        coordinate.latitude >= -90 &&
        coordinate.latitude <= 90 &&
        coordinate.longitude >= -180 &&
        coordinate.longitude <= 180
    )
}

/**
 * Converte graus para radianos
 *
 * @param degrees - Valor em graus
 * @returns Valor em radianos
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
}

/**
 * Encontra a coordenada mais próxima de uma lista de coordenadas
 *
 * @param origin - Coordenada de origem
 * @param coordinates - Lista de coordenadas para comparar
 * @param options - Opções de cálculo
 * @returns Coordenada mais próxima e sua distância
 */
export function findNearestCoordinate(
    origin: Coordinate,
    coordinates: Coordinate[],
    options: DistanceOptions = {},
): { coordinate: Coordinate; distance: number; index: number } | null {
    if (!coordinates.length) {
        return null
    }

    let nearest = coordinates[0]
    let nearestDistance = calculateDistance(origin, nearest, options)
    let nearestIndex = 0

    for (let i = 1; i < coordinates.length; i++) {
        const distance = calculateDistance(origin, coordinates[i], options)
        if (distance < nearestDistance) {
            nearest = coordinates[i]
            nearestDistance = distance
            nearestIndex = i
        }
    }

    return {
        coordinate: nearest,
        distance: nearestDistance,
        index: nearestIndex,
    }
}

/**
 * Calcula a área de um polígono definido por coordenadas (usando fórmula de Shoelace)
 *
 * @param coordinates - Array de coordenadas que formam o polígono
 * @param options - Opções de cálculo
 * @returns Área do polígono na unidade especificada ao quadrado
 */
export function calculatePolygonArea(
    coordinates: Coordinate[],
    options: DistanceOptions = {},
): number {
    if (coordinates.length < 3) {
        throw new Error("Um polígono deve ter pelo menos 3 coordenadas")
    }

    // Fechar o polígono se necessário
    const closedCoords = [...coordinates]
    if (closedCoords[0] !== closedCoords[closedCoords.length - 1]) {
        closedCoords.push(closedCoords[0])
    }

    let area = 0
    for (let i = 0; i < closedCoords.length - 1; i++) {
        const current = closedCoords[i]
        const next = closedCoords[i + 1]
        area += current.longitude * next.latitude - next.longitude * current.latitude
    }

    // Converter para a unidade desejada e retornar valor absoluto
    const earthRadius = options.earthRadius || 6371
    const unitMultiplier = options.unit === "miles" ? 0.621371 : 1
    const finalArea = (Math.abs(area) / 2) * (earthRadius * unitMultiplier) ** 2

    return Math.round(finalArea * 100) / 100
}
