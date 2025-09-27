import { Encrypt, generateId } from "@/shared"
import {
    UserEmbedding,
    UserInterctionsSummary,
    UserMetrics,
    UserPreferences,
    UserProfilePicture,
    UserProps,
    UserStatus,
    UserTerms,
} from "./user.type"

import { Level } from "@/domain/authorization"

export class User {
    private readonly _id: string
    private _username: string
    private _name: string | null
    private _searchMatchTerm: string
    private _password: string
    private _oldPassword: string | null
    private _description: string | null
    private _lastPasswordUpdatedAt: Date | null
    private _profilePicture: UserProfilePicture | null
    private _status: UserStatus | null
    private _metrics: UserMetrics | null
    private _preferences: UserPreferences | null
    private _terms: UserTerms | null
    private _embedding: UserEmbedding | null
    private _interctionsSummary: UserInterctionsSummary | null
    private readonly _createdAt: Date
    private _updatedAt: Date

    constructor(props: UserProps) {
        this._id = props.id || generateId()
        this._username = props.username
        this._name = props.name || null
        this._searchMatchTerm = props.searchMatchTerm
        this._password = props.password
        this._oldPassword = props.oldPassword || null
        this._description = props.description || null
        this._lastPasswordUpdatedAt = props.lastPasswordUpdatedAt || null
        this._profilePicture = props.profilePicture || null
        this._status = props.status || null
        this._metrics = props.metrics || null
        this._preferences = props.preferences || null
        this._terms = props.terms || null
        this._embedding = props.embedding || null
        this._interctionsSummary = props.interctionsSummary || null
        this._createdAt = props.createdAt || new Date()
        this._updatedAt = props.updatedAt || new Date()

        this.validate()
    }

    // Getters
    get id(): string {
        return this._id
    }

    get username(): string {
        return this._username
    }

    get name(): string | null {
        return this._name
    }

    get searchMatchTerm(): string {
        return this._searchMatchTerm
    }

    get password(): string {
        return this._password
    }

    get oldPassword(): string | null {
        return this._oldPassword
    }

    get description(): string | null {
        return this._description
    }

    get lastPasswordUpdatedAt(): Date | null {
        return this._lastPasswordUpdatedAt
    }

    get profilePicture(): UserProfilePicture | null {
        return this._profilePicture
    }

    get status(): UserStatus | null {
        return this._status
    }

    get metrics(): UserMetrics | null {
        return this._metrics
    }

    get preferences(): UserPreferences | null {
        return this._preferences
    }

    get terms(): UserTerms | null {
        return this._terms
    }

    get embedding(): UserEmbedding | null {
        return this._embedding
    }

    get interctionsSummary(): UserInterctionsSummary | null {
        return this._interctionsSummary
    }

    get createdAt(): Date {
        return this._createdAt
    }

    get updatedAt(): Date {
        return this._updatedAt
    }

    // Métodos de domínio
    public updateUsername(username: string): void {
        if (!username || username.trim().length < 3) {
            throw new Error("Username deve ter pelo menos 3 caracteres")
        }
        this._username = username.trim()
        this._updatedAt = new Date()
    }

    public updateName(name: string): void {
        if (!name || name.trim().length < 2) {
            throw new Error("Nome deve ter pelo menos 2 caracteres")
        }
        this._name = name.trim()
        this._updatedAt = new Date()
    }

    public updateSearchMatchTerm(searchTerm: string): void {
        if (!searchTerm || searchTerm.trim().length < 2) {
            throw new Error("Termo de busca deve ter pelo menos 2 caracteres")
        }
        this._searchMatchTerm = searchTerm.trim()
        this._updatedAt = new Date()
    }

    public updatePassword(password: string): void {
        if (!this.isValidPassword(password)) {
            throw new Error("Senha deve ter pelo menos 8 caracteres")
        }
        this._oldPassword = this._password
        this._password = password
        this._lastPasswordUpdatedAt = new Date()
        this._updatedAt = new Date()
    }

    public updateDescription(description: string): void {
        if (description && description.length > 300) {
            throw new Error("Descrição deve ter no máximo 300 caracteres")
        }
        this._description = description || null
        this._updatedAt = new Date()
    }

    public async validatePassword(inputPassword: string): Promise<boolean> {
        const encrypt = new Encrypt(inputPassword)
        return await encrypt.compare({
            value: inputPassword,
            encryptedValue: this._password,
        })
    }

    public updateProfilePicture(profilePicture: UserProfilePicture): void {
        this._profilePicture = profilePicture
        this._updatedAt = new Date()
    }

    public updateStatus(status: UserStatus): void {
        this._status = status
        this._updatedAt = new Date()
    }

    public updateMetrics(metrics: UserMetrics): void {
        this._metrics = metrics
        this._updatedAt = new Date()
    }

    public updatePreferences(preferences: UserPreferences): void {
        this._preferences = preferences
        this._updatedAt = new Date()
    }

    public updateTerms(terms: UserTerms): void {
        this._terms = terms
        this._updatedAt = new Date()
    }

    public updateEmbedding(embedding: UserEmbedding): void {
        this._embedding = embedding
        this._updatedAt = new Date()
    }

    public updateInterctionsSummary(summary: UserInterctionsSummary): void {
        this._interctionsSummary = summary
        this._updatedAt = new Date()
    }

    public isActive(): boolean {
        return (
            this._status?.accessLevel === Level.USER &&
            !this._status?.blocked &&
            !this._status?.deleted
        )
    }

    public isVerified(): boolean {
        return this._status?.verified || false
    }

    public isBlocked(): boolean {
        return this._status?.blocked || false
    }

    public isDeleted(): boolean {
        return this._status?.deleted || false
    }

    public isMuted(): boolean {
        return this._status?.muted || false
    }

    public canAccessAdminFeatures(): boolean {
        return this._status?.accessLevel === Level.ADMIN || this._status?.accessLevel === Level.SUDO
    }

    // Métodos privados de validação
    private validate(): void {
        if (!this._username || this._username.trim().length < 3) {
            throw new Error("Username deve ter pelo menos 3 caracteres")
        }

        if (!this._searchMatchTerm || this._searchMatchTerm.trim().length < 2) {
            throw new Error("Termo de busca deve ter pelo menos 2 caracteres")
        }

        if (!this.isValidPassword(this._password)) {
            throw new Error("Senha deve ter pelo menos 8 caracteres")
        }

        if (this._description && this._description.length > 300) {
            throw new Error("Descrição deve ter no máximo 300 caracteres")
        }
    }

    private isValidPassword(password: string): boolean {
        return Boolean(password && password.length >= 8)
    }

    // Factory method para criar usuário
    public static async create(
        props: Omit<UserProps, "id" | "createdAt" | "updatedAt">,
    ): Promise<User> {
        // Encriptar a senha automaticamente
        const encrypt = new Encrypt(props.password)
        const hashedPassword = await encrypt.hashStr()

        return new User({
            ...props,
            password: hashedPassword,
        })
    }

    // Método para serialização
    public toJSON(): UserProps {
        return {
            id: this._id,
            username: this._username,
            name: this._name,
            searchMatchTerm: this._searchMatchTerm,
            password: this._password,
            oldPassword: this._oldPassword,
            description: this._description,
            lastPasswordUpdatedAt: this._lastPasswordUpdatedAt,
            profilePicture: this._profilePicture || undefined,
            status: this._status || undefined,
            metrics: this._metrics || undefined,
            preferences: this._preferences || undefined,
            terms: this._terms || undefined,
            embedding: this._embedding || undefined,
            interctionsSummary: this._interctionsSummary || undefined,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        }
    }
}
