import { Moment } from "../entities/moment.entity"

export interface IMomentRepository {
    // Operações básicas CRUD
    create(moment: Moment): Promise<Moment>
    findById(id: string): Promise<Moment | null>
    update(moment: Moment): Promise<Moment>
    delete(id: string): Promise<void>

    // Operações de busca
    findByOwnerId(
        ownerId: string,
        limit?: number,
        offset?: number,
        filters?: { status?: string; visibility?: string },
    ): Promise<Moment[]>
    findByStatus(status: string, limit?: number, offset?: number): Promise<Moment[]>
    findByVisibility(visibility: string, limit?: number, offset?: number): Promise<Moment[]>
    findByHashtag(hashtag: string, limit?: number, offset?: number): Promise<Moment[]>
    findByMention(mention: string, limit?: number, offset?: number): Promise<Moment[]>

    findPublished(limit?: number, offset?: number): Promise<Moment[]>
    findRecent(limit?: number, offset?: number): Promise<Moment[]>

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

    // Operações de likes
    hasUserLikedMoment(momentId: string, userId: string): Promise<boolean>
    addLike(momentId: string, userId: string): Promise<void>
    removeLike(momentId: string, userId: string): Promise<void>
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

/**
 * Implementação base do repositório de moments
 * Fornece implementação padrão para operações de validação de interatividade
 */
export abstract class BaseMomentRepository implements IMomentRepository {
    // Métodos abstratos que devem ser implementados pelas classes filhas
    abstract create(moment: Moment): Promise<Moment>
    abstract findById(id: string): Promise<Moment | null>
    abstract update(moment: Moment): Promise<Moment>
    abstract delete(id: string): Promise<void>
    abstract findByOwnerId(ownerId: string, limit?: number, offset?: number): Promise<Moment[]>
    abstract findByStatus(status: string, limit?: number, offset?: number): Promise<Moment[]>
    abstract findByVisibility(
        visibility: string,
        limit?: number,
        offset?: number,
    ): Promise<Moment[]>
    abstract findByHashtag(hashtag: string, limit?: number, offset?: number): Promise<Moment[]>
    abstract findByMention(mention: string, limit?: number, offset?: number): Promise<Moment[]>
    abstract findPublished(limit?: number, offset?: number): Promise<Moment[]>
    abstract findRecent(limit?: number, offset?: number): Promise<Moment[]>
    abstract findByLocation(
        latitude: number,
        longitude: number,
        radiusKm: number,
        limit?: number,
        offset?: number,
    ): Promise<Moment[]>
    abstract findByLocationWithDistance(
        latitude: number,
        longitude: number,
        radiusKm: number,
        limit?: number,
        offset?: number,
    ): Promise<Array<Moment & { distance: number }>>
    abstract findByBoundingBox(
        minLat: number,
        minLng: number,
        maxLat: number,
        maxLng: number,
        limit?: number,
        offset?: number,
    ): Promise<Moment[]>
    abstract findNearbyMoments(
        latitude: number,
        longitude: number,
        limit?: number,
        offset?: number,
    ): Promise<Array<Moment & { distance: number }>>
    abstract findPendingProcessing(limit?: number, offset?: number): Promise<Moment[]>
    abstract findFailedProcessing(limit?: number, offset?: number): Promise<Moment[]>
    abstract countByOwnerId(ownerId: string): Promise<number>
    abstract countByStatus(status: string): Promise<number>
    abstract countByVisibility(visibility: string): Promise<number>
    abstract countPublished(): Promise<number>
    abstract exists(id: string): Promise<boolean>
    abstract existsByOwnerId(ownerId: string): Promise<boolean>
    abstract createMany(moments: Moment[]): Promise<Moment[]>
    abstract updateMany(moments: Moment[]): Promise<Moment[]>
    abstract deleteMany(ids: string[]): Promise<void>
    abstract findPaginated(
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
    abstract getAnalytics(): Promise<IMomentAnalytics>
    abstract getStats(): Promise<IMomentRepositoryStats>
    abstract isOwner(momentId: string, userId: string): Promise<boolean>
    abstract hasUserLikedMoment(momentId: string, userId: string): Promise<boolean>
    abstract addLike(momentId: string, userId: string): Promise<void>
    abstract removeLike(momentId: string, userId: string): Promise<void>
}
