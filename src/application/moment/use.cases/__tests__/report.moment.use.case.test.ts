import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum } from "../../../../domain/moment"
import { ReportMomentRequest, ReportMomentUseCase } from "../report.moment.use.case"

describe("ReportMomentUseCase", () => {
    let reportMomentUseCase: ReportMomentUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockMoment: MomentEntity = {
        id: "moment_123",
        ownerId: "user_456",
        status: { current: MomentStatusEnum.PUBLISHED } as any,
        description: "Momento de teste",
    } as any

    const mockReport = {
        id: "report_123",
        momentId: "moment_123",
        userId: "user_789",
        reason: "Conteúdo inadequado",
        description: "Descrição do report",
        status: "pending",
        createdAt: new Date(),
    }

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            getMomentById: vi.fn(),
            hasUserReportedMoment: vi.fn(),
            createReport: vi.fn(),
        } as any

        reportMomentUseCase = new ReportMomentUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve reportar um momento com sucesso", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_123",
                userId: "user_789",
                reason: "Conteúdo inadequado",
                description: "Descrição do report",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.hasUserReportedMoment.mockResolvedValue(false)
            mockMomentService.createReport.mockResolvedValue(mockReport)

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.report).toEqual({
                id: "report_123",
                momentId: "moment_123",
                userId: "user_789",
                reason: "Conteúdo inadequado",
                description: "Descrição do report",
                status: "pending",
                createdAt: mockReport.createdAt,
            })
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.hasUserReportedMoment).toHaveBeenCalledWith(
                "moment_123",
                "user_789",
            )
            expect(mockMomentService.createReport).toHaveBeenCalledWith({
                momentId: "moment_123",
                userId: "user_789",
                reason: "Conteúdo inadequado",
                description: "Descrição do report",
            })
        })

        it("deve falhar se o momento não for encontrado", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_inexistente",
                userId: "user_789",
                reason: "Conteúdo inadequado",
            }

            mockMomentService.getMomentById.mockResolvedValue(null)

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment not found")
            expect(result.report).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_inexistente")
            expect(mockMomentService.hasUserReportedMoment).not.toHaveBeenCalled()
            expect(mockMomentService.createReport).not.toHaveBeenCalled()
        })

        it("deve falhar se o momento não estiver publicado", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_123",
                userId: "user_789",
                reason: "Conteúdo inadequado",
            }

            const unpublishedMoment = {
                ...mockMoment,
                status: { current: MomentStatusEnum.UNDER_REVIEW },
            }
            mockMomentService.getMomentById.mockResolvedValue(unpublishedMoment)

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Only published moments can be reported")
            expect(result.report).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.hasUserReportedMoment).not.toHaveBeenCalled()
            expect(mockMomentService.createReport).not.toHaveBeenCalled()
        })

        it("deve falhar se o usuário tentar reportar o próprio momento", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_123",
                userId: "user_456", // Mesmo ID do owner
                reason: "Conteúdo inadequado",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Cannot report your own moments")
            expect(result.report).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.hasUserReportedMoment).not.toHaveBeenCalled()
            expect(mockMomentService.createReport).not.toHaveBeenCalled()
        })

        it("deve falhar se o usuário já reportou o momento", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_123",
                userId: "user_789",
                reason: "Conteúdo inadequado",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.hasUserReportedMoment.mockResolvedValue(true)

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("You have already reported this moment")
            expect(result.report).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.hasUserReportedMoment).toHaveBeenCalledWith(
                "moment_123",
                "user_789",
            )
            expect(mockMomentService.createReport).not.toHaveBeenCalled()
        })

        it("deve falhar se o ID do momento for nulo ou vazio", async () => {
            const request: ReportMomentRequest = {
                momentId: "",
                userId: "user_789",
                reason: "Conteúdo inadequado",
            }

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment ID is required")
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar se o ID do usuário for nulo ou vazio", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_123",
                userId: "",
                reason: "Conteúdo inadequado",
            }

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("User ID is required")
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar se o motivo for nulo ou vazio", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_123",
                userId: "user_789",
                reason: "",
            }

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Report reason is required")
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar se o motivo for muito longo", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_123",
                userId: "user_789",
                reason: "a".repeat(501), // Mais de 500 caracteres
            }

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Reason cannot exceed 500 characters")
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar se a descrição for muito longa", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_123",
                userId: "user_789",
                reason: "Conteúdo inadequado",
                description: "a".repeat(1001), // Mais de 1000 caracteres
            }

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Description cannot exceed 1000 characters")
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve lidar com erros do serviço", async () => {
            const request: ReportMomentRequest = {
                momentId: "moment_123",
                userId: "user_789",
                reason: "Conteúdo inadequado",
            }

            mockMomentService.getMomentById.mockRejectedValue(new Error("Erro de conexão"))

            const result = await reportMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.report).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
        })
    })
})
