/**
 * User Search Engine Types
 *
 * Tipos e interfaces para o sistema de busca de usuários
 */

// ===== TIPOS BÁSICOS =====

export interface SearchCriteria {
    searchTerm: string
    searcherUserId: string
    searchType: "all" | "related" | "unknown" | "verified" | "nearby"
    filters: SearchFilters
    pagination: PaginationOptions
    sorting: SortingOptions
}

export interface SearchFilters {
    includeVerified?: boolean
    includeUnverified?: boolean
    includeBlocked?: boolean
    includeMuted?: boolean
    minFollowers?: number
    maxFollowers?: number
    minEngagementRate?: number
    maxEngagementRate?: number
    maxDistance?: number
    preferredHashtags?: string[]
    excludeUserIds?: string[]
}

export interface PaginationOptions {
    limit: number
    offset: number
}

export interface SortingOptions {
    field: "relevance" | "followers" | "engagement" | "distance" | "created_at"
    direction: "asc" | "desc"
}

// ===== TIPOS DE RESULTADO =====

export interface SearchResult {
    users: UserSearchResult[]
    pagination: PaginationInfo
    searchMetadata: SearchMetadata
    performance: PerformanceMetrics
}

export interface UserSearchResult {
    id: string
    userId: string
    username: string
    name: string | null
    description: string | null
    isVerified: boolean
    isActive: boolean
    reputationScore: number
    engagementRate: number
    followersCount: number
    followingCount: number
    contentCount: number
    profilePictureUrl: string | null
    distance?: number | null
    relationshipStatus: RelationshipStatus
    searchScore: number
    searchMetadata: UserSearchMetadata
}

export interface RelationshipStatus {
    youFollow: boolean
    followsYou: boolean
    isBlocked: boolean
    isMuted: boolean
}

export interface UserSearchMetadata {
    searchTerm: string
    searchType: "related" | "unknown" | "mixed"
    searchTimestamp: Date
    rankingFactors: string[]
}

export interface PaginationInfo {
    total: number
    limit: number
    offset: number
    hasNext: boolean
    hasPrevious: boolean
    totalPages: number
    currentPage: number
}

export interface SearchMetadata {
    queryId: string
    searchTerm: string
    searchType: string
    totalResults: number
    searchDuration: number
    cacheHit: boolean
    timestamp: Date
    searcherUserId: string
}

export interface PerformanceMetrics {
    totalDuration: number
    searchDuration: number
    rankingDuration: number
    cacheDuration: number
    databaseQueries: number
    memoryUsage: number
    cacheHits: number
    cacheMisses: number
}

// ===== TIPOS DE CONFIGURAÇÃO =====

export interface SearchEngineConfig {
    search: {
        maxResults: number
        defaultLimit: number
        maxLimit: number
        timeout: number
        cacheExpiration: number
    }
    ranking: {
        weights: RankingWeights
        factors: RankingFactors
    }
    security: {
        maxSearchTermLength: number
        minSearchTermLength: number
        suspiciousPatterns: string[]
        rateLimitPerUser: number
        rateLimitPerIP: number
    }
    performance: {
        enableCaching: boolean
        enableMetrics: boolean
        batchSize: number
        maxConcurrentQueries: number
    }
}

export interface RankingWeights {
    relevance: number
    social: number
    engagement: number
    proximity: number
    verification: number
    content: number
}

export interface RankingFactors {
    usernameMatch: number
    nameMatch: number
    descriptionMatch: number
    followersCount: number
    engagementRate: number
    verificationStatus: number
    contentCount: number
    distance: number
    relationshipStrength: number
    activityLevel: number
}

// ===== TIPOS DE ERRO =====

export enum SearchErrorType {
    INVALID_SEARCH_TERM = "INVALID_SEARCH_TERM",
    SEARCH_TERM_TOO_SHORT = "SEARCH_TERM_TOO_SHORT",
    SEARCH_TERM_TOO_LONG = "SEARCH_TERM_TOO_LONG",
    SEARCH_TERM_SUSPICIOUS = "SEARCH_TERM_SUSPICIOUS",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    SEARCH_TIMEOUT = "SEARCH_TIMEOUT",
    DATABASE_ERROR = "DATABASE_ERROR",
    CACHE_ERROR = "CACHE_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface SearchError {
    type: SearchErrorType
    message: string
    code: string
    details?: Record<string, any>
    timestamp: Date
    queryId?: string
}

// ===== TIPOS DE CACHE =====

export interface CacheEntry<T> {
    data: T
    timestamp: number
    expiresAt: number
    hitCount: number
}

export interface CacheConfig {
    enabled: boolean
    defaultTTL: number
    maxSize: number
    cleanupInterval: number
}

// ===== TIPOS DE MÉTRICAS =====

export interface SearchMetrics {
    totalSearches: number
    successfulSearches: number
    failedSearches: number
    averageResponseTime: number
    cacheHitRate: number
    topSearchTerms: Array<{ term: string; count: number }>
    searchTypesDistribution: Record<string, number>
    errorDistribution: Record<SearchErrorType, number>
}

export interface UserSearchMetrics {
    userId: string
    totalSearches: number
    lastSearchAt: Date
    averageResultsPerSearch: number
    preferredSearchTypes: string[]
    searchFrequency: number
}

// ===== TIPOS DE VALIDAÇÃO =====

export interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationWarning[]
}

export interface ValidationError {
    field: string
    message: string
    code: string
    value?: any
}

export interface ValidationWarning {
    field: string
    message: string
    code: string
    value?: any
}

// ===== TIPOS DE SEGURANÇA =====

export interface SecurityContext {
    userId: string
    ipAddress: string
    userAgent: string
    sessionId?: string
    permissions: string[]
    rateLimitInfo: RateLimitInfo
}

export interface RateLimitInfo {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
    currentMinute: number
    currentHour: number
    currentDay: number
    resetAt: Date
}

// ===== TIPOS DE ALGORITMO DE BUSCA =====

export interface SearchAlgorithm {
    name: string
    version: string
    parameters: Record<string, any>
    performance: AlgorithmPerformance
}

export interface AlgorithmPerformance {
    accuracy: number
    speed: number
    memoryUsage: number
    lastUpdated: Date
}

// ===== TIPOS DE FILTRO AVANÇADO =====

export interface AdvancedFilters {
    dateRange?: {
        startDate: Date
        endDate: Date
    }
    location?: {
        latitude: number
        longitude: number
        radius: number
    }
    interests?: string[]
    languages?: string[]
    ageRange?: {
        min: number
        max: number
    }
    activityLevel?: "low" | "medium" | "high"
    contentTypes?: string[]
}

// ===== TIPOS DE RESULTADO AVANÇADO =====

export interface AdvancedSearchResult extends SearchResult {
    suggestions: SearchSuggestion[]
    relatedTerms: string[]
    facets: SearchFacets
    highlights: SearchHighlights
}

export interface SearchSuggestion {
    term: string
    type: "correction" | "completion" | "related"
    confidence: number
}

export interface SearchFacets {
    verified: { count: number; percentage: number }
    followers: { ranges: Array<{ range: string; count: number }> }
    engagement: { ranges: Array<{ range: string; count: number }> }
    distance: { ranges: Array<{ range: string; count: number }> }
    activity: { ranges: Array<{ range: string; count: number }> }
}

export interface SearchHighlights {
    username?: string[]
    name?: string[]
    description?: string[]
}

// ===== TIPOS DE EVENTOS =====

export interface SearchEvent {
    id: string
    type:
        | "search_started"
        | "search_completed"
        | "search_failed"
        | "result_clicked"
        | "result_ignored"
    timestamp: Date
    userId: string
    queryId: string
    data: Record<string, any>
}

// ===== TIPOS DE CONFIGURAÇÃO DINÂMICA =====

export interface DynamicConfig {
    featureFlags: Record<string, boolean>
    algorithmSettings: Record<string, any>
    rateLimits: Record<string, number>
    cacheSettings: Record<string, any>
    lastUpdated: Date
}

// ===== TIPOS DE EXPORTAÇÃO =====

export interface ExportOptions {
    format: "json" | "csv" | "xml"
    includeMetadata: boolean
    includePerformance: boolean
    limit?: number
}

export interface ExportResult {
    data: string
    format: string
    size: number
    timestamp: Date
    queryId: string
}
