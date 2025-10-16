/**
 * Storage Adapter Tests
 * Testes para os adaptadores de armazenamento
 */

import {
    EmptyStorageAdapter,
    LocalStorageAdapter,
    StorageAdapterFactory,
} from "@/core/content.processor"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("EmptyStorageAdapter", () => {
    let adapter: EmptyStorageAdapter

    beforeEach(() => {
        adapter = new EmptyStorageAdapter()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("uploadVideo", () => {
        it("should return failure result", async () => {
            const result = await adapter.uploadVideo("test-key", Buffer.from("test data"), {})

            expect(result.success).toBe(false)
            expect(result.key).toBe("test-key")
            expect(result.url).toBe("")
            expect(result.provider).toBe("local")
            expect(result.error).toBe(
                "Storage provider não configurado. Configure S3, GCS ou Azure.",
            )
        })
    })

    describe("uploadThumbnail", () => {
        it("should return failure result", async () => {
            const result = await adapter.uploadThumbnail("test-key", Buffer.from("test data"), {})

            expect(result.success).toBe(false)
            expect(result.key).toBe("test-key")
            expect(result.url).toBe("")
            expect(result.provider).toBe("local")
            expect(result.error).toBe(
                "Storage provider não configurado. Configure S3, GCS ou Azure.",
            )
        })
    })

    describe("deleteVideo", () => {
        it("should throw error", async () => {
            await expect(adapter.deleteVideo("test-key")).rejects.toThrow(
                "Storage provider não configurado",
            )
        })
    })

    describe("deleteThumbnail", () => {
        it("should throw error", async () => {
            await expect(adapter.deleteThumbnail("test-key")).rejects.toThrow(
                "Storage provider não configurado",
            )
        })
    })

    describe("getVideoUrl", () => {
        it("should return empty string", async () => {
            const url = await adapter.getVideoUrl("test-key")
            expect(url).toBe("")
        })

        it("should return empty string with quality", async () => {
            const url = await adapter.getVideoUrl("test-key", "high")
            expect(url).toBe("")
        })
    })

    describe("getThumbnailUrl", () => {
        it("should return empty string", async () => {
            const url = await adapter.getThumbnailUrl("test-key")
            expect(url).toBe("")
        })
    })
})

describe("LocalStorageAdapter", () => {
    let adapter: LocalStorageAdapter
    let consoleSpy: any

    beforeEach(() => {
        adapter = new LocalStorageAdapter()
        consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.clearAllMocks()
        consoleSpy.mockRestore()
    })

    describe("Constructor", () => {
        it("should create adapter with default base URL", () => {
            const adapter = new LocalStorageAdapter()
            expect(adapter).toBeDefined()
        })

        it("should create adapter with custom base URL", () => {
            const customBaseUrl = "http://custom-storage:8080"
            const adapter = new LocalStorageAdapter(customBaseUrl)
            expect(adapter).toBeDefined()
        })
    })

    describe("uploadVideo", () => {
        it("should upload video successfully", async () => {
            const result = await adapter.uploadVideo("test-key", Buffer.from("test data"), {})

            expect(result.success).toBe(true)
            expect(result.key).toBe("test-key")
            expect(result.url).toBe("http://localhost:3000/storage/videos/test-key")
            expect(result.provider).toBe("local")
        })

        it("should upload video with custom base URL", async () => {
            const customAdapter = new LocalStorageAdapter("http://custom-storage:8080")
            const result = await customAdapter.uploadVideo("test-key", Buffer.from("test data"), {})

            expect(result.success).toBe(true)
            expect(result.url).toBe("http://custom-storage:8080/videos/test-key")
        })

        it("should handle metadata", async () => {
            const metadata = { contentType: "video/mp4", ownerId: "user-123" }
            const result = await adapter.uploadVideo("test-key", Buffer.from("test data"), metadata)

            expect(result.success).toBe(true)
            expect(result.key).toBe("test-key")
        })
    })

    describe("uploadThumbnail", () => {
        it("should upload thumbnail successfully", async () => {
            const result = await adapter.uploadThumbnail("test-key", Buffer.from("test data"), {})

            expect(result.success).toBe(true)
            expect(result.key).toBe("test-key")
            expect(result.url).toBe("http://localhost:3000/storage/thumbnails/test-key")
            expect(result.provider).toBe("local")
        })

        it("should upload thumbnail with custom base URL", async () => {
            const customAdapter = new LocalStorageAdapter("http://custom-storage:8080")
            const result = await customAdapter.uploadThumbnail(
                "test-key",
                Buffer.from("test data"),
                {},
            )

            expect(result.success).toBe(true)
            expect(result.url).toBe("http://custom-storage:8080/thumbnails/test-key")
        })

        it("should handle metadata", async () => {
            const metadata = { contentType: "image/jpeg", ownerId: "user-123" }
            const result = await adapter.uploadThumbnail(
                "test-key",
                Buffer.from("test data"),
                metadata,
            )

            expect(result.success).toBe(true)
            expect(result.key).toBe("test-key")
        })
    })

    describe("deleteVideo", () => {
        it("should log delete operation", async () => {
            await adapter.deleteVideo("test-key")

            expect(consoleSpy).toHaveBeenCalledWith("[LocalStorage] Deletando vídeo: test-key")
        })

        it("should not throw error", async () => {
            await expect(adapter.deleteVideo("test-key")).resolves.not.toThrow()
        })
    })

    describe("deleteThumbnail", () => {
        it("should log delete operation", async () => {
            await adapter.deleteThumbnail("test-key")

            expect(consoleSpy).toHaveBeenCalledWith("[LocalStorage] Deletando thumbnail: test-key")
        })

        it("should not throw error", async () => {
            await expect(adapter.deleteThumbnail("test-key")).resolves.not.toThrow()
        })
    })

    describe("getVideoUrl", () => {
        it("should return video URL without quality", async () => {
            const url = await adapter.getVideoUrl("test-key")

            expect(url).toBe("http://localhost:3000/storage/videos/test-key")
        })

        it("should return video URL with quality", async () => {
            const url = await adapter.getVideoUrl("test-key", "high")

            expect(url).toBe("http://localhost:3000/storage/videos/test-key?quality=high")
        })

        it("should return video URL with different qualities", async () => {
            const lowUrl = await adapter.getVideoUrl("test-key", "low")
            const mediumUrl = await adapter.getVideoUrl("test-key", "medium")
            const highUrl = await adapter.getVideoUrl("test-key", "high")

            expect(lowUrl).toBe("http://localhost:3000/storage/videos/test-key?quality=low")
            expect(mediumUrl).toBe("http://localhost:3000/storage/videos/test-key?quality=medium")
            expect(highUrl).toBe("http://localhost:3000/storage/videos/test-key?quality=high")
        })

        it("should return video URL with custom base URL", async () => {
            const customAdapter = new LocalStorageAdapter("http://custom-storage:8080")
            const url = await customAdapter.getVideoUrl("test-key", "high")

            expect(url).toBe("http://custom-storage:8080/videos/test-key?quality=high")
        })
    })

    describe("getThumbnailUrl", () => {
        it("should return thumbnail URL", async () => {
            const url = await adapter.getThumbnailUrl("test-key")

            expect(url).toBe("http://localhost:3000/storage/thumbnails/test-key")
        })

        it("should return thumbnail URL with custom base URL", async () => {
            const customAdapter = new LocalStorageAdapter("http://custom-storage:8080")
            const url = await customAdapter.getThumbnailUrl("test-key")

            expect(url).toBe("http://custom-storage:8080/thumbnails/test-key")
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

        it("should create LocalStorageAdapter by default", () => {
            const adapter = StorageAdapterFactory.create()
            expect(adapter).toBeInstanceOf(LocalStorageAdapter)
        })

        it("should create EmptyStorageAdapter for unknown provider", () => {
            // @ts-ignore - testando comportamento com provider inválido
            const adapter = StorageAdapterFactory.create("unknown")
            expect(adapter).toBeInstanceOf(EmptyStorageAdapter)
        })
    })
})

describe("StorageAdapter Integration Tests", () => {
    let localAdapter: LocalStorageAdapter
    let emptyAdapter: EmptyStorageAdapter

    beforeEach(() => {
        localAdapter = new LocalStorageAdapter()
        emptyAdapter = new EmptyStorageAdapter()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("LocalStorageAdapter workflow", () => {
        it("should complete full workflow", async () => {
            const videoKey = "videos/user-123/content-456.mp4"
            const thumbnailKey = "thumbnails/user-123/content-456.jpg"
            const videoData = Buffer.from("mock video data")
            const thumbnailData = Buffer.from("mock thumbnail data")

            // Upload video
            const videoUpload = await localAdapter.uploadVideo(videoKey, videoData, {
                contentType: "video/mp4",
                ownerId: "user-123",
            })

            expect(videoUpload.success).toBe(true)
            expect(videoUpload.key).toBe(videoKey)

            // Upload thumbnail
            const thumbnailUpload = await localAdapter.uploadThumbnail(
                thumbnailKey,
                thumbnailData,
                {
                    contentType: "image/jpeg",
                    ownerId: "user-123",
                },
            )

            expect(thumbnailUpload.success).toBe(true)
            expect(thumbnailUpload.key).toBe(thumbnailKey)

            // Get URLs
            const videoUrl = await localAdapter.getVideoUrl(videoKey, "high")
            const thumbnailUrl = await localAdapter.getThumbnailUrl(thumbnailKey)

            expect(videoUrl).toContain("quality=high")
            expect(thumbnailUrl).toContain("thumbnails")

            // Delete (should not throw)
            await expect(localAdapter.deleteVideo(videoKey)).resolves.not.toThrow()
            await expect(localAdapter.deleteThumbnail(thumbnailKey)).resolves.not.toThrow()
        })
    })

    describe("EmptyStorageAdapter workflow", () => {
        it("should handle workflow with failures", async () => {
            const videoKey = "videos/user-123/content-456.mp4"
            const thumbnailKey = "thumbnails/user-123/content-456.jpg"
            const videoData = Buffer.from("mock video data")
            const thumbnailData = Buffer.from("mock thumbnail data")

            // Upload video (should fail)
            const videoUpload = await emptyAdapter.uploadVideo(videoKey, videoData, {})

            expect(videoUpload.success).toBe(false)
            expect(videoUpload.error).toContain("Storage provider não configurado")

            // Upload thumbnail (should fail)
            const thumbnailUpload = await emptyAdapter.uploadThumbnail(
                thumbnailKey,
                thumbnailData,
                {},
            )

            expect(thumbnailUpload.success).toBe(false)
            expect(thumbnailUpload.error).toContain("Storage provider não configurado")

            // Get URLs (should return empty)
            const videoUrl = await emptyAdapter.getVideoUrl(videoKey, "high")
            const thumbnailUrl = await emptyAdapter.getThumbnailUrl(thumbnailKey)

            expect(videoUrl).toBe("")
            expect(thumbnailUrl).toBe("")

            // Delete (should throw)
            await expect(emptyAdapter.deleteVideo(videoKey)).rejects.toThrow()
            await expect(emptyAdapter.deleteThumbnail(thumbnailKey)).rejects.toThrow()
        })
    })

    describe("Factory integration", () => {
        it("should create different adapters based on provider", () => {
            const local = StorageAdapterFactory.create("local")
            const s3 = StorageAdapterFactory.create("s3")
            const gcs = StorageAdapterFactory.create("gcs")
            const azure = StorageAdapterFactory.create("azure")

            expect(local).toBeInstanceOf(LocalStorageAdapter)
            expect(s3).toBeInstanceOf(EmptyStorageAdapter)
            expect(gcs).toBeInstanceOf(EmptyStorageAdapter)
            expect(azure).toBeInstanceOf(EmptyStorageAdapter)
        })
    })
})
