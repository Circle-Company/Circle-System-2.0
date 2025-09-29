import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    GetUserMomentReportsRequest,
    GetUserMomentReportsUseCase,
} from "../get.user.moment.reports.use.case"

describe("GetUserMomentReportsUseCase", () => {
    let getUserMomentReportsUseCase: GetUserMomentReportsUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockMomentReports = [
        {
            momentId: "moment_1",
            moment: {
                id: "moment_1",
                description: "Meu momento 1",
                createdAt: new Date("2024-01-01"),
                status: { current: "PUBLISHED" },
            },
            reports: [
                {
                    id: "report_1",
                    reason: "Conteúdo inadequado",
                    description: "Descrição do report",
                    status: "pending",
                    createdAt: new Date("2024-01-02"),
                },
                {
                    id: "report_2",
                    reason: "Spam",
                    status: "resolved",
                    createdAt: new Date("2024-01-03"),
                },
            ],
            totalReports: 2,
            pendingReports: 1,
            resolvedReports: 1,
        },
        {
            momentId: "moment_2",
            moment: {
                id: "moment_2",
                description: "Meu momento 2",
                createdAt: new Date("2024-01-04"),
                status: { current: "PUBLISHED" },
            },
            reports: [
                {
                    id: "report_3",
                    reason: "Fake News",
                    status: "pending",
                    createdAt: new Date("2024-01-05"),
                },
            ],
            totalReports: 1,
            pendingReports: 1,
            resolvedReports: 0,
        },
    ]

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            getUserMomentReports: vi.fn(),
        } as any

        getUserMomentReportsUseCase = new GetUserMomentReportsUseCase(
            mockMomentRepository,
            mockMomentService,
        )
    })

    describe("execute", () => {
        it("deve buscar reports dos momentos do usuário com sucesso", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "user_123",
                limit: 10,
                offset: 0,
            }

            mockMomentService.getUserMomentReports.mockResolvedValue({
                momentReports: mockMomentReports,
                total: 2,
            })

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.momentReports).toHaveLength(2)
            expect(result.momentReports![0]).toEqual({
                momentId: "moment_1",
                moment: {
                    id: "moment_1",
                    description: "Meu momento 1",
                    createdAt: new Date("2024-01-01"),
                    status: "PUBLISHED",
                },
                reports: [
                    {
                        id: "report_1",
                        reason: "Conteúdo inadequado",
                        description: "Descrição do report",
                        status: "pending",
                        createdAt: new Date("2024-01-02"),
                    },
                    {
                        id: "report_2",
                        reason: "Spam",
                        status: "resolved",
                        createdAt: new Date("2024-01-03"),
                    },
                ],
                totalReports: 2,
                pendingReports: 1,
                resolvedReports: 1,
            })
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(1)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getUserMomentReports).toHaveBeenCalledWith(
                "user_123",
                10,
                0,
                undefined,
                undefined,
            )
        })

        it("deve buscar reports com filtro de status", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "user_123",
                status: "pending",
                limit: 5,
                offset: 0,
            }

            mockMomentService.getUserMomentReports.mockResolvedValue({
                momentReports: [mockMomentReports[0]], // Apenas o primeiro
                total: 1,
            })

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.momentReports).toHaveLength(1)
            expect(result.total).toBe(1)
            expect(mockMomentService.getUserMomentReports).toHaveBeenCalledWith(
                "user_123",
                5,
                0,
                "pending",
                undefined,
            )
        })

        it("deve buscar reports com filtro de momento específico", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "user_123",
                momentId: "moment_1",
                limit: 10,
                offset: 0,
            }

            mockMomentService.getUserMomentReports.mockResolvedValue({
                momentReports: [mockMomentReports[0]], // Apenas o momento específico
                total: 1,
            })

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.momentReports).toHaveLength(1)
            expect(result.total).toBe(1)
            expect(mockMomentService.getUserMomentReports).toHaveBeenCalledWith(
                "user_123",
                10,
                0,
                undefined,
                "moment_1",
            )
        })

        it("deve buscar reports com paginação padrão", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "user_123",
            }

            mockMomentService.getUserMomentReports.mockResolvedValue({
                momentReports: mockMomentReports,
                total: 2,
            })

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.momentReports).toHaveLength(2)
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(20)
            expect(result.totalPages).toBe(1)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getUserMomentReports).toHaveBeenCalledWith(
                "user_123",
                20,
                0,
                undefined,
                undefined,
            )
        })

        it("deve retornar uma lista vazia se nenhum momento tiver reports", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "user_123",
                limit: 10,
                offset: 0,
            }

            mockMomentService.getUserMomentReports.mockResolvedValue({
                momentReports: [],
                total: 0,
            })

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.momentReports).toEqual([])
            expect(result.total).toBe(0)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(0)
            expect(result.error).toBeUndefined()
        })

        it("deve falhar se o ID do usuário for nulo ou vazio", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "",
            }

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do usuário é obrigatório")
            expect(result.momentReports).toBeUndefined()
            expect(mockMomentService.getUserMomentReports).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é menor que 1", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "user_123",
                limit: 0,
            }

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.momentReports).toBeUndefined()
            expect(mockMomentService.getUserMomentReports).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é maior que 100", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "user_123",
                limit: 101,
            }

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.momentReports).toBeUndefined()
            expect(mockMomentService.getUserMomentReports).not.toHaveBeenCalled()
        })

        it("deve falhar quando offset é menor que 0", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "user_123",
                offset: -1,
            }

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Offset deve ser maior ou igual a 0")
            expect(result.momentReports).toBeUndefined()
            expect(mockMomentService.getUserMomentReports).not.toHaveBeenCalled()
        })

        it("deve lidar com erros do serviço", async () => {
            const request: GetUserMomentReportsRequest = {
                userId: "user_123",
            }

            mockMomentService.getUserMomentReports.mockRejectedValue(new Error("Erro de conexão"))

            const result = await getUserMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.momentReports).toBeUndefined()
            expect(mockMomentService.getUserMomentReports).toHaveBeenCalledWith(
                "user_123",
                20,
                0,
                undefined,
                undefined,
            )
        })
    })
})
