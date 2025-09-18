/**
 * ClusterRecalculator
 *
 * Responsável por recalcular clusters com base em embeddings atualizados,
 * usado em processamento em lote para manter os clusters atualizados.
 */

import {
    ClusterRecalculatorConfig,
    ClusteringResult,
    DBSCANConfig,
    EmbeddingRepository,
    InternalClusteringResult,
} from "./types/cluster.processor.types"
import { LogLevel, Logger } from "@/logger"

import { DBSCANClustering } from "@/core/swipe.engine/core/clustering"
import { Entity } from "@/core/swipe.engine/types"

export class ClusterRecalculator {
    private readonly logger: Logger
    private config: ClusterRecalculatorConfig
    private clustering: DBSCANClustering

    constructor(config: Partial<ClusterRecalculatorConfig> = {}) {
        this.logger = new Logger("ClusterRecalculator", {
            minLevel: LogLevel.INFO,
            showTimestamp: true,
            showComponent: true,
            enabled: true,
        })
        this.config = {
            batchSize: 100,
            ...config,
        }
        this.clustering = new DBSCANClustering()
    }

    /**
     * Recalcula clusters de usuários
     * @param userEmbeddingRepository Repositório de embeddings de usuário
     * @param dbscanConfig Configuração opcional para o algoritmo DBSCAN
     * @returns Resultado do clustering
     */
    public async recalculateUserClusters(
        userEmbeddingRepository: EmbeddingRepository,
        dbscanConfig?: Partial<DBSCANConfig>,
    ): Promise<ClusteringResult> {
        this.logger.info("Recalculando clusters de usuários...")

        // Coletar embeddings de usuários do repositório
        const { embeddings, entities, totalItems } = await this.collectEmbeddings(
            userEmbeddingRepository,
            "user",
        )

        if (embeddings.length === 0) {
            this.logger.warn("Nenhum embedding de usuário encontrado para clustering")
            return {
                clusters: [],
                assignments: {},
                quality: 0,
                converged: true,
                iterations: 0,
                metadata: { totalItems: 0 },
            }
        }

        // Executar clustering usando DBSCAN
        const clusteringResult = (await this.clustering.process(
            embeddings,
            entities,
        )) as InternalClusteringResult

        // Calcular qualidade do clustering (simples, baseado na quantidade de clusters)
        const qualityScore =
            clusteringResult.clusters.length > 0
                ? Math.min(1.0, clusteringResult.clusters.length / Math.sqrt(totalItems))
                : 0

        // Adicionar metadados adicionais ao resultado
        const resultWithMetadata: ClusteringResult = {
            clusters: clusteringResult.clusters.map((cluster) => ({
                id: cluster.id,
                name: cluster.id,
                centroid: cluster.centroid,
                size: cluster.size,
                density: cluster.density || 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            })),
            assignments: clusteringResult.assignments,
            quality: qualityScore,
            converged: true,
            iterations: 1,
            metadata: {
                totalItems,
                entityType: "user",
                createdAt: new Date(),
            },
        }

        // Persistir clusters se um repositório estiver configurado
        if (this.config.clusterRepository) {
            try {
                await this.persistClusters(resultWithMetadata, "user")
            } catch (error: any) {
                this.logger.error(`Erro ao persistir clusters de usuários: ${error.message}`)
            }
        }

        this.logger.info(
            `Clustering de usuários concluído: ${resultWithMetadata.clusters.length} clusters, ` +
                `qualidade: ${(resultWithMetadata.quality ?? 0).toFixed(2)}`,
        )

        return resultWithMetadata
    }

    /**
     * Recalcula clusters de posts
     * @param postEmbeddingRepository Repositório de embeddings de post
     * @param dbscanConfig Configuração opcional para o algoritmo DBSCAN
     * @returns Resultado do clustering
     */
    public async recalculatePostClusters(
        postEmbeddingRepository: EmbeddingRepository,
        dbscanConfig?: Partial<DBSCANConfig>,
    ): Promise<ClusteringResult> {
        this.logger.info("Recalculando clusters de posts...")

        // Coletar embeddings de posts do repositório
        const { embeddings, entities, totalItems } = await this.collectEmbeddings(
            postEmbeddingRepository,
            "post",
        )

        if (embeddings.length === 0) {
            this.logger.warn("Nenhum embedding de post encontrado para clustering")
            return {
                clusters: [],
                assignments: {},
                quality: 0,
                converged: true,
                iterations: 0,
                metadata: { totalItems: 0 },
            }
        }

        // Ajustar parâmetros DBSCAN conforme necessário
        if (dbscanConfig) {
            // Poderia ajustar parâmetros da instância this.clustering aqui, se tivesse setters
            // Por ora, mantemos os padrões para posts
        }

        // Executar clustering usando DBSCAN
        const clusteringResult = (await this.clustering.process(
            embeddings,
            entities,
        )) as InternalClusteringResult

        // Calcular qualidade do clustering (simples, baseado na quantidade de clusters)
        const qualityScore =
            clusteringResult.clusters.length > 0
                ? Math.min(1.0, clusteringResult.clusters.length / Math.sqrt(totalItems))
                : 0

        // Adicionar metadados adicionais ao resultado
        const resultWithMetadata: ClusteringResult = {
            clusters: clusteringResult.clusters.map((cluster) => ({
                id: cluster.id,
                name: cluster.id,
                centroid: cluster.centroid,
                size: cluster.size,
                density: cluster.density || 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            })),
            assignments: clusteringResult.assignments,
            quality: qualityScore,
            converged: true,
            iterations: 1,
            metadata: {
                totalItems,
                entityType: "post",
                createdAt: new Date(),
            },
        }

        // Persistir clusters se um repositório estiver configurado
        if (this.config.clusterRepository) {
            try {
                await this.persistClusters(resultWithMetadata, "post")
            } catch (error: any) {
                this.logger.error(`Erro ao persistir clusters de posts: ${error.message}`)
            }
        }

        this.logger.info(
            `Clustering de posts concluído: ${resultWithMetadata.clusters.length} clusters, ` +
                `qualidade: ${(resultWithMetadata.quality ?? 0).toFixed(2)}`,
        )

        return resultWithMetadata
    }

    /**
     * Coleta embeddings de um repositório em lotes
     * @param repository Repositório de embeddings
     * @param entityType Tipo da entidade ('user' ou 'post')
     * @returns Embeddings coletados, entidades correspondentes e total de itens
     */
    private async collectEmbeddings(
        repository: EmbeddingRepository,
        entityType: "user" | "post",
    ): Promise<{ embeddings: number[][]; entities: Entity[]; totalItems: number }> {
        const embeddings: number[][] = []
        const entities: Entity[] = []
        let offset = 0
        let totalItems = 0
        let hasMore = true

        while (hasMore) {
            // Buscar lote de embeddings
            const batch = await repository.findAllEmbeddings(this.config.batchSize, offset)
            totalItems += batch.length

            if (batch.length === 0) {
                hasMore = false
                break
            }

            // Processar lote
            for (const item of batch) {
                if (item.embedding && Array.isArray(item.embedding)) {
                    embeddings.push(item.embedding)

                    // Criar entidade a partir do item
                    entities.push({
                        id: entityType === "user" ? item.userId : item.postId,
                        type: entityType,
                        metadata: item.metadata || {},
                    })
                }
            }

            // Avançar para o próximo lote
            offset += batch.length

            // Verificar se chegamos ao fim
            if (batch.length < this.config.batchSize) {
                hasMore = false
            }
        }

        this.logger.info(`Coletados ${embeddings.length} embeddings de ${entityType}`)
        return { embeddings, entities, totalItems }
    }

    /**
     * Persiste os clusters gerados no repositório
     * @param clusteringResult Resultado do clustering
     * @param entityType Tipo da entidade ('user' ou 'post')
     */
    private async persistClusters(
        clusteringResult: ClusteringResult,
        entityType: "user" | "post",
    ): Promise<void> {
        if (!this.config.clusterRepository) {
            return
        }

        try {
            // Formatar dados para persistência
            const clusterRecord = {
                entityType,
                clusters: clusteringResult.clusters,
                assignments: clusteringResult.assignments,
                quality: clusteringResult.quality,
                metadata: clusteringResult.metadata,
                createdAt: new Date(),
            }

            // Salvar no repositório
            await this.config.clusterRepository.saveClusteringResult(clusterRecord)
            this.logger.info(`Clusters de ${entityType} persistidos com sucesso`)
        } catch (error: any) {
            this.logger.error(`Erro ao persistir clusters: ${error.message}`)
            throw error
        }
    }
}
