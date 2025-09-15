import { LogLevel, Logger } from "@/logger"

import { RecommendationContext } from "../swipe-engine/types"

/**
 * Interface para representar um usuário candidato para ranqueamento
 */
export interface UserCandidate {
    id: string
    username: string
    name: string
    verified: boolean
    muted: boolean
    blocked: boolean
    hasProfilePicture: boolean
    totalFollowers: number
    distance?: number
    relationWeight?: number
    isYou: boolean
    isPremium: boolean
    followYou: boolean
    youFollow: boolean
    blockYou: boolean
    profilePicture?: string
    statistics?: {
        total_followers_num: number
    }
}

/**
 * Interface para configuração de pesos do algoritmo de ranqueamento
 */
export interface RankingWeights {
    distance: number
    followers: number
    verification: number
    profilePicture: number
    relationWeight: number
    premium: number
    mutualFollow: number
    followYou: number
    youFollow: number
    blockYou: number
}

/**
 * Interface para fatores de personalização do ranqueamento
 */
export interface RankingFactors {
    maxDistance: number
    minFollowers: number
    maxFollowers: number
    boostVerified: boolean
    boostPremium: boolean
    penalizeBlocked: boolean
    penalizeMuted: boolean
    boostMutualFollow: boolean
    boostFollowYou: boolean
    penalizeYouFollow: boolean
}

/**
 * Interface para resultado do ranqueamento
 */
export interface RankedUser extends UserCandidate {
    score: number
    breakdown?: {
        distanceScore: number
        followersScore: number
        verificationScore: number
        profilePictureScore: number
        relationScore: number
        premiumScore: number
        mutualFollowScore: number
        followYouScore: number
        youFollowScore: number
        blockYouScore: number
    }
}

/**
 * Interface para opções de ranqueamento
 */
export interface RankingOptions {
    weights?: Partial<RankingWeights>
    factors?: Partial<RankingFactors>
    context?: RecommendationContext
    limit?: number
    includeBreakdown?: boolean
}

/**
 * Classe principal para ranqueamento de usuários com personalização
 */
export class UserRanker {
    private readonly logger = new Logger("UserRanker", {
        minLevel: LogLevel.INFO,
        showTimestamp: true,
        showComponent: true,
        enabled: process.env.NODE_ENV !== "production",
    })

    // Pesos padrão para o algoritmo de ranqueamento
    private readonly defaultWeights: RankingWeights = {
        distance: 0.25,
        followers: 0.2,
        verification: 0.15,
        profilePicture: 0.1,
        relationWeight: 0.15,
        premium: 0.05,
        mutualFollow: 0.2,
        followYou: 0.1,
        youFollow: 0.05,
        blockYou: -0.5,
    }

    // Fatores padrão para personalização
    private readonly defaultFactors: RankingFactors = {
        maxDistance: 50, // km
        minFollowers: 0,
        maxFollowers: 1000000,
        boostVerified: true,
        boostPremium: true,
        penalizeBlocked: true,
        penalizeMuted: true,
        boostMutualFollow: true,
        boostFollowYou: true,
        penalizeYouFollow: false,
    }

    constructor() {
        this.logger.info("UserRanker initialized with default configuration")
    }

    /**
     * Ranqueia uma lista de usuários candidatos
     */
    public async process(
        candidates: UserCandidate[],
        options: RankingOptions = {},
    ): Promise<RankedUser[]> {
        try {
            this.logger.info(`Ranqueando ${candidates.length} usuários candidatos`)

            // Mesclar configurações com padrões
            const weights = { ...this.defaultWeights, ...options.weights }
            const factors = { ...this.defaultFactors, ...options.factors }

            // Filtrar candidatos inválidos
            const validCandidates = this.filterValidCandidates(candidates, factors)

            // Calcular scores para cada candidato
            const rankedUsers = validCandidates.map((candidate) =>
                this.calculateUserScore(candidate, weights, factors, options.includeBreakdown),
            )

            // Ordenar por score (decrescente)
            rankedUsers.sort((a, b) => b.score - a.score)

            // Aplicar limite se especificado
            const result = options.limit ? rankedUsers.slice(0, options.limit) : rankedUsers

            this.logger.info(`Ranqueamento concluído. ${result.length} usuários retornados`)
            return result
        } catch (error) {
            this.logger.error("Erro durante o ranqueamento de usuários:", error)
            throw error
        }
    }

    /**
     * Filtra candidatos válidos baseado nos fatores de personalização
     */
    private filterValidCandidates(
        candidates: UserCandidate[],
        factors: RankingFactors,
    ): UserCandidate[] {
        return candidates.filter((candidate) => {
            // Não incluir o próprio usuário
            if (candidate.isYou) return false

            // Filtrar usuários bloqueados se penalização estiver ativa
            if (factors.penalizeBlocked && candidate.blocked) return false

            // Filtrar usuários bloqueados por você
            if (candidate.blockYou) return false

            // Filtrar usuários silenciados se penalização estiver ativa
            if (factors.penalizeMuted && candidate.muted) return false

            // Filtrar por distância máxima
            if (candidate.distance && candidate.distance > factors.maxDistance) return false

            // Filtrar por número de seguidores
            if (
                candidate.totalFollowers < factors.minFollowers ||
                candidate.totalFollowers > factors.maxFollowers
            )
                return false

            return true
        })
    }

    /**
     * Calcula o score de um usuário candidato
     */
    private calculateUserScore(
        candidate: UserCandidate,
        weights: RankingWeights,
        factors: RankingFactors,
        includeBreakdown: boolean = false,
    ): RankedUser {
        // Calcular scores individuais
        const distanceScore = this.calculateDistanceScore(
            candidate.distance || 0,
            factors.maxDistance,
        )
        const followersScore = this.calculateFollowersScore(candidate.totalFollowers, factors)
        const verificationScore = this.calculateVerificationScore(
            candidate.verified,
            factors.boostVerified,
        )
        const profilePictureScore = this.calculateProfilePictureScore(candidate.hasProfilePicture)
        const relationScore = this.calculateRelationScore(candidate.relationWeight || 0)
        const premiumScore = this.calculatePremiumScore(candidate.isPremium, factors.boostPremium)
        const mutualFollowScore = this.calculateMutualFollowScore(
            candidate.followYou && candidate.youFollow,
            factors.boostMutualFollow,
        )
        const followYouScore = this.calculateFollowYouScore(
            candidate.followYou,
            factors.boostFollowYou,
        )
        const youFollowScore = this.calculateYouFollowScore(
            candidate.youFollow,
            factors.penalizeYouFollow,
        )
        const blockYouScore = this.calculateBlockYouScore(candidate.blockYou)

        // Calcular score final ponderado
        const finalScore =
            distanceScore * weights.distance +
            followersScore * weights.followers +
            verificationScore * weights.verification +
            profilePictureScore * weights.profilePicture +
            relationScore * weights.relationWeight +
            premiumScore * weights.premium +
            mutualFollowScore * weights.mutualFollow +
            followYouScore * weights.followYou +
            youFollowScore * weights.youFollow +
            blockYouScore * weights.blockYou

        const result: RankedUser = {
            ...candidate,
            score: Math.max(0, finalScore), // Garantir score não negativo
        }

        if (includeBreakdown) {
            result.breakdown = {
                distanceScore,
                followersScore,
                verificationScore,
                profilePictureScore,
                relationScore,
                premiumScore,
                mutualFollowScore,
                followYouScore,
                youFollowScore,
                blockYouScore,
            }
        }

        return result
    }

    /**
     * Calcula score baseado na distância (quanto menor, melhor)
     */
    private calculateDistanceScore(distance: number, maxDistance: number): number {
        if (distance === 0) return 1.0 // Mesmo usuário ou distância desconhecida
        if (distance > maxDistance) return 0.0

        // Função exponencial decrescente
        return Math.exp(-distance / (maxDistance / 3))
    }

    /**
     * Calcula score baseado no número de seguidores
     */
    private calculateFollowersScore(followers: number, factors: RankingFactors): number {
        // Normalizar usando função sigmóide
        const normalized = followers / (factors.maxFollowers / 10)
        return 1 / (1 + Math.exp(-normalized + 2))
    }

    /**
     * Calcula score para verificação
     */
    private calculateVerificationScore(verified: boolean, boostVerified: boolean): number {
        return verified && boostVerified ? 1.0 : 0.5
    }

    /**
     * Calcula score para foto de perfil
     */
    private calculateProfilePictureScore(hasProfilePicture: boolean): number {
        return hasProfilePicture ? 1.0 : 0.3
    }

    /**
     * Calcula score baseado no peso da relação
     */
    private calculateRelationScore(relationWeight: number): number {
        // Normalizar peso da relação (assumindo escala 0-1)
        return Math.min(1.0, Math.max(0.0, relationWeight))
    }

    /**
     * Calcula score para usuários premium
     */
    private calculatePremiumScore(isPremium: boolean, boostPremium: boolean): number {
        return isPremium && boostPremium ? 1.0 : 0.5
    }

    /**
     * Calcula score para seguimento mútuo
     */
    private calculateMutualFollowScore(
        isMutualFollow: boolean,
        boostMutualFollow: boolean,
    ): number {
        return isMutualFollow && boostMutualFollow ? 1.0 : 0.0
    }

    /**
     * Calcula score para usuários que te seguem
     */
    private calculateFollowYouScore(followYou: boolean, boostFollowYou: boolean): number {
        return followYou && boostFollowYou ? 0.8 : 0.0
    }

    /**
     * Calcula score para usuários que você segue
     */
    private calculateYouFollowScore(youFollow: boolean, penalizeYouFollow: boolean): number {
        return youFollow && penalizeYouFollow ? -0.3 : 0.0
    }

    /**
     * Calcula score para usuários que te bloqueiam
     */
    private calculateBlockYouScore(blockYou: boolean): number {
        return blockYou ? -1.0 : 0.0
    }

    /**
     * Atualiza os pesos padrão do algoritmo
     */
    public updateDefaultWeights(newWeights: Partial<RankingWeights>): void {
        Object.assign(this.defaultWeights, newWeights)
        this.logger.info("Pesos padrão atualizados", { newWeights })
    }

    /**
     * Atualiza os fatores padrão do algoritmo
     */
    public updateDefaultFactors(newFactors: Partial<RankingFactors>): void {
        Object.assign(this.defaultFactors, newFactors)
        this.logger.info("Fatores padrão atualizados", { newFactors })
    }

    /**
     * Retorna a configuração atual do ranqueador
     */
    public getConfiguration(): { weights: RankingWeights; factors: RankingFactors } {
        return {
            weights: { ...this.defaultWeights },
            factors: { ...this.defaultFactors },
        }
    }

    /**
     * Reseta a configuração para os valores padrão
     */
    public resetConfiguration(): void {
        Object.assign(this.defaultWeights, {
            distance: 0.25,
            followers: 0.2,
            verification: 0.15,
            profilePicture: 0.1,
            relationWeight: 0.15,
            premium: 0.05,
            mutualFollow: 0.2,
            followYou: 0.1,
            youFollow: 0.05,
            blockYou: -0.5,
        })

        Object.assign(this.defaultFactors, {
            maxDistance: 50,
            minFollowers: 0,
            maxFollowers: 1000000,
            boostVerified: true,
            boostPremium: true,
            penalizeBlocked: true,
            penalizeMuted: true,
            boostMutualFollow: true,
            boostFollowYou: true,
            penalizeYouFollow: false,
        })

        this.logger.info("Configuração resetada para valores padrão")
    }
}
