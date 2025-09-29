import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    MomentEntity,
    MomentProcessingStatusEnum,
    MomentStatusEnum,
} from "../../../../domain/moment"
import { PublishMomentRequest, PublishMomentUseCase } from "../publish.moment.use.case"

describe("PublishMomentUseCase", () => {
    let publishMomentUseCase: PublishMomentUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockMomentReadyForPublish: MomentEntity = {
        id: "moment_123",
        ownerId: "user_123",
        description: "Meu vlog",
        hashtags: ["#vlog"],
        mentions: [],
        status: {
            current: MomentStatusEnum.UNDER_REVIEW,
            previous: null,
            reason: null,
            changedBy: null,
            changedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        processing: {
            status: MomentProcessingStatusEnum.COMPLETED,
            progress: 100,
            steps: [],
            error: null,
            startedAt: new Date(),
            completedAt: new Date(),
            estimatedCompletion: null,
        },
        content: {
            duration: 60,
            size: 1024,
            format: "mp4",
            width: 1080,
            height: 1920,
            hasAudio: true,
            codec: "h264",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        archivedAt: null,
        deletedAt: null,
    } as any

    const mockPublishedMoment: MomentEntity = {
        ...mockMomentReadyForPublish,
        status: {
            ...mockMomentReadyForPublish.status,
            current: MomentStatusEnum.PUBLISHED,
            previous: MomentStatusEnum.UNDER_REVIEW,
            reason: "Publicado pelo usuário",
            changedBy: "user_123",
            changedAt: new Date(),
        },
        publishedAt: new Date(),
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

        publishMomentUseCase = new PublishMomentUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve publicar momento com sucesso", async () => {
            // Arrange
            const request: PublishMomentRequest = {
                momentId: "moment_123",
                userId: "user_123",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMomentReadyForPublish)
            mockMomentService.updateMoment.mockResolvedValue(mockPublishedMoment)

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockPublishedMoment)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.updateMoment).toHaveBeenCalledWith("moment_123", {
                status: MomentStatusEnum.PUBLISHED,
            })
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const request: PublishMomentRequest = {
                momentId: "moment_inexistente",
                userId: "user_123",
            }

            mockMomentService.getMomentById.mockResolvedValue(null)

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não encontrado")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.updateMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando usuário não é o dono do momento", async () => {
            // Arrange
            const request: PublishMomentRequest = {
                momentId: "moment_123",
                userId: "user_456", // Usuário diferente do owner
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMomentReadyForPublish)

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Apenas o dono do momento pode publicá-lo")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.updateMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momento já está publicado", async () => {
            // Arrange
            const alreadyPublishedMoment = {
                ...mockMomentReadyForPublish,
                status: {
                    ...mockMomentReadyForPublish.status,
                    current: MomentStatusEnum.PUBLISHED,
                },
                publishedAt: new Date(),
            }

            const request: PublishMomentRequest = {
                momentId: "moment_123",
                userId: "user_123",
            }

            mockMomentService.getMomentById.mockResolvedValue(alreadyPublishedMoment)

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser publicado no estado atual")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.updateMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momento está bloqueado", async () => {
            // Arrange
            const blockedMoment = {
                ...mockMomentReadyForPublish,
                status: {
                    ...mockMomentReadyForPublish.status,
                    current: MomentStatusEnum.BLOCKED,
                },
            }

            const request: PublishMomentRequest = {
                momentId: "moment_123",
                userId: "user_123",
            }

            mockMomentService.getMomentById.mockResolvedValue(blockedMoment)

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser publicado no estado atual")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.updateMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando processamento não foi concluído", async () => {
            // Arrange
            const processingMoment = {
                ...mockMomentReadyForPublish,
                processing: {
                    ...mockMomentReadyForPublish.processing,
                    status: MomentProcessingStatusEnum.PROCESSING,
                },
            }

            const request: PublishMomentRequest = {
                momentId: "moment_123",
                userId: "user_123",
            }

            mockMomentService.getMomentById.mockResolvedValue(processingMoment)

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser publicado no estado atual")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.updateMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando conteúdo é inválido", async () => {
            // Arrange
            const invalidContentMoment = {
                ...mockMomentReadyForPublish,
                content: {
                    duration: 0, // Duração inválida
                    size: 1024,
                    format: "mp4",
                    width: 1080,
                    height: 1920,
                    hasAudio: true,
                    codec: "h264",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            }

            const request: PublishMomentRequest = {
                momentId: "moment_123",
                userId: "user_123",
            }

            mockMomentService.getMomentById.mockResolvedValue(invalidContentMoment)

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser publicado no estado atual")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.updateMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momentId não é fornecido", async () => {
            // Arrange
            const request: PublishMomentRequest = {
                momentId: "",
                userId: "user_123",
            }

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do momento é obrigatório")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando userId não é fornecido", async () => {
            // Arrange
            const request: PublishMomentRequest = {
                momentId: "moment_123",
                userId: "",
            }

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do usuário é obrigatório")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando service lança erro", async () => {
            // Arrange
            const request: PublishMomentRequest = {
                momentId: "moment_123",
                userId: "user_123",
            }

            mockMomentService.getMomentById.mockRejectedValue(new Error("Erro de conexão"))

            // Act
            const result = await publishMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.moment).toBeUndefined()
        })
    })
})
