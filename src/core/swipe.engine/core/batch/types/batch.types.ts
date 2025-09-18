/**
 * Configuração para o processador em lote
 */
export interface BatchProcessorConfig {
    // Intervalo para recálculo de embeddings (ms)
    embeddingUpdateInterval: number

    // Intervalo para recálculo de clusters (ms)
    clusteringInterval: number

    // Tamanho do lote para processamento
    batchSize: number

    // Quantidade máxima de embeddings a processar por execução
    maxItemsPerRun: number

    // Repositórios e serviços
    repositories: {
        userRepository?: any
        postRepository?: any
        interactionRepository?: any
        postEmbeddingRepository?: any
    }
}
