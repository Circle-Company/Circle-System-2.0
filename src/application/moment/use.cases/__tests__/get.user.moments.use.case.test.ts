import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum, MomentVisibilityEnum } from "../../../../domain/moment"
import { GetUserMomentsRequest, GetUserMomentsUseCase } from "../get.user.moments.use.case"

describe("GetUserMomentsUseCase", () => {
    let getUserMomentsUseCase: GetUserMomentsUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockMoments: MomentEntity[] = [
        { id: "moment_1", ownerId: "user_123", description: "Momento 1" } as any,
        { id: "moment_2", ownerId: "user_123", description: "Momento 2" } as any,
    ]

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            findByOwnerId: vi.fn(),
        } as any

        getUserMomentsUseCase = new GetUserMomentsUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve buscar momentos de um usuário com sucesso (como owner)", async () => {
            const request: GetUserMomentsRequest = {
                userId: "user_123",
                requestingUserId: "user_123", // É o owner
                limit: 10,
                offset: 0,
            }

            mockMomentService.findByOwnerId.mockResolvedValue({
                moments: mockMoments,
                total: 2,
            })

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.moments).toEqual(mockMoments)
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(1)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.findByOwnerId).toHaveBeenCalledWith(
                "user_123",
                10,
                0,
                expect.objectContaining({
                    // Owner pode ver todos os momentos
                }),
            )
        })

        it("deve buscar momentos de um usuário com sucesso (como visitante)", async () => {
            const request: GetUserMomentsRequest = {
                userId: "user_123",
                requestingUserId: "user_456", // Não é o owner
                limit: 10,
                offset: 0,
            }

            mockMomentService.findByOwnerId.mockResolvedValue({
                moments: mockMoments,
                total: 2,
            })

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.moments).toEqual(mockMoments)
            expect(result.total).toBe(2)
            expect(mockMomentService.findByOwnerId).toHaveBeenCalledWith(
                "user_123",
                10,
                0,
                expect.objectContaining({
                    visibility: MomentVisibilityEnum.PUBLIC,
                    status: MomentStatusEnum.PUBLISHED,
                }),
            )
        })

        it("deve buscar momentos com filtros específicos", async () => {
            const request: GetUserMomentsRequest = {
                userId: "user_123",
                requestingUserId: "user_123",
                status: MomentStatusEnum.PUBLISHED,
                visibility: MomentVisibilityEnum.PUBLIC,
                includeDeleted: true,
                limit: 5,
                offset: 0,
                sortBy: "likes",
                sortOrder: "asc",
            }

            mockMomentService.findByOwnerId.mockResolvedValue({
                moments: mockMoments,
                total: 2,
            })

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.moments).toEqual(mockMoments)
            expect(result.total).toBe(2)
            expect(mockMomentService.findByOwnerId).toHaveBeenCalledWith(
                "user_123",
                5,
                0,
                expect.objectContaining({
                    status: MomentStatusEnum.PUBLISHED,
                    visibility: MomentVisibilityEnum.PUBLIC,
                    includeDeleted: true,
                }),
            )
        })

        it("deve usar paginação padrão quando não especificada", async () => {
            const request: GetUserMomentsRequest = {
                userId: "user_123",
                requestingUserId: "user_123",
            }

            mockMomentService.findByOwnerId.mockResolvedValue({
                moments: mockMoments,
                total: 2,
            })

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.moments).toEqual(mockMoments)
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(20)
            expect(result.totalPages).toBe(1)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.findByOwnerId).toHaveBeenCalledWith(
                "user_123",
                20,
                0,
                expect.any(Object),
            )
        })

        it("deve retornar uma lista vazia se nenhum momento for encontrado", async () => {
            const request: GetUserMomentsRequest = {
                userId: "user_123",
                requestingUserId: "user_123",
                limit: 10,
                offset: 0,
            }

            mockMomentService.findByOwnerId.mockResolvedValue({
                moments: [],
                total: 0,
            })

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.moments).toEqual([])
            expect(result.total).toBe(0)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(0)
            expect(result.error).toBeUndefined()
        })

        it("deve falhar se o ID do usuário for nulo ou vazio", async () => {
            const request: GetUserMomentsRequest = {
                userId: "",
                requestingUserId: "user_123",
            }

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("User ID is required")
            expect(result.moments).toBeUndefined()
            expect(mockMomentService.findByOwnerId).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é menor que 1", async () => {
            const request: GetUserMomentsRequest = {
                userId: "user_123",
                requestingUserId: "user_123",
                limit: 0,
            }

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.moments).toBeUndefined()
            expect(mockMomentService.findByOwnerId).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é maior que 100", async () => {
            const request: GetUserMomentsRequest = {
                userId: "user_123",
                requestingUserId: "user_123",
                limit: 101,
            }

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.moments).toBeUndefined()
            expect(mockMomentService.findByOwnerId).not.toHaveBeenCalled()
        })

        it("deve falhar quando offset é menor que 0", async () => {
            const request: GetUserMomentsRequest = {
                userId: "user_123",
                requestingUserId: "user_123",
                offset: -1,
            }

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Offset deve ser maior ou igual a 0")
            expect(result.moments).toBeUndefined()
            expect(mockMomentService.findByOwnerId).not.toHaveBeenCalled()
        })

        it("deve lidar com erros do serviço", async () => {
            const request: GetUserMomentsRequest = {
                userId: "user_123",
                requestingUserId: "user_123",
            }

            mockMomentService.findByOwnerId.mockRejectedValue(new Error("Erro de conexão"))

            const result = await getUserMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.moments).toBeUndefined()
            expect(mockMomentService.findByOwnerId).toHaveBeenCalledWith(
                "user_123",
                20,
                0,
                expect.any(Object),
            )
        })
    })
})
