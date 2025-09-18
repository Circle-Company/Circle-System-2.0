import { afterAll, beforeAll } from "vitest"

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
