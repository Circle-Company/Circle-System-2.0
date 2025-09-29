import { generateId } from "@/shared"

/**
 * User Search Query Domain Entity
 *
 * Representa uma consulta de busca de usuários com todos os parâmetros
 * e configurações necessárias para executar a busca.
 */
export interface UserSearchQueryProps {
    id?: string
    searchTerm: string
    searcherUserId: string
    searchType: "all" | "related" | "unknown" | "verified" | "nearby"
    filters: {
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
    pagination: {
        limit: number
        offset: number
    }
    sorting: {
        field: "relevance" | "followers" | "engagement" | "distance" | "created_at"
        direction: "asc" | "desc"
    }
    searchMetadata: {
        userAgent?: string
        ipAddress?: string
        sessionId?: string
        searchContext?: "discovery" | "follow_suggestions" | "mention" | "admin"
    }
    createdAt?: Date
    updatedAt?: Date
}

export class UserSearchQuery {
    private readonly _id: string
    private _searchTerm: string
    private readonly _searcherUserId: string
    private _searchType: "all" | "related" | "unknown" | "verified" | "nearby"
    private _filters: {
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
    private _pagination: {
        limit: number
        offset: number
    }
    private _sorting: {
        field: "relevance" | "followers" | "engagement" | "distance" | "created_at"
        direction: "asc" | "desc"
    }
    private _searchMetadata: {
        userAgent?: string
        ipAddress?: string
        sessionId?: string
        searchContext?: "discovery" | "follow_suggestions" | "mention" | "admin"
    }
    private readonly _createdAt: Date
    private _updatedAt: Date

    constructor(props: UserSearchQueryProps) {
        this._id = props.id || generateId()
        this._searchTerm = props.searchTerm
        this._searcherUserId = props.searcherUserId
        this._searchType = props.searchType
        this._filters = props.filters
        this._pagination = props.pagination
        this._sorting = props.sorting
        this._searchMetadata = props.searchMetadata
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()

        this.validate()
    }

    // Getters
    get id(): string {
        return this._id
    }

    get searchTerm(): string {
        return this._searchTerm
    }

    get searcherUserId(): string {
        return this._searcherUserId
    }

    get searchType(): "all" | "related" | "unknown" | "verified" | "nearby" {
        return this._searchType
    }

    get filters() {
        return { ...this._filters }
    }

    get pagination() {
        return { ...this._pagination }
    }

    get sorting() {
        return { ...this._sorting }
    }

    get searchMetadata() {
        return { ...this._searchMetadata }
    }

    get createdAt(): Date {
        return this._createdAt
    }

    get updatedAt(): Date {
        return this._updatedAt
    }

    // Métodos de domínio
    public updateSearchTerm(newTerm: string): void {
        if (!newTerm || newTerm.trim().length < 1) {
            throw new Error("Search term não pode ser vazio")
        }
        if (newTerm.length > 100) {
            throw new Error("Search term não pode ter mais de 100 caracteres")
        }
        this._searchTerm = newTerm.trim()
        this._updatedAt = new Date()
    }

    public updateSearchType(newType: "all" | "related" | "unknown" | "verified" | "nearby"): void {
        this._searchType = newType
        this._updatedAt = new Date()
    }

    public updateFilters(newFilters: Partial<typeof this._filters>): void {
        this._filters = {
            ...this._filters,
            ...newFilters,
        }
        this._updatedAt = new Date()
    }

    public updatePagination(newPagination: Partial<typeof this._pagination>): void {
        if (
            newPagination.limit !== undefined &&
            (newPagination.limit < 1 || newPagination.limit > 100)
        ) {
            throw new Error("Limit deve estar entre 1 e 100")
        }
        if (newPagination.offset !== undefined && newPagination.offset < 0) {
            throw new Error("Offset não pode ser negativo")
        }
        this._pagination = {
            ...this._pagination,
            ...newPagination,
        }
        this._updatedAt = new Date()
    }

    public updateSorting(newSorting: Partial<typeof this._sorting>): void {
        this._sorting = {
            ...this._sorting,
            ...newSorting,
        }
        this._updatedAt = new Date()
    }

    public updateSearchMetadata(newMetadata: Partial<typeof this._searchMetadata>): void {
        this._searchMetadata = {
            ...this._searchMetadata,
            ...newMetadata,
        }
        this._updatedAt = new Date()
    }

    public isValid(): boolean {
        return (
            this._searchTerm.length >= 1 &&
            this._searchTerm.length <= 100 &&
            this._pagination.limit >= 1 &&
            this._pagination.limit <= 100 &&
            this._pagination.offset >= 0
        )
    }

    public isSecuritySafe(): boolean {
        // Verificações básicas de segurança
        const suspiciousPatterns = [
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
        ]

        const lowerTerm = this._searchTerm.toLowerCase()
        return !suspiciousPatterns.some((pattern) => lowerTerm.includes(pattern))
    }

    public getSearchComplexity(): "simple" | "medium" | "complex" {
        const termLength = this._searchTerm.length
        const hasFilters = Object.keys(this._filters).length > 0
        const isNearbySearch = this._searchType === "nearby"

        if (termLength <= 3 && !hasFilters && !isNearbySearch) {
            return "simple"
        }
        if (termLength <= 10 && hasFilters && !isNearbySearch) {
            return "medium"
        }
        return "complex"
    }

    public getEstimatedResultCount(): "low" | "medium" | "high" {
        const termLength = this._searchTerm.length
        const hasStrictFilters =
            this._filters.includeVerified || this._filters.minFollowers || this._filters.maxDistance

        if (termLength <= 2 || hasStrictFilters) {
            return "low"
        }
        if (termLength <= 5) {
            return "medium"
        }
        return "high"
    }

    public requiresLocationData(): boolean {
        return this._searchType === "nearby" || this._filters.maxDistance !== undefined
    }

    public requiresSocialData(): boolean {
        return (
            this._searchType === "related" ||
            this._filters.minFollowers !== undefined ||
            this._filters.maxFollowers !== undefined
        )
    }

    public getCacheKey(): string {
        const filtersKey = Object.keys(this._filters)
            .sort()
            .map((key) => `${key}:${this._filters[key as keyof typeof this._filters]}`)
            .join("|")

        return `search:${this._searcherUserId}:${this._searchTerm}:${this._searchType}:${filtersKey}:${this._pagination.limit}:${this._pagination.offset}`
    }

    public getSearchContext(): string {
        return this._searchMetadata.searchContext || "discovery"
    }

    public isAdminSearch(): boolean {
        return this._searchMetadata.searchContext === "admin"
    }

    public isMentionSearch(): boolean {
        return this._searchMetadata.searchContext === "mention"
    }

    // Métodos de validação
    private validate(): void {
        if (!this._searchTerm || this._searchTerm.trim().length < 1) {
            throw new Error("Search term é obrigatório")
        }

        if (this._searchTerm.length > 100) {
            throw new Error("Search term não pode ter mais de 100 caracteres")
        }

        if (!this._searcherUserId || this._searcherUserId.trim().length === 0) {
            throw new Error("Searcher user ID é obrigatório")
        }

        if (this._pagination.limit < 1 || this._pagination.limit > 100) {
            throw new Error("Limit deve estar entre 1 e 100")
        }

        if (this._pagination.offset < 0) {
            throw new Error("Offset não pode ser negativo")
        }

        // Validações de filtros
        if (this._filters.minFollowers !== undefined && this._filters.minFollowers < 0) {
            throw new Error("Min followers não pode ser negativo")
        }

        if (this._filters.maxFollowers !== undefined && this._filters.maxFollowers < 0) {
            throw new Error("Max followers não pode ser negativo")
        }

        if (
            this._filters.minFollowers !== undefined &&
            this._filters.maxFollowers !== undefined &&
            this._filters.minFollowers > this._filters.maxFollowers
        ) {
            throw new Error("Min followers não pode ser maior que max followers")
        }

        if (
            this._filters.minEngagementRate !== undefined &&
            (this._filters.minEngagementRate < 0 || this._filters.minEngagementRate > 1)
        ) {
            throw new Error("Min engagement rate deve estar entre 0 e 1")
        }

        if (
            this._filters.maxEngagementRate !== undefined &&
            (this._filters.maxEngagementRate < 0 || this._filters.maxEngagementRate > 1)
        ) {
            throw new Error("Max engagement rate deve estar entre 0 e 1")
        }

        if (this._filters.maxDistance !== undefined && this._filters.maxDistance < 0) {
            throw new Error("Max distance não pode ser negativo")
        }
    }

    // Método para serialização
    public toJSON(): UserSearchQueryProps {
        return {
            id: this._id,
            searchTerm: this._searchTerm,
            searcherUserId: this._searcherUserId,
            searchType: this._searchType,
            filters: this._filters,
            pagination: this._pagination,
            sorting: this._sorting,
            searchMetadata: this._searchMetadata,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        }
    }

    // Factory method
    public static create(
        props: Omit<UserSearchQueryProps, "id" | "createdAt" | "updatedAt">,
    ): UserSearchQuery {
        return new UserSearchQuery(props)
    }

    // Builder pattern para facilitar criação
    public static builder() {
        return new UserSearchQueryBuilder()
    }
}

class UserSearchQueryBuilder {
    private props: Partial<UserSearchQueryProps> = {
        filters: {},
        pagination: { limit: 20, offset: 0 },
        sorting: { field: "relevance", direction: "desc" },
        searchMetadata: {},
    }

    public searchTerm(term: string): UserSearchQueryBuilder {
        this.props.searchTerm = term
        return this
    }

    public searcherUserId(userId: string): UserSearchQueryBuilder {
        this.props.searcherUserId = userId
        return this
    }

    public searchType(
        type: "all" | "related" | "unknown" | "verified" | "nearby",
    ): UserSearchQueryBuilder {
        this.props.searchType = type
        return this
    }

    public includeVerified(include: boolean = true): UserSearchQueryBuilder {
        this.props.filters!.includeVerified = include
        return this
    }

    public includeUnverified(include: boolean = true): UserSearchQueryBuilder {
        this.props.filters!.includeUnverified = include
        return this
    }

    public includeBlocked(include: boolean = false): UserSearchQueryBuilder {
        this.props.filters!.includeBlocked = include
        return this
    }

    public includeMuted(include: boolean = false): UserSearchQueryBuilder {
        this.props.filters!.includeMuted = include
        return this
    }

    public followersRange(min?: number, max?: number): UserSearchQueryBuilder {
        if (min !== undefined) this.props.filters!.minFollowers = min
        if (max !== undefined) this.props.filters!.maxFollowers = max
        return this
    }

    public engagementRateRange(min?: number, max?: number): UserSearchQueryBuilder {
        if (min !== undefined) this.props.filters!.minEngagementRate = min
        if (max !== undefined) this.props.filters!.maxEngagementRate = max
        return this
    }

    public maxDistance(distance: number): UserSearchQueryBuilder {
        this.props.filters!.maxDistance = distance
        return this
    }

    public preferredHashtags(hashtags: string[]): UserSearchQueryBuilder {
        this.props.filters!.preferredHashtags = hashtags
        return this
    }

    public excludeUsers(userIds: string[]): UserSearchQueryBuilder {
        this.props.filters!.excludeUserIds = userIds
        return this
    }

    public pagination(limit: number, offset: number = 0): UserSearchQueryBuilder {
        this.props.pagination!.limit = limit
        this.props.pagination!.offset = offset
        return this
    }

    public sortBy(
        field: "relevance" | "followers" | "engagement" | "distance" | "created_at",
        direction: "asc" | "desc" = "desc",
    ): UserSearchQueryBuilder {
        this.props.sorting!.field = field
        this.props.sorting!.direction = direction
        return this
    }

    public searchContext(
        context: "discovery" | "follow_suggestions" | "mention" | "admin",
    ): UserSearchQueryBuilder {
        this.props.searchMetadata!.searchContext = context
        return this
    }

    public userAgent(userAgent: string): UserSearchQueryBuilder {
        this.props.searchMetadata!.userAgent = userAgent
        return this
    }

    public ipAddress(ip: string): UserSearchQueryBuilder {
        this.props.searchMetadata!.ipAddress = ip
        return this
    }

    public sessionId(sessionId: string): UserSearchQueryBuilder {
        this.props.searchMetadata!.sessionId = sessionId
        return this
    }

    public build(): UserSearchQuery {
        if (!this.props.searchTerm || !this.props.searcherUserId) {
            throw new Error("Search term e searcher user ID são obrigatórios")
        }
        return new UserSearchQuery(this.props as UserSearchQueryProps)
    }
}
