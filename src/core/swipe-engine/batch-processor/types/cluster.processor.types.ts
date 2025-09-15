import { ClusterInfo, Entity } from "../../types"

// Interface local para o resultado do clustering, adaptada para uso neste arquivo
export interface ClusteringResult {
    clusters: ClusterInfo[]
    assignments: Record<string, number>
    quality: number
    converged: boolean
    iterations: number
    metadata: any
}

// Definindo uma interface local para o resultado do clustering que corresponde ao retorno
// da implementação atual do DBSCANClustering
export interface InternalClusteringResult {
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
}

// Configuração para DBSCAN
export interface DBSCANConfig {
    epsilon: number
    minPoints: number
    distanceFunction: "euclidean" | "cosine" | "manhattan"
    noiseHandling?: "separate-cluster" | "ignore"
}

/**
 * Configuração para o recalculador de clusters
 */
export interface ClusterRecalculatorConfig {
    // Tamanho do lote para processamento
    batchSize: number

    // Repositório de clusters para persistência (opcional)
    clusterRepository?: any
}

/**
 * Interface para repositório de embeddings
 */
export interface EmbeddingRepository {
    findAllEmbeddings(limit: number, offset: number): Promise<any[]>
}
