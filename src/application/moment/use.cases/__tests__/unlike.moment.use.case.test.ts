import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum } from "../../../../domain/moment"
import { UnlikeMomentRequest, UnlikeMomentUseCase } from "../unlike.moment.use.case"

describe("UnlikeMomentUseCase", () => {
    let unlikeMomentUseCase: UnlikeMomentUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockPublishedMoment: MomentEntity = {
        id: "moment_123",
        ownerId: "user_123",
        description: "Meu vlog",
        hashtags: ["#vlog"],
        mentions: [],
        status: {
            current: MomentStatusEnum.PUBLISHED,
            previous: null,
            reason: null,
            changedBy: null,
            changedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        processing: {
            status: "completed",
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
        publishedAt: new Date(),
        archivedAt: null,
        deletedAt: null,
    } as any

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
            hasUserLikedMoment: vi.fn(),
            unlikeMoment: vi.fn(),
        } as any

        unlikeMomentUseCase = new UnlikeMomentUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve descurtir momento com sucesso", async () => {
            // Arrange
            const request: UnlikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockPublishedMoment)
            mockMomentService.hasUserLikedMoment.mockResolvedValue(true)
            mockMomentService.unlikeMoment.mockResolvedValue(undefined)

            // Act
            const result = await unlikeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.unliked).toBe(true)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.hasUserLikedMoment).toHaveBeenCalledWith(
                "moment_123",
                "user_456",
            )
            expect(mockMomentService.unlikeMoment).toHaveBeenCalledWith("moment_123", "user_456")
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const request: UnlikeMomentRequest = {
                momentId: "moment_inexistente",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(null)

            // Act
            const result = await unlikeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não encontrado")
            expect(result.unliked).toBeUndefined()
            expect(mockMomentService.hasUserLikedMoment).not.toHaveBeenCalled()
            expect(mockMomentService.unlikeMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando usuário não curtiu o momento", async () => {
            // Arrange
            const request: UnlikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockPublishedMoment)
            mockMomentService.hasUserLikedMoment.mockResolvedValue(false)

            // Act
            const result = await unlikeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Usuário não curtiu este momento")
            expect(result.unliked).toBeUndefined()
            expect(mockMomentService.unlikeMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momento não está publicado", async () => {
            // Arrange
            const unpublishedMoment = {
                ...mockPublishedMoment,
                status: {
                    ...mockPublishedMoment.status,
                    current: MomentStatusEnum.UNDER_REVIEW,
                },
            }

            const request: UnlikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(unpublishedMoment)

            // Act
            const result = await unlikeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser descurtido no estado atual")
            expect(result.unliked).toBeUndefined()
            expect(mockMomentService.hasUserLikedMoment).not.toHaveBeenCalled()
            expect(mockMomentService.unlikeMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momento está bloqueado", async () => {
            // Arrange
            const blockedMoment = {
                ...mockPublishedMoment,
                status: {
                    ...mockPublishedMoment.status,
                    current: MomentStatusEnum.BLOCKED,
                },
            }

            const request: UnlikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(blockedMoment)

            // Act
            const result = await unlikeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser descurtido no estado atual")
            expect(result.unliked).toBeUndefined()
            expect(mockMomentService.hasUserLikedMoment).not.toHaveBeenCalled()
            expect(mockMomentService.unlikeMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momento está deletado", async () => {
            // Arrange
            const deletedMoment = {
                ...mockPublishedMoment,
                deletedAt: new Date(),
            }

            const request: UnlikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(deletedMoment)

            // Act
            const result = await unlikeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não pode ser descurtido no estado atual")
            expect(result.unliked).toBeUndefined()
            expect(mockMomentService.hasUserLikedMoment).not.toHaveBeenCalled()
            expect(mockMomentService.unlikeMoment).not.toHaveBeenCalled()
        })

        it("deve falhar quando momentId não é fornecido", async () => {
            // Arrange
            const request: UnlikeMomentRequest = {
                momentId: "",
                userId: "user_456",
            }

            // Act
            const result = await unlikeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do momento é obrigatório")
            expect(result.unliked).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando userId não é fornecido", async () => {
            // Arrange
            const request: UnlikeMomentRequest = {
                momentId: "moment_123",
                userId: "",
            }

            // Act
            const result = await unlikeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do usuário é obrigatório")
            expect(result.unliked).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando service lança erro", async () => {
            // Arrange
            const request: UnlikeMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockRejectedValue(new Error("Erro de conexão"))

            // Act
            const result = await unlikeMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.unliked).toBeUndefined()
        })
    })
})
