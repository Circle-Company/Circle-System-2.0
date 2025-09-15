import SnowflakeId from "./snowflake"

export { SnowflakeId }

export default {
    SnowflakeId,
}

export function generateID() {
    return SnowflakeId().generate()
}
