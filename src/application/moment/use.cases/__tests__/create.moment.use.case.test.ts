import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentStatusEnum, MomentVisibilityEnum } from "../../../../domain/moment"
import { CreateMomentRequest, CreateMomentUseCase } from "../create.moment.use.case"

describe("CreateMomentUseCase", () => {
    let createMomentUseCase: CreateMomentUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const validRequest: CreateMomentRequest = {
        ownerId: "user_123",
        description: "Meu primeiro vlog",
        hashtags: ["#vlog", "#primeiro"],
        mentions: ["@amigo"],
        content: {
            duration: 60,
            size: 1024 * 1024,
            format: "mp4",
            hasAudio: true,
            codec: "h264",
            resolution: {
                width: 720,
                height: 1280,
                quality: "medium",
            },
        },
        media: {
            urls: {
                low: "https://example.com/low.mp4",
                medium: "https://example.com/medium.mp4",
                high: "https://example.com/high.mp4",
            },
            storage: {
                provider: "aws",
                bucket: "moment-videos",
                key: "videos/123.mp4",
                region: "us-east-1",
            },
        },
        thumbnail: {
            url: "https://example.com/thumb.jpg",
            width: 360,
            height: 640,
            storage: {
                provider: "aws",
                bucket: "moment-thumbnails",
                key: "thumbnails/123.jpg",
                region: "us-east-1",
            },
        },
        context: {
            device: {
                type: "mobile",
                os: "iOS",
                osVersion: "17.0",
                model: "iPhone 15",
                screenResolution: "1170x2532",
                orientation: "portrait",
            },
            location: {
                latitude: -23.5505,
                longitude: -46.6333,
            },
        },
    }

    beforeEach(() => {
        mockMomentRepository = {
            create: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findByOwnerId: vi.fn(),
            findByStatus: vi.fn(),
            findByVisibility: vi.fn(),
            findByHashtag: vi.fn(),
            findByMention: vi.fn(),
            search: vi.fn(),
            findPublished: vi.fn(),
            findRecent: vi.fn(),
            findPendingProcessing: vi.fn(),
            findFailedProcessing: vi.fn(),
            countByOwnerId: vi.fn(),
            countByStatus: vi.fn(),
            countByVisibility: vi.fn(),
            countPublished: vi.fn(),
            exists: vi.fn(),
            existsByOwnerId: vi.fn(),
            createMany: vi.fn(),
            updateMany: vi.fn(),
            deleteMany: vi.fn(),
            findPaginated: vi.fn(),
        }

        mockMomentService = {
            createMoment: vi.fn(),
            createMomentsBatch: vi.fn(),
            getMomentById: vi.fn(),
            getMomentsByOwner: vi.fn(),
            getMomentsByStatus: vi.fn(),
            getMomentsByVisibility: vi.fn(),
            getMomentsByHashtag: vi.fn(),
            getMomentsByMention: vi.fn(),
            getPublishedMoments: vi.fn(),
            getRecentMoments: vi.fn(),
            searchMoments: vi.fn(),
            updateMoment: vi.fn(),
            updateMomentsBatch: vi.fn(),
            deleteMoment: vi.fn(),
            deleteMomentsBatch: vi.fn(),
            countMomentsByOwner: vi.fn(),
            countMomentsByStatus: vi.fn(),
            countMomentsByVisibility: vi.fn(),
            countPublishedMoments: vi.fn(),
            momentExists: vi.fn(),
            ownerHasMoments: vi.fn(),
        } as any

        createMomentUseCase = new CreateMomentUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve criar momento com sucesso", async () => {
            // Arrange
            const mockMoment = {
                id: "moment_123",
                ownerId: "user_123",
                description: "Meu primeiro vlog",
                hashtags: ["#vlog", "#primeiro"],
                mentions: ["@amigo"],
                content: validRequest.content,
                media: validRequest.media,
                thumbnail: validRequest.thumbnail,
                metrics: {} as any,
                status: {
                    current: MomentStatusEnum.UNDER_REVIEW,
                    previous: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                visibility: {
                    level: MomentVisibilityEnum.PUBLIC,
                    allowedUsers: [],
                    blockedUsers: [],
                    ageRestriction: false,
                    contentWarning: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                processing: {} as any,
                context: validRequest.context,
                embedding: {} as any,
                createdAt: new Date(),
                updatedAt: new Date(),
                publishedAt: null,
                archivedAt: null,
                deletedAt: null,
            } as any

            mockMomentService.createMoment.mockResolvedValue(mockMoment)

            // Act
            const result = await createMomentUseCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.createMoment).toHaveBeenCalledWith({
                ownerId: validRequest.ownerId,
                description: validRequest.description,
                hashtags: validRequest.hashtags,
                mentions: validRequest.mentions,
                content: validRequest.content,
                media: validRequest.media,
                thumbnail: validRequest.thumbnail,
                context: validRequest.context,
            })
        })

        it("deve falhar quando ownerId não é fornecido", async () => {
            // Arrange
            const invalidRequest = { ...validRequest, ownerId: "" }

            // Act
            const result = await createMomentUseCase.execute(invalidRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Owner ID é obrigatório")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.createMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando conteúdo não é fornecido", async () => {
            // Arrange
            const invalidRequest = { ...validRequest, content: undefined as any }

            // Act
            const result = await createMomentUseCase.execute(invalidRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Conteúdo, mídia e thumbnail são obrigatórios")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.createMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando mídia não é fornecida", async () => {
            // Arrange
            const invalidRequest = { ...validRequest, media: undefined as any }

            // Act
            const result = await createMomentUseCase.execute(invalidRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Conteúdo, mídia e thumbnail são obrigatórios")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.createMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando thumbnail não é fornecido", async () => {
            // Arrange
            const invalidRequest = { ...validRequest, thumbnail: undefined as any }

            // Act
            const result = await createMomentUseCase.execute(invalidRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Conteúdo, mídia e thumbnail são obrigatórios")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.createMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando service lança erro", async () => {
            // Arrange
            mockMomentService.createMoment.mockRejectedValue(new Error("Erro de validação"))

            // Act
            const result = await createMomentUseCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de validação")
            expect(result.moment).toBeUndefined()
        })

        it("deve criar momento com propriedades opcionais", async () => {
            // Arrange
            const minimalRequest: CreateMomentRequest = {
                ownerId: "user_123",
                content: validRequest.content,
                media: validRequest.media,
                thumbnail: validRequest.thumbnail,
            }

            const mockMoment = {
                id: "moment_123",
                ownerId: "user_123",
                description: "",
                hashtags: [],
                mentions: [],
                content: minimalRequest.content,
                media: minimalRequest.media,
                thumbnail: minimalRequest.thumbnail,
                metrics: {} as any,
                status: {
                    current: MomentStatusEnum.UNDER_REVIEW,
                    previous: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                visibility: {
                    level: MomentVisibilityEnum.PUBLIC,
                    allowedUsers: [],
                    blockedUsers: [],
                    ageRestriction: false,
                    contentWarning: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                processing: {} as any,
                context: undefined,
                embedding: {} as any,
                createdAt: new Date(),
                updatedAt: new Date(),
                publishedAt: null,
                archivedAt: null,
                deletedAt: null,
            } as any

            mockMomentService.createMoment.mockResolvedValue(mockMoment)

            // Act
            const result = await createMomentUseCase.execute(minimalRequest)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(mockMomentService.createMoment).toHaveBeenCalledWith({
                ownerId: minimalRequest.ownerId,
                description: "",
                hashtags: [],
                mentions: [],
                content: minimalRequest.content,
                media: minimalRequest.media,
                thumbnail: minimalRequest.thumbnail,
                context: undefined,
            })
        })
    })
})
