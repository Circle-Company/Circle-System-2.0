/**
 * Testes para a classe UserRanker
 */

import { RankingOptions, UserCandidate, UserRanker } from "../index"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock do logger para evitar problemas de importação
vi.mock("@/infra/logger", () => ({
    Logger: vi.fn().mockImplementation(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    })),
    LogLevel: {
        DEBUG: "debug",
        INFO: "info",
        WARN: "warn",
        ERROR: "error"
    }
}))

describe("UserRanker", () => {
    let ranker: UserRanker
    let candidatos: UserCandidate[]

    beforeEach(() => {
        ranker = new UserRanker()
        
        candidatos = [
            {
                id: "1",
                username: "joao123",
                name: "João Silva",
                verified: true,
                muted: false,
                blocked: false,
                hasProfilePicture: true,
                totalFollowers: 1500,
                distance: 5.2,
                relationWeight: 0.8,
                isYou: false,
                isPremium: true,
                followYou: true,
                youFollow: false,
                blockYou: false
            },
            {
                id: "2",
                username: "maria456",
                name: "Maria Santos",
                verified: false,
                muted: false,
                blocked: false,
                hasProfilePicture: false,
                totalFollowers: 500,
                distance: 15.8,
                relationWeight: 0.3,
                isYou: false,
                isPremium: false,
                followYou: false,
                youFollow: true,
                blockYou: false
            },
            {
                id: "3",
                username: "pedro789",
                name: "Pedro Costa",
                verified: true,
                muted: false,
                blocked: false,
                hasProfilePicture: true,
                totalFollowers: 5000,
                distance: 25.0,
                relationWeight: 0.1,
                isYou: false,
                isPremium: false,
                followYou: true,
                youFollow: true,
                blockYou: false
            },
            {
                id: "4",
                username: "ana012",
                name: "Ana Lima",
                verified: false,
                muted: true,
                blocked: false,
                hasProfilePicture: true,
                totalFollowers: 200,
                distance: 8.5,
                relationWeight: 0.6,
                isYou: false,
                isPremium: false,
                followYou: false,
                youFollow: false,
                blockYou: false
            },
            {
                id: "5",
                username: "eu_mesmo",
                name: "Eu Mesmo",
                verified: true,
                muted: false,
                blocked: false,
                hasProfilePicture: true,
                totalFollowers: 1000,
                distance: 0,
                relationWeight: 1.0,
                isYou: true, // Este deve ser filtrado
                isPremium: true,
                followYou: false,
                youFollow: false,
                blockYou: false
            }
        ]
    })

    describe("rankUsers", () => {
        it("deve ranquear usuários com configurações padrão", async () => {
            const resultado = await ranker.process(candidatos)
            
            expect(resultado).toHaveLength(3) // 5 candidatos - 1 (próprio usuário) - 1 (silenciado)
            expect(resultado[0].score).toBeGreaterThanOrEqual(resultado[1].score)
            expect(resultado[1].score).toBeGreaterThanOrEqual(resultado[2].score)
        })

        it("deve incluir breakdown quando solicitado", async () => {
            const opcoes: RankingOptions = {
                includeBreakdown: true
            }
            
            const resultado = await ranker.process(candidatos, opcoes)
            
            expect(resultado[0].breakdown).toBeDefined()
            expect(resultado[0].breakdown?.distanceScore).toBeDefined()
            expect(resultado[0].breakdown?.followersScore).toBeDefined()
            expect(resultado[0].breakdown?.verificationScore).toBeDefined()
        })

        it("deve aplicar limite quando especificado", async () => {
            const opcoes: RankingOptions = {
                limit: 2
            }
            
            const resultado = await ranker.process(candidatos, opcoes)
            
            expect(resultado).toHaveLength(2)
        })

        it("deve filtrar usuários silenciados quando penalização estiver ativa", async () => {
            const opcoes: RankingOptions = {
                factors: {
                    penalizeMuted: true
                }
            }
            
            const resultado = await ranker.process(candidatos, opcoes)
            
            // Ana (muted: true) deve ser filtrada
            expect(resultado).toHaveLength(3)
            expect(resultado.find(u => u.username === "ana012")).toBeUndefined()
        })

        it("deve não filtrar usuários silenciados quando penalização estiver desativa", async () => {
            const opcoes: RankingOptions = {
                factors: {
                    penalizeMuted: false
                }
            }
            
            const resultado = await ranker.process(candidatos, opcoes)
            
            // Ana (muted: true) deve ser incluída
            expect(resultado).toHaveLength(4)
            expect(resultado.find(u => u.username === "ana012")).toBeDefined()
        })

        it("deve filtrar por distância máxima", async () => {
            const opcoes: RankingOptions = {
                factors: {
                    maxDistance: 10
                }
            }
            
            const resultado = await ranker.process(candidatos, opcoes)
            
            // Apenas João (distance: 5.2) deve permanecer
            // Maria (15.8) e Pedro (25.0) são filtrados por distância
            // Ana é filtrada por estar silenciada
            expect(resultado).toHaveLength(1)
            expect(resultado[0].username).toBe("joao123")
            expect(resultado.find(u => u.username === "pedro789")).toBeUndefined()
            expect(resultado.find(u => u.username === "maria456")).toBeUndefined()
        })

        it("deve filtrar por número mínimo de seguidores", async () => {
            const opcoes: RankingOptions = {
                factors: {
                    minFollowers: 1000
                }
            }
            
            const resultado = await ranker.process(candidatos, opcoes)
            
            // Maria (500) e Ana (200) devem ser filtradas
            expect(resultado).toHaveLength(2)
            expect(resultado.find(u => u.username === "maria456")).toBeUndefined()
            expect(resultado.find(u => u.username === "ana012")).toBeUndefined()
        })

        it("deve priorizar usuários verificados quando boost estiver ativo", async () => {
            const opcoes: RankingOptions = {
                weights: {
                    verification: 0.5,
                    followers: 0.1,
                    distance: 0.1,
                    mutualFollow: 0.1,
                    followYou: 0.1,
                    profilePicture: 0.1
                },
                factors: {
                    boostVerified: true
                }
            }
            
            const resultado = await ranker.process(candidatos, opcoes)
            
            // João e Pedro (verified: true) devem estar no topo
            expect(resultado[0].verified).toBe(true)
            expect(resultado[1].verified).toBe(true)
        })

        it("deve priorizar seguimento mútuo quando boost estiver ativo", async () => {
            const opcoes: RankingOptions = {
                weights: {
                    mutualFollow: 0.8,
                    verification: 0.1,
                    followers: 0.1
                },
                factors: {
                    boostMutualFollow: true
                }
            }
            
            const resultado = await ranker.process(candidatos, opcoes)
            
            // Pedro (followYou: true, youFollow: true) deve estar no topo
            expect(resultado[0].username).toBe("pedro789")
        })
    })

    describe("updateDefaultWeights", () => {
        it("deve atualizar pesos padrão", () => {
            const novosPesos = {
                distance: 0.5,
                followers: 0.1
            }
            
            ranker.updateDefaultWeights(novosPesos)
            
            const config = ranker.getConfiguration()
            expect(config.weights.distance).toBe(0.5)
            expect(config.weights.followers).toBe(0.1)
        })
    })

    describe("updateDefaultFactors", () => {
        it("deve atualizar fatores padrão", () => {
            const novosFatores = {
                maxDistance: 100,
                boostVerified: false
            }
            
            ranker.updateDefaultFactors(novosFatores)
            
            const config = ranker.getConfiguration()
            expect(config.factors.maxDistance).toBe(100)
            expect(config.factors.boostVerified).toBe(false)
        })
    })

    describe("resetConfiguration", () => {
        it("deve resetar configuração para valores padrão", () => {
            // Modificar configurações
            ranker.updateDefaultWeights({ distance: 0.5 })
            ranker.updateDefaultFactors({ maxDistance: 100 })
            
            // Resetar
            ranker.resetConfiguration()
            
            const config = ranker.getConfiguration()
            expect(config.weights.distance).toBe(0.25) // Valor padrão
            expect(config.factors.maxDistance).toBe(50) // Valor padrão
        })
    })

    describe("getConfiguration", () => {
        it("deve retornar configuração atual", () => {
            const config = ranker.getConfiguration()
            
            expect(config.weights).toBeDefined()
            expect(config.factors).toBeDefined()
            expect(config.weights.distance).toBe(0.25)
            expect(config.factors.maxDistance).toBe(50)
        })
    })
})
