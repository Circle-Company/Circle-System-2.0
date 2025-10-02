import {
    UserSearchError,
    UserSearchErrorCode,
} from "@/domain/user.search.engine/errors/user.search.errors"
import { SearchUsersRequest, SearchUsersUseCase } from "../search.users.use.case"

import { UserSearchRepositoryInterface } from "@/domain/user.search.engine/repositories/user.search.repository"
import { SearchResult } from "@/domain/user.search.engine/types"

// Mocks
const mockUserSearchRepository: jest.Mocked<UserSearchRepositoryInterface> = {
    search: jest.fn(),
    searchRelated: jest.fn(),
    searchUnknown: jest.fn(),
    searchVerified: jest.fn(),
    searchNearby: jest.fn(),
    searchWithFilters: jest.fn(),
    searchByPreferredHashtags: jest.fn(),
    searchByEngagementLevel: jest.fn(),
    searchByInfluenceLevel: jest.fn(),
    calculateRelevanceScore: jest.fn(),
    rankResults: jest.fn(),
    getRankingFactors: jest.fn(),
    getRelationshipStatus: jest.fn(),
    getRelationshipStrength: jest.fn(),
    getMutualConnections: jest.fn(),
    calculateDistance: jest.fn(),
    getUsersInArea: jest.fn(),
    getFromCache: jest.fn(),
    saveToCache: jest.fn(),
    invalidateUserCache: jest.fn(),
    clearExpiredCache: jest.fn(),
    recordSearchMetrics: jest.fn(),
    getSearchStatistics: jest.fn(),
    getPopularSearchTerms: jest.fn(),
    getSearchSuggestions: jest.fn(),
    validateSearchCriteria: jest.fn(),
    checkRateLimit: jest.fn(),
    recordSearchAttempt: jest.fn(),
    getSearchEngineConfig: jest.fn(),
    updateSearchEngineConfig: jest.fn(),
}

const mockSecurityValidator = {
    validateSearchTerm: jest.fn(),
    validateSecurityContext: jest.fn(),
}

const mockRateLimiter = {
    checkLimit: jest.fn(),
    recordAttempt: jest.fn(),
}

const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
}

const mockMetricsCollector = {
    recordSearchMetrics: jest.fn(),
    recordCacheHit: jest.fn(),
    recordError: jest.fn(),
}

describe("SearchUsersUseCase", () => {
    let useCase: SearchUsersUseCase

    beforeEach(() => {
        jest.clearAllMocks()

        useCase = new SearchUsersUseCase(
            mockUserSearchRepository,
            mockSecurityValidator,
            mockRateLimiter,
            mockCacheManager,
            mockMetricsCollector,
        )
    })

    describe("execute", () => {
        const validRequest: SearchUsersRequest = {
            searchTerm: "testuser",
            searcherUserId: "123456789",
            searchType: "all",
            filters: {
                includeVerified: true,
                includeUnverified: true,
                includeBlocked: false,
                includeMuted: false,
            },
            pagination: {
                limit: 20,
                offset: 0,
            },
            sorting: {
                field: "relevance",
                direction: "desc",
            },
            searchContext: "discovery",
            securityContext: {
                userId: "123456789",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                permissions: ["search"],
            },
        }

        const mockSearchResult: SearchResult = {
            users: [
                {
                    id: "1",
                    userId: "user1",
                    username: "testuser1",
                    name: "Test User 1",
                    description: "Test description",
                    isVerified: true,
                    isActive: true,
                    reputationScore: 85,
                    engagementRate: 0.08,
                    followersCount: 1500,
                    followingCount: 300,
                    contentCount: 25,
                    profilePictureUrl: "https://example.com/avatar1.jpg",
                    relationshipStatus: {
                        youFollow: false,
                        followsYou: true,
                        isBlocked: false,
                        isMuted: false,
                    },
                    searchScore: 90,
                    searchMetadata: {
                        searchTerm: "testuser",
                        searchType: "unknown",
                        searchTimestamp: new Date(),
                        rankingFactors: ["relevance", "engagement"],
                    },
                },
            ],
            pagination: {
                total: 1,
                limit: 20,
                offset: 0,
                hasNext: false,
                hasPrevious: false,
                totalPages: 1,
                currentPage: 1,
            },
            searchMetadata: {
                queryId: "search_123",
                searchTerm: "testuser",
                searchType: "all",
                totalResults: 1,
                searchDuration: 150,
                cacheHit: false,
                timestamp: new Date(),
                searcherUserId: "123456789",
            },
            performance: {
                totalDuration: 150,
                searchDuration: 100,
                rankingDuration: 30,
                cacheDuration: 20,
                databaseQueries: 1,
                memoryUsage: 1024 * 1024,
                cacheHits: 0,
                cacheMisses: 1,
            },
        }

        it("deve executar busca com sucesso", async () => {
            // Arrange
            mockSecurityValidator.validateSearchTerm.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockSecurityValidator.validateSecurityContext.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockRateLimiter.checkLimit.mockResolvedValue({
                allowed: true,
                remaining: 99,
                resetAt: new Date(Date.now() + 3600000),
            })
            mockCacheManager.get.mockResolvedValue(null)
            mockUserSearchRepository.validateSearchCriteria.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockUserSearchRepository.search.mockResolvedValue(mockSearchResult)
            mockCacheManager.set.mockResolvedValue(undefined)
            mockMetricsCollector.recordSearchMetrics.mockResolvedValue(undefined)
            mockRateLimiter.recordAttempt.mockResolvedValue(undefined)

            // Act
            const result = await useCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(true)
            expect(result.data).toEqual(mockSearchResult)
            expect(result.queryId).toBeDefined()
            expect(mockUserSearchRepository.search).toHaveBeenCalledTimes(1)
            expect(mockCacheManager.set).toHaveBeenCalledTimes(1)
        })

        it("deve retornar resultado do cache quando disponível", async () => {
            // Arrange
            mockSecurityValidator.validateSearchTerm.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockSecurityValidator.validateSecurityContext.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockRateLimiter.checkLimit.mockResolvedValue({
                allowed: true,
                remaining: 99,
                resetAt: new Date(Date.now() + 3600000),
            })
            mockCacheManager.get.mockResolvedValue(mockSearchResult)

            // Act
            const result = await useCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(true)
            expect(result.data).toEqual(mockSearchResult)
            expect(mockUserSearchRepository.search).not.toHaveBeenCalled()
            expect(mockMetricsCollector.recordCacheHit).toHaveBeenCalledTimes(1)
        })

        it("deve falhar se validação de segurança falhar", async () => {
            // Arrange
            mockSecurityValidator.validateSearchTerm.mockResolvedValue({
                isValid: false,
                errors: ["Search term contém padrões suspeitos"],
                warnings: [],
            })

            // Act
            const result = await useCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error?.type).toBe("PERMISSION_DENIED")
            expect(result.error?.message).toBe("Falha na validação de segurança")
            expect(mockUserSearchRepository.search).not.toHaveBeenCalled()
        })

        it("deve falhar se rate limit for excedido", async () => {
            // Arrange
            mockSecurityValidator.validateSearchTerm.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockSecurityValidator.validateSecurityContext.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockRateLimiter.checkLimit.mockResolvedValue({
                allowed: false,
                remaining: 0,
                resetAt: new Date(Date.now() + 3600000),
            })

            // Act
            const result = await useCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error?.type).toBe("RATE_LIMIT_EXCEEDED")
            expect(result.error?.message).toBe("Rate limit excedido")
            expect(mockUserSearchRepository.search).not.toHaveBeenCalled()
        })

        it("deve falhar se validação da query falhar", async () => {
            // Arrange
            mockSecurityValidator.validateSearchTerm.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockSecurityValidator.validateSecurityContext.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockRateLimiter.checkLimit.mockResolvedValue({
                allowed: true,
                remaining: 99,
                resetAt: new Date(Date.now() + 3600000),
            })
            mockCacheManager.get.mockResolvedValue(null)
            mockUserSearchRepository.validateSearchCriteria.mockResolvedValue({
                isValid: false,
                errors: ["Query inválida"],
                warnings: [],
            })

            // Act
            const result = await useCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error?.type).toBe("VALIDATION_ERROR")
            expect(result.error?.message).toBe("Query de busca inválida")
            expect(mockUserSearchRepository.search).not.toHaveBeenCalled()
        })

        it("deve falhar se repositório lançar erro", async () => {
            // Arrange
            mockSecurityValidator.validateSearchTerm.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockSecurityValidator.validateSecurityContext.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockRateLimiter.checkLimit.mockResolvedValue({
                allowed: true,
                remaining: 99,
                resetAt: new Date(Date.now() + 3600000),
            })
            mockCacheManager.get.mockResolvedValue(null)
            mockUserSearchRepository.validateSearchCriteria.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockUserSearchRepository.search.mockRejectedValue(
                new UserSearchError(UserSearchErrorCode.DATABASE_ERROR, "Erro de banco de dados"),
            )

            // Act
            const result = await useCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error?.type).toBe("DATABASE_ERROR")
            expect(result.error?.message).toBe("Erro de banco de dados")
            expect(mockMetricsCollector.recordError).toHaveBeenCalledTimes(1)
        })

        it("deve falhar se request estiver inválido", async () => {
            // Arrange
            const invalidRequest = {
                ...validRequest,
                searchTerm: "", // Termo vazio
            }

            // Act
            const result = await useCase.execute(invalidRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error?.type).toBe("PERMISSION_DENIED")
            expect(mockUserSearchRepository.search).not.toHaveBeenCalled()
        })

        it("deve processar resultados corretamente", async () => {
            // Arrange
            mockSecurityValidator.validateSearchTerm.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockSecurityValidator.validateSecurityContext.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockRateLimiter.checkLimit.mockResolvedValue({
                allowed: true,
                remaining: 99,
                resetAt: new Date(Date.now() + 3600000),
            })
            mockCacheManager.get.mockResolvedValue(null)
            mockUserSearchRepository.validateSearchCriteria.mockResolvedValue({
                isValid: true,
                errors: [],
                warnings: [],
            })
            mockUserSearchRepository.search.mockResolvedValue(mockSearchResult)
            mockCacheManager.set.mockResolvedValue(undefined)
            mockMetricsCollector.recordSearchMetrics.mockResolvedValue(undefined)
            mockRateLimiter.recordAttempt.mockResolvedValue(undefined)

            // Act
            const result = await useCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(true)
            expect(result.data?.users).toHaveLength(1)
            expect(result.data?.pagination.total).toBe(1)
            expect(result.data?.searchMetadata.totalResults).toBe(1)
        })
    })

    describe("createSearchQuery", () => {
        it("deve criar query com valores padrão", async () => {
            // Arrange
            const request = {
                searchTerm: "test",
                searcherUserId: "123",
                securityContext: {
                    userId: "123",
                    ipAddress: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                    permissions: [],
                },
            }

            // Act
            const result = await useCase.execute(request)

            // Assert
            // Verifica se a query foi criada com valores padrão
            expect(mockUserSearchRepository.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    searchType: "all",
                    pagination: expect.objectContaining({
                        limit: 20,
                        offset: 0,
                    }),
                    sorting: expect.objectContaining({
                        field: "relevance",
                        direction: "desc",
                    }),
                }),
            )
        })
    })
})
