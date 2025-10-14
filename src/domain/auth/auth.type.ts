export enum AuthLogType {
    SIGNIN = "signin",
    SIGNUP = "signup",
    SIGNOUT = "signout",
}

export enum AuthLogStatus {
    SUCCESS = "success",
    FAILED = "failed",
    BLOCKED = "blocked",
}

export interface AuthLogContext {
    ip?: string
    userAgent?: string
    timestamp?: Date
}

export interface AuthSecurityRules {
    // Configurações de risco
    riskThresholds: {
        maxLowRiskWeight: number
        maxMediumRiskWeight: number
        maxHighRiskWeight: number
        criticalRiskThreshold: number
    }

    // Configurações de bloqueio por IP
    ipBlocking: {
        maxFailedAttempts: number
        blockDurationMinutes: number
        suspiciousIPs: string[]
        allowedIPs: string[]
    }

    // Configurações de localização
    locationBlocking: {
        blockedCountries: string[]
        blockedRegions: string[]
        highRiskCountries: string[]
        allowedCountries: string[]
    }

    // Configurações de user agent
    userAgentBlocking: {
        blockedPatterns: string[]
        suspiciousPatterns: string[]
        botPatterns: string[]
        allowedPatterns: string[]
    }

    // Configurações de username
    usernameValidation: {
        blockedUsernames: string[]
        suspiciousPatterns: string[]
        minLength: number
        maxLength: number
        allowedCharacters: string
    }

    // Configurações de rate limiting
    rateLimiting: {
        maxAttemptsPerMinute: number
        maxAttemptsPerHour: number
        maxAttemptsPerDay: number
        cooldownMinutes: number
    }

    // Configurações de termos
    termsValidation: {
        requireTermsAcceptance: boolean
        minTermsVersion: string
        blockedTermsVersions: string[]
    }
}

export enum SignType {
    SIGNIN = "signin",
    SIGNUP = "signup",
}

export enum SignStatus {
    APPROVED = "approved",
    SUSPICIOUS = "suspicious",
    REJECTED = "rejected",
}

export enum SecurityRisk {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
}

export interface SecurityCheckResult {
    risk: SecurityRisk
    reason: string
    weight: number
    blocked: boolean
    metadata?: any
}

export interface AuthDecision {
    allowed: boolean
    status: SignStatus
    securityRisk: SecurityRisk
    reason?: string
    additionalChecks?: string[]
    blockDuration?: number
    requiresVerification?: boolean
}
