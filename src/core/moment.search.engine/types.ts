export interface SearchQuery {
    term: string
    filters?: SearchFilters
    pagination?: PaginationOptions
    sorting?: SortingOptions
    context?: SearchContext
}

export interface SearchFilters {
    // Filtros de conteúdo
    status?: string[]
    visibility?: string[]
    contentType?: string[]

    // Filtros temporais
    dateFrom?: Date
    dateTo?: Date

    // Filtros geográficos
    location?: {
        latitude: number
        longitude: number
        radius: number // em km
    }

    // Filtros de usuário
    userId?: string
    excludeUserId?: string

    // Filtros de qualidade
    minLikes?: number
    minViews?: number
    minComments?: number

    // Filtros de hashtag
    hashtags?: string[]
    excludeHashtags?: string[]

    // Filtros de duração
    minDuration?: number
    maxDuration?: number
}

export interface PaginationOptions {
    limit?: number
    offset?: number
    cursor?: string
}

export interface SortingOptions {
    field: "relevance" | "date" | "likes" | "views" | "comments" | "distance"
    order: "asc" | "desc"
}

export interface SearchContext {
    userId?: string
    userLocation?: {
        latitude: number
        longitude: number
    }
    userPreferences?: {
        languages?: string[]
        interests?: string[]
        blockedUsers?: string[]
        mutedUsers?: string[]
    }
    device?: string
    sessionId?: string
}

export interface SearchResult {
    moments: MomentSearchResult[]
    total: number
    page: number
    limit: number
    totalPages: number
    searchTime: number
    suggestions?: string[]
    filters?: AppliedFilters
}

export interface MomentSearchResult {
    id: string
    title: string
    description: string
    hashtags: string[]
    ownerId: string
    ownerUsername: string
    createdAt: Date
    updatedAt: Date
    status: string
    visibility: string
    location?: {
        latitude: number
        longitude: number
        address?: string
    }
    metrics: {
        views: number
        likes: number
        comments: number
        shares: number
    }
    media: {
        type: string
        duration?: number
        thumbnail?: string
    }
    relevance: {
        score: number
        breakdown: {
            textual: number
            engagement: number
            recency: number
            quality: number
            proximity: number
        }
    }
    distance?: number // em km, se busca por localização
}

export interface AppliedFilters {
    status: string[]
    visibility: string[]
    dateRange?: {
        from: Date
        to: Date
    }
    location?: {
        latitude: number
        longitude: number
        radius: number
    }
    hashtags: string[]
    quality: {
        minLikes: number
        minViews: number
        minComments: number
    }
}

export interface SearchMetrics {
    totalQueries: number
    averageResponseTime: number
    cacheHitRate: number
    topQueries: Array<{
        query: string
        count: number
    }>
    errorRate: number
}

export interface SearchSuggestion {
    term: string
    type: "hashtag" | "user" | "location" | "text"
    count: number
    relevance: number
}

export interface SearchEngineConfig {
    // Configurações de busca
    maxResults: number
    defaultLimit: number
    timeout: number

    // Configurações de cache
    cacheEnabled: boolean
    cacheTTL: number

    // Configurações de ranking
    rankingWeights: {
        textual: number
        engagement: number
        recency: number
        quality: number
        proximity: number
    }

    // Configurações de filtros
    defaultFilters: SearchFilters

    // Configurações de performance
    enableParallelSearch: boolean
    maxConcurrentSearches: number
}

export interface SearchEngineStats {
    totalSearches: number
    averageResponseTime: number
    cacheHitRate: number
    errorRate: number
    topQueries: Array<{
        query: string
        count: number
        avgResponseTime: number
    }>
    performanceMetrics: {
        memoryUsage: number
        cpuUsage: number
        activeConnections: number
    }
}
