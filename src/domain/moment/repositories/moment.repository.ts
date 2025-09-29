import { Moment } from "../entities/moment.entity"

export interface IMomentRepository {
    // Operações básicas CRUD
    create(moment: Moment): Promise<Moment>
    findById(id: string): Promise<Moment | null>
    update(moment: Moment): Promise<Moment>
    delete(id: string): Promise<void>

    // Operações de busca
    findByOwnerId(ownerId: string, limit?: number, offset?: number): Promise<Moment[]>
    findByStatus(status: string, limit?: number, offset?: number): Promise<Moment[]>
    findByVisibility(visibility: string, limit?: number, offset?: number): Promise<Moment[]>
    findByHashtag(hashtag: string, limit?: number, offset?: number): Promise<Moment[]>
    findByMention(mention: string, limit?: number, offset?: number): Promise<Moment[]>

    // Operações de busca avançada
    search(query: string, limit?: number, offset?: number): Promise<Moment[]>
    fullTextSearch(query: string, limit?: number, offset?: number): Promise<Moment[]>
    fullTextSearchWithRanking(
        query: string,
        limit?: number,
        offset?: number,
    ): Promise<Array<Moment & { relevance: number }>>
    findPublished(limit?: number, offset?: number): Promise<Moment[]>
    findRecent(limit?: number, offset?: number): Promise<Moment[]>

    // Operações de busca espacial
    findByLocation(
        latitude: number,
        longitude: number,
        radiusKm: number,
        limit?: number,
        offset?: number,
    ): Promise<Moment[]>
    findByLocationWithDistance(
        latitude: number,
        longitude: number,
        radiusKm: number,
        limit?: number,
        offset?: number,
    ): Promise<Array<Moment & { distance: number }>>
    findByBoundingBox(
        minLat: number,
        minLng: number,
        maxLat: number,
        maxLng: number,
        limit?: number,
        offset?: number,
    ): Promise<Moment[]>
    findNearbyMoments(
        latitude: number,
        longitude: number,
        limit?: number,
        offset?: number,
    ): Promise<Array<Moment & { distance: number }>>

    // Operações de processamento
    findPendingProcessing(limit?: number, offset?: number): Promise<Moment[]>
    findFailedProcessing(limit?: number, offset?: number): Promise<Moment[]>

    // Operações de contagem
    countByOwnerId(ownerId: string): Promise<number>
    countByStatus(status: string): Promise<number>
    countByVisibility(visibility: string): Promise<number>
    countPublished(): Promise<number>

    // Operações de existência
    exists(id: string): Promise<boolean>
    existsByOwnerId(ownerId: string): Promise<boolean>

    // Operações em lote
    createMany(moments: Moment[]): Promise<Moment[]>
    updateMany(moments: Moment[]): Promise<Moment[]>
    deleteMany(ids: string[]): Promise<void>

    // Operações de paginação
    findPaginated(
        page: number,
        limit: number,
        filters?: IMomentFilters,
    ): Promise<{
        moments: Moment[]
        total: number
        page: number
        limit: number
        totalPages: number
    }>

    // Análise e estatísticas
    getAnalytics(): Promise<IMomentAnalytics>
    getStats(): Promise<IMomentRepositoryStats>
}

export interface IMomentFilters {
    ownerId?: string
    status?: string
    visibility?: string
    hashtags?: string[]
    mentions?: string[]
    publishedAfter?: Date
    publishedBefore?: Date
    hasLocation?: boolean
    processingStatus?: string
    searchQuery?: string
}

export interface IMomentSortOptions {
    field: "createdAt" | "updatedAt" | "publishedAt"
    direction: "ASC" | "DESC"
}

export interface IMomentPaginationOptions {
    page: number
    limit: number
    sort?: IMomentSortOptions
}

export interface IMomentSearchOptions {
    query: string
    fields?: ("description" | "hashtags" | "mentions")[]
    limit?: number
    offset?: number
}

export interface IMomentAnalytics {
    totalMoments: number
    publishedMoments: number
    pendingMoments: number
    failedMoments: number
    topHashtags: Array<{ hashtag: string; count: number }>
    topMentions: Array<{ mention: string; count: number }>
    momentsByDay: Array<{ date: string; count: number }>
    momentsByStatus: Array<{ status: string; count: number }>
}

export interface IMomentRepositoryStats {
    totalMoments: number
    publishedMoments: number
    pendingMoments: number
    failedMoments: number
    totalHashtags: number
    totalMentions: number
    averageHashtagsPerMoment: number
    averageMentionsPerMoment: number
}

// Alias para compatibilidade com código existente
export type MomentFilters = IMomentFilters
export type MomentSortOptions = IMomentSortOptions
export type MomentPaginationOptions = IMomentPaginationOptions
export type MomentSearchOptions = IMomentSearchOptions
export type MomentAnalytics = IMomentAnalytics
export type MomentRepositoryStats = IMomentRepositoryStats
