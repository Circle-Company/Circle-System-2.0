import Snowflake from "./snowflake"

export interface IDAdapter {
    generate(): string
}

/**
 * Adapter para Snowflake ID
 */
export class SnowflakeAdapter implements IDAdapter {
    private snowflake: ReturnType<typeof Snowflake>

    constructor(workerId?: number, epoch?: number) {
        this.snowflake = Snowflake({ workerId, epoch })
    }

    generate(): string {
        return this.snowflake.generate()
    }
}
