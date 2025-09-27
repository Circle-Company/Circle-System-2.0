import { compare, hash } from "bcryptjs"

export interface EncryptProps {
    value: string
}

export class Encrypt {
    constructor(private readonly value: string) {}

    public async hashStr(): Promise<string> {
        return hash(this.value, 10)
    }

    public async compare({
        value,
        encryptedValue,
    }: {
        value: string
        encryptedValue: string
    }): Promise<boolean> {
        return compare(value, encryptedValue)
    }
}
