import { describe, expect, it } from "vitest"
import {
    AppliedFilters,
    MomentSearchResult,
    PaginationOptions,
    SearchContext,
    SearchEngineConfig,
    SearchEngineStats,
    SearchFilters,
    SearchMetrics,
    SearchQuery,
    SearchResult,
    SearchSuggestion,
    SortingOptions,
} from "../types"

describe("Types", () => {
    describe("SearchQuery", () => {
        it("deve ter estrutura correta", () => {
            const query: SearchQuery = {
                term: "vídeo sobre vlog",
                filters: {
                    status: ["PUBLISHED"],
                    visibility: ["PUBLIC"],
                },
                pagination: {
                    limit: 20,
                    offset: 0,
                },
                sorting: {
                    field: "relevance",
                    order: "desc",
                },
            }

            expect(query.term).toBe("vídeo sobre vlog")
            expect(query.filters?.status).toEqual(["PUBLISHED"])
            expect(query.pagination?.limit).toBe(20)
            expect(query.sorting?.field).toBe("relevance")
        })
    })

    describe("SearchFilters", () => {
        it("deve ter estrutura correta", () => {
            const filters: SearchFilters = {
                status: ["PUBLISHED", "DRAFT"],
                visibility: ["PUBLIC", "FOLLOWERS"],
                contentType: ["video", "image"],
                dateFrom: new Date("2024-01-01"),
                dateTo: new Date("2024-12-31"),
                location: {
                    latitude: -23.5505,
                    longitude: -46.6333,
                    radius: 10,
                },
                userId: "user123",
                excludeUserId: "user456",
                minLikes: 10,
                minViews: 100,
                minComments: 5,
                hashtags: ["vlog", "lifestyle"],
                excludeHashtags: ["spam"],
                minDuration: 30,
                maxDuration: 300,
            }

            expect(filters.status).toEqual(["PUBLISHED", "DRAFT"])
            expect(filters.location?.latitude).toBe(-23.5505)
            expect(filters.minLikes).toBe(10)
            expect(filters.hashtags).toEqual(["vlog", "lifestyle"])
        })
    })

    describe("PaginationOptions", () => {
        it("deve ter estrutura correta", () => {
            const pagination: PaginationOptions = {
                limit: 20,
                offset: 40,
                cursor: "cursor123",
            }

            expect(pagination.limit).toBe(20)
            expect(pagination.offset).toBe(40)
            expect(pagination.cursor).toBe("cursor123")
        })
    })

    describe("SortingOptions", () => {
        it("deve ter estrutura correta", () => {
            const sorting: SortingOptions = {
                field: "date",
                order: "asc",
            }

            expect(sorting.field).toBe("date")
            expect(sorting.order).toBe("asc")
        })

        it("deve aceitar todos os campos de ordenação", () => {
            const fields: SortingOptions["field"][] = [
                "relevance",
                "date",
                "likes",
                "views",
                "comments",
                "distance",
            ]
            const orders: SortingOptions["order"][] = ["asc", "desc"]

            fields.forEach((field) => {
                orders.forEach((order) => {
                    const sorting: SortingOptions = { field, order }
                    expect(sorting.field).toBe(field)
                    expect(sorting.order).toBe(order)
                })
            })
        })
    })

    describe("SearchContext", () => {
        it("deve ter estrutura correta", () => {
            const context: SearchContext = {
                userId: "user123",
                userLocation: {
                    latitude: -23.5505,
                    longitude: -46.6333,
                },
                userPreferences: {
                    languages: ["pt", "en"],
                    interests: ["vlog", "lifestyle"],
                    blockedUsers: ["user456"],
                    mutedUsers: ["user789"],
                },
                device: "mobile",
                sessionId: "session123",
            }

            expect(context.userId).toBe("user123")
            expect(context.userLocation?.latitude).toBe(-23.5505)
            expect(context.userPreferences?.interests).toEqual(["vlog", "lifestyle"])
            expect(context.device).toBe("mobile")
        })
    })

    describe("SearchResult", () => {
        it("deve ter estrutura correta", () => {
            const result: SearchResult = {
                moments: [],
                total: 100,
                page: 1,
                limit: 20,
                totalPages: 5,
                searchTime: 150,
                suggestions: ["vlog tutorial", "lifestyle tips"],
                filters: {
                    status: ["PUBLISHED"],
                    visibility: ["PUBLIC"],
                    hashtags: ["vlog"],
                    quality: {
                        minLikes: 0,
                        minViews: 0,
                        minComments: 0,
                    },
                },
            }

            expect(result.total).toBe(100)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(20)
            expect(result.totalPages).toBe(5)
            expect(result.searchTime).toBe(150)
            expect(result.suggestions).toEqual(["vlog tutorial", "lifestyle tips"])
        })
    })

    describe("MomentSearchResult", () => {
        it("deve ter estrutura correta", () => {
            const moment: MomentSearchResult = {
                id: "moment123",
                title: "Vídeo sobre vlog",
                description: "Descrição do momento",
                hashtags: ["vlog", "lifestyle"],
                ownerId: "user123",
                ownerUsername: "user123",
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-01"),
                status: "PUBLISHED",
                visibility: "PUBLIC",
                location: {
                    latitude: -23.5505,
                    longitude: -46.6333,
                    address: "São Paulo",
                },
                metrics: {
                    views: 1000,
                    likes: 50,
                    comments: 25,
                    shares: 10,
                },
                media: {
                    type: "video",
                    duration: 120,
                    thumbnail: "thumb.jpg",
                },
                relevance: {
                    score: 0.8,
                    breakdown: {
                        textual: 0.8,
                        engagement: 0.7,
                        recency: 0.9,
                        quality: 0.8,
                        proximity: 0.5,
                    },
                },
                distance: 5.2,
            }

            expect(moment.id).toBe("moment123")
            expect(moment.title).toBe("Vídeo sobre vlog")
            expect(moment.hashtags).toEqual(["vlog", "lifestyle"])
            expect(moment.metrics.views).toBe(1000)
            expect(moment.relevance.score).toBe(0.8)
            expect(moment.distance).toBe(5.2)
        })
    })

    describe("AppliedFilters", () => {
        it("deve ter estrutura correta", () => {
            const filters: AppliedFilters = {
                status: ["PUBLISHED"],
                visibility: ["PUBLIC"],
                dateRange: {
                    from: new Date("2024-01-01"),
                    to: new Date("2024-12-31"),
                },
                location: {
                    latitude: -23.5505,
                    longitude: -46.6333,
                    radius: 10,
                },
                hashtags: ["vlog", "lifestyle"],
                quality: {
                    minLikes: 10,
                    minViews: 100,
                    minComments: 5,
                },
            }

            expect(filters.status).toEqual(["PUBLISHED"])
            expect(filters.dateRange?.from).toEqual(new Date("2024-01-01"))
            expect(filters.location?.radius).toBe(10)
            expect(filters.quality.minLikes).toBe(10)
        })
    })

    describe("SearchMetrics", () => {
        it("deve ter estrutura correta", () => {
            const metrics: SearchMetrics = {
                totalQueries: 1000,
                averageResponseTime: 150,
                cacheHitRate: 0.85,
                topQueries: [
                    { query: "vlog", count: 100 },
                    { query: "lifestyle", count: 80 },
                ],
                errorRate: 0.02,
            }

            expect(metrics.totalQueries).toBe(1000)
            expect(metrics.averageResponseTime).toBe(150)
            expect(metrics.cacheHitRate).toBe(0.85)
            expect(metrics.topQueries).toHaveLength(2)
            expect(metrics.errorRate).toBe(0.02)
        })
    })

    describe("SearchSuggestion", () => {
        it("deve ter estrutura correta", () => {
            const suggestion: SearchSuggestion = {
                term: "vlog tutorial",
                type: "text",
                count: 50,
                relevance: 0.8,
            }

            expect(suggestion.term).toBe("vlog tutorial")
            expect(suggestion.type).toBe("text")
            expect(suggestion.count).toBe(50)
            expect(suggestion.relevance).toBe(0.8)
        })

        it("deve aceitar todos os tipos de sugestão", () => {
            const types: SearchSuggestion["type"][] = ["hashtag", "user", "location", "text"]

            types.forEach((type) => {
                const suggestion: SearchSuggestion = {
                    term: "test",
                    type,
                    count: 10,
                    relevance: 0.5,
                }
                expect(suggestion.type).toBe(type)
            })
        })
    })

    describe("SearchEngineConfig", () => {
        it("deve ter estrutura correta", () => {
            const config: SearchEngineConfig = {
                maxResults: 100,
                defaultLimit: 20,
                timeout: 5000,
                cacheEnabled: true,
                cacheTTL: 600,
                rankingWeights: {
                    textual: 0.4,
                    engagement: 0.25,
                    recency: 0.2,
                    quality: 0.1,
                    proximity: 0.05,
                },
                defaultFilters: {
                    status: ["PUBLISHED"],
                    visibility: ["PUBLIC"],
                },
                enableParallelSearch: true,
                maxConcurrentSearches: 3,
            }

            expect(config.maxResults).toBe(100)
            expect(config.defaultLimit).toBe(20)
            expect(config.timeout).toBe(5000)
            expect(config.cacheEnabled).toBe(true)
            expect(config.rankingWeights.textual).toBe(0.4)
            expect(config.enableParallelSearch).toBe(true)
        })
    })

    describe("SearchEngineStats", () => {
        it("deve ter estrutura correta", () => {
            const stats: SearchEngineStats = {
                totalSearches: 1000,
                averageResponseTime: 150,
                cacheHitRate: 0.85,
                errorRate: 0.02,
                topQueries: [
                    {
                        query: "vlog",
                        count: 100,
                        avgResponseTime: 120,
                    },
                ],
                performanceMetrics: {
                    memoryUsage: 1024,
                    cpuUsage: 0.5,
                    activeConnections: 10,
                },
            }

            expect(stats.totalSearches).toBe(1000)
            expect(stats.averageResponseTime).toBe(150)
            expect(stats.cacheHitRate).toBe(0.85)
            expect(stats.errorRate).toBe(0.02)
            expect(stats.topQueries).toHaveLength(1)
            expect(stats.performanceMetrics.memoryUsage).toBe(1024)
        })
    })

    describe("Type compatibility", () => {
        it("deve ser compatível entre tipos relacionados", () => {
            const filters: SearchFilters = {
                status: ["PUBLISHED"],
                minLikes: 10,
            }

            const appliedFilters: AppliedFilters = {
                status: ["PUBLISHED"],
                visibility: ["PUBLIC"],
                hashtags: [],
                quality: {
                    minLikes: 10,
                    minViews: 0,
                    minComments: 0,
                },
            }

            expect(filters.status).toEqual(appliedFilters.status)
            expect(filters.minLikes).toBe(appliedFilters.quality.minLikes)
        })

        it("deve permitir conversão entre tipos", () => {
            const moment: MomentSearchResult = {
                id: "moment123",
                title: "Test",
                description: "Test description",
                hashtags: [],
                ownerId: "user123",
                ownerUsername: "user123",
                createdAt: new Date(),
                updatedAt: new Date(),
                status: "PUBLISHED",
                visibility: "PUBLIC",
                metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
                media: { type: "video" },
                relevance: {
                    score: 0.5,
                    breakdown: {
                        textual: 0.5,
                        engagement: 0.5,
                        recency: 0.5,
                        quality: 0.5,
                        proximity: 0.5,
                    },
                },
            }

            const result: SearchResult = {
                moments: [moment],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
                searchTime: 100,
            }

            expect(result.moments).toContain(moment)
            expect(result.total).toBe(1)
        })
    })
})
