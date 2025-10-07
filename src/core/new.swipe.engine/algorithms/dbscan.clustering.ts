import { Cluster, ClusteringResult } from "../types"

import { DBSCANConfig } from "../params.type"

enum PointLabel {
    UNDEFINED = -2,
    NOISE = -1,
}

/**
 * Implementação do algoritmo DBSCAN para clusterização de embeddings
 */
export class DBSCANClustering {
    constructor(private readonly config: DBSCANConfig) {}

    /**
     * Executa o algoritmo DBSCAN
     */
    async cluster(embeddings: Array<{ id: string; vector: number[] }>): Promise<ClusteringResult> {
        if (embeddings.length === 0) {
            return {
                clusters: [],
                assignments: {},
                quality: 0,
                iterations: 0,
                converged: true,
            }
        }

        const startTime = Date.now()

        // Calcular matriz de distâncias
        const distances = this.computeDistanceMatrix(embeddings.map((e) => e.vector))

        // Executar DBSCAN
        const labels = this.runDBSCAN(distances)

        // Preparar resultado
        const result = this.prepareResult(embeddings, labels)

        result.metadata = {
            executionTimeMs: Date.now() - startTime,
            totalPoints: embeddings.length,
            noisePoints: labels.filter((l) => l === PointLabel.NOISE).length,
        }

        return result
    }

    /**
     * Executa o algoritmo DBSCAN principal
     */
    private runDBSCAN(distances: number[][]): number[] {
        const n = distances.length
        const labels = new Array(n).fill(PointLabel.UNDEFINED)
        let clusterId = 0

        for (let pointIdx = 0; pointIdx < n; pointIdx++) {
            if (labels[pointIdx] !== PointLabel.UNDEFINED) {
                continue
            }

            const neighbors = this.findNeighbors(pointIdx, distances)

            if (neighbors.length < this.config.minPoints) {
                labels[pointIdx] = PointLabel.NOISE
                continue
            }

            // Criar novo cluster
            clusterId++
            labels[pointIdx] = clusterId

            // Expandir cluster
            const queue = [...neighbors]
            queue.splice(queue.indexOf(pointIdx), 1)

            while (queue.length > 0) {
                const currentPoint = queue.shift()!

                if (labels[currentPoint] === PointLabel.NOISE) {
                    labels[currentPoint] = clusterId
                } else if (labels[currentPoint] !== PointLabel.UNDEFINED) {
                    continue
                }

                labels[currentPoint] = clusterId

                const pointNeighbors = this.findNeighbors(currentPoint, distances)

                if (pointNeighbors.length >= this.config.minPoints) {
                    queue.push(
                        ...pointNeighbors.filter(
                            (neighbor) =>
                                labels[neighbor] === PointLabel.UNDEFINED ||
                                labels[neighbor] === PointLabel.NOISE,
                        ),
                    )
                }
            }
        }

        return labels
    }

    /**
     * Calcula matriz de distâncias entre todos os pontos
     */
    private computeDistanceMatrix(vectors: number[][]): number[][] {
        const n = vectors.length
        const distances: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const distance = this.calculateDistance(vectors[i], vectors[j])
                distances[i][j] = distance
                distances[j][i] = distance
            }
        }

        return distances
    }

    /**
     * Encontra vizinhos de um ponto
     */
    private findNeighbors(pointIdx: number, distances: number[][]): number[] {
        return distances[pointIdx]
            .map((distance, idx) => (distance <= this.config.epsilon ? idx : -1))
            .filter((idx) => idx !== -1)
    }

    /**
     * Calcula distância entre dois vetores
     */
    private calculateDistance(a: number[], b: number[]): number {
        if (this.config.distanceFunction === "cosine") {
            return this.cosineDistance(a, b)
        } else if (this.config.distanceFunction === "manhattan") {
            return this.manhattanDistance(a, b)
        }
        return this.euclideanDistance(a, b)
    }

    /**
     * Distância euclidiana
     */
    private euclideanDistance(a: number[], b: number[]): number {
        let sum = 0
        for (let i = 0; i < a.length; i++) {
            sum += (a[i] - b[i]) ** 2
        }
        return Math.sqrt(sum)
    }

    /**
     * Distância de cosseno (1 - similaridade)
     */
    private cosineDistance(a: number[], b: number[]): number {
        let dotProduct = 0
        let magA = 0
        let magB = 0

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i]
            magA += a[i] * a[i]
            magB += b[i] * b[i]
        }

        const magnitude = Math.sqrt(magA) * Math.sqrt(magB)
        const similarity = magnitude > 0 ? dotProduct / magnitude : 0
        return 1 - similarity
    }

    /**
     * Distância de Manhattan
     */
    private manhattanDistance(a: number[], b: number[]): number {
        let sum = 0
        for (let i = 0; i < a.length; i++) {
            sum += Math.abs(a[i] - b[i])
        }
        return sum
    }

    /**
     * Prepara o resultado final
     */
    private prepareResult(
        embeddings: Array<{ id: string; vector: number[] }>,
        labels: number[],
    ): ClusteringResult {
        const clusterMap = new Map<number, { ids: string[]; vectors: number[][] }>()

        // Agrupar por cluster
        labels.forEach((label, idx) => {
            if (label > 0) {
                if (!clusterMap.has(label)) {
                    clusterMap.set(label, { ids: [], vectors: [] })
                }
                const cluster = clusterMap.get(label)!
                cluster.ids.push(embeddings[idx].id)
                cluster.vectors.push(embeddings[idx].vector)
            }
        })

        // Criar clusters
        const clusters: Cluster[] = []
        const assignments: Record<string, string> = {}

        clusterMap.forEach((data, clusterId) => {
            const cluster: Cluster = {
                id: `cluster_${clusterId}`,
                centroid: this.calculateCentroid(data.vectors),
                size: data.ids.length,
                density: this.calculateDensity(data.vectors),
                coherence: this.calculateCoherence(data.vectors),
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            clusters.push(cluster)

            // Registrar atribuições
            data.ids.forEach((id) => {
                assignments[id] = cluster.id
            })
        })

        return {
            clusters,
            assignments,
            quality: this.calculateQuality(clusters, embeddings.length),
            iterations: 1,
            converged: true,
        }
    }

    /**
     * Calcula o centroide de um conjunto de vetores
     */
    private calculateCentroid(vectors: number[][]): number[] {
        if (vectors.length === 0) {
            return []
        }

        const dimension = vectors[0].length
        const centroid = new Array(dimension).fill(0)

        for (const vector of vectors) {
            for (let i = 0; i < dimension; i++) {
                centroid[i] += vector[i]
            }
        }

        for (let i = 0; i < dimension; i++) {
            centroid[i] /= vectors.length
        }

        return this.normalizeVector(centroid)
    }

    /**
     * Calcula a densidade de um cluster
     */
    private calculateDensity(vectors: number[][]): number {
        if (vectors.length === 0) {
            return 0
        }

        // Densidade = número de pontos / volume estimado
        return vectors.length / (Math.PI * Math.pow(this.config.epsilon, 2))
    }

    /**
     * Calcula a coerência (coesão interna) de um cluster
     */
    private calculateCoherence(vectors: number[][]): number {
        if (vectors.length < 2) {
            return 1
        }

        const centroid = this.calculateCentroid(vectors)
        let totalDistance = 0

        for (const vector of vectors) {
            totalDistance += this.euclideanDistance(vector, centroid)
        }

        const avgDistance = totalDistance / vectors.length
        return Math.max(0, 1 - avgDistance)
    }

    /**
     * Calcula qualidade geral do clustering
     */
    private calculateQuality(clusters: Cluster[], totalPoints: number): number {
        if (clusters.length === 0 || totalPoints === 0) {
            return 0
        }

        // Qualidade baseada em proporção de pontos em clusters e coerência média
        const pointsInClusters = clusters.reduce((sum, c) => sum + c.size, 0)
        const proportion = pointsInClusters / totalPoints

        const avgCoherence =
            clusters.reduce((sum, c) => sum + (c.coherence || 0), 0) / clusters.length

        return proportion * avgCoherence
    }

    /**
     * Normaliza um vetor
     */
    private normalizeVector(vector: number[]): number[] {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
        return magnitude > 0 ? vector.map((val) => val / magnitude) : vector
    }
}
