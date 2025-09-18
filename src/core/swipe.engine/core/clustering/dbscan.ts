/**
 * DBSCANClustering
 *
 * Implementação do algoritmo DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 * para agrupamento de embeddings baseado em densidade.
 */

import { ClusterConfig, PointLabel } from "./types/dbscan.types"
import { calculateDistance, normalizeVector } from "../../utils/vector.operations"

import { Entity } from "../../types"
import { DBSCANConfig as defaultConfig } from "../../params"

export class DBSCANClustering {
    private readonly config: Required<ClusterConfig> = {
        epsilon: defaultConfig.epsilon,
        minPoints: defaultConfig.minPoints,
        distanceFunction: defaultConfig.distanceFunction,
        weights: defaultConfig.weights,
        randomSeed: defaultConfig.randomSeed,
        initMethod: defaultConfig.initMethod,
        threshold: defaultConfig.threshold,
    }

    public async process(
        embeddings: number[][],
        entities: Entity[],
    ): Promise<{
        clusters: Array<{
            id: string
            centroid: number[]
            members: string[]
            entities: Entity[]
            size: number
            density?: number
            memberIds?: string[]
        }>
        assignments: Record<string, number>
    }> {
        if (embeddings.length !== entities.length) {
            throw new Error("Número de embeddings não corresponde ao número de entidades")
        }

        if (embeddings.length === 0) {
            return { clusters: [], assignments: {} }
        }

        // Don't normalize embeddings for DBSCAN as it can distort distances
        const { clusters: clusterIds, noise } = this.DBSCANAlgorithm(embeddings)
        return this.prepareResult(embeddings, entities, clusterIds, noise)
    }

    private DBSCANAlgorithm(embeddings: number[][]): { clusters: number[]; noise: number[] } {
        const n = embeddings.length
        const labels: number[] = new Array(n).fill(PointLabel.UNDEFINED)
        let clusterId = 0

        // Calcular matriz de distâncias
        const distances = this.computeDistanceMatrix(embeddings)

        // Para cada ponto não visitado
        for (let pointIdx = 0; pointIdx < n; pointIdx++) {
            if (labels[pointIdx] !== PointLabel.UNDEFINED) continue

            const neighbors = this.findNeighbors(pointIdx, distances)

            // Se não houver pontos suficientes, é ruído
            if (neighbors.length < this.config.minPoints) {
                labels[pointIdx] = PointLabel.NOISE
                continue
            }

            // Criar novo cluster
            clusterId++
            labels[pointIdx] = clusterId

            // Processar vizinhos
            const neighborQueue = [...neighbors]
            neighborQueue.splice(neighborQueue.indexOf(pointIdx), 1)

            while (neighborQueue.length > 0) {
                const currentPoint = neighborQueue.shift()!

                if (
                    labels[currentPoint] === PointLabel.UNDEFINED ||
                    labels[currentPoint] === PointLabel.NOISE
                ) {
                    if (labels[currentPoint] === PointLabel.NOISE) {
                        labels[currentPoint] = clusterId
                    } else {
                        labels[currentPoint] = clusterId
                        const pointNeighbors = this.findNeighbors(currentPoint, distances)

                        if (pointNeighbors.length >= this.config.minPoints) {
                            neighborQueue.push(
                                ...pointNeighbors.filter(
                                    (neighbor) =>
                                        labels[neighbor] === PointLabel.UNDEFINED ||
                                        labels[neighbor] === PointLabel.NOISE,
                                ),
                            )
                        }
                    }
                }
            }
        }

        const noise = labels
            .map((label, index) => (label === PointLabel.NOISE ? index : -1))
            .filter((idx) => idx !== -1)

        return { clusters: labels, noise }
    }

    /**
     * Calcula a matriz de distâncias entre todos os pontos
     */
    private computeDistanceMatrix(embeddings: number[][]): number[][] {
        const n = embeddings.length
        const distances: number[][] = new Array(n).fill(0).map(() => new Array(n).fill(0))

        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                if (i === j) {
                    distances[i][j] = 0
                } else {
                    const distance = calculateDistance(
                        embeddings[i],
                        embeddings[j],
                        this.config.distanceFunction,
                    )
                    distances[i][j] = distance
                    distances[j][i] = distance
                }
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
     * Prepara o resultado final
     */
    private prepareResult(
        embeddings: number[][],
        entities: Entity[],
        clusterLabels: number[],
        noise: number[],
    ): {
        clusters: Array<{
            id: string
            centroid: number[]
            members: string[]
            entities: Entity[]
            size: number
            density?: number
            memberIds?: string[]
        }>
        assignments: Record<string, number>
    } {
        const clusterMap = new Map<number, { entities: Entity[]; embeddings: number[][] }>()

        // Agrupar por cluster
        clusterLabels.forEach((clusterId, idx) => {
            if (clusterId >= 0) {
                if (!clusterMap.has(clusterId)) {
                    clusterMap.set(clusterId, { entities: [], embeddings: [] })
                }
                clusterMap.get(clusterId)!.entities.push(entities[idx])
                clusterMap.get(clusterId)!.embeddings.push(embeddings[idx])
            }
        })

        // Construir resultado
        const clusters: Array<{
            id: string
            centroid: number[]
            members: string[]
            entities: Entity[]
            size: number
            density?: number
            memberIds?: string[]
        }> = []
        const assignments: Record<string, number> = {}

        clusterMap.forEach((data, clusterId) => {
            const centroid = this.calculateCentroid(data.embeddings)
            const membersList = data.entities.map((entity) => String(entity.id))

            clusters.push({
                id: `dbscan-${clusterId}`,
                centroid,
                members: membersList,
                entities: data.entities,
                size: data.entities.length,
                density: data.embeddings.length / (Math.PI * Math.pow(this.config.epsilon, 2)), // Cálculo aproximado de densidade
                memberIds: membersList, // Alias para manter compatibilidade
            })

            data.entities.forEach((entity) => {
                assignments[String(entity.id)] = clusters.length - 1
            })
        })

        return { clusters, assignments }
    }

    /**
     * Calcula o centroide de um conjunto de embeddings
     */
    private calculateCentroid(embeddings: number[][]): number[] {
        if (embeddings.length === 0) return []

        const dimension = embeddings[0].length
        const centroid = new Array(dimension).fill(0)

        for (const embedding of embeddings) {
            for (let i = 0; i < dimension; i++) {
                centroid[i] += embedding[i]
            }
        }

        for (let i = 0; i < dimension; i++) {
            centroid[i] /= embeddings.length
        }

        return normalizeVector(centroid)
    }
}
