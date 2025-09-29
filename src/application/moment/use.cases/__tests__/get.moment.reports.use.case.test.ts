import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum } from "../../../../domain/moment"
import { GetMomentReportsRequest, GetMomentReportsUseCase } from "../get.moment.reports.use.case"

describe("GetMomentReportsUseCase", () => {
    let getMomentReportsUseCase: GetMomentReportsUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockMoment: MomentEntity = {
        id: "moment_123",
        ownerId: "user_456",
        status: { current: MomentStatusEnum.PUBLISHED } as any,
        description: "Momento de teste",
    } as any

    const mockReports = [
        {
            id: "report_1",
            momentId: "moment_123",
            userId: "user_789",
            reason: "Conteúdo inadequado",
            description: "Descrição do report",
            status: "pending",
            createdAt: new Date(),
        },
        {
            id: "report_2",
            momentId: "moment_123",
            userId: "user_999",
            reason: "Spam",
            status: "resolved",
            createdAt: new Date(),
        },
    ]

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            getMomentById: vi.fn(),
            getMomentReports: vi.fn(),
        } as any

        getMomentReportsUseCase = new GetMomentReportsUseCase(
            mockMomentRepository,
            mockMomentService,
        )
    })

    describe("execute", () => {
        it("deve buscar reports de um momento com sucesso (como owner)", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "moment_123",
                userId: "user_456", // Owner do momento
                limit: 10,
                offset: 0,
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.getMomentReports.mockResolvedValue({
                reports: mockReports,
                total: 2,
            })

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.reports).toHaveLength(2)
            expect(result.reports![0]).toEqual({
                id: "report_1",
                reason: "Conteúdo inadequado",
                description: "Descrição do report",
                status: "pending",
                createdAt: mockReports[0].createdAt,
            })
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(1)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.getMomentReports).toHaveBeenCalledWith("moment_123", 10, 0)
        })

        it("deve buscar reports de um momento com sucesso (como admin)", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "moment_123",
                userRole: "admin",
                limit: 10,
                offset: 0,
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.getMomentReports.mockResolvedValue({
                reports: mockReports,
                total: 2,
            })

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.reports).toHaveLength(2)
            expect(result.reports![0]).toEqual({
                id: "report_1",
                reason: "Conteúdo inadequado",
                description: "Descrição do report",
                status: "pending",
                createdAt: mockReports[0].createdAt,
                reporterId: "user_789",
                reporterInfo: {
                    id: "user_789",
                },
            })
            expect(result.total).toBe(2)
            expect(result.error).toBeUndefined()
        })

        it("deve falhar se o momento não for encontrado", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "moment_inexistente",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(null)

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não encontrado")
            expect(result.reports).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_inexistente")
            expect(mockMomentService.getMomentReports).not.toHaveBeenCalled()
        })

        it("deve falhar se não for owner nem admin", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "moment_123",
                userId: "user_999", // Não é owner nem admin
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado")
            expect(result.reports).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.getMomentReports).not.toHaveBeenCalled()
        })

        it("deve falhar se o ID do momento for nulo ou vazio", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "",
                userId: "user_456",
            }

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do momento é obrigatório")
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é menor que 1", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "moment_123",
                userId: "user_456",
                limit: 0,
            }

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.reports).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando limit é maior que 100", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "moment_123",
                userId: "user_456",
                limit: 101,
            }

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Limite deve estar entre 1 e 100")
            expect(result.reports).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar quando offset é menor que 0", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "moment_123",
                userId: "user_456",
                offset: -1,
            }

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Offset deve ser maior ou igual a 0")
            expect(result.reports).toBeUndefined()
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve usar paginação padrão quando não especificada", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.getMomentReports.mockResolvedValue({
                reports: mockReports,
                total: 2,
            })

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.limit).toBe(20)
            expect(mockMomentService.getMomentReports).toHaveBeenCalledWith("moment_123", 20, 0)
        })

        it("deve lidar com erros do serviço", async () => {
            const request: GetMomentReportsRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockRejectedValue(new Error("Erro de conexão"))

            const result = await getMomentReportsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.reports).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
        })
    })
})
