import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    GetMomentsAnalyticsRequest,
    GetMomentsAnalyticsUseCase,
} from "../get.moments.analytics.use.case"

describe("GetMomentsAnalyticsUseCase", () => {
    let getMomentsAnalyticsUseCase: GetMomentsAnalyticsUseCase
    let mockMomentRepository: any
    let mockMomentService: any

    const mockAnalytics = {
        overview: {
            totalMoments: 100,
            totalViews: 10000,
            totalLikes: 500,
            totalComments: 250,
            totalShares: 100,
            averageEngagementRate: 0.085,
            averageWatchTime: 45.5,
            averageCompletionRate: 0.75,
        },
        trends: {
            momentsCreated: [
                { date: "2024-01-01", count: 5 },
                { date: "2024-01-02", count: 8 },
            ],
            views: [
                { date: "2024-01-01", count: 1000 },
                { date: "2024-01-02", count: 1500 },
            ],
            likes: [
                { date: "2024-01-01", count: 50 },
                { date: "2024-01-02", count: 75 },
            ],
            comments: [
                { date: "2024-01-01", count: 25 },
                { date: "2024-01-02", count: 30 },
            ],
        },
        topPerformers: {
            mostViewed: [
                { momentId: "moment_1", title: "Momento 1", views: 1000 },
                { momentId: "moment_2", title: "Momento 2", views: 800 },
            ],
            mostLiked: [
                { momentId: "moment_1", title: "Momento 1", likes: 100 },
                { momentId: "moment_3", title: "Momento 3", likes: 80 },
            ],
            mostCommented: [
                { momentId: "moment_2", title: "Momento 2", comments: 50 },
                { momentId: "moment_1", title: "Momento 1", comments: 40 },
            ],
        },
        demographics: {
            ageGroups: { "18-24": 40, "25-34": 35, "35-44": 25 },
            genders: { male: 60, female: 40 },
            locations: { BR: 80, US: 20 },
        },
        contentAnalysis: {
            topHashtags: [
                { hashtag: "vlog", count: 50, reach: 5000 },
                { hashtag: "lifestyle", count: 30, reach: 3000 },
            ],
            topMentions: [
                { mention: "@user1", count: 20 },
                { mention: "@user2", count: 15 },
            ],
            contentTypes: { video: 80, image: 20 },
        },
        performance: {
            bestPerformingDay: "Monday",
            bestPerformingHour: 19,
            averagePostingFrequency: 2.5,
            peakEngagementTimes: [
                { hour: 19, engagement: 0.12 },
                { hour: 20, engagement: 0.1 },
            ],
        },
    }

    beforeEach(() => {
        mockMomentRepository = {
            // Mock methods as needed
        }

        mockMomentService = {
            getMomentsAnalytics: vi.fn(),
        } as any

        getMomentsAnalyticsUseCase = new GetMomentsAnalyticsUseCase(
            mockMomentRepository,
            mockMomentService,
        )
    })

    describe("execute", () => {
        it("deve buscar analytics com sucesso (para usuário específico)", async () => {
            const request: GetMomentsAnalyticsRequest = {
                userId: "user_123",
                period: "monthly",
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            }

            mockMomentService.getMomentsAnalytics.mockResolvedValue(mockAnalytics)

            const result = await getMomentsAnalyticsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.analytics).toEqual(mockAnalytics)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentsAnalytics).toHaveBeenCalledWith({
                userId: "user_123",
                period: "monthly",
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
                includeDeleted: false,
            })
        })

        it("deve buscar analytics com sucesso (como admin)", async () => {
            const request: GetMomentsAnalyticsRequest = {
                userRole: "admin",
                period: "yearly",
                includeDeleted: true,
            }

            mockMomentService.getMomentsAnalytics.mockResolvedValue(mockAnalytics)

            const result = await getMomentsAnalyticsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.analytics).toEqual(mockAnalytics)
            expect(result.error).toBeUndefined()
            expect(mockMomentService.getMomentsAnalytics).toHaveBeenCalledWith({
                userId: undefined,
                period: "yearly",
                startDate: undefined,
                endDate: undefined,
                includeDeleted: true,
            })
        })

        it("deve usar período padrão quando não especificado", async () => {
            const request: GetMomentsAnalyticsRequest = {
                userId: "user_123",
            }

            mockMomentService.getMomentsAnalytics.mockResolvedValue(mockAnalytics)

            const result = await getMomentsAnalyticsUseCase.execute(request)

            expect(result.success).toBe(true)
            expect(result.analytics).toEqual(mockAnalytics)
            expect(mockMomentService.getMomentsAnalytics).toHaveBeenCalledWith({
                userId: "user_123",
                period: "monthly",
                startDate: undefined,
                endDate: undefined,
                includeDeleted: false,
            })
        })

        it("deve falhar se não for fornecido userId nem userRole admin", async () => {
            const request: GetMomentsAnalyticsRequest = {
                period: "monthly",
            }

            const result = await getMomentsAnalyticsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado")
            expect(result.analytics).toBeUndefined()
            expect(mockMomentService.getMomentsAnalytics).not.toHaveBeenCalled()
        })

        it("deve falhar se userRole não for admin", async () => {
            const request: GetMomentsAnalyticsRequest = {
                userRole: "user" as any,
                period: "monthly",
            }

            const result = await getMomentsAnalyticsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Acesso negado")
            expect(result.analytics).toBeUndefined()
            expect(mockMomentService.getMomentsAnalytics).not.toHaveBeenCalled()
        })

        it("deve lidar com erros do serviço", async () => {
            const request: GetMomentsAnalyticsRequest = {
                userId: "user_123",
                period: "monthly",
            }

            mockMomentService.getMomentsAnalytics.mockRejectedValue(new Error("Erro de conexão"))

            const result = await getMomentsAnalyticsUseCase.execute(request)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Erro de conexão")
            expect(result.analytics).toBeUndefined()
            expect(mockMomentService.getMomentsAnalytics).toHaveBeenCalledWith({
                userId: "user_123",
                period: "monthly",
                startDate: undefined,
                endDate: undefined,
                includeDeleted: false,
            })
        })
    })
})
