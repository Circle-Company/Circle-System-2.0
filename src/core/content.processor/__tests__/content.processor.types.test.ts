/**
 * Content Processor Types Tests
 * Testes para tipos e interfaces do content processor
 */

import {
    ContentProcessingRequest,
    ContentProcessingResult,
    ContentProcessorConfig,
    StorageAdapter,
    StorageUploadResult,
    ThumbnailGenerationOptions,
    VideoCompressionOptions,
    VideoMetadataExtractionResult,
    VideoProcessingRequest,
    VideoProcessingResult,
} from "@/core/content.processor/type"
import { describe, expect, it } from "vitest"

describe("Content Processor Types", () => {
    describe("VideoProcessingRequest", () => {
        it("should have correct structure", () => {
            const request: VideoProcessingRequest = {
                contentId: "test-content-123",
                ownerId: "user-456",
                videoData: Buffer.from("test data"),
                metadata: {
                    filename: "test-video.mp4",
                    mimeType: "video/mp4",
                    size: 1024000,
                },
            }

            expect(request.contentId).toBe("test-content-123")
            expect(request.ownerId).toBe("user-456")
            expect(request.videoData).toBeInstanceOf(Buffer)
            expect(request.metadata.filename).toBe("test-video.mp4")
            expect(request.metadata.mimeType).toBe("video/mp4")
            expect(request.metadata.size).toBe(1024000)
        })

        it("should accept different MIME types", () => {
            const mimeTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"]

            mimeTypes.forEach((mimeType) => {
                const request: VideoProcessingRequest = {
                    contentId: "test-content-123",
                    ownerId: "user-456",
                    videoData: Buffer.from("test data"),
                    metadata: {
                        filename: "test-video.mp4",
                        mimeType,
                        size: 1024000,
                    },
                }

                expect(request.metadata.mimeType).toBe(mimeType)
            })
        })
    })

    describe("VideoProcessingResult", () => {
        it("should have correct structure for success", () => {
            const result: VideoProcessingResult = {
                success: true,
                contentId: "test-content-123",
                thumbnail: {
                    data: Buffer.from("thumbnail data"),
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
                    data: Buffer.from("processed data"),
                    wasCompressed: true,
                    wasConverted: false,
                    originalResolution: { width: 1920, height: 1080 },
                    originalFormat: "mov",
                },
                processingTime: 5000,
            }

            expect(result.success).toBe(true)
            expect(result.contentId).toBe("test-content-123")
            expect(result.thumbnail).toBeDefined()
            expect(result.videoMetadata).toBeDefined()
            expect(result.processedVideo).toBeDefined()
            expect(result.processingTime).toBe(5000)
        })

        it("should have correct structure for failure", () => {
            const result: VideoProcessingResult = {
                success: false,
                contentId: "test-content-123",
                thumbnail: {
                    data: Buffer.from([]),
                    width: 0,
                    height: 0,
                    format: "jpeg",
                },
                videoMetadata: {
                    duration: 0,
                    width: 0,
                    height: 0,
                    format: "",
                    codec: "",
                    hasAudio: false,
                    size: 0,
                },
                processingTime: 1000,
                error: "Processing failed",
            }

            expect(result.success).toBe(false)
            expect(result.error).toBe("Processing failed")
            expect(result.processingTime).toBe(1000)
        })

        it("should have optional processedVideo", () => {
            const result: VideoProcessingResult = {
                success: true,
                contentId: "test-content-123",
                thumbnail: {
                    data: Buffer.from("thumbnail data"),
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
                },
                processingTime: 5000,
            }

            expect(result.processedVideo).toBeUndefined()
        })
    })

    describe("ContentProcessingRequest", () => {
        it("should have correct structure", () => {
            const request: ContentProcessingRequest = {
                contentId: "test-content-123",
                ownerId: "user-456",
                videoData: Buffer.from("test data"),
                metadata: {
                    filename: "test-video.mp4",
                    mimeType: "video/mp4",
                    size: 1024000,
                },
            }

            expect(request.contentId).toBe("test-content-123")
            expect(request.ownerId).toBe("user-456")
            expect(request.videoData).toBeInstanceOf(Buffer)
            expect(request.metadata.filename).toBe("test-video.mp4")
            expect(request.metadata.mimeType).toBe("video/mp4")
            expect(request.metadata.size).toBe(1024000)
        })
    })

    describe("ContentProcessingResult", () => {
        it("should have correct structure for success", () => {
            const result: ContentProcessingResult = {
                success: true,
                contentId: "test-content-123",
                videoUrls: {
                    low: "https://storage.example.com/video-low.mp4",
                    medium: "https://storage.example.com/video-medium.mp4",
                    high: "https://storage.example.com/video-high.mp4",
                },
                thumbnailUrl: "https://storage.example.com/thumbnail.jpg",
                storage: {
                    videoKey: "videos/user-456/test-content-123.mp4",
                    thumbnailKey: "thumbnails/user-456/test-content-123.jpg",
                    bucket: "test-bucket",
                    region: "us-east-1",
                    provider: "s3",
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
                moderation: {
                    moderationId: "mod-789",
                    approved: true,
                    requiresReview: false,
                    flags: [],
                    confidence: 95,
                },
                processingTime: 10000,
            }

            expect(result.success).toBe(true)
            expect(result.contentId).toBe("test-content-123")
            expect(result.videoUrls).toBeDefined()
            expect(result.thumbnailUrl).toBeDefined()
            expect(result.storage).toBeDefined()
            expect(result.videoMetadata).toBeDefined()
            expect(result.moderation).toBeDefined()
            expect(result.processingTime).toBe(10000)
        })

        it("should have correct structure for failure", () => {
            const result: ContentProcessingResult = {
                success: false,
                contentId: "test-content-123",
                videoUrls: {
                    low: "",
                    medium: "",
                    high: "",
                },
                thumbnailUrl: "",
                storage: {
                    videoKey: "",
                    thumbnailKey: "",
                    provider: "unknown",
                },
                videoMetadata: {
                    duration: 0,
                    width: 0,
                    height: 0,
                    format: "",
                    codec: "",
                    hasAudio: false,
                    size: 0,
                },
                moderation: {
                    moderationId: "",
                    approved: false,
                    requiresReview: false,
                    flags: [],
                    confidence: 0,
                },
                processingTime: 1000,
                error: "Processing failed",
            }

            expect(result.success).toBe(false)
            expect(result.error).toBe("Processing failed")
            expect(result.processingTime).toBe(1000)
        })
    })

    describe("ThumbnailGenerationOptions", () => {
        it("should have correct structure", () => {
            const options: ThumbnailGenerationOptions = {
                width: 480,
                height: 854,
                quality: 70,
                format: "jpeg",
                timePosition: 5,
            }

            expect(options.width).toBe(480)
            expect(options.height).toBe(854)
            expect(options.quality).toBe(70)
            expect(options.format).toBe("jpeg")
            expect(options.timePosition).toBe(5)
        })

        it("should accept different formats", () => {
            const formats: Array<"jpeg" | "png" | "webp"> = ["jpeg", "png", "webp"]

            formats.forEach((format) => {
                const options: ThumbnailGenerationOptions = {
                    format,
                }

                expect(options.format).toBe(format)
            })
        })

        it("should have optional properties", () => {
            const options: ThumbnailGenerationOptions = {}

            expect(options.width).toBeUndefined()
            expect(options.height).toBeUndefined()
            expect(options.quality).toBeUndefined()
            expect(options.format).toBeUndefined()
            expect(options.timePosition).toBeUndefined()
        })
    })

    describe("VideoMetadataExtractionResult", () => {
        it("should have correct structure", () => {
            const metadata: VideoMetadataExtractionResult = {
                duration: 15,
                width: 1080,
                height: 1920,
                format: "mp4",
                codec: "h264",
                hasAudio: true,
                size: 1024000,
                bitrate: 2500000,
                fps: 30,
            }

            expect(metadata.duration).toBe(15)
            expect(metadata.width).toBe(1080)
            expect(metadata.height).toBe(1920)
            expect(metadata.format).toBe("mp4")
            expect(metadata.codec).toBe("h264")
            expect(metadata.hasAudio).toBe(true)
            expect(metadata.size).toBe(1024000)
            expect(metadata.bitrate).toBe(2500000)
            expect(metadata.fps).toBe(30)
        })

        it("should have optional properties", () => {
            const metadata: VideoMetadataExtractionResult = {
                duration: 15,
                width: 1080,
                height: 1920,
                format: "mp4",
                codec: "h264",
                hasAudio: true,
                size: 1024000,
            }

            expect(metadata.bitrate).toBeUndefined()
            expect(metadata.fps).toBeUndefined()
        })
    })

    describe("VideoCompressionOptions", () => {
        it("should have correct structure", () => {
            const options: VideoCompressionOptions = {
                targetResolution: { width: 1280, height: 720 },
                targetBitrate: 2000000,
                targetFormat: "mp4",
                quality: 80,
            }

            expect(options.targetResolution.width).toBe(1280)
            expect(options.targetResolution.height).toBe(720)
            expect(options.targetBitrate).toBe(2000000)
            expect(options.targetFormat).toBe("mp4")
            expect(options.quality).toBe(80)
        })

        it("should have optional properties", () => {
            const options: VideoCompressionOptions = {
                targetResolution: { width: 1280, height: 720 },
                targetFormat: "mp4",
            }

            expect(options.targetBitrate).toBeUndefined()
            expect(options.quality).toBeUndefined()
        })
    })

    describe("StorageUploadResult", () => {
        it("should have correct structure for success", () => {
            const result: StorageUploadResult = {
                success: true,
                key: "videos/user-456/test-content-123.mp4",
                url: "https://storage.example.com/videos/user-456/test-content-123.mp4",
                bucket: "test-bucket",
                region: "us-east-1",
                provider: "s3",
            }

            expect(result.success).toBe(true)
            expect(result.key).toBe("videos/user-456/test-content-123.mp4")
            expect(result.url).toBe(
                "https://storage.example.com/videos/user-456/test-content-123.mp4",
            )
            expect(result.bucket).toBe("test-bucket")
            expect(result.region).toBe("us-east-1")
            expect(result.provider).toBe("s3")
        })

        it("should have correct structure for failure", () => {
            const result: StorageUploadResult = {
                success: false,
                key: "videos/user-456/test-content-123.mp4",
                url: "",
                provider: "s3",
                error: "Upload failed",
            }

            expect(result.success).toBe(false)
            expect(result.error).toBe("Upload failed")
            expect(result.bucket).toBeUndefined()
            expect(result.region).toBeUndefined()
        })

        it("should accept different providers", () => {
            const providers: Array<"s3" | "gcs" | "azure" | "local"> = [
                "s3",
                "gcs",
                "azure",
                "local",
            ]

            providers.forEach((provider) => {
                const result: StorageUploadResult = {
                    success: true,
                    key: "test-key",
                    url: "https://example.com/test-key",
                    provider,
                }

                expect(result.provider).toBe(provider)
            })
        })
    })

    describe("ContentProcessorConfig", () => {
        it("should have correct structure", () => {
            const config: ContentProcessorConfig = {
                thumbnail: {
                    width: 480,
                    height: 854,
                    quality: 70,
                    format: "jpeg",
                    timePosition: 0,
                },
                validation: {
                    maxFileSize: 500 * 1024 * 1024,
                    maxDuration: 180,
                    minDuration: 3,
                    allowedFormats: ["mp4", "mov", "avi", "webm"],
                    minResolution: { width: 720, height: 1280 },
                    maxResolution: { width: 1920, height: 3840 },
                },
                processing: {
                    timeout: 60000,
                    retryAttempts: 3,
                    autoCompress: true,
                    autoConvertToMp4: true,
                    targetResolution: { width: 1920, height: 1080 },
                },
            }

            expect(config.thumbnail).toBeDefined()
            expect(config.validation).toBeDefined()
            expect(config.processing).toBeDefined()

            expect(config.validation.maxFileSize).toBe(500 * 1024 * 1024)
            expect(config.validation.maxDuration).toBe(180)
            expect(config.validation.minDuration).toBe(3)
            expect(config.validation.allowedFormats).toContain("mp4")
            expect(config.validation.minResolution.width).toBe(720)
            expect(config.validation.maxResolution.width).toBe(1920)

            expect(config.processing.timeout).toBe(60000)
            expect(config.processing.retryAttempts).toBe(3)
            expect(config.processing.autoCompress).toBe(true)
            expect(config.processing.autoConvertToMp4).toBe(true)
            expect(config.processing.targetResolution.width).toBe(1920)
        })
    })

    describe("StorageAdapter interface", () => {
        it("should define required methods", () => {
            const adapter: StorageAdapter = {
                uploadVideo: async () => ({
                    success: true,
                    key: "test-key",
                    url: "https://example.com/test-key",
                    provider: "s3",
                }),
                uploadThumbnail: async () => ({
                    success: true,
                    key: "test-key",
                    url: "https://example.com/test-key",
                    provider: "s3",
                }),
                deleteVideo: async () => {},
                deleteThumbnail: async () => {},
                getVideoUrl: async () => "https://example.com/video-url",
                getThumbnailUrl: async () => "https://example.com/thumbnail-url",
            }

            expect(typeof adapter.uploadVideo).toBe("function")
            expect(typeof adapter.uploadThumbnail).toBe("function")
            expect(typeof adapter.deleteVideo).toBe("function")
            expect(typeof adapter.deleteThumbnail).toBe("function")
            expect(typeof adapter.getVideoUrl).toBe("function")
            expect(typeof adapter.getThumbnailUrl).toBe("function")
        })

        it("should accept quality parameter in getVideoUrl", () => {
            const adapter: StorageAdapter = {
                uploadVideo: async () => ({
                    success: true,
                    key: "test-key",
                    url: "https://example.com/test-key",
                    provider: "s3",
                }),
                uploadThumbnail: async () => ({
                    success: true,
                    key: "test-key",
                    url: "https://example.com/test-key",
                    provider: "s3",
                }),
                deleteVideo: async () => {},
                deleteThumbnail: async () => {},
                getVideoUrl: async (key: string, quality?: "low" | "medium" | "high") => {
                    return `https://example.com/video-url?quality=${quality || "medium"}`
                },
                getThumbnailUrl: async () => "https://example.com/thumbnail-url",
            }

            // Teste que a interface aceita os parâmetros corretos
            expect(adapter.getVideoUrl).toBeDefined()
        })
    })

    describe("Type compatibility", () => {
        it("should be compatible between VideoProcessingRequest and ContentProcessingRequest", () => {
            const videoRequest: VideoProcessingRequest = {
                contentId: "test-content-123",
                ownerId: "user-456",
                videoData: Buffer.from("test data"),
                metadata: {
                    filename: "test-video.mp4",
                    mimeType: "video/mp4",
                    size: 1024000,
                },
            }

            const contentRequest: ContentProcessingRequest = videoRequest

            expect(contentRequest.contentId).toBe(videoRequest.contentId)
            expect(contentRequest.ownerId).toBe(videoRequest.ownerId)
            expect(contentRequest.videoData).toBe(videoRequest.videoData)
            expect(contentRequest.metadata).toEqual(videoRequest.metadata)
        })

        it("should have consistent metadata structure", () => {
            const metadata = {
                filename: "test-video.mp4",
                mimeType: "video/mp4",
                size: 1024000,
            }

            const videoRequest: VideoProcessingRequest = {
                contentId: "test-content-123",
                ownerId: "user-456",
                videoData: Buffer.from("test data"),
                metadata,
            }

            const contentRequest: ContentProcessingRequest = {
                contentId: "test-content-123",
                ownerId: "user-456",
                videoData: Buffer.from("test data"),
                metadata,
            }

            expect(videoRequest.metadata).toEqual(contentRequest.metadata)
        })
    })
})
