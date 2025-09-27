/**
 * BatchProcessor
 *
 * Responsável pelo processamento em lote de operações no SwipeEngine,
 * coordenando tarefas periódicas como atualização de embeddings e recálculo de clusters.
 */

import { LogLevel, Logger } from "@/shared/logger"
import { PostEmbeddingService, UserEmbeddingService } from "@/core/swipe.engine/core/embeddings"

import { BatchProcessorConfig } from "./types/batch.types"
import { ClusterRecalculator } from "./cluster.processor"
import { WideUpdater } from "./wide.updater"

export class BatchProcessor {
    private readonly logger: Logger
    private config: BatchProcessorConfig
    private clusterRecalculator: ClusterRecalculator
    private wideUpdater: WideUpdater
    private userEmbeddingService: UserEmbeddingService | null = null
    private postEmbeddingService: PostEmbeddingService | null = null
    private embeddingUpdateTimer: NodeJS.Timeout | null = null
    private clusteringTimer: NodeJS.Timeout | null = null
    private isRunning: boolean = false

    constructor(config: Partial<BatchProcessorConfig> = {}) {
        this.logger = new Logger("BatchProcessor", {
            minLevel: LogLevel.INFO,
            showTimestamp: true,
            showComponent: true,
            enabled: true,
        })
        this.config = {
            embeddingUpdateInterval: 1000 * 60 * 60 * 12, // 12 horas
            clusteringInterval: 1000 * 60 * 60 * 24, // 24 horas
            batchSize: 100,
            maxItemsPerRun: 5000,
            repositories: {},
            ...config,
        }

        this.clusterRecalculator = new ClusterRecalculator({
            batchSize: this.config.batchSize,
        })

        this.wideUpdater = new WideUpdater({
            batchSize: this.config.batchSize,
            maxItemsPerRun: this.config.maxItemsPerRun,
        })

        // Inicializar serviços de embedding, se os repositórios estiverem disponíveis
        this.initEmbeddingServices()
    }

    /**
     * Inicializa os serviços de embedding
     */
    private initEmbeddingServices(): void {
        // Inicializar serviço de embedding de usuário
        this.userEmbeddingService = new UserEmbeddingService()
        this.logger.info("Serviço de embedding de usuário inicializado")

        // Inicializar serviço de embedding de post
        this.postEmbeddingService = new PostEmbeddingService()
        this.logger.info("Serviço de embedding de post inicializado")
    }

    /**
     * Inicia o processador em lote com os timers configurados
     */
    public start(): void {
        if (this.isRunning) {
            this.logger.warn("BatchProcessor já está em execução")
            return
        }

        this.isRunning = true
        this.logger.info("Iniciando BatchProcessor...")

        // Configurar timer para atualização de embeddings
        this.embeddingUpdateTimer = setInterval(
            () => this.updateEmbeddings(),
            this.config.embeddingUpdateInterval,
        )

        // Configurar timer para recálculo de clusters
        this.clusteringTimer = setInterval(
            () => this.recalculateClusters(),
            this.config.clusteringInterval,
        )

        // Executar imediatamente para não esperar pelo primeiro intervalo
        this.updateEmbeddings()
        this.recalculateClusters()

        this.logger.info(
            `BatchProcessor iniciado. Próxima atualização de embeddings em ${
                this.config.embeddingUpdateInterval / (1000 * 60)
            } minutos`,
        )
    }

    /**
     * Para todos os processamentos em lote
     */
    public stop(): void {
        if (!this.isRunning) {
            return
        }

        this.logger.info("Parando BatchProcessor...")

        if (this.embeddingUpdateTimer) {
            clearInterval(this.embeddingUpdateTimer)
            this.embeddingUpdateTimer = null
        }

        if (this.clusteringTimer) {
            clearInterval(this.clusteringTimer)
            this.clusteringTimer = null
        }

        this.isRunning = false
        this.logger.info("BatchProcessor parado")
    }

    /**
     * Atualiza embeddings de usuários e posts
     */
    private async updateEmbeddings(): Promise<void> {
        try {
            this.logger.info("Iniciando atualização de embeddings...")

            if (this.userEmbeddingService) {
                const startTime = Date.now()
                const usersUpdated = await this.wideUpdater.updateUserEmbeddings(
                    this.userEmbeddingService,
                    this.config.batchSize,
                )
                const duration = Date.now() - startTime

                this.logger.info(
                    `Atualizados ${usersUpdated} embeddings de usuários em ${duration}ms`,
                )
            }

            if (this.postEmbeddingService) {
                const startTime = Date.now()
                const postsUpdated = await this.wideUpdater.updatePostEmbeddings(
                    this.postEmbeddingService,
                    this.config.batchSize,
                )
                const duration = Date.now() - startTime

                this.logger.info(`Atualizados ${postsUpdated} embeddings de posts em ${duration}ms`)
            }
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar embeddings: ${error.message}`)
        }
    }

    /**
     * Recalcula clusters com base nos embeddings atualizados
     */
    private async recalculateClusters(): Promise<void> {
        try {
            this.logger.info("Iniciando recálculo de clusters...")
            const startTime = Date.now()

            // Executar recálculo de clusters de posts
            if (this.config.repositories.postEmbeddingRepository) {
                const postClustersResult = await this.clusterRecalculator.recalculatePostClusters(
                    this.config.repositories.postEmbeddingRepository,
                    {
                        epsilon: 0.25,
                        minPoints: 3,
                        distanceFunction: "cosine",
                    },
                )

                this.logger.info(
                    `Recalculados ${postClustersResult.clusters.length} clusters de posts ` +
                        `com ${postClustersResult.metadata?.totalItems || 0} posts processados`,
                )
            }

            const duration = Date.now() - startTime
            this.logger.info(`Recálculo de clusters concluído em ${duration}ms`)
        } catch (error: any) {
            this.logger.error(`Erro ao recalcular clusters: ${error.message}`)
        }
    }

    /**
     * Executa uma atualização de embeddings e cluster manualmente,
     * útil para testes ou atualizações sob demanda.
     */
    public async forceUpdate(): Promise<void> {
        this.logger.info("Executando atualização forçada...")

        await this.updateEmbeddings()
        await this.recalculateClusters()

        this.logger.info("Atualização forçada concluída")
    }
}
