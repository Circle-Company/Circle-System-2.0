/**
 * Content Processor Integration Tests
 * Testes de integração para o ContentProcessor completo
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ContentProcessor, LocalStorageAdapter } from "@/core/content.processor"
import { ModerationEngine } from "@/core/content.moderation"
import { ContentProcessingRequest } from "@/core/content.processor"

describe("ContentProcessor Integration", () => {
    let contentProcessor: ContentProcessor
    let storageAdapter: LocalStorageAdapter
    let moderationEngine: ModerationEngine

    beforeEach(() => {
        storageAdapter = new LocalStorageAdapter("http://localhost:3000/storage")
        moderationEngine = new ModerationEngine()
        
        contentProcessor = new ContentProcessor(storageAdapter, undefined, moderationEngine)
        
        // Mock dos logs para testes mais limpos
        vi.spyOn(console, "log").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("Full Content Processing Pipeline", () => {
        const mockRequest: ContentProcessingRequest = {
            contentId: "integration-test-123",
            ownerId: "user-456",
            videoData: Buffer.from("mock video data for integration test"),
            metadata: {
                filename: "integration-test.mp4",
                mimeType: "video/mp4",
                size: 1024000,
            },
        }

        it("should process content successfully with all components", async () => {
            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(true)
            expect(result.contentId).toBe("integration-test-123")
            expect(result.videoUrls).toBeDefined()
            expect(result.videoUrls.low).toBeDefined()
            expect(result.videoUrls.medium).toBeDefined()
            expect(result.videoUrls.high).toBeDefined()
            expect(result.thumbnailUrl).toBeDefined()
            expect(result.storage).toBeDefined()
            expect(result.storage.videoKey).toBe("videos/user-456/integration-test-123.mp4")
            expect(result.storage.thumbnailKey).toBe("thumbnails/user-456/integration-test-123.jpg")
            expect(result.storage.provider).toBe("local")
            expect(result.videoMetadata).toBeDefined()
            expect(result.videoMetadata.format).toBe("mp4")
            expect(result.videoMetadata.codec).toBe("h264")
            expect(result.moderation).toBeDefined()
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
        })

        it("should handle different video formats", async () => {
            const formats = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"]

            for (const mimeType of formats) {
                const request = {
                    ...mockRequest,
                    contentId: `format-test-${mimeType.replace("video/", "")}`,
                    metadata: {
                        ...mockRequest.metadata,
                        mimeType,
                    },
                }

                const result = await contentProcessor.processContent(request)

                expect(result.success).toBe(true)
                expect(result.videoMetadata.format).toBe("mp4") // Sempre deve converter para MP4
                expect(result.videoMetadata.codec).toBe("h264") // Sempre deve usar H.264
            }
        })

        it("should handle different video sizes", async () => {
            const sizes = [
                { size: 1024, description: "1KB" },
                { size: 1024 * 1024, description: "1MB" },
                { size: 10 * 1024 * 1024, description: "10MB" },
                { size: 50 * 1024 * 1024, description: "50MB" },
            ]

            for (const { size, description } of sizes) {
                const videoData = Buffer.alloc(size)
                const request = {
                    ...mockRequest,
                    contentId: `size-test-${description}`,
                    videoData,
                    metadata: {
                        ...mockRequest.metadata,
                        size,
                    },
                }

                const result = await contentProcessor.processContent(request)

                expect(result.success).toBe(true)
                expect(result.videoMetadata.size).toBe(size)
            }
        })

        it("should handle compression for high-resolution videos", async () => {
            // Simular vídeo 4K que deve ser comprimido
            const largeVideoData = Buffer.alloc(100 * 1024 * 1024) // 100MB (simula 4K)
            const request = {
                ...mockRequest,
                contentId: "compression-test-4k",
                videoData: largeVideoData,
                metadata: {
                    ...mockRequest.metadata,
                    size: largeVideoData.length,
                },
            }

            const result = await contentProcessor.processContent(request)

            expect(result.success).toBe(true)
            expect(result.videoMetadata.format).toBe("mp4")
            expect(result.videoMetadata.codec).toBe("h264")
        })
    })

    describe("Moderation Integration", () => {
        const mockRequest: ContentProcessingRequest = {
            contentId: "moderation-test-123",
            ownerId: "user-456",
            videoData: Buffer.from("mock video data for moderation test"),
            metadata: {
                filename: "moderation-test.mp4",
                mimeType: "video/mp4",
                size: 1024000,
            },
        }

        it("should process content without moderation engine", async () => {
            const processorWithoutModeration = new ContentProcessor(storageAdapter)
            
            const result = await processorWithoutModeration.processContent(mockRequest)

            expect(result.success).toBe(true)
            expect(result.moderation.approved).toBe(true)
            expect(result.moderation.requiresReview).toBe(false)
            expect(result.moderation.flags).toEqual([])
            expect(result.moderation.confidence).toBe(100)
        })

        it("should handle approved content", async () => {
            vi.spyOn(moderationEngine, "moderateContent").mockResolvedValue({
                moderation: {
                    id: "mod-123",
                    status: "approved",
                    flags: [],
                    confidence: 95,
                },
            })

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(true)
            expect(result.moderation.approved).toBe(true)
            expect(result.moderation.requiresReview).toBe(false)
            expect(result.moderation.flags).toEqual([])
            expect(result.moderation.confidence).toBe(95)
        })

        it("should handle content requiring review", async () => {
            vi.spyOn(moderationEngine, "moderateContent").mockResolvedValue({
                moderation: {
                    id: "mod-123",
                    status: "pending",
                    flags: [{ type: "needs_review" }],
                    confidence: 70,
                },
            })

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(true)
            expect(result.moderation.approved).toBe(false)
            expect(result.moderation.requiresReview).toBe(true)
            expect(result.moderation.flags).toEqual(["needs_review"])
            expect(result.moderation.confidence).toBe(70)
        })

        it("should reject blocked content", async () => {
            vi.spyOn(moderationEngine, "moderateContent").mockResolvedValue({
                moderation: {
                    id: "mod-123",
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
    })

    describe("Storage Integration", () => {
        const mockRequest: ContentProcessingRequest = {
            contentId: "storage-test-123",
            ownerId: "user-456",
            videoData: Buffer.from("mock video data for storage test"),
            metadata: {
                filename: "storage-test.mp4",
                mimeType: "video/mp4",
                size: 1024000,
            },
        }

        it("should generate correct storage keys", async () => {
            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(true)
            expect(result.storage.videoKey).toBe("videos/user-456/storage-test-123.mp4")
            expect(result.storage.thumbnailKey).toBe("thumbnails/user-456/storage-test-123.jpg")
            expect(result.storage.provider).toBe("local")
        })

        it("should generate correct URLs", async () => {
            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(true)
            expect(result.videoUrls.low).toContain("videos/user-456/storage-test-123.mp4")
            expect(result.videoUrls.low).toContain("?quality=low")
            expect(result.videoUrls.medium).toContain("videos/user-456/storage-test-123.mp4")
            expect(result.videoUrls.medium).toContain("?quality=medium")
            expect(result.videoUrls.high).toContain("videos/user-456/storage-test-123.mp4")
            expect(result.videoUrls.high).toContain("?quality=high")
            expect(result.thumbnailUrl).toContain("thumbnails/user-456/storage-test-123.jpg")
        })

        it("should handle storage upload failures", async () => {
            const failingAdapter = {
                uploadVideo: vi.fn().mockResolvedValue({
                    success: false,
                    error: "Upload failed",
                }),
                uploadThumbnail: vi.fn(),
                deleteVideo: vi.fn(),
                deleteThumbnail: vi.fn(),
                getVideoUrl: vi.fn(),
                getThumbnailUrl: vi.fn(),
            }

            const failingProcessor = new ContentProcessor(failingAdapter as any)

            const result = await failingProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Upload failed")
        })
    })

    describe("Error Handling and Recovery", () => {
        const mockRequest: ContentProcessingRequest = {
            contentId: "error-test-123",
            ownerId: "user-456",
            videoData: Buffer.from("mock video data for error test"),
            metadata: {
                filename: "error-test.mp4",
                mimeType: "video/mp4",
                size: 1024000,
            },
        }

        it("should handle video processing errors", async () => {
            // Mock VideoProcessor para falhar
            const failingVideoProcessor = {
                processVideo: vi.fn().mockResolvedValue({
                    success: false,
                    error: "Video processing failed",
                }),
            }

            // @ts-ignore - acessando propriedade privada para teste
            contentProcessor.videoProcessor = failingVideoProcessor

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Video processing failed")
        })

        it("should handle moderation errors", async () => {
            vi.spyOn(moderationEngine, "moderateContent").mockRejectedValue(
                new Error("Moderation service unavailable")
            )

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toContain("Moderation service unavailable")
        })

        it("should track processing time even on errors", async () => {
            vi.spyOn(moderationEngine, "moderateContent").mockRejectedValue(
                new Error("Test error")
            )

            const result = await contentProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
            expect(typeof result.processingTime).toBe("number")
        })

        it("should return structured error response", async () => {
            const failingAdapter = {
                uploadVideo: vi.fn().mockResolvedValue({
                    success: false,
                    error: "Storage error",
                }),
                uploadThumbnail: vi.fn(),
                deleteVideo: vi.fn(),
                deleteThumbnail: vi.fn(),
                getVideoUrl: vi.fn(),
                getThumbnailUrl: vi.fn(),
            }

            const failingProcessor = new ContentProcessor(failingAdapter as any)

            const result = await failingProcessor.processContent(mockRequest)

            expect(result.success).toBe(false)
            expect(result.contentId).toBe("error-test-123")
            expect(result.error).toBe("Storage error")
            expect(result.videoUrls).toEqual({
                low: "",
                medium: "",
                high: "",
            })
            expect(result.thumbnailUrl).toBe("")
            expect(result.storage).toEqual({
                videoKey: "",
                thumbnailKey: "",
                provider: "unknown",
            })
            expect(result.videoMetadata).toEqual({
                duration: 0,
                width: 0,
                height: 0,
                format: "",
                codec: "",
                hasAudio: false,
                size: 0,
            })
            expect(result.moderation).toEqual({
                moderationId: "",
                approved: false,
                requiresReview: false,
                flags: [],
                confidence: 0,
            })
        })
    })

    describe("Performance and Concurrency", () => {
        it("should handle concurrent content processing", async () => {
            const requests = Array.from({ length: 5 }, (_, i) => ({
                contentId: `concurrent-test-${i}`,
                ownerId: "user-456",
                videoData: Buffer.from(`mock video data ${i}`),
                metadata: {
                    filename: `concurrent-test-${i}.mp4`,
                    mimeType: "video/mp4",
                    size: 1024000,
                },
            }))

            const startTime = Date.now()
            const results = await Promise.all(
                requests.map(request => contentProcessor.processContent(request))
            )
            const endTime = Date.now()

            expect(results).toHaveLength(5)
            results.forEach((result, index) => {
                expect(result.success).toBe(true)
                expect(result.contentId).toBe(`concurrent-test-${index}`)
            })

            // Verificar que não demorou muito (deve ser rápido para mocks)
            expect(endTime - startTime).toBeLessThan(5000)
        })

        it("should maintain performance with large files", async () => {
            const largeVideoData = Buffer.alloc(50 * 1024 * 1024) // 50MB
            const request = {
                contentId: "performance-test-large",
                ownerId: "user-456",
                videoData: largeVideoData,
                metadata: {
                    filename: "performance-test-large.mp4",
                    mimeType: "video/mp4",
                    size: largeVideoData.length,
                },
            }

            const startTime = Date.now()
            const result = await contentProcessor.processContent(request)
            const endTime = Date.now()

            expect(result.success).toBe(true)
            expect(result.processingTime).toBeLessThan(endTime - startTime + 100) // Margem de erro
        })
    })

    describe("Configuration Integration", () => {
        it("should work with custom configuration", async () => {
            const customConfig = {
                thumbnail: {
                    width: 640,
                    height: 480,
                    quality: 80,
                    format: "png" as const,
                },
                validation: {
                    maxFileSize: 100 * 1024 * 1024, // 100MB
                    maxDuration: 60,
                    minDuration: 5,
                    allowedFormats: ["mp4", "mov"],
                    minResolution: { width: 480, height: 720 },
                    maxResolution: { width: 1280, height: 1920 },
                },
                processing: {
                    timeout: 30000,
                    retryAttempts: 2,
                    autoCompress: false,
                    autoConvertToMp4: false,
                    targetResolution: { width: 1280, height: 720 },
                },
            }

            const customProcessor = new ContentProcessor(storageAdapter, customConfig)

            const request = {
                contentId: "config-test-123",
                ownerId: "user-456",
                videoData: Buffer.from("mock video data for config test"),
                metadata: {
                    filename: "config-test.mp4",
                    mimeType: "video/mp4",
                    size: 1024000,
                },
            }

            const result = await customProcessor.processContent(request)

            expect(result.success).toBe(true)
            expect(result.contentId).toBe("config-test-123")
        })
    })

    describe("Content Deletion", () => {
        it("should delete content successfully", async () => {
            const videoKey = "videos/user-456/test-content-123.mp4"
            const thumbnailKey = "thumbnails/user-456/test-content-123.jpg"

            await expect(contentProcessor.deleteContent(videoKey, thumbnailKey)).resolves.not.toThrow()
        })

        it("should handle deletion errors", async () => {
            const failingAdapter = {
                uploadVideo: vi.fn(),
                uploadThumbnail: vi.fn(),
                deleteVideo: vi.fn().mockRejectedValue(new Error("Delete failed")),
                deleteThumbnail: vi.fn(),
                getVideoUrl: vi.fn(),
                getThumbnailUrl: vi.fn(),
            }

            const failingProcessor = new ContentProcessor(failingAdapter as any)

            const videoKey = "videos/user-456/test-content-123.mp4"
            const thumbnailKey = "thumbnails/user-456/test-content-123.jpg"

            await expect(failingProcessor.deleteContent(videoKey, thumbnailKey)).rejects.toThrow(
                "Delete failed"
            )
        })
    })
})
