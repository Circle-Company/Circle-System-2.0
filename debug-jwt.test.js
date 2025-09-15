import { describe, it } from "vitest"

import { Level } from "./src/core/access-control/types.js"
import { decodeTokenPayload } from "./src/infra/jwt/decode.js"
import { jwtEncoder } from "./src/infra/jwt/encode.js"

// Mock das variáveis de ambiente
process.env.JWT_SECRET = "test-secret-key-12345678901234567890123456789012"
process.env.JWT_ISSUER = "test-issuer"
process.env.JWT_AUDIENCE = "test-audience"
process.env.JWT_EXPIRES = "3600"

// Mock do UserModel
const mockUser = { id: "user-123" }
const mockFindByPk = async () => mockUser

describe("Debug JWT", () => {
    it("should debug JWT token generation and decoding", async () => {
        // Mock do módulo
        const originalModule = await import("./src/infra/models/user/user.model.js")
        originalModule.default.findByPk = mockFindByPk

        console.log("=== Debug JWT ===")

        // Gerar token
        const token = await jwtEncoder({
            userId: "user-123",
            username: "testuser",
            timezone: "America/Sao_Paulo",
            permissionLevel: Level.USER,
        })

        console.log("Token gerado:", token)

        // Decodificar payload
        const payload = decodeTokenPayload(token)
        console.log("Payload decodificado:", JSON.stringify(payload, null, 2))

        // Verificar permissionLevel
        console.log("permissionLevel:", payload?.permissionLevel)
        console.log("Level.USER:", Level.USER)
        console.log("São iguais?", payload?.permissionLevel === Level.USER)
        console.log("Tipo do payload.permissionLevel:", typeof payload?.permissionLevel)
        console.log("Tipo do Level.USER:", typeof Level.USER)

        // Verificar valores válidos
        const validLevels = Object.values(Level)
        console.log("Valores válidos de Level:", validLevels)
        console.log(
            "payload.permissionLevel está em validLevels?",
            validLevels.includes(payload?.permissionLevel),
        )
    })
})
