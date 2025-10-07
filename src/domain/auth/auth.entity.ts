import { AuthDecision, AuthSecurityRules } from "./auth.type"

import { UserProps } from "../user"

export interface AuthProps {
    user: Omit<UserProps, "password">
    token: string
    expiresIn: number
    securityDecision?: AuthDecision
    securityRules?: AuthSecurityRules
}

export class Auth {
    private readonly _user: Omit<UserProps, "password">
    private readonly _token: string
    private readonly _expiresIn: number
    private readonly _securityDecision?: AuthDecision
    private readonly _securityRules?: AuthSecurityRules

    constructor(props: AuthProps) {
        this._user = props.user
        this._token = props.token
        this._expiresIn = props.expiresIn
        this._securityDecision = props.securityDecision
        this._securityRules = props.securityRules

        this.validate()
    }

    private validate(): void {
        if (!this._user) {
            throw new Error("User is required")
        }

        if (!this._token) {
            throw new Error("Token is required")
        }

        if (!this._expiresIn) {
            throw new Error("Expires in is required")
        }

        // Validar decisão de segurança se presente
        if (this._securityDecision && !this._securityDecision.allowed) {
            throw new Error(`Request blocked by security rules: ${this._securityDecision.reason}`)
        }
    }

    // Getters
    get user(): Omit<UserProps, "password"> {
        return this._user
    }

    get token(): string {
        return this._token
    }

    get expiresIn(): number {
        return this._expiresIn
    }

    get securityDecision(): AuthDecision | undefined {
        return this._securityDecision
    }

    get securityRules(): AuthSecurityRules | undefined {
        return this._securityRules
    }

    // Método para serialização
    public toJSON(): AuthProps {
        return {
            user: this._user,
            token: this._token,
            expiresIn: this._expiresIn,
            securityDecision: this._securityDecision,
            securityRules: this._securityRules,
        }
    }

    // Método para verificar se a autenticação é válida
    public isValid(): boolean {
        try {
            this.validate()
            return true
        } catch {
            return false
        }
    }

    // Método para obter informações de segurança
    public getSecurityInfo(): {
        riskLevel: string
        status: string
        blocked: boolean
        reason?: string
        additionalChecks?: string[]
    } {
        if (!this._securityDecision) {
            return {
                riskLevel: "unknown",
                status: "unknown",
                blocked: false,
            }
        }

        return {
            riskLevel: this._securityDecision.securityRisk,
            status: this._securityDecision.status,
            blocked: !this._securityDecision.allowed,
            reason: this._securityDecision.reason,
            additionalChecks: this._securityDecision.additionalChecks,
        }
    }
}
