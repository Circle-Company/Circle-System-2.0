import { SearchEngineConfig } from "./types"

export const defaultSearchConfig: SearchEngineConfig = {
    // Configurações de busca
    maxResults: 100,
    defaultLimit: 20,
    timeout: 5000, // 5 segundos

    // Configurações de cache
    cacheEnabled: true,
    cacheTTL: 600, // 10 minutos

    // Configurações de ranking
    rankingWeights: {
        textual: 0.4,
        engagement: 0.25,
        recency: 0.2,
        quality: 0.1,
        proximity: 0.05,
    },

    // Configurações de filtros padrão
    defaultFilters: {
        status: ["PUBLISHED"],
        visibility: ["PUBLIC", "FOLLOWERS"],
        dateFrom: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), // 2 anos atrás
        minLikes: 0,
        minViews: 0,
        minComments: 0,
    },

    // Configurações de performance
    enableParallelSearch: true,
    maxConcurrentSearches: 3,
}

export const searchRules = {
    // Regras de validação
    validation: {
        minTermLength: 1,
        maxTermLength: 100,
        maxHashtags: 10,
        maxRadius: 100, // km
        maxDuration: 3600, // segundos
    },

    // Regras de performance
    performance: {
        maxProcessingTime: 5000,
        maxCacheSize: 1000,
        maxSuggestions: 10,
        maxResultsPerPage: 100,
    },

    // Regras de relevância
    relevance: {
        minTextualScore: 0.1,
        minEngagementScore: 0.0,
        minRecencyScore: 0.0,
        minQualityScore: 0.0,
        minProximityScore: 0.0,
        minOverallScore: 0.05,
    },

    // Regras de filtros
    filters: {
        maxStatusFilters: 5,
        maxVisibilityFilters: 3,
        maxHashtagFilters: 20,
        maxExcludeHashtags: 10,
        maxDateRange: 365 * 24 * 60 * 60 * 1000, // 1 ano
    },
}

export const searchIndexes = {
    // Índices de texto
    text: {
        title: "gin",
        description: "gin",
        hashtags: "gin",
    },

    // Índices geográficos
    location: {
        coordinates: "gist",
        address: "gin",
    },

    // Índices temporais
    temporal: {
        createdAt: "btree",
        updatedAt: "btree",
    },

    // Índices de métricas
    metrics: {
        likes: "btree",
        views: "btree",
        comments: "btree",
    },

    // Índices compostos
    composite: {
        status_createdAt: ["status", "createdAt"],
        visibility_ownerId: ["visibility", "ownerId"],
        hashtags_createdAt: ["hashtags", "createdAt"],
    },
}

export const searchCache = {
    // Configurações de cache
    ttl: {
        searchResults: 600, // 10 minutos
        suggestions: 1800, // 30 minutos
        userPreferences: 3600, // 1 hora
        locationData: 7200, // 2 horas
    },

    // Chaves de cache
    keys: {
        searchResults: (query: string, filters: string) => `search:${query}:${filters}`,
        suggestions: (term: string) => `suggestions:${term}`,
        userPreferences: (userId: string) => `user:prefs:${userId}`,
        locationData: (lat: number, lng: number) => `location:${lat}:${lng}`,
    },

    // Configurações de invalidação
    invalidation: {
        onMomentCreate: true,
        onMomentUpdate: true,
        onMomentDelete: true,
        onUserUpdate: true,
    },
}
