/**
 * Exemplo de Uso do User Search Engine
 *
 * Este arquivo demonstra como usar o User Search Engine
 * em diferentes cenários e configurações.
 */

import { InMemoryCacheService } from "@/application/user.search.engine/services/cache.service"
import { RankingService } from "@/application/user.search.engine/services/ranking.service"
import { GetSearchSuggestionsUseCase } from "@/application/user.search.engine/use.cases/get.search.suggestions.use.case"
import { SearchUsersUseCase } from "@/application/user.search.engine/use.cases/search.users.use.case"
import { getConfig } from "@/core/user.search.engine/config/search.engine.config"
import { UserSearchController } from "@/infra/controllers/user.search.controller"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { UserSearchRepositoryImpl } from "@/infra/repository.impl/user.search.repository.impl"

/**
 * Exemplo 1: Configuração Básica
 */
export async function basicSetup() {
    // 1. Configuração do motor de busca
    const config = getConfig("production")

    // 2. Configuração do banco de dados
    const database = new DatabaseAdapter()
    await database.connect()

    // 3. Implementação do repositório
    const repository = new UserSearchRepositoryImpl(database, config)

    // 4. Serviços auxiliares
    const cacheService = new InMemoryCacheService(1000, 5 * 60 * 1000) // 1000 entradas, 5min TTL
    const rankingService = new RankingService({
        weights: config.ranking.weights,
        factors: config.ranking.factors,
        thresholds: {
            minScore: 0.1,
            highQualityThreshold: 0.7,
            influencerThreshold: 0.8,
        },
    })

    // 5. Implementações dos serviços de apoio
    const securityValidator = {
        validateSearchTerm: async (term: string) => ({
            isValid: true,
            errors: [],
            warnings: [],
        }),
        validateSecurityContext: async (context: any) => ({
            isValid: true,
            errors: [],
            warnings: [],
        }),
    }

    const rateLimiter = {
        checkLimit: async (userId: string, ipAddress: string) => ({
            allowed: true,
            remaining: 99,
            resetAt: new Date(Date.now() + 3600000),
        }),
        recordAttempt: async (userId: string, ipAddress: string) => {},
    }

    const cacheManager = {
        get: cacheService.get.bind(cacheService),
        set: cacheService.set.bind(cacheService),
        delete: cacheService.delete.bind(cacheService),
    }

    const metricsCollector = {
        recordSearchMetrics: async (metrics: any) => console.log("Metrics:", metrics),
        recordCacheHit: async (queryId: string) => console.log("Cache hit:", queryId),
        recordError: async (queryId: string, error: any, duration: number) =>
            console.error("Error:", queryId, error.message),
    }

    // 6. Casos de uso
    const searchUsersUseCase = new SearchUsersUseCase(
        repository,
        securityValidator,
        rateLimiter,
        cacheManager,
        metricsCollector,
    )

    const getSuggestionsUseCase = new GetSearchSuggestionsUseCase(
        repository,
        cacheManager,
        metricsCollector,
    )

    return {
        searchUsersUseCase,
        getSuggestionsUseCase,
        repository,
        cacheService,
        rankingService,
    }
}

/**
 * Exemplo 2: Busca Simples de Usuários
 */
export async function simpleUserSearch() {
    const { searchUsersUseCase } = await basicSetup()

    // Busca simples por nome de usuário
    const result = await searchUsersUseCase.execute({
        searchTerm: "joão",
        searcherUserId: "123456789",
        searchType: "all",
        pagination: {
            limit: 10,
            offset: 0,
        },
        searchContext: "discovery",
        securityContext: {
            userId: "123456789",
            ipAddress: "192.168.1.1",
            userAgent: "Mozilla/5.0",
            permissions: ["search"],
        },
    })

    if (result.success) {
        console.log(`Encontrados ${result.data?.users.length} usuários`)
        result.data?.users.forEach((user) => {
            console.log(`- ${user.username} (${user.name}) - Score: ${user.searchScore}`)
        })
    } else {
        console.error("Erro na busca:", result.error?.message)
    }

    return result
}

/**
 * Exemplo 3: Busca de Usuários Relacionados
 */
export async function searchRelatedUsers() {
    const { searchUsersUseCase } = await basicSetup()

    // Busca usuários relacionados (conexões sociais)
    const result = await searchUsersUseCase.execute({
        searchTerm: "maria",
        searcherUserId: "123456789",
        searchType: "related",
        filters: {
            includeVerified: true,
            minFollowers: 100,
        },
        pagination: {
            limit: 20,
            offset: 0,
        },
        searchContext: "follow_suggestions",
    })

    if (result.success) {
        console.log("Usuários relacionados encontrados:")
        result.data?.users.forEach((user) => {
            console.log(
                `- ${user.username} - Relacionamento: ${
                    user.relationshipStatus.youFollow ? "Você segue" : "Não segue"
                }`,
            )
        })
    }

    return result
}

/**
 * Exemplo 4: Busca por Proximidade Geográfica
 */
export async function searchNearbyUsers() {
    const { searchUsersUseCase } = await basicSetup()

    // Busca usuários próximos geograficamente
    const result = await searchUsersUseCase.execute({
        searchTerm: "carlos",
        searcherUserId: "123456789",
        searchType: "nearby",
        filters: {
            maxDistance: 25, // 25km
        },
        pagination: {
            limit: 15,
            offset: 0,
        },
        searchContext: "discovery",
    })

    if (result.success) {
        console.log("Usuários próximos encontrados:")
        result.data?.users.forEach((user) => {
            const distance = user.distance
                ? `${user.distance.toFixed(1)}km`
                : "Distância desconhecida"
            console.log(`- ${user.username} - Distância: ${distance}`)
        })
    }

    return result
}

/**
 * Exemplo 5: Busca de Usuários Verificados
 */
export async function searchVerifiedUsers() {
    const { searchUsersUseCase } = await basicSetup()

    // Busca apenas usuários verificados
    const result = await searchUsersUseCase.execute({
        searchTerm: "ana",
        searcherUserId: "123456789",
        searchType: "verified",
        filters: {
            minEngagementRate: 0.05, // 5% de engajamento mínimo
            minFollowers: 1000,
        },
        pagination: {
            limit: 10,
            offset: 0,
        },
        sorting: {
            field: "followers",
            direction: "desc",
        },
        searchContext: "discovery",
    })

    if (result.success) {
        console.log("Usuários verificados encontrados:")
        result.data?.users.forEach((user) => {
            console.log(
                `- ${user.username} ✓ - ${user.followersCount} seguidores - Engajamento: ${(
                    user.engagementRate * 100
                ).toFixed(1)}%`,
            )
        })
    }

    return result
}

/**
 * Exemplo 6: Obter Sugestões de Busca
 */
export async function getSearchSuggestions() {
    const { getSuggestionsUseCase } = await basicSetup()

    // Obter sugestões baseadas em termo parcial
    const result = await getSuggestionsUseCase.execute({
        partialTerm: "jo",
        userId: "123456789",
        limit: 10,
        context: "discovery",
        includePopular: true,
        includeUserHistory: true,
        includeTrending: false,
    })

    if (result.success) {
        console.log("Sugestões encontradas:")
        result.data?.suggestions.forEach((suggestion) => {
            console.log(
                `- ${suggestion.term} (${suggestion.type}) - Confiança: ${(
                    suggestion.confidence * 100
                ).toFixed(1)}%`,
            )
        })
    }

    return result
}

/**
 * Exemplo 7: Busca com Filtros Avançados
 */
export async function advancedSearchWithFilters() {
    const { searchUsersUseCase } = await basicSetup()

    // Busca com múltiplos filtros
    const result = await searchUsersUseCase.execute({
        searchTerm: "pedro",
        searcherUserId: "123456789",
        searchType: "all",
        filters: {
            includeVerified: true,
            includeUnverified: false,
            includeBlocked: false,
            includeMuted: false,
            minFollowers: 500,
            maxFollowers: 10000,
            minEngagementRate: 0.03, // 3%
            maxEngagementRate: 0.15, // 15%
            preferredHashtags: ["tech", "programming"],
            excludeUserIds: ["111111111", "222222222"],
        },
        pagination: {
            limit: 25,
            offset: 0,
        },
        sorting: {
            field: "engagement",
            direction: "desc",
        },
        searchContext: "discovery",
    })

    if (result.success) {
        console.log("Busca avançada concluída:")
        console.log(`Total: ${result.data?.pagination.total} resultados`)
        console.log(
            `Página: ${result.data?.pagination.currentPage} de ${result.data?.pagination.totalPages}`,
        )

        result.data?.users.forEach((user) => {
            console.log(`- ${user.username} (${user.name})`)
            console.log(
                `  Seguidores: ${user.followersCount} | Engajamento: ${(
                    user.engagementRate * 100
                ).toFixed(1)}%`,
            )
            console.log(
                `  Score: ${user.searchScore.toFixed(1)} | Verificado: ${
                    user.isVerified ? "Sim" : "Não"
                }`,
            )
        })
    }

    return result
}

/**
 * Exemplo 8: Configuração do Controller HTTP
 */
export async function setupHttpController() {
    const { searchUsersUseCase, getSuggestionsUseCase } = await basicSetup()

    // Criar controller
    const controller = new UserSearchController(searchUsersUseCase, getSuggestionsUseCase)

    // Criar router
    const router = UserSearchRouterFactory.create(controller, {
        enableCors: true,
        enableAuth: true,
        enableLogging: true,
        enableErrorHandling: true,
    })

    return {
        controller,
        router,
    }
}

/**
 * Exemplo 9: Monitoramento e Métricas
 */
export async function monitorSearchPerformance() {
    const { repository, cacheService } = await basicSetup()

    // Obter estatísticas de busca
    const searchStats = await repository.getSearchStatistics("123456789")
    console.log("Estatísticas de busca:", searchStats)

    // Obter estatísticas de cache
    const cacheStats = await cacheService.getStats()
    console.log("Estatísticas de cache:", cacheStats)

    // Obter termos populares
    const popularTerms = await repository.getPopularSearchTerms(10)
    console.log("Termos populares:", popularTerms)

    return {
        searchStats,
        cacheStats,
        popularTerms,
    }
}

/**
 * Exemplo 10: Configuração Personalizada
 */
export async function customConfiguration() {
    // Configuração personalizada para ranking
    const customConfig = {
        ranking: {
            weights: {
                relevance: 0.5, // Aumenta peso de relevância
                social: 0.3, // Diminui peso social
                engagement: 0.15, // Mantém engajamento
                proximity: 0.03, // Diminui proximidade
                verification: 0.01, // Diminui verificação
                content: 0.01, // Diminui conteúdo
            },
            factors: {
                usernameMatch: 0.5,
                nameMatch: 0.4,
                descriptionMatch: 0.1,
                followersCount: 0.2,
                engagementRate: 0.4,
                verificationStatus: 0.1,
                contentCount: 0.1,
                distance: 0.2,
                relationshipStrength: 0.4,
                activityLevel: 0.3,
            },
        },
    }

    const config = getConfig("production")
    const mergedConfig = { ...config, ...customConfig }

    // Usar configuração personalizada
    const database = new DatabaseAdapter()
    await database.connect()

    const repository = new UserSearchRepositoryImpl(database, mergedConfig)

    return {
        repository,
        config: mergedConfig,
    }
}

/**
 * Exemplo 11: Tratamento de Erros
 */
export async function errorHandlingExample() {
    const { searchUsersUseCase } = await basicSetup()

    try {
        // Tentativa de busca com termo suspeito
        const result = await searchUsersUseCase.execute({
            searchTerm: '<script>alert("xss")</script>',
            searcherUserId: "123456789",
            searchType: "all",
        })

        if (!result.success) {
            console.log("Erro capturado:", result.error?.message)
            console.log("Tipo de erro:", result.error?.type)
            console.log("Detalhes:", result.error?.details)
        }
    } catch (error) {
        console.error("Erro inesperado:", error)
    }
}

/**
 * Exemplo 12: Cache Management
 */
export async function cacheManagementExample() {
    const { repository, cacheService } = await basicSetup()

    // Limpar cache de usuário específico
    await repository.invalidateUserCache("123456789")
    console.log("Cache do usuário invalidado")

    // Limpar cache expirado
    await repository.clearExpiredCache()
    console.log("Cache expirado limpo")

    // Obter estatísticas de cache
    const stats = await cacheService.getStats()
    console.log("Estatísticas de cache:", stats)

    // Limpar todo o cache
    await cacheService.clear()
    console.log("Cache completamente limpo")
}

// Função principal para executar todos os exemplos
export async function runAllExamples() {
    console.log("=== Exemplos do User Search Engine ===\n")

    try {
        console.log("1. Busca simples...")
        await simpleUserSearch()
        console.log("")

        console.log("2. Busca de usuários relacionados...")
        await searchRelatedUsers()
        console.log("")

        console.log("3. Busca por proximidade...")
        await searchNearbyUsers()
        console.log("")

        console.log("4. Busca de usuários verificados...")
        await searchVerifiedUsers()
        console.log("")

        console.log("5. Obter sugestões...")
        await getSearchSuggestions()
        console.log("")

        console.log("6. Busca avançada...")
        await advancedSearchWithFilters()
        console.log("")

        console.log("7. Configuração HTTP...")
        await setupHttpController()
        console.log("")

        console.log("8. Monitoramento...")
        await monitorSearchPerformance()
        console.log("")

        console.log("9. Configuração personalizada...")
        await customConfiguration()
        console.log("")

        console.log("10. Tratamento de erros...")
        await errorHandlingExample()
        console.log("")

        console.log("11. Gerenciamento de cache...")
        await cacheManagementExample()
        console.log("")

        console.log("=== Todos os exemplos executados com sucesso! ===")
    } catch (error) {
        console.error("Erro ao executar exemplos:", error)
    }
}

// Exportar função principal para uso
export default runAllExamples
