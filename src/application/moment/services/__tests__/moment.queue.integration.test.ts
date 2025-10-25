import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentStatusEnum, MomentVisibilityEnum } from "../../../../domain/moment"
import { EmbeddingsQueue } from "../../../../infra/queue/embeddings.queue"
import { VideoCompressionQueue } from "../../../../infra/queue/video.compression.queue"
import { EmbeddingJobPriority } from "../../../../infra/workers/types/embedding.job.types"
import { CreateMomentData, MomentService } from "../moment.service"

// Mock das filas
vi.mock("../../../../infra/queue/embeddings.queue")
vi.mock("../../../../infra/queue/video.compression.queue")

// Mock do textLib
vi.mock("../../../../shared", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
    textLib: {
        validator: {
            description: vi.fn(),
            username: vi.fn(),
        },
    },
}))

describe("MomentService - Queue Integration", () => {
    let momentService: MomentService
    let mockMomentRepository: any
    let mockMomentMetricsService: any
    let mockEmbeddingsQueue: any
    let mockVideoCompressionQueue: any
    let mockContentProcessor: any
    let mockStorageAdapter: any
    let mockModerationEngine: any

    const mockMoment: any = {
        id: "moment_123",
        ownerId: "user_123",
        status: { current: MomentStatusEnum.PUBLISHED } as any,
        visibility: { level: MomentVisibilityEnum.PUBLIC } as any,
        content: {
            duration: 30,
            size: 1024,
            format: "mp4",
            resolution: { width: 360, height: 558, quality: "medium" },
            hasAudio: true,
            codec: "av1",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        description: "Test moment",
        hashtags: ["#test"],
        mentions: ["@user"],
        processing: {
            status: "MEDIA_PROCESSED",
            progress: 50,
            steps: [],
            error: null,
            startedAt: new Date(),
            completedAt: null,
            estimatedCompletion: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    const mockProcessingResult = {
        success: true,
        contentId: "moment_123",
        videoUrl: "https://storage.example.com/videos/moment_123.mp4",
        thumbnailUrl: "https://storage.example.com/thumbnails/moment_123.jpg",
        videoMetadata: {
            width: 1080,
            height: 1674,
            duration: 30,
            codec: "h264",
            hasAudio: true,
            size: 1024000,
            format: "mp4",
        },
        moderation: {
            approved: true,
            requiresReview: false,
            flags: [],
            score: 0.1,
        },
        storage: {
            provider: "local",
            bucket: "uploads",
            videoKey: "videos/moment_123.mp4",
            thumbnailKey: "thumbnails/moment_123.jpg",
            region: "us-east-1",
        },
    }

    beforeEach(() => {
        // Mock do repository
        mockMomentRepository = {
            create: vi.fn().mockResolvedValue(mockMoment),
            findById: vi.fn(),
            update: vi.fn().mockResolvedValue(mockMoment),
            hasUserLikedMoment: vi.fn(),
            addLike: vi.fn(),
            removeLike: vi.fn(),
        }

        // Mock do metrics service
        mockMomentMetricsService = {
            recordView: vi.fn(),
            getMetrics: vi.fn(),
            getAggregatedMetrics: vi.fn(),
        }

        // Mock das filas
        mockEmbeddingsQueue = {
            scheduleFor: vi.fn().mockResolvedValue({ id: "embedding-job-123" }),
            addJob: vi.fn().mockResolvedValue({ id: "embedding-job-123" }),
            getJob: vi.fn(),
            removeJob: vi.fn(),
            getStats: vi.fn(),
            clean: vi.fn(),
            close: vi.fn(),
            getQueue: vi.fn(),
        }

        mockVideoCompressionQueue = {
            addJob: vi.fn().mockResolvedValue({ id: "compression-job-123" }),
            scheduleFor: vi.fn().mockResolvedValue({ id: "compression-job-123" }),
            getJob: vi.fn(),
            removeJob: vi.fn(),
            getStats: vi.fn(),
            clean: vi.fn(),
            close: vi.fn(),
            getQueue: vi.fn(),
        }

        // Mock do storage adapter
        mockStorageAdapter = {
            upload: vi.fn(),
            download: vi.fn(),
            delete: vi.fn(),
            exists: vi.fn(),
            getUrl: vi.fn(),
        }

        // Mock do moderation engine
        mockModerationEngine = {
            moderateContent: vi.fn(),
            moderateVideo: vi.fn(),
            moderateText: vi.fn(),
        }

        // Mock do content processor
        mockContentProcessor = {
            processContent: vi.fn().mockResolvedValue(mockProcessingResult),
        }

        // Mock das classes singleton
        vi.mocked(EmbeddingsQueue.getInstance).mockReturnValue(mockEmbeddingsQueue)
        vi.mocked(VideoCompressionQueue.getInstance).mockReturnValue(mockVideoCompressionQueue)

        // Criar instância do serviço com mocks
        momentService = new MomentService(
            mockMomentRepository,
            mockMomentMetricsService,
            {
                enableValidation: true,
                enableMetrics: true,
                enableProcessing: true,
            },
            mockStorageAdapter,
            mockModerationEngine,
        )

        // Substituir o contentProcessor mockado
        ;(momentService as any).contentProcessor = mockContentProcessor
    })

    describe("Embedding Queue Scheduling", () => {
        it("deve agendar embedding com horário correto", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                description: "Test moment",
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert
            expect(mockEmbeddingsQueue.scheduleFor).toHaveBeenCalledWith(
                expect.objectContaining({
                    momentId: "moment_123",
                    videoUrl: "https://storage.example.com/videos/moment_123.mp4",
                    thumbnailUrl: "https://storage.example.com/thumbnails/moment_123.jpg",
                    description: "Test moment",
                    hashtags: [],
                    videoMetadata: expect.objectContaining({
                        width: 1080,
                        height: 1674,
                        duration: 30,
                        codec: "h264",
                        hasAudio: true,
                    }),
                    priority: EmbeddingJobPriority.NORMAL,
                }),
                expect.any(String), // Aceita qualquer string de horário
            )
        })

        it("deve usar horário personalizado do ambiente", async () => {
            // Arrange
            const originalScheduleTime = process.env.EMBEDDINGS_SCHEDULE_TIME
            process.env.EMBEDDINGS_SCHEDULE_TIME = "14:30"

            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert
            expect(mockEmbeddingsQueue.scheduleFor).toHaveBeenCalledWith(
                expect.any(Object),
                "14:30",
            )

            // Cleanup
            process.env.EMBEDDINGS_SCHEDULE_TIME = originalScheduleTime
        })

        it("deve incluir todos os dados necessários no job de embedding", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                description: "Test moment with description",
                mentions: ["@user1", "@user2"],
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert
            expect(mockEmbeddingsQueue.scheduleFor).toHaveBeenCalledWith(
                expect.objectContaining({
                    momentId: "moment_123",
                    videoUrl: "https://storage.example.com/videos/moment_123.mp4",
                    thumbnailUrl: "https://storage.example.com/thumbnails/moment_123.jpg",
                    description: expect.any(String), // Aceita qualquer string de descrição
                    hashtags: [],
                    videoMetadata: expect.objectContaining({
                        width: 1080,
                        height: 1674,
                        duration: 30,
                        codec: "h264",
                        hasAudio: true,
                    }),
                    priority: EmbeddingJobPriority.NORMAL,
                }),
                expect.any(String),
            )
        })

        it("deve usar prioridade NORMAL para embedding", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert
            expect(mockEmbeddingsQueue.scheduleFor).toHaveBeenCalledWith(
                expect.objectContaining({
                    priority: EmbeddingJobPriority.NORMAL,
                }),
                expect.any(String),
            )
        })

        it("deve atualizar status do momento após agendar embedding", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert - verifica que o repository.update foi chamado com status de embedding
            expect(mockMomentRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    processing: expect.objectContaining({
                        status: expect.stringMatching(/embeddings_queued|EMBEDDINGS_QUEUED/i),
                    }),
                }),
            )
        })
    })

    describe("Video Compression Queue", () => {
        it("deve enfileirar compressão imediatamente", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert
            expect(mockVideoCompressionQueue.addJob).toHaveBeenCalledWith(
                expect.objectContaining({
                    momentId: "moment_123",
                    originalVideoUrl: "https://storage.example.com/videos/moment_123.mp4",
                    videoMetadata: {
                        width: 1080,
                        height: 1674,
                        duration: 30,
                        codec: "h264",
                        hasAudio: true,
                        size: 1024000,
                    },
                    priority: EmbeddingJobPriority.HIGH,
                }),
                EmbeddingJobPriority.HIGH,
            )
        })

        it("deve usar prioridade HIGH para compressão", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert
            expect(mockVideoCompressionQueue.addJob).toHaveBeenCalledWith(
                expect.objectContaining({
                    priority: EmbeddingJobPriority.HIGH,
                }),
                EmbeddingJobPriority.HIGH,
            )
        })

        it("deve incluir todos os dados necessários no job de compressão", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert
            expect(mockVideoCompressionQueue.addJob).toHaveBeenCalledWith(
                expect.objectContaining({
                    momentId: "moment_123",
                    originalVideoUrl: "https://storage.example.com/videos/moment_123.mp4",
                    videoMetadata: {
                        width: 1080,
                        height: 1674,
                        duration: 30,
                        codec: "h264",
                        hasAudio: true,
                        size: 1024000,
                    },
                }),
                EmbeddingJobPriority.HIGH,
            )
        })

        it("deve atualizar status do momento após enfileirar compressão", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert - verifica que o repository.update foi chamado múltiplas vezes
            // (uma para compressão, uma para embedding, etc.)
            expect(mockMomentRepository.update).toHaveBeenCalledTimes(4)

            // Verifica que pelo menos uma chamada contém steps de compressão
            const updateCalls = mockMomentRepository.update.mock.calls
            const hasCompressionStep = updateCalls.some((call) =>
                call[0]?.processing?.steps?.some((step: any) => step.name === "video_compression"),
            )
            expect(hasCompressionStep).toBe(true)
        })
    })

    describe("Integration Tests", () => {
        it("deve criar ambos os jobs após createMoment", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert
            expect(mockVideoCompressionQueue.addJob).toHaveBeenCalledTimes(1)
            expect(mockEmbeddingsQueue.scheduleFor).toHaveBeenCalledTimes(1)
        })

        it("deve lidar com erro no agendamento de embedding", async () => {
            // Arrange
            mockEmbeddingsQueue.scheduleFor.mockRejectedValue(new Error("Queue error"))
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act & Assert - não deve lançar erro, apenas logar
            await expect(momentService.createMoment(createData)).resolves.toBeDefined()
            expect(mockVideoCompressionQueue.addJob).toHaveBeenCalledTimes(1)
        })

        it("deve lidar com erro no enfileiramento de compressão", async () => {
            // Arrange
            mockVideoCompressionQueue.addJob.mockRejectedValue(new Error("Compression queue error"))
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act & Assert - não deve lançar erro, apenas logar
            await expect(momentService.createMoment(createData)).resolves.toBeDefined()
            expect(mockEmbeddingsQueue.scheduleFor).toHaveBeenCalledTimes(1)
        })

        it("deve usar IDs corretos para os jobs", async () => {
            // Arrange
            const createData: CreateMomentData = {
                ownerId: "user_123",
                ownerUsername: "testuser",
                videoData: Buffer.from("test video data"),
                videoMetadata: {
                    filename: "test.mp4",
                    mimeType: "video/mp4",
                    size: 1024,
                },
                visibility: MomentVisibilityEnum.PUBLIC,
            }

            // Act
            await momentService.createMoment(createData)

            // Assert
            expect(mockVideoCompressionQueue.addJob).toHaveBeenCalledWith(
                expect.objectContaining({
                    momentId: "moment_123",
                }),
                EmbeddingJobPriority.HIGH,
            )

            expect(mockEmbeddingsQueue.scheduleFor).toHaveBeenCalledWith(
                expect.objectContaining({
                    momentId: "moment_123",
                }),
                expect.any(String),
            )
        })
    })
})
