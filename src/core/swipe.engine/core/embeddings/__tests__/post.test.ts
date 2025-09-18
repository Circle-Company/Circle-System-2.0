import { beforeEach, describe, expect, it, vi } from "vitest"

import { ContentEngagement } from "../../../types"
import { PostEmbeddingService } from "../post"

// Mock das dependências externas
vi.mock("@/logger", () => ({
    Logger: vi.fn().mockImplementation(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    })),
    LogLevel: {
        INFO: "info",
        ERROR: "error",
        WARN: "warn",
        DEBUG: "debug",
    },
}))

vi.mock("@/infra/models/swipe.engine/post.embedding.model", () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
        findAll: vi.fn(),
        sequelize: {
            models: {
                Moment: {
                    findByPk: vi.fn(),
                },
            },
        },
    },
    findOne: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
    findAll: vi.fn(),
}))

vi.mock("../../../utils/normalization", () => ({
    normalizeL2: vi.fn((vector: number[]) =>
        vector.map((v) => v / Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))),
    ),
}))

vi.mock("../../../utils/vector-operations", () => ({
    combineVectors: vi.fn((vectors: number[][], weights: number[]) => {
        const result = new Array(vectors[0].length).fill(0)
        vectors.forEach((vector, i) => {
            vector.forEach((val, j) => {
                result[j] += val * weights[i]
            })
        })
        return result
    }),
    resizeVector: vi.fn((vector: number[], targetSize: number) => {
        if (vector.length >= targetSize) {
            return vector.slice(0, targetSize)
        }
        return [...vector, ...new Array(targetSize - vector.length).fill(0)]
    }),
}))

vi.mock("../../../params", () => ({
    EmbeddingParams: {
        dimensions: {
            embedding: 384,
        },
        weights: {
            content: {
                text: 0.4,
                tags: 0.3,
                engagement: 0.3,
            },
            update: {
                default: 0.1,
            },
        },
        normalization: {
            engagementScaleFactor: 10,
        },
        timeWindows: {
            recentEmbeddingUpdate: 24 * 60 * 60 * 1000, // 24 hours
        },
        similarity: {
            defaultLimit: 10,
            minimumThreshold: 0.5,
        },
        batchProcessing: {
            size: 10,
        },
        decay: {
            interactionWeight: {
                minimum: 0.01,
                base: 24,
            },
        },
    },
}))

describe("PostEmbeddingService", () => {
    let postEmbeddingService: PostEmbeddingService
    let mockPostEmbedding: any
    let mockMoment: any

    beforeEach(async () => {
        vi.clearAllMocks()

        // Mock do modelo PostEmbedding
        mockPostEmbedding = {
            findOne: vi.fn(),
            create: vi.fn(),
            upsert: vi.fn(),
            findAll: vi.fn(),
            toPostEmbeddingType: vi.fn(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Mock do modelo Moment
        mockMoment = {
            getDataValue: vi.fn(),
            tags: [],
        }

        const PostEmbedding = await import(
            "../../../../../infra/models/swipe.engine/post.embedding.model"
        )
        vi.mocked(PostEmbedding.default.findOne).mockImplementation(mockPostEmbedding.findOne)
        vi.mocked(PostEmbedding.default.create).mockImplementation(mockPostEmbedding.create)
        vi.mocked(PostEmbedding.default.upsert).mockImplementation(mockPostEmbedding.upsert)
        vi.mocked(PostEmbedding.default.findAll).mockImplementation(mockPostEmbedding.findAll)

        // Mock do método toPostEmbeddingType
        mockPostEmbedding.toPostEmbeddingType.mockReturnValue({
            postId: "123",
            vector: {
                values: [0.1, 0.2, 0.3],
                dimension: 384,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            timestamp: new Date(),
            version: "1.0",
        })

        // Mock do sequelize models
        if (PostEmbedding.default.sequelize?.models?.Moment?.findByPk) {
            vi.mocked(PostEmbedding.default.sequelize.models.Moment.findByPk).mockResolvedValue(
                mockMoment,
            )
        }

        postEmbeddingService = new PostEmbeddingService(384)

        // Mock do modelo interno
        ;(postEmbeddingService as any).model = {
            embed: vi.fn().mockReturnValue(new Array(384).fill(0.1)),
        }
    })

    describe("Constructor", () => {
        it("should initialize with default dimension", () => {
            const service = new PostEmbeddingService()
            expect(service).toBeInstanceOf(PostEmbeddingService)
        })

        it("should initialize with custom dimension", () => {
            const service = new PostEmbeddingService(512)
            expect(service).toBeInstanceOf(PostEmbeddingService)
        })
    })

    describe("generateEmbedding", () => {
        it("should generate embedding from post data", async () => {
            const postData = {
                textContent: "This is a test post about technology and innovation",
                tags: ["technology", "innovation", "AI"],
                engagementMetrics: {
                    views: 1000,
                    likes: 50,
                    comments: 25,
                    shares: 10,
                    saves: 5,
                    avgWatchTime: 120,
                },
                authorId: BigInt(123),
                createdAt: new Date(),
            }

            const result = await postEmbeddingService.generateEmbedding(postData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(384)
        })

        it("should handle empty text content", async () => {
            const postData = {
                textContent: "",
                tags: ["test"],
                engagementMetrics: {
                    views: 100,
                    likes: 10,
                    comments: 5,
                    shares: 2,
                    saves: 1,
                    avgWatchTime: 60,
                },
                authorId: BigInt(123),
                createdAt: new Date(),
            }

            const result = await postEmbeddingService.generateEmbedding(postData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })

        it("should handle empty tags", async () => {
            const postData = {
                textContent: "Post without tags",
                tags: [],
                engagementMetrics: {
                    views: 100,
                    likes: 10,
                    comments: 5,
                    shares: 2,
                    saves: 1,
                    avgWatchTime: 60,
                },
                authorId: BigInt(123),
                createdAt: new Date(),
            }

            const result = await postEmbeddingService.generateEmbedding(postData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })
    })

    describe("updateEmbedding", () => {
        it("should update existing embedding", async () => {
            const currentEmbedding = {
                values: new Array(384).fill(0.1),
                dimension: 384,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const newData = {
                textContent: "Updated content",
                tags: ["updated", "content"],
                engagementMetrics: {
                    views: 2000,
                    likes: 100,
                    comments: 50,
                    shares: 20,
                    saves: 10,
                    avgWatchTime: 180,
                },
            }

            const result = await postEmbeddingService.updateEmbedding(currentEmbedding, newData)

            expect(result).toBeDefined()
            expect(result.values).toBeDefined()
            expect(result.dimension).toBe(384)
            expect(result.createdAt).toBeDefined()
            expect(result.updatedAt).toBeDefined()
        })

        it("should handle partial update data", async () => {
            const currentEmbedding = {
                values: new Array(384).fill(0.1),
                dimension: 384,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const newData = {
                textContent: "Only text updated",
            }

            const result = await postEmbeddingService.updateEmbedding(currentEmbedding, newData)

            expect(result).toBeDefined()
            expect(result.values).toBeDefined()
        })
    })

    describe("getPostEmbedding", () => {
        it("should return existing recent embedding", async () => {
            const recentDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
            mockPostEmbedding.findOne.mockResolvedValue({
                ...mockPostEmbedding,
                updatedAt: recentDate,
            })

            const result = await postEmbeddingService.getPostEmbedding(BigInt(123))

            expect(result).toBeDefined()
            expect(mockPostEmbedding.findOne).toHaveBeenCalledWith({
                where: { postId: "123" },
            })
        })

        it("should generate new embedding if none exists", async () => {
            mockPostEmbedding.findOne.mockResolvedValue(null)
            mockPostEmbedding.upsert.mockResolvedValue([mockPostEmbedding])

            // Mock do momento
            mockMoment.getDataValue.mockImplementation((key: string) => {
                const data: Record<string, any> = {
                    description: "Test post description",
                    user_id: "123",
                    createdAt: new Date(),
                }
                return data[key] || {}
            })

            const result = await postEmbeddingService.getPostEmbedding(BigInt(123))

            expect(result).toBeDefined()
            expect(mockPostEmbedding.upsert).toHaveBeenCalled()
        })

        it("should generate new embedding if existing is old", async () => {
            const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
            mockPostEmbedding.findOne.mockResolvedValue({
                ...mockPostEmbedding,
                updatedAt: oldDate,
            })
            mockPostEmbedding.upsert.mockResolvedValue([mockPostEmbedding])

            // Mock do momento
            mockMoment.getDataValue.mockImplementation((key: string) => {
                const data: Record<string, any> = {
                    description: "Test post description",
                    user_id: "123",
                    createdAt: new Date(),
                }
                return data[key] || {}
            })

            const result = await postEmbeddingService.getPostEmbedding(BigInt(123))

            expect(result).toBeDefined()
            expect(mockPostEmbedding.upsert).toHaveBeenCalled()
        })

        it("should handle database errors", async () => {
            mockPostEmbedding.findOne.mockRejectedValue(new Error("Database error"))

            await expect(postEmbeddingService.getPostEmbedding(BigInt(123))).rejects.toThrow(
                "Falha ao obter embedding do post",
            )
        })
    })

    describe("batchGenerateEmbeddings", () => {
        it("should generate embeddings for multiple posts", async () => {
            const postIds = [BigInt(123), BigInt(456), BigInt(789)]

            mockPostEmbedding.findOne.mockResolvedValue(null)
            mockPostEmbedding.upsert.mockResolvedValue([mockPostEmbedding])

            // Mock do momento
            mockMoment.getDataValue.mockImplementation((key: string) => {
                const data: Record<string, any> = {
                    description: "Test post description",
                    user_id: "123",
                    createdAt: new Date(),
                }
                return data[key] || {}
            })

            const result = await postEmbeddingService.batchGenerateEmbeddings(postIds)

            expect(result).toBeDefined()
            expect(result instanceof Map).toBe(true)
            expect(result.size).toBe(postIds.length)
        })

        it("should handle errors in batch processing", async () => {
            const postIds = [BigInt(123), BigInt(456)]

            mockPostEmbedding.findOne.mockRejectedValue(new Error("Database error"))

            const result = await postEmbeddingService.batchGenerateEmbeddings(postIds)

            expect(result).toBeDefined()
            expect(result instanceof Map).toBe(true)
            expect(result.size).toBe(0) // No successful embeddings
        })
    })

    describe("findSimilarPosts", () => {
        it("should find similar posts", async () => {
            const referenceEmbedding = {
                postId: "123",
                vector: {
                    values: [0.1, 0.2, 0.3],
                    dimension: 384,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                timestamp: new Date(),
                version: "1.0",
            }

            const candidateEmbedding = {
                postId: "456",
                vector: JSON.stringify([0.11, 0.21, 0.31]),
                updatedAt: new Date(),
            }

            mockPostEmbedding.findOne.mockResolvedValue(referenceEmbedding)
            mockPostEmbedding.findAll.mockResolvedValue([candidateEmbedding])

            const result = await postEmbeddingService.findSimilarPosts(BigInt(123))

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })

        it("should return empty array if no similar posts found", async () => {
            const referenceEmbedding = {
                postId: "123",
                vector: {
                    values: [0.1, 0.2, 0.3],
                    dimension: 384,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                timestamp: new Date(),
                version: "1.0",
            }

            mockPostEmbedding.findOne.mockResolvedValue(referenceEmbedding)
            mockPostEmbedding.findAll.mockResolvedValue([])

            const result = await postEmbeddingService.findSimilarPosts(BigInt(123))

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(0)
        })

        it("should handle errors gracefully", async () => {
            mockPostEmbedding.findOne.mockRejectedValue(new Error("Database error"))

            const result = await postEmbeddingService.findSimilarPosts(BigInt(123))

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(0)
        })
    })

    describe("build", () => {
        it("should build embedding from post data", async () => {
            const postData = {
                textContent: "This is a comprehensive test post",
                tags: ["test", "comprehensive", "example"],
                engagementMetrics: {
                    views: 1500,
                    likes: 75,
                    comments: 30,
                    shares: 15,
                    saves: 8,
                    avgWatchTime: 150,
                },
                authorId: BigInt(123),
                createdAt: new Date(),
            }

            const result = await postEmbeddingService.build(postData)

            expect(result).toBeDefined()
            expect(result.values).toBeDefined()
            expect(result.dimension).toBe(384)
            expect(result.createdAt).toBeInstanceOf(Date)
            expect(result.updatedAt).toBeInstanceOf(Date)
        })

        it("should throw error for invalid data", async () => {
            const invalidData = {
                textContent: 123, // Should be string
                tags: "invalid", // Should be array
                engagementMetrics: null,
                authorId: "invalid", // Should be bigint
                createdAt: "invalid", // Should be Date
            } as any

            await expect(postEmbeddingService.build(invalidData)).rejects.toThrow(
                "Dados inválidos para construção do embedding",
            )
        })
    })

    describe("Private Methods", () => {
        describe("extractTextEmbedding", () => {
            it("should extract embedding from text", async () => {
                const text = "This is a test text for embedding extraction"

                const result = await (postEmbeddingService as any).extractTextEmbedding(text)

                expect(result).toBeDefined()
                expect(Array.isArray(result)).toBe(true)
                expect(result.length).toBe(384)
            })

            it("should handle empty text", async () => {
                const result = await (postEmbeddingService as any).extractTextEmbedding("")

                expect(result).toBeDefined()
                expect(Array.isArray(result)).toBe(true)
                expect(result.length).toBe(384)
                expect(result.every((val) => val === 0)).toBe(true)
            })
        })

        describe("extractTagsEmbedding", () => {
            it("should extract embedding from tags", async () => {
                const tags = ["technology", "AI", "machine learning"]

                const result = await (postEmbeddingService as any).extractTagsEmbedding(tags)

                expect(result).toBeDefined()
                expect(Array.isArray(result)).toBe(true)
                expect(result.length).toBe(384)
            })

            it("should handle empty tags", async () => {
                const result = await (postEmbeddingService as any).extractTagsEmbedding([])

                expect(result).toBeDefined()
                expect(Array.isArray(result)).toBe(true)
                expect(result.length).toBe(384)
                expect(result.every((val) => val === 0)).toBe(true)
            })
        })

        describe("extractEngagementEmbedding", () => {
            it("should extract embedding from engagement metrics", () => {
                const metrics: ContentEngagement = {
                    views: 1000,
                    likes: 50,
                    comments: 25,
                    shares: 10,
                    saves: 5,
                    avgWatchTime: 120,
                }

                const result = (postEmbeddingService as any).extractEngagementEmbedding(metrics)

                expect(result).toBeDefined()
                expect(Array.isArray(result)).toBe(true)
                expect(result.length).toBe(384)
            })

            it("should handle partial engagement metrics", () => {
                const metrics: Partial<ContentEngagement> = {
                    views: 100,
                    likes: 10,
                }

                const result = (postEmbeddingService as any).extractEngagementEmbedding(metrics)

                expect(result).toBeDefined()
                expect(Array.isArray(result)).toBe(true)
                expect(result.length).toBe(384)
            })
        })

        describe("calculateEngagementRate", () => {
            it("should calculate engagement rate correctly", () => {
                const stats = {
                    view_count: 1000,
                    like_count: 50,
                    comment_count: 25,
                    share_count: 10,
                    save_count: 5,
                }

                const result = (postEmbeddingService as any).calculateEngagementRate(stats)

                expect(result).toBeDefined()
                expect(typeof result).toBe("number")
                expect(result).toBeGreaterThanOrEqual(0)
            })

            it("should return 0 for zero views", () => {
                const stats = {
                    view_count: 0,
                    like_count: 10,
                    comment_count: 5,
                }

                const result = (postEmbeddingService as any).calculateEngagementRate(stats)

                expect(result).toBe(0)
            })
        })

        describe("calculateCosineSimilarity", () => {
            it("should calculate cosine similarity correctly", () => {
                const a = [1, 0, 0]
                const b = [1, 0, 0]

                const result = (postEmbeddingService as any).calculateCosineSimilarity(a, b)

                expect(result).toBe(1) // Perfect similarity
            })

            it("should handle orthogonal vectors", () => {
                const a = [1, 0, 0]
                const b = [0, 1, 0]

                const result = (postEmbeddingService as any).calculateCosineSimilarity(a, b)

                expect(result).toBe(0) // No similarity
            })

            it("should throw error for different dimensions", () => {
                const a = [1, 2, 3]
                const b = [1, 2]

                expect(() => {
                    ;(postEmbeddingService as any).calculateCosineSimilarity(a, b)
                }).toThrow("Vetores com dimensões diferentes")
            })
        })
    })

    describe("Error Handling", () => {
        it("should handle model loading errors", async () => {
            // Mock model loading failure
            vi.spyOn(postEmbeddingService as any, "loadModel").mockRejectedValue(
                new Error("Model loading failed"),
            )

            const postData = {
                textContent: "Test post",
                tags: ["test"],
                engagementMetrics: {
                    views: 100,
                    likes: 10,
                    comments: 5,
                    shares: 2,
                    saves: 1,
                    avgWatchTime: 60,
                },
                authorId: BigInt(123),
                createdAt: new Date(),
            }

            await expect(postEmbeddingService.generateEmbedding(postData)).rejects.toThrow()
        })

        it("should handle database connection errors", async () => {
            mockPostEmbedding.findOne.mockRejectedValue(new Error("Connection timeout"))

            await expect(postEmbeddingService.getPostEmbedding(BigInt(123))).rejects.toThrow(
                "Falha ao obter embedding do post",
            )
        })
    })

    describe("Edge Cases", () => {
        it("should handle very long text content", async () => {
            const longText = "A".repeat(10000)
            const postData = {
                textContent: longText,
                tags: ["long", "text"],
                engagementMetrics: {
                    views: 100,
                    likes: 10,
                    comments: 5,
                    shares: 2,
                    saves: 1,
                    avgWatchTime: 60,
                },
                authorId: BigInt(123),
                createdAt: new Date(),
            }

            const result = await postEmbeddingService.generateEmbedding(postData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })

        it("should handle many tags", async () => {
            const manyTags = Array.from({ length: 100 }, (_, i) => `tag${i}`)
            const postData = {
                textContent: "Post with many tags",
                tags: manyTags,
                engagementMetrics: {
                    views: 100,
                    likes: 10,
                    comments: 5,
                    shares: 2,
                    saves: 1,
                    avgWatchTime: 60,
                },
                authorId: BigInt(123),
                createdAt: new Date(),
            }

            const result = await postEmbeddingService.generateEmbedding(postData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })

        it("should handle zero engagement metrics", async () => {
            const postData = {
                textContent: "New post with no engagement",
                tags: ["new"],
                engagementMetrics: {
                    views: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    saves: 0,
                    avgWatchTime: 0,
                },
                authorId: BigInt(123),
                createdAt: new Date(),
            }

            const result = await postEmbeddingService.generateEmbedding(postData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })
    })
})
