import { JwtDecodeResult, JwtEncoderParams, JwtTokenInfo } from "./types"
import { decodeTokenPayload, isTokenValid, jwtDecoder } from "./decode"

import { jwtEncoder } from "./encode"

/**
 * Classe JWT que encapsula todas as operações de encode e decode
 *
 * @example
 * ```typescript
 * const jwt = new Jwt()
 *
 * // Gerar token
 * const token = await jwt.encode({
 *   userId: "user-123",
 *   username: "testuser",
 *   timezone: "America/Sao_Paulo",
 *   permissionLevel: Level.USER
 * })
 *
 * // Decodificar token
 * const result = await jwt.decode(token)
 * if (result.isValid) {
 *   console.log("User:", result.payload.username)
 *   console.log("Permission:", result.payload.permissionLevel)
 * }
 * ```
 */
export class Jwt {
    /**
     * Gera um token JWT com os parâmetros fornecidos
     *
     * @param params - Parâmetros para geração do token
     * @returns Promise<string> - Token JWT assinado
     *
     * @throws {ValidationError} - Quando usuário não encontrado ou configuração inválida
     * @throws {NotFoundError} - Quando usuário não existe
     */
    async encode(params: JwtEncoderParams): Promise<string> {
        return jwtEncoder(params)
    }

    /**
     * Decodifica e valida um token JWT
     *
     * @param token - Token JWT para decodificar
     * @returns Promise<JwtDecodeResult> - Resultado da decodificação
     *
     * @throws {ValidationError} - Quando configuração JWT está incompleta
     */
    async decode(token: string): Promise<JwtDecodeResult> {
        return jwtDecoder(token)
    }

    /**
     * Verifica se um token é válido sem decodificar completamente
     *
     * @param token - Token JWT para verificar
     * @returns Promise<boolean> - true se o token for válido
     */
    async isValid(token: string): Promise<boolean> {
        return isTokenValid(token)
    }

    /**
     * Extrai apenas o payload do token sem validação completa
     * Útil para casos onde você quer apenas ler os dados sem verificar a assinatura
     *
     * @param token - Token JWT para decodificar
     * @returns Payload decodificado ou null se inválido
     */
    decodePayload(token: string): JwtDecodeResult["payload"] | null {
        const payload = decodeTokenPayload(token)
        return payload
    }

    /**
     * Verifica se um token está expirado (sem validação completa)
     *
     * @param token - Token JWT para verificar
     * @returns true se o token estiver expirado
     */
    isExpired(token: string): boolean {
        const payload = decodeTokenPayload(token)
        if (!payload || !payload.exp) {
            return true
        }

        const now = Math.floor(Date.now() / 1000)
        return payload.exp < now
    }

    /**
     * Obtém o tempo restante até a expiração do token em segundos
     *
     * @param token - Token JWT para verificar
     * @returns Tempo restante em segundos ou 0 se expirado/inválido
     */
    getTimeUntilExpiration(token: string): number {
        const payload = decodeTokenPayload(token)
        if (!payload || !payload.exp) {
            return 0
        }

        const now = Math.floor(Date.now() / 1000)
        const timeLeft = payload.exp - now
        return Math.max(0, timeLeft)
    }

    /**
     * Verifica se um token está próximo da expiração
     *
     * @param token - Token JWT para verificar
     * @param thresholdSeconds - Limite em segundos (padrão: 300 = 5 minutos)
     * @returns true se o token estiver próximo da expiração
     */
    isNearExpiration(token: string, thresholdSeconds: number = 300): boolean {
        const timeLeft = this.getTimeUntilExpiration(token)
        return timeLeft > 0 && timeLeft <= thresholdSeconds
    }

    /**
     * Extrai informações básicas do token sem validação completa
     *
     * @param token - Token JWT para analisar
     * @returns Informações básicas do token
     */
    getTokenInfo(token: string): JwtTokenInfo {
        const payload = decodeTokenPayload(token)

        if (!payload) {
            return {
                userId: null,
                username: null,
                timezone: null,
                permissionLevel: null,
                issuedAt: null,
                expiresAt: null,
                isExpired: true,
                timeUntilExpiration: 0,
            }
        }

        const now = Math.floor(Date.now() / 1000)
        const isExpired = payload.exp ? payload.exp < now : true
        const timeUntilExpiration = payload.exp ? Math.max(0, payload.exp - now) : 0

        return {
            userId: payload.sub || null,
            username: payload.username || null,
            timezone: payload.timezone || null,
            permissionLevel: payload.permissionLevel || null,
            issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
            expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
            isExpired,
            timeUntilExpiration,
        }
    }
}

// Exportar instância padrão da classe Jwt
export const jwt = new Jwt()

// Exportar também as funções individuais para compatibilidade
export { decodeTokenPayload, isTokenValid, jwtDecoder } from "./decode"
export { jwtEncoder } from "./encode"
