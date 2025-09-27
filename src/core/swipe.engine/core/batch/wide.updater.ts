/**
 * SystemWideUpdater
 *
 * Responsável por atualizar embeddings de usuários e posts de forma
 * sistemática e periódica, usado para manter os embeddings atualizados.
 */

import { IdRepository, WideUpdaterConfig } from "./types/wide.updater.types"
import { LogLevel, Logger } from "@/shared/logger"
import { PostEmbeddingService, UserEmbeddingService } from "@/core/swipe.engine/core/embeddings"

/**
 * Responsável por atualizar embeddings em todo o sistema
 */
export class WideUpdater {
    private readonly logger: Logger
    private config: WideUpdaterConfig

    constructor(config: Partial<WideUpdaterConfig> = {}) {
        this.logger = new Logger("WideUpdater", {
            minLevel: LogLevel.INFO,
            showTimestamp: true,
            showComponent: true,
            enabled: true,
        })
        this.config = {
            batchSize: 100,
            maxItemsPerRun: 5000,
            ...config,
        }
    }

    /**
     * Atualiza embeddings de usuários em lotes
     * @param userEmbeddingService Serviço de embedding de usuário
     * @param batchSize Tamanho do lote (opcional)
     * @returns Número de embeddings atualizados
     */
    public async updateUserEmbeddings(
        userEmbeddingService: UserEmbeddingService,
        batchSize?: number,
    ): Promise<number> {
        const effectiveBatchSize = batchSize || this.config.batchSize
        this.logger.info(
            `Iniciando atualização de embeddings de usuário em lotes de ${effectiveBatchSize}`,
        )

        try {
            // Obter o repositório de usuários do serviço de embedding
            const userRepository = (userEmbeddingService as any).userRepository as IdRepository
            if (!userRepository || typeof userRepository.findAllIds !== "function") {
                throw new Error(
                    "Repositório de usuários não encontrado ou não tem método findAllIds",
                )
            }

            // Atualizar embeddings em lotes
            let offset = 0
            let totalProcessed = 0
            let hasMore = true

            while (hasMore && totalProcessed < this.config.maxItemsPerRun) {
                // Buscar lote de IDs de usuário
                const userIds = await userRepository.findAllIds(effectiveBatchSize, offset)

                if (userIds.length === 0) {
                    hasMore = false
                    break
                }

                // Processar cada usuário no lote
                const updatePromises = userIds.map(async (userId) => {
                    try {
                        await userEmbeddingService.getUserEmbedding(BigInt(userId))
                        return true
                    } catch (error) {
                        this.logger.error(
                            `Erro ao atualizar embedding para usuário ${userId}: ${error}`,
                        )
                        return false
                    }
                })

                // Aguardar todas as atualizações do lote
                const results = await Promise.all(updatePromises)
                const successCount = results.filter(Boolean).length

                totalProcessed += userIds.length
                offset += userIds.length

                this.logger.info(
                    `Processado lote de ${userIds.length} usuários, ` +
                        `${successCount} embeddings atualizados com sucesso`,
                )

                // Verificar se chegamos ao fim
                if (userIds.length < effectiveBatchSize) {
                    hasMore = false
                }
            }

            this.logger.info(
                `Atualização de embeddings de usuário concluída, ${totalProcessed} usuários processados`,
            )
            return totalProcessed
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar embeddings de usuário: ${error.message}`)
            throw error
        }
    }

    /**
     * Atualiza embeddings de posts em lotes
     * @param postEmbeddingService Serviço de embedding de post
     * @param batchSize Tamanho do lote (opcional)
     * @returns Número de embeddings atualizados
     */
    public async updatePostEmbeddings(
        postEmbeddingService: PostEmbeddingService,
        batchSize?: number,
    ): Promise<void> {
        const effectiveBatchSize = batchSize || this.config.batchSize
        this.logger.info(
            `Iniciando atualização de embeddings de post em lotes de ${effectiveBatchSize}`,
        )

        try {
            // Obter o repositório de posts do serviço de embedding
            const postRepository = (postEmbeddingService as any).postRepository as IdRepository
            if (!postRepository || typeof postRepository.findAllIds !== "function") {
                throw new Error("Repositório de posts não encontrado ou não tem método findAllIds")
            }

            // Atualizar embeddings em lotes
            let offset = 0
            let totalProcessed = 0
            let hasMore = true

            while (hasMore && totalProcessed < this.config.maxItemsPerRun) {
                // Buscar lote de IDs de post
                const postIds = await postRepository.findAllIds(effectiveBatchSize, offset)

                if (postIds.length === 0) {
                    hasMore = false
                    break
                }

                // Processar cada post no lote
                const updatePromises = postIds.map(async (postId) => {
                    try {
                        await postEmbeddingService.getPostEmbedding(BigInt(postId))
                        return true
                    } catch (error) {
                        this.logger.error(
                            `Erro ao atualizar embedding para post ${postId}: ${error}`,
                        )
                        return false
                    }
                })

                // Aguardar todas as atualizações do lote
                const results = await Promise.all(updatePromises)
                const successCount = results.filter(Boolean).length

                totalProcessed += postIds.length
                offset += postIds.length

                this.logger.info(
                    `Processado lote de ${postIds.length} posts, ` +
                        `${successCount} embeddings atualizados com sucesso`,
                )

                // Verificar se chegamos ao fim
                if (postIds.length < effectiveBatchSize) {
                    hasMore = false
                }
            }

            this.logger.info(
                `Atualização de embeddings de post concluída, ${totalProcessed} posts processados`,
            )
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar embeddings de post: ${error.message}`)
            throw error
        }
    }
}
