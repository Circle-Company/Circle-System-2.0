export enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
}

const LOG_COLORS = {
    [LogLevel.DEBUG]: "\x1b[90m", // Cinza
    [LogLevel.INFO]: "\x1b[36m", // Ciano
    [LogLevel.WARN]: "\x1b[33m", // Amarelo
    [LogLevel.ERROR]: "\x1b[31m", // Vermelho
    reset: "\x1b[0m", // Reset
}

interface LoggerConfig {
    minLevel: LogLevel
    showTimestamp: boolean
    showComponent: boolean
    enabled: boolean
}

export class Logger {
    private readonly component: string
    private readonly config: LoggerConfig

    constructor(component: string, config: LoggerConfig) {
        this.component = component
        this.config = config
    }

    debug(message: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, data)
    }

    info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data)
    }

    warn(message: string, data?: any): void {
        this.log(LogLevel.WARN, message, data)
    }

    error(message: string, data?: any): void {
        this.log(LogLevel.ERROR, message, data)
    }

    private log(level: LogLevel, message: string, data?: any): void {
        if (!this.shouldLog(level)) {
            return
        }

        const formattedMessage = this.formatMessage(level, message)

        switch (level) {
            case LogLevel.ERROR:
                console.error(formattedMessage)
                if (data) console.error(data)
                break
            case LogLevel.WARN:
                console.warn(formattedMessage)
                if (data) console.warn(data)
                break
            case LogLevel.INFO:
                console.info(formattedMessage)
                if (data) console.info(data)
                break
            case LogLevel.DEBUG:
            default:
                console.debug(formattedMessage)
                if (data) console.debug(data)
                break
        }
    }

    private shouldLog(level: LogLevel): boolean {
        if (!this.config.enabled) return false

        const levels = Object.values(LogLevel)
        const configLevelIndex = levels.indexOf(this.config.minLevel)
        const currentLevelIndex = levels.indexOf(level)

        return currentLevelIndex >= configLevelIndex
    }

    private formatMessage(level: LogLevel, message: string): string {
        const parts: string[] = []

        if (this.config.showTimestamp) {
            parts.push(`[${new Date().toISOString()}]`)
        }

        parts.push(`${LOG_COLORS[level]}[${level.toUpperCase()}]${LOG_COLORS.reset}`)

        if (this.config.showComponent) {
            parts.push(`[${this.component}]`)
        }

        parts.push(message)
        return parts.join(" ")
    }
}

export const logger = new Logger("Api", {
    minLevel: LogLevel.INFO,
    showTimestamp: process.env.ENABLE_CONSOLE_LOGS === "true",
    showComponent: process.env.ENABLE_CONSOLE_LOGS === "true",
    enabled: process.env.ENABLE_CONSOLE_LOGS === "true",
})
