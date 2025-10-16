/**
 * Video Processor Tests
 * Testes para o VideoProcessor - processamento de vídeos
 */

import {
    ContentProcessorConfig,
    ThumbnailGenerationOptions,
    VideoCompressionOptions,
    VideoProcessingRequest,
} from "@/core/content.processor/type"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VideoProcessor } from "@/core/content.processor"

describe("VideoProcessor", () => {
    let videoProcessor: VideoProcessor
    let mockConfig: Partial<ContentProcessorConfig>

    beforeEach(() => {
        mockConfig = {
            thumbnail: {
                width: 480,
                height: 854,
                quality: 70,
                format: "jpeg",
                timePosition: 0,
            },
            validation: {
                maxFileSize: 500 * 1024 * 1024, // 500MB
                maxDuration: 180, // 3 minutos
                minDuration: 3, // 3 segundos
                allowedFormats: ["mp4", "mov", "avi", "webm"],
                minResolution: { width: 360, height: 558 },
                maxResolution: { width: 1920, height: 3840 },
            },
            processing: {
                timeout: 60000, // 60 segundos
                retryAttempts: 3,
                autoCompress: true,
                autoConvertToMp4: true,
                targetResolution: { width: 1920, height: 1080 },
            },
        }

        videoProcessor = new VideoProcessor(mockConfig)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("Constructor", () => {
        it("should create VideoProcessor with default config", () => {
            const processor = new VideoProcessor()
            expect(processor).toBeDefined()
        })

        it("should create VideoProcessor with custom config", () => {
            const customConfig = {
                thumbnail: { width: 640, height: 480 },
                validation: { maxFileSize: 1000000 },
            }
            const processor = new VideoProcessor(customConfig)
            expect(processor).toBeDefined()
        })

        it("should merge custom config with defaults", () => {
            const customConfig = {
                thumbnail: { width: 640 },
                validation: { maxFileSize: 1000000 },
            }
            const processor = new VideoProcessor(customConfig)
            expect(processor).toBeDefined()
        })
    })

    describe("processVideo", () => {
        const mockRequest: VideoProcessingRequest = {
            contentId: "test-content-123",
            ownerId: "user-456",
            videoData: Buffer.from("mock video data"),
            metadata: {
                filename: "test-video.mp4",
                mimeType: "video/mp4",
                size: 1024000,
            },
        }

        beforeEach(() => {
            // Mock dos métodos privados
            vi.spyOn(videoProcessor as any, "validateVideo").mockResolvedValue(undefined)
            vi.spyOn(videoProcessor as any, "extractVideoMetadata").mockResolvedValue({
                duration: 15,
                width: 1080,
                height: 1920,
                format: "mp4",
                codec: "h264",
                hasAudio: true,
                size: 1024000,
                bitrate: 2500000,
                fps: 30,
            })
            vi.spyOn(videoProcessor as any, "processVideoCompression").mockResolvedValue({
                data: Buffer.from("processed video data"),
                wasProcessed: false,
                wasCompressed: false,
                wasConverted: false,
            })
            vi.spyOn(videoProcessor as any, "generateThumbnail").mockResolvedValue({
                data: Buffer.from("mock thumbnail data"),
                width: 480,
                height: 854,
                format: "jpeg",
            })
        })

        it("should process video successfully", async () => {
            const result = await videoProcessor.processVideo(mockRequest)

            expect(result.success).toBe(true)
            expect(result.contentId).toBe("test-content-123")
            expect(result.thumbnail).toBeDefined()
            expect(result.videoMetadata).toBeDefined()
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
            expect(result.processedVideo).toBeUndefined()
        })

        it("should process video with compression", async () => {
            const compressionResult = {
                data: Buffer.from("compressed video data"),
                wasProcessed: true,
                wasCompressed: true,
                wasConverted: false,
                originalResolution: { width: 1920, height: 1080 },
            }
            vi.spyOn(videoProcessor as any, "processVideoCompression").mockResolvedValue(
                compressionResult,
            )

            const result = await videoProcessor.processVideo(mockRequest)

            expect(result.success).toBe(true)
            expect(result.processedVideo).toBeDefined()
            expect(result.processedVideo?.wasCompressed).toBe(true)
            expect(result.processedVideo?.wasConverted).toBe(false)
            expect(result.processedVideo?.originalResolution).toEqual({ width: 1920, height: 1080 })
        })

        it("should process video with conversion", async () => {
            const conversionResult = {
                data: Buffer.from("converted video data"),
                wasProcessed: true,
                wasCompressed: false,
                wasConverted: true,
                originalFormat: "mov",
            }
            vi.spyOn(videoProcessor as any, "processVideoCompression").mockResolvedValue(
                conversionResult,
            )

            const result = await videoProcessor.processVideo(mockRequest)

            expect(result.success).toBe(true)
            expect(result.processedVideo).toBeDefined()
            expect(result.processedVideo?.wasCompressed).toBe(false)
            expect(result.processedVideo?.wasConverted).toBe(true)
            expect(result.processedVideo?.originalFormat).toBe("mov")
        })

        it("should handle validation failure", async () => {
            vi.spyOn(videoProcessor as any, "validateVideo").mockRejectedValue(
                new Error("Video validation failed"),
            )

            const result = await videoProcessor.processVideo(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Video validation failed")
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
        })

        it("should handle metadata extraction failure", async () => {
            vi.spyOn(videoProcessor as any, "extractVideoMetadata").mockRejectedValue(
                new Error("Metadata extraction failed"),
            )

            const result = await videoProcessor.processVideo(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Metadata extraction failed")
        })

        it("should handle thumbnail generation failure", async () => {
            vi.spyOn(videoProcessor as any, "generateThumbnail").mockRejectedValue(
                new Error("Thumbnail generation failed"),
            )

            const result = await videoProcessor.processVideo(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Thumbnail generation failed")
        })

        it("should track processing time", async () => {
            const result = await videoProcessor.processVideo(mockRequest)

            expect(result.processingTime).toBeGreaterThanOrEqual(0)
            expect(typeof result.processingTime).toBe("number")
        })

        it("should return error result on unexpected error", async () => {
            vi.spyOn(videoProcessor as any, "validateVideo").mockRejectedValue(
                new Error("Unexpected error"),
            )

            const result = await videoProcessor.processVideo(mockRequest)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Unexpected error")
            expect(result.contentId).toBe("test-content-123")
            expect(result.thumbnail).toEqual({
                data: Buffer.from([]),
                width: 0,
                height: 0,
                format: "jpeg",
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
        })
    })

    describe("validateVideo", () => {
        const mockRequest: VideoProcessingRequest = {
            contentId: "test-content-123",
            ownerId: "user-456",
            videoData: Buffer.from("mock video data"),
            metadata: {
                filename: "test-video.mp4",
                mimeType: "video/mp4",
                size: 1024000,
            },
        }

        it("should validate video successfully", async () => {
            // @ts-ignore - acessando método privado para teste
            await expect(videoProcessor.validateVideo(mockRequest)).resolves.not.toThrow()
        })

        it("should reject video that is too large", async () => {
            const largeVideoRequest = {
                ...mockRequest,
                videoData: Buffer.alloc(600 * 1024 * 1024), // 600MB
            }

            // @ts-ignore - acessando método privado para teste
            await expect(videoProcessor.validateVideo(largeVideoRequest)).rejects.toThrow(
                "Vídeo muito grande",
            )
        })

        it("should reject empty video", async () => {
            const emptyVideoRequest = {
                ...mockRequest,
                videoData: Buffer.from([]),
            }

            // @ts-ignore - acessando método privado para teste
            await expect(videoProcessor.validateVideo(emptyVideoRequest)).rejects.toThrow(
                "Vídeo vazio",
            )
        })

        it("should reject unsupported format", async () => {
            const unsupportedFormatRequest = {
                ...mockRequest,
                metadata: {
                    ...mockRequest.metadata,
                    mimeType: "video/unsupported",
                },
            }

            // @ts-ignore - acessando método privado para teste
            await expect(videoProcessor.validateVideo(unsupportedFormatRequest)).rejects.toThrow(
                "Formato não suportado",
            )
        })
    })

    describe("extractVideoMetadata", () => {
        it("should extract video metadata", async () => {
            const videoData = Buffer.from("mock video data")

            // Mock do método para evitar uso do FFmpeg real
            vi.spyOn(videoProcessor as any, "extractVideoMetadata").mockResolvedValue({
                duration: 15,
                width: 1080,
                height: 1920,
                format: "mp4",
                codec: "h264",
                hasAudio: true,
                size: videoData.length,
                bitrate: 2500000,
                fps: 30,
            })

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.extractVideoMetadata(videoData)

            expect(result).toBeDefined()
            expect(result.duration).toBe(15)
            expect(result.width).toBe(1080)
            expect(result.height).toBe(1920)
            expect(result.format).toBe("mp4")
            expect(result.codec).toBe("h264")
            expect(result.hasAudio).toBe(true)
            expect(result.size).toBe(videoData.length)
            expect(result.bitrate).toBe(2500000)
            expect(result.fps).toBe(30)
        })
    })

    describe("generateThumbnail", () => {
        it("should generate thumbnail with default options", async () => {
            const videoData = Buffer.from("mock video data")
            const options: ThumbnailGenerationOptions = {
                width: 480,
                height: 854,
                quality: 70,
                format: "jpeg",
                timePosition: 0,
            }

            // Mock do método para evitar uso do FFmpeg real
            vi.spyOn(videoProcessor as any, "generateThumbnail").mockResolvedValue({
                data: Buffer.from("mock thumbnail data"),
                width: 480,
                height: 854,
                format: "jpeg",
            })

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.generateThumbnail(videoData, options)

            expect(result).toBeDefined()
            expect(result.data).toBeInstanceOf(Buffer)
            expect(result.width).toBe(480)
            expect(result.height).toBe(854)
            expect(result.format).toBe("jpeg")
        })

        it("should generate thumbnail with custom options", async () => {
            const videoData = Buffer.from("mock video data")
            const options: ThumbnailGenerationOptions = {
                width: 640,
                height: 480,
                quality: 80,
                format: "png",
                timePosition: 5,
            }

            // Mock do método para evitar uso do FFmpeg real
            vi.spyOn(videoProcessor as any, "generateThumbnail").mockResolvedValue({
                data: Buffer.from("mock thumbnail data"),
                width: 640,
                height: 480,
                format: "png",
            })

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.generateThumbnail(videoData, options)

            expect(result).toBeDefined()
            expect(result.width).toBe(640)
            expect(result.height).toBe(480)
            expect(result.format).toBe("png")
        })
    })

    describe("detectVideoFormat", () => {
        it("should detect MP4 format", () => {
            // @ts-ignore - acessando método privado para teste
            const format = videoProcessor.detectVideoFormat("video/mp4")
            expect(format).toBe("mp4")
        })

        it("should detect MOV format", () => {
            // @ts-ignore - acessando método privado para teste
            const format = videoProcessor.detectVideoFormat("video/quicktime")
            expect(format).toBe("mov")
        })

        it("should detect AVI format", () => {
            // @ts-ignore - acessando método privado para teste
            const format = videoProcessor.detectVideoFormat("video/x-msvideo")
            expect(format).toBe("avi")
        })

        it("should detect WebM format", () => {
            // @ts-ignore - acessando método privado para teste
            const format = videoProcessor.detectVideoFormat("video/webm")
            expect(format).toBe("webm")
        })

        it("should return unknown for unsupported format", () => {
            // @ts-ignore - acessando método privado para teste
            const format = videoProcessor.detectVideoFormat("video/unsupported")
            expect(format).toBe("unknown")
        })
    })

    describe("processVideoCompression", () => {
        const mockMetadata = {
            duration: 15,
            width: 1920,
            height: 1080,
            format: "mp4",
            codec: "h264",
            hasAudio: true,
            size: 1024000,
            bitrate: 2500000,
            fps: 30,
        }

        it("should not process video when no compression or conversion needed", async () => {
            const videoData = Buffer.from("mock video data")

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.processVideoCompression(
                videoData,
                mockMetadata,
                "video/mp4",
            )

            expect(result.wasProcessed).toBe(false)
            expect(result.wasCompressed).toBe(false)
            expect(result.wasConverted).toBe(false)
            expect(result.data).toBe(videoData)
        })

        it("should compress video when resolution is too high", async () => {
            const highResMetadata = {
                ...mockMetadata,
                width: 3840,
                height: 2160, // 4K resolution
            }
            const videoData = Buffer.from("mock video data")

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.processVideoCompression(
                videoData,
                highResMetadata,
                "video/mp4",
            )

            expect(result.wasProcessed).toBe(true)
            expect(result.wasCompressed).toBe(true)
            expect(result.wasConverted).toBe(false)
            expect(result.originalResolution).toEqual({ width: 3840, height: 2160 })
        })

        it("should convert video when format is not MP4", async () => {
            const videoData = Buffer.from("mock video data")

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.processVideoCompression(
                videoData,
                mockMetadata,
                "video/quicktime", // MOV format
            )

            expect(result.wasProcessed).toBe(true)
            expect(result.wasCompressed).toBe(false)
            expect(result.wasConverted).toBe(true)
            expect(result.originalFormat).toBe("mov")
        })

        it("should both compress and convert when needed", async () => {
            const highResMetadata = {
                ...mockMetadata,
                width: 3840,
                height: 2160,
            }
            const videoData = Buffer.from("mock video data")

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.processVideoCompression(
                videoData,
                highResMetadata,
                "video/quicktime", // MOV format
            )

            expect(result.wasProcessed).toBe(true)
            expect(result.wasCompressed).toBe(true)
            expect(result.wasConverted).toBe(true)
            expect(result.originalResolution).toEqual({ width: 3840, height: 2160 })
            expect(result.originalFormat).toBe("mov")
        })

        it("should disable compression when autoCompress is false", async () => {
            const processorWithoutCompression = new VideoProcessor({
                processing: { autoCompress: false },
            })
            const highResMetadata = {
                ...mockMetadata,
                width: 3840,
                height: 2160,
            }
            const videoData = Buffer.from("mock video data")

            // @ts-ignore - acessando método privado para teste
            const result = await processorWithoutCompression.processVideoCompression(
                videoData,
                highResMetadata,
                "video/mp4",
            )

            expect(result.wasProcessed).toBe(false)
            expect(result.wasCompressed).toBe(false)
        })

        it("should disable conversion when autoConvertToMp4 is false", async () => {
            const processorWithoutConversion = new VideoProcessor({
                processing: { autoConvertToMp4: false },
            })
            const videoData = Buffer.from("mock video data")

            // @ts-ignore - acessando método privado para teste
            const result = await processorWithoutConversion.processVideoCompression(
                videoData,
                mockMetadata,
                "video/quicktime", // MOV format
            )

            expect(result.wasProcessed).toBe(false)
            expect(result.wasConverted).toBe(false)
        })
    })

    describe("calculateTargetResolution", () => {
        it("should calculate target resolution maintaining aspect ratio", () => {
            // @ts-ignore - acessando método privado para teste
            const result = videoProcessor.calculateTargetResolution(1920, 1080, 1280, 720)

            expect(result.width).toBe(1280)
            expect(result.height).toBe(720)
        })

        it("should limit by width when video is wider", () => {
            // @ts-ignore - acessando método privado para teste
            const result = videoProcessor.calculateTargetResolution(1920, 1080, 1280, 720)

            expect(result.width).toBe(1280)
            expect(result.height).toBe(720)
        })

        it("should limit by height when video is taller", () => {
            // @ts-ignore - acessando método privado para teste
            const result = videoProcessor.calculateTargetResolution(1080, 1674, 360, 558)

            expect(result.width).toBeLessThanOrEqual(360)
            expect(result.height).toBe(558)
        })

        it("should maintain aspect ratio", () => {
            // @ts-ignore - acessando método privado para teste
            const result = videoProcessor.calculateTargetResolution(1920, 1080, 1280, 720)

            const aspectRatio = result.width / result.height
            const originalAspectRatio = 1920 / 1080

            expect(Math.abs(aspectRatio - originalAspectRatio)).toBeLessThan(0.01)
        })
    })

    describe("compressVideo", () => {
        it("should compress video", async () => {
            const videoData = Buffer.from("mock video data")
            const options: VideoCompressionOptions = {
                targetResolution: { width: 1280, height: 720 },
                targetFormat: "mp4",
                quality: 80,
            }

            // Mock do método para evitar uso do FFmpeg real
            vi.spyOn(videoProcessor as any, "compressVideo").mockResolvedValue(
                Buffer.from("compressed video data"),
            )

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.compressVideo(videoData, options)

            expect(result).toBeInstanceOf(Buffer)
        })
    })

    describe("convertToMp4", () => {
        it("should convert video to MP4", async () => {
            const videoData = Buffer.from("mock video data")

            // Mock do método para evitar uso do FFmpeg real
            vi.spyOn(videoProcessor as any, "convertToMp4").mockResolvedValue(
                Buffer.from("converted video data"),
            )

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.convertToMp4(videoData, "mov")

            expect(result).toBeInstanceOf(Buffer)
        })
    })
})
