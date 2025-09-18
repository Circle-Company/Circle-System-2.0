import { InteractionType, UserInteraction } from "../../../types"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FeedbackProcessor } from ".."
import { PostEmbeddingService } from "../../embeddings/post"
import { UserEmbeddingService } from "../../embeddings/user"

// Mock dos serviços
vi.mock("../../embeddings/user")
vi.mock("../../embeddings/post")
vi.mock("../../../logger")

// Mock do modelo UserInteractionHistory
vi.mock("@/infra/models/swipe.engine/user.interaction.history.model", () => ({
    default: {
        create: vi.fn(),
        findOne: vi.fn(),
        findAll: vi.fn(),
    },
    create: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
}))

describe("FeedbackProcessor", () => {
    let feedbackProcessor: FeedbackProcessor
    let mockUserEmbeddingService: any
    let mockPostEmbeddingService: any

    beforeEach(() => {
        // Resetar todos os mocks
        vi.clearAllMocks()

        // Configurar mocks
        mockUserEmbeddingService = {
            getUserEmbedding: vi.fn(),
            updateEmbedding: vi.fn(),
        }

        mockPostEmbeddingService = {
            getPostEmbedding: vi.fn(),
            updateEmbedding: vi.fn(),
            findSimilarPosts: vi.fn(),
        }

        // Criar instância do FeedbackProcessor com mocks
        feedbackProcessor = new FeedbackProcessor(
            mockUserEmbeddingService as unknown as UserEmbeddingService,
            mockPostEmbeddingService as unknown as PostEmbeddingService,
            2, // batchSize pequeno para testes
        )
    })

    describe("processInteraction", () => {
        const mockInteraction: UserInteraction = {
            id: "1",
            userId: "123",
            entityId: "456",
            entityType: "post",
            type: "like" as InteractionType,
            timestamp: new Date(),
            metadata: {
                engagementTime: 30,
                percentWatched: 100,
            },
        }

        it("deve processar uma interação com sucesso", async () => {
            const result = await feedbackProcessor.processInteraction(mockInteraction)
            expect(result).toBe(true)
        })

        it("deve processar interações de alta prioridade imediatamente", async () => {
            mockUserEmbeddingService.getUserEmbedding.mockResolvedValue({
                vector: { values: [0.1, 0.2, 0.3] },
            })
            mockPostEmbeddingService.getPostEmbedding.mockResolvedValue({
                vector: { values: [0.4, 0.5, 0.6] },
            })

            await feedbackProcessor.processInteraction(mockInteraction)

            expect(mockUserEmbeddingService.updateEmbedding).toHaveBeenCalled()
        })

        it("deve lidar com erros durante o processamento", async () => {
            mockUserEmbeddingService.getUserEmbedding.mockRejectedValue(new Error("Erro de teste"))

            const result = await feedbackProcessor.processInteraction(mockInteraction)

            expect(result).toBe(false)
        })
    })

    describe("processBatch", () => {
        const mockInteractions: UserInteraction[] = [
            {
                id: "1",
                userId: "123",
                entityId: "456",
                entityType: "post",
                type: "like" as InteractionType,
                timestamp: new Date(),
                metadata: {},
            },
            {
                id: "2",
                userId: "123",
                entityId: "789",
                entityType: "post",
                type: "view" as InteractionType,
                timestamp: new Date(),
                metadata: {},
            },
        ]

        it("deve processar um lote de interações com sucesso", async () => {
            mockUserEmbeddingService.getUserEmbedding.mockResolvedValue({
                vector: { values: [0.1, 0.2, 0.3] },
            })
            mockPostEmbeddingService.getPostEmbedding.mockResolvedValue({
                vector: { values: [0.4, 0.5, 0.6] },
            })

            // Adicionar interações ao pendingInteractions sem processar
            for (const interaction of mockInteractions) {
                // Simular adicionar ao pendingInteractions sem processar
                ;(feedbackProcessor as any).pendingInteractions.push(interaction)
            }

            const result = await feedbackProcessor.processBatch()

            expect(result).toBe(mockInteractions.length)
            expect(mockUserEmbeddingService.updateEmbedding).toHaveBeenCalled()
        })

        it("deve retornar 0 para lote vazio", async () => {
            const result = await feedbackProcessor.processBatch()
            expect(result).toBe(0)
        })

        it("deve lidar com erros durante o processamento em lote", async () => {
            mockUserEmbeddingService.getUserEmbedding.mockRejectedValue(new Error("Erro de teste"))

            // Adicionar interações ao pendingInteractions
            for (const interaction of mockInteractions) {
                await feedbackProcessor.processInteraction(interaction)
            }

            const result = await feedbackProcessor.processBatch()

            expect(result).toBe(0)
        })
    })
})
