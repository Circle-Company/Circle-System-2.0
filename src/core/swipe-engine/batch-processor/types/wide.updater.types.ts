/**
 * Configuração para o atualizador de sistema
 */
export interface WideUpdaterConfig {
    // Tamanho do lote para processamento
    batchSize: number

    // Quantidade máxima de embeddings a processar por execução
    maxItemsPerRun: number
}

/**
 * Interface para repositório de IDs
 */
export interface IdRepository {
    findAllIds(limit: number, offset: number): Promise<string[]>
}
