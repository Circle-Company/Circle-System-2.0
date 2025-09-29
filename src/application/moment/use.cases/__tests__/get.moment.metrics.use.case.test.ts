import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentEntity, MomentStatusEnum } from "../../../../domain/moment"
import { GetMomentMetricsRequest, GetMomentMetricsUseCase } from "../get.moment.metrics.use.case"

describe("GetMomentMetricsUseCase", () => {
    let getMomentMetricsUseCase: GetMomentMetricsUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockMoment: MomentEntity = {
        id: "moment_123",
        ownerId: "user_456",
        status: { current: MomentStatusEnum.PUBLISHED } as any,
        description: "Momento de teste",
    } as any

    const mockMetrics = {
        momentId: "moment_123",
        totalViews: 1000,
        totalLikes: 50,
        totalComments: 25,
        totalShares: 10,
        engagementRate: 0.085,
        averageWatchTime: 45.5,
        completionRate: 0.75,
        demographics: {
            ageGroups: { "18-24": 40, "25-34": 35, "35-44": 25 },
            genders: { male: 60, female: 40 },
            locations: { BR: 80, US: 20 },
        },
        timeline: [
            { date: "2024-01-01", views: 100, likes: 5, comments: 2, shares: 1 },
            { date: "2024-01-02", views: 150, likes: 8, comments: 3, shares: 2 },
        ],
        topHashtags: [
            { hashtag: "vlog", count: 10 },
            { hashtag: "lifestyle", count: 8 },
        ],
        topMentions: [
            { mention: "@user1", count: 5 },
            { mention: "@user2", count: 3 },
        ],
    }

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            getMomentById: vi.fn(),
            getMomentMetrics: vi.fn(),
        } as any

        getMomentMetricsUseCase = new GetMomentMetricsUseCase(
            mockMomentRepository,
            mockMomentService,
        )
    })

    describe("execute", () => {
        it("deve buscar métricas de um momento com sucesso (como owner)", async () => {
            const request: GetMomentMetricsRequest = {
                momentId: "moment_123",
                userId: "user_456", // Owner do momento
                period: "daily",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.getMomentMetrics.mockResolvedValue(mockMetrics)

            const result = await getMomentMetricsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.metrics).toEqual(mockMetrics)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.getMomentMetrics).toHaveBeenCalledWith("moment_123", {
                period: "daily",
                startDate: undefined,
                endDate: undefined,
            })
        })

        it("deve buscar métricas de um momento com sucesso (como admin)", async () => {
            const request: GetMomentMetricsRequest = {
                momentId: "moment_123",
                userId: "user_999", // Não é o owner
                userRole: "admin",
                period: "weekly",
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.getMomentMetrics.mockResolvedValue(mockMetrics)

            const result = await getMomentMetricsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.metrics).toEqual(mockMetrics)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.getMomentMetrics).toHaveBeenCalledWith("moment_123", {
                period: "weekly",
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            })
        })

        it("deve falhar se o momento não for encontrado", async () => {
            const request: GetMomentMetricsRequest = {
                momentId: "moment_inexistente",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(null)

            const result = await getMomentMetricsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Momento não encontrado")
            expect(result.metrics).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_inexistente")
            expect(mockMomentService.getMomentMetrics).not.toHaveBeenCalled()
        })

        it("deve falhar se não for owner nem admin", async () => {
            const request: GetMomentMetricsRequest = {
                momentId: "moment_123",
                userId: "user_999", // Não é o owner nem admin
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)

            const result = await getMomentMetricsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado")
            expect(result.metrics).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.getMomentMetrics).not.toHaveBeenCalled()
        })

        it("deve falhar se o momento não estiver publicado", async () => {
            const request: GetMomentMetricsRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            const unpublishedMoment = {
                ...mockMoment,
                status: { current: MomentStatusEnum.UNDER_REVIEW },
            }
            mockMomentService.getMomentById.mockResolvedValue(unpublishedMoment)

            const result = await getMomentMetricsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Métricas só estão disponíveis para momentos publicados")
            expect(result.metrics).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
            expect(mockMomentService.getMomentMetrics).not.toHaveBeenCalled()
        })

        it("deve falhar se o ID do momento for nulo ou vazio", async () => {
            const request: GetMomentMetricsRequest = {
                momentId: "",
                userId: "user_456",
            }

            const result = await getMomentMetricsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("ID do momento é obrigatório")
            expect(mockMomentService.getMomentById).not.toHaveBeenCalled()
        })

        it("deve usar período padrão quando não especificado", async () => {
            const request: GetMomentMetricsRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockResolvedValue(mockMoment)
            mockMomentService.getMomentMetrics.mockResolvedValue(mockMetrics)

            const result = await getMomentMetricsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.metrics).toEqual(mockMetrics)
            expect(mockMomentService.getMomentMetrics).toHaveBeenCalledWith("moment_123", {
                period: "daily",
                startDate: undefined,
                endDate: undefined,
            })
        })

        it("deve lidar com erros do serviço", async () => {
            const request: GetMomentMetricsRequest = {
                momentId: "moment_123",
                userId: "user_456",
            }

            mockMomentService.getMomentById.mockRejectedValue(new Error("Erro de conexão"))

            const result = await getMomentMetricsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.metrics).toBeUndefined()
            expect(mockMomentService.getMomentById).toHaveBeenCalledWith("moment_123")
        })
    })
})
