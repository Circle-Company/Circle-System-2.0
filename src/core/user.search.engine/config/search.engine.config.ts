import { SearchEngineConfig } from "@/domain/user.search.engine/types"

/**
 * Configuração do User Search Engine
 *
 * Configurações centralizadas para o sistema de busca de usuários
 */
export const userSearchEngineConfig: SearchEngineConfig = {
    search: {
        maxResults: 1000,
        defaultLimit: 20,
        maxLimit: 100,
        timeout: 30000, // 30 segundos
        cacheExpiration: 300000, // 5 minutos
    },

    ranking: {
        weights: {
            relevance: 0.4, // 40% - Correspondência do termo de busca
            social: 0.25, // 25% - Relacionamentos sociais
            engagement: 0.2, // 20% - Taxa de engajamento
            proximity: 0.1, // 10% - Proximidade geográfica
            verification: 0.03, // 3% - Status de verificação
            content: 0.02, // 2% - Quantidade de conteúdo
        },
        factors: {
            usernameMatch: 0.4, // Correspondência no username
            nameMatch: 0.3, // Correspondência no nome
            descriptionMatch: 0.2, // Correspondência na descrição
            followersCount: 0.3, // Número de seguidores
            engagementRate: 0.4, // Taxa de engajamento
            verificationStatus: 0.3, // Status de verificação
            contentCount: 0.2, // Quantidade de conteúdo
            distance: 0.3, // Distância geográfica
            relationshipStrength: 0.5, // Força do relacionamento
            activityLevel: 0.2, // Nível de atividade
        },
    },

    security: {
        maxSearchTermLength: 100,
        minSearchTermLength: 1,
        suspiciousPatterns: [
            "script",
            "javascript",
            "onload",
            "onerror",
            "onclick",
            "union",
            "select",
            "insert",
            "update",
            "delete",
            "drop",
            "<script",
            "</script>",
            "javascript:",
            "data:",
            "vbscript:",
            "onmouseover",
            "onfocus",
            "onblur",
            "onchange",
            "onsubmit",
            "onreset",
            "onkeydown",
            "onkeyup",
            "onkeypress",
            "onmousedown",
            "onmouseup",
            "onmousemove",
            "onmouseout",
            "onmouseenter",
            "onmouseleave",
            "oncontextmenu",
            "ondblclick",
            "onabort",
            "onafterprint",
            "onbeforeprint",
            "onbeforeunload",
            "onerror",
            "onhashchange",
            "onload",
            "onmessage",
            "onoffline",
            "ononline",
            "onpagehide",
            "onpageshow",
            "onpopstate",
            "onresize",
            "onstorage",
            "onunload",
        ],
        rateLimitPerUser: 100, // 100 requisições por hora por usuário
        rateLimitPerIP: 1000, // 1000 requisições por hora por IP
    },

    performance: {
        enableCaching: true,
        enableMetrics: true,
        batchSize: 50,
        maxConcurrentQueries: 10,
    },
}

/**
 * Configurações específicas para diferentes ambientes
 */
export const environmentConfigs = {
    development: {
        ...userSearchEngineConfig,
        performance: {
            ...userSearchEngineConfig.performance,
            enableCaching: false, // Desabilita cache em desenvolvimento
            enableMetrics: true,
        },
        security: {
            ...userSearchEngineConfig.security,
            rateLimitPerUser: 1000, // Limites mais altos em desenvolvimento
            rateLimitPerIP: 10000,
        },
    },

    test: {
        ...userSearchEngineConfig,
        performance: {
            ...userSearchEngineConfig.performance,
            enableCaching: false,
            enableMetrics: false,
        },
        search: {
            ...userSearchEngineConfig.search,
            timeout: 5000, // Timeout menor para testes
            cacheExpiration: 1000, // Cache mais curto para testes
        },
    },

    production: {
        ...userSearchEngineConfig,
        performance: {
            ...userSearchEngineConfig.performance,
            enableCaching: true,
            enableMetrics: true,
            batchSize: 100,
            maxConcurrentQueries: 20,
        },
        search: {
            ...userSearchEngineConfig.search,
            timeout: 15000, // Timeout menor em produção
            cacheExpiration: 600000, // 10 minutos em produção
        },
    },
}

/**
 * Configurações específicas por tipo de busca
 */
export const searchTypeConfigs = {
    related: {
        weights: {
            ...userSearchEngineConfig.ranking.weights,
            social: 0.5, // Aumenta peso social
            relevance: 0.3, // Diminui peso de relevância
        },
        maxResults: 50,
        cacheExpiration: 600000, // 10 minutos
    },

    unknown: {
        weights: {
            ...userSearchEngineConfig.ranking.weights,
            proximity: 0.2, // Aumenta peso de proximidade
            engagement: 0.3, // Aumenta peso de engajamento
        },
        maxResults: 100,
        cacheExpiration: 300000, // 5 minutos
    },

    verified: {
        weights: {
            ...userSearchEngineConfig.ranking.weights,
            verification: 0.1, // Aumenta peso de verificação
            engagement: 0.25, // Aumenta peso de engajamento
        },
        maxResults: 30,
        cacheExpiration: 900000, // 15 minutos
    },

    nearby: {
        weights: {
            ...userSearchEngineConfig.ranking.weights,
            proximity: 0.4, // Aumenta muito o peso de proximidade
            relevance: 0.3, // Diminui peso de relevância
        },
        maxResults: 20,
        cacheExpiration: 60000, // 1 minuto (localização muda frequentemente)
    },
}

/**
 * Configurações de cache por tipo de operação
 */
export const cacheConfigs = {
    search: {
        ttl: 300000, // 5 minutos
        maxSize: 1000, // 1000 entradas
        cleanupInterval: 60000, // 1 minuto
    },

    suggestions: {
        ttl: 120000, // 2 minutos
        maxSize: 500, // 500 entradas
        cleanupInterval: 30000, // 30 segundos
    },

    relationships: {
        ttl: 600000, // 10 minutos
        maxSize: 2000, // 2000 entradas
        cleanupInterval: 120000, // 2 minutos
    },

    userProfile: {
        ttl: 1800000, // 30 minutos
        maxSize: 5000, // 5000 entradas
        cleanupInterval: 300000, // 5 minutos
    },
}

/**
 * Configurações de métricas e monitoramento
 */
export const metricsConfig = {
    enabled: true,
    collectionInterval: 60000, // 1 minuto
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 dias
    maxMetricsPerQuery: 100,

    // Métricas específicas
    performance: {
        trackResponseTime: true,
        trackMemoryUsage: true,
        trackDatabaseQueries: true,
        trackCacheHitRate: true,
    },

    business: {
        trackSearchTerms: true,
        trackSearchTypes: true,
        trackUserBehavior: true,
        trackErrorRates: true,
    },

    alerts: {
        highResponseTime: 5000, // 5 segundos
        lowCacheHitRate: 0.7, // 70%
        highErrorRate: 0.05, // 5%
        highMemoryUsage: 1024 * 1024 * 1024, // 1GB
    },
}

/**
 * Configurações de algoritmos de ranking
 */
export const rankingAlgorithmConfigs = {
    default: {
        name: "weighted_score",
        version: "1.0.0",
        parameters: {
            weights: userSearchEngineConfig.ranking.weights,
            factors: userSearchEngineConfig.ranking.factors,
            normalizationMethod: "min_max",
            decayFactor: 0.9,
        },
    },

    personalized: {
        name: "personalized_ranking",
        version: "2.0.0",
        parameters: {
            weights: userSearchEngineConfig.ranking.weights,
            factors: userSearchEngineConfig.ranking.factors,
            userPreferenceWeight: 0.3,
            socialGraphWeight: 0.2,
            temporalDecay: 0.8,
        },
    },

    location_aware: {
        name: "location_aware_ranking",
        version: "1.5.0",
        parameters: {
            weights: {
                ...userSearchEngineConfig.ranking.weights,
                proximity: 0.4,
            },
            factors: userSearchEngineConfig.ranking.factors,
            maxDistance: 100, // km
            distanceDecay: 0.1,
        },
    },
}

/**
 * Função para obter configuração baseada no ambiente
 */
export function getConfig(
    environment: "development" | "test" | "production" = "production",
): SearchEngineConfig {
    return environmentConfigs[environment] || environmentConfigs.production
}

/**
 * Função para obter configuração específica por tipo de busca
 */
export function getSearchTypeConfig(
    searchType: keyof typeof searchTypeConfigs,
): Partial<SearchEngineConfig> {
    return searchTypeConfigs[searchType] || {}
}

/**
 * Função para validar configuração
 */
export function validateConfig(config: SearchEngineConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validação de limites
    if (config.search.maxLimit > 1000) {
        errors.push("maxLimit não pode ser maior que 1000")
    }

    if (config.search.defaultLimit > config.search.maxLimit) {
        errors.push("defaultLimit não pode ser maior que maxLimit")
    }

    // Validação de pesos de ranking
    const totalWeight = Object.values(config.ranking.weights).reduce(
        (sum, weight) => sum + weight,
        0,
    )
    if (Math.abs(totalWeight - 1) > 0.01) {
        errors.push("Soma dos pesos de ranking deve ser aproximadamente 1.0")
    }

    // Validação de timeouts
    if (config.search.timeout < 1000) {
        errors.push("timeout deve ser pelo menos 1000ms")
    }

    // Validação de rate limits
    if (config.security.rateLimitPerUser < 1) {
        errors.push("rateLimitPerUser deve ser pelo menos 1")
    }

    if (config.security.rateLimitPerIP < 1) {
        errors.push("rateLimitPerIP deve ser pelo menos 1")
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Função para mesclar configurações
 */
export function mergeConfigs(
    baseConfig: SearchEngineConfig,
    overrideConfig: Partial<SearchEngineConfig>,
): SearchEngineConfig {
    return {
        search: { ...baseConfig.search, ...overrideConfig.search },
        ranking: {
            weights: { ...baseConfig.ranking.weights, ...overrideConfig.ranking?.weights },
            factors: { ...baseConfig.ranking.factors, ...overrideConfig.ranking?.factors },
        },
        security: { ...baseConfig.security, ...overrideConfig.security },
        performance: { ...baseConfig.performance, ...overrideConfig.performance },
    }
}
