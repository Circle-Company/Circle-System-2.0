import { SecurityRisk, SignStatus } from "@/infra/models/auth/sign.logs.model"
import {
    checkBlockedLocation,
    checkHighRiskLocation,
    getHighRiskCountries,
    getSuspiciousIPs,
} from "./security.data"

import { SignRequest } from "@/modules/auth/types"
import { ErrorFactory } from "@/shared/errors"

export interface ProcessSignRequestResponse {
    success: boolean
    message: string
    securityRisk: SecurityRisk
    status: SignStatus
    reason?: string
    additionalData?: any
}

interface SecurityCheck {
    risk: SecurityRisk
    reason: string
    weight: number
}

export class ProcessSignRequest {
    private readonly suspiciousIPs: readonly string[]
    private signRequest: SignRequest | null = null
    private readonly highRiskCountries: readonly string[]

    constructor(config?: { suspiciousIPs?: string[]; highRiskCountries?: string[] }) {
        this.suspiciousIPs = config?.suspiciousIPs || getSuspiciousIPs()
        this.highRiskCountries = config?.highRiskCountries || getHighRiskCountries()
    }

    async setSignRequest(signRequest: SignRequest): Promise<void> {
        this.signRequest = signRequest
    }

    async process(): Promise<ProcessSignRequestResponse> {
        try {
            const securityChecks = await this.performSecurityChecks()
            const { securityRisk, status, reason } = this.calculateRiskAndStatus(securityChecks)

            return {
                success: status === SignStatus.APPROVED,
                message: this.getStatusMessage(status, reason),
                securityRisk,
                status,
                reason,
                additionalData: {
                    checks: securityChecks,
                    timestamp: new Date().toISOString(),
                },
            }
        } catch (error) {
            return {
                success: false,
                message: "Internal error processing request",
                securityRisk: SecurityRisk.CRITICAL,
                status: SignStatus.REJECTED,
                reason: "Internal system error",
            }
        }
    }

    private async performSecurityChecks(): Promise<SecurityCheck[]> {
        const checks: SecurityCheck[] = []
        if (!this.signRequest) {
            throw ErrorFactory.system("Sign request not set", "processSignRequest")
        }

        // Verificação de IP suspeito
        if (this.isSuspiciousIP(this.signRequest.ipAddress)) {
            checks.push({
                risk: SecurityRisk.HIGH,
                reason: "Suspicious IP detected",
                weight: 3,
            })
        }

        // Verificação de localização bloqueada (CRÍTICO - sempre rejeita)
        if (this.signRequest.latitude && this.signRequest.longitude) {
            const blockedLocation = checkBlockedLocation(
                this.signRequest.latitude,
                this.signRequest.longitude,
                50, // 50km de distância para bloqueio total
            )
            if (blockedLocation) {
                checks.push({
                    risk: SecurityRisk.CRITICAL,
                    reason: `Location completely blocked (${blockedLocation.location.city}, ${blockedLocation.location.country}) - ${blockedLocation.reason}`,
                    weight: 10, // Peso máximo para bloqueio total
                })
            }
        }

        // Verificação de localização suspeita (após verificação de bloqueio)
        if (this.signRequest.latitude && this.signRequest.longitude) {
            const locationRisk = this.checkLocationRisk(
                this.signRequest.latitude,
                this.signRequest.longitude,
            )
            if (locationRisk) {
                checks.push(locationRisk)
            }
        }

        // Verificação de termos aceitos
        if (!this.signRequest.termsAccepted) {
            checks.push({
                risk: SecurityRisk.MEDIUM,
                reason: "Terms of use not accepted",
                weight: 2,
            })
        }

        // Verificação de padrões suspeitos no username
        if (this.hasSuspiciousUsernamePattern(this.signRequest.username)) {
            checks.push({
                risk: SecurityRisk.MEDIUM,
                reason: "Suspicious pattern in username",
                weight: 2,
            })
        }

        // Verificação de user agent suspeito
        if (this.signRequest.userAgent && this.isSuspiciousUserAgent(this.signRequest.userAgent)) {
            checks.push({
                risk: SecurityRisk.HIGH,
                reason: "Suspicious user agent detected",
                weight: 3,
            })
        }

        return checks
    }

    private isSuspiciousIP(ip: string): boolean {
        // Em desenvolvimento, permitir IPs privados
        const isDevelopment = process.env.NODE_ENV !== "production"

        return (
            this.suspiciousIPs.includes(ip) ||
            (!isDevelopment && this.isPrivateIP(ip)) ||
            this.isKnownMaliciousIP(ip)
        )
    }

    private isPrivateIP(ip: string): boolean {
        const privateRanges = [
            /^10\./, // 10.0.0.0/8
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
            /^192\.168\./, // 192.168.0.0/16
            /^127\./, // 127.0.0.0/8 (localhost)
        ]

        return privateRanges.some((range) => range.test(ip))
    }

    private isKnownMaliciousIP(ip: string): boolean {
        // Em um sistema real, isso consultaria uma base de dados de IPs maliciosos
        const maliciousIPs = ["1.2.3.4", "5.6.7.8"] // IPs de exemplo
        return maliciousIPs.includes(ip)
    }

    private checkLocationRisk(latitude: number, longitude: number): SecurityCheck | null {
        // Verifica se a localização está próxima a áreas de alto risco
        const highRiskLocation = checkHighRiskLocation(latitude, longitude, 100)

        if (highRiskLocation) {
            // Determina o nível de risco baseado na localização
            let riskLevel: SecurityRisk
            let weight: number

            switch (highRiskLocation.risk) {
                case "CRITICAL":
                    riskLevel = SecurityRisk.CRITICAL
                    weight = 4
                    break
                case "HIGH":
                    riskLevel = SecurityRisk.HIGH
                    weight = 3
                    break
                case "MEDIUM":
                    riskLevel = SecurityRisk.MEDIUM
                    weight = 2
                    break
                default:
                    riskLevel = SecurityRisk.MEDIUM
                    weight = 2
            }

            return {
                risk: riskLevel,
                reason: `Suspicious location detected (${highRiskLocation.location.city}, ${
                    highRiskLocation.location.country
                }) - ${highRiskLocation.distance.toFixed(1)}km distance`,
                weight,
            }
        }

        return null
    }

    private hasSuspiciousUsernamePattern(username: string): boolean {
        const suspiciousPatterns = [
            /^admin$/i, // Exatamente "admin"
            /^root$/i, // Exatamente "root"
            /^test$/i, // Exatamente "test"
            /^guest$/i, // Exatamente "guest"
            /\d{4,}/, // 4 ou mais dígitos consecutivos
            /[^a-zA-Z0-9_.\-]/, // Caracteres especiais (permite . e -)
        ]

        return suspiciousPatterns.some((pattern) => pattern.test(username))
    }

    private isSuspiciousUserAgent(userAgent: string): boolean {
        // Em desenvolvimento, permitir curl e wget para testes
        const isDevelopment = process.env.NODE_ENV !== "production"

        const suspiciousPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i]

        if (!isDevelopment) {
            suspiciousPatterns.push(/curl/i, /wget/i)
        }

        return suspiciousPatterns.some((pattern) => pattern.test(userAgent))
    }

    private calculateRiskAndStatus(checks: SecurityCheck[]): {
        securityRisk: SecurityRisk
        status: SignStatus
        reason?: string
    } {
        if (checks.length === 0) {
            return {
                securityRisk: SecurityRisk.LOW,
                status: SignStatus.APPROVED,
            }
        }

        const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0)
        const highRiskChecks = checks.filter(
            (check) => check.risk === SecurityRisk.HIGH || check.risk === SecurityRisk.CRITICAL,
        )
        const criticalChecks = checks.filter((check) => check.risk === SecurityRisk.CRITICAL)

        // Determinar nível de risco
        let securityRisk: SecurityRisk
        if (criticalChecks.length > 0 || totalWeight >= 8) {
            securityRisk = SecurityRisk.CRITICAL
        } else if (highRiskChecks.length > 0 || totalWeight >= 5) {
            securityRisk = SecurityRisk.HIGH
        } else if (totalWeight >= 2) {
            securityRisk = SecurityRisk.MEDIUM
        } else {
            securityRisk = SecurityRisk.LOW
        }

        // Determinar status
        let status: SignStatus
        let reason: string

        if (securityRisk === SecurityRisk.CRITICAL) {
            status = SignStatus.REJECTED
            reason = "Multiple critical security checks failed"
        } else if (securityRisk === SecurityRisk.HIGH) {
            status = SignStatus.SUSPICIOUS
            reason = "Suspicious activity detected - requires additional verification"
        } else if (securityRisk === SecurityRisk.MEDIUM) {
            status = SignStatus.APPROVED
            reason = "Approved with minor security alerts"
        } else {
            status = SignStatus.APPROVED
            reason = "Approved without security issues"
        }

        return { securityRisk, status, reason }
    }

    private getStatusMessage(status: SignStatus, reason?: string): string {
        switch (status) {
            case SignStatus.APPROVED:
                return reason || "Login approved successfully"
            case SignStatus.SUSPICIOUS:
                return reason || "Suspicious login - requires additional verification"
            case SignStatus.REJECTED:
                return reason || "Login rejected due to security issues"
            default:
                return "Unknown status"
        }
    }
}
