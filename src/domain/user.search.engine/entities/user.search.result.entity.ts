import { generateId } from "@/shared"

/**
 * User Search Result Domain Entity
 *
 * Representa o resultado de uma busca de usuário com todas as informações
 * relevantes para exibição e ranking.
 */
export interface UserSearchResultProps {
    id?: string
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
    relationshipStatus?: {
        youFollow: boolean
        followsYou: boolean
        isBlocked: boolean
        isMuted: boolean
    }
    searchScore: number
    searchMetadata: {
        searchTerm: string
        searchType: "related" | "unknown" | "mixed"
        searchTimestamp: Date
        rankingFactors: string[]
    }
    createdAt?: Date
    updatedAt?: Date
}

export class UserSearchResult {
    private readonly _id: string
    private readonly _userId: string
    private _username: string
    private _name: string | null
    private _description: string | null
    private _isVerified: boolean
    private _isActive: boolean
    private _reputationScore: number
    private _engagementRate: number
    private _followersCount: number
    private _followingCount: number
    private _contentCount: number
    private _profilePictureUrl: string | null
    private _distance: number | null
    private _relationshipStatus: {
        youFollow: boolean
        followsYou: boolean
        isBlocked: boolean
        isMuted: boolean
    }
    private _searchScore: number
    private _searchMetadata: {
        searchTerm: string
        searchType: "related" | "unknown" | "mixed"
        searchTimestamp: Date
        rankingFactors: string[]
    }
    private readonly _createdAt: Date
    private _updatedAt: Date

    constructor(props: UserSearchResultProps) {
        this._id = props.id || generateId()
        this._userId = props.userId
        this._username = props.username
        this._name = props.name || null
        this._description = props.description || null
        this._isVerified = props.isVerified
        this._isActive = props.isActive
        this._reputationScore = props.reputationScore
        this._engagementRate = props.engagementRate
        this._followersCount = props.followersCount
        this._followingCount = props.followingCount
        this._contentCount = props.contentCount
        this._profilePictureUrl = props.profilePictureUrl || null
        this._distance = props.distance || null
        this._relationshipStatus = props.relationshipStatus || {
            youFollow: false,
            followsYou: false,
            isBlocked: false,
            isMuted: false,
        }
        this._searchScore = props.searchScore
        this._searchMetadata = props.searchMetadata
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()

        this.validate()
    }

    // Getters
    get id(): string {
        return this._id
    }

    get userId(): string {
        return this._userId
    }

    get username(): string {
        return this._username
    }

    get name(): string | null {
        return this._name
    }

    get description(): string | null {
        return this._description
    }

    get isVerified(): boolean {
        return this._isVerified
    }

    get isActive(): boolean {
        return this._isActive
    }

    get reputationScore(): number {
        return this._reputationScore
    }

    get engagementRate(): number {
        return this._engagementRate
    }

    get followersCount(): number {
        return this._followersCount
    }

    get followingCount(): number {
        return this._followingCount
    }

    get contentCount(): number {
        return this._contentCount
    }

    get profilePictureUrl(): string | null {
        return this._profilePictureUrl
    }

    get distance(): number | null {
        return this._distance
    }

    get relationshipStatus() {
        return { ...this._relationshipStatus }
    }

    get searchScore(): number {
        return this._searchScore
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
    public updateSearchScore(newScore: number): void {
        if (newScore < 0 || newScore > 100) {
            throw new Error("Search score deve estar entre 0 e 100")
        }
        this._searchScore = newScore
        this._updatedAt = new Date()
    }

    public addRankingFactor(factor: string): void {
        if (!this._searchMetadata.rankingFactors.includes(factor)) {
            this._searchMetadata.rankingFactors.push(factor)
            this._updatedAt = new Date()
        }
    }

    public updateRelationshipStatus(
        status: Partial<{
            youFollow: boolean
            followsYou: boolean
            isBlocked: boolean
            isMuted: boolean
        }>,
    ): void {
        this._relationshipStatus = {
            ...this._relationshipStatus,
            ...status,
        }
        this._updatedAt = new Date()
    }

    public updateDistance(distance: number | null): void {
        this._distance = distance
        this._updatedAt = new Date()
    }

    public isRelevant(): boolean {
        return (
            this._isActive &&
            !this._relationshipStatus.isBlocked &&
            !this._relationshipStatus.isMuted &&
            this._searchScore > 0
        )
    }

    public isHighQuality(): boolean {
        return (
            this._isVerified &&
            this._reputationScore > 50 &&
            this._engagementRate > 0.05 &&
            this._followersCount > 100
        )
    }

    public getDisplayName(): string {
        return this._name || this._username
    }

    public getEngagementLevel(): "low" | "medium" | "high" {
        if (this._engagementRate > 0.1) return "high"
        if (this._engagementRate > 0.05) return "medium"
        return "low"
    }

    public getInfluenceLevel(): "low" | "medium" | "high" {
        if (this._followersCount > 10000) return "high"
        if (this._followersCount > 1000) return "medium"
        return "low"
    }

    public getProximityLevel(): "close" | "medium" | "far" | "unknown" {
        if (this._distance === null) return "unknown"
        if (this._distance < 5) return "close"
        if (this._distance < 50) return "medium"
        return "far"
    }

    // Métodos de validação
    private validate(): void {
        if (!this._userId || this._userId.trim().length === 0) {
            throw new Error("User ID é obrigatório")
        }

        if (!this._username || this._username.trim().length < 3) {
            throw new Error("Username deve ter pelo menos 3 caracteres")
        }

        if (this._reputationScore < 0 || this._reputationScore > 100) {
            throw new Error("Reputation score deve estar entre 0 e 100")
        }

        if (this._engagementRate < 0 || this._engagementRate > 1) {
            throw new Error("Engagement rate deve estar entre 0 e 1")
        }

        if (this._followersCount < 0) {
            throw new Error("Followers count não pode ser negativo")
        }

        if (this._followingCount < 0) {
            throw new Error("Following count não pode ser negativo")
        }

        if (this._contentCount < 0) {
            throw new Error("Content count não pode ser negativo")
        }

        if (this._distance !== null && this._distance < 0) {
            throw new Error("Distance não pode ser negativo")
        }
    }

    // Método para serialização
    public toJSON(): UserSearchResultProps {
        return {
            id: this._id,
            userId: this._userId,
            username: this._username,
            name: this._name,
            description: this._description,
            isVerified: this._isVerified,
            isActive: this._isActive,
            reputationScore: this._reputationScore,
            engagementRate: this._engagementRate,
            followersCount: this._followersCount,
            followingCount: this._followingCount,
            contentCount: this._contentCount,
            profilePictureUrl: this._profilePictureUrl,
            distance: this._distance,
            relationshipStatus: this._relationshipStatus,
            searchScore: this._searchScore,
            searchMetadata: this._searchMetadata,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        }
    }

    // Factory method
    public static create(
        props: Omit<UserSearchResultProps, "id" | "createdAt" | "updatedAt">,
    ): UserSearchResult {
        return new UserSearchResult(props)
    }
}
