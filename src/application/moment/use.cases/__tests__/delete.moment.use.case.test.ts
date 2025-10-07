import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum } from "../../../../domain/moment"
import { DeleteMomentRequest, DeleteMomentUseCase } from "../delete.moment.use.case"

describe("DeleteMomentUseCase", () => {
    let deleteMomentUseCase: DeleteMomentUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockMoment: MomentEntity = {
        id: "moment_123",
        ownerId: "user_456",
        status: { current: MomentStatusEnum.PUBLISHED } as any,
        deletedAt: null,
        description: "Momento de teste",
    } as any

    const mockDeletedMoment: MomentEntity = {
        ...mockMoment,
        deletedAt: new Date(),
    } as any

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            getMomentById: vi.fn(),
            deleteMoment: vi.fn(),
        } as any

        deleteMomentUseCase = new DeleteMomentUseCase(mockMomentRepository, mockMomentService)
    })

    describe("execute", () => {
        it("deve deletar um momento com sucesso (como owner)", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_123",
                userId: "user_456", // Owner do momento
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.deleteMoment.mockResolvedValue(true)

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.deleted).toBe(true)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("moment_123")
        })

        it("deve deletar um momento com sucesso (como admin)", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_123",
                userId: "user_999", // Não é o owner
                userRole: "admin",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.deleteMoment.mockResolvedValue(true)

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.deleted).toBe(true)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("moment_123")
        })

        it("deve falhar se o momento não for encontrado", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_inexistente",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(null)

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment not found")
            expect(result.deleted).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_inexistente")
            expect(mockMomentService.deleteMoment).not.toHaveBeenCalled()
        })

        it("deve falhar se não for owner nem admin", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_123",
                userId: "user_999", // Não é o owner nem admin
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado")
            expect(result.deleted).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.deleteMoment).not.toHaveBeenCalled()
        })

        it("deve falhar se o momento já foi deletado", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockDeletedMoment)

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment already deleted")
            expect(result.deleted).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.deleteMoment).not.toHaveBeenCalled()
        })

        it("deve falhar se o momento estiver bloqueado (usuário comum)", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            const blockedMoment = {
                ...mockMoment,
                status: { current: MomentStatusEnum.BLOCKED },
            }
            mockMomentService.getMomentById.mockResolvedValue(blockedMoment)

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment cannot be deleted in current state")
            expect(result.deleted).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.deleteMoment).not.toHaveBeenCalled()
        })

        it("deve permitir admin deletar momento bloqueado", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_123",
                userId: "user_999",
                userRole: "admin",
            }

            const blockedMoment = {
                ...mockMoment,
                status: { current: MomentStatusEnum.BLOCKED },
            }
            mockMomentService.getMomentById.mockResolvedValue(blockedMoment)
            mockMomentService.deleteMoment.mockResolvedValue(true)

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.deleted).toBe(true)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("moment_123")
        })

        it("deve falhar se o ID do momento for nulo ou vazio", async () => {
            const request: DeleteMomentRequest = {
                momentId: "",
                userId: "user_456",
            }

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Moment ID is required")
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar se o ID do usuário for nulo ou vazio", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_123",
                userId: "",
            }

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("User ID is required")
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve falhar se o serviço retornar false", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.deleteMoment.mockResolvedValue(false)

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Falha ao deletar o momento")
            expect(result.deleted).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.deleteMoment).toHaveBeenCalledWith("moment_123")
        })

        it("deve lidar com erros do serviço", async () => {
            const request: DeleteMomentRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockRejectedValue(new Error("Erro de conexão"))

            const result = await deleteMomentUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.deleted).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
        })
    })
})
