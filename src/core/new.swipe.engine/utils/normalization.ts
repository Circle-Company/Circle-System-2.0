/**
 * Normalization Utilities
 * Funções utilitárias para normalização de vetores
 */

/**
 * Normalização L2 (Euclidiana)
 * Normaliza vetor para magnitude 1
 */
export function normalizeL2(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))

    if (magnitude === 0) {
        return vector.map(() => 0)
    }

    return vector.map((val) => val / magnitude)
}

/**
 * Normalização Min-Max
 * Normaliza valores para range [0, 1]
 */
export function normalizeMinMax(vector: number[]): number[] {
    const min = Math.min(...vector)
    const max = Math.max(...vector)

    if (max === min) {
        return vector.map(() => 0.5)
    }

    return vector.map((val) => (val - min) / (max - min))
}

/**
 * Normalização Z-score (Padronização)
 * Normaliza para média 0 e desvio padrão 1
 */
export function normalizeZScore(vector: number[]): number[] {
    const mean = vector.reduce((sum, val) => sum + val, 0) / vector.length
    const variance = vector.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vector.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) {
        return vector.map(() => 0)
    }

    return vector.map((val) => (val - mean) / stdDev)
}

/**
 * Combina múltiplos vetores com pesos
 */
export function combineVectors(vectors: number[][], weights: number[]): number[] {
    if (vectors.length === 0) {
        return []
    }

    if (vectors.length !== weights.length) {
        throw new Error("Número de vetores e pesos deve ser igual")
    }

    // Normalizar pesos
    const weightSum = weights.reduce((sum, w) => sum + w, 0)
    const normalizedWeights = weights.map((w) => w / weightSum)

    // Obter dimensão do resultado
    const dimension = Math.max(...vectors.map((v) => v.length))

    // Combinar vetores
    const combined = new Array(dimension).fill(0)

    for (let i = 0; i < vectors.length; i++) {
        const vector = vectors[i]
        const weight = normalizedWeights[i]

        for (let j = 0; j < vector.length; j++) {
            combined[j] += vector[j] * weight
        }
    }

    return combined
}

/**
 * Calcula similaridade cosseno entre dois vetores
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Vetores devem ter a mesma dimensão")
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0
    }

    return dotProduct / (magnitudeA * magnitudeB)
}

