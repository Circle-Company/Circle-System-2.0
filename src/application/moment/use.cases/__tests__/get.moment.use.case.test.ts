import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum, MomentVisibilityEnum } from "../../../../domain/moment"
import { GetMomentRequest, GetMomentUseCase } from "../get.moment.use.case"

describe("GetMomentUseCase", () => {
    let getMomentUseCase: GetMomentUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockMoment: MomentEntity = {
        id: "moment_123",
        ownerId: "user_123",
        description: "Meu vlog",
        hashtags: ["#vlog"],
        mentions: [],
        content: {} as any,
        media: {} as any,
        thumbnail: {} as any,
        metrics: {} as any,
        status: {
            current: MomentStatusEnum.PUBLISHED,
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
        context: {} as any,
        embedding: {} as any,
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
        } as any

        getMomentUseCase = new GetMomentUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve buscar momento público com sucesso", async () => {
            // Arrange
            const request: GetMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)

            // Act
            const result = await getMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
        })

        it("deve permitir que o dono veja seu próprio momento", async () => {
            // Arrange
            const privateMoment = {
                ...mockMoment,
                visibility: {
                    ...mockMoment.visibility,
                    level: MomentVisibilityEnum.PRIVATE,
                },
            }

            const request: GetMomentRequest = {
                momentId: "moment_123",
                userId: "user_123", // Mesmo ID do owner
            }

            mockMomentService.getMomentById.mockResolvedValue(privateMoment)

            // Act
            const result = await getMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(privateMoment)
        })

        it("deve permitir acesso a momento privado para usuário autorizado", async () => {
            // Arrange
            const privateMoment = {
                ...mockMoment,
                visibility: {
                    ...mockMoment.visibility,
                    level: MomentVisibilityEnum.PRIVATE,
                    allowedUsers: ["user_456"],
                },
            }

            const request: GetMomentRequest = {
                momentId: "moment_123",
                userId: "user_456", // Usuário autorizado
            }

            mockMomentService.getMomentById.mockResolvedValue(privateMoment)

            // Act
            const result = await getMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(privateMoment)
        })

        it("deve negar acesso a momento privado para usuário não autorizado", async () => {
            // Arrange
            const privateMoment = {
                ...mockMoment,
                visibility: {
                    ...mockMoment.visibility,
                    level: MomentVisibilityEnum.PRIVATE,
                    allowedUsers: ["user_789"], // Usuário diferente
                },
            }

            const request: GetMomentRequest = {
                momentId: "moment_123",
                userId: "user_456", // Usuário não autorizado
            }

            mockMomentService.getMomentById.mockResolvedValue(privateMoment)

            // Act
            const result = await getMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado")
            expect(result.moment).toBeUndefined()
        })

        it("deve permitir acesso a momento público sem usuário logado", async () => {
            // Arrange
            const request: GetMomentRequest = {
                momentId: "moment_123",
                // Sem userId
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)

            // Act
            const result = await getMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toEqual(mockMoment)
        })

        it("deve falhar quando momento não é encontrado", async () => {
            // Arrange
            const request: GetMomentRequest = {
                momentId: "moment_inexistente",
            }

            mockMomentService.getMomentById.mockResolvedValue(null)

            // Act
            const result = await getMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não encontrado")
            expect(result.moment).toBeUndefined()
        })

        it("deve falhar quando momentId não é fornecido", async () => {
            // Arrange
            const request: GetMomentRequest = {
                momentId: "",
            }

            // Act
            const result = await getMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do momento é obrigatório")
            expect(result.moment).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando service lança erro", async () => {
            // Arrange
            const request: GetMomentRequest = {
                momentId: "moment_123",
            }

            mockMomentService.getMomentById.mockRejectedValue(new Error("Erro de conexão"))

            // Act
            const result = await getMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.moment).toBeUndefined()
        })

        it("deve negar acesso a momento não público sem usuário logado", async () => {
            // Arrange
            const privateMoment = {
                ...mockMoment,
                visibility: {
                    ...mockMoment.visibility,
                    level: MomentVisibilityEnum.PRIVATE,
                },
            }

            const request: GetMomentRequest = {
                momentId: "moment_123",
                // Sem userId
            }

            mockMomentService.getMomentById.mockResolvedValue(privateMoment)

            // Act
            const result = await getMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado")
            expect(result.moment).toBeUndefined()
        })
    })
})
