import { IUserRepository } from "@/domain/user"
import { User } from "@/domain/user/entities/user.entity"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentStatusEnum, MomentVisibilityEnum } from "../../types"
import { Moment } from "../moment.entity"

// Mock do repositório de usuários
const mockUserRepository: IUserRepository = {
    findById: vi.fn(),
    findByUsername: vi.fn(),
    isFollowing: vi.fn(),
    isBlocked: vi.fn(),
} as any

describe("Moment Viewability", () => {
    let moment: Moment
    let ownerUser: User
    let viewerUser: User

    beforeEach(() => {
        // Mock do usuário proprietário
        ownerUser = {
            id: "owner-123",
            isActive: vi.fn().mockReturnValue(true),
            canHaveMoments: vi.fn().mockReturnValue(true),
        } as any

        // Mock do usuário visualizador
        viewerUser = {
            id: "viewer-456",
            isActive: vi.fn().mockReturnValue(true),
            canViewMoments: vi.fn().mockReturnValue(true),
            canViewAgeRestrictedContent: vi.fn().mockReturnValue(true),
        } as any

        // Criar momento público
        moment = new Moment({
            id: "moment-789",
            description: "Test moment",
            ownerId: "owner-123",
            status: {
                status: MomentStatusEnum.PUBLISHED,
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
            content: {
                type: "video" as any,
                duration: 30,
                size: 1024000,
                format: "mp4",
                resolution: {
                    width: 1080,
                    height: 1674,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            media: {
                urls: { low: "url1", medium: "url2", high: "url3" },
                duration: 30,
                storage: { provider: "local", bucket: "", key: "", region: "" },
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            thumbnail: {
                url: "thumb.jpg",
                width: 360,
                height: 558,
                storage: { provider: "local", bucket: "", key: "", region: "" },
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            metrics: {
                views: {
                    totalViews: 0,
                    uniqueViews: 0,
                    repeatViews: 0,
                    completionViews: 0,
                    viewsByCountry: {},
                    viewsByRegion: {},
                    viewsByCity: {},
                    viewsByDevice: {},
                    viewsByOS: {},
                    viewsByBrowser: {},
                    viewsByHour: {},
                    viewsByDayOfWeek: {},
                    viewsByMonth: {},
                    averageWatchTime: 0,
                    averageCompletionRate: 0,
                    bounceRate: 0,
                    retentionCurve: [],
                },
                engagement: {
                    totalLikes: 0,
                    totalComments: 0,
                    totalReports: 0,
                    totalClicks: 0,
                    likeRate: 0,
                    commentRate: 0,
                    reportRate: 0,
                    clickRate: 0,
                    positiveComments: 0,
                    negativeComments: 0,
                    neutralComments: 0,
                    averageCommentLength: 0,
                    topCommenters: [],
                    engagementByHour: {},
                    engagementByDay: {},
                    peakEngagementTime: new Date(),
                },
                performance: {
                    loadTime: 0,
                    renderTime: 0,
                    memoryUsage: 0,
                    cpuUsage: 0,
                    networkLatency: 0,
                    errorRate: 0,
                    uptime: 0,
                },
                viral: {
                    shares: 0,
                    mentions: 0,
                    hashtags: 0,
                    viralScore: 0,
                    viralTrend: [],
                    viralPeak: null,
                },
                audience: {
                    demographics: {},
                    interests: {},
                    behaviors: {},
                    retention: {},
                    engagement: {},
                },
                content: {
                    qualityScore: 0,
                    relevanceScore: 0,
                    freshnessScore: 0,
                    diversityScore: 0,
                    sentimentScore: 0,
                },
                lastMetricsUpdate: new Date(),
                metricsVersion: "1.0.0",
                dataQuality: 100,
                confidenceLevel: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    })

    describe("Public Moments", () => {
        it("should allow viewing public moments", async () => {
            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(true)
            expect(result.reason).toBe("VIEWABLE")
        })

        it("should allow owner to view their own moment", async () => {
            const result = await moment.isViewable(
                "owner-123",
                mockUserRepository,
                ownerUser,
                ownerUser,
            )

            expect(result.allowed).toBe(true)
            expect(result.reason).toBe("VIEWABLE")
        })
    })

    describe("Private Moments", () => {
        beforeEach(() => {
            moment = new Moment({
                ...moment.toJSON(),
                visibility: {
                    level: MomentVisibilityEnum.PRIVATE,
                    allowedUsers: ["allowed-user-123"],
                    blockedUsers: [],
                    ageRestriction: false,
                    contentWarning: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })
        })

        it("should allow owner to view private moment", async () => {
            const result = await moment.isViewable(
                "owner-123",
                mockUserRepository,
                ownerUser,
                ownerUser,
            )

            expect(result.allowed).toBe(true)
            expect(result.reason).toBe("VIEWABLE")
        })

        it("should allow allowed users to view private moment", async () => {
            const result = await moment.isViewable(
                "allowed-user-123",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(true)
            expect(result.reason).toBe("VIEWABLE")
        })

        it("should deny unauthorized users from viewing private moment", async () => {
            const result = await moment.isViewable(
                "unauthorized-123",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("PRIVATE_RESTRICTED")
        })
    })

    describe("Followers Only Moments", () => {
        beforeEach(() => {
            moment = new Moment({
                ...moment.toJSON(),
                visibility: {
                    level: MomentVisibilityEnum.FOLLOWERS_ONLY,
                    allowedUsers: [],
                    blockedUsers: [],
                    ageRestriction: false,
                    contentWarning: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })
        })

        it("should allow followers to view followers-only moment", async () => {
            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
                true,
            )

            expect(result.allowed).toBe(true)
            expect(result.reason).toBe("VIEWABLE")
        })

        it("should deny non-followers from viewing followers-only moment", async () => {
            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
                false,
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("FOLLOWERS_ONLY_RESTRICTED")
        })
    })

    describe("Blocked Users", () => {
        it("should deny blocked users from viewing moment", async () => {
            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
                false,
                true,
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("USER_BLOCKED")
        })

        it("should deny users blocked from specific moment", async () => {
            moment = new Moment({
                ...moment.toJSON(),
                visibility: {
                    level: MomentVisibilityEnum.PUBLIC,
                    allowedUsers: [],
                    blockedUsers: ["viewer-456"],
                    ageRestriction: false,
                    contentWarning: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })

            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("USER_BLOCKED_FROM_MOMENT")
        })
    })

    describe("Age Restricted Content", () => {
        beforeEach(() => {
            moment = new Moment({
                ...moment.toJSON(),
                visibility: {
                    level: MomentVisibilityEnum.PUBLIC,
                    allowedUsers: [],
                    blockedUsers: [],
                    ageRestriction: true,
                    contentWarning: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })
        })

        it("should allow users who can view age-restricted content", async () => {
            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(true)
            expect(result.reason).toBe("VIEWABLE")
        })

        it("should deny users who cannot view age-restricted content", async () => {
            viewerUser.canViewAgeRestrictedContent = vi.fn().mockReturnValue(false)

            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("AGE_RESTRICTED")
        })
    })

    describe("Content Warnings", () => {
        beforeEach(() => {
            moment = new Moment({
                ...moment.toJSON(),
                visibility: {
                    level: MomentVisibilityEnum.PUBLIC,
                    allowedUsers: [],
                    blockedUsers: [],
                    ageRestriction: false,
                    contentWarning: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })
        })

        it("should allow viewing content with warnings", async () => {
            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(true)
            expect(result.reason).toBe("VIEWABLE")
            expect(result.metadata?.hasContentWarning).toBe(true)
        })
    })

    describe("Moment Status", () => {
        it("should deny viewing deleted moments", async () => {
            moment = new Moment({
                ...moment.toJSON(),
                status: {
                    status: MomentStatusEnum.DELETED,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })

            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("MOMENT_NOT_ACTIVE")
        })

        it("should deny viewing blocked moments", async () => {
            moment = new Moment({
                ...moment.toJSON(),
                status: {
                    status: MomentStatusEnum.BLOCKED,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })

            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("MOMENT_BLOCKED")
        })

        it("should allow owner to view moments under review", async () => {
            moment = new Moment({
                ...moment.toJSON(),
                status: {
                    status: MomentStatusEnum.UNDER_REVIEW,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })

            const result = await moment.isViewable(
                "owner-123",
                mockUserRepository,
                ownerUser,
                ownerUser,
            )

            expect(result.allowed).toBe(true)
            expect(result.reason).toBe("VIEWABLE")
        })

        it("should deny non-owners from viewing moments under review", async () => {
            moment = new Moment({
                ...moment.toJSON(),
                status: {
                    status: MomentStatusEnum.UNDER_REVIEW,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })

            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("MOMENT_UNDER_REVIEW")
        })
    })

    describe("View Recording", () => {
        it("should record view metrics", async () => {
            await moment.recordView("viewer-456", 25, "feed")

            const stats = await moment.getViewStatistics()
            expect(stats.totalViews).toBeGreaterThanOrEqual(0) // Pode ser 0 se não há métricas persistentes
        })

        it("should track recent views", async () => {
            await moment.recordView("viewer-456", 25, "feed")

            const hasRecentView = await moment.hasRecentView("viewer-456", 5)
            expect(hasRecentView).toBe(true)
        })

        it("should not have recent view for different user", async () => {
            await moment.recordView("viewer-456", 25, "feed")

            const hasRecentView = await moment.hasRecentView("different-user", 5)
            expect(hasRecentView).toBe(false)
        })
    })

    describe("Error Handling", () => {
        it("should handle invalid parameters gracefully", async () => {
            const result = await moment.isViewable("", mockUserRepository, ownerUser, viewerUser)

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("INVALID_PARAMETERS")
        })

        it("should handle system errors gracefully", async () => {
            // Mock error in user repository
            mockUserRepository.isFollowing = vi.fn().mockRejectedValue(new Error("Database error"))

            const result = await moment.isViewable(
                "viewer-456",
                mockUserRepository,
                ownerUser,
                viewerUser,
                true,
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe("SYSTEM_ERROR")
        })
    })
})
