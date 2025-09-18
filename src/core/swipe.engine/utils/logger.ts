/**
 * Logger utility for swipe engine
 */

export interface Logger {
    info: (message: string, data?: any) => void
    error: (message: string, data?: any) => void
    warn: (message: string, data?: any) => void
    debug: (message: string, data?: any) => void
}

class SimpleLogger implements Logger {
    constructor(private context: string) {}

    info(message: string, data?: any): void {
        console.log(`[INFO] [${this.context}] ${message}`, data ? data : "")
    }

    error(message: string, data?: any): void {
        console.error(`[ERROR] [${this.context}] ${message}`, data ? data : "")
    }

    warn(message: string, data?: any): void {
        console.warn(`[WARN] [${this.context}] ${message}`, data ? data : "")
    }

    debug(message: string, data?: any): void {
        console.debug(`[DEBUG] [${this.context}] ${message}`, data ? data : "")
    }
}

export function getLogger(context: string): Logger {
    return new SimpleLogger(context)
}
