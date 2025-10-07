import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum } from "../../../../domain/moment"
import { GetLikedMomentsRequest, GetLikedMomentsUseCase } from "../get.liked.moments.use.case"

describe("GetLikedMomentsUseCase", () => {
    let getLikedMomentsUseCase: GetLikedMomentsUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockLikedMoments: MomentEntity[] = [
        {
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
        },
        {
            id: "moment_456",
            ownerId: "user_789",
            description: "Outro vlog",
            hashtags: ["#vlog", "#fitness"],
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
                duration: 120,
                size: 2048,
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
        },
    ] as any

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
            getLikedMomentsByUser: vi.fn(),
        } as any

        getLikedMomentsUseCase = new GetLikedMomentsUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve buscar momentos curtidos com sucesso", async () => {
            // Arrange
            const request: GetLikedMomentsRequest = {
                userId: "user_456",
                limit: 20,
                offset: 0,
            }

            const mockResult = {
                moments: mockLikedMoments,
                total: 2,
            }

            mockMomentService.getLikedMomentsByUser.mockResolvedValue(mockResult)

            // Act
            const result = await getLikedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toEqual(mockLikedMoments)
            expect(result.total).toBe(2)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getLikedMomentsByUser).toHaveBeenCalledWith("user_456", 20, 0)
        })

        it("deve buscar momentos curtidos com valores padrão", async () => {
            // Arrange
            const request: GetLikedMomentsRequest = {
                userId: "user_456",
            }

            const mockResult = {
                moments: mockLikedMoments,
                total: 2,
            }

            mockMomentService.getLikedMomentsByUser.mockResolvedValue(mockResult)

            // Act
            const result = await getLikedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toEqual(mockLikedMoments)
            expect(result.total).toBe(2)
            expect(mockMomentService.getLikedMomentsByUser).toHaveBeenCalledWith("user_456", 20, 0)
        })

        it("deve retornar lista vazia quando usuário não curtiu nenhum momento", async () => {
            // Arrange
            const request: GetLikedMomentsRequest = {
                userId: "user_456",
                limit: 20,
                offset: 0,
            }

            const mockResult = {
                moments: [],
                total: 0,
            }

            mockMomentService.getLikedMomentsByUser.mockResolvedValue(mockResult)

            // Act
            const result = await getLikedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moments).toEqual([])
            expect(result.total).toBe(0)
            expect(mockMomentService.getLikedMomentsByUser).toHaveBeenCalledWith("user_456", 20, 0)
        })

        it("deve falhar quando userId não é fornecido", async () => {
            // Arrange
            const request: GetLikedMomentsRequest = {
                userId: "",
            }

            // Act
            const result = await getLikedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("User ID is required")
            expect(result.moments).toBeUndefined()
            expect(result.total).toBeUndefined()
            expect(mockMomentService.getLikedMomentsByUser).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é menor que 1", async () => {
            // Arrange
            const request: GetLikedMomentsRequest = {
                userId: "user_456",
                limit: 0,
            }

            // Act
            const result = await getLikedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.moments).toBeUndefined()
            expect(result.total).toBeUndefined()
            expect(mockMomentService.getLikedMomentsByUser).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é maior que 100", async () => {
            // Arrange
            const request: GetLikedMomentsRequest = {
                userId: "user_456",
                limit: 101,
            }

            // Act
            const result = await getLikedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.moments).toBeUndefined()
            expect(result.total).toBeUndefined()
            expect(mockMomentService.getLikedMomentsByUser).not.toHaveBeenCalled()
        })

        it("deve falhar quando offset é negativo", async () => {
            // Arrange
            const request: GetLikedMomentsRequest = {
                userId: "user_456",
                offset: -1,
            }

            // Act
            const result = await getLikedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Offset deve ser maior ou igual a 0")
            expect(result.moments).toBeUndefined()
            expect(result.total).toBeUndefined()
            expect(mockMomentService.getLikedMomentsByUser).not.toHaveBeenCalled()
        })

        it("deve falhar quando service lança erro", async () => {
            // Arrange
            const request: GetLikedMomentsRequest = {
                userId: "user_456",
                limit: 20,
                offset: 0,
            }

            mockMomentService.getLikedMomentsByUser.mockRejectedValue(new Error("Erro de conexão"))

            // Act
            const result = await getLikedMomentsUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.moments).toBeUndefined()
            expect(result.total).toBeUndefined()
        })
    })
})
