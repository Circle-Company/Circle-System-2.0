/**
 * Testes do ContentEmbeddingGenerator
 * Arquitetura desacoplada com mocks
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { ContentEmbeddingGenerator } from "../core/services/content.embedding.generator"
import {
    ITextEmbeddingService,
    IVisualEmbeddingService,
} from "../types/embedding.generation.types"
import { MOCK_EMBEDDING_CONFIG } from "../core/embeddings/models.config"

describe("ContentEmbeddingGenerator (New Swipe Engine)", () => {
    let generator: ContentEmbeddingGenerator
    let mockTextService: ITextEmbeddingService
    let mockVisualService: IVisualEmbeddingService

    beforeEach(() => {
        // Mock do text service
        mockTextService = {
            generate: vi.fn().mockResolvedValue({
                success: true,
                embedding: new Array(128).fill(0).map(() => Math.random()),
                tokenCount: 50,
                processingTime: 100,
            }),
            generateEmbedding: vi.fn().mockResolvedValue({
                success: true,
                embedding: new Array(128).fill(0).map(() => Math.random()),
                tokenCount: 50,
                processingTime: 100,
            }),
            isAvailable: () => true,
            getConfig: () => MOCK_EMBEDDING_CONFIG.textEmbedding,
        }

        // Mock do visual service
        mockVisualService = {
            generate: vi.fn().mockResolvedValue({
                success: true,
                embedding: new Array(128).fill(0).map(() => Math.random()),
                framesProcessed: 5,
                processingTime: 200,
            }),
            generateEmbedding: vi.fn().mockResolvedValue({
                success: true,
                embedding: new Array(128).fill(0).map(() => Math.random()),
                framesProcessed: 5,
                processingTime: 200,
            }),
            isAvailable: () => true,
            getConfig: () => MOCK_EMBEDDING_CONFIG.clip,
        }

        // Criar generator com dependências injetadas
        generator = new ContentEmbeddingGenerator(
            MOCK_EMBEDDING_CONFIG,
            mockTextService,
            undefined, // transcription
            mockVisualService,
            undefined, // audio extractor
        )
    })

    describe("Injeção de Dependências", () => {
        it("deve aceitar apenas text service (mínimo)", () => {
            const minimalGenerator = new ContentEmbeddingGenerator(
                MOCK_EMBEDDING_CONFIG,
                mockTextService,
            )

            expect(minimalGenerator.isAvailable()).toBe(true)
        })

        it("deve aceitar todos os serviços (completo)", () => {
            const fullGenerator = new ContentEmbeddingGenerator(
                MOCK_EMBEDDING_CONFIG,
                mockTextService,
                undefined, // transcription
                mockVisualService,
                {
                    extractAudio: vi.fn(),
                    extractFrames: vi.fn(),
                },
            )

            expect(fullGenerator.isAvailable()).toBe(true)
        })
    })

    describe("Geração de Embedding", () => {
        it("deve gerar embedding com text service", async () => {
            const input = {
                videoData: Buffer.from("video-data"),
                description: "Teste de embedding",
                hashtags: ["teste", "ia"],
                videoMetadata: {
                    width: 360,
                    height: 558,
                    duration: 30,
                    codec: "av1",
                    hasAudio: true,
                },
            }

            const result = await generator.generate(input)

            expect(result).toBeDefined()
            expect(result.vector).toBeDefined()
            expect(result.vector.length).toBeGreaterThan(0)
            expect(result.dimension).toBeGreaterThan(0)
            expect(result.metadata.model).toBe("content-embedding-v2-pipeline")
            expect(mockTextService.generateEmbedding).toHaveBeenCalled()
        })

        it("deve incluir metadata dos componentes", async () => {
            const input = {
                videoData: Buffer.from("video-data"),
                description: "Teste",
                hashtags: [],
                videoMetadata: {
                    width: 360,
                    height: 558,
                    duration: 10,
                    codec: "av1",
                    hasAudio: false,
                },
            }

            const result = await generator.generate(input)

            expect(result.metadata.components).toBeDefined()
            expect(result.metadata.components.text).toBeDefined()
            expect(result.metadata.combinedFrom).toBeDefined()
        })

        it("deve normalizar vetor final", async () => {
            const input = {
                videoData: Buffer.from("data"),
                description: "Test",
                hashtags: [],
                videoMetadata: {
                    width: 360,
                    height: 558,
                    duration: 5,
                    codec: "av1",
                    hasAudio: false,
                },
            }

            const result = await generator.generate(input)

            // Calcular magnitude (deve ser ~1 após normalização L2)
            const magnitude = Math.sqrt(result.vector.reduce((sum, val) => sum + val * val, 0))

            expect(magnitude).toBeCloseTo(1, 1)
        })
    })

    describe("Testabilidade (Mocks)", () => {
        it("deve permitir mock do text service", async () => {
            const customMock: ITextEmbeddingService = {
                generate: vi.fn().mockResolvedValue({
                    success: true,
                    embedding: [1, 2, 3],
                    tokenCount: 3,
                    processingTime: 50,
                }),
                generateEmbedding: vi.fn().mockResolvedValue({
                    success: true,
                    embedding: [1, 2, 3],
                    tokenCount: 3,
                    processingTime: 50,
                }),
                isAvailable: () => true,
                getConfig: () => ({}),
            }

            const testGenerator = new ContentEmbeddingGenerator(
                MOCK_EMBEDDING_CONFIG,
                customMock,
            )

            const result = await testGenerator.generate({
                videoData: Buffer.from("test"),
                description: "Mock test",
                hashtags: [],
                videoMetadata: {
                    width: 360,
                    height: 558,
                    duration: 5,
                    codec: "av1",
                    hasAudio: false,
                },
            })

            expect(customMock.generateEmbedding).toHaveBeenCalled()
            expect(result.vector).toBeDefined()
        })
    })
})

