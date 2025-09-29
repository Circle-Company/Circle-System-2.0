/**
 * User Validation Rules
 *
 * Defines validation rules for user-related operations
 */

import { Level } from "../../authorization"

export interface UserValidationRules {
    // Regras de validação de dados básicos
    basic: {
        usernameMinLength: number
        usernameMaxLength: number
        nameMinLength: number
        nameMaxLength: number
        descriptionMaxLength: number
        searchMatchTermMinLength: number
        usernameAllowedCharacters: string
        nameAllowedCharacters: string
        descriptionAllowedCharacters: string
    }

    // Regras de validação de senha
    password: {
        minLength: number
        maxLength: number
        requireUpperCase: boolean
        requireLowerCase: boolean
        requireNumbers: boolean
        requireSpecialCharacters: boolean
        forbiddenPatterns: string[]
        passwordHistorySize: number
        maxAgeInDays: number
    }

    // Regras de validação de status
    status: {
        allowedAccessLevels: Level[]
        allowedStatusTransitions: Record<string, string[]>
        requireVerification: boolean
        requireEmailValidation: boolean
        requirePhoneValidation: boolean
        allowMultipleRoles: boolean
    }

    // Regras de validação de perfil
    profile: {
        requireProfilePicture: boolean
        allowCustomAvatars: boolean
        maxProfilePictureSize: number
        allowedProfilePictureFormats: string[]
        requireBio: boolean
        maxBioLength: number
        allowLinks: boolean
        maxLinksCount: number
    }

    // Regras de validação de métricas
    metrics: {
        minMetricsValue: number
        maxMetricsValue: number
        allowNegativeValues: boolean
        requireMetricsUpdate: boolean
        metricsUpdateInterval: number
        historicalDataRetentionDays: number
    }

    // Regras de validação de segurança
    security: {
        requireAuthentication: boolean
        requireTwoFactorAuth: boolean
        allowSessionSharing: boolean
        maxConcurrentSessions: number
        sessionTimeoutMinutes: number
        ipWhitelistEnabled: boolean
        geoRestrictionsEnabled: boolean
    }
}

export class UserValidator {
    constructor(private rules: UserValidationRules) {}

    validateUsername(username: string): { isValid: boolean; error?: string } {
        if (!username || username.length < this.rules.basic.usernameMinLength) {
            return {
                isValid: false,
                error: `Username must be at least ${this.rules.basic.usernameMinLength} characters long`,
            }
        }

        if (username.length > this.rules.basic.usernameMaxLength) {
            return {
                isValid: false,
                error: `Username must not exceed ${this.rules.basic.usernameMaxLength} characters`,
            }
        }

        const allowedCharsRegex = new RegExp(`^[${this.rules.basic.usernameAllowedCharacters}]+$`)
        if (!allowedCharsRegex.test(username)) {
            return {
                isValid: false,
                error: `Username contains invalid characters`,
            }
        }

        return { isValid: true }
    }

    validateName(name: string): { isValid: boolean; error?: string } {
        if (!name || name.length < this.rules.basic.nameMinLength) {
            return {
                isValid: false,
                error: `Name must be at least ${this.rules.basic.nameMinLength} characters long`,
            }
        }

        if (name.length > this.rules.basic.nameMaxLength) {
            return {
                isValid: false,
                error: `Name must not exceed ${this.rules.basic.nameMaxLength} characters`,
            }
        }

        const allowedCharsRegex = new RegExp(`^[${this.rules.basic.nameAllowedCharacters}]+$`)
        if (!allowedCharsRegex.test(name)) {
            return {
                isValid: false,
                error: `Name contains invalid characters`,
            }
        }

        return { isValid: true }
    }

    validatePassword(password: string): { isValid: boolean; error?: string } {
        if (!password || password.length < this.rules.password.minLength) {
            return {
                isValid: false,
                error: `Password must be at least ${this.rules.password.minLength} characters long`,
            }
        }

        if (password.length > this.rules.password.maxLength) {
            return {
                isValid: false,
                error: `Password must not exceed ${this.rules.password.maxLength} characters`,
            }
        }

        if (this.rules.password.requireUpperCase && !/[A-Z]/.test(password)) {
            return {
                isValid: false,
                error: `Password must contain at least one uppercase letter`,
            }
        }

        if (this.rules.password.requireLowerCase && !/[a-z]/.test(password)) {
            return {
                isValid: false,
                error: `Password must contain at least one lowercase letter`,
            }
        }

        if (this.rules.password.requireNumbers && !/[0-9]/.test(password)) {
            return {
                isValid: false,
                error: `Password must contain at least one number`,
            }
        }

        if (this.rules.password.requireSpecialCharacters && !/[^A-Za-z0-9]/.test(password)) {
            return {
                isValid: false,
                error: `Password must contain at least one special character`,
            }
        }

        for (const pattern of this.rules.password.forbiddenPatterns) {
            if (password.includes(pattern)) {
                return {
                    isValid: false,
                    error: `Password contains forbidden pattern: ${pattern}`,
                }
            }
        }

        return { isValid: true }
    }

    validateDescription(description: string): { isValid: boolean; error?: string } {
        if (description.length > this.rules.basic.descriptionMaxLength) {
            return {
                isValid: false,
                error: `Description must not exceed ${this.rules.basic.descriptionMaxLength} characters`,
            }
        }

        return { isValid: true }
    }

    validateAccessLevel(accessLevel: Level): { isValid: boolean; error?: string } {
        if (!this.rules.status.allowedAccessLevels.includes(accessLevel)) {
            return {
                isValid: false,
                error: `Invalid access level: ${accessLevel}`,
            }
        }

        return { isValid: true }
    }

    validateMetrics(metrics: any): { isValid: boolean; error?: string } {
        const metricsErrors: string[] = []

        Object.keys(metrics).forEach((key) => {
            const value = metrics[key]
            if (typeof value === "number") {
                if (!this.rules.metrics.allowNegativeValues && value < 0) {
                    metricsErrors.push(`Metric ${key} cannot be negative`)
                }
                if (value < this.rules.metrics.minMetricsValue) {
                    metricsErrors.push(
                        `Metric ${key} must be at least ${this.rules.metrics.minMetricsValue}`,
                    )
                }
                if (value > this.rules.metrics.maxMetricsValue) {
                    metricsErrors.push(
                        `Metric ${key} must not exceed ${this.rules.metrics.maxMetricsValue}`,
                    )
                }
            }
        })

        if (metricsErrors.length > 0) {
            return {
                isValid: false,
                error: metricsErrors.join(", "),
            }
        }

        return { isValid: true }
    }

    validateUser(data: {
        username?: string
        name?: string
        password?: string
        description?: string
        accessLevel?: Level
        metrics?: any
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (data.username) {
            const usernameValidation = this.validateUsername(data.username)
            if (!usernameValidation.isValid && usernameValidation.error) {
                errors.push(usernameValidation.error)
            }
        }

        if (data.name) {
            const nameValidation = this.validateName(data.name)
            if (!nameValidation.isValid && nameValidation.error) {
                errors.push(nameValidation.error)
            }
        }

        if (data.password) {
            const passwordValidation = this.validatePassword(data.password)
            if (!passwordValidation.isValid && passwordValidation.error) {
                errors.push(passwordValidation.error)
            }
        }

        if (data.description) {
            const descriptionValidation = this.validateDescription(data.description)
            if (!descriptionValidation.isValid && descriptionValidation.error) {
                errors.push(descriptionValidation.error)
            }
        }

        if (data.accessLevel) {
            const accessLevelValidation = this.validateAccessLevel(data.accessLevel)
            if (!accessLevelValidation.isValid && accessLevelValidation.error) {
                errors.push(accessLevelValidation.error)
            }
        }

        if (data.metrics) {
            const metricsValidation = this.validateMetrics(data.metrics)
            if (!metricsValidation.isValid && metricsValidation.error) {
                errors.push(metricsValidation.error)
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }
}

export class UserValidationRulesFactory {
    /**
     * Cria regras padrão
     */
    static createDefault(): UserValidationRules {
        return {
            basic: {
                usernameMinLength: 3,
                usernameMaxLength: 30,
                nameMinLength: 2,
                nameMaxLength: 100,
                descriptionMaxLength: 300,
                searchMatchTermMinLength: 2,
                usernameAllowedCharacters: "a-zA-Z0-9_",
                nameAllowedCharacters: "a-zA-ZàáâãäåæçèéêëìíîïðñòóôõöøùúûüýÞßČćđšž",
                descriptionAllowedCharacters:
                    "a-zA-Z0-9àáâãäåæçèéêëìíîïðñòóôõöøùúûüýÞßČćđšž .,!?()[]{}'\"-+=",
            },
            password: {
                minLength: 8,
                maxLength: 128,
                requireUpperCase: true,
                requireLowerCase: true,
                requireNumbers: true,
                requireSpecialCharacters: false,
                forbiddenPatterns: ["password", "123456", "qwerty"],
                passwordHistorySize: 5,
                maxAgeInDays: 90,
            },
            status: {
                allowedAccessLevels: [Level.USER, Level.ADMIN, Level.SUDO],
                allowedStatusTransitions: {},
                requireVerification: false,
                requireEmailValidation: false,
                requirePhoneValidation: false,
                allowMultipleRoles: false,
            },
            profile: {
                requireProfilePicture: false,
                allowCustomAvatars: true,
                maxProfilePictureSize: 5 * 1024 * 1024, // 5MB
                allowedProfilePictureFormats: ["jpg", "jpeg", "png", "gif"],
                requireBio: false,
                maxBioLength: 1000,
                allowLinks: true,
                maxLinksCount: 5,
            },
            metrics: {
                minMetricsValue: 0,
                maxMetricsValue: 1000000,
                allowNegativeValues: false,
                requireMetricsUpdate: true,
                metricsUpdateInterval: 24 * 60 * 60 * 1000, // 24 hours
                historicalDataRetentionDays: 365,
            },
            security: {
                requireAuthentication: true,
                requireTwoFactorAuth: false,
                allowSessionSharing: false,
                maxConcurrentSessions: 5,
                sessionTimeoutMinutes: 30,
                ipWhitelistEnabled: false,
                geoRestrictionsEnabled: false,
            },
        }
    }

    /**
     * Cria regras para administradores
     */
    static createForAdmin(): UserValidationRules {
        const defaultRules = this.createDefault()
        return {
            ...defaultRules,
            profile: {
                ...defaultRules.profile,
                maxProfilePictureSize: 10 * 1024 * 1024, // 10MB
                maxBioLength: 2000,
                maxLinksCount: 10,
            },
            metrics: {
                ...defaultRules.metrics,
                maxMetricsValue: 10000000, // Higher limit for admins
            },
            security: {
                ...defaultRules.security,
                requireTwoFactorAuth: true,
                maxConcurrentSessions: 10,
                sessionTimeoutMinutes: 120,
            },
        }
    }

    /**
     * Cria regras customizadas
     */
    static createCustom(overrides: Partial<UserValidationRules>): UserValidationRules {
        const defaultRules = this.createDefault()
        return {
            ...defaultRules,
            ...overrides,
            basic: { ...defaultRules.basic, ...overrides.basic },
            password: { ...defaultRules.password, ...overrides.password },
            status: { ...defaultRules.status, ...overrides.status },
            profile: { ...defaultRules.profile, ...overrides.profile },
            metrics: { ...defaultRules.metrics, ...overrides.metrics },
            security: { ...defaultRules.security, ...overrides.security },
        }
    }
}
