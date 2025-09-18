import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ClusterRecalculator } from "../cluster.processor"

describe("ClusterRecalculator", () => {
    let clusterRecalculator: ClusterRecalculator
    let mockUserEmbeddingRepository: any
    let mockPostEmbeddingRepository: any
    let mockClusterRepository: any

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks()

        // Mock embedding repositories
        mockUserEmbeddingRepository = {
            findAllEmbeddings: vi.fn(),
        }

        mockPostEmbeddingRepository = {
            findAllEmbeddings: vi.fn(),
        }

        // Mock cluster repository
        mockClusterRepository = {
            saveClusteringResult: vi.fn(),
        }

        // Create ClusterRecalculator instance
        clusterRecalculator = new ClusterRecalculator({
            batchSize: 10,
            clusterRepository: mockClusterRepository,
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("Constructor", () => {
        it("should create instance with default config", () => {
            const recalculator = new ClusterRecalculator()
            expect(recalculator).toBeInstanceOf(ClusterRecalculator)
        })

        it("should create instance with custom config", () => {
            const customConfig = {
                batchSize: 50,
                clusterRepository: mockClusterRepository,
            }
            const recalculator = new ClusterRecalculator(customConfig)
            expect(recalculator).toBeInstanceOf(ClusterRecalculator)
        })
    })

    describe("recalculateUserClusters", () => {
        it("should return empty result when no embeddings found", async () => {
            // Arrange
            mockUserEmbeddingRepository.findAllEmbeddings.mockResolvedValue([])

            // Act
            const result = await clusterRecalculator.recalculateUserClusters(
                mockUserEmbeddingRepository,
            )

            // Assert
            expect(result.clusters).toEqual([])
            expect(result.assignments).toEqual({})
            expect(result.quality).toBe(0)
            expect(result.converged).toBe(true)
            expect(result.iterations).toBe(0)
            expect(result.metadata.totalItems).toBe(0)
        })

        it("should process embeddings and return clustering result", async () => {
            // Arrange
            const mockEmbeddings = [
                {
                    userId: "user1",
                    embedding: [1, 2, 3],
                    metadata: { test: "data" },
                },
                {
                    userId: "user2",
                    embedding: [4, 5, 6],
                    metadata: { test: "data2" },
                },
            ]
            mockUserEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(mockEmbeddings)
                .mockResolvedValueOnce([]) // No more data

            // Act
            const result = await clusterRecalculator.recalculateUserClusters(
                mockUserEmbeddingRepository,
            )

            // Assert
            expect(result.clusters).toBeDefined()
            expect(result.assignments).toBeDefined()
            expect(result.quality).toBeGreaterThanOrEqual(0)
            expect(result.converged).toBe(true)
            expect(result.iterations).toBe(1)
            expect(result.metadata.totalItems).toBe(2)
            expect(result.metadata.entityType).toBe("user")
        })

        it("should handle repository errors gracefully", async () => {
            // Arrange
            const repositoryError = new Error("Database connection failed")
            mockUserEmbeddingRepository.findAllEmbeddings.mockRejectedValue(repositoryError)

            // Act & Assert
            await expect(
                clusterRecalculator.recalculateUserClusters(mockUserEmbeddingRepository),
            ).rejects.toThrow("Database connection failed")
        })

        it("should persist clusters when repository is configured", async () => {
            // Arrange
            const mockEmbeddings = [
                {
                    userId: "user1",
                    embedding: [1, 2, 3],
                    metadata: { test: "data" },
                },
            ]
            mockUserEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(mockEmbeddings)
                .mockResolvedValueOnce([])

            // Act
            await clusterRecalculator.recalculateUserClusters(mockUserEmbeddingRepository)

            // Assert
            expect(mockClusterRepository.saveClusteringResult).toHaveBeenCalledWith(
                expect.objectContaining({
                    entityType: "user",
                    clusters: expect.any(Array),
                    assignments: expect.any(Object),
                    quality: expect.any(Number),
                    metadata: expect.any(Object),
                    createdAt: expect.any(Date),
                }),
            )
        })

        it("should handle persistence errors gracefully", async () => {
            // Arrange
            const mockEmbeddings = [
                {
                    userId: "user1",
                    embedding: [1, 2, 3],
                    metadata: { test: "data" },
                },
            ]
            mockUserEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(mockEmbeddings)
                .mockResolvedValueOnce([])
            mockClusterRepository.saveClusteringResult.mockRejectedValue(
                new Error("Persistence failed"),
            )

            // Act
            const result = await clusterRecalculator.recalculateUserClusters(
                mockUserEmbeddingRepository,
            )

            // Assert - Should not throw, but log error
            expect(result).toBeDefined()
            expect(result.clusters).toBeDefined()
        })
    })

    describe("recalculatePostClusters", () => {
        it("should return empty result when no embeddings found", async () => {
            // Arrange
            mockPostEmbeddingRepository.findAllEmbeddings.mockResolvedValue([])

            // Act
            const result = await clusterRecalculator.recalculatePostClusters(
                mockPostEmbeddingRepository,
            )

            // Assert
            expect(result.clusters).toEqual([])
            expect(result.assignments).toEqual({})
            expect(result.quality).toBe(0)
            expect(result.converged).toBe(true)
            expect(result.iterations).toBe(0)
            expect(result.metadata.totalItems).toBe(0)
        })

        it("should process embeddings and return clustering result", async () => {
            // Arrange
            const mockEmbeddings = [
                {
                    postId: "post1",
                    embedding: [1, 2, 3],
                    metadata: { test: "data" },
                },
                {
                    postId: "post2",
                    embedding: [4, 5, 6],
                    metadata: { test: "data2" },
                },
            ]
            mockPostEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(mockEmbeddings)
                .mockResolvedValueOnce([]) // No more data

            // Act
            const result = await clusterRecalculator.recalculatePostClusters(
                mockPostEmbeddingRepository,
            )

            // Assert
            expect(result.clusters).toBeDefined()
            expect(result.assignments).toBeDefined()
            expect(result.quality).toBeGreaterThanOrEqual(0)
            expect(result.converged).toBe(true)
            expect(result.iterations).toBe(1)
            expect(result.metadata.totalItems).toBe(2)
            expect(result.metadata.entityType).toBe("post")
        })

        it("should handle repository errors gracefully", async () => {
            // Arrange
            const repositoryError = new Error("Database connection failed")
            mockPostEmbeddingRepository.findAllEmbeddings.mockRejectedValue(repositoryError)

            // Act & Assert
            await expect(
                clusterRecalculator.recalculatePostClusters(mockPostEmbeddingRepository),
            ).rejects.toThrow("Database connection failed")
        })

        it("should persist clusters when repository is configured", async () => {
            // Arrange
            const mockEmbeddings = [
                {
                    postId: "post1",
                    embedding: [1, 2, 3],
                    metadata: { test: "data" },
                },
            ]
            mockPostEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(mockEmbeddings)
                .mockResolvedValueOnce([])

            // Act
            await clusterRecalculator.recalculatePostClusters(mockPostEmbeddingRepository)

            // Assert
            expect(mockClusterRepository.saveClusteringResult).toHaveBeenCalledWith(
                expect.objectContaining({
                    entityType: "post",
                    clusters: expect.any(Array),
                    assignments: expect.any(Object),
                    quality: expect.any(Number),
                    metadata: expect.any(Object),
                    createdAt: expect.any(Date),
                }),
            )
        })

        it("should handle persistence errors gracefully", async () => {
            // Arrange
            const mockEmbeddings = [
                {
                    postId: "post1",
                    embedding: [1, 2, 3],
                    metadata: { test: "data" },
                },
            ]
            mockPostEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(mockEmbeddings)
                .mockResolvedValueOnce([])
            mockClusterRepository.saveClusteringResult.mockRejectedValue(
                new Error("Persistence failed"),
            )

            // Act
            const result = await clusterRecalculator.recalculatePostClusters(
                mockPostEmbeddingRepository,
            )

            // Assert - Should not throw, but log error
            expect(result).toBeDefined()
            expect(result.clusters).toBeDefined()
        })

        it("should handle custom DBSCAN config", async () => {
            // Arrange
            const mockEmbeddings = [
                {
                    postId: "post1",
                    embedding: [1, 2, 3],
                    metadata: { test: "data" },
                },
            ]
            mockPostEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(mockEmbeddings)
                .mockResolvedValueOnce([])

            const customConfig = {
                epsilon: 0.5,
                minPoints: 3,
                distanceFunction: "cosine" as const,
            }

            // Act
            const result = await clusterRecalculator.recalculatePostClusters(
                mockPostEmbeddingRepository,
                customConfig,
            )

            // Assert
            expect(result).toBeDefined()
            expect(result.clusters).toBeDefined()
        })
    })

    describe("Edge Cases", () => {
        it("should handle embeddings with missing data", async () => {
            // Arrange
            const mockEmbeddings = [
                {
                    userId: "user1",
                    embedding: null, // Missing embedding
                    metadata: { test: "data" },
                },
                {
                    userId: "user2",
                    embedding: [1, 2, 3],
                    metadata: { test: "data2" },
                },
            ]
            mockUserEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(mockEmbeddings)
                .mockResolvedValueOnce([])

            // Act
            const result = await clusterRecalculator.recalculateUserClusters(
                mockUserEmbeddingRepository,
            )

            // Assert
            expect(result).toBeDefined()
            expect(result.clusters).toBeDefined()
            // Should only process valid embeddings
        })

        it("should handle empty embedding arrays", async () => {
            // Arrange
            const mockEmbeddings = [
                {
                    userId: "user1",
                    embedding: [],
                    metadata: { test: "data" },
                },
            ]
            mockUserEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(mockEmbeddings)
                .mockResolvedValueOnce([])

            // Act
            const result = await clusterRecalculator.recalculateUserClusters(
                mockUserEmbeddingRepository,
            )

            // Assert
            expect(result).toBeDefined()
            expect(result.clusters).toBeDefined()
        })

        it("should handle large batches", async () => {
            // Arrange
            const largeBatch = Array.from({ length: 150 }, (_, i) => ({
                userId: `user${i}`,
                embedding: [i, i + 1, i + 2],
                metadata: { test: `data${i}` },
            }))
            mockUserEmbeddingRepository.findAllEmbeddings
                .mockResolvedValueOnce(largeBatch)
                .mockResolvedValueOnce([])

            // Act
            const result = await clusterRecalculator.recalculateUserClusters(
                mockUserEmbeddingRepository,
            )

            // Assert
            expect(result).toBeDefined()
            expect(result.clusters).toBeDefined()
            expect(result.metadata.totalItems).toBe(150)
        })
    })
})
