import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum, MomentVisibilityEnum } from "../../../../domain/moment"
import { ListMomentsRequest, ListMomentsUseCase } from "../list.moments.use.case"

describe("ListMomentsUseCase", () => {
    let listMomentsUseCase: ListMomentsUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockMoments: MomentEntity[] = [
        { id: "moment_1", ownerId: "user_123", description: "Momento 1" } as any,
        { id: "moment_2", ownerId: "user_456", description: "Momento 2" } as any,
    ]

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            searchMoments: vi.fn(),
        } as any

        listMomentsUseCase = new ListMomentsUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve listar momentos com sucesso", async () => {
            const request: ListMomentsRequest = {
                limit: 10,
                offset: 0,
            }

            mockMomentService.searchMoments.mockResolvedValue({
                moments: mockMoments,
                total: 2,
            })

            const result = await listMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.moments).toEqual(mockMoments)
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(1)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.searchMoments).toHaveBeenCalledWith({
                filters: { status: MomentStatusEnum.PUBLISHED },
                limit: 10,
                offset: 0,
                sortBy: "createdAt",
                sortOrder: "desc",
            })
        })

        it("deve listar momentos com filtros", async () => {
            const request: ListMomentsRequest = {
                userId: "user_123",
                status: MomentStatusEnum.PUBLISHED,
                visibility: MomentVisibilityEnum.PUBLIC,
                hashtag: "vlog",
                search: "teste",
                limit: 5,
                offset: 0,
                sortBy: "likes",
                sortOrder: "asc",
            }

            mockMomentService.searchMoments.mockResolvedValue({
                moments: mockMoments,
                total: 2,
            })

            const result = await listMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.moments).toEqual(mockMoments)
            expect(result.total).toBe(2)
            expect(mockMomentService.searchMoments).toHaveBeenCalledWith({
                filters: {
                    status: MomentStatusEnum.PUBLISHED,
                    ownerId: "user_123",
                    visibility: MomentVisibilityEnum.PUBLIC,
                    hashtag: "vlog",
                    search: "teste",
                },
                limit: 5,
                offset: 0,
                sortBy: "likes",
                sortOrder: "asc",
            })
        })

        it("deve usar paginação padrão quando não especificada", async () => {
            const request: ListMomentsRequest = {}

            mockMomentService.searchMoments.mockResolvedValue({
                moments: mockMoments,
                total: 2,
            })

            const result = await listMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.moments).toEqual(mockMoments)
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(20)
            expect(result.totalPages).toBe(1)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.searchMoments).toHaveBeenCalledWith({
                filters: { status: MomentStatusEnum.PUBLISHED },
                limit: 20,
                offset: 0,
                sortBy: "createdAt",
                sortOrder: "desc",
            })
        })

        it("deve retornar uma lista vazia se nenhum momento for encontrado", async () => {
            const request: ListMomentsRequest = {
                limit: 10,
                offset: 0,
            }

            mockMomentService.searchMoments.mockResolvedValue({
                moments: [],
                total: 0,
            })

            const result = await listMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.moments).toEqual([])
            expect(result.total).toBe(0)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(0)
            expect(result.error).toBeUndefined()
        })

        it("deve falhar quando limit é menor que 1", async () => {
            const request: ListMomentsRequest = {
                limit: 0,
            }

            const result = await listMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.moments).toBeUndefined()
            expect(mockMomentService.searchMoments).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é maior que 100", async () => {
            const request: ListMomentsRequest = {
                limit: 101,
            }

            const result = await listMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.moments).toBeUndefined()
            expect(mockMomentService.searchMoments).not.toHaveBeenCalled()
        })

        it("deve falhar quando offset é menor que 0", async () => {
            const request: ListMomentsRequest = {
                offset: -1,
            }

            const result = await listMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Offset deve ser maior ou igual a 0")
            expect(result.moments).toBeUndefined()
            expect(mockMomentService.searchMoments).not.toHaveBeenCalled()
        })

        it("deve lidar com erros do serviço", async () => {
            const request: ListMomentsRequest = {
                limit: 10,
                offset: 0,
            }

            mockMomentService.searchMoments.mockRejectedValue(new Error("Erro de conexão"))

            const result = await listMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.moments).toBeUndefined()
            expect(mockMomentService.searchMoments).toHaveBeenCalledWith({
                filters: { status: MomentStatusEnum.PUBLISHED },
                limit: 10,
                offset: 0,
                sortBy: "createdAt",
                sortOrder: "desc",
            })
        })
    })
})
