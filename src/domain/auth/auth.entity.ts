import { UserProps } from "../user"

export interface AuthProps {
    user: Omit<UserProps, "password">
    token: string
    expiresIn: number
}

export class Auth {
    private readonly _user: Omit<UserProps, "password">
    private readonly _token: string
    private readonly _expiresIn: number

    constructor(props: AuthProps) {
        this._user = props.user
        this._token = props.token
        this._expiresIn = props.expiresIn

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
    }

    // Método para serialização
    public toJSON(): AuthProps {
        return {
            user: this._user,
            token: this._token,
            expiresIn: this._expiresIn,
        }
    }
}
