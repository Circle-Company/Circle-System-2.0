export interface ClusterConfig {
    epsilon?: number // Raio da vizinhança (para DBSCAN)
    minPoints?: number // Pontos mínimos para formar um cluster (para DBSCAN)
    weights?: Record<string, number> // Peso relativo de diferentes características no cálculo de distância
    randomSeed?: number // Semente aleatória para inicialização dos centroides
    initMethod?: string // Método de inicialização dos centroides
    threshold?: number // Limiar de convergência
    distanceFunction?: "euclidean" | "cosine" | "manhattan" // Função de distância
}

// Valores possíveis para classificação de pontos no DBSCAN
export enum PointLabel {
    UNDEFINED = -2, // Ponto ainda não processado
    NOISE = -1, // Ponto de ruído
    // Valores não negativos representam o ID do cluster
}
