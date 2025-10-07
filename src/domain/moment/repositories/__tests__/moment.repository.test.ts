import { beforeEach, describe, expect, it, vi } from "vitest"
import { MomentStatusEnum, MomentVisibilityEnum } from "../../types"

import { Moment } from "../../entities/moment.entity"
import { IMomentRepository } from "../moment.repository"

// Mock da implementação do repositório para testes
class MockMomentRepository implements IMomentRepository {
    private moments: Map<string, Moment> = new Map()

    async create(moment: Moment): Promise<Moment> {
        this.moments.set(moment.id, moment)
        return moment
    }

    async findById(id: string): Promise<Moment | null> {
        return this.moments.get(id) || null
    }

    async update(moment: Moment): Promise<Moment> {
        if (!this.moments.has(moment.id)) {
            throw new Error(`Moment with id ${moment.id} not found`)
        }
        this.moments.set(moment.id, moment)
        return moment
    }

    async delete(id: string): Promise<void> {
        if (!this.moments.has(id)) {
            throw new Error(`Moment with id ${id} not found`)
        }
        this.moments.delete(id)
    }

    async findByOwnerId(ownerId: string, limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).filter(
            (moment) => moment.ownerId === ownerId,
        )
        return this.applyPagination(moments, limit, offset)
    }

    async findByStatus(status: string, limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).filter(
            (moment) => moment.status.current === status,
        )
        return this.applyPagination(moments, limit, offset)
    }

    async findByVisibility(visibility: string, limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).filter(
            (moment) => moment.visibility.level === visibility,
        )
        return this.applyPagination(moments, limit, offset)
    }

    async findByHashtag(hashtag: string, limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).filter((moment) =>
            moment.hashtags.includes(hashtag),
        )
        return this.applyPagination(moments, limit, offset)
    }

    async findByMention(mention: string, limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).filter((moment) =>
            moment.mentions.includes(mention),
        )
        return this.applyPagination(moments, limit, offset)
    }

    async search(query: string, limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).filter(
            (moment) =>
                moment.description.toLowerCase().includes(query.toLowerCase()) ||
                moment.hashtags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
        )
        return this.applyPagination(moments, limit, offset)
    }

    async findPublished(limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).filter(
            (moment) => moment.status.current === MomentStatusEnum.PUBLISHED,
        )
        return this.applyPagination(moments, limit, offset)
    }

    async findRecent(limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
        return this.applyPagination(moments, limit, offset)
    }

    async findPendingProcessing(limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).filter(
            (moment) => moment.processing.status === "pending",
        )
        return this.applyPagination(moments, limit, offset)
    }

    async findFailedProcessing(limit?: number, offset?: number): Promise<Moment[]> {
        const moments = Array.from(this.moments.values()).filter(
            (moment) => moment.processing.status === "failed",
        )
        return this.applyPagination(moments, limit, offset)
    }

    async getAnalytics(): Promise<any> {
        const moments = Array.from(this.moments.values())
        const totalMoments = moments.length
        const publishedMoments = moments.filter(
            (m) => m.status.current === MomentStatusEnum.PUBLISHED,
        ).length
        const pendingMoments = moments.filter(
            (m) => m.status.current === MomentStatusEnum.UNDER_REVIEW,
        ).length
        const failedMoments = moments.filter((m) => m.processing.status === "failed").length

        // Contar hashtags
        const hashtagCounts: Record<string, number> = {}
        moments.forEach((moment) => {
            moment.hashtags.forEach((hashtag) => {
                hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1
            })
        })

        // Contar menções
        const mentionCounts: Record<string, number> = {}
        moments.forEach((moment) => {
            moment.mentions.forEach((mention) => {
                mentionCounts[mention] = (mentionCounts[mention] || 0) + 1
            })
        })

        return {
            totalMoments,
            publishedMoments,
            pendingMoments,
            failedMoments,
            topHashtags: Object.entries(hashtagCounts).map(([hashtag, count]) => ({
                hashtag,
                count,
            })),
            topMentions: Object.entries(mentionCounts).map(([mention, count]) => ({
                mention,
                count,
            })),
            momentsByDay: [],
            momentsByStatus: [],
        }
    }

    async getStats(): Promise<any> {
        const moments = Array.from(this.moments.values())
        const totalMoments = moments.length
        const publishedMoments = moments.filter(
            (m) => m.status.current === MomentStatusEnum.PUBLISHED,
        ).length
        const pendingMoments = moments.filter(
            (m) => m.status.current === MomentStatusEnum.UNDER_REVIEW,
        ).length
        const failedMoments = moments.filter((m) => m.processing.status === "failed").length

        // Contar hashtags e menções
        const totalHashtags = moments.reduce((sum, m) => sum + m.hashtags.length, 0)
        const totalMentions = moments.reduce((sum, m) => sum + m.mentions.length, 0)

        return {
            totalMoments,
            publishedMoments,
            pendingMoments,
            failedMoments,
            totalHashtags,
            totalMentions,
            averageHashtagsPerMoment: totalMoments > 0 ? totalHashtags / totalMoments : 0,
            averageMentionsPerMoment: totalMoments > 0 ? totalMentions / totalMoments : 0,
        }
    }

    async countByOwnerId(ownerId: string): Promise<number> {
        return Array.from(this.moments.values()).filter((moment) => moment.ownerId === ownerId)
            .length
    }

    async countByStatus(status: string): Promise<number> {
        return Array.from(this.moments.values()).filter(
            (moment) => moment.status.current === status,
        ).length
    }

    async countByVisibility(visibility: string): Promise<number> {
        return Array.from(this.moments.values()).filter(
            (moment) => moment.visibility.level === visibility,
        ).length
    }

    async countPublished(): Promise<number> {
        return Array.from(this.moments.values()).filter(
            (moment) => moment.status.current === MomentStatusEnum.PUBLISHED,
        ).length
    }

    async exists(id: string): Promise<boolean> {
        return this.moments.has(id)
    }

    async existsByOwnerId(ownerId: string): Promise<boolean> {
        return Array.from(this.moments.values()).some((moment) => moment.ownerId === ownerId)
    }

    async createMany(moments: Moment[]): Promise<Moment[]> {
        moments.forEach((moment) => this.moments.set(moment.id, moment))
        return moments
    }

    async updateMany(moments: Moment[]): Promise<Moment[]> {
        moments.forEach((moment) => {
            if (!this.moments.has(moment.id)) {
                throw new Error(`Moment with id ${moment.id} not found`)
            }
            this.moments.set(moment.id, moment)
        })
        return moments
    }

    async deleteMany(ids: string[]): Promise<void> {
        ids.forEach((id) => {
            if (!this.moments.has(id)) {
                throw new Error(`Moment with id ${id} not found`)
            }
            this.moments.delete(id)
        })
    }

    async findPaginated(
        page: number,
        limit: number,
        filters?: any,
    ): Promise<{
        moments: Moment[]
        total: number
        page: number
        limit: number
        totalPages: number
    }> {
        let moments = Array.from(this.moments.values())

        // Aplicar filtros se fornecidos
        if (filters) {
            if (filters.ownerId) {
                moments = moments.filter((moment) => moment.ownerId === filters.ownerId)
            }
            if (filters.status) {
                moments = moments.filter((moment) => moment.status.current === filters.status)
            }
            if (filters.visibility) {
                moments = moments.filter((moment) => moment.visibility.level === filters.visibility)
            }
        }

        const total = moments.length
        const offset = (page - 1) * limit
        const paginatedMoments = moments.slice(offset, offset + limit)
        const totalPages = Math.ceil(total / limit)

        return {
            moments: paginatedMoments,
            total,
            page,
            limit,
            totalPages,
        }
    }

    private applyPagination(items: Moment[], limit?: number, offset?: number): Moment[] {
        if (offset !== undefined) {
            items = items.slice(offset)
        }
        if (limit !== undefined) {
            items = items.slice(0, limit)
        }
        return items
    }
}

// Helper para criar Moment de teste
function createTestMoment(id: string, ownerId: string, overrides: Partial<any> = {}): Moment {
    const moment = {
        id,
        ownerId,
        description: "Test moment",
        hashtags: ["test"],
        mentions: [],
        content: {
            duration: 30,
            size: 1024 * 1024,
            format: "mp4" as any,
            hasAudio: true,
            codec: "h264" as any,
            resolution: {
                width: 720,
                height: 1280,
                quality: "medium" as any,
            },
        },
        media: {
            lowQualityUrl: "https://example.com/low.mp4",
            mediumQualityUrl: "https://example.com/medium.mp4",
            highQualityUrl: "https://example.com/high.mp4",
            storageProvider: "aws" as any,
            storageBucket: "test-bucket",
            storageKey: "test-key",
            storageRegion: "us-east-1",
        },
        thumbnail: {
            url: "https://example.com/thumb.jpg",
            width: 360,
            height: 640,
            storageProvider: "aws" as any,
            storageBucket: "test-bucket",
            storageKey: "test-thumb",
            storageRegion: "us-east-1",
        },
        status: {
            current: MomentStatusEnum.PUBLISHED,
            previousStatus: null,
            reason: null,
            changedBy: null,
            changedAt: new Date(),
        },
        visibility: {
            level: MomentVisibilityEnum.PUBLIC,
            allowedUsers: [],
            blockedUsers: [],
            ageRestriction: null,
            contentWarning: null,
        },
        metrics: {
            views: {
                totalViews: 100,
                uniqueViews: 80,
                viewsByRegion: {},
                viewsByDevice: {},
                viewsByCountry: {},
                viewsByCity: {},
                averageWatchTime: 15,
                completionViews: 60,
                averageCompletionRate: 0.75,
                peakViewTime: null,
                lastViewTime: null,
            },
            engagement: {
                totalLikes: 10,
                totalComments: 5,
                totalReports: 0,
                likeRate: 0.1,
                commentRate: 0.05,
                reportRate: 0,
                averageCommentLength: 20,
                topCommenters: [],
                engagementScore: 0.15,
                lastEngagementTime: null,
            },
            performance: {
                loadTime: 2.5,
                bufferTime: 0.5,
                errorRate: 0.01,
                successRate: 0.99,
                averageQuality: 80,
                qualityDistribution: {},
                bandwidthUsage: 1024,
                serverResponseTime: 200,
                cdnHitRate: 0.95,
                lastPerformanceUpdate: null,
            },
            viral: {
                viralScore: 50,
                viralReach: 100,
                reachByPlatform: {},
                reachByUserType: {},
                viralCoefficient: 1.2,
                viralVelocity: 10,
                peakViralTime: null,
                viralDecayRate: 0.1,
                lastViralUpdate: null,
            },
            audience: {
                demographics: {
                    ageGroups: {},
                    genders: {},
                    locations: {},
                    interests: {},
                },
                behavior: {
                    averageSessionTime: 30,
                    bounceRate: 0.2,
                    returnRate: 0.3,
                    engagementDepth: 0.5,
                    contentPreference: {},
                },
                growth: {
                    followerGrowth: 5,
                    subscriberGrowth: 2,
                    engagementGrowth: 0.1,
                    reachGrowth: 0.2,
                },
                lastAudienceUpdate: null,
            },
            content: {
                qualityScore: 80,
                contentRating: 4.5,
                moderationScore: 90,
                accessibilityScore: 85,
                seoScore: 70,
                contentTags: [],
                contentCategories: [],
                contentSentiment: 0.8,
                contentComplexity: 0.6,
                lastContentUpdate: null,
            },
            lastMetricsUpdate: new Date(),
            metricsVersion: "1.0",
            dataQuality: 95,
            confidenceLevel: 90,
        },
        location: null,
        context: {
            device: {
                type: "mobile",
                os: "iOS",
                osVersion: "15.0",
                model: "iPhone 12",
                screenResolution: "1170x2532",
                orientation: "portrait",
            },
            location: null,
        },
        processing: {
            status: "completed" as any,
            progress: 100,
            error: null,
            startedAt: new Date(),
            completedAt: new Date(),
            estimatedCompletion: null,
            steps: [],
        },
        embedding: {
            vector: new Array(128).fill(0),
            dimension: 128,
            metadata: {},
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        archivedAt: null,
        deletedAt: null,
        calculateEngagementRate: vi.fn().mockReturnValue(0.15),
        ...overrides,
    } as any

    return moment
}

describe("MomentRepository", () => {
    let repository: MockMomentRepository
    let testMoment: Moment

    beforeEach(() => {
        repository = new MockMomentRepository()
        testMoment = createTestMoment("test-id-1", "owner-1")
    })

    describe("Operações CRUD básicas", () => {
        it("deve criar um momento", async () => {
            const result = await repository.create(testMoment)
            expect(result).toEqual(testMoment)
            expect(await repository.exists(testMoment.id)).toBe(true)
        })

        it("deve encontrar um momento por ID", async () => {
            await repository.create(testMoment)
            const found = await repository.findById(testMoment.id)
            expect(found).toEqual(testMoment)
        })

        it("deve retornar null para ID inexistente", async () => {
            const found = await repository.findById("inexistent-id")
            expect(found).toBeNull()
        })

        it("deve atualizar um momento existente", async () => {
            await repository.create(testMoment)
            const updatedMoment = createTestMoment(testMoment.id, testMoment.ownerId, {
                ...testMoment,
                description: "Updated description",
            })
            const updated = await repository.update(updatedMoment)
            expect(updated.description).toBe("Updated description")
        })

        it("deve lançar erro ao atualizar momento inexistente", async () => {
            await expect(repository.update(testMoment)).rejects.toThrow(
                `Moment with id ${testMoment.id} not found`,
            )
        })

        it("deve deletar um momento existente", async () => {
            await repository.create(testMoment)
            await repository.delete(testMoment.id)
            expect(await repository.exists(testMoment.id)).toBe(false)
        })

        it("deve lançar erro ao deletar momento inexistente", async () => {
            await expect(repository.delete("inexistent-id")).rejects.toThrow(
                "Moment with id inexistent-id not found",
            )
        })
    })

    describe("Busca por proprietário", () => {
        it("deve encontrar momentos por ownerId", async () => {
            const moment1 = createTestMoment("id-1", "owner-1")
            const moment2 = createTestMoment("id-2", "owner-1")
            const moment3 = createTestMoment("id-3", "owner-2")

            await repository.createMany([moment1, moment2, moment3])

            const owner1Moments = await repository.findByOwnerId("owner-1")
            expect(owner1Moments).toHaveLength(2)
            expect(owner1Moments.map((m) => m.id)).toEqual(["id-1", "id-2"])

            const owner2Moments = await repository.findByOwnerId("owner-2")
            expect(owner2Moments).toHaveLength(1)
            expect(owner2Moments[0].id).toBe("id-3")
        })

        it("deve aplicar paginação na busca por ownerId", async () => {
            const moments = Array.from({ length: 5 }, (_, i) =>
                createTestMoment(`id-${i}`, "owner-1"),
            )
            await repository.createMany(moments)

            const firstPage = await repository.findByOwnerId("owner-1", 2, 0)
            expect(firstPage).toHaveLength(2)

            const secondPage = await repository.findByOwnerId("owner-1", 2, 2)
            expect(secondPage).toHaveLength(2)

            const thirdPage = await repository.findByOwnerId("owner-1", 2, 4)
            expect(thirdPage).toHaveLength(1)
        })
    })

    describe("Busca por status", () => {
        it("deve encontrar momentos por status", async () => {
            const publishedMoment = createTestMoment("pub-1", "owner-1", {
                status: {
                    current: MomentStatusEnum.PUBLISHED,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
            })
            const draftMoment = createTestMoment("draft-1", "owner-1", {
                status: {
                    current: MomentStatusEnum.UNDER_REVIEW,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
            })

            await repository.createMany([publishedMoment, draftMoment])

            const publishedMoments = await repository.findByStatus(MomentStatusEnum.PUBLISHED)
            expect(publishedMoments).toHaveLength(1)
            expect(publishedMoments[0].id).toBe("pub-1")

            const draftMoments = await repository.findByStatus(MomentStatusEnum.UNDER_REVIEW)
            expect(draftMoments).toHaveLength(1)
            expect(draftMoments[0].id).toBe("draft-1")
        })
    })

    describe("Busca por visibilidade", () => {
        it("deve encontrar momentos por visibilidade", async () => {
            const publicMoment = createTestMoment("pub-1", "owner-1", {
                visibility: {
                    level: MomentVisibilityEnum.PUBLIC,
                    allowedUsers: [],
                    blockedUsers: [],
                    ageRestriction: null,
                    contentWarning: null,
                },
            })
            const privateMoment = createTestMoment("priv-1", "owner-1", {
                visibility: {
                    level: MomentVisibilityEnum.PRIVATE,
                    allowedUsers: [],
                    blockedUsers: [],
                    ageRestriction: null,
                    contentWarning: null,
                },
            })

            await repository.createMany([publicMoment, privateMoment])

            const publicMoments = await repository.findByVisibility(MomentVisibilityEnum.PUBLIC)
            expect(publicMoments).toHaveLength(1)
            expect(publicMoments[0].id).toBe("pub-1")

            const privateMoments = await repository.findByVisibility(MomentVisibilityEnum.PRIVATE)
            expect(privateMoments).toHaveLength(1)
            expect(privateMoments[0].id).toBe("priv-1")
        })
    })

    describe("Busca por hashtag", () => {
        it("deve encontrar momentos por hashtag", async () => {
            const moment1 = createTestMoment("id-1", "owner-1", { hashtags: ["tech", "ai"] })
            const moment2 = createTestMoment("id-2", "owner-1", { hashtags: ["tech", "mobile"] })
            const moment3 = createTestMoment("id-3", "owner-1", { hashtags: ["food", "cooking"] })

            await repository.createMany([moment1, moment2, moment3])

            const techMoments = await repository.findByHashtag("tech")
            expect(techMoments).toHaveLength(2)
            expect(techMoments.map((m) => m.id)).toEqual(["id-1", "id-2"])

            const foodMoments = await repository.findByHashtag("food")
            expect(foodMoments).toHaveLength(1)
            expect(foodMoments[0].id).toBe("id-3")
        })
    })

    describe("Busca por menção", () => {
        it("deve encontrar momentos por menção", async () => {
            const moment1 = createTestMoment("id-1", "owner-1", { mentions: ["@user1", "@user2"] })
            const moment2 = createTestMoment("id-2", "owner-1", { mentions: ["@user1", "@user3"] })
            const moment3 = createTestMoment("id-3", "owner-1", { mentions: ["@user4"] })

            await repository.createMany([moment1, moment2, moment3])

            const user1Moments = await repository.findByMention("@user1")
            expect(user1Moments).toHaveLength(2)
            expect(user1Moments.map((m) => m.id)).toEqual(["id-1", "id-2"])
        })
    })

    describe("Busca textual", () => {
        it("deve encontrar momentos por query de busca", async () => {
            const moment1 = createTestMoment("id-1", "owner-1", {
                description: "Amazing tech tutorial",
            })
            const moment2 = createTestMoment("id-2", "owner-1", {
                description: "Great cooking tips",
                hashtags: ["tech"],
            })
            const moment3 = createTestMoment("id-3", "owner-1", { description: "Travel vlog" })

            await repository.createMany([moment1, moment2, moment3])

            const techResults = await repository.search("tech")
            expect(techResults).toHaveLength(2)
            expect(techResults.map((m) => m.id)).toEqual(["id-1", "id-2"])

            const cookingResults = await repository.search("cooking")
            expect(cookingResults).toHaveLength(1)
            expect(cookingResults[0].id).toBe("id-2")
        })
    })

    describe("Busca de conteúdo publicado", () => {
        it("deve encontrar apenas momentos publicados", async () => {
            const publishedMoment = createTestMoment("pub-1", "owner-1", {
                status: {
                    current: MomentStatusEnum.PUBLISHED,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
            })
            const draftMoment = createTestMoment("draft-1", "owner-1", {
                status: {
                    current: MomentStatusEnum.UNDER_REVIEW,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
            })

            await repository.createMany([publishedMoment, draftMoment])

            const publishedMoments = await repository.findPublished()
            expect(publishedMoments).toHaveLength(1)
            expect(publishedMoments[0].id).toBe("pub-1")
        })
    })

    describe("Análise e estatísticas", () => {
        it("deve retornar analytics corretos", async () => {
            const moment1 = createTestMoment("id-1", "owner-1", {
                status: {
                    current: MomentStatusEnum.PUBLISHED,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
                hashtags: ["tech", "ai"],
                mentions: ["@user1"],
            })
            const moment2 = createTestMoment("id-2", "owner-1", {
                status: {
                    current: MomentStatusEnum.UNDER_REVIEW,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
                hashtags: ["tech", "mobile"],
                mentions: ["@user2"],
            })

            await repository.createMany([moment1, moment2])

            const analytics = await repository.getAnalytics()
            expect(analytics.totalMoments).toBe(2)
            expect(analytics.publishedMoments).toBe(1)
            expect(analytics.pendingMoments).toBe(1)
            expect(analytics.topHashtags).toHaveLength(3) // tech, ai, mobile
            expect(analytics.topMentions).toHaveLength(2) // @user1, @user2
        })

        it("deve retornar estatísticas corretas", async () => {
            const moment1 = createTestMoment("id-1", "owner-1", {
                hashtags: ["tech", "ai"],
                mentions: ["@user1", "@user2"],
            })
            const moment2 = createTestMoment("id-2", "owner-1", {
                hashtags: ["mobile"],
                mentions: ["@user3"],
            })

            await repository.createMany([moment1, moment2])

            const stats = await repository.getStats()
            expect(stats.totalMoments).toBe(2)
            expect(stats.totalHashtags).toBe(3) // tech, ai, mobile
            expect(stats.totalMentions).toBe(3) // @user1, @user2, @user3
            expect(stats.averageHashtagsPerMoment).toBe(1.5)
            expect(stats.averageMentionsPerMoment).toBe(1.5)
        })
    })

    describe("Operações de contagem", () => {
        it("deve contar momentos por ownerId", async () => {
            const moment1 = createTestMoment("id-1", "owner-1")
            const moment2 = createTestMoment("id-2", "owner-1")
            const moment3 = createTestMoment("id-3", "owner-2")

            await repository.createMany([moment1, moment2, moment3])

            expect(await repository.countByOwnerId("owner-1")).toBe(2)
            expect(await repository.countByOwnerId("owner-2")).toBe(1)
            expect(await repository.countByOwnerId("owner-3")).toBe(0)
        })

        it("deve contar momentos por status", async () => {
            const publishedMoment = createTestMoment("pub-1", "owner-1", {
                status: {
                    current: MomentStatusEnum.PUBLISHED,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
            })
            const draftMoment = createTestMoment("draft-1", "owner-1", {
                status: {
                    current: MomentStatusEnum.UNDER_REVIEW,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
            })

            await repository.createMany([publishedMoment, draftMoment])

            expect(await repository.countByStatus(MomentStatusEnum.PUBLISHED)).toBe(1)
            expect(await repository.countByStatus(MomentStatusEnum.UNDER_REVIEW)).toBe(1)
        })

        it("deve contar momentos publicados", async () => {
            const publishedMoment = createTestMoment("pub-1", "owner-1", {
                status: {
                    current: MomentStatusEnum.PUBLISHED,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
            })
            const draftMoment = createTestMoment("draft-1", "owner-1", {
                status: {
                    current: MomentStatusEnum.UNDER_REVIEW,
                    previousStatus: null,
                    reason: null,
                    changedBy: null,
                    changedAt: new Date(),
                },
            })

            await repository.createMany([publishedMoment, draftMoment])

            expect(await repository.countPublished()).toBe(1)
        })
    })

    describe("Operações de existência", () => {
        it("deve verificar se momento existe", async () => {
            await repository.create(testMoment)
            expect(await repository.exists(testMoment.id)).toBe(true)
            expect(await repository.exists("inexistent-id")).toBe(false)
        })

        it("deve verificar se owner tem momentos", async () => {
            await repository.create(testMoment)
            expect(await repository.existsByOwnerId(testMoment.ownerId)).toBe(true)
            expect(await repository.existsByOwnerId("inexistent-owner")).toBe(false)
        })
    })

    describe("Operações em lote", () => {
        it("deve criar múltiplos momentos", async () => {
            const moments = [
                createTestMoment("id-1", "owner-1"),
                createTestMoment("id-2", "owner-1"),
                createTestMoment("id-3", "owner-2"),
            ]

            const created = await repository.createMany(moments)
            expect(created).toHaveLength(3)
            expect(await repository.exists("id-1")).toBe(true)
            expect(await repository.exists("id-2")).toBe(true)
            expect(await repository.exists("id-3")).toBe(true)
        })

        it("deve atualizar múltiplos momentos", async () => {
            const moments = [
                createTestMoment("id-1", "owner-1"),
                createTestMoment("id-2", "owner-1"),
            ]

            await repository.createMany(moments)

            const updatedMoments = [
                createTestMoment("id-1", "owner-1", {
                    ...moments[0],
                    description: "Updated 1",
                }),
                createTestMoment("id-2", "owner-1", {
                    ...moments[1],
                    description: "Updated 2",
                }),
            ]

            const updated = await repository.updateMany(updatedMoments)
            expect(updated[0].description).toBe("Updated 1")
            expect(updated[1].description).toBe("Updated 2")
        })

        it("deve deletar múltiplos momentos", async () => {
            const moments = [
                createTestMoment("id-1", "owner-1"),
                createTestMoment("id-2", "owner-1"),
            ]

            await repository.createMany(moments)

            await repository.deleteMany(["id-1", "id-2"])
            expect(await repository.exists("id-1")).toBe(false)
            expect(await repository.exists("id-2")).toBe(false)
        })
    })

    describe("Paginação", () => {
        it("deve retornar resultados paginados", async () => {
            const moments = Array.from({ length: 5 }, (_, i) =>
                createTestMoment(`id-${i}`, "owner-1"),
            )
            await repository.createMany(moments)

            const result = await repository.findPaginated(1, 2)
            expect(result.moments).toHaveLength(2)
            expect(result.total).toBe(5)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(2)
            expect(result.totalPages).toBe(3)
        })

        it("deve aplicar filtros na paginação", async () => {
            const moment1 = createTestMoment("id-1", "owner-1")
            const moment2 = createTestMoment("id-2", "owner-2")
            const moment3 = createTestMoment("id-3", "owner-1")

            await repository.createMany([moment1, moment2, moment3])

            const result = await repository.findPaginated(1, 10, { ownerId: "owner-1" })
            expect(result.moments).toHaveLength(2)
            expect(result.total).toBe(2)
            expect(result.moments.map((m) => m.id)).toEqual(["id-1", "id-3"])
        })
    })
})
