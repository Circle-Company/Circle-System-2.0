import { beforeEach, describe, expect, it, vi } from "vitest"

import { UserEmbeddingService } from "../user"
import { UserInteraction } from "../../../types"

// Mock das dependências externas
vi.mock("@xenova/transformers", () => ({
    pipeline: vi.fn(),
    FeatureExtractionPipeline: vi.fn(),
}))

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

vi.mock("../../../models/UserEmbedding", () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn(),
        findAll: vi.fn(),
    },
    findOne: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
}))

vi.mock("../../../models/InteractionEvent", () => ({
    default: {
        findAll: vi.fn(),
    },
    findAll: vi.fn(),
}))

vi.mock("../../../utils/normalization", () => ({
    normalizeL2: vi.fn((vector: number[]) =>
        vector.map((v) => v / Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))),
    ),
}))

vi.mock("../../../utils/vector-operations", () => ({
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
            interactions: {
                view: 0.1,
                like: 0.3,
                comment: 0.5,
                share: 0.7,
                save: 0.8,
                default: 0.2,
            },
        },
    },
}))

vi.mock("fs", () => ({
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
}))

describe("UserEmbeddingService", () => {
    let userEmbeddingService: UserEmbeddingService
    let mockPipeline: any
    let mockUserEmbedding: any
    let mockInteractionEvent: any

    beforeEach(async () => {
        vi.clearAllMocks()

        // Mock do pipeline do Xenova
        const mockData = new Float32Array(384).fill(0.1)
        mockPipeline = vi.fn().mockResolvedValue({
            data: mockData,
        })

        const { pipeline } = await import("@xenova/transformers")
        vi.mocked(pipeline).mockResolvedValue(mockPipeline)

        // Mock dos modelos
        mockUserEmbedding = {
            findOne: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            toUserEmbeddingType: vi.fn(),
        }

        mockInteractionEvent = {
            findAll: vi.fn(),
            toUserInteraction: vi.fn(),
        }

        const UserEmbedding = await import("../../../models/UserEmbedding")
        const InteractionEvent = await import("../../../models/InteractionEvent")

        vi.mocked(UserEmbedding.default.findOne).mockImplementation(mockUserEmbedding.findOne)
        vi.mocked(UserEmbedding.default.create).mockImplementation(mockUserEmbedding.create)
        vi.mocked(InteractionEvent.default.findAll).mockImplementation(mockInteractionEvent.findAll)

        // Mock do método toUserEmbeddingType
        mockUserEmbedding.toUserEmbeddingType.mockReturnValue({
            id: "123",
            userId: "123",
            vector: [0.1, 0.2, 0.3],
            updatedAt: new Date(),
        })

        // Mock do método toUserInteraction
        mockInteractionEvent.toUserInteraction.mockReturnValue({
            id: "1",
            userId: "123",
            entityId: "456",
            entityType: "post",
            type: "like",
            timestamp: new Date(),
        })

        userEmbeddingService = new UserEmbeddingService(384)
    })

    describe("Constructor", () => {
        it("should initialize with default dimension", () => {
            const service = new UserEmbeddingService()
            expect(service).toBeInstanceOf(UserEmbeddingService)
        })

        it("should initialize with custom dimension", () => {
            const service = new UserEmbeddingService(512)
            expect(service).toBeInstanceOf(UserEmbeddingService)
        })
    })

    describe("generateEmbedding", () => {
        it("should generate embedding using ML model", async () => {
            const userData = {
                interactionHistory: [
                    {
                        id: "1",
                        userId: "123",
                        entityId: "456",
                        entityType: "post",
                        type: "like" as any,
                        timestamp: new Date(),
                    },
                ],
                viewingPatterns: [
                    {
                        contentType: "video",
                        averageDuration: 120,
                        completionRate: 0.8,
                        frequency: 5,
                    },
                ],
                contentPreferences: ["sports", "music"],
                demographicInfo: {
                    ageRange: "25-34",
                    location: "São Paulo",
                    languages: ["pt", "en"],
                    interests: ["technology"],
                },
            }

            const result = await userEmbeddingService.generateEmbedding(userData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(384)
            expect(mockPipeline).toHaveBeenCalled()
        })

        it("should use fallback when model fails", async () => {
            mockPipeline.mockRejectedValue(new Error("Model error"))

            const userData = {
                interactionHistory: [],
                viewingPatterns: [],
                contentPreferences: [],
            }

            const result = await userEmbeddingService.generateEmbedding(userData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(384)
        })
    })

    describe("generateUserEmbedding", () => {
        it("should generate and save user embedding", async () => {
            mockUserEmbedding.findOne.mockResolvedValue(null)
            mockUserEmbedding.create.mockResolvedValue(mockUserEmbedding)
            mockInteractionEvent.findAll.mockResolvedValue([mockInteractionEvent])

            const result = await userEmbeddingService.generateUserEmbedding(BigInt(123))

            expect(result).toBeDefined()
            expect(result.userId).toBe("123")
            expect(mockUserEmbedding.create).toHaveBeenCalled()
        })

        it("should return fallback embedding on error", async () => {
            mockInteractionEvent.findAll.mockRejectedValue(new Error("Database error"))

            const result = await userEmbeddingService.generateUserEmbedding(BigInt(123))

            expect(result).toBeDefined()
            expect(result.userId).toBe("123")
            expect(result.vector).toEqual(expect.any(Array))
        })
    })

    describe("getUserEmbedding", () => {
        it("should return user embedding if exists", async () => {
            mockUserEmbedding.findOne.mockResolvedValue(mockUserEmbedding)

            const result = await userEmbeddingService.getUserEmbedding(BigInt(123))

            expect(result).toBeDefined()
            expect(result?.userId).toBe("123")
            expect(mockUserEmbedding.findOne).toHaveBeenCalledWith({
                where: { userId: "123" },
            })
        })

        it("should return null if embedding not found", async () => {
            mockUserEmbedding.findOne.mockResolvedValue(null)

            const result = await userEmbeddingService.getUserEmbedding(BigInt(123))

            expect(result).toBeNull()
        })

        it("should return null on database error", async () => {
            mockUserEmbedding.findOne.mockRejectedValue(new Error("Database error"))

            const result = await userEmbeddingService.getUserEmbedding(BigInt(123))

            expect(result).toBeNull()
        })
    })

    describe("updateEmbedding", () => {
        it("should update embedding with new interaction", async () => {
            const currentEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5]
            const interaction: UserInteraction = {
                id: "1",
                userId: "123",
                entityId: "456",
                entityType: "post",
                type: "like",
                timestamp: new Date(),
                metadata: {
                    engagementTime: 30,
                    percentWatched: 100,
                },
            }

            const result = await userEmbeddingService.updateEmbedding(currentEmbedding, interaction)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(currentEmbedding.length)
        })

        it("should handle interaction without metadata", async () => {
            const currentEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5]
            const interaction: UserInteraction = {
                id: "1",
                userId: "123",
                entityId: "456",
                entityType: "post",
                type: "view",
                timestamp: new Date(),
            }

            const result = await userEmbeddingService.updateEmbedding(currentEmbedding, interaction)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })
    })

    describe("build", () => {
        it("should build embedding from user data", async () => {
            const userData = {
                interactionHistory: [
                    {
                        id: "1",
                        userId: "123",
                        entityId: "456",
                        entityType: "post",
                        type: "like" as any,
                        timestamp: new Date(),
                    },
                ],
                viewingPatterns: [
                    {
                        contentType: "video",
                        averageDuration: 120,
                        completionRate: 0.8,
                        frequency: 5,
                    },
                ],
                contentPreferences: ["sports", "music"],
                demographicInfo: {
                    ageRange: "25-34",
                    location: "São Paulo",
                },
            }

            const result = await userEmbeddingService.build(userData)

            expect(result).toBeDefined()
            expect(result.values).toBeDefined()
            expect(result.dimension).toBe(384)
            expect(result.createdAt).toBeInstanceOf(Date)
            expect(result.updatedAt).toBeInstanceOf(Date)
        })

        it("should throw error for invalid data", async () => {
            const invalidData = {
                interactionHistory: "invalid",
                viewingPatterns: [],
                contentPreferences: [],
            } as any

            await expect(userEmbeddingService.build(invalidData)).rejects.toThrow(
                "Dados inválidos para construção do embedding",
            )
        })
    })

    describe("updateUserEmbeddings", () => {
        it("should update existing user embedding", async () => {
            mockUserEmbedding.findOne.mockResolvedValue(mockUserEmbedding)
            mockInteractionEvent.findAll.mockResolvedValue([mockInteractionEvent])

            const result = await userEmbeddingService.updateUserEmbeddings(BigInt(123))

            expect(result).toBeDefined()
            expect(mockUserEmbedding.update).toHaveBeenCalled()
        })

        it("should generate new embedding if none exists", async () => {
            mockUserEmbedding.findOne.mockResolvedValue(null)
            mockUserEmbedding.create.mockResolvedValue(mockUserEmbedding)
            mockInteractionEvent.findAll.mockResolvedValue([mockInteractionEvent])

            const result = await userEmbeddingService.updateUserEmbeddings(BigInt(123))

            expect(result).toBeDefined()
            expect(mockUserEmbedding.create).toHaveBeenCalled()
        })
    })

    describe("generateInitialEmbedding", () => {
        it("should generate initial embedding for new user", async () => {
            mockUserEmbedding.findOne.mockResolvedValue(null)
            mockUserEmbedding.create.mockResolvedValue(mockUserEmbedding)

            const initialProfile = {
                preferredLanguages: ["pt", "en"],
                initialInterests: ["technology", "sports"],
                demographicInfo: {
                    ageRange: "25-34",
                    location: "São Paulo",
                },
            }

            const result = await userEmbeddingService.generateInitialEmbedding(
                BigInt(123),
                initialProfile,
            )

            expect(result).toBeDefined()
            expect(result.userId).toBe("123")
            expect(mockUserEmbedding.create).toHaveBeenCalled()
        })

        it("should generate initial embedding without profile", async () => {
            mockUserEmbedding.findOne.mockResolvedValue(null)
            mockUserEmbedding.create.mockResolvedValue(mockUserEmbedding)

            const result = await userEmbeddingService.generateInitialEmbedding(BigInt(123))

            expect(result).toBeDefined()
            expect(result.userId).toBe("123")
        })

        it("should update existing embedding", async () => {
            mockUserEmbedding.findOne.mockResolvedValue(mockUserEmbedding)
            mockUserEmbedding.update.mockResolvedValue(mockUserEmbedding)

            const result = await userEmbeddingService.generateInitialEmbedding(BigInt(123))

            expect(result).toBeDefined()
            expect(mockUserEmbedding.update).toHaveBeenCalled()
        })
    })

    describe("Private Methods", () => {
        describe("prepareUserTextForEmbedding", () => {
            it("should prepare text from user data", () => {
                const userData = {
                    interactionHistory: [
                        {
                            id: "1",
                            userId: "123",
                            entityId: "456",
                            entityType: "post",
                            type: "like" as any,
                            timestamp: new Date(),
                        },
                    ],
                    viewingPatterns: [
                        {
                            contentType: "video",
                            averageDuration: 120,
                            completionRate: 0.8,
                            frequency: 5,
                        },
                    ],
                    contentPreferences: ["sports", "music"],
                    demographicInfo: {
                        ageRange: "25-34",
                        location: "São Paulo",
                        languages: ["pt", "en"],
                        interests: ["technology"],
                    },
                }

                // Acessar método privado via any
                const result = (userEmbeddingService as any).prepareUserTextForEmbedding(userData)

                expect(typeof result).toBe("string")
                expect(result.length).toBeGreaterThan(0)
            })
        })

        describe("getInteractionWeight", () => {
            it("should return correct weight for known interaction types", () => {
                const weights = {
                    view: 0.1,
                    like: 0.3,
                    comment: 0.5,
                    share: 0.7,
                    save: 0.8,
                }

                Object.entries(weights).forEach(([type, expectedWeight]) => {
                    const result = (userEmbeddingService as any).getInteractionWeight(type)
                    expect(result).toBe(expectedWeight)
                })
            })

            it("should return default weight for unknown interaction type", () => {
                const result = (userEmbeddingService as any).getInteractionWeight("unknown")
                expect(result).toBe(0.2) // default weight
            })
        })

        describe("calculateActivenessFactor", () => {
            it("should calculate activeness factor correctly", () => {
                const interactions: UserInteraction[] = [
                    {
                        id: "1",
                        userId: "123",
                        entityId: "456",
                        entityType: "post",
                        type: "like" as any,
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                    },
                    {
                        id: "2",
                        userId: "123",
                        entityId: "789",
                        entityType: "post",
                        type: "view" as any,
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    },
                ]

                const result = (userEmbeddingService as any).calculateActivenessFactor(
                    interactions,
                    {
                        daysToConsider: 30,
                        recencyWeight: 0.6,
                        frequencyWeight: 0.3,
                        diversityWeight: 0.1,
                    },
                )

                expect(typeof result).toBe("number")
                expect(result).toBeGreaterThanOrEqual(0)
                expect(result).toBeLessThanOrEqual(1)
            })

            it("should return 0 for empty interactions", () => {
                const result = (userEmbeddingService as any).calculateActivenessFactor([], {
                    daysToConsider: 30,
                    recencyWeight: 0.6,
                    frequencyWeight: 0.3,
                    diversityWeight: 0.1,
                })

                expect(result).toBe(0)
            })
        })
    })

    describe("Error Handling", () => {
        it("should handle model loading errors gracefully", async () => {
            const { pipeline } = await import("@xenova/transformers")
            vi.mocked(pipeline).mockRejectedValue(new Error("Model loading failed"))

            const userData = {
                interactionHistory: [],
                viewingPatterns: [],
                contentPreferences: [],
            }

            const result = await userEmbeddingService.generateEmbedding(userData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })

        it("should handle database errors in getUserEmbedding", async () => {
            mockUserEmbedding.findOne.mockRejectedValue(new Error("Database connection failed"))

            const result = await userEmbeddingService.getUserEmbedding(BigInt(123))

            expect(result).toBeNull()
        })

        it("should handle errors in updateUserEmbeddings", async () => {
            mockUserEmbedding.findOne.mockRejectedValue(new Error("Database error"))

            await expect(userEmbeddingService.updateUserEmbeddings(BigInt(123))).rejects.toThrow(
                "Database error",
            )
        })
    })

    describe("Edge Cases", () => {
        it("should handle empty interaction history", async () => {
            const userData = {
                interactionHistory: [],
                viewingPatterns: [],
                contentPreferences: [],
            }

            const result = await userEmbeddingService.generateEmbedding(userData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })

        it("should handle missing demographic info", async () => {
            const userData = {
                interactionHistory: [],
                viewingPatterns: [],
                contentPreferences: [],
                demographicInfo: undefined,
            }

            const result = await userEmbeddingService.generateEmbedding(userData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })

        it("should handle very large interaction history", async () => {
            const largeInteractionHistory = Array.from({ length: 1000 }, (_, i) => ({
                id: i.toString(),
                userId: "123",
                entityId: i.toString(),
                entityType: "post",
                type: "view" as any,
                timestamp: new Date(),
            }))

            const userData = {
                interactionHistory: largeInteractionHistory,
                viewingPatterns: [],
                contentPreferences: [],
            }

            const result = await userEmbeddingService.generateEmbedding(userData)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
        })
    })
})
