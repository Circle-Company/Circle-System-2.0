import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    GetUserReportedMomentsRequest,
    GetUserReportedMomentsUseCase,
} from "../get.user.reported.moments.use.case"

describe("GetUserReportedMomentsUseCase", () => {
    let getUserReportedMomentsUseCase: GetUserReportedMomentsUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockReportedMoments = [
        {
            momentId: "moment_1",
            moment: {
                id: "moment_1",
                description: "Momento reportado 1",
                ownerId: "user_456",
                createdAt: new Date("2024-01-01"),
                status: { current: "PUBLISHED" },
            },
            report: {
                id: "report_1",
                reason: "Conteúdo inadequado",
                description: "Descrição do report",
                status: "pending",
                createdAt: new Date("2024-01-02"),
            },
        },
        {
            momentId: "moment_2",
            moment: {
                id: "moment_2",
                description: "Momento reportado 2",
                ownerId: "user_789",
                createdAt: new Date("2024-01-03"),
                status: { current: "PUBLISHED" },
            },
            report: {
                id: "report_2",
                reason: "Spam",
                status: "resolved",
                createdAt: new Date("2024-01-04"),
            },
        },
    ]

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            getUserReportedMoments: vi.fn(),
        } as any

        getUserReportedMomentsUseCase = new GetUserReportedMomentsUseCase(
            mockMomentRepository,
            mockMomentService,
        )
    })

    describe("execute", () => {
        it("deve buscar momentos reportados pelo usuário com sucesso", async () => {
            const request: GetUserReportedMomentsRequest = {
                userId: "user_123",
                limit: 10,
                offset: 0,
            }

            mockMomentService.getUserReportedMoments.mockResolvedValue({
                reportedMoments: mockReportedMoments,
                total: 2,
            })

            const result = await getUserReportedMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.reportedMoments).toHaveLength(2)
            expect(result.reportedMoments![0]).toEqual({
                momentId: "moment_1",
                moment: {
                    id: "moment_1",
                    description: "Momento reportado 1",
                    ownerId: "user_456",
                    createdAt: new Date("2024-01-01"),
                    status: "PUBLISHED",
                },
                report: {
                    id: "report_1",
                    reason: "Conteúdo inadequado",
                    description: "Descrição do report",
                    status: "pending",
                    createdAt: new Date("2024-01-02"),
                },
            })
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(1)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getUserReportedMoments).toHaveBeenCalledWith(
                "user_123",
                10,
                0,
                undefined,
            )
        })

        it("deve buscar momentos reportados com filtro de status", async () => {
            const request: GetUserReportedMomentsRequest = {
                userId: "user_123",
                status: "pending",
                limit: 5,
                offset: 0,
            }

            mockMomentService.getUserReportedMoments.mockResolvedValue({
                reportedMoments: [mockReportedMoments[0]], // Apenas o primeiro (pending)
                total: 1,
            })

            const result = await getUserReportedMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.reportedMoments).toHaveLength(1)
            expect(result.total).toBe(1)
            expect(mockMomentService.getUserReportedMoments).toHaveBeenCalledWith(
                "user_123",
                5,
                0,
                "pending",
            )
        })

        it("deve buscar momentos reportados com paginação padrão", async () => {
            const request: GetUserReportedMomentsRequest = {
                userId: "user_123",
            }

            mockMomentService.getUserReportedMoments.mockResolvedValue({
                reportedMoments: mockReportedMoments,
                total: 2,
            })

            const result = await getUserReportedMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.reportedMoments).toHaveLength(2)
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(20)
            expect(result.totalPages).toBe(1)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getUserReportedMoments).toHaveBeenCalledWith(
                "user_123",
                20,
                0,
                undefined,
            )
        })

        it("deve retornar uma lista vazia se nenhum momento for reportado", async () => {
            const request: GetUserReportedMomentsRequest = {
                userId: "user_123",
                limit: 10,
                offset: 0,
            }

            mockMomentService.getUserReportedMoments.mockResolvedValue({
                reportedMoments: [],
                total: 0,
            })

            const result = await getUserReportedMomentsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.reportedMoments).toEqual([])
            expect(result.total).toBe(0)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(0)
            expect(result.error).toBeUndefined()
        })

        it("deve falhar se o ID do usuário for nulo ou vazio", async () => {
            const request: GetUserReportedMomentsRequest = {
                userId: "",
            }

            const result = await getUserReportedMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("User ID is required")
            expect(result.reportedMoments).toBeUndefined()
            expect(mockMomentService.getUserReportedMoments).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é menor que 1", async () => {
            const request: GetUserReportedMomentsRequest = {
                userId: "user_123",
                limit: 0,
            }

            const result = await getUserReportedMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.reportedMoments).toBeUndefined()
            expect(mockMomentService.getUserReportedMoments).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é maior que 100", async () => {
            const request: GetUserReportedMomentsRequest = {
                userId: "user_123",
                limit: 101,
            }

            const result = await getUserReportedMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.reportedMoments).toBeUndefined()
            expect(mockMomentService.getUserReportedMoments).not.toHaveBeenCalled()
        })

        it("deve falhar quando offset é menor que 0", async () => {
            const request: GetUserReportedMomentsRequest = {
                userId: "user_123",
                offset: -1,
            }

            const result = await getUserReportedMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Offset deve ser maior ou igual a 0")
            expect(result.reportedMoments).toBeUndefined()
            expect(mockMomentService.getUserReportedMoments).not.toHaveBeenCalled()
        })

        it("deve lidar com erros do serviço", async () => {
            const request: GetUserReportedMomentsRequest = {
                userId: "user_123",
            }

            mockMomentService.getUserReportedMoments.mockRejectedValue(new Error("Erro de conexão"))

            const result = await getUserReportedMomentsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.reportedMoments).toBeUndefined()
            expect(mockMomentService.getUserReportedMoments).toHaveBeenCalledWith(
                "user_123",
                20,
                0,
                undefined,
            )
        })
    })
})
