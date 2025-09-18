import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { WideUpdater } from "../wide.updater"

describe("WideUpdater Simple Tests", () => {
    let wideUpdater: WideUpdater
    let mockUserEmbeddingService: any
    let mockPostEmbeddingService: any
    let mockUserRepository: any
    let mockPostRepository: any

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks()

        // Mock repositories
        mockUserRepository = {
            findAllIds: vi.fn(),
        } as any

        mockPostRepository = {
            findAllIds: vi.fn(),
        } as any

        // Mock embedding services
        mockUserEmbeddingService = {
            getUserEmbedding: vi.fn(),
            userRepository: mockUserRepository,
        }

        mockPostEmbeddingService = {
            getPostEmbedding: vi.fn(),
            postRepository: mockPostRepository,
        }

        // Create WideUpdater instance
        wideUpdater = new WideUpdater({
            batchSize: 10,
            maxItemsPerRun: 100,
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("Constructor", () => {
        it("should create instance with default config", () => {
            const updater = new WideUpdater()
            expect(updater).toBeInstanceOf(WideUpdater)
        })

        it("should create instance with custom config", () => {
            const customConfig = {
                batchSize: 50,
                maxItemsPerRun: 2000,
            }
            const updater = new WideUpdater(customConfig)
            expect(updater).toBeInstanceOf(WideUpdater)
        })
    })

    describe("updateUserEmbeddings", () => {
        it("should throw error when userRepository is missing", async () => {
            // Arrange
            const serviceWithoutRepository = {
                getUserEmbedding: vi.fn(),
                // No userRepository
            }

            // Act & Assert
            await expect(
                wideUpdater.updateUserEmbeddings(serviceWithoutRepository),
            ).rejects.toThrow("Repositório de usuários não encontrado ou não tem método findAllIds")
        })

        it("should throw error when userRepository.findAllIds is not a function", async () => {
            // Arrange
            const serviceWithInvalidRepository = {
                getUserEmbedding: vi.fn(),
                userRepository: {
                    // Missing findAllIds method
                },
            }

            // Act & Assert
            await expect(
                wideUpdater.updateUserEmbeddings(serviceWithInvalidRepository),
            ).rejects.toThrow("Repositório de usuários não encontrado ou não tem método findAllIds")
        })

        it("should propagate repository errors", async () => {
            // Arrange
            const repositoryError = new Error("Database connection failed")
            mockUserRepository.findAllIds.mockRejectedValue(repositoryError)

            // Act & Assert
            await expect(
                wideUpdater.updateUserEmbeddings(mockUserEmbeddingService),
            ).rejects.toThrow("Database connection failed")
        })
    })

    describe("updatePostEmbeddings", () => {
        it("should throw error when postRepository is missing", async () => {
            // Arrange
            const serviceWithoutRepository = {
                getPostEmbedding: vi.fn(),
                // No postRepository
            }

            // Act & Assert
            await expect(
                wideUpdater.updatePostEmbeddings(serviceWithoutRepository),
            ).rejects.toThrow("Repositório de posts não encontrado ou não tem método findAllIds")
        })

        it("should throw error when postRepository.findAllIds is not a function", async () => {
            // Arrange
            const serviceWithInvalidRepository = {
                getPostEmbedding: vi.fn(),
                postRepository: {
                    // Missing findAllIds method
                },
            }

            // Act & Assert
            await expect(
                wideUpdater.updatePostEmbeddings(serviceWithInvalidRepository),
            ).rejects.toThrow("Repositório de posts não encontrado ou não tem método findAllIds")
        })

        it("should propagate repository errors", async () => {
            // Arrange
            const repositoryError = new Error("Database connection failed")
            mockPostRepository.findAllIds.mockRejectedValue(repositoryError)

            // Act & Assert
            await expect(
                wideUpdater.updatePostEmbeddings(mockPostEmbeddingService),
            ).rejects.toThrow("Database connection failed")
        })
    })
})
