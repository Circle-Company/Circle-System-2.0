import { afterAll, beforeAll, vi } from "vitest"

// Mock do circle-text-library para evitar problemas de inicialização
vi.mock("circle-text-library", () => ({
    CircleText: class MockCircleText {
        constructor(config?: any) {}
        validate = {
            username: (username: string) => ({
                isValid: username.length >= 4 && username.length <= 20,
                errors: [],
            }),
            name: (name: string) => ({
                isValid: name.length >= 2 && name.length <= 100,
                errors: [],
            }),
            password: (password: string) => ({
                isValid: password.length >= 6 && password.length <= 128,
                errors: [],
            }),
            description: (description: string) => ({
                isValid: description.length <= 1000,
                errors: [],
            }),
            hashtag: (hashtag: string) => ({
                isValid: hashtag.startsWith("#") && hashtag.length >= 2,
                errors: [],
            }),
        }
    },
    TextLibrary: class MockTextLibrary {
        constructor(config?: any) {}
        validate = {
            username: (username: string) => ({
                isValid: username.length >= 4 && username.length <= 20,
                errors: [],
            }),
            name: (name: string) => ({
                isValid: name.length >= 2 && name.length <= 100,
                errors: [],
            }),
            password: (password: string) => ({
                isValid: password.length >= 6 && password.length <= 128,
                errors: [],
            }),
            description: (description: string) => ({
                isValid: description.length <= 1000,
                errors: [],
            }),
            hashtag: (hashtag: string) => ({
                isValid: hashtag.startsWith("#") && hashtag.length >= 2,
                errors: [],
            }),
        }
    },
    Timezone: class MockTimezone {
        constructor(timezoneCode?: any) {}
        static getTimezoneFromOffset(offset: number) {
            if (offset === 0) return "UTC"
            if (offset === -3) return "BRT"
            return "UTC"
        }
        static getCurrentTimezone() {
            return "BRT"
        }
        getTimezoneOffset() {
            return -3
        }
        getCurrentTimezoneCode() {
            return "BRT"
        }
        UTCToLocal(date: Date) {
            return date
        }
        localToUTC(date: Date) {
            return date
        }
    },
    TimezoneCodes: {
        UTC: "UTC",
        BRT: "BRT",
        BRST: "BRST",
        EST: "EST",
        EDT: "EDT",
        CST: "CST",
        CDT: "CDT",
        MST: "MST",
        MDT: "MDT",
        PST: "PST",
        PDT: "PDT",
        AKST: "AKST",
        AKDT: "AKDT",
        HST: "HST",
    },
}))

// Configuração de ambiente para testes
beforeAll(() => {
    // Definir variáveis de ambiente para testes
    process.env.NODE_ENV = "test"
    process.env.PORT = "3000"
    process.env.RATE_LIMIT = "1000"
    process.env.RATE_LIMIT_TIME_WINDOW = "60000"
    process.env.BODY_LIMIT = "1048576"
    process.env.MAX_PARAM_LENGTH = "200"
    process.env.CONNECTION_TIMEOUT = "30000"
    process.env.KEEP_ALIVE_TIMEOUT = "5000"
    process.env.CORS_ORIGIN = "http://localhost:3000"

    process.env.DB_HOST = "localhost"
    process.env.DB_USERNAME = "test"
    process.env.DB_PASSWORD = "test"
    process.env.DB_NAME = "test_db"
    process.env.DB_SSL = "false"
    process.env.DB_TIMEOUT = "60000"
    process.env.DB_TIMEZONE = "UTC"

    process.env.JWT_SECRET = "test-secret-key-1947828731876429197"
    process.env.JWT_ISSUER = "test-issuer"
    process.env.JWT_AUDIENCE = "test-audience"
    process.env.JWT_EXPIRES = "3600"

    process.env.ENABLE_LOGGER = "true"
    process.env.LOGGER_NAME = "ACA-TEST"

    process.env.AWS_ACCESS_KEY_ID = "test"
    process.env.AWS_SECRET_ACCESS_KEY = "test"
})

afterAll(() => {
    // Limpeza após todos os testes
    console.log("Testes finalizados")
})
