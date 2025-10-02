import { SecurityRisk, SignStatus } from "@/infra/models/auth/sign.logs.model"

/**
 * Auth Rules - Regras de Autenticação e Segurança
 *
 * Define as regras para bloqueio de requisições baseadas em security risk
 * e outros critérios de segurança para signin/signup
 */

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

/**
 * Classe principal para aplicar regras de autenticação
 */
export class AuthRules {
    private rules: AuthSecurityRules

    constructor(rules?: Partial<AuthSecurityRules>) {
        this.rules = {
            riskThresholds: {
                maxLowRiskWeight: 5,
                maxMediumRiskWeight: 15,
                maxHighRiskWeight: 30,
                criticalRiskThreshold: 50,
                ...rules?.riskThresholds,
            },

            ipBlocking: {
                maxFailedAttempts: 5,
                blockDurationMinutes: 15,
                suspiciousIPs: [],
                allowedIPs: [],
                ...rules?.ipBlocking,
            },

            locationBlocking: {
                blockedCountries: ["CN", "IR", "KP", "RU"],
                blockedRegions: [],
                highRiskCountries: ["CN", "IR", "KP", "RU", "SY", "VE"],
                allowedCountries: [],
                ...rules?.locationBlocking,
            },

            userAgentBlocking: {
                blockedPatterns: ["curl", "wget", "python-requests", "bot", "crawler"],
                suspiciousPatterns: ["automated", "script", "test"],
                botPatterns: ["bot", "crawler", "spider", "scraper"],
                allowedPatterns: [],
                ...rules?.userAgentBlocking,
            },

            usernameValidation: {
                blockedUsernames: ["admin", "root", "administrator", "system", "test"],
                suspiciousPatterns: ["admin", "root", "test", "temp"],
                minLength: 3,
                maxLength: 50,
                allowedCharacters:
                    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@._-",
                ...rules?.usernameValidation,
            },

            rateLimiting: {
                maxAttemptsPerMinute: 10,
                maxAttemptsPerHour: 50,
                maxAttemptsPerDay: 200,
                cooldownMinutes: 5,
                ...rules?.rateLimiting,
            },

            termsValidation: {
                requireTermsAcceptance: true,
                minTermsVersion: "1.0",
                blockedTermsVersions: [],
                ...rules?.termsValidation,
            },
        }
    }

    /**
     * Avalia uma requisição de autenticação e retorna decisão de segurança
     */
    public evaluateRequest(request: {
        username: string
        ipAddress: string
        userAgent?: string
        latitude?: number
        longitude?: number
        country?: string
        termsAccepted?: boolean
        termsVersion?: string
        failedAttempts?: number
        lastAttempt?: Date
    }): AuthDecision {
        const checks: SecurityCheckResult[] = []

        // 1. Verificar IP
        checks.push(this.checkIP(request.ipAddress, request.failedAttempts))

        // 2. Verificar localização
        if (request.latitude && request.longitude) {
            checks.push(this.checkLocation(request.latitude, request.longitude, request.country))
        }

        // 3. Verificar User Agent
        if (request.userAgent) {
            checks.push(this.checkUserAgent(request.userAgent))
        }

        // 4. Verificar username
        checks.push(this.checkUsername(request.username))

        // 5. Verificar termos
        if (request.termsAccepted !== undefined) {
            checks.push(this.checkTerms(request.termsAccepted, request.termsVersion))
        }

        // 6. Verificar rate limiting
        if (request.lastAttempt) {
            checks.push(this.checkRateLimit(request.lastAttempt, request.failedAttempts))
        }

        return this.calculateDecision(checks)
    }

    /**
     * Verifica IP da requisição
     */
    private checkIP(ipAddress: string, failedAttempts: number = 0): SecurityCheckResult {
        // IP bloqueado permanentemente
        if (this.rules.ipBlocking.suspiciousIPs.includes(ipAddress)) {
            return {
                risk: SecurityRisk.CRITICAL,
                reason: "IP bloqueado permanentemente",
                weight: 100,
                blocked: true,
            }
        }

        // IP permitido
        if (this.rules.ipBlocking.allowedIPs.includes(ipAddress)) {
            return {
                risk: SecurityRisk.LOW,
                reason: "IP permitido",
                weight: 0,
                blocked: false,
            }
        }

        // Muitas tentativas falhadas
        if (failedAttempts >= this.rules.ipBlocking.maxFailedAttempts) {
            return {
                risk: SecurityRisk.CRITICAL,
                reason: `Muitas tentativas falhadas (${failedAttempts})`,
                weight: 50,
                blocked: true,
                metadata: { blockDuration: this.rules.ipBlocking.blockDurationMinutes },
            }
        }

        return {
            risk: SecurityRisk.LOW,
            reason: "IP válido",
            weight: 1,
            blocked: false,
        }
    }

    /**
     * Verifica localização da requisição
     */
    private checkLocation(
        latitude: number,
        longitude: number,
        country?: string,
    ): SecurityCheckResult {
        if (country) {
            // País completamente bloqueado
            if (this.rules.locationBlocking.blockedCountries.includes(country)) {
                return {
                    risk: SecurityRisk.CRITICAL,
                    reason: `País bloqueado: ${country}`,
                    weight: 100,
                    blocked: true,
                }
            }

            // País de alto risco
            if (this.rules.locationBlocking.highRiskCountries.includes(country)) {
                return {
                    risk: SecurityRisk.HIGH,
                    reason: `País de alto risco: ${country}`,
                    weight: 25,
                    blocked: false,
                }
            }
        }

        return {
            risk: SecurityRisk.LOW,
            reason: "Localização válida",
            weight: 1,
            blocked: false,
        }
    }

    /**
     * Verifica User Agent da requisição
     */
    private checkUserAgent(userAgent: string): SecurityCheckResult {
        const ua = userAgent.toLowerCase()

        // Padrões bloqueados
        for (const pattern of this.rules.userAgentBlocking.blockedPatterns) {
            if (ua.includes(pattern)) {
                return {
                    risk: SecurityRisk.CRITICAL,
                    reason: `User agent bloqueado: ${pattern}`,
                    weight: 50,
                    blocked: true,
                }
            }
        }

        // Padrões suspeitos
        for (const pattern of this.rules.userAgentBlocking.suspiciousPatterns) {
            if (ua.includes(pattern)) {
                return {
                    risk: SecurityRisk.MEDIUM,
                    reason: `User agent suspeito: ${pattern}`,
                    weight: 10,
                    blocked: false,
                }
            }
        }

        // Padrões de bot
        for (const pattern of this.rules.userAgentBlocking.botPatterns) {
            if (ua.includes(pattern)) {
                return {
                    risk: SecurityRisk.HIGH,
                    reason: `Possível bot: ${pattern}`,
                    weight: 20,
                    blocked: false,
                }
            }
        }

        return {
            risk: SecurityRisk.LOW,
            reason: "User agent válido",
            weight: 1,
            blocked: false,
        }
    }

    /**
     * Verifica username da requisição
     */
    private checkUsername(username: string): SecurityCheckResult {
        // Usernames bloqueados
        if (this.rules.usernameValidation.blockedUsernames.includes(username.toLowerCase())) {
            return {
                risk: SecurityRisk.CRITICAL,
                reason: "Username bloqueado",
                weight: 50,
                blocked: true,
            }
        }

        // Padrões suspeitos no username
        for (const pattern of this.rules.usernameValidation.suspiciousPatterns) {
            if (username.toLowerCase().includes(pattern)) {
                return {
                    risk: SecurityRisk.MEDIUM,
                    reason: `Username suspeito: contém '${pattern}'`,
                    weight: 15,
                    blocked: false,
                }
            }
        }

        // Validação de comprimento
        if (username.length < this.rules.usernameValidation.minLength) {
            return {
                risk: SecurityRisk.HIGH,
                reason: "Username muito curto",
                weight: 20,
                blocked: true,
            }
        }

        if (username.length > this.rules.usernameValidation.maxLength) {
            return {
                risk: SecurityRisk.HIGH,
                reason: "Username muito longo",
                weight: 20,
                blocked: true,
            }
        }

        return {
            risk: SecurityRisk.LOW,
            reason: "Username válido",
            weight: 1,
            blocked: false,
        }
    }

    /**
     * Verifica aceitação de termos
     */
    private checkTerms(termsAccepted: boolean, termsVersion?: string): SecurityCheckResult {
        if (!termsAccepted) {
            return {
                risk: SecurityRisk.CRITICAL,
                reason: "Termos não aceitos",
                weight: 100,
                blocked: true,
            }
        }

        if (
            termsVersion &&
            this.rules.termsValidation.blockedTermsVersions.includes(termsVersion)
        ) {
            return {
                risk: SecurityRisk.CRITICAL,
                reason: `Versão de termos bloqueada: ${termsVersion}`,
                weight: 100,
                blocked: true,
            }
        }

        return {
            risk: SecurityRisk.LOW,
            reason: "Termos aceitos",
            weight: 0,
            blocked: false,
        }
    }

    /**
     * Verifica rate limiting
     */
    private checkRateLimit(lastAttempt: Date, failedAttempts: number = 0): SecurityCheckResult {
        const now = new Date()
        const timeDiff = now.getTime() - lastAttempt.getTime()
        const minutesDiff = timeDiff / (1000 * 60)

        // Verificar cooldown
        if (minutesDiff < this.rules.rateLimiting.cooldownMinutes && failedAttempts > 0) {
            return {
                risk: SecurityRisk.HIGH,
                reason: "Em período de cooldown",
                weight: 30,
                blocked: true,
                metadata: {
                    remainingCooldown: this.rules.rateLimiting.cooldownMinutes - minutesDiff,
                },
            }
        }

        return {
            risk: SecurityRisk.LOW,
            reason: "Rate limit OK",
            weight: 1,
            blocked: false,
        }
    }

    /**
     * Calcula decisão final baseada nos checks
     */
    private calculateDecision(checks: SecurityCheckResult[]): AuthDecision {
        const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0)
        const blockedChecks = checks.filter((check) => check.blocked)
        const criticalChecks = checks.filter((check) => check.risk === SecurityRisk.CRITICAL)
        const highRiskChecks = checks.filter((check) => check.risk === SecurityRisk.HIGH)

        // Se há checks bloqueados, rejeitar
        if (blockedChecks.length > 0) {
            return {
                allowed: false,
                status: SignStatus.REJECTED,
                securityRisk: SecurityRisk.CRITICAL,
                reason: blockedChecks[0].reason,
                additionalChecks: blockedChecks.map((check) => check.reason),
            }
        }

        // Determinar nível de risco baseado no peso total
        let securityRisk: SecurityRisk
        let status: SignStatus

        if (totalWeight >= this.rules.riskThresholds.criticalRiskThreshold) {
            securityRisk = SecurityRisk.CRITICAL
            status = SignStatus.REJECTED
        } else if (totalWeight >= this.rules.riskThresholds.maxHighRiskWeight) {
            securityRisk = SecurityRisk.HIGH
            status = SignStatus.SUSPICIOUS
        } else if (totalWeight >= this.rules.riskThresholds.maxMediumRiskWeight) {
            securityRisk = SecurityRisk.MEDIUM
            status = SignStatus.APPROVED
        } else {
            securityRisk = SecurityRisk.LOW
            status = SignStatus.APPROVED
        }

        return {
            allowed: status !== SignStatus.REJECTED,
            status,
            securityRisk,
            reason: criticalChecks.length > 0 ? criticalChecks[0].reason : undefined,
            requiresVerification: highRiskChecks.length > 0,
            additionalChecks: checks
                .filter((check) => check.weight > 5)
                .map((check) => check.reason),
        }
    }

    /**
     * Atualiza regras de segurança
     */
    public updateRules(newRules: Partial<AuthSecurityRules>): void {
        this.rules = { ...this.rules, ...newRules }
    }

    /**
     * Obtém regras atuais
     */
    public getRules(): AuthSecurityRules {
        return { ...this.rules }
    }
}
