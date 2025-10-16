/**
 * Storage Adapter Integration Tests
 * Testes de integração para os adapters de storage
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LocalStorageAdapter, EmptyStorageAdapter, StorageAdapterFactory } from "@/core/content.processor"
import { StorageUploadResult } from "@/core/content.processor/type"

describe("Storage Adapter Integration", () => {
    describe("LocalStorageAdapter", () => {
        let adapter: LocalStorageAdapter
        let mockVideoData: Buffer
        let mockThumbnailData: Buffer

        beforeEach(() => {
            adapter = new LocalStorageAdapter("http://localhost:3000/storage")
            mockVideoData = Buffer.from("mock video data")
            mockThumbnailData = Buffer.from("mock thumbnail data")
        })

        afterEach(() => {
            vi.clearAllMocks()
        })

        describe("uploadVideo", () => {
            it("should upload video successfully", async () => {
                const metadata = {
                    contentType: "video/mp4",
                    ownerId: "user-123",
                    contentId: "content-456",
                }

                const result = await adapter.uploadVideo("videos/user-123/content-456.mp4", mockVideoData, metadata)

                expect(result.success).toBe(true)
                expect(result.key).toBe("videos/user-123/content-456.mp4")
                expect(result.url).toBe("http://localhost:3000/storage/videos/videos/user-123/content-456.mp4")
                expect(result.provider).toBe("local")
            })

            it("should handle empty video data", async () => {
                const emptyData = Buffer.from([])
                const metadata = { contentType: "video/mp4" }

                const result = await adapter.uploadVideo("test/empty.mp4", emptyData, metadata)

                expect(result.success).toBe(true)
                expect(result.key).toBe("test/empty.mp4")
            })

            it("should handle large video data", async () => {
                const largeData = Buffer.alloc(10 * 1024 * 1024) // 10MB
                const metadata = { contentType: "video/mp4" }

                const result = await adapter.uploadVideo("test/large.mp4", largeData, metadata)

                expect(result.success).toBe(true)
                expect(result.key).toBe("test/large.mp4")
            })
        })

        describe("uploadThumbnail", () => {
            it("should upload thumbnail successfully", async () => {
                const metadata = {
                    contentType: "image/jpeg",
                    ownerId: "user-123",
                    contentId: "content-456",
                }

                const result = await adapter.uploadThumbnail("thumbnails/user-123/content-456.jpg", mockThumbnailData, metadata)

                expect(result.success).toBe(true)
                expect(result.key).toBe("thumbnails/user-123/content-456.jpg")
                expect(result.url).toBe("http://localhost:3000/storage/thumbnails/thumbnails/user-123/content-456.jpg")
                expect(result.provider).toBe("local")
            })

            it("should handle different thumbnail formats", async () => {
                const pngData = Buffer.from("mock png data")
                const webpData = Buffer.from("mock webp data")

                const pngResult = await adapter.uploadThumbnail("test/thumb.png", pngData, { contentType: "image/png" })
                const webpResult = await adapter.uploadThumbnail("test/thumb.webp", webpData, { contentType: "image/webp" })

                expect(pngResult.success).toBe(true)
                expect(webpResult.success).toBe(true)
            })
        })

        describe("deleteVideo", () => {
            it("should delete video successfully", async () => {
                const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

                await adapter.deleteVideo("videos/user-123/content-456.mp4")

                expect(consoleSpy).toHaveBeenCalledWith("[LocalStorage] Deletando vídeo: videos/user-123/content-456.mp4")
                consoleSpy.mockRestore()
            })

            it("should handle deletion of non-existent video", async () => {
                const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

                await expect(adapter.deleteVideo("non-existent/video.mp4")).resolves.not.toThrow()

                expect(consoleSpy).toHaveBeenCalledWith("[LocalStorage] Deletando vídeo: non-existent/video.mp4")
                consoleSpy.mockRestore()
            })
        })

        describe("deleteThumbnail", () => {
            it("should delete thumbnail successfully", async () => {
                const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

                await adapter.deleteThumbnail("thumbnails/user-123/content-456.jpg")

                expect(consoleSpy).toHaveBeenCalledWith("[LocalStorage] Deletando thumbnail: thumbnails/user-123/content-456.jpg")
                consoleSpy.mockRestore()
            })
        })

        describe("getVideoUrl", () => {
            it("should generate video URL without quality", async () => {
                const url = await adapter.getVideoUrl("videos/user-123/content-456.mp4")

                expect(url).toBe("http://localhost:3000/storage/videos/videos/user-123/content-456.mp4")
            })

            it("should generate video URL with quality", async () => {
                const lowUrl = await adapter.getVideoUrl("videos/user-123/content-456.mp4", "low")
                const mediumUrl = await adapter.getVideoUrl("videos/user-123/content-456.mp4", "medium")
                const highUrl = await adapter.getVideoUrl("videos/user-123/content-456.mp4", "high")

                expect(lowUrl).toBe("http://localhost:3000/storage/videos/videos/user-123/content-456.mp4?quality=low")
                expect(mediumUrl).toBe("http://localhost:3000/storage/videos/videos/user-123/content-456.mp4?quality=medium")
                expect(highUrl).toBe("http://localhost:3000/storage/videos/videos/user-123/content-456.mp4?quality=high")
            })
        })

        describe("getThumbnailUrl", () => {
            it("should generate thumbnail URL", async () => {
                const url = await adapter.getThumbnailUrl("thumbnails/user-123/content-456.jpg")

                expect(url).toBe("http://localhost:3000/storage/thumbnails/thumbnails/user-123/content-456.jpg")
            })
        })

        describe("custom base URL", () => {
            it("should work with custom base URL", async () => {
                const customAdapter = new LocalStorageAdapter("https://cdn.example.com")
                
                const videoUrl = await customAdapter.getVideoUrl("test/video.mp4")
                const thumbnailUrl = await customAdapter.getThumbnailUrl("test/thumb.jpg")

                expect(videoUrl).toBe("https://cdn.example.com/videos/test/video.mp4")
                expect(thumbnailUrl).toBe("https://cdn.example.com/thumbnails/test/thumb.jpg")
            })

            it("should work with default base URL", async () => {
                const defaultAdapter = new LocalStorageAdapter()
                
                const videoUrl = await defaultAdapter.getVideoUrl("test/video.mp4")

                expect(videoUrl).toBe("http://localhost:3000/storage/videos/test/video.mp4")
            })
        })
    })

    describe("EmptyStorageAdapter", () => {
        let adapter: EmptyStorageAdapter
        let mockVideoData: Buffer
        let mockThumbnailData: Buffer

        beforeEach(() => {
            adapter = new EmptyStorageAdapter()
            mockVideoData = Buffer.from("mock video data")
            mockThumbnailData = Buffer.from("mock thumbnail data")
        })

        describe("uploadVideo", () => {
            it("should return failure for video upload", async () => {
                const metadata = { contentType: "video/mp4" }

                const result = await adapter.uploadVideo("test/video.mp4", mockVideoData, metadata)

                expect(result.success).toBe(false)
                expect(result.key).toBe("test/video.mp4")
                expect(result.url).toBe("")
                expect(result.provider).toBe("local")
                expect(result.error).toBe("Storage provider não configurado. Configure S3, GCS ou Azure.")
            })
        })

        describe("uploadThumbnail", () => {
            it("should return failure for thumbnail upload", async () => {
                const metadata = { contentType: "image/jpeg" }

                const result = await adapter.uploadThumbnail("test/thumb.jpg", mockThumbnailData, metadata)

                expect(result.success).toBe(false)
                expect(result.key).toBe("test/thumb.jpg")
                expect(result.url).toBe("")
                expect(result.provider).toBe("local")
                expect(result.error).toBe("Storage provider não configurado. Configure S3, GCS ou Azure.")
            })
        })

        describe("deleteVideo", () => {
            it("should throw error for video deletion", async () => {
                await expect(adapter.deleteVideo("test/video.mp4")).rejects.toThrow(
                    "Storage provider não configurado"
                )
            })
        })

        describe("deleteThumbnail", () => {
            it("should throw error for thumbnail deletion", async () => {
                await expect(adapter.deleteThumbnail("test/thumb.jpg")).rejects.toThrow(
                    "Storage provider não configurado"
                )
            })
        })

        describe("getVideoUrl", () => {
            it("should return empty string for video URL", async () => {
                const url = await adapter.getVideoUrl("test/video.mp4", "high")

                expect(url).toBe("")
            })
        })

        describe("getThumbnailUrl", () => {
            it("should return empty string for thumbnail URL", async () => {
                const url = await adapter.getThumbnailUrl("test/thumb.jpg")

                expect(url).toBe("")
            })
        })
    })

    describe("StorageAdapterFactory", () => {
        describe("create", () => {
            it("should create LocalStorageAdapter for local provider", () => {
                const adapter = StorageAdapterFactory.create("local")

                expect(adapter).toBeInstanceOf(LocalStorageAdapter)
            })

            it("should create EmptyStorageAdapter for S3 provider", () => {
                const adapter = StorageAdapterFactory.create("s3")

                expect(adapter).toBeInstanceOf(EmptyStorageAdapter)
            })

            it("should create EmptyStorageAdapter for GCS provider", () => {
                const adapter = StorageAdapterFactory.create("gcs")

                expect(adapter).toBeInstanceOf(EmptyStorageAdapter)
            })

            it("should create EmptyStorageAdapter for Azure provider", () => {
                const adapter = StorageAdapterFactory.create("azure")

                expect(adapter).toBeInstanceOf(EmptyStorageAdapter)
            })

            it("should create LocalStorageAdapter for default provider", () => {
                const adapter = StorageAdapterFactory.create()

                expect(adapter).toBeInstanceOf(LocalStorageAdapter)
            })

            it("should create EmptyStorageAdapter for unknown provider", () => {
                // @ts-ignore - testando provider inválido
                const adapter = StorageAdapterFactory.create("unknown")

                expect(adapter).toBeInstanceOf(EmptyStorageAdapter)
            })
        })
    })

    describe("Storage Adapter Interface Compliance", () => {
        it("should ensure all adapters implement the interface", () => {
            const localAdapter = new LocalStorageAdapter()
            const emptyAdapter = new EmptyStorageAdapter()

            // Verificar se todos os métodos obrigatórios existem
            expect(typeof localAdapter.uploadVideo).toBe("function")
            expect(typeof localAdapter.uploadThumbnail).toBe("function")
            expect(typeof localAdapter.deleteVideo).toBe("function")
            expect(typeof localAdapter.deleteThumbnail).toBe("function")
            expect(typeof localAdapter.getVideoUrl).toBe("function")
            expect(typeof localAdapter.getThumbnailUrl).toBe("function")

            expect(typeof emptyAdapter.uploadVideo).toBe("function")
            expect(typeof emptyAdapter.uploadThumbnail).toBe("function")
            expect(typeof emptyAdapter.deleteVideo).toBe("function")
            expect(typeof emptyAdapter.deleteThumbnail).toBe("function")
            expect(typeof emptyAdapter.getVideoUrl).toBe("function")
            expect(typeof emptyAdapter.getThumbnailUrl).toBe("function")
        })
    })

    describe("Error Handling", () => {
        let adapter: LocalStorageAdapter

        beforeEach(() => {
            adapter = new LocalStorageAdapter()
        })

        it("should handle metadata with special characters", async () => {
            const metadata = {
                "content-type": "video/mp4",
                "owner-id": "user@example.com",
                "content-id": "content-123",
                "custom-field": "value with spaces and special chars !@#$%",
            }

            const result = await adapter.uploadVideo("test/special-chars.mp4", Buffer.from("data"), metadata)

            expect(result.success).toBe(true)
        })

        it("should handle very long keys", async () => {
            const longKey = "videos/" + "a".repeat(1000) + "/very-long-key.mp4"

            const result = await adapter.uploadVideo(longKey, Buffer.from("data"), {})

            expect(result.success).toBe(true)
            expect(result.key).toBe(longKey)
        })

        it("should handle empty metadata", async () => {
            const result = await adapter.uploadVideo("test/empty-metadata.mp4", Buffer.from("data"), {})

            expect(result.success).toBe(true)
        })
    })

    describe("Performance Tests", () => {
        let adapter: LocalStorageAdapter

        beforeEach(() => {
            adapter = new LocalStorageAdapter()
        })

        it("should handle multiple concurrent uploads", async () => {
            const uploads = Array.from({ length: 10 }, (_, i) => 
                adapter.uploadVideo(`test/concurrent-${i}.mp4`, Buffer.from(`data-${i}`), {})
            )

            const results = await Promise.all(uploads)

            expect(results).toHaveLength(10)
            results.forEach(result => {
                expect(result.success).toBe(true)
            })
        })

        it("should handle large file uploads", async () => {
            const largeData = Buffer.alloc(100 * 1024) // 100KB
            const startTime = Date.now()

            const result = await adapter.uploadVideo("test/large-file.mp4", largeData, {})

            const endTime = Date.now()
            const duration = endTime - startTime

            expect(result.success).toBe(true)
            expect(duration).toBeLessThan(1000) // Deve ser rápido para mock local
        })
    })
})
