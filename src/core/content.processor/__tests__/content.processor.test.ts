/**
 * Content Processor Tests
 * Testes para o ContentProcessor - orquestrador principal de processamento de conteúdo
 */

import { ContentProcessingRequest, ContentProcessor } from "@/core/content.processor"
import { StorageAdapter, StorageUploadResult } from "@/core/content.processor/type"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ModerationEngine } from "@/core/content.moderation"
import { ContentDetectionRequest } from "@/core/content.moderation/types"

// Mock das dependências
vi.mock("@/core/content.processor/video.processor", () => ({
    VideoProcessor: vi.fn().mockImplementation(() => ({
        processVideo: vi.fn(),
    })),
}))

vi.mock("@/core/content.moderation", () => ({
    ModerationEngine: vi.fn().mockImplementation(() => ({
        moderateContent: vi.fn(),
    })),
}))

describe("ContentProcessor", () => {
    let contentProcessor: ContentProcessor
    let mockStorageAdapter: StorageAdapter
    let mockModerationEngine: ModerationEngine
    let mockVideoProcessor: any

    beforeEach(() => {
        // Mock do StorageAdapter
        mockStorageAdapter = {
            uploadVideo: vi.fn(),
            uploadThumbnail: vi.fn(),
            deleteVideo: vi.fn(),
            deleteThumbnail: vi.fn(),
            getVideoUrl: vi.fn(),
            getThumbnailUrl: vi.fn(),
        }

        // Mock do ModerationEngine
        mockModerationEngine = {
            moderateContent: vi.fn(),
        } as any

        // Mock do VideoProcessor
        mockVideoProcessor = {
            processVideo: vi.fn(),
        }

        // Criar instância do ContentProcessor
        contentProcessor = new ContentProcessor(mockStorageAdapter, undefined, mockModerationEngine)

        // Substituir o videoProcessor mockado
        // @ts-ignore - acessando propriedade privada para teste
        contentProcessor.videoProcessor = mockVideoProcessor
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("Constructor", () => {
        it("should create ContentProcessor with storage adapter", () => {
            const processor = new ContentProcessor(mockStorageAdapter)
            expect(processor).toBeDefined()
        })

        it("should create ContentProcessor with config", () => {
            const config = {
                thumbnail: { width: 640, height: 480 },
                validation: { maxFileSize: 1000000 },
            }
            const processor = new ContentProcessor(mockStorageAdapter, config)
            expect(processor).toBeDefined()
        })

        it("should create ContentProcessor with moderation engine", () => {
            const processor = new ContentProcessor(
                mockStorageAdapter,
                undefined,
                mockModerationEngine,
            )
            expect(processor).toBeDefined()
        })
    })

    describe("processContent", () => {
        const mockRequest: ContentProcessingRequest = {
            contentId: "test-content-123",
            ownerId: "user-456",
            videoData: Buffer.from("mock video data"),
            metadata: {
                filename: "test-video.mp4",
                mimeType: "video/mp4",
                size: 1024000,
            },
        }

        const mockVideoResult = {
            success: true,
            contentId: "test-content-123",
            thumbnail: {
                data: Buffer.from("mock thumbnail data"),
                width: 480,
                height: 854,
                format: "jpeg",
            },
            videoMetadata: {
                duration: 15,
                width: 1080,
                height: 1920,
                format: "mp4",
                codec: "h264",
                hasAudio: true,
                size: 1024000,
                bitrate: 2500000,
                fps: 30,
            },
            processedVideo: {
                data: Buffer.from("processed video data"),
                wasCompressed: true,
                wasConverted: false,
                originalResolution: { width: 1920, height: 1080 },
            },
            processingTime: 5000,
        }

        const mockModerationResult = {
            moderation: {
                id: "mod-789",
                status: "approved",
                flags: [],
                confidence: 95,
            },
        }

        const mockStorageResult: StorageUploadResult = {
            success: true,
            key: "videos/user-456/test-content-123.mp4",
            url: "https://storage.example.com/videos/user-456/test-content-123.mp4",
            bucket: "test-bucket",
            region: "us-east-1",
            provider: "s3",
        }

        const mockThumbnailStorageResult: StorageUploadResult = {
            success: true,
            key: "thumbnails/user-456/test-content-123.jpg",
            url: "https://storage.example.com/thumbnails/user-456/test-content-123.jpg",
            provider: "s3",
        }

        beforeEach(() => {
            // Configurar mocks padrão
            mockVideoProcessor.processVideo.mockResolvedValue(mockVideoResult)
            mockModerationEngine.moderateContent.mockResolvedValue(mockModerationResult)
            mockStorageAdapter.uploadVideo.mockResolvedValue(mockStorageResult)
            mockStorageAdapter.uploadThumbnail.mockResolvedValue(mockThumbnailStorageResult)
            mockStorageAdapter.getVideoUrl.mockResolvedValue(
                "https://storage.example.com/video-url",
            )
            mockStorageAdapter.getThumbnailUrl.mockResolvedValue(
                "https://storage.example.com/thumbnail-url",
            )
        })

        it("should process content successfully with moderation", async () => {
            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(true)
            expect(result.contentId).toBe("test-content-123")
            expect(result.videoUrls).toBeDefined()
            expect(result.thumbnailUrl).toBeDefined()
            expect(result.storage).toBeDefined()
            expect(result.videoMetadata).toBeDefined()
            expect(result.moderation).toBeDefined()
            expect(result.processingTime).toBeGreaterThanOrEqual(0)

            // Verificar chamadas dos métodos
            expect(mockVideoProcessor.processVideo).toHaveBeenCalledWith({
                contentId: mockRequest.contentId,
                ownerId: mockRequest.ownerId,
                videoData: mockRequest.videoData,
                metadata: mockRequest.metadata,
            })
            expect(mockModerationEngine.moderateContent).toHaveBeenCalled()
            expect(mockStorageAdapter.uploadVideo).toHaveBeenCalled()
            expect(mockStorageAdapter.uploadThumbnail).toHaveBeenCalled()
        })

        it("should process content without moderation engine", async () => {
            const processorWithoutModeration = new ContentProcessor(mockStorageAdapter)
            // @ts-ignore - acessando propriedade privada para teste
            processorWithoutModeration.videoProcessor = mockVideoProcessor

            const result = await processorWithoutModeration.processContent(mockRequest)

            expect(result.success).toBe(true)
            expect(result.moderation.approved).toBe(true)
            expect(result.moderation.requiresReview).toBe(false)
            expect(result.moderation.flags).toEqual([])
            expect(result.moderation.confidence).toBe(100)

            // Moderation engine não deve ser chamado
            expect(mockModerationEngine.moderateContent).not.toHaveBeenCalled()
        })

        it("should handle video processing failure", async () => {
            mockVideoProcessor.processVideo.mockResolvedValue({
                success: false,
                error: "Video processing failed",
            })

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Video processing failed")
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
        })

        it("should handle moderation rejection", async () => {
            mockModerationEngine.moderateContent.mockResolvedValue({
                moderation: {
                    id: "mod-789",
                    status: "rejected",
                    flags: [{ type: "inappropriate_content" }],
                    confidence: 90,
                },
            })

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Conteúdo bloqueado pela moderação")
            expect(result.error).toContain("inappropriate_content")
        })

        it("should handle moderation pending review", async () => {
            mockModerationEngine.moderateContent.mockResolvedValue({
                moderation: {
                    id: "mod-789",
                    status: "pending",
                    flags: [{ type: "needs_review" }],
                    confidence: 70,
                },
            })

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(true)
            expect(result.moderation.requiresReview).toBe(true)
            expect(result.moderation.approved).toBe(false)
        })

        it("should handle video upload failure", async () => {
            mockStorageAdapter.uploadVideo.mockResolvedValue({
                success: false,
                error: "Upload failed",
            })

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Upload failed")
        })

        it("should handle thumbnail upload failure", async () => {
            mockStorageAdapter.uploadThumbnail.mockResolvedValue({
                success: false,
                error: "Thumbnail upload failed",
            })

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Thumbnail upload failed")
        })

        it("should use processed video data when available", async () => {
            const result = await contentProcessor.processContent(mockRequest)

            expect(mockStorageAdapter.uploadVideo).toHaveBeenCalledWith(
                expect.stringContaining("videos/user-456/"),
                mockVideoResult.processedVideo.data,
                expect.objectContaining({
                    contentType: "video/mp4",
                    ownerId: "user-456",
                    contentId: expect.any(String),
                    wasProcessed: true,
                    wasCompressed: true,
                    wasConverted: false,
                }),
            )
        })

        it("should use original video data when no processing", async () => {
            const videoResultWithoutProcessing = {
                ...mockVideoResult,
                processedVideo: undefined,
            }
            mockVideoProcessor.processVideo.mockResolvedValue(videoResultWithoutProcessing)

            const result = await contentProcessor.processContent(mockRequest)

            expect(mockStorageAdapter.uploadVideo).toHaveBeenCalledWith(
                expect.stringContaining("videos/user-456/"),
                mockRequest.videoData,
                expect.objectContaining({
                    contentId: expect.any(String),
                    wasProcessed: false,
                    wasCompressed: false,
                    wasConverted: false,
                }),
            )
        })

        it("should generate correct storage keys", async () => {
            await contentProcessor.processContent(mockRequest)

            expect(mockStorageAdapter.uploadVideo).toHaveBeenCalledWith(
                expect.stringContaining("videos/user-456/"),
                expect.any(Buffer),
                expect.any(Object),
            )

            expect(mockStorageAdapter.uploadThumbnail).toHaveBeenCalledWith(
                expect.stringContaining("thumbnails/user-456/"),
                expect.any(Buffer),
                expect.any(Object),
            )
        })

        it("should generate video URLs for different qualities", async () => {
            await contentProcessor.processContent(mockRequest)

            expect(mockStorageAdapter.getVideoUrl).toHaveBeenCalledWith(
                expect.stringContaining("videos/user-456/"),
                "low",
            )
            expect(mockStorageAdapter.getVideoUrl).toHaveBeenCalledWith(
                expect.stringContaining("videos/user-456/"),
                "medium",
            )
            expect(mockStorageAdapter.getVideoUrl).toHaveBeenCalledWith(
                expect.stringContaining("videos/user-456/"),
                "high",
            )
        })

        it("should handle unexpected errors", async () => {
            mockVideoProcessor.processVideo.mockRejectedValue(new Error("Unexpected error"))

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Unexpected error")
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
        })

        it("should track processing time", async () => {
            const result = await contentProcessor.processContent(mockRequest)

            expect(result.processingTime).toBeGreaterThanOrEqual(0)
            expect(typeof result.processingTime).toBe("number")
        })
    })

    describe("moderateContent", () => {
        it("should call moderation engine", async () => {
            const request: ContentDetectionRequest = {
                contentId: "test-content-123",
                contentOwnerId: "user-456",
                contentData: Buffer.from("test data"),
                metadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1000,
                    duration: 10,
                    resolution: { width: 1920, height: 1080 },
                },
            }

            mockModerationEngine.moderateContent.mockResolvedValue({
                moderation: {
                    id: "mod-123",
                    status: "approved",
                    flags: [],
                    confidence: 95,
                },
            })

            // @ts-ignore - acessando método privado para teste
            const result = await contentProcessor.moderateContent(request)

            expect(mockModerationEngine.moderateContent).toHaveBeenCalledWith(request)
            expect(result).toBeDefined()
        })

        it("should throw error when moderation engine is not configured", async () => {
            const processorWithoutModeration = new ContentProcessor(mockStorageAdapter)
            const request: ContentDetectionRequest = {
                contentId: "test-content-123",
                contentOwnerId: "user-456",
                contentData: Buffer.from("test data"),
                metadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1000,
                    duration: 10,
                    resolution: { width: 1920, height: 1080 },
                },
            }

            // @ts-ignore - acessando método privado para teste
            await expect(processorWithoutModeration.moderateContent(request)).rejects.toThrow(
                "Motor de moderação não configurado",
            )
        })
    })

    describe("deleteContent", () => {
        it("should delete video and thumbnail", async () => {
            const videoKey = "videos/user-456/test-content-123.mp4"
            const thumbnailKey = "thumbnails/user-456/test-content-123.jpg"

            mockStorageAdapter.deleteVideo.mockResolvedValue(undefined)
            mockStorageAdapter.deleteThumbnail.mockResolvedValue(undefined)

            await contentProcessor.deleteContent(videoKey, thumbnailKey)

            expect(mockStorageAdapter.deleteVideo).toHaveBeenCalledWith(videoKey)
            expect(mockStorageAdapter.deleteThumbnail).toHaveBeenCalledWith(thumbnailKey)
        })

        it("should handle delete errors", async () => {
            const videoKey = "videos/user-456/test-content-123.mp4"
            const thumbnailKey = "thumbnails/user-456/test-content-123.jpg"

            mockStorageAdapter.deleteVideo.mockRejectedValue(new Error("Delete failed"))

            await expect(contentProcessor.deleteContent(videoKey, thumbnailKey)).rejects.toThrow(
                "Delete failed",
            )
        })

        it("should log errors when deleting content", async () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
            const videoKey = "videos/user-456/test-content-123.mp4"
            const thumbnailKey = "thumbnails/user-456/test-content-123.jpg"

            mockStorageAdapter.deleteVideo.mockRejectedValue(new Error("Delete failed"))

            await expect(contentProcessor.deleteContent(videoKey, thumbnailKey)).rejects.toThrow()

            expect(consoleSpy).toHaveBeenCalledWith("Erro ao deletar conteúdo:", expect.any(Error))
            consoleSpy.mockRestore()
        })
    })
})
