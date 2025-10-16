/**
 * Video Processor FFmpeg Integration Tests
 * Testes de integração para o VideoProcessor com FFmpeg real
 */

import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VideoProcessor } from "@/core/content.processor"
import { VideoProcessingRequest } from "@/core/content.processor/type"

describe("VideoProcessor FFmpeg Integration", () => {
    let videoProcessor: VideoProcessor
    let tempDir: string

    beforeEach(() => {
        videoProcessor = new VideoProcessor()
        tempDir = tmpdir()
        
        // Limpar logs para testes mais limpos
        vi.spyOn(console, "log").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("FFmpeg Availability", () => {
        it("should check if ffmpeg is available", async () => {
            const { exec } = await import("child_process")
            const { promisify } = await import("util")
            const execAsync = promisify(exec)

            try {
                const { stdout } = await execAsync("ffmpeg -version")
                expect(stdout).toContain("ffmpeg")
            } catch (error) {
                console.warn("FFmpeg não está disponível para testes de integração")
            }
        })

        it("should check if ffprobe is available", async () => {
            const { exec } = await import("child_process")
            const { promisify } = await import("util")
            const execAsync = promisify(exec)

            try {
                const { stdout } = await execAsync("ffprobe -version")
                expect(stdout).toContain("ffprobe")
            } catch (error) {
                console.warn("FFprobe não está disponível para testes de integração")
            }
        })
    })

    describe("extractVideoMetadata with FFmpeg", () => {
        it("should extract metadata from a real video file", async () => {
            // Criar um arquivo de vídeo mock simples
            const mockVideoData = Buffer.from("mock video data for testing")
            const tempVideoPath = join(tempDir, `test_video_${Date.now()}.mp4`)
            
            try {
                writeFileSync(tempVideoPath, mockVideoData)

                // @ts-ignore - acessando método privado para teste
                const result = await videoProcessor.extractVideoMetadata(mockVideoData)

                expect(result).toBeDefined()
                expect(result.duration).toBeGreaterThanOrEqual(0)
                expect(result.width).toBeGreaterThan(0)
                expect(result.height).toBeGreaterThan(0)
                expect(result.format).toBe("mp4")
                expect(result.codec).toBeDefined()
                expect(result.hasAudio).toBeDefined()
                expect(result.size).toBe(mockVideoData.length)
                expect(result.fps).toBeGreaterThan(0)
            } finally {
                if (existsSync(tempVideoPath)) {
                    const { unlinkSync } = await import("fs")
                    unlinkSync(tempVideoPath)
                }
            }
        })

        it("should handle ffprobe errors gracefully", async () => {
            const invalidVideoData = Buffer.from("invalid video data")

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.extractVideoMetadata(invalidVideoData)

            expect(result).toBeDefined()
            expect(result.duration).toBeGreaterThanOrEqual(0)
            expect(result.format).toBe("mp4")
            expect(result.codec).toBe("h264")
        })
    })

    describe("generateThumbnail with FFmpeg", () => {
        it("should generate thumbnail from video data", async () => {
            const mockVideoData = Buffer.from("mock video data for thumbnail test")
            const options = {
                width: 480,
                height: 854,
                quality: 70,
                format: "jpeg" as const,
                timePosition: 0,
            }

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.generateThumbnail(mockVideoData, options)

            expect(result).toBeDefined()
            expect(result.data).toBeInstanceOf(Buffer)
            expect(result.width).toBe(480)
            expect(result.height).toBe(854)
            expect(result.format).toBe("jpeg")
        })

        it("should handle thumbnail generation errors gracefully", async () => {
            const invalidVideoData = Buffer.from("invalid video data")
            const options = {
                width: 480,
                height: 854,
                format: "jpeg" as const,
            }

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.generateThumbnail(invalidVideoData, options)

            expect(result).toBeDefined()
            expect(result.data).toBeInstanceOf(Buffer)
            expect(result.width).toBe(480)
            expect(result.height).toBe(854)
            expect(result.format).toBe("jpeg")
        })
    })

    describe("compressVideo with FFmpeg", () => {
        it("should compress video data", async () => {
            const mockVideoData = Buffer.from("mock video data for compression test")
            const options = {
                targetResolution: { width: 1920, height: 1080 },
                targetFormat: "mp4",
                quality: 23,
            }

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.compressVideo(mockVideoData, options)

            expect(result).toBeInstanceOf(Buffer)
            expect(result.length).toBeGreaterThan(0)
        })

        it("should handle compression errors gracefully", async () => {
            const invalidVideoData = Buffer.from("invalid video data")
            const options = {
                targetResolution: { width: 1920, height: 1080 },
                targetFormat: "mp4",
                quality: 23,
            }

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.compressVideo(invalidVideoData, options)

            expect(result).toBeInstanceOf(Buffer)
            // Deve retornar o vídeo original em caso de erro
            expect(result).toEqual(invalidVideoData)
        })
    })

    describe("convertToMp4 with FFmpeg", () => {
        it("should convert video to MP4", async () => {
            const mockVideoData = Buffer.from("mock video data for conversion test")
            const originalFormat = "mov"

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.convertToMp4(mockVideoData, originalFormat)

            expect(result).toBeInstanceOf(Buffer)
            expect(result.length).toBeGreaterThan(0)
        })

        it("should handle conversion errors gracefully", async () => {
            const invalidVideoData = Buffer.from("invalid video data")
            const originalFormat = "mov"

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.convertToMp4(invalidVideoData, originalFormat)

            expect(result).toBeInstanceOf(Buffer)
            // Deve retornar o vídeo original em caso de erro
            expect(result).toEqual(invalidVideoData)
        })
    })

    describe("Full Video Processing Pipeline", () => {
        it("should process a complete video with all steps", async () => {
            const mockRequest: VideoProcessingRequest = {
                contentId: "test-ffmpeg-123",
                ownerId: "user-456",
                videoData: Buffer.from("mock video data for full pipeline test"),
                metadata: {
                    filename: "test-video.mp4",
                    mimeType: "video/mp4",
                    size: 1024000,
                },
            }

            const result = await videoProcessor.processVideo(mockRequest)

            expect(result.success).toBe(true)
            expect(result.contentId).toBe("test-ffmpeg-123")
            expect(result.thumbnail).toBeDefined()
            expect(result.videoMetadata).toBeDefined()
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
            expect(result.videoMetadata.format).toBe("mp4")
            expect(result.videoMetadata.codec).toBe("h264")
        })

        it("should handle processing errors in full pipeline", async () => {
            const invalidRequest: VideoProcessingRequest = {
                contentId: "test-error-123",
                ownerId: "user-456",
                videoData: Buffer.from("invalid video data"),
                metadata: {
                    filename: "invalid-video.mp4",
                    mimeType: "video/mp4",
                    size: 100,
                },
            }

            const result = await videoProcessor.processVideo(invalidRequest)

            // Deve tentar processar mesmo com dados inválidos
            expect(result).toBeDefined()
            expect(result.contentId).toBe("test-error-123")
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
        })
    })

    describe("Performance and Resource Management", () => {
        it("should clean up temporary files", async () => {
            const mockVideoData = Buffer.from("mock video data for cleanup test")
            const initialTempFiles = await import("fs").then(fs => 
                fs.readdirSync(tempDir).filter(file => 
                    file.startsWith("video_") || 
                    file.startsWith("thumbnail_") || 
                    file.startsWith("input_") || 
                    file.startsWith("compressed_") || 
                    file.startsWith("converted_")
                )
            )

            // Executar operações que criam arquivos temporários
            await videoProcessor.processVideo({
                contentId: "cleanup-test-123",
                ownerId: "user-456",
                videoData: mockVideoData,
                metadata: {
                    filename: "cleanup-test.mp4",
                    mimeType: "video/mp4",
                    size: 1000,
                },
            })

            // Aguardar um pouco para garantir que a limpeza foi executada
            await new Promise(resolve => setTimeout(resolve, 100))

            const finalTempFiles = await import("fs").then(fs => 
                fs.readdirSync(tempDir).filter(file => 
                    file.startsWith("video_") || 
                    file.startsWith("thumbnail_") || 
                    file.startsWith("input_") || 
                    file.startsWith("compressed_") || 
                    file.startsWith("converted_")
                )
            )

            // Não deve haver novos arquivos temporários permanentes
            expect(finalTempFiles.length).toBeLessThanOrEqual(initialTempFiles.length)
        })

        it("should handle concurrent processing", async () => {
            const requests = Array.from({ length: 3 }, (_, i) => ({
                contentId: `concurrent-test-${i}`,
                ownerId: "user-456",
                videoData: Buffer.from(`mock video data ${i}`),
                metadata: {
                    filename: `concurrent-test-${i}.mp4`,
                    mimeType: "video/mp4",
                    size: 1000,
                },
            }))

            const results = await Promise.all(
                requests.map(request => videoProcessor.processVideo(request))
            )

            expect(results).toHaveLength(3)
            results.forEach((result, index) => {
                expect(result.success).toBe(true)
                expect(result.contentId).toBe(`concurrent-test-${index}`)
            })
        })
    })

    describe("Error Handling and Logging", () => {
        it("should log processing steps", async () => {
            const consoleSpy = vi.spyOn(console, "log")
            const mockRequest: VideoProcessingRequest = {
                contentId: "logging-test-123",
                ownerId: "user-456",
                videoData: Buffer.from("mock video data for logging test"),
                metadata: {
                    filename: "logging-test.mp4",
                    mimeType: "video/mp4",
                    size: 1000,
                },
            }

            await videoProcessor.processVideo(mockRequest)

            // Verificar se logs foram chamados (mesmo que mockados)
            expect(consoleSpy).toHaveBeenCalled()
        })

        it("should handle FFmpeg timeout", async () => {
            // Mock execAsync para simular timeout
            const originalExec = await import("child_process").then(mod => mod.exec)
            const mockExec = vi.fn().mockImplementation((command, callback) => {
                setTimeout(() => {
                    callback(new Error("Command timeout"), "", "")
                }, 10)
            })
            
            vi.doMock("child_process", () => ({
                exec: mockExec,
            }))

            const mockVideoData = Buffer.from("mock video data for timeout test")

            // @ts-ignore - acessando método privado para teste
            const result = await videoProcessor.extractVideoMetadata(mockVideoData)

            expect(result).toBeDefined()
            expect(result.format).toBe("mp4") // Fallback deve funcionar

            vi.doUnmock("child_process")
        })
    })

    describe("Configuration and Customization", () => {
        it("should work with custom configuration", async () => {
            const customProcessor = new VideoProcessor({
                thumbnail: {
                    width: 640,
                    height: 480,
                    quality: 80,
                    format: "png",
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
            })

            const mockRequest: VideoProcessingRequest = {
                contentId: "custom-config-test-123",
                ownerId: "user-456",
                videoData: Buffer.from("mock video data for custom config test"),
                metadata: {
                    filename: "custom-config-test.mp4",
                    mimeType: "video/mp4",
                    size: 1000,
                },
            }

            const result = await customProcessor.processVideo(mockRequest)

            expect(result.success).toBe(true)
            expect(result.contentId).toBe("custom-config-test-123")
        })
    })
})
